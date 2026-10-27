/* CLAIMSTAKE interface. Vanilla JS, one render function, event delegation. */
(function () {
  'use strict';
  const D = window.HSDATA, HS = window.HS, B = window.HSBOTS, A = window.HSART;
  const { RES, BMAP, PRICE, LADDER, RAIL } = D;
  const I = A.icon;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const poss = n => n === 'You' ? 'Your' : n + "'s";
  const clone = o => JSON.parse(JSON.stringify(o));
  const STAGE = { A: 'Settlement', B: 'Town', C: 'City' };
  const LVL = { 1: 'Greenhorn', 2: 'Homesteader', 3: 'Land Baron' };
  const BOTNAMES = ['Ada', 'Bram', 'Cora'];
  const PCOL = ['#f2b34c', '#7ec8e3', '#c590d6', '#8fc08a'];
  const PER = { R: 'Residential', I: 'Industrial', C: 'Commercial', S: 'Special', worker: 'worker', line: 'spur line', building: 'building' };
  const RAILTIP = { trade: 'a trade token, needed for every market action.', line: 'a spur line that pays 1 silver every round.', worker: 'a free worker (but wages apply).', resource: 'one resource of your choice.', vp3: '3 victory points.' };
  const RAILNAME = { trade: 'Trade token', line: 'Spur line', worker: 'Worker', resource: 'Any resource', vp3: '3 VP' };
  const RAILICON = { trade: 'trade', line: 'line', worker: 'worker', resource: 'wood', vp3: 'vp' };
  const SPECIAL = {
    goldSub: 'Gold can stand in for copper or livestock in building costs.',
    forge: 'Every building you build later scores +1 VP.',
    convert: 'Spend 1 trade token: wood to food, or food to steel.',
    sellBonus: 'Each sale also pays +1 silver.',
    tradeSilver: 'Trade tokens count as 1 silver when you pay.',
    tieBid: 'You may match the current bid instead of raising it.',
  };

  // ------------------------------------------------------------ storage
  const mem = {};
  const lsGet = k => { try { const v = localStorage.getItem(k); return v == null ? (mem[k] || null) : v; } catch (e) { return mem[k] || null; } };
  const lsSet = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const lsDel = k => { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };
  function loadJSON(k, d) { try { const v = lsGet(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }

  const prof = Object.assign({ games: 0, wins: 0, best: 0, streak: 0, bestStreak: 0, ach: {}, daily: {}, sound: false, theme: '', last: null }, loadJSON('claimstake.prof', {}));
  const saveProf = () => lsSet('claimstake.prof', JSON.stringify(prof));

  const ACH = [
    ['first', 'First Stake', 'Win a game.'],
    ['baron', 'Baron Beaten', 'Win against only Land Baron bots.'],
    ['clean', 'Clean Books', 'Win with no debt.'],
    ['roller', 'High Roller', 'Pay a winning bid of 16 or more.'],
    ['town', 'Full Town', 'Finish with 12 or more buildings.'],
    ['horse', 'Iron Horse', 'Advance 7 times on the rail track.'],
    ['market', 'Market Mind', 'Sell 10 goods in one game.'],
    ['s70', 'Seventy Club', 'Score 70 or more.'],
    ['hoard', 'Hoarder', 'Finish with 6 or more gold, copper and livestock.'],
    ['streak3', 'Hot Streak', 'Win three games in a row.'],
    ['daily', 'Daily Claim', 'Finish a Daily Claim.'],
  ];

  // ------------------------------------------------------------ app state
  const App = {
    view: 'menu', s: null, cfg: null,
    menu: { n: 2, seats: [{ kind: 'human', name: 'You' }, { kind: 2 }, { kind: 2 }, { kind: 2 }], opts: {}, seed: '' },
    ui: { tab: 'play', sel: null, pay: { gold: 0, trades: 0 }, payKey: '', curtainFor: -1, evSeen: 0, seenUid: 0, modal: null, narrow: innerWidth < 700 },
  };
  if (prof.last && prof.last.menu) { try { Object.assign(App.menu, prof.last.menu); } catch (e) { /* ignore */ } }

  const root = () => document.getElementById('app');

  // ------------------------------------------------------------ helpers
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function toast(msg, kind) {
    const box = document.getElementById('toasts'); if (!box) return;
    const d = document.createElement('div'); d.className = 'toast ' + (kind || ''); d.textContent = msg;
    box.appendChild(d); while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2800);
  }
  let AC = null;
  function sfx(kind) {
    if (!prof.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t = AC.currentTime;
      const note = (f, d, at, type, vol) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type || 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(vol || .06, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + d);
        o.connect(g); g.connect(AC.destination); o.start(t + at); o.stop(t + at + d + .02);
      };
      if (kind === 'coin') { note(880, .12, 0); note(1320, .2, .07); }
      else if (kind === 'build') { note(196, .35, 0, 'square', .04); note(294, .35, .05, 'square', .04); note(392, .45, .1, 'square', .04); }
      else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => note(f, .3, i * .12)); }
      else note(520, .05, 0, 'square', .03);
    } catch (e) { /* ignore */ }
  }
  function setTheme(t) {
    prof.theme = t; saveProf();
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  }

  // ------------------------------------------------------------ game flow
  function curNeed() { const s = App.s; if (App.net) return HS.needs(s).find(x => x.p === App.net.pid) || null; return HS.needs(s).find(x => s.players[x.p].kind === 'human') || null; }
  function viewer() { const s = App.s; if (App.net) return s.players[App.net.pid]; const c = curNeed(); return c ? s.players[c.p] : s.players.find(p => p.kind === 'human') || s.players[0]; }
  function save() {
    if (!App.s || App.net) return;
    if (App.s.over) { lsDel('claimstake.save'); return; }
    lsSet('claimstake.save', JSON.stringify({ s: App.s, cfg: App.cfg }));
  }
  function startGame(cfg, extra) {
    const s = HS.newGame(cfg);
    if (extra) Object.assign(s, extra);
    App.s = s; App.cfg = cfg; App.view = 'game';
    App.ui = Object.assign(App.ui, { lastRound: 0, tab: 'play', sel: null, pay: { gold: 0, trades: 0 }, payKey: '', curtainFor: -1, evSeen: s.events.length, seenUid: s.uidn - 1, modal: null });
    B.runBots(s);
    save(); render();
  }
  function dispatch(a, snd) {
    const s = App.s;
    if (a.p == null) a.p = viewer().id;
    const r = HS.apply(s, a);
    if (!r.ok) { toast(cap(r.err), 'bad'); sfx(); render(); return false; }
    sfx(snd);
    if (App.net && App.net.role === 'client') {
      netEnqueue(a);
      render(); flushEvents();
      return true;
    }
    B.runBots(s);
    if (s.over && !App.net) record();
    save(); render(); flushEvents();
    if (App.net) { if (s.over) App.net.meta.status = 'over'; netPublish(); }
    return true;
  }

  function flushEvents() {
    const s = App.s; if (!s) return;
    const evs = s.events.slice(App.ui.evSeen); App.ui.evSeen = s.events.length;
    const humans = s.players.filter(p => p.kind === 'human');
    const solo = App.net ? App.net.pid : humans.length === 1 ? humans[0].id : -1;
    const out = [];
    evs.forEach(e => {
      const pl = e.p >= 0 ? s.players[e.p] : null;
      if (e.t === 'income' && e.p === solo) {
        const v = e.v, bits = [];
        if (v.silver) bits.push('+' + v.silver + ' silver');
        if (v.vp) bits.push('+' + v.vp + ' VP');
        RES.forEach(r => { if (v[r]) bits.push('+' + v[r] + ' ' + r); });
        if (v.trade) bits.push('+' + v.trade + ' trade');
        out.push(['Income: ' + (bits.join(', ') || 'nothing this round'), 'good']);
      } else if (e.t === 'bid' && pl && pl.id !== solo && (pl.kind === 'bot' || App.net)) out.push([`${pl.name} bids ${e.v.amount} on ${e.v.tile}`]);
      else if (e.t === 'pass' && pl && pl.id !== solo && (pl.kind === 'bot' || App.net)) out.push([`${pl.name} passes`]);
      else if (e.t === 'build' && pl && pl.id !== solo && (pl.kind === 'bot' || App.net)) out.push([`${pl.name} builds ${BMAP[e.v.id].name}`]);
      else if (e.t === 'stage') out.push(['The town grows: new buildings are open.', 'good']);
      else if (e.t === 'refund' && e.p === solo) out.push([`Bid refunded: ${e.v} silver`, 'good']);
    });
    out.slice(-3).forEach(x => toast(x[0], x[1]));
  }

  // ------------------------------------------------------------ profile + achievements
  function record() {
    const s = App.s; if (s.rec || App.net) return; s.rec = true;
    const humans = s.players.filter(p => p.kind === 'human');
    if (humans.length !== 1) return;
    const me = humans[0], sc = s.result.scores[me.id], won = s.result.winners.includes(me.id);
    const got = [];
    const unlock = id => { if (!prof.ach[id]) { prof.ach[id] = Date.now(); got.push(id); } };
    prof.games++;
    if (won) { prof.wins++; prof.streak++; prof.bestStreak = Math.max(prof.bestStreak, prof.streak); } else prof.streak = 0;
    prof.best = Math.max(prof.best, sc.total);
    if (won) {
      unlock('first');
      if (s.players.filter(p => p.id !== me.id).every(p => p.level === 3 && p.kind === 'bot')) unlock('baron');
      if (me.debt === 0) unlock('clean');
      if (prof.streak >= 3) unlock('streak3');
    }
    if (s.events.some(e => e.t === 'pay' && e.p === me.id && e.v && e.v.bid >= 16)) unlock('roller');
    if (me.blds.length >= 12) unlock('town');
    if (me.advances >= 7) unlock('horse');
    if (s.events.filter(e => e.t === 'sell' && e.p === me.id).reduce((a, e) => a + e.v.q, 0) >= 10) unlock('market');
    if (sc.total >= 70) unlock('s70');
    if (sc.rare >= 6) unlock('hoard');
    if (s.daily) { prof.daily[s.daily] = Math.max(prof.daily[s.daily] == null ? -999 : prof.daily[s.daily], sc.total); unlock('daily'); }
    s.unlocked = got; saveProf();
  }
  function dailyStreak() {
    let n = 0; const d = new Date();
    for (let i = 0; i < 400; i++) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (prof.daily[k] != null) n++; else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  // ------------------------------------------------------------ html bits
  function resChip(r, q) { return `<span class="chip">${I(r)}<b class="num">${q}</b></span>`; }
  function outChips(o) {
    if (!o) return '';
    const parts = [];
    for (const k in o) {
      const v = o[k];
      if (k === 'silverPerWorker') parts.push(`<span class="chip">${I('silver')}1 per ${I('worker')}</span>`);
      else if (k === 'debtPay') parts.push(`<span class="chip">${I('debt')} repay ${v}</span>`);
      else if (k === 'rail') parts.push(`<span class="chip">${I('rail')} +${v}</span>`);
      else if (k === 'extra') parts.push('<span class="chip">extra building</span>');
      else if (k === 'resource') parts.push(`<span class="chip">any resource${v > 1 ? ' x' + v : ''}</span>`);
      else parts.push(`<span class="chip">${I(k)}<b class="num">${v}</b></span>`);
    }
    return parts.join('');
  }
  const typeChip = t => `<span class="chip ${t}">${I(t)}${D.TYPES[t]}</span>`;
  function costHTML(bd) { return bd.costList.length ? `<span class="cost">${bd.costList.map(r => I(r)).join('')}</span>` : '<span class="faint">Free</span>'; }
  function finalTxt(f) { return `+1 VP per ${PER[f.per]}${/^[RICS]$/.test(f.per) ? ' ' + I(f.per) : ''}`; }
  function bcard(id, o) {
    o = o || {}; const bd = BMAP[id];
    const L = [];
    if (bd.auto) L.push(`<div>Always: ${outChips(bd.auto)}</div>`);
    if (bd.s1) L.push(`<div>1 worker: ${outChips(bd.s1)}</div>`);
    if (bd.s2) L.push(`<div>1 worker: ${outChips(bd.s2)}</div>`);
    if (bd.dbl) L.push(`<div>2 workers: ${outChips(bd.dbl)}</div>`);
    if (bd.onBuild) L.push(`<div>When built: ${outChips(bd.onBuild)}</div>`);
    (bd.final || []).forEach(f => L.push(`<div>Final: ${finalTxt(f)}</div>`));
    if (bd.special) L.push(`<div class="faint">${SPECIAL[bd.special]}</div>`);
    const tag = o.tag || 'div';
    return `<${tag} class="bcard ${o.cls || ''}" ${o.attrs || ''}>
      <div class="art">${A.sprite(id)}</div>
      <div class="nm"><span>${bd.name}</span><span class="ty ${bd.type}">${I(bd.type)}${bd.type}</span></div>
      <div class="row wrap">${costHTML(bd)}${bd.pts ? `<span class="chip">${I('vp')}${bd.pts} pts</span>` : ''}${bd.n ? `<span class="faint">${o.left != null ? o.left + ' left' : ''}</span>` : ''}</div>
      <div class="fx">${L.join('')}</div>${o.foot || ''}
    </${tag}>`;
  }

  // ------------------------------------------------------------ town scene
  function sceneHTML(p, o) {
    o = o || {};
    const W = App.ui.narrow ? 480 : 960, cols = App.ui.narrow ? 4 : 8, cw = 120;
    const n = p.blds.length, rows = Math.ceil(n / cols), H = 205 + 58 * (rows - 1);
    let g = '';
    for (let i = 0; i < 28; i++) g += `<circle class="star" cx="${(i * 137 + 40) % W}" cy="${(i * 53) % 70 + 34}" r="${i % 3 ? 1 : 1.6}"/>`;
    if (o.dawn != null) g += `<g class="sunwrap"><circle cx="${W * .72}" cy="${H - 150}" r="78" fill="#ffb35a" opacity=".28"/><circle cx="${W * .72}" cy="${H - 150}" r="36" fill="#ffd98a"/></g>`;
    g += `<path d="M0 ${H - 70} Q ${W * .25} ${H - 125} ${W * .5} ${H - 88} T ${W} ${H - 98} V ${H} H0Z" fill="var(--hill1)"/>`;
    g += `<path d="M0 ${H - 50} Q ${W * .3} ${H - 84} ${W * .6} ${H - 60} T ${W} ${H - 68} V ${H} H0Z" fill="var(--hill2)"/>`;
    g += `<rect x="0" y="${H - 42}" width="${W}" height="42" fill="var(--ground)"/>`;
    const ty = H - 11;
    for (let x = 6; x < W; x += 16) g += `<rect x="${x}" y="${ty - 4}" width="5" height="9" fill="var(--plank)"/>`;
    g += `<line x1="0" y1="${ty - 1}" x2="${W}" y2="${ty - 1}" stroke="var(--steel2)" stroke-width="2.5"/><line x1="0" y1="${ty + 3}" x2="${W}" y2="${ty + 3}" stroke="var(--steel2)" stroke-width="2.5"/>`;
    g += `<use href="#i-rail" x="${14 + Math.min(p.advances, 10) / 10 * (W - 70)}" y="${ty - 24}" width="30" height="30"/>`;
    const shown = p.blds.map((b, i) => ({ b, i }));
    for (let r = rows - 1; r >= 0; r--) {
      const row = shown.filter(x => Math.floor(x.i / cols) === r), cnt = row.length, sx = (W - cnt * cw) / 2, base = H - 30 - r * 58;
      row.forEach((x, k) => {
        const px = sx + k * cw, py = base - 100.8, bd = BMAP[x.b.id];
        const rise = x.b.uid > App.ui.seenUid ? ' rise' : '';
        g += `<g class="bld${rise}" data-act="bld" data-id="${x.b.id}" tabindex="0" role="button" aria-label="${bd.name}">${A.sprite(x.b.id).replace('<svg ', `<svg x="${px}" y="${py}" width="120" height="108" `)}<text x="${px + 60}" y="${base + 12}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" opacity=".92" style="paint-order:stroke;stroke:rgba(0,0,0,.45);stroke-width:2.5px">${bd.name}</text></g>`;
      });
    }
    if (o.assign !== false && p.workers) {
      const used = Object.keys(p.assign || {}).reduce((a, u) => { const x = p.assign[u]; return a + (x.s1 || 0) + (x.s2 || 0) + (x.dbl || 0); }, 0);
      let wr = '';
      for (let w = 0; w < p.workers; w++) wr += `<use href="#i-worker" x="${12 + w * 32}" y="40" width="30" height="30" opacity="${w < used ? 1 : .35}"/>`;
      g += `<g data-tip="Workers: ${used} of ${p.workers} are assigned to slots. Faded workers are idle but still get paid."><rect x="6" y="36" width="${Math.max(0, p.workers * 32 + 12)}" height="38" rx="8" fill="rgba(0,0,0,.28)"/>${wr}</g>`;
    }
    return `<div class="scene${o.dawn != null ? ' dawn' : ''}"${o.dawn != null ? ` style="--d:-${o.dawn}ms"` : ''}><svg class="sc" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(poss(p.name))} town">${g}</svg>
      <div class="cap"><b>${esc(poss(p.name))} claim</b><span>${n} building${n === 1 ? '' : 's'}${p.lines ? ', ' + p.lines + ' spur line' + (p.lines > 1 ? 's' : '') : ''}</span></div></div>`;
  }

  // ------------------------------------------------------------ pay panel
  function payPanel(p, amount, o) {
    const st = App.ui.pay, sav = HS.has(p, 'savings');
    const maxG = Math.max(0, Math.min(o.maxGold != null ? o.maxGold : p.res.gold, Math.ceil(amount / 5)));
    const maxT = sav ? Math.max(0, Math.min(o.maxTrades != null ? o.maxTrades : p.trade, amount)) : 0;
    st.gold = Math.max(0, Math.min(st.gold, maxG)); st.trades = Math.max(0, Math.min(st.trades, maxT));
    while (st.gold * 5 + st.trades > amount + 4 && st.gold > 0) st.gold--;
    const sil = Math.max(0, amount - 5 * st.gold - st.trades), short = sil - p.silver;
    const step = (k, label, ic, val, max) => `<div class="stepper"><span>${ic} ${label}</span><button data-act="${k}" data-d="-1" ${val <= 0 ? 'disabled' : ''}>-</button><b class="num">${val}</b><button data-act="${k}" data-d="1" ${val >= max ? 'disabled' : ''}>+</button></div>`;
    return `<div class="pay">
      <div class="due">${o.title || 'Pay'}: ${amount} ${I('silver')}</div>
      <div class="row wrap">${step('pg', 'Gold (5 each)', I('gold'), st.gold, maxG)}${sav ? step('pt', 'Trade tokens (1 each)', I('trade'), st.trades, maxT) : ''}</div>
      <div class="row wrap"><span>From your purse: <b class="num">${sil}</b> ${I('silver')} of ${p.silver}</span></div>
      ${short > 0 ? `<div class="notice bad">Short by ${short} silver. Sell goods in the market, or borrow: each IOU gives 2 silver but costs 1, 2, 3... VP at the end.
        <div class="row wrap" style="margin-top:6px"><button class="btn small warn" data-act="debt" data-n="${Math.ceil(short / 2)}" ${App.s.sup.debt >= Math.ceil(short / 2) ? "" : "disabled"}>Borrow ${Math.ceil(short / 2)} IOU (+${Math.ceil(short / 2) * 2})</button></div></div>` : ''}
      <div class="row"><button class="btn" data-act="${o.act}" ${short > 0 || o.blocked ? 'disabled' : ''}>${o.btn || 'Pay'}</button>${o.extra || ''}</div>
    </div>`;
  }

  // ------------------------------------------------------------ rail / reward pickers
  function railTrack(p) {
    const cells = RAIL.map((k, i) => `<div class="rcell ${i < p.advances ? 'done' : ''} ${i === p.advances ? 'now' : ''}" data-tip="Rail space ${i + 1}: ${RAILNAME[k]}. ${i < p.advances ? 'You have passed this space.' : i === p.advances ? 'Your next pass lands here.' : 'Not reached yet.'} Landing here lets you take this reward or any earlier one.">${I(RAILICON[k])}<span>${RAILNAME[k]}</span></div>`).join('');
    return `<div class="rtrack">${cells}${p.advances > 5 ? `<span class="chip">+${p.advances - 5} beyond</span>` : ''}</div>`;
  }
  function rewardButtons(s, p, act, extra) {
    const ch = HS.railChoices(s, p);
    if (!ch.length) return `<div class="row"><button class="btn" data-act="${act}" data-reward="">${extra || 'Advance (no reward)'}</button></div>`;
    return `<div class="row wrap rewards">${ch.map(k => {
      if (k === 'resource') return `<span class="chip">Any resource: ${RES.filter(r => s.sup[r] > 0).map(r => `<button class="btn small ghost" data-act="${act}" data-reward="resource" data-res="${r}" data-tip="${cap(r)}">${I(r)}</button>`).join('')}</span>`;
      return `<button class="btn small" data-tip="${RAILNAME[k]}: ${RAILTIP[k]}" data-act="${act}" data-reward="${k}">${I(RAILICON[k])} ${RAILNAME[k]}</button>`;
    }).join('')}</div>`;
  }

  // ------------------------------------------------------------ phase panels
  function tileBonusChips(t) {
    if (t.noBuild) return `<span class="chip">No building</span>${outChips(t.bonus)}`;
    return outChips(t.bonus);
  }
  function assignPanel(s, p) {
    const used = Object.keys(p.assign).reduce((a, u) => { const x = p.assign[u]; return a + (x.s1 || 0) + (x.s2 || 0) + (x.dbl || 0); }, 0);
    const g = HS.incomeOf(s, p, p.assign);
    const chips = [];
    ['silver', 'trade', 'vp', ...RES].forEach(k => { if (g[k]) chips.push(`<span class="chip">${I(k)}+${g[k]}</span>`); });
    if (g.debtPay) chips.push(`<span class="chip">${I('debt')} repay ${Math.min(p.debt, g.debtPay)}</span>`);
    const cards = p.blds.filter(b => HS.slotsOf(BMAP[b.id]).length || BMAP[b.id].auto).map(b => {
      const bd = BMAP[b.id], a = p.assign[b.uid] || {};
      const slots = HS.slotsOf(bd).map(k => {
        const cap2 = HS.slotCap(k), on = (a[k] || 0) >= cap2;
        const dots = Array.from({ length: cap2 }, () => `<span class="w ${on ? 'on' : ''}">${on ? I('worker') : ''}</span>`).join('');
        return `<button class="slot ${on ? 'full' : ''}" data-tip="${on ? 'Click to take your worker' + (cap2 > 1 ? 's' : '') + ' off.' : 'Click to send ' + cap2 + ' worker' + (cap2 > 1 ? 's' : '') + ' here.'} Pays: ${outText(bd[k])}." data-act="slot" data-uid="${b.uid}" data-k="${k}" aria-pressed="${on}">${dots}${outChips(bd[k])}</button>`;
      }).join('');
      return `<div class="bcard" data-id="${b.id}"><div class="art">${A.sprite(b.id)}</div><div class="nm"><span>${bd.name}</span><span class="ty ${bd.type}">${I(bd.type)}</span></div>
        ${bd.auto ? `<div class="fx">Always: ${outChips(bd.auto)}</div>` : ''}<div class="slots">${slots}</div></div>`;
    }).join('');
    return `<div class="table"><div class="hd"><h2>${s.final ? 'Final income' : 'Assign your workers'}</h2>
      <span class="muted">${I('worker')} <b class="num">${used}</b> of ${p.workers} working. Wages: ${p.workers} ${I('silver')} (idle workers are paid too).</span></div>
      <p class="hint">${s.final ? 'One last harvest before the ledger closes.' : 'Tap a slot to put a worker there. Everyone assigns in secret, then income is collected.'}</p>
      <div class="cards">${cards}</div>
      <div class="notice">This round you collect: ${chips.join(' ') || 'nothing yet'} <span class="faint">(plus ${p.lines} from spur lines included)</span></div>
      <div class="row wrap"><button class="btn" data-act="ready">Ready</button><button class="btn ghost" data-act="suggest">Suggest</button><button class="btn ghost" data-act="clear">Clear</button></div></div>`;
  }
  function bidPanel(s, p) {
    const myTurn = s.bidTurn === p.id;
    const advise = s.opts.advisor;
    const aucs = s.auctions.map(a => {
      const t = a.tile, legal = HS.legalBids(s, p.id, a.idx);
      const holder = a.holder === 'N' ? 'Neutral bidder' : a.holder == null ? '' : a.holder === p.id ? 'You' : s.players[a.holder].name;
      const mini = t.noBuild ? '' : HS.eligible(s, t).map(id => {
        const q = HS.quoteBuild(s, p, id);
        return `<span class="mb ${q.ok ? 'ok' : 'no'}" data-act="bld" data-id="${id}">${A.sprite(id)}${BMAP[id].name}</span>`;
      }).join('') || '<span class="faint">No buildings available</span>';
      let adv = '';
      if (advise && !t.noBuild || advise && t.noBuild) { const r = B.advise(s, p.id, a.idx, 2); if (r) adv = `<div class="faint">Advisor: worth about ${Math.max(0, r.worth)} silver${r.id ? ' (' + BMAP[r.id].name + ')' : ''}</div>`; }
      const lad = LADDER.filter(x => x >= Math.max(3, a.bid)).map(x => `<button class="lad" data-tip="${myTurn && legal.includes(x) ? 'Bid ' + x + ' silver on ' + esc(t.name) + '. You pay only if you win. If you are outbid you bid again.' : myTurn ? 'Not allowed: you must beat the current bid, and you must be able to build here.' : 'Wait for your turn.'}" data-act="bid" data-a="${a.idx}" data-amt="${x}" ${myTurn && legal.includes(x) ? '' : 'disabled'}>${x}</button>`).join('');
      return `<div class="auc ${a.holder === p.id ? 'mine' : ''}"><div class="tn" data-tip="${esc(t.name)}: the winner may ${t.noBuild ? 'not build, but takes the bonus' : 'build a ' + t.types.map(x => D.TYPES[x]).join(' or ') + ' building'}. Bonus when won: ${t.bonus ? outText(t.bonus) : 'none'}.${a.idx === 0 ? ' Winning this auction also gives you the start marker.' : ''}">${t.name} <span class="faint">${a.idx === 0 ? '(start marker)' : ''}</span></div>
        <div class="row wrap">${t.types.map(typeChip).join('')}${tileBonusChips(t)}</div>
        <div class="bidnow">${a.bid ? `<span class="coin ${a.holder === 'N' ? 'neutral' : ''} stamp" key="${a.bid}">${a.bid}</span><span>${holder}</span>` : '<span class="faint">No bids yet</span>'}</div>
        <div class="mini">${mini}</div>${adv}
        ${!t.noBuild && !HS.canBuildAny(s, p, t) ? '<div class="faint">You cannot afford to build here.</div>' : ''}
        <div class="ladder">${lad}</div></div>`;
    }).join('');
    return `<div class="table"><div class="hd"><h2>Auctions</h2><span class="muted">${myTurn ? 'Your turn: bid or pass.' : 'Waiting for ' + esc(s.bidTurn != null && s.players[s.bidTurn] ? s.players[s.bidTurn].name : 'the next bidder') + '. You can still watch the auctions.'}</span></div>
      <p class="hint">Raise a bid to take the lead; if you are outbid you get to bid again. Winning an auction lets you build. Passing moves you along the rail but ends your bidding this round.</p>
      <div class="aucs">${aucs}</div>
      ${myTurn ? `<div class="panel" data-tip="Passing ends your bidding this round, but moves you along the rail for a reward. Wages are already paid, so passing never costs silver."><h3>${I('rail')} Pass and advance the railroad</h3>${railTrack(p)}<p class="hint">Next space gives: ${HS.railChoices(s, p).map(k => RAILNAME[k]).join(', ') || 'nothing'}.</p>${rewardButtons(s, p, 'pass', 'Pass (no reward)')}</div>` : ''}</div>`;
  }
  function buildPanel(s, p, st, extra) {
    const auc = s.auctions[st.auction];
    const ids = HS.eligible(s, auc.tile, extra);
    const sel = App.ui.sel && ids.includes(App.ui.sel) ? App.ui.sel : null;
    const cards = ids.map(id => {
      const q = HS.quoteBuild(s, p, id);
      return bcard(id, { tag: 'button', cls: (sel === id ? 'sel ' : '') + (q.ok ? '' : 'dis'), attrs: `data-act="pick" data-id="${id}"`, left: s.bsup[id],
        foot: `<div class="${q.ok ? 'faint' : ''}" style="font-size:13px">${q.ok ? (q.T ? `Buys goods: ${q.T} trade, ${q.S} silver` : 'You have everything') : '<span style="color:var(--bad)">' + q.why + '</span>'}</div>` });
    }).join('');
    let pay = '';
    if (sel) {
      const q = HS.quoteBuild(s, p, sel);
      const extraBid = extra && s.opts.trainExtra === 'bid' ? st.bid : 0, total = q.S + extraBid;
      const goldFree = Math.max(0, p.res.gold + q.buy.gold - q.need.gold - q.goldCL);
      const buys = ['wood', 'food', 'steel', 'gold'].filter(r => q.buy[r]).map(r => `${q.buy[r]} ${r}`).concat(['copper', 'livestock'].filter(r => q.clBuy[r]).map(r => `${q.clBuy[r]} ${r} (1 gold each)`));
      pay = `<div class="notice">${BMAP[sel].name}: ${buys.length ? 'you will buy ' + buys.join(', ') + ' using ' + q.T + ' trade token' + (q.T > 1 ? 's' : '') + ' and ' + q.S + ' silver' : 'paid from your stock'}${extraBid ? ', plus the bid again (' + extraBid + ')' : ''}.${q.landingPaid.copper + q.landingPaid.livestock ? ' River Landing: gold stands in for copper or livestock.' : ''}</div>`
        + payPanel(p, total, { act: 'buildGo', title: 'Silver for the build', btn: 'Build ' + BMAP[sel].name, maxGold: goldFree, maxTrades: p.trade - q.T, blocked: !q.ok });
    }
    return `<div class="table"><div class="hd"><h2>${extra ? 'Extra building' : 'Build on ' + auc.tile.name}</h2><span class="muted">${extra ? 'Junction Depot lets you build one more of any type.' : 'Choose a ' + auc.tile.types.map(t => D.TYPES[t]).join(' or ') + ' building.'}</span></div>
      <div class="cards">${cards}</div>${pay}${extra ? '<div class="row"><button class="btn ghost" data-act="skipExtra">Skip the extra building</button></div>' : ''}</div>`;
  }
  function resolvePanel(s, p) {
    const st = s.steps[0], auc = st.auction != null ? s.auctions[st.auction] : null;
    if (st.k === 'payBid') return `<div class="table"><div class="hd"><h2>You won ${auc.tile.name}</h2></div><p class="hint">Pay your winning bid. You can use gold, sell goods, or borrow.</p>${payPanel(p, st.amount, { act: 'payBid', title: 'Winning bid', btn: 'Pay ' + st.amount })}</div>`;
    if (st.k === 'build') return buildPanel(s, p, st, false);
    if (st.k === 'extra') return buildPanel(s, p, st, true);
    if (st.k === 'rail') return `<div class="table"><div class="hd"><h2>Advance on the rail</h2></div>${railTrack(p)}<p class="hint">Choose your reward.</p>${rewardButtons(s, p, 'railReward')}</div>`;
    if (st.k === 'pickRes') return `<div class="table"><div class="hd"><h2>Take a resource</h2></div><div class="row wrap">${RES.filter(r => s.sup[r] > 0).map(r => `<button class="btn" data-act="pickRes" data-res="${r}">${I(r)} ${cap(r)}</button>`).join('')}</div></div>`;
    return '';
  }
  function finalPanel(s, p) {
    const sc = HS.scoreOf(s, p);
    return `<div class="table"><div class="hd"><h2>Final accounts</h2><span class="muted">Last chance to trade and settle.</span></div>
      <p class="hint">Gold, copper and livestock are worth 2 VP each at the end, so selling them costs points even though each sale gives 1 VP. Debt costs 1, 2, 3... VP. Silver only breaks ties.</p>
      <div class="stats"><div class="stat"><b>${I('vp')}${sc.total}</b><span>Score now</span></div><div class="stat"><b>${sc.rarePts}</b><span>From ${sc.rare} rare goods</span></div><div class="stat ${sc.pen ? 'bad' : ''}"><b>${-sc.pen}</b><span>Debt penalty</span></div><div class="stat"><b>${sc.bonus}</b><span>Building bonuses</span></div></div>
      <div class="row"><button class="btn" data-act="finalDone">Close the ledger</button></div></div>`;
  }
  // read-only view of the auctions while another player resolves theirs (pays, builds, takes a rail reward)
  function watchPanel(s, p) {
    const who = HS.needs(s).map(x => s.players[x.p].name).filter((n, i, a) => a.indexOf(n) === i);
    const cur = s.steps[0], now = cur && cur.auction != null ? s.auctions[cur.auction] : null;
    const what = cur ? ({ payBid: 'paying for', build: 'choosing a building on', extra: 'choosing an extra building', rail: 'advancing on the rail', pickRes: 'picking a resource' }[cur.k] || 'resolving') : 'resolving';
    const cards = s.auctions.map(a => {
      const t = a.tile, holder = a.holder === 'N' ? 'Neutral bidder' : a.holder == null ? 'No bids' : a.holder === p.id ? 'You' : s.players[a.holder].name;
      return `<div class="auc ${a.holder === p.id ? 'mine' : ''}"><div class="tn">${esc(t.name)}</div><div class="row wrap">${t.types.map(typeChip).join('')}${tileBonusChips(t)}</div><div class="bidnow">${a.bid ? `<span class="coin ${a.holder === 'N' ? 'neutral' : ''}">${a.bid}</span><span>${holder}</span>` : '<span class="faint">No bids</span>'}</div>${now && now.idx === a.idx ? '<div class="faint">Resolving now</div>' : ''}</div>`;
    }).join('');
    return `<div class="table"><div class="hd"><h2>Auctions</h2><span class="muted">Waiting for ${esc(who.join(' and ') || 'the next step')}${cur && cur.k !== 'rail' && cur.k !== 'pickRes' && now ? ' (' + what + ' ' + esc(now.tile.name) + ')' : ''}.</span></div><p class="hint">The bidding is over. Winners now pay and build one at a time. Moves appear here as soon as they happen.</p><div class="aucs">${cards}</div></div>`;
  }
  function tablePanel(s, p) {
    const c = curNeed();
    if (!c && s.phase === 'bid') return bidPanel(s, p);
    if (!c && s.phase === 'resolve') return watchPanel(s, p);
    if (!c) {
      const who = HS.needs(s).map(x => s.players[x.p].name).filter((n, i, a) => a.indexOf(n) === i);
      return `<div class="table"><div class="hd"><h2>Waiting</h2></div><p class="hint">${who.length ? 'Waiting for ' + esc(who.join(' and ')) + '.' : 'Working...'} ${App.net ? 'Moves sync as soon as everyone has chosen.' : ''}</p></div>`;
    }
    switch (s.phase) {
      case 'assign': return assignPanel(s, p);
      case 'wages': return `<div class="table"><div class="hd"><h2>Wages</h2></div><p class="hint">Every worker costs 1 silver, working or not. A gold cube pays for up to five.</p>${payPanel(p, p.workers, { act: 'payWages', title: 'Wages', btn: 'Pay wages' })}</div>`;
      case 'neutralPick': return `<div class="table"><div class="hd"><h2>Place the neutral bid</h2></div><p class="hint">The neutral bidder opens at ${HS.neutralValue(s)} on one auction.</p><div class="row wrap">${s.auctions.map(a => `<button class="btn" data-act="neutral" data-a="${a.idx}">${a.tile.name}</button>`).join('')}</div></div>`;
      case 'bid': return bidPanel(s, p);
      case 'resolve': return resolvePanel(s, p);
      case 'finalTrade': return finalPanel(s, p);
    }
    return '';
  }

  // ------------------------------------------------------------ side panels
  function marketPanel(s, p, on) {
    const rows = RES.map(r => {
      const cl = r === 'copper' || r === 'livestock';
      const price = cl ? `1 ${I('gold')}` : `${PRICE[r]} ${I('silver')}`;
      const canBuy = on && p.trade >= 1 && s.sup[r] > 0 && (cl ? p.res.gold >= 1 : p.silver >= PRICE[r]);
      const canSell = on && p.trade >= 1 && p.res[r] >= 1 && (!cl || s.sup.gold >= 1);
      const why = (what) => !on ? 'Not your decision right now.' : p.trade < 1 ? 'You need a trade token.' : what;
      const buyWhy = canBuy ? 'Buy 1 ' + r + ' for ' + (cl ? '1 gold' : PRICE[r] + ' silver') + ' and 1 trade token.' : why(s.sup[r] <= 0 ? 'The supply of ' + r + ' is empty.' : cl ? 'You need a gold to pay.' : 'You need ' + PRICE[r] + ' silver.');
      const sellWhy = canSell ? 'Sell 1 ' + r + ' for ' + (cl ? '1 gold' : PRICE[r] + ' silver') + (HS.has(p, 'drygoods') && !cl ? ' (+1 from Dry Goods)' : '') + ', 1 trade token. Scores 1 VP.' : why(p.res[r] < 1 ? 'You have none to sell.' : 'No gold left in the supply.');
      return `<div class="resrow">${I(r)}<span>${cap(r)} <span class="faint">${price}</span> <span class="faint">(${s.sup[r] > 900 ? 'plenty' : s.sup[r] + ' left'})</span></span><span class="have num">${p.res[r]}</span><span class="mk"><button data-tip="${buyWhy}" data-act="buy" data-r="${r}" ${canBuy ? '' : 'disabled'}>Buy</button><button data-tip="${sellWhy}" data-act="sell" data-r="${r}" ${canSell ? '' : 'disabled'}>Sell</button></span></div>`;
    }).join('');
    const extras = [];
    extras.push(`<button class="btn small ghost" data-tip="Hire a worker: costs 1 trade token and 1 food. Every worker costs 1 silver in wages each round, so only hire if you have a slot for them." data-act="hire" ${on && p.trade >= 1 && p.res.food >= 1 && s.sup.worker > 0 ? '' : 'disabled'}>Hire worker (1 ${I('trade')} + 1 ${I('food')})</button>`);
    if (HS.has(p, 'bazaar')) {
      extras.push(`<button class="btn small ghost" data-tip="Bazaar: spend 1 trade token to turn 1 wood into 1 food." data-act="convert" data-from="wood" ${on && p.trade >= 1 && p.res.wood >= 1 && s.sup.food > 0 ? '' : 'disabled'}>Wood to food</button>`);
      extras.push(`<button class="btn small ghost" data-tip="Bazaar: spend 1 trade token to turn 1 food into 1 steel." data-act="convert" data-from="food" ${on && p.trade >= 1 && p.res.food >= 1 && s.sup.steel > 0 ? '' : 'disabled'}>Food to steel</button>`);
    }
    extras.push(`<button class="btn small ghost" data-tip="Borrow: take 1 IOU and 2 silver now. Unpaid IOUs cost 1, 2, 3... VP in total at the end, so the second one hurts more." data-act="debt" data-n="1" ${on && s.sup.debt > 0 ? '' : 'disabled'}>Take IOU (+2 ${I('silver')})</button>`);
    extras.push(`<button class="btn small ghost" data-tip="Repay 1 IOU for 5 silver." data-act="repay" data-gold="0" ${on && p.debt >= 1 && p.silver >= 5 ? '' : 'disabled'}>Repay (5 ${I('silver')})</button>`);
    extras.push(`<button class="btn small ghost" data-tip="Repay 1 IOU with 1 gold cube." data-act="repay" data-gold="1" ${on && p.debt >= 1 && p.res.gold >= 1 ? '' : 'disabled'}>Repay (1 ${I('gold')})</button>`);
    return `<div class="panel"><h3>Market</h3>${rows}<p class="faint" style="margin:6px 0">Each trade uses 1 trade token. Each sale scores 1 VP.</p><div class="row wrap">${extras.join('')}</div></div>`;
  }
  function ledgerPanel(s, p) {
    const sc = HS.scoreOf(s, p);
    return `<div class="panel"><h3>${esc(poss(p.name))} ledger</h3><div class="stats">
      <div class="stat"><b>${I('silver')}<span class="num">${p.silver}</span></b><span>Silver</span></div>
      <div class="stat"><b>${I('trade')}<span class="num">${p.trade}</span></b><span>Trade tokens</span></div>
      <div class="stat"><b>${I('vp')}<span class="num">${p.vp}</span></b><span>VP chits</span></div>
      <div class="stat"><b>${I('worker')}<span class="num">${p.workers}</span></b><span>Workers</span></div>
      <div class="stat"><b>${I('line')}<span class="num">${p.lines}</span></b><span>Spur lines</span></div>
      <div class="stat ${p.debt ? 'bad' : ''}"><b>${I('debt')}<span class="num">${p.debt}</span></b><span>IOUs</span></div></div>
      <p class="faint" style="margin:8px 0 0">Score if the game ended now: <b class="num" style="color:var(--ink)">${sc.total}</b></p></div>`;
  }
  function lotsPanel(s) {
    const groups = { R: [], I: [], C: [], S: [] };
    Object.keys(s.bsup).forEach(id => { if (s.bsup[id] > 0) groups[BMAP[id].type].push(id); });
    const grp = t => groups[t].length ? `<div class="grp"><b>${I(t)} ${D.TYPES[t]}</b>${groups[t].map(id => `<button class="lotrow" data-act="bld" data-id="${id}">${A.sprite(id)}<span>${BMAP[id].name} <span class="era">${costHTML(BMAP[id])}</span></span><span class="num">x${s.bsup[id]}</span></button>`).join('')}</div>` : '';
    const nextKey = s.round < 5 ? 'B' : s.round < 9 ? 'C' : null;
    const next = nextKey ? Object.keys(s.reserve[nextKey]).map(id => BMAP[id].name).join(', ') : '';
    const sup = RES.map(r => `<span class="chip">${I(r)}${s.sup[r] > 900 ? '∞' : s.sup[r]}</span>`).join('') + `<span class="chip">${I('trade')}${s.sup.trade}</span><span class="chip">${I('worker')}${s.sup.worker}</span><span class="chip">${I('debt')}${s.sup.debt}</span>`;
    return `<div class="panel lots"><h3>Lots for sale</h3>${grp('R')}${grp('I')}${grp('C')}${grp('S')}
      ${nextKey ? `<p class="faint" style="margin:0 0 8px">Round ${nextKey === 'B' ? 5 : 9} brings: ${next}.</p>` : ''}<h3 style="font-size:15px">Supply</h3><div class="row wrap" style="gap:4px">${sup}</div></div>`;
  }
  function logPanel(s) {
    return `<div class="panel"><h3>Log</h3><div class="log" id="logbox">${s.log.slice(-40).map(l => `<div>${esc(l)}</div>`).join('')}</div></div>`;
  }

  // ------------------------------------------------------------ game screen
  function topBar(s) {
    const st = s.round <= 4 ? 'A' : s.round <= 8 ? 'B' : 'C';
    const stakes = Array.from({ length: 10 }, (_, i) => { const r = i + 1; const k = r <= 4 ? 'A' : r <= 8 ? 'B' : 'C'; const stk = r === 5 ? ' Town buildings open and unbuilt Settlement-only lots are cleared.' : r === 9 ? ' City buildings open and every unbuilt lot is cleared.' : r === 10 ? ' The last round, then a final income and settle-up.' : '';
      return `<div class="stake ${k} ${r < s.round || (r === s.round && s.over) ? 'done' : ''} ${r === s.round && !s.over ? 'now' : ''}" data-tip="Round ${r} of 10, ${STAGE[k]} stage.${stk}">${r}</div>`; }).join('');
    const title = { assign: s.final ? 'Final income' : 'Assign workers', wages: 'Wages', bid: 'Auctions', resolve: 'Building', finalTrade: 'Final accounts', neutralPick: 'Neutral bid', over: 'Game over' }[s.phase] || '';
    return `<div class="top"><div class="brand">${I('stake')}Claimstake</div>
      <div class="ribbon">${stakes}<div class="stagebar"><span>Settlement</span><span>Town</span><span>City</span></div></div>
      <div class="col" style="gap:0;text-align:right"><span class="phase">${title}</span><span class="faint">Round ${s.round} of 10, ${STAGE[st]}</span></div>
      <div class="row"><button class="iconbtn" data-act="sound" data-tip="Sound" aria-label="Toggle sound">${prof.sound ? '♪' : '♩'}</button><button class="iconbtn" data-act="theme" data-tip="Theme" aria-label="Toggle theme">◐</button><button class="iconbtn" data-act="gmenu" data-tip="Menu" aria-label="Menu">≡</button></div></div>`;
  }
  function oppsStrip(s, v) {
    const c = curNeed();
    return `<div class="opps">${s.players.filter(p => p.id !== v.id).map(p => {
      const rail = Array.from({ length: 5 }, (_, i) => `<i class="${i < p.advances ? 'on' : ''}"></i>`).join('');
      const res = RES.filter(r => p.res[r]).map(r => `<span>${I(r)}${p.res[r]}</span>`).join('');
      const status = s.phase === 'bid' ? (p.passed ? 'passed' : p.hasBid ? 'leading' : '') : '';
      return `<div class="opp ${c && c.p === p.id ? 'turn' : ''}" data-act="opp" data-p="${p.id}" role="button" tabindex="0"><div class="nm"><span><span style="color:${PCOL[p.id]}">●</span> ${esc(p.name)}</span><span class="faint">${p.kind === 'bot' ? LVL[p.level] : 'Human'}${status ? ', ' + status : ''}</span></div>
        <div class="st"><span>${I('silver')}${p.silver}</span><span>${I('vp')}${p.vp}</span><span>${I('worker')}${p.workers}</span><span>${I('trade')}${p.trade}</span>${p.debt ? `<span style="color:var(--bad)">${I('debt')}${p.debt}</span>` : ''}<span>${p.blds.length} bld</span></div>
        <div class="st">${res || '<span class="faint">no goods</span>'}<span class="pips" data-tip="Rail track: ${p.advances} of 5 spaces passed.">${rail}</span></div></div>`;
    }).join('')}</div>`;
  }
  function renderGame() {
    const s = App.s, c = curNeed(), humans = s.players.filter(p => p.kind === 'human');
    if (s.over) return renderOver();
    if (!App.net && humans.length > 1 && c && App.ui.curtainFor !== c.p) {
      const pl = s.players[c.p];
      return `<div class="veil curtain"><div class="sheet"><h1 style="font-size:36px">Pass the screen to ${esc(pl.name)}</h1><p class="muted">Other players, look away. ${esc(pl.name)}: your secrets stay hidden until you continue.</p><div><button class="btn" data-act="curtain" data-p="${pl.id}">I am ${esc(pl.name)}</button></div></div></div>`;
    }
    const v = viewer(), on = !!c && c.p === v.id && s.phase !== 'neutralPick';
    const key = s.phase + ':' + s.round + ':' + s.wageQueue.length + ':' + s.bidTurn + ':' + (s.steps[0] ? JSON.stringify(s.steps[0]) : '') + ':' + v.id;
    if (key !== App.ui.payKey) { App.ui.payKey = key; App.ui.pay = { gold: 0, trades: 0 }; App.ui.sel = null; }
    if (s.round !== App.ui.lastRound) { App.ui.lastRound = s.round; App.ui.dawnAt = Date.now(); }
    const dEl = Date.now() - (App.ui.dawnAt || 0), dawn = dEl < 2600 ? Math.max(0, Math.round(dEl)) : null;
    const dawnHTML = dawn == null ? '' : `<div class="dawnveil" style="--d:-${dawn}ms"></div><div class="dawntitle" style="--d:-${dawn}ms"><small>${STAGE[s.round <= 4 ? 'A' : s.round <= 8 ? 'B' : 'C']}</small><b>Round ${s.round}</b></div>`;
    const tab = App.ui.tab, pane = (id, html) => `<section class="pane ${tab === id ? 'on' : ''}" data-pane="${id}">${html}</section>`;
    return `${dawnHTML}<div class="top-wrap">${topBar(s)}</div>${oppsStrip(s, v)}
      <div class="main"><div class="col">${pane('play', tablePanel(s, v))}${pane('town', sceneHTML(v, { dawn }) + '<div class="panel"><h3>Your buildings</h3><div class="mini">' + v.blds.map(b => `<span class="mb" data-act="bld" data-id="${b.id}">${A.sprite(b.id)}${BMAP[b.id].name}</span>`).join('') + '</div></div>')}</div>
      <div class="col">${pane('market', ledgerPanel(s, v) + marketPanel(s, v, on))}${pane('lots', lotsPanel(s) + logPanel(s))}</div></div>
      <nav class="tabs">${[['play', 'Play'], ['town', 'Town'], ['market', 'Market'], ['lots', 'Lots']].map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-act="tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</nav>`;
  }

  // ------------------------------------------------------------ scoring screen
  function renderOver() {
    const s = App.s, res = s.result, sc = res.scores;
    const hdr = s.players.map(p => `<th>${esc(p.name)}</th>`).join('');
    const cell = (f, cls) => s.players.map((p, i) => `<td class="${cls ? cls(i) : ''}">${f(sc[i], p)}</td>`).join('');
    const win = i => res.winners.includes(i) ? 'win' : '';
    const winNames = res.winners.map(i => esc(s.players[i].name)).join(' and ');
    const humans = s.players.filter(p => p.kind === 'human');
    const iWon = humans.length === 1 && res.winners.includes(humans[0].id);
    const bonuses = s.players.map((p, i) => `<td>${sc[i].items.map(x => `${x.name}: ${x.count}`).join('<br>') || '<span class="faint">none</span>'}</td>`).join('');
    const ach = (s.unlocked || []).map(id => ACH.find(a => a[0] === id)).filter(Boolean);
    return `<div class="top"><div class="brand">${I('stake')}Claimstake</div></div>
      <div class="panel" style="display:grid;gap:14px"><div class="banner">${res.winners.length > 1 ? 'Shared win: ' : ''}${winNames} ${res.winners.length > 1 ? '' : 'wins'}</div>
      ${iWon ? '<p class="muted" style="text-align:center;margin:0">The ledger is closed in your favour.</p>' : ''}
      <div class="tblwrap"><table class="scoretbl"><thead><tr><th></th>${hdr}</tr></thead><tbody>
        <tr><td data-tip="Victory points collected during play from selling goods, rewards, tiles and buildings.">VP chits</td>${cell(x => x.vp, win)}</tr>
        <tr><td data-tip="Printed points on each building you own.">Building points</td>${cell(x => x.bldPts, win)}</tr>
        <tr><td data-tip="Final scoring printed on buildings, such as 1 VP per Industrial building.">Building bonuses</td>${cell(x => x.bonus, win)}</tr>
        <tr><td class="faint">How the bonuses were earned</td>${bonuses}</tr>
        <tr><td data-tip="Each gold, copper or livestock you still hold scores 2 VP.">Gold, copper, livestock (2 each)</td>${cell(x => x.rare + ' = ' + x.rarePts, win)}</tr>
        <tr><td data-tip="Unpaid IOUs cost 1, 2, 3... VP in total.">Debt penalty</td>${cell(x => (x.debt ? x.debt + ' IOU = ' : '') + (-x.pen), win)}</tr>
        <tr><td data-tip="Silver scores nothing, but breaks a tie.">Silver (tie-break)</td>${cell(x => x.silver, win)}</tr>
        <tr class="total"><td>Total</td>${cell(x => x.total, win)}</tr></tbody></table></div>
      ${ach.length ? `<div class="notice"><b>New stakes earned:</b> ${ach.map(a => a[1]).join(', ')}</div>` : ''}
      ${s.daily ? `<div class="notice">Daily Claim ${s.daily}: your best today is ${prof.daily[s.daily]}.</div>` : ''}
      <div class="row wrap" style="justify-content:center"><button class="btn" data-act="again">Play again</button><button class="btn ghost" data-act="tomenu">Main menu</button></div></div>
      <div class="conf" id="conf"></div>`;
  }
  function confetti() {
    const box = document.getElementById('conf'); if (!box) return;
    const cols = ['#f2b34c', '#7ec8e3', '#c590d6', '#8fc08a', '#e0705a'];
    for (let i = 0; i < 46; i++) { const e = document.createElement('i'); e.style.left = Math.random() * 100 + 'vw'; e.style.background = cols[i % 5]; e.style.animationDuration = 2.4 + Math.random() * 2.4 + 's'; e.style.animationDelay = Math.random() * .8 + 's'; box.appendChild(e); }
    setTimeout(() => { box.innerHTML = ''; }, 6500);
  }

  // ------------------------------------------------------------ menu
  function optSelect(d, val) {
    const idx = Math.max(0, d.choices.findIndex(c => c[0] === val));
    return `<div class="opt"><div class="row wrap"><b>${d.label}</b><span class="tag ${d.tag}">${d.tag === 'confirmed' ? 'from the rules' : d.tag === 'designed' ? 'my call' : 'interface'}</span></div>
      <select data-opt="${d.key}" aria-label="${d.label}">${d.choices.map((c, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>${c[1]}</option>`).join('')}</select><span class="faint">${d.help}</span></div>`;
  }
  function renderMenu() {
    const m = App.menu, save = loadJSON('claimstake.save', null);
    const opts = Object.assign(HS.defaultOpts(), m.opts);
    const demo = { name: 'Your town', blds: ['cabin', 'wheatfield', 'bazaar', 'smelter', 'meetinghouse', 'bigtop', 'livery', 'lodge'].map((id, i) => ({ uid: i + 1, id })), assign: {}, advances: 4, lines: 2 };
    const seat = i => {
      const st = m.seats[i], isH = st.kind === 'human';
      return `<div class="row wrap"><span style="width:1.5em;color:${PCOL[i]}">●</span>
        <select data-seat="${i}" data-f="kind" aria-label="Seat ${i + 1}" style="width:auto;flex:1;min-width:150px">${['human', 1, 2, 3].map(k => `<option value="${k}" ${st.kind === k ? 'selected' : ''}>${k === 'human' ? 'Human' : 'Bot: ' + LVL[k]}</option>`).join('')}</select>
        ${isH ? `<input type="text" data-seat="${i}" data-f="name" value="${esc(st.name || 'Player ' + (i + 1))}" maxlength="14" aria-label="Name for seat ${i + 1}" style="width:130px">` : ''}</div>`;
    };
    const lvlDesc = '<span class="faint">Greenhorn is easy, Homesteader is a fair match, Land Baron plays its best.</span>';
    const ds = todayStr(), dsc = prof.daily[ds];
    return `<div class="hero"><h1 class="sr">Claimstake</h1>${window.CLAIM_COVER ? `<img class="cover" src="${window.CLAIM_COVER}" alt="Claimstake: a frontier town at sunrise with a survey stake, auction coins and a ledger in the foreground" width="1152" height="941">` : `<h1>Claimstake</h1>${sceneHTML(demo, { assign: false })}`}<p>Ten rounds to stake a claim, win the auctions, and build the best frontier town. Work your people, bid for lots, hold the rail.</p>
      <div class="row wrap" style="justify-content:center">${save ? '<button class="btn" data-act="continue">Continue game</button>' : ''}<button class="btn ${save ? 'ghost' : ''}" data-act="start">New game</button>${Net.ready ? '<button class="btn ghost" data-act="online">Play online</button>' : ''}<button class="btn ghost" data-act="daily">${dsc != null ? 'Daily Claim (best ' + dsc + ')' : 'Daily Claim'}</button><button class="iconbtn" data-act="theme" data-tip="Theme" aria-label="Toggle theme">◐</button><button class="iconbtn" data-act="sound" data-tip="Sound">${prof.sound ? '♪' : '♩'}</button></div></div>
      <div class="menu">
        <div class="panel"><h3>New game</h3><div class="field"><label>Players</label><div class="seg">${[2, 3, 4].map(n => `<button class="${m.n === n ? 'on' : ''}" data-act="pn" data-n="${n}">${n}</button>`).join('')}</div></div>
          <div class="grp" style="display:grid;gap:8px;margin-top:10px">${Array.from({ length: m.n }, (_, i) => seat(i)).join('')}</div>${lvlDesc}
          <div class="field" style="margin-top:10px"><label>Seed (optional)</label><input type="text" data-f="seed" value="${esc(m.seed)}" placeholder="Leave blank for a random deal"></div>
          <p class="faint">More than one human plays hot-seat: the screen hides between turns.</p></div>
        <div class="panel"><h3>Rules and options</h3><p class="faint" style="margin-top:0">Where the rules were unclear, you can choose. Defaults are my best reading.</p>${D.OPTION_DEFS.map(d => optSelect(d, opts[d.key])).join('')}</div>
        <div class="panel"><h3>Daily Claim</h3><p class="muted" style="margin-top:0">One shared deal per day, you against a Land Baron. Same cards for everyone, so scores compare.</p>
          <div class="stats"><div class="stat"><b>${dailyStreak()}</b><span>Day streak</span></div><div class="stat"><b>${dsc != null ? dsc : '-'}</b><span>Today's best</span></div></div>
          <h3 style="margin:14px 0 8px">Record</h3><div class="stats"><div class="stat"><b>${prof.games}</b><span>Games</span></div><div class="stat"><b>${prof.wins}</b><span>Wins</span></div><div class="stat"><b>${prof.best || '-'}</b><span>Best score</span></div><div class="stat"><b>${prof.streak}</b><span>Win streak</span></div></div></div>
        <div class="panel"><h3>Stakes earned</h3><div class="ach">${ACH.map(a => `<div class="${prof.ach[a[0]] ? 'got' : ''}"><b>${a[1]}</b>${a[2]}</div>`).join('')}</div></div>
      </div>
      <details class="fold"><summary>How to play</summary><div style="display:grid;gap:6px;margin-top:8px">${D.RULE_NOTES.map(r => `<div class="row" style="align-items:flex-start"><span class="tag ${r[0]}">${r[0] === 'confirmed' ? 'rule' : 'my call'}</span><span>${r[1]}</span></div>`).join('')}</div></details>
      <p class="faint" style="text-align:center">Original theme and auction tiles. Building numbers follow the supplied reference table.</p>`;
  }

  // ------------------------------------------------------------ modal
  function renderModal() {
    const m = App.ui.modal, s = App.s; if (!m) return '';
    let body = '';
    if (m.type === 'bld') body = `<h2>${BMAP[m.id].name}</h2>${bcard(m.id, { left: s ? s.bsup[m.id] : null })}<div class="row"><button class="btn" data-act="close">Close</button></div>`;
    else if (m.type === 'opp') { const p = s.players[m.p]; body = `<h2>${esc(p.name)}</h2>${sceneHTML(p, { assign: false })}<div class="row wrap">${RES.filter(r => p.res[r]).map(r => resChip(r, p.res[r])).join('') || '<span class="faint">No goods</span>'}</div><div class="row"><button class="btn" data-act="close">Close</button></div>`; }
    else if (m.type === 'menu') body = `<h2>Menu</h2><div class="row wrap"><button class="btn" data-act="close">Resume</button><button class="btn ghost" data-act="rules">Rules</button><button class="btn ghost" data-act="tomenu">Save and leave</button><button class="btn warn" data-act="abandon">Abandon game</button></div>`;
    else if (m.type === 'rules') body = `<h2>Rules in this game</h2><div style="display:grid;gap:6px">${D.RULE_NOTES.map(r => `<div class="row" style="align-items:flex-start"><span class="tag ${r[0]}">${r[0] === 'confirmed' ? 'rule' : 'my call'}</span><span>${r[1]}</span></div>`).join('')}</div><div class="row"><button class="btn" data-act="close">Close</button></div>`;
    return `<div class="veil" data-act="veil"><div class="sheet ${m.type === 'opp' ? 'wide' : ''}" role="dialog" aria-modal="true">${body}</div></div>`;
  }

  // ------------------------------------------------------------ render
  function render() {
    const el = root(); if (!el) return;
    let html = '';
    if (App.view === 'menu') html = renderMenu();
    else if (App.view === 'online') html = renderOnline();
    else html = renderGame() + renderModal();
    hideTip();
    el.innerHTML = html;
    if (App.view === 'game' && App.s) {
      App.ui.seenUid = App.s.uidn - 1;
      const lb = document.getElementById('logbox'); if (lb) lb.scrollTop = lb.scrollHeight;
      if (App.s.over && !App.ui.confetti) { App.ui.confetti = true; const hs = App.s.players.filter(p => p.kind === 'human'); if (hs.length === 1 && App.s.result.winners.includes(hs[0].id)) { confetti(); sfx('win'); } }
    }
  }

  // ------------------------------------------------------------ events
  const P = () => viewer();
  const ACT = {
    // menu
    pn(el) { App.menu.n = +el.dataset.n; render(); },
    start() { launch(false); },
    daily() { launch(true); },
    continue() {
      const sv = loadJSON('claimstake.save', null);
      if (!sv) return;
      App.s = sv.s; App.cfg = sv.cfg; App.view = 'game';
      App.ui = Object.assign(App.ui, { lastRound: 0, tab: 'play', sel: null, payKey: '', curtainFor: -1, evSeen: sv.s.events.length, seenUid: sv.s.uidn - 1, modal: null, confetti: false });
      B.runBots(App.s); render();
    },
    online() { const mm = App.menu; if (!mm.seats.slice(1, mm.n).some(x => x.kind === 'human')) mm.seats[1].kind = 'human'; App.view = 'online'; App.ui.oerr = ''; render(); },
    ohost() { netHost(); },
    ojoin() { netJoin(App.ui.code); },
    oresume() { netResume(); },
    orejoin() { netRejoin(); },
    ostart() { netHostStart(); },
    oseat(el) {
      const n = App.net; if (!n || n.role !== 'host' || n.meta.status !== 'lobby') return;
      const x = n.meta.seats[+el.dataset.i]; if (!x || x.uid || +el.dataset.i === 0) return;
      if (x.kind === 'bot') { x.lvl = x.level; x.kind = 'human'; x.name = ''; delete x.level; }
      else { x.kind = 'bot'; x.level = x.lvl || 2; x.name = BOTNAMES[(+el.dataset.i - 1) % 3]; }
      netPublish(); render();
    },
    ocopy() {
      const n = App.net; if (!n) return;
      const url = location.href.split('#')[0].split('?')[0] + '?join=' + n.meta.code;
      const done = () => toast('Invite link copied', 'ok');
      try { navigator.clipboard.writeText(url).then(done, () => toast(url, 'ok')); } catch (e) { toast(url, 'ok'); }
    },
    oleave() { netLeave(); App.view = App.s ? 'game' : 'online'; if (!App.s) App.view = 'online'; render(); },
    sound() { prof.sound = !prof.sound; saveProf(); if (prof.sound) sfx('coin'); render(); },
    theme() { const cur = document.documentElement.getAttribute('data-theme'); const dark = cur ? cur === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches; setTheme(dark ? 'light' : 'dark'); },
    // game chrome
    tab(el) { App.ui.tab = el.dataset.t; render(); window.scrollTo(0, 0); },
    bld(el) { App.ui.modal = { type: 'bld', id: el.dataset.id }; render(); },
    opp(el) { App.ui.modal = { type: 'opp', p: +el.dataset.p }; render(); },
    gmenu() { App.ui.modal = { type: 'menu' }; render(); },
    rules() { App.ui.modal = { type: 'rules' }; render(); },
    close() { App.ui.modal = null; render(); },
    veil(el, ev) { if (ev.target === el) { App.ui.modal = null; render(); } },
    curtain(el) { App.ui.curtainFor = +el.dataset.p; render(); },
    tomenu() { save(); netLeave(); App.view = 'menu'; App.ui.modal = null; render(); },
    abandon() { lsDel('claimstake.save'); netLeave(); App.s = null; App.view = 'menu'; App.ui.modal = null; render(); },
    again() { if (App.net) { netLeave(); App.view = 'menu'; App.s = null; render(); return; } const cfg = clone(App.cfg); cfg.seed = String(Date.now()); startGame(cfg, App.s.daily ? null : null); },
    // economy
    buy(el) { dispatch({ type: 'buy', res: el.dataset.r, qty: 1 }, 'coin'); },
    sell(el) { dispatch({ type: 'sell', res: el.dataset.r, qty: 1 }, 'coin'); },
    hire() { dispatch({ type: 'hire', qty: 1 }); },
    convert(el) { dispatch({ type: 'convert', from: el.dataset.from, qty: 1 }); },
    debt(el) { dispatch({ type: 'takeDebt', qty: +el.dataset.n || 1 }, 'coin'); },
    repay(el) { dispatch({ type: 'repay', qty: 1, plan: { gold: +el.dataset.gold, trades: 0 } }, 'coin'); },
    // assign
    slot(el) {
      const p = P(), a = clone(p.assign), u = el.dataset.uid, k = el.dataset.k;
      a[u] = a[u] || {}; a[u][k] = a[u][k] ? 0 : HS.slotCap(k);
      const e = HS.validAssign(p, a);
      if (e) { toast(e === 'more workers than you have' ? 'No idle workers left. Free a slot or hire a worker.' : cap(e), 'bad'); return; }
      HS.apply(App.s, { type: 'assign', p: p.id, assign: a }); sfx(); render();
    },
    suggest() { const p = P(); const r = B.bestAssign(App.s, p, p.blds, B.W(B.LEVELS[2]), p.workers); HS.apply(App.s, { type: 'assign', p: p.id, assign: r.assign }); render(); },
    clear() { HS.apply(App.s, { type: 'assign', p: P().id, assign: {} }); render(); },
    ready() {
      if (App.net && App.net.role === 'client') {
        const p = viewer();
        netEnqueue({ type: 'assign', assign: clone(p.assign) });
        dispatch({ type: 'ready' });
      } else dispatch({ type: 'ready' });
    },
    // payments
    pg(el) { App.ui.pay.gold += +el.dataset.d; render(); },
    pt(el) { App.ui.pay.trades += +el.dataset.d; render(); },
    payWages() { dispatch({ type: 'payWages', plan: { gold: App.ui.pay.gold, trades: App.ui.pay.trades } }, 'coin'); },
    payBid() { dispatch({ type: 'payBid', plan: { gold: App.ui.pay.gold, trades: App.ui.pay.trades } }, 'coin'); },
    pick(el) { App.ui.sel = el.dataset.id; App.ui.pay = { gold: 0, trades: 0 }; render(); },
    buildGo() { const id = App.ui.sel; if (id && dispatch({ type: 'build', id, plan: { gold: App.ui.pay.gold, trades: App.ui.pay.trades } }, 'build')) App.ui.sel = null; },
    skipExtra() { dispatch({ type: 'skipExtra' }); },
    // bidding
    bid(el) { dispatch({ type: 'bid', auction: +el.dataset.a, amount: +el.dataset.amt }, 'coin'); },
    pass(el) { dispatch({ type: 'pass', reward: el.dataset.reward || undefined, res: el.dataset.res }); },
    neutral(el) { dispatch({ type: 'neutralPick', auction: +el.dataset.a }); },
    railReward(el) { dispatch({ type: 'railReward', reward: el.dataset.reward, res: el.dataset.res }); },
    pickRes(el) { dispatch({ type: 'pickRes', res: el.dataset.res }); },
    finalDone() { dispatch({ type: 'finalDone' }); },
  };

  function launch(daily) {
    const m = App.menu, players = [];
    if (daily) { players.push({ name: 'You', kind: 'human' }, { name: 'Bram', kind: 'bot', level: 3 }); }
    else {
      const seats = m.seats.slice(0, m.n).map(x => Object.assign({}, x));
      if (!seats.some(x => x.kind === 'human')) seats[0].kind = 'human';
      let b = 0;
      seats.forEach((x, i) => players.push(x.kind === 'human' ? { name: (x.name || 'Player ' + (i + 1)).trim() || 'Player ' + (i + 1), kind: 'human' } : { name: BOTNAMES[b++ % 3], kind: 'bot', level: x.kind }));
    }
    const opts = daily ? HS.defaultOpts() : Object.assign(HS.defaultOpts(), m.opts);
    const ds = todayStr();
    const seed = daily ? 'daily-' + ds : (m.seed.trim() || String(Date.now()));
    prof.last = { menu: { n: m.n, seats: m.seats, opts: m.opts, seed: m.seed } }; saveProf();
    startGame({ players, opts, seed }, daily ? { daily: ds } : null);
  }

  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const f = ACT[el.dataset.act];
    if (f) { if (el.disabled) return; f(el, ev); }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && App.ui.modal) { App.ui.modal = null; render(); return; }
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.getAttribute && ev.target.getAttribute('role') === 'button' && ev.target.dataset.act) {
      ev.preventDefault(); ACT[ev.target.dataset.act](ev.target, ev);
    }
  });
  document.addEventListener('change', ev => {
    const t = ev.target;
    if (t.dataset.opt) {
      const d = D.OPTION_DEFS.find(x => x.key === t.dataset.opt);
      App.menu.opts[d.key] = d.choices[+t.value][0]; return;
    }
    if (t.dataset.seat != null) {
      const i = +t.dataset.seat, f = t.dataset.f;
      if (f === 'kind') { App.menu.seats[i].kind = t.value === 'human' ? 'human' : +t.value; if (t.value === 'human' && !App.menu.seats[i].name) App.menu.seats[i].name = 'Player ' + (i + 1); render(); }
      else App.menu.seats[i].name = t.value;
      return;
    }
    if (t.dataset.f === 'seed') App.menu.seed = t.value;
    if (t.dataset.f === 'oname') { prof.name = t.value.slice(0, 14); saveProf(); }
    if (t.dataset.f === 'ocode') App.ui.code = t.value.toUpperCase().slice(0, 4);
  });
  let rz = null;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { const nw = innerWidth < 700; if (nw !== App.ui.narrow) { App.ui.narrow = nw; render(); } }, 150);
  });


  // ------------------------------------------------------------ hover tooltips
  function outText(o) {
    if (!o) return 'nothing';
    const nm = { trade: 'trade token', vp: 'VP', silver: 'silver', worker: 'worker', line: 'spur line' };
    return Object.keys(o).map(k => {
      const v = o[k];
      if (k === 'silverPerWorker') return '1 silver per worker (up to ' + v + ')';
      if (k === 'debtPay') return 'repay ' + v + ' IOU';
      if (k === 'rail') return 'advance on the rail';
      if (k === 'extra') return 'an extra building';
      if (k === 'resource') return 'any resource';
      return v + ' ' + (nm[k] || k);
    }).join(', ');
  }
  const ICOTIP = {
    wood: ['Wood', 'Building material. Market price 1 silver.'], food: ['Food', 'Builds farms and feeds new workers (a hire costs 1 food and 1 trade token). Market price 2 silver.'],
    steel: ['Steel', 'Heavy building material. Market price 3 silver.'], gold: ['Gold', 'Market price 4 silver. One gold pays up to 5 silver of any bill. Worth 2 VP at the end.'],
    copper: ['Copper', 'Trades 1 for 1 gold. Worth 2 VP at the end if you keep it.'], livestock: ['Livestock', 'Trades 1 for 1 gold. Worth 2 VP at the end if you keep it.'],
    silver: ['Silver', 'Pays wages (1 per worker), bids, and goods you buy. Breaks ties at the end.'],
    trade: ['Trade token', 'Spent on every buy, sell or hire. Earned from income, buildings and the rail.'],
    vp: ['Victory points', 'Added up at the end with building points and bonuses.'],
    debt: ['IOU', 'Gives 2 silver now. Unpaid IOUs cost 1, 2, 3... VP in total at the end. Repay for 5 silver or 1 gold.'],
    worker: ['Worker', 'Fills a slot to earn income. Costs 1 silver in wages every round, working or not.'],
    line: ['Spur line', 'Pays 1 silver every round. Some buildings score per spur line.'],
    rail: ['Rail track', 'Passing an auction advances you. Later spaces unlock better rewards and keep the earlier ones.'],
    stake: ['Claimstake', 'Ten rounds to build the best town.'],
    R: ['Residential', 'Homes and farms. Counts toward Residential bonuses.'], I: ['Industrial', 'Mines and mills. Counts toward Industrial bonuses.'],
    C: ['Commercial', 'Shops and banks. Counts toward Commercial bonuses.'], S: ['Special', 'One-of-a-kind civic and show buildings.'],
  };
  const ERA = { A: 'Settlement stage only (removed at round 5)', 'A/B': 'Settlement and Town stages (removed at round 9)', B: 'Town stage (removed at round 9)', C: 'City stage' };
  function bldTip(id) {
    const bd = BMAP[id], s = App.s;
    let extra = '';
    if (s && App.view === 'game') {
      const v = viewer(), owned = v.blds.filter(b => b.id === id).length;
      const left = s.bsup[id];
      const q = id !== 'cabin' && left > 0 ? HS.quoteBuild(s, v, id) : null;
      extra = `<div class="tipx">${bd.n || id === 'cabin' ? (id === 'cabin' ? '' : (left > 0 ? left + ' left in the supply. ' : 'None left in the supply. ')) : ''}${owned ? 'You own ' + owned + '. ' : ''}${q ? 'To build it now: ' + (q.ok ? (q.T ? q.T + ' trade token' + (q.T > 1 ? 's' : '') + ' and ' + q.S + ' silver for missing goods.' : 'you have everything.') : q.why + '.') : ''}</div>`;
    }
    return bcard(id, { cls: 'tipcard' }) + `<div class="tipx">${ERA[bd.era] ? 'Available in: ' + ERA[bd.era] + '.' : 'Your starting claim.'}</div>` + extra;
  }
  function oppTip(pid) {
    const s = App.s, p = s.players[pid];
    const cnt = {}; p.blds.forEach(b => { cnt[b.id] = (cnt[b.id] || 0) + 1; });
    const list = Object.keys(cnt).map(id => BMAP[id].name + (cnt[id] > 1 ? ' x' + cnt[id] : '')).join(', ');
    const res = RES.filter(r => p.res[r]).map(r => p.res[r] + ' ' + r).join(', ') || 'none';
    return `<b>${esc(p.name)}</b> <span class="faint">${p.kind === 'bot' ? LVL[p.level] + ' bot' : 'Human'}</span>
      <div>Silver ${p.silver}, trade tokens ${p.trade}, VP ${p.vp}, workers ${p.workers}, spur lines ${p.lines}, IOUs ${p.debt}.</div>
      <div>Goods: ${res}.</div><div>Buildings: ${esc(list)}.</div><div>Rail: ${p.advances} of 5 spaces.</div><div class="faint">Click to see their town.</div>`;
  }
  function tipFor(el) {
    if (!el || !el.closest) return null;
    const a = el.closest('[data-id]'), b = el.closest('[data-tip]');
    const node = b && (!a || a.contains(b)) ? b : a;
    if (node === a && a && BMAP[a.dataset.id]) return { owner: a, html: bldTip(a.dataset.id) };
    if (b) return { owner: b, html: `<div>${esc(b.dataset.tip)}</div>` };
    const opp = el.closest('[data-act=opp]');
    if (opp && App.s) return { owner: opp, html: oppTip(+opp.dataset.p) };
    const holder = el.closest('.chip,.cost,.stat,.resrow,.stepper');
    const ic = el.closest('svg.ic') || (holder && holder.querySelector('svg.ic'));
    if (ic) {
      const u = ic.querySelector('use'), n = u && (u.getAttribute('href') || '').slice(3);
      if (ICOTIP[n]) return { owner: holder || ic, html: `<b>${ICOTIP[n][0]}</b><div>${ICOTIP[n][1]}</div>` };
    }
    return null;
  }
  const tipBox = document.createElement('div');
  tipBox.className = 'tip'; tipBox.hidden = true; tipBox.setAttribute('role', 'tooltip');
  document.body.appendChild(tipBox);
  let tipOwner = null, tipTimer = null, mx = 0, my = 0;
  const canHover = () => window.matchMedia && matchMedia('(hover: hover)').matches;
  function hideTip() { clearTimeout(tipTimer); tipOwner = null; tipBox.hidden = true; }
  function placeTip() {
    const r = tipBox.getBoundingClientRect();
    let L = mx + 16, T = my + 18;
    if (L + r.width > innerWidth - 8) L = mx - r.width - 12;
    if (T + r.height > innerHeight - 8) T = my - r.height - 12;
    tipBox.style.left = Math.max(8, L) + 'px'; tipBox.style.top = Math.max(8, T) + 'px';
  }
  document.addEventListener('mouseover', ev => {
    mx = ev.clientX; my = ev.clientY;
    if (!canHover()) return;
    const t = tipFor(ev.target);
    if (!t) { hideTip(); return; }
    if (t.owner === tipOwner) return;
    hideTip(); tipOwner = t.owner;
    tipTimer = setTimeout(() => { tipBox.innerHTML = t.html; tipBox.hidden = false; placeTip(); }, 160);
  });
  document.addEventListener('mousemove', ev => { mx = ev.clientX; my = ev.clientY; if (!tipBox.hidden) placeTip(); });
  document.addEventListener('mouseleave', hideTip);
  document.addEventListener('click', hideTip, true);
  addEventListener('scroll', hideTip, true);
  document.addEventListener('focusin', ev => {
    const t = tipFor(ev.target); if (!t) return;
    const r = ev.target.getBoundingClientRect(); mx = r.left + 10; my = r.bottom - 4;
    hideTip(); tipOwner = t.owner; tipBox.innerHTML = t.html; tipBox.hidden = false; placeTip();
  });
  document.addEventListener('focusout', hideTip);


  // ------------------------------------------------------------ online play (shared db, host-authoritative)
  // g/<hostUid>: lobby + game state written only by the host. q/<uid>: each player's inbox of actions.
  const Net = { db: null, uid: null, ready: false };
  App.ui.code = ''; App.ui.oerr = '';
  async function initOnline() {
    try {
      let db, user;
      if (window.claude && window.claude.use) [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      else if (window.CLAIM_CFG && window.ClaimSupa) { const sb = window.ClaimSupa(window.CLAIM_CFG); db = sb.db; user = sb.user; }
      else return;
      if (!db || !user) return;
      const uid = await user.id();
      if (!uid) return;
      Net.db = db; Net.uid = String(uid); Net.ready = true;
      const jc = /[?&]join=([A-Za-z]{4})/.exec(location.search);
      if (jc && !App.net && !App.s) { App.view = 'online'; App.ui.code = jc[1].toUpperCase(); netJoin(App.ui.code); }
      else if (App.view === 'menu') render();
    } catch (e) { /* online play simply stays hidden */ }
  }
  const myName = () => (prof.name || 'Player').trim().slice(0, 14) || 'Player';
  function newCode() { const L = 'ABCDEFGHJKMNPQRSTUVWXYZ'; let c = ''; for (let i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)]; return c; }
  function netStop() { const n = App.net; if (n && n.subs) n.subs.forEach(u => { try { u(); } catch (e) { /* ignore */ } }); }
  function netLeave() { netStop(); App.net = null; }
  function netErr(msg) { App.ui.oerr = msg; render(); }

  // ---- host
  async function netHost() {
    const m = App.menu, seats = [];
    let b = 0;
    for (let i = 0; i < m.n; i++) {
      const k = i === 0 ? 'human' : m.seats[i].kind;
      if (i === 0) seats.push({ kind: 'human', uid: Net.uid, name: myName() });
      else if (k === 'human') seats.push({ kind: 'human', uid: null, name: '' });
      else seats.push({ kind: 'bot', level: k, name: BOTNAMES[b++ % 3], uid: null });
    }
    const opts = Object.assign(HS.defaultOpts(), m.opts);
    const code = newCode();
    App.net = { role: 'host', hostUid: Net.uid, myUid: Net.uid, pid: 0, subs: [], meta: { code, host: Net.uid, status: 'lobby', seats, opts, seed: m.seed.trim() || String(Date.now()), ack: {}, ver: 0, st: '' } };
    App.s = null; App.view = 'online'; App.ui.oerr = '';
    netHostListen(); netPublish(); render();
  }
  function netHostListen() {
    const n = App.net;
    n.subs.push(Net.db.collection('q').where('game', '==', Net.uid).onSnapshot(snap => netHostInbox(snap), e => netErr('Lost connection to the inbox (' + (e && e.code) + ').')));
  }
  function netHostInbox(snap) {
    const n = App.net; if (!n || n.role !== 'host') return;
    let changed = false;
    snap.docs.forEach(d => {
      const q = d.data(); if (!q || q.game !== n.hostUid) return;
      const uid = d.id, seats = n.meta.seats;
      let idx = seats.findIndex(x => x.uid === uid);
      if (idx < 0 && n.meta.status === 'lobby' && q.join) {
        const free = seats.findIndex(x => x.kind === 'human' && !x.uid);
        if (free >= 0) { seats[free].uid = uid; seats[free].name = String(q.name || 'Player').slice(0, 14); idx = free; changed = true; }
      }
      if (idx < 0 || !App.s || n.meta.status !== 'play') return;
      const done = n.meta.ack[uid] || 0;
      (q.acts || []).filter(x => x && x.seq > done).sort((a, b) => a.seq - b.seq).forEach(x => {
        if (x.a && typeof x.a === 'object' && x.a.type) HS.apply(App.s, Object.assign({}, x.a, { p: idx }));
        n.meta.ack[uid] = x.seq; changed = true;
      });
    });
    if (!changed) return;
    if (App.s && n.meta.status === 'play') { B.runBots(App.s); if (App.s.over) n.meta.status = 'over'; }
    netPublish(); render(); flushEvents();
  }
  function netHostStart() {
    const n = App.net, m = n.meta;
    if (m.seats.some(x => x.kind === 'human' && !x.uid)) return;
    const players = m.seats.map(x => x.kind === 'human' ? { name: x.name, kind: 'human' } : { name: x.name, kind: 'bot', level: x.level });
    const s = HS.newGame({ players, opts: m.opts, seed: m.seed });
    B.runBots(s);
    App.s = s; App.cfg = { players, opts: m.opts, seed: m.seed }; m.status = 'play';
    netEnterGame(); netPublish(); render();
  }
  async function netResume() {
    try {
      const d = await Net.db.doc('g/' + Net.uid).get();
      const g = d.exists && d.data();
      if (!g || !g.st || g.status !== 'play') return netErr('There is no game of yours to resume.');
      App.net = { role: 'host', hostUid: Net.uid, myUid: Net.uid, pid: g.seats.findIndex(x => x.uid === Net.uid), subs: [], meta: g };
      App.s = JSON.parse(g.st); App.cfg = null;
      netHostListen(); netEnterGame(); B.runBots(App.s); netPublish(); render();
    } catch (e) { netErr('Could not resume (' + (e.code || e.message) + ').'); }
  }
  function netPublish() {
    const n = App.net; if (!n || n.role !== 'host') return;
    if (n.busy) { n.dirty = true; return; }
    n.busy = true;
    (async () => {
      do {
        n.dirty = false;
        const doc = Object.assign({}, n.meta, { upd: Date.now(), ver: (n.meta.ver = (n.meta.ver || 0) + 1) });
        doc.st = App.s && n.meta.status !== 'lobby' ? JSON.stringify(App.s) : '';
        try { await Net.db.doc('g/' + n.hostUid).set(doc); } catch (e) { toast('Could not sync (' + ((e && e.code) || 'error') + ')', 'bad'); }
      } while (n.dirty && App.net === n);
      n.busy = false;
    })();
  }

  // ---- client
  async function netJoin(code) {
    code = String(code || '').trim().toUpperCase();
    if (code.length !== 4) return netErr('Enter the 4-letter code from your host.');
    try {
      const snap = await Net.db.collection('g').where('code', '==', code).get();
      const d = snap.docs.find(x => x.data() && x.data().status !== 'over');
      if (!d) return netErr('No open game with that code.');
      const g = d.data();
      if (g.status !== 'lobby' && !g.seats.some(x => x.uid === Net.uid)) return netErr('That game has already started.');
      if (g.status === 'lobby' && !g.seats.some(x => x.uid === Net.uid) && !g.seats.some(x => x.kind === 'human' && !x.uid)) return netErr('That game is full.');
      netClientAttach(d.id, g);
    } catch (e) { netErr('Could not look for the game (' + (e.code || e.message) + ').'); }
  }
  async function netRejoin() {
    try {
      const d = await Net.db.doc('q/' + Net.uid).get(), q = d.exists && d.data();
      if (!q) return netErr('Nothing to rejoin.');
      const gd = await Net.db.doc('g/' + q.game).get(), g = gd.exists && gd.data();
      if (!g || g.status === 'over' || !g.seats.some(x => x.uid === Net.uid)) return netErr('That game is finished or gone.');
      netClientAttach(q.game, g, q);
    } catch (e) { netErr('Could not rejoin (' + (e.code || e.message) + ').'); }
  }
  function netClientAttach(hostUid, g, prevQ) {
    const n = App.net = { role: 'client', hostUid, myUid: Net.uid, pid: -1, subs: [], meta: g, seq: prevQ ? prevQ.seq || 0 : 0, acts: prevQ ? prevQ.acts || [] : [], name: myName(), lastSend: 0 };
    App.view = 'online'; App.ui.oerr = '';
    n.subs.push(Net.db.doc('g/' + hostUid).onSnapshot(snap => netOnGame(snap), e => netErr('Lost connection to the game (' + (e && e.code) + ').')));
    netFlush();
    render();
  }
  function netOnGame(snap) {
    const n = App.net; if (!n || n.role !== 'client') return;
    if (!snap.exists) { netErr('The host closed this game.'); netLeave(); return; }
    const g = snap.data(); n.meta = g;
    n.pid = g.seats.findIndex(x => x.uid === n.myUid);
    if (g.st && n.pid >= 0) {
      const acked = (g.ack || {})[n.myUid] || 0;
      if (acked < n.seq && Date.now() - n.lastSend < 6000) return;
      const ns = JSON.parse(g.st);
      const old = App.s;
      if (old && ns.phase === 'assign' && old.phase === 'assign' && ns.round === old.round && !ns.ready[n.pid]) ns.players[n.pid].assign = old.players[n.pid].assign;
      const first = App.view !== 'game';
      App.s = ns;
      if (first) netEnterGame();
      render(); flushEvents();
    } else render();
  }
  function netEnqueue(a) {
    const n = App.net; if (!n || n.role !== 'client') return;
    const act = clone(a); delete act.p;
    n.seq++; n.acts.push({ seq: n.seq, a: act }); if (n.acts.length > 40) n.acts.shift();
    n.lastSend = Date.now();
    netFlush();
  }
  async function netFlush() {
    const n = App.net; if (!n || n.role !== 'client') return;
    if (n.writing) { n.dirty = true; return; }
    n.writing = true;
    try {
      do {
        n.dirty = false;
        await Net.db.doc('q/' + n.myUid).set({ game: n.hostUid, name: n.name, join: true, seq: n.seq, acts: n.acts });
      } while (n.dirty && App.net === n);
    } catch (e) { toast('Could not send your move (' + ((e && e.code) || 'error') + ')', 'bad'); }
    n.writing = false;
  }
  function netEnterGame() {
    const s = App.s;
    App.view = 'game';
    App.ui = Object.assign(App.ui, { lastRound: 0, tab: 'play', sel: null, pay: { gold: 0, trades: 0 }, payKey: '', curtainFor: -1, evSeen: s.events.length, seenUid: s.uidn - 1, modal: null, confetti: false });
  }

  function renderOnline() {
    const n = App.net, err = App.ui.oerr ? `<div class="notice bad">${esc(App.ui.oerr)}</div>` : '';
    if (!n) {
      const m = App.menu;
      const sum = Array.from({ length: m.n }, (_, i) => i === 0 ? 'You' : (m.seats[i].kind === 'human' ? 'Friend' : 'Bot: ' + LVL[m.seats[i].kind])).join(', ');
      return `<div class="top"><div class="brand">${I('stake')}Claimstake</div></div>
        <div class="menu"><div class="panel"><h3>Play online</h3>
          <p class="muted" style="margin-top:0">Everyone opens this same page. One person hosts and keeps their tab open; friends join with a 4-letter code.</p>
          <div class="field"><label>Your name</label><input type="text" data-f="oname" value="${esc(prof.name || '')}" placeholder="Player" maxlength="14"></div>${err}
          <div class="field"><label>Players</label><div class="seg">${[2, 3, 4].map(k => `<button class="${m.n === k ? 'on' : ''}" data-act="pn" data-n="${k}">${k}</button>`).join('')}</div></div>
          <div class="grp" style="display:grid;gap:8px;margin:10px 0"><div class="faint">Seat 1: you</div>${Array.from({ length: m.n - 1 }, (_, j) => { const i = j + 1, st = m.seats[i]; return `<div class="row" style="gap:8px"><span class="faint" style="min-width:48px">Seat ${i + 1}</span><select data-seat="${i}" data-f="kind" aria-label="Seat ${i + 1}" style="width:auto;flex:1;min-width:150px">${['human', 1, 2, 3].map(k => `<option value="${k}" ${st.kind === k ? 'selected' : ''}>${k === 'human' ? 'Friend (joins with the code)' : 'Bot: ' + LVL[k]}</option>`).join('')}</select></div>`; }).join('')}</div>
          <div class="row wrap"><button class="btn" data-act="ohost">Host a game</button><button class="btn ghost" data-act="oresume">Resume my hosted game</button><button class="btn ghost" data-act="orejoin">Rejoin a game</button></div>
          <p class="faint">Rules options come from the New game screen on the main menu. You can still change seats in the lobby.</p></div>
        <div class="panel"><h3>Join a friend</h3><div class="field"><label>Game code</label><input type="text" data-f="ocode" value="${esc(App.ui.code)}" placeholder="ABCD" maxlength="4" style="text-transform:uppercase;font-size:22px;letter-spacing:.2em"></div>
          <div class="row" style="margin-top:12px"><button class="btn" data-act="ojoin">Join</button></div>
          <p class="faint">${window.claude ? 'Friends need access to this page. The owner can invite them from the page\'s Share menu, as Contributors.' : 'Ask your host for the 4-letter code, or open the invite link they send.'}</p></div></div>
        <div class="row"><button class="btn ghost" data-act="tomenu">Back</button></div>`;
    }
    const g = n.meta, host = n.role === 'host';
    const seats = g.seats.map((x, i) => `<div class="stat"><b><span style="color:${PCOL[i]}">●</span> ${x.kind === 'bot' ? esc(x.name) : x.uid ? esc(x.name) : 'Waiting for a friend'}</b><span>${x.kind === 'bot' ? LVL[x.level] + ' bot' : x.uid === n.myUid ? 'You' + (i === 0 ? ' (host)' : '') : x.uid ? 'Joined' : 'Open seat'}</span>${host && i > 0 && !x.uid && g.status === 'lobby' ? `<button class="btn ghost small" data-act="oseat" data-i="${i}">${x.kind === 'bot' ? 'Make this a friend seat' : 'Switch to a bot'}</button>` : ''}</div>`).join('');
    const open = g.seats.filter(x => x.kind === 'human' && !x.uid).length;
    return `<div class="top"><div class="brand">${I('stake')}Claimstake</div></div>
      <div class="panel" style="display:grid;gap:14px;max-width:720px;margin-inline:auto;width:100%"><h3>Game lobby</h3>
        <div style="text-align:center"><div class="faint">Game code</div><div style="font-family:var(--font-d);font-size:64px;font-weight:700;letter-spacing:.18em">${esc(g.code)}</div></div>
        <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">${seats}</div>${err}
        <p class="muted" style="margin:0">${host ? (open ? 'Waiting for ' + open + ' more player' + (open > 1 ? 's' : '') + '. Send them the invite link, or the code: they open this page, choose Play online, then Join.' : 'Everyone is here. Start when ready. To invite someone, switch a bot seat to a friend seat.') : 'Waiting for the host to start.'}</p>
        <div class="row wrap">${host ? `<button class="btn" data-act="ostart" ${open ? 'disabled' : ''}>Start game</button>` : ''}<button class="btn ghost" data-act="ocopy">Copy invite link</button><button class="btn ghost" data-act="oleave">Leave</button></div></div>`;
  }

  // ------------------------------------------------------------ boot
  document.body.insertAdjacentHTML('afterbegin', A.ICONS);
  if (prof.theme) setTheme(prof.theme);
  window.Claimstake = { App, ACT, render, prof };
  render();
  initOnline();
})();
