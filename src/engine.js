/* CLAIMSTAKE rules engine. Pure, deterministic, JSON-serialisable state.
   HS.newGame(cfg) -> state ; HS.apply(state, action) -> {ok, err} ; HS.needs(state) -> who must act. */
(function (root) {
  'use strict';
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.HSDATA;
  const { RES, PRICE, LADDER, SUPPLY, RAIL, BUILDINGS, BMAP } = D;

  // ------------------------------------------------------------ rng
  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    str = String(str);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function rnd(s) {
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    let t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function shuffle(s, a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  const clone = o => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------ setup
  function defaultOpts() {
    const o = {};
    D.OPTION_DEFS.forEach(d => { o[d.key] = d.def; });
    return o;
  }

  function newGame(cfg) {
    cfg = cfg || {};
    const names = cfg.players || [{ name: 'You', kind: 'human' }, { name: 'Bot', kind: 'bot', level: 2 }];
    const n = names.length;
    if (n < 2 || n > 4) throw new Error('2-4 players');
    const opts = Object.assign(defaultOpts(), cfg.opts || {});
    const s = {
      v: 1, seed: String(cfg.seed != null ? cfg.seed : Date.now()), opts, n, round: 0, phase: 'setup', final: false,
      rng: 0, uidn: 1, players: [], sup: clone(SUPPLY), bsup: {}, reserve: { B: {}, C: {} },
      a1: [], p2: [], p3: [], auctions: [], startPlayer: 0, bidTurn: -1, neutral: 2, neutralOn: false,
      steps: [], wageQueue: [], ready: [], done: [], events: [], log: [], wonCount: [], over: false, result: null,
    };
    s.rng = hashSeed(s.seed);
    if (!opts.limitedSupply) RES.forEach(r => { s.sup[r] = 999; });
    names.forEach((pl, i) => s.players.push({
      id: i, name: pl.name, kind: pl.kind || 'bot', level: pl.level || 2,
      silver: 6, res: { wood: 0, food: 0, steel: 0, gold: 0, copper: 0, livestock: 0 }, trade: 0, workers: 1, debt: 0,
      lines: 0, rail: 0, vp: 0, blds: [], assign: {}, lastAssign: {}, passed: false, hasBid: false, advances: 0,
    }));
    s.sup.worker -= n;
    s.players.forEach(p => { addBuilding(s, p, 'cabin', true); });
    // building supply
    const copies = id => {
      const bd = BMAP[id];
      if (n === 2 || (n === 3 && opts.supply3p === 'trim')) return (id === 'wheatfield' || id === 'bazaar' || id === 'smelter') ? 2 : 1;
      return bd.n;
    };
    BUILDINGS.forEach(bd => {
      if (bd.id === 'cabin') return;
      const c = copies(bd.id);
      if (bd.era === 'A' || bd.era === 'A/B') s.bsup[bd.id] = c;
      else if (bd.era === 'B') s.reserve.B[bd.id] = c;
      else s.reserve.C[bd.id] = c;
    });
    // tiles
    const plain = opts.tiles === 'plain';
    const prep = t => plain ? D.TILES_PLAIN.strip(t) : Object.assign({}, t);
    s.a1 = D.TILES_A1.map(prep);
    const pile = P => ['A', 'B', 'C'].reduce((acc, k) => acc.concat(shuffle(s, P[k].map(prep))), []);
    s.p2 = pile(D.TILES_P2);
    s.p3 = n === 4 ? pile(D.TILES_P3) : [];
    s.startPlayer = Math.floor(rnd(s) * n);
    s.ready = s.players.map(() => false);
    s.wonCount = s.players.map(() => 0);
    log(s, `Claimstake begins with ${n} players. ${s.players[s.startPlayer].name} holds the start marker.`);
    startRound(s);
    return s;
  }

  function addBuilding(s, p, id, noAnvil) {
    if (!noAnvil && p.blds.some(b => b.id === 'anvil')) { p.vp += 1; ev(s, 'vp', p.id, 1, 'Anvil Works'); }
    p.blds.push({ uid: s.uidn++, id });
  }

  function log(s, msg) { s.log.push(msg); if (s.log.length > 400) s.log.shift(); }
  function ev(s, t, p, v, extra) { s.events.push({ t, p, v, x: extra || null, r: s.round }); }

  // ------------------------------------------------------------ pools
  function gainRes(s, p, r, q) { const t = Math.min(q, s.sup[r]); p.res[r] += t; s.sup[r] -= t; return t; }
  function giveRes(s, p, r, q) { p.res[r] -= q; s.sup[r] += q; }
  function gainTrade(s, p, q) { const t = Math.min(q, s.sup.trade); p.trade += t; s.sup.trade -= t; return t; }
  function spendTrade(s, p, q) { p.trade -= q; s.sup.trade += q; }
  function has(p, id) { return p.blds.some(b => b.id === id); }
  function stage(round) { return round <= 4 ? 'A' : round <= 8 ? 'B' : 'C'; }

  // ------------------------------------------------------------ rounds
  function startRound(s) {
    s.round += 1;
    if (s.round > 10) throw new Error('round overflow');
    if (s.round === 5) {
      Object.keys(s.bsup).forEach(id => { if (BMAP[id].era === 'A') delete s.bsup[id]; });
      Object.keys(s.reserve.B).forEach(id => { s.bsup[id] = s.reserve.B[id]; });
      s.reserve.B = {};
      log(s, 'The town grows: Settlement-only lots are cleared and Town buildings appear.');
      ev(s, 'stage', -1, 'B');
    }
    if (s.round === 9) {
      s.bsup = {};
      Object.keys(s.reserve.C).forEach(id => { s.bsup[id] = s.reserve.C[id]; });
      s.reserve.C = {};
      log(s, 'City stage: all unbuilt lots are cleared and City buildings appear.');
      ev(s, 'stage', -1, 'C');
    }
    const r = s.round - 1;
    s.auctions = [{ idx: 0, tile: s.a1[r], bid: 0, holder: null }, { idx: 1, tile: s.p2[r], bid: 0, holder: null }];
    if (s.n === 4) s.auctions.push({ idx: 2, tile: s.p3[r], bid: 0, holder: null });
    s.players.forEach(p => { p.passed = false; p.hasBid = false; });
    s.ready = s.players.map(() => false);
    s.phase = 'assign';
    s.bidTurn = -1;
    ev(s, 'round', -1, s.round);
    log(s, `Round ${s.round} (${stage(s.round) === 'A' ? 'Settlement' : stage(s.round) === 'B' ? 'Town' : 'City'}).`);
  }

  // ------------------------------------------------------------ queries
  function eligible(s, tile, anyType) {
    return Object.keys(s.bsup).filter(id => s.bsup[id] > 0 && (anyType || tile.types.includes(BMAP[id].type)));
  }

  function slotsOf(bd) {
    const out = [];
    if (bd.s1) out.push('s1'); if (bd.s2) out.push('s2'); if (bd.dbl) out.push('dbl');
    return out;
  }
  function slotCap(k) { return k === 'dbl' ? 2 : 1; }

  function validAssign(p, assign) {
    let tot = 0;
    for (const uid of Object.keys(assign)) {
      const b = p.blds.find(x => String(x.uid) === String(uid));
      if (!b) return 'unknown building';
      const bd = BMAP[b.id], a = assign[uid];
      for (const k of ['s1', 's2', 'dbl']) {
        const v = a[k] || 0;
        if (v < 0 || v > slotCap(k) || !Number.isInteger(v)) return 'bad slot value';
        if (v && !bd[k]) return 'no such slot';
        tot += v;
      }
    }
    if (tot > p.workers) return 'more workers than you have';
    return null;
  }

  function outputOf(def) { return def || {}; }

  // gains this player would collect with an assignment
  function incomeOf(s, p, assign) {
    const g = { silver: 0, trade: 0, vp: 0, debtPay: 0, wood: 0, food: 0, steel: 0, gold: 0, copper: 0, livestock: 0 };
    const add = o => { if (!o) return; for (const k in o) { if (k === 'silverPerWorker') g.silver += Math.min(p.workers, o[k]); else g[k] = (g[k] || 0) + o[k]; } };
    for (const b of p.blds) {
      const bd = BMAP[b.id], a = assign[b.uid] || {};
      add(bd.auto);
      if (a.s1) add(bd.s1);
      if (a.s2) add(bd.s2);
      if (a.dbl >= 2) add(bd.dbl);
    }
    g.silver += p.lines;
    return g;
  }

  function collectAll(s) {
    for (let k = 0; k < s.n; k++) {
      const p = s.players[(s.startPlayer + k) % s.n];
      const g = incomeOf(s, p, p.assign);
      p.silver += g.silver;
      p.vp += g.vp;
      const got = {};
      if (g.trade) got.trade = gainTrade(s, p, g.trade);
      RES.forEach(r => { if (g[r]) got[r] = gainRes(s, p, r, g[r]); });
      if (g.debtPay && p.debt) { const d = Math.min(p.debt, g.debtPay); p.debt -= d; s.sup.debt += d; got.debtPay = d; }
      got.silver = g.silver; got.vp = g.vp;
      ev(s, 'income', p.id, got);
      p.lastAssign = JSON.parse(JSON.stringify(p.assign));
    }
    s.phase = 'wages';
    s.wageQueue = [];
    for (let k = 0; k < s.n; k++) s.wageQueue.push((s.startPlayer + k) % s.n);
    log(s, 'Income collected.');
  }

  // ------------------------------------------------------------ payments
  function payCheck(s, p, amount, plan) {
    plan = plan || {};
    const g = plan.gold | 0, t = plan.trades | 0;
    if (g < 0 || t < 0) return 'bad plan';
    if (g > p.res.gold) return 'not enough gold';
    if (t && !has(p, 'savings')) return 'trades can only pay silver with a Savings House';
    if (t > p.trade) return 'not enough trade tokens';
    const sil = Math.max(0, amount - 5 * g - t);
    if (sil > p.silver) return 'not enough silver';
    return null;
  }
  function payDo(s, p, amount, plan) {
    plan = plan || {};
    const g = plan.gold | 0, t = plan.trades | 0;
    const sil = Math.max(0, amount - 5 * g - t);
    p.silver -= sil;
    if (g) giveRes(s, p, 'gold', g);
    if (t) spendTrade(s, p, t);
  }
  // minimal "shortfall" figure the UI uses
  function shortfall(s, p, amount, plan) {
    plan = plan || {};
    const g = plan.gold | 0, t = plan.trades | 0;
    return Math.max(0, amount - 5 * g - t - p.silver);
  }

  // ------------------------------------------------------------ build quoting
  function quoteBuild(s, p, id, opts) {
    opts = opts || {};
    const bd = BMAP[id];
    const need = { wood: 0, food: 0, steel: 0, gold: 0, copper: 0, livestock: 0 };
    bd.costList.forEach(r => { need[r]++; });
    const landing = has(p, 'landing');
    const q = { id, ok: true, why: '', T: 0, S: 0, buy: { wood: 0, food: 0, steel: 0, gold: 0 }, clBuy: { copper: 0, livestock: 0 },
      goldCL: 0, landingPaid: { copper: 0, livestock: 0 }, need, goldLeft: 0 };
    const stock = Object.assign({}, p.res);
    const miss = {};
    RES.forEach(r => { miss[r] = Math.max(0, need[r] - stock[r]); stock[r] = Math.max(0, stock[r] - need[r]); });
    ['wood', 'food', 'steel'].forEach(r => { q.buy[r] = miss[r]; });
    q.buy.gold = miss.gold;
    const cl = miss.copper + miss.livestock;
    let goldAvail = stock.gold;
    const fromStock = Math.min(cl, goldAvail);
    const extraBuy = cl - fromStock;
    q.buy.gold += extraBuy;
    q.goldCL = cl;
    ['copper', 'livestock'].forEach(r => {
      if (miss[r]) { if (landing) q.landingPaid[r] = miss[r]; else q.clBuy[r] = miss[r]; }
    });
    q.T = q.buy.wood + q.buy.food + q.buy.steel + q.buy.gold + (landing ? 0 : cl);
    q.S = q.buy.wood * PRICE.wood + q.buy.food * PRICE.food + q.buy.steel * PRICE.steel + q.buy.gold * PRICE.gold;
    q.goldLeft = goldAvail + q.buy.gold - q.goldCL - 0; // gold left after everything (stock after cost already excluded)
    q.goldLeft = stock.gold + q.buy.gold - q.goldCL;
    const sd = { wood: q.buy.wood, food: q.buy.food, steel: q.buy.steel, gold: q.buy.gold };
    for (const r in sd) if (sd[r] > s.sup[r]) { q.ok = false; q.why = 'not enough ' + r + ' in the supply'; }
    if (!landing) for (const r of ['copper', 'livestock']) if (q.clBuy[r] > s.sup[r]) { q.ok = false; q.why = 'not enough ' + r + ' in the supply'; }
    if (q.T > p.trade) { q.ok = false; q.why = `needs ${q.T} trade token${q.T > 1 ? 's' : ''}`; }
    return q;
  }

  function buildDo(s, p, id, plan) {
    const q = quoteBuild(s, p, id);
    const bd = BMAP[id];
    // buy phase
    ['wood', 'food', 'steel', 'gold'].forEach(r => { if (q.buy[r]) { spendTrade(s, p, q.buy[r]); gainRes(s, p, r, q.buy[r]); } });
    ['copper', 'livestock'].forEach(r => {
      const m = q.clBuy[r];
      if (m) { spendTrade(s, p, m); giveRes(s, p, 'gold', m); gainRes(s, p, r, m); }
      const lp = q.landingPaid[r];
      if (lp) giveRes(s, p, 'gold', lp);
    });
    // spend cost
    RES.forEach(r => {
      let c = q.need[r] - (q.landingPaid[r] || 0);
      if (c) giveRes(s, p, r, c);
    });
    // silver for the purchases (gold bought for costs was consumed above only if it was a cost; compute payment)
    return q;
  }

  // ------------------------------------------------------------ actions
  function currentActors(s) { return needs(s).map(x => x.p); }

  function needs(s) {
    if (s.over) return [];
    switch (s.phase) {
      case 'assign': return s.players.filter(p => !s.ready[p.id]).map(p => ({ p: p.id, kind: 'assign' }));
      case 'wages': return s.wageQueue.length ? [{ p: s.wageQueue[0], kind: 'wages', amount: s.players[s.wageQueue[0]].workers }] : [];
      case 'neutralPick': return [{ p: s.startPlayer, kind: 'neutralPick' }];
      case 'bid': return s.bidTurn >= 0 ? [{ p: s.bidTurn, kind: 'bid' }] : [];
      case 'resolve': return s.steps.length ? [Object.assign({ p: s.steps[0].p, kind: s.steps[0].k }, s.steps[0])] : [];
      case 'finalTrade': return s.players.filter(p => !s.done[p.id]).map(p => ({ p: p.id, kind: 'finalTrade' }));
      default: return [];
    }
  }

  function canEcon(s, pid) {
    return needs(s).some(x => x.p === pid) && s.phase !== 'neutralPick';
  }

  function nextBidder(s, from) {
    for (let k = 0; k < s.n; k++) {
      const i = (from + k) % s.n, p = s.players[i];
      if (!p.passed && !p.hasBid) return i;
    }
    return -1;
  }

  function biddable(s, auc) {
    if (auc.tile.noBuild) return true;
    return eligible(s, auc.tile).length > 0;
  }
  function currentMinBid(auc) { return LADDER.find(x => x > auc.bid); }

  function canBuildAny(s, p, tile) {
    return eligible(s, tile).some(id => quoteBuild(s, p, id).ok);
  }

  // most silver this player could possibly raise: purse, gold, goods sold (1 trade each) and every IOU left
  function fundsCeiling(s, p) {
    const vals = [];
    ['wood', 'food', 'steel'].forEach(r => { for (let i = 0; i < p.res[r]; i++) vals.push(PRICE[r]); });
    vals.sort((a, b) => b - a);
    const sold = vals.slice(0, p.trade).reduce((a, b) => a + b, 0);
    return p.silver + 5 * p.res.gold + sold + 2 * s.sup.debt;
  }
  function legalBids(s, pid, aucIdx) {
    const p = s.players[pid], auc = s.auctions[aucIdx];
    if (!auc || !biddable(s, auc)) return [];
    if (!auc.tile.noBuild && !canBuildAny(s, p, auc.tile)) return [];
    const cap = fundsCeiling(s, p);
    const out = LADDER.filter(x => x > auc.bid && x <= cap);
    if (auc.bid > 0 && auc.bid <= cap && has(p, 'advocate') && auc.holder !== pid) out.unshift(auc.bid);
    return out;
  }

  function railChoices(s, p) {
    // choices if p advances once more
    const pos = p.advances + 1;
    const out = [];
    const avail = k => k === 'trade' ? s.sup.trade > 0 : k === 'line' ? s.sup.line > 0 : k === 'worker' ? s.sup.worker > 0 : true;
    if (pos <= 5) { for (let i = 0; i < pos; i++) if (avail(RAIL[i])) out.push(RAIL[i]); }
    else if (s.opts.railOverflow === 'any') { RAIL.forEach(k => { if (avail(k)) out.push(k); }); }
    else if (s.opts.railOverflow === 'vp3') out.push('vp3');
    return out;
  }

  function applyReward(s, p, kind, res) {
    switch (kind) {
      case 'trade': gainTrade(s, p, 1); ev(s, 'gain', p.id, { trade: 1 }); break;
      case 'line': if (s.sup.line > 0) { s.sup.line--; p.lines++; ev(s, 'gain', p.id, { line: 1 }); } break;
      case 'worker': if (s.sup.worker > 0) { s.sup.worker--; p.workers++; ev(s, 'gain', p.id, { worker: 1 }); } break;
      case 'resource': gainRes(s, p, res, 1); ev(s, 'gain', p.id, { [res]: 1 }); break;
      case 'vp3': p.vp += 3; ev(s, 'gain', p.id, { vp: 3 }); break;
    }
  }

  function advanceRail(s, p) { p.advances += 1; }

  // ----- the main reducer
  function apply(s, a) {
    const err = e => ({ ok: false, err: e });
    const p = s.players[a.p];
    if (!p) return err('no such player');
    if (s.over) return err('game over');
    const econ = ['buy', 'sell', 'hire', 'takeDebt', 'repay', 'convert'];
    if (econ.includes(a.type)) {
      if (!canEcon(s, a.p)) return err('not your decision right now');
      return doEcon(s, p, a);
    }
    switch (a.type) {
      case 'assign': {
        if (s.phase !== 'assign' || s.ready[a.p]) return err('cannot assign now');
        const e = validAssign(p, a.assign || {});
        if (e) return err(e);
        p.assign = clone(a.assign || {});
        return { ok: true };
      }
      case 'ready': {
        if (s.phase !== 'assign' || s.ready[a.p]) return err('cannot ready now');
        const e = validAssign(p, p.assign);
        if (e) return err(e);
        s.ready[a.p] = true;
        if (s.ready.every(Boolean)) collectAll(s);
        return { ok: true };
      }
      case 'payWages': {
        if (s.phase !== 'wages' || s.wageQueue[0] !== a.p) return err('not your wages');
        const e = payCheck(s, p, p.workers, a.plan);
        if (e) return err(e);
        payDo(s, p, p.workers, a.plan);
        ev(s, 'pay', p.id, { wages: p.workers });
        s.wageQueue.shift();
        if (!s.wageQueue.length) endWages(s);
        return { ok: true };
      }
      case 'neutralPick': {
        if (s.phase !== 'neutralPick' || s.startPlayer !== a.p) return err('no');
        if (!s.auctions[a.auction]) return err('bad auction');
        placeNeutral(s, a.auction);
        beginBids(s);
        return { ok: true };
      }
      case 'bid': return doBid(s, p, a);
      case 'pass': return doPass(s, p, a);
      case 'payBid': return doPayBid(s, p, a);
      case 'build': return doBuildAction(s, p, a);
      case 'skipExtra': {
        const st = s.steps[0];
        if (s.phase !== 'resolve' || !st || st.k !== 'extra' || st.p !== a.p) return err('no');
        s.steps.shift(); advanceResolve(s); return { ok: true };
      }
      case 'railReward': {
        const st = s.steps[0];
        if (s.phase !== 'resolve' || !st || st.k !== 'rail' || st.p !== a.p) return err('no reward pending');
        const ch = railChoices(s, p);
        if (!ch.includes(a.reward)) return err('reward not available');
        if (a.reward === 'resource' && !RES.includes(a.res)) return err('pick a resource');
        if (a.reward === 'resource' && s.sup[a.res] <= 0) return err('that resource has run out');
        advanceRail(s, p);
        applyReward(s, p, a.reward, a.res);
        log(s, `${p.name} advances on the rail track: ${a.reward}.`);
        s.steps.shift(); advanceResolve(s); return { ok: true };
      }
      case 'pickRes': {
        const st = s.steps[0];
        if (s.phase !== 'resolve' || !st || st.k !== 'pickRes' || st.p !== a.p) return err('no');
        if (!RES.includes(a.res) || s.sup[a.res] <= 0) return err('unavailable');
        gainRes(s, p, a.res, 1); ev(s, 'gain', p.id, { [a.res]: 1 });
        s.steps.shift(); advanceResolve(s); return { ok: true };
      }
      case 'finalDone': {
        if (s.phase !== 'finalTrade' || s.done[a.p]) return err('no');
        s.done[a.p] = true;
        if (s.done.every(Boolean)) finish(s);
        return { ok: true };
      }
    }
    return err('unknown action');
  }

  // ----- economy
  function doEcon(s, p, a) {
    const q = Math.max(1, a.qty | 0 || 1);
    const err = e => ({ ok: false, err: e });
    switch (a.type) {
      case 'buy': {
        const r = a.res;
        if (!RES.includes(r)) return err('?');
        if (p.trade < q) return err('needs a trade token each');
        if (s.sup[r] < q) return err('supply exhausted');
        if (r === 'copper' || r === 'livestock') { if (p.res.gold < q) return err('pay with one gold each'); giveRes(s, p, 'gold', q); }
        else { const cost = PRICE[r] * q; if (p.silver < cost) return err('not enough silver'); p.silver -= cost; }
        spendTrade(s, p, q); gainRes(s, p, r, q);
        ev(s, 'buy', p.id, { res: r, q });
        return { ok: true };
      }
      case 'sell': {
        const r = a.res;
        if (!RES.includes(r)) return err('?');
        if (p.trade < q) return err('needs a trade token each');
        if (p.res[r] < q) return err('you do not have that');
        if ((r === 'copper' || r === 'livestock') && s.sup.gold < q) return err('no gold left to pay you');
        giveRes(s, p, r, q);
        if (r === 'copper' || r === 'livestock') gainRes(s, p, 'gold', q); else p.silver += PRICE[r] * q;
        if (has(p, 'drygoods')) p.silver += q;
        spendTrade(s, p, q); p.vp += q;
        ev(s, 'sell', p.id, { res: r, q });
        return { ok: true };
      }
      case 'hire': {
        if (p.trade < q || p.res.food < q) return err('needs a trade token and a food each');
        if (s.sup.worker < q) return err('no workers left');
        spendTrade(s, p, q); giveRes(s, p, 'food', q); s.sup.worker -= q; p.workers += q;
        ev(s, 'gain', p.id, { worker: q });
        return { ok: true };
      }
      case 'takeDebt': {
        if (s.sup.debt < q) return err('no IOU chits left');
        s.sup.debt -= q; p.debt += q; p.silver += 2 * q;
        ev(s, 'debt', p.id, q);
        return { ok: true };
      }
      case 'repay': {
        if (p.debt < q) return err('no such debt');
        const e = payCheck(s, p, 5 * q, a.plan);
        if (e) return err(e);
        payDo(s, p, 5 * q, a.plan);
        p.debt -= q; s.sup.debt += q;
        ev(s, 'repay', p.id, q);
        return { ok: true };
      }
      case 'convert': {
        if (!has(p, 'bazaar')) return err('needs a Bazaar');
        const from = a.from, to = from === 'wood' ? 'food' : from === 'food' ? 'steel' : null;
        if (!to) return err('wood->food or food->steel only');
        if (p.trade < q || p.res[from] < q) return err('needs a trade token and the resource');
        if (s.sup[to] < q) return err('supply exhausted');
        spendTrade(s, p, q); giveRes(s, p, from, q); gainRes(s, p, to, q);
        ev(s, 'convert', p.id, { from, to, q });
        return { ok: true };
      }
    }
    return err('?');
  }

  // ----- wages -> bidding
  function endWages(s) {
    if (s.final) { s.phase = 'finalTrade'; s.done = s.players.map(() => false); log(s, 'Final trading: settle up, sell and repay.'); return; }
    if (s.n === 2) {
      s.neutralOn = true;
      if (s.opts.neutralPlace === 'start') { s.phase = 'neutralPick'; return; }
      placeNeutral(s, Math.floor(rnd(s) * s.auctions.length));
    } else s.neutralOn = false;
    beginBids(s);
  }
  function neutralValue(s) { return LADDER[s.neutral]; }
  function placeNeutral(s, idx) {
    const auc = s.auctions[idx];
    auc.bid = neutralValue(s); auc.holder = 'N';
    ev(s, 'neutral', -1, { auction: idx, bid: auc.bid });
    log(s, `The neutral bidder opens at ${auc.bid} on ${auc.tile.name}.`);
  }
  function beginBids(s) {
    s.phase = 'bid';
    s.bidTurn = nextBidder(s, s.startPlayer);
    if (s.bidTurn < 0) endBids(s);
  }

  function doBid(s, p, a) {
    const err = e => ({ ok: false, err: e });
    if (s.phase !== 'bid' || s.bidTurn !== a.p) return err('not your turn');
    const auc = s.auctions[a.auction];
    if (!auc) return err('no such auction');
    const legal = legalBids(s, a.p, a.auction);
    if (!legal.includes(a.amount)) return err('illegal bid');
    if (auc.holder !== null && auc.holder !== 'N' && auc.holder !== undefined) {
      const prev = s.players[auc.holder]; prev.hasBid = false; ev(s, 'outbid', prev.id, a.auction);
    }
    auc.bid = a.amount; auc.holder = a.p; p.hasBid = true;
    ev(s, 'bid', a.p, { auction: a.auction, amount: a.amount, tile: auc.tile.name });
    log(s, `${p.name} bids ${a.amount} on ${auc.tile.name}.`);
    s.bidTurn = nextBidder(s, (a.p + 1) % s.n);
    if (s.bidTurn < 0) endBids(s);
    return { ok: true };
  }

  function doPass(s, p, a) {
    const err = e => ({ ok: false, err: e });
    if (s.phase !== 'bid' || s.bidTurn !== a.p) return err('not your turn');
    const ch = railChoices(s, p);
    if (ch.length) {
      if (!ch.includes(a.reward)) return err('reward not available');
      if (a.reward === 'resource' && (!RES.includes(a.res) || s.sup[a.res] <= 0)) return err('pick an available resource');
    }
    p.passed = true;
    advanceRail(s, p);
    if (ch.length) applyReward(s, p, a.reward, a.res);
    ev(s, 'pass', p.id, { reward: ch.length ? a.reward : null, res: a.res || null });
    log(s, `${p.name} passes and advances the railroad${ch.length ? ' (' + a.reward + ')' : ''}.`);
    if (s.n === 2) s.neutral = Math.max(0, s.neutral - 1);
    s.bidTurn = nextBidder(s, (a.p + 1) % s.n);
    if (s.bidTurn < 0) endBids(s);
    return { ok: true };
  }

  function endBids(s) {
    s.bidTurn = -1;
    s.phase = 'resolve';
    s.steps = [];
    s.nextStart = null;
    // marker
    for (const a of s.auctions) if (typeof a.holder === 'number') { s.nextStart = a.holder; break; }
    if (s.nextStart === null) s.nextStart = s.startPlayer;
    const won = {};
    s.auctions.forEach(a => { if (typeof a.holder === 'number') won[a.holder] = (won[a.holder] || 0) + 1; });
    s.bothWon = s.n === 2 && Object.keys(won).length === 2;
    s.auctions.forEach(a => {
      if (typeof a.holder === 'number') s.steps.push({ k: 'payBid', p: a.holder, auction: a.idx, amount: a.bid });
    });
    // steps are processed one auction at a time: keep as nested queue
    s.pendingAuctions = s.steps.map(x => x);
    s.steps = [];
    advanceResolve(s);
  }

  function advanceResolve(s) {
    for (;;) {
      // run tile-bonus steps that have reached the head
      while (s.steps.length && s.steps[0].k === 'tileBonus') {
        const st = s.steps.shift(), p = s.players[st.p];
        const extra = bonusSteps(s, p, s.auctions[st.auction].tile.bonus, st.auction);
        s.steps = extra.concat(s.steps);
      }
      if (!s.steps.length) {
        if (s.pendingAuctions && s.pendingAuctions.length) { s.steps.push(s.pendingAuctions.shift()); continue; }
        endRound(s);
        return;
      }
      const st = s.steps[0], p = s.players[st.p];
      if (st.k === 'build') {
        const auc = s.auctions[st.auction];
        const cap = fundsCeiling(s, p);
        const ok = eligible(s, auc.tile).some(id => { const q = quoteBuild(s, p, id); return q.ok && q.S <= cap; });
        if (!ok) {
          p.silver += st.refund; log(s, `${p.name} cannot build on ${auc.tile.name}; the bid is refunded.`);
          ev(s, 'refund', p.id, st.refund);
          s.steps.shift();
          s.steps = s.steps.filter(x => !(x.k === 'tileBonus' && x.auction === st.auction));
          continue;
        }
      } else if (st.k === 'payBid') {
        if (st.amount > fundsCeiling(s, p)) {
          log(s, `${p.name} cannot raise ${st.amount}; ${s.auctions[st.auction].tile.name} goes unsold.`);
          ev(s, 'unsold', p.id, st.auction);
          s.steps.shift(); continue;
        }
      } else if (st.k === 'extra') {
        const cap2 = fundsCeiling(s, p);
        const ok = Object.keys(s.bsup).some(id => { if (!(s.bsup[id] > 0)) return false; const q = quoteBuild(s, p, id); return q.ok && q.S <= cap2; });
        if (!ok) { s.steps.shift(); continue; }
      } else if (st.k === 'rail') {
        if (!railChoices(s, p).length) { advanceRail(s, p); s.steps.shift(); continue; }
      } else if (st.k === 'pickRes') {
        if (!RES.some(r => s.sup[r] > 0)) { s.steps.shift(); continue; }
      }
      return;
    }
  }

  function bonusSteps(s, p, bonus, auction) {
    const out = [];
    if (!bonus) return out;
    if (bonus.worker && s.sup.worker > 0) { s.sup.worker--; p.workers += bonus.worker; ev(s, 'gain', p.id, { worker: bonus.worker }); }
    if (bonus.trade) { gainTrade(s, p, bonus.trade); ev(s, 'gain', p.id, { trade: bonus.trade }); }
    if (bonus.silver) { p.silver += bonus.silver; ev(s, 'gain', p.id, { silver: bonus.silver }); }
    if (bonus.vp) { p.vp += bonus.vp; ev(s, 'gain', p.id, { vp: bonus.vp }); }
    if (bonus.debtPay && p.debt) { p.debt -= 1; s.sup.debt += 1; ev(s, 'repay', p.id, 1); }
    if (bonus.line && s.sup.line > 0) { s.sup.line--; p.lines += bonus.line; }
    for (let i = 0; i < (bonus.rail || 0); i++) out.push({ k: 'rail', p: p.id, auction });
    for (let i = 0; i < (bonus.resource || 0); i++) out.push({ k: 'pickRes', p: p.id, auction });
    return out;
  }

  function doPayBid(s, p, a) {
    const err = e => ({ ok: false, err: e });
    const st = s.steps[0];
    if (s.phase !== 'resolve' || !st || st.k !== 'payBid' || st.p !== a.p) return err('nothing to pay');
    const e = payCheck(s, p, st.amount, a.plan);
    if (e) return err(e);
    payDo(s, p, st.amount, a.plan);
    ev(s, 'pay', p.id, { bid: st.amount, auction: st.auction });
    wonLog(s, p, st);
    const auc = s.auctions[st.auction];
    s.steps.shift();
    const next = [];
    if (!auc.tile.noBuild) next.push({ k: 'build', p: p.id, auction: st.auction, refund: st.amount, bid: st.amount, noBonusOnFail: true });
    next.push({ k: 'tileBonus', p: p.id, auction: st.auction });
    s.steps = next.concat(s.steps);
    advanceResolve(s);
    return { ok: true };
  }
  function wonLog(s, p, st) { log(s, `${p.name} wins ${s.auctions[st.auction].tile.name} for ${st.amount}.`); }

  function doBuildAction(s, p, a) {
    const err = e => ({ ok: false, err: e });
    const st = s.steps[0];
    if (s.phase !== 'resolve' || !st || (st.k !== 'build' && st.k !== 'extra') || st.p !== a.p) return err('nothing to build');
    const auc = s.auctions[st.auction];
    const id = a.id;
    if (!BMAP[id] || !(s.bsup[id] > 0)) return err('that building is not available');
    if (st.k === 'build' && !auc.tile.types.includes(BMAP[id].type)) return err('wrong building type for this tile');
    const q = quoteBuild(s, p, id);
    if (!q.ok) return err(q.why);
    // extra build may need to repay the bid
    let extraBid = 0;
    if (st.k === 'extra' && s.opts.trainExtra === 'bid') extraBid = st.bid;
    const total = q.S + extraBid;
    // gold available for payment after the build
    const goldFree = p.res.gold + q.buy.gold - q.need.gold - q.goldCL;
    const plan = a.plan || {};
    if ((plan.gold | 0) > goldFree) return err('that gold is needed for the building');
    const e = payCheck2(s, p, total, plan, q);
    if (e) return err(e);
    buildDo(s, p, id, plan);
    payDo(s, p, total, plan);
    s.bsup[id]--;
    addBuilding(s, p, id);
    ev(s, 'build', p.id, { id, auction: st.auction });
    log(s, `${p.name} builds ${BMAP[id].name}.`);
    s.steps.shift();
    const bd = BMAP[id];
    const add = [];
    const ob = bd.onBuild || {};
    if (ob.debtPay && p.debt) { p.debt--; s.sup.debt++; ev(s, 'repay', p.id, 1); }
    if (ob.trade) { gainTrade(s, p, ob.trade); ev(s, 'gain', p.id, { trade: ob.trade }); }
    if (ob.worker && s.sup.worker > 0) { s.sup.worker--; p.workers++; ev(s, 'gain', p.id, { worker: 1 }); }
    if (ob.line && s.sup.line > 0) { s.sup.line--; p.lines += ob.line; ev(s, 'gain', p.id, { line: 1 }); }
    if (ob.rail) add.push({ k: 'rail', p: p.id, auction: st.auction });
    if (ob.extra) add.push({ k: 'extra', p: p.id, auction: st.auction, bid: st.bid || 0 });
    s.steps = add.concat(s.steps);
    advanceResolve(s);
    return { ok: true };
  }
  // payment check that also accounts for purchases made during the build
  function payCheck2(s, p, amount, plan, q) {
    plan = plan || {};
    const g = plan.gold | 0, t = plan.trades | 0;
    if (g < 0 || t < 0) return 'bad plan';
    if (t && !has(p, 'savings')) return 'trades can only pay silver with a Savings House';
    if (t > p.trade - q.T) return 'not enough trade tokens';
    const sil = Math.max(0, amount - 5 * g - t);
    if (sil > p.silver) return 'not enough silver';
    return null;
  }

  function endRound(s) {
    s.startPlayer = s.nextStart;
    if (s.bothWon && s.n === 2) s.neutral = Math.min(5, s.neutral + 1);
    s.pendingAuctions = [];
    if (s.round >= 10) {
      s.final = true; s.round = 10; s.phase = 'assign'; s.ready = s.players.map(() => false);
      s.auctions = []; s.neutralOn = false;
      s.players.forEach(p => { p.passed = false; p.hasBid = false; });
      log(s, 'Final income phase.');
      ev(s, 'final', -1, 0);
      return;
    }
    startRound(s);
  }

  // ----- scoring
  function countType(p, t, opts) {
    return p.blds.filter(b => {
      if (b.id === 'cabin' && !opts.homesteadCounts) return false;
      return BMAP[b.id].type === t;
    }).length;
  }
  function scoreOf(s, p) {
    const o = s.opts;
    const bldPts = p.blds.reduce((a, b) => a + BMAP[b.id].pts, 0);
    const items = [];
    p.blds.forEach(b => {
      const bd = BMAP[b.id];
      (bd.final || []).forEach(f => {
        let c = 0;
        if (f.per === 'worker') c = p.workers;
        else if (f.per === 'line') c = p.lines;
        else if (f.per === 'building') c = p.blds.filter(x => x.id !== 'cabin' || o.homesteadCounts).length;
        else c = countType(p, f.per, o);
        items.push({ name: bd.name, per: f.per, count: c, pts: c });
      });
    });
    const bonus = items.reduce((a, x) => a + x.pts, 0);
    const rare = p.res.gold + p.res.copper + p.res.livestock;
    const pen = p.debt * (p.debt + 1) / 2;
    const total = p.vp + bldPts + bonus + 2 * rare - pen;
    return { vp: p.vp, bldPts, items, bonus, rare, rarePts: 2 * rare, debt: p.debt, pen, total, silver: p.silver };
  }
  function finish(s) {
    s.over = true; s.phase = 'over';
    const sc = s.players.map(p => scoreOf(s, p));
    let best = -1e9;
    sc.forEach(x => { if (x.total > best) best = x.total; });
    let c = sc.map((x, i) => i).filter(i => sc[i].total === best);
    const ms = Math.max.apply(null, c.map(i => sc[i].silver));
    c = c.filter(i => sc[i].silver === ms);
    s.result = { scores: sc, winners: c };
    log(s, 'The ledger is closed.');
    ev(s, 'over', -1, c);
  }

  const api = { fundsCeiling, newGame, apply, needs, quoteBuild, eligible, legalBids, railChoices, incomeOf, validAssign, scoreOf,
    slotsOf, slotCap, has, stage, payCheck, shortfall, clone, hashSeed, defaultOpts, rnd, biddable, canBuildAny,
    neutralValue, nextBidder, countType };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
