/* CLAIMSTAKE bots: heuristic valuation of buildings, auctions, workers and endgame trades. */
(function (root) {
  'use strict';
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.HSDATA;
  const HS = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.HS;
  const { RES, PRICE, LADDER, BMAP, RAIL } = D;

  const LEVELS = {
    1: { name: 'Greenhorn', noise: 0.30, aggr: 0.80, vpv: 2.0, pass: 1.2, debt: 1, trade: 3 },
    2: { name: 'Homesteader', noise: 0.20, aggr: 0.85, vpv: 2.0, pass: 0.5, debt: 3, trade: 2 },
    3: { name: 'Land Baron', noise: 0.00, aggr: 0.85, vpv: 2.0, pass: 0.5, debt: 3, trade: 2 },
  };

  function W(P) {
    return { silver: 1, trade: P.trade, vp: P.vpv, wood: 1.2, food: 2, steel: 3, gold: 5, copper: 5, livestock: 5 };
  }
  function valueOut(o, w, p) {
    if (!o) return 0;
    let v = 0;
    for (const k in o) {
      if (k === 'silverPerWorker') v += Math.min(p.workers, o[k]);
      else if (k === 'debtPay') v += p.debt ? 5 * o[k] : 0.5;
      else v += (w[k] || 0) * o[k];
    }
    return v;
  }

  // greedy worker assignment; returns {assign, value}
  function bestAssign(s, p, blds, w, workers) {
    const slots = [];
    let total = 0;
    for (const b of blds) {
      const bd = BMAP[b.id];
      total += valueOut(bd.auto, w, p);
      ['s1', 's2', 'dbl'].forEach(k => {
        if (!bd[k]) return;
        const need = k === 'dbl' ? 2 : 1;
        const val = valueOut(bd[k], w, p);
        slots.push({ uid: b.uid, k, need, val, per: val / need });
      });
    }
    slots.sort((a, b) => b.per - a.per);
    let left = workers;
    const assign = {};
    for (const sl of slots) {
      if (left >= sl.need && sl.per > 0) {
        left -= sl.need;
        total += sl.val;
        assign[sl.uid] = assign[sl.uid] || {};
        assign[sl.uid][sl.k] = sl.need;
      }
    }
    return { assign, value: total, left, slots };
  }

  function roundsLeft(s) { return Math.max(1, 11 - s.round); }

  const GROW = { R: 0.25, I: 0.25, C: 0.25, S: 0.1, worker: 0.1, line: 0.12, building: 0.8 };
  function projCount(s, p, per) {
    const rl = roundsLeft(s);
    let now;
    if (per === 'worker') now = p.workers; else if (per === 'line') now = p.lines;
    else if (per === 'building') now = p.blds.length;
    else now = HS.countType(p, per, s.opts);
    return now + rl * (GROW[per] || 0.2) * (s.round >= 9 ? 0.6 : 1);
  }

  function railValue(s, p, P) {
    const pos = p.advances + 1, rl = roundsLeft(s);
    const vals = [3, 1.0 * rl, 1.5 + 0.3 * rl, 4, 3 * P.vpv * 0.9];
    const ch = HS.railChoices(s, p);
    let best = -1, kind = null;
    ch.forEach(k => {
      const i = RAIL.indexOf(k);
      let v = vals[i];
      if (k === 'trade') v = P.trade;
      if (k === 'vp3') v = 3 * P.vpv;
      if (k === 'resource') v = 4.5;
      if (k === 'worker') { v = workerValue(s, p, P); if (v < 0.5) v = -1; }
      if (v > best) { best = v; kind = k; }
    });
    return { value: Math.max(0, best), kind };
  }

  function workerValue(s, p, P) {
    const w = W(P), rl = roundsLeft(s);
    const cur = bestAssign(s, p, p.blds, w, p.workers);
    const a = bestAssign(s, p, p.blds, w, p.workers + 1).value - cur.value;
    // cash-flow stress: wages are paid in silver, which is scarce when income barely covers them
    const silverIn = HS.incomeOf(s, p, cur.assign).silver;
    const stress = silverIn - p.workers <= 1 ? 0.9 : silverIn - p.workers <= 3 ? 0.3 : 0;
    return (a - 1 - stress) * rl;
  }

  function buildingValue(s, p, id, P) {
    const bd = BMAP[id], w = W(P), rl = roundsLeft(s);
    const withB = p.blds.concat([{ uid: -1, id }]);
    const base = bestAssign(s, p, p.blds, w, p.workers).value;
    const aft = bestAssign(s, p, withB, w, p.workers).value;
    let prod = (aft - base) * rl;
    // potential future hire for unused slots
    const slotBest = ['s1', 's2', 'dbl'].map(k => bd[k] ? valueOut(bd[k], w, p) / (k === 'dbl' ? 2 : 1) : 0);
    const sb = Math.max(0, slotBest[0], slotBest[1], slotBest[2]);
    if (sb > 1.8 && rl > 2) prod += (sb - 1.2) * rl * 0.4;
    let val = prod + bd.pts * P.vpv;
    // final-scoring bonuses
    (bd.final || []).forEach(f => {
      let c = projCount(s, p, f.per);
      if (f.per === 'building') c += 1;
      if (HS.countType({ blds: [{ id }] }, f.per, s.opts) && f.per === bd.type) c += 1;
      val += c * P.vpv;
    });
    // this building raises others' per-type bonuses
    p.blds.forEach(x => {
      (BMAP[x.id].final || []).forEach(f => {
        if (f.per === bd.type || f.per === 'building') val += P.vpv;
      });
    });
    const ob = bd.onBuild || {};
    if (ob.debtPay) val += p.debt ? 5 : 0;
    if (ob.trade) val += P.trade;
    if (ob.worker) val += Math.max(-rl * 0.6, workerValue(s, p, P)) * 0.9;
    if (ob.line) val += rl;
    if (ob.rail) val += railValue(s, p, P).value;
    if (ob.extra) val += 5;
    switch (bd.special) {
      case 'forge': val += rl * 0.6 * P.vpv * 0.8; break;
      case 'tieBid': val += 3; break;
      case 'goldSub': val += 1.5; break;
      case 'convert': val += 2; break;
      case 'sellBonus': val += 3; break;
      case 'tradeSilver': val += 2; break;
    }
    return val;
  }

  function costValue(id, P) {
    const w = W(P);
    return BMAP[id].costList.reduce((a, r) => a + (w[r] || 0), 0);
  }

  function tileBonusValue(tile, s, p, P) {
    const b = tile.bonus;
    if (!b) return 0;
    let v = 0;
    if (b.worker) v += Math.max(0, workerValue(s, p, P));
    if (b.trade) v += b.trade * P.trade;
    if (b.silver) v += b.silver;
    if (b.vp) v += b.vp * P.vpv;
    if (b.debtPay) v += p.debt ? 5 : 0.5;
    if (b.rail) v += b.rail * railValue(s, p, P).value;
    if (b.resource) v += 4;
    return v;
  }

  function noisy(P, x, rng) { return x * (1 + P.noise * (rng() * 2 - 1)); }

  // evaluate (auction, bid) options
  function bestBidOption(s, p, P, rng) {
    let best = null;
    const debtRoom = Math.max(0, P.debt - p.debt);
    s.auctions.forEach(auc => {
      const legal = HS.legalBids ? HS.legalBids(s, p.id, auc.idx) : [];
      if (!legal.length) return;
      const bid = legal[0];
      let cands;
      if (auc.tile.noBuild) cands = [null]; else cands = HS.eligible(s, auc.tile);
      cands.forEach(id => {
        let val = tileBonusValue(auc.tile, s, p, P), cost = 0, tradeCost = 0;
        if (id) {
          const q = HS.quoteBuild(s, p, id);
          if (!q.ok) return;
          val += buildingValue(s, p, id, P);
          cost = costValue(id, P);
          tradeCost = q.T * P.trade * 0.6 + q.S * 0.3;
        }
        // funding: silver now, debt costs ~3.5 each
        const need = bid + (id ? HS.quoteBuild(s, p, id).S : 0);
        const short = Math.max(0, need - p.silver);
        const debts = Math.ceil(short / 2);
        let fundCost = 0;
        if (short > 0) {
          const goldUse = Math.min(p.res.gold, Math.ceil(short / 5));
          if (goldUse * 5 >= short && goldUse * 5 <= short + 2) fundCost = goldUse * 5;
          else {
            if (p.debt + debts > P.debt + 1) return;
            for (let k = 1; k <= debts; k++) fundCost += 3 + (p.debt + k) * P.vpv * 0.5;
          }
        }
        const surplus = noisy(P, val * P.aggr, rng) - cost - bid - tradeCost - fundCost;
        if (!best || surplus > best.surplus) best = { surplus, auction: auc.idx, bid, id };
      });
    });
    return best;
  }

  // ---- funding helper: make `amount` silver payable; returns plan (gold/trades) after issuing econ actions
  function fund(s, p, amount, P, extraCost) {
    const act = a => HS.apply(s, Object.assign({ p: p.id }, a));
    let need = amount + (extraCost || 0);
    // first use trades as silver if Savings House and spare trades
    let guard = 0;
    while (p.silver < need && guard++ < 30) {
      const short = need - p.silver;
      if (p.res.gold > 0 && short >= 3 && p.debt >= 1) {
        // gold covers 5 silver: pay it directly through the plan instead of converting
        break;
      }
      act({ type: 'takeDebt' });
    }
    return {};
  }

  function planPay(s, p, amount, maxGold) {
    // returns {plan} after issuing takeDebt as needed. Prefer gold when it fits snugly.
    const shortfall = Math.max(0, amount - p.silver);
    const goldCap = maxGold === undefined ? p.res.gold : Math.max(0, Math.min(p.res.gold, maxGold));
    let plan = {};
    if (shortfall > 0) {
      const g = Math.min(goldCap, Math.ceil(shortfall / 5));
      const wasteful = g * 5 - shortfall;
      if (g > 0 && wasteful <= 1) plan.gold = g;
      else if (g > 0 && p.debt >= 3) plan.gold = g;
    }
    let sil = Math.max(0, amount - 5 * (plan.gold || 0) - 0);
    let guard = 0;
    while (sil > p.silver && guard++ < 40) {
      if (HS.apply(s, { p: p.id, type: 'takeDebt' }).ok === false) { // out of chits: use gold
        plan.gold = Math.min(goldCap, (plan.gold || 0) + 1);
        sil = Math.max(0, amount - 5 * (plan.gold || 0));
        if (guard > 38) break;
      }
    }
    return plan;
  }

  // sell non-scoring goods (steel, food, wood) with spare trades to raise silver
  function sellForCash(s, p, need, keep) {
    const act = a => HS.apply(s, Object.assign({ p: p.id }, a));
    let guard = 0;
    while (p.silver < need && p.trade > 0 && guard++ < 12) {
      const r = ['steel', 'food', 'wood'].find(x => p.res[x] > (keep && keep[x] ? keep[x] : 0));
      if (!r) break;
      if (!act({ type: 'sell', res: r }).ok) break;
    }
  }
  function tidyDebt(s, p, P) {
    const act = a => HS.apply(s, Object.assign({ p: p.id }, a));
    let guard = 0;
    const reserve = p.workers + 3;
    while (p.debt > 0 && guard++ < 10) {
      const rich = p.silver >= reserve + 5 + (p.debt >= 3 ? 0 : p.debt >= 2 ? 2 : 6);
      if (!rich || s.round < 3) break;
      if (!act({ type: 'repay' }).ok) break;
    }
  }

  function railPick(s, p, P) {
    const rv = railValue(s, p, P);
    let res;
    if (rv.kind === 'resource') {
      res = ['gold', 'steel', 'food', 'wood', 'copper', 'livestock'].find(r => s.sup[r] > 0);
    }
    return { reward: rv.kind, res };
  }

  // ------------------------------------------------------------ decisions
  function decide(s, need, rng) {
    const p = s.players[need.p], P = LEVELS[p.level] || LEVELS[2];
    const act = a => HS.apply(s, Object.assign({ p: p.id }, a));
    switch (need.kind) {
      case 'assign': {
        const w = W(P);
        tidyDebt(s, p, P);
        // hire if worthwhile
        let tries = 0;
        while (tries++ < 3 && p.trade >= 1 && p.res.food >= 1 && s.sup.worker > 0 && s.round < 10 && !s.final) {
          const v = workerValue(s, p, P);
          if (v > 3 + 2 + P.trade * 0.5) act({ type: 'hire' }); else break;
        }
        const ba = bestAssign(s, p, p.blds, w, p.workers);
        act({ type: 'assign', assign: ba.assign });
        act({ type: 'ready' });
        return true;
      }
      case 'wages': {
        sellForCash(s, p, p.workers, null);
        const plan = planPay(s, p, p.workers);
        const r = act({ type: 'payWages', plan });
        if (!r.ok) throw new Error('bot wages: ' + r.err);
        return true;
      }
      case 'neutralPick': {
        let bestI = 0, bv = -1;
        s.auctions.forEach(a => { const v = a.tile.noBuild ? 1 : HS.eligible(s, a.tile).length; if (v > bv) { bv = v; bestI = a.idx; } });
        act({ type: 'neutralPick', auction: bestI });
        return true;
      }
      case 'bid': {
        const opt = bestBidOption(s, p, P, rng);
        const rv = railValue(s, p, P);
        const passVal = rv.value * P.pass;
        if (opt && opt.surplus > passVal && opt.surplus > 0) {
          const r = act({ type: 'bid', auction: opt.auction, amount: opt.bid });
          if (r.ok) return true;
        }
        const pk = railPick(s, p, P);
        const r2 = act({ type: 'pass', reward: pk.reward, res: pk.res });
        if (!r2.ok) throw new Error('bot pass: ' + r2.err);
        return true;
      }
      case 'payBid': {
        const plan = planPay(s, p, need.amount);
        const r = act({ type: 'payBid', plan });
        if (!r.ok) throw new Error('bot payBid: ' + r.err);
        return true;
      }
      case 'build': case 'extra': {
        const auc = s.auctions[need.auction];
        const ids = need.kind === 'extra' ? Object.keys(s.bsup).filter(id => s.bsup[id] > 0) : HS.eligible(s, auc.tile);
        let best = null;
        ids.forEach(id => {
          const q = HS.quoteBuild(s, p, id);
          if (!q.ok) return;
          let sc = noisy(P, buildingValue(s, p, id, P) * P.aggr, rng) - costValue(id, P) - q.T * P.trade * 0.6 - q.S * 0.3;
          if (!best || sc > best.sc) best = { sc, id, q };
        });
        if (need.kind === 'extra') {
          if (!best || best.sc < 1) { act({ type: 'skipExtra' }); return true; }
        }
        if (!best) throw new Error('bot build: nothing');
        const extraBid = need.kind === 'extra' && s.opts.trainExtra === 'bid' ? need.bid : 0;
        const goldFree = p.res.gold + best.q.buy.gold - best.q.need.gold - best.q.goldCL;
        const plan = planPay(s, p, best.q.S + extraBid, goldFree);
        const r = act({ type: 'build', id: best.id, plan });
        if (!r.ok) {
          if (need.kind === 'extra') { act({ type: 'skipExtra' }); return true; }
          throw new Error('bot build fail: ' + r.err + ' ' + best.id);
        }
        return true;
      }
      case 'rail': {
        const pk = railPick(s, p, P);
        const r = act({ type: 'railReward', reward: pk.reward, res: pk.res });
        if (!r.ok) throw new Error('bot rail: ' + r.err);
        return true;
      }
      case 'pickRes': {
        const res = ['gold', 'steel', 'food', 'wood'].find(r => s.sup[r] > 0) || RES.find(r => s.sup[r] > 0);
        act({ type: 'pickRes', res });
        return true;
      }
      case 'finalTrade': { finalTrade(s, p); act({ type: 'finalDone' }); return true; }
    }
    return false;
  }

  function finalTrade(s, p) {
    const act = a => HS.apply(s, Object.assign({ p: p.id }, a));
    const marginal = () => p.debt; // VP saved by repaying one more debt
    // repay while efficient
    const repay = () => {
      let guard = 0;
      while (p.debt > 0 && guard++ < 20) {
        if (p.silver >= 5) { if (!act({ type: 'repay' }).ok) break; }
        else break;
      }
    };
    // 1. heavy debt: repay first (>=3 marginal)
    let guard = 0;
    while (p.debt >= 3 && p.silver >= 5 && guard++ < 20) act({ type: 'repay' });
    // 2. sell non-scoring goods (best silver first)
    ['steel', 'food', 'wood'].forEach(r => {
      while (p.trade > 0 && p.res[r] > 0) { if (!act({ type: 'sell', res: r }).ok) break; }
    });
    // 3. heavy debt again after proceeds
    guard = 0;
    while (p.debt >= 3 && p.silver >= 5 && guard++ < 20) act({ type: 'repay' });
    // 3b. gold to clear very heavy debt (>=3 marginal beats 2 VP)
    guard = 0;
    while (p.debt >= 3 && p.res.gold > 0 && guard++ < 20) act({ type: 'repay', plan: { gold: 1 } });
    // 4. convert silver to 2VP resources with spare trades (gold costs 4)
    guard = 0;
    while (p.trade > 0 && p.silver >= 4 + (p.debt > 0 ? 0 : 0) && s.sup.gold > 0 && guard++ < 30) {
      // keep enough silver to repay a 2+ debt if that is better: 5 silver for >=2 VP
      if (p.debt >= 2 && p.silver < 9) break;
      if (!act({ type: 'buy', res: 'gold' }).ok) break;
    }
    repay();
    // 5. last trades: sell leftover goods
    ['steel', 'food', 'wood'].forEach(r => { while (p.trade > 0 && p.res[r] > 0) { if (!act({ type: 'sell', res: r }).ok) break; } });
    repay();
  }

  // ------------------------------------------------------------ driver
  function makeRng(seed) {
    let a = HS.hashSeed('bots' + seed);
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // run every pending bot decision until a human must act (or game over)
  function runBots(s, rng, maxSteps) {
    rng = rng || makeRng(s.seed + ':' + s.round);
    let n = 0, limit = maxSteps || 5000;
    while (!s.over && n++ < limit) {
      const needs = HS.needs(s);
      const botNeed = needs.find(x => s.players[x.p].kind === 'bot');
      if (!botNeed) return false;
      decide(s, botNeed, rng);
    }
    return true;
  }

  function advise(s, pid, auctionIdx, level) {
    const p = s.players[pid], P = LEVELS[level || 2];
    const auc = s.auctions[auctionIdx];
    if (!auc) return null;
    let best = null;
    const cands = auc.tile.noBuild ? [null] : HS.eligible(s, auc.tile);
    cands.forEach(id => {
      let val = tileBonusValue(auc.tile, s, p, P);
      let cost = 0;
      if (id) {
        const q = HS.quoteBuild(s, p, id);
        if (!q.ok) return;
        val += buildingValue(s, p, id, P);
        cost = costValue(id, P) + q.T * P.trade * 0.6 + q.S * 0.3;
      }
      const net = val - cost;
      if (!best || net > best.net) best = { net, id, worth: Math.round(net) };
    });
    return best;
  }

  const api = { LEVELS, runBots, decide, makeRng, advise, buildingValue, bestAssign, W, workerValue, railValue, valueOut,
    roundsLeft };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HSBOTS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
