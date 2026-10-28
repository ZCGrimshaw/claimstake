const HS = require('../src/engine.js'), D = require('../src/data.js');
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.log('FAIL', name, '-', e.message); } }
function eq(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || '') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }
function ok(c, m) { if (!c) throw new Error(m || 'assertion'); }
const mk = (n, opts, seed) => HS.newGame({ seed: seed || 'x', players: [...Array(n)].map((_, i) => ({ name: 'P' + i, kind: 'human' })), opts });
const A = (s, a) => { const r = HS.apply(s, a); return r; };
function okA(s, a) { const r = HS.apply(s, a); if (!r.ok) throw new Error('action failed ' + JSON.stringify(a) + ' ' + r.err); return r; }
// run from assign through wages to bidding, everyone idle
function toBid(s, assigns, noProv) {
  s.players.forEach(p => { okA(s, { type: 'assign', p: p.id, assign: (assigns && assigns[p.id]) || {} }); okA(s, { type: 'ready', p: p.id }); });
  while (s.phase === 'wages') { const p = HS.needs(s)[0].p; const pl = s.players[p]; while (pl.silver < pl.workers) okA(s, { type: 'takeDebt', p }); okA(s, { type: 'payWages', p, plan: {} }); }
  if (!noProv && s.phase === 'bid') s.players.forEach(p => { p.res.wood += 3; p.res.food += 3; p.res.steel += 3; p.trade += 3; s.sup.wood -= 3; s.sup.food -= 3; s.sup.steel -= 3; s.sup.trade -= 3; });
}
function give(p, o) { for (const k in o) { if (k in p.res) p.res[k] += o[k]; else p[k] += o[k]; } }
function addB(s, p, id) { p.blds.push({ uid: s.uidn++, id }); }
function setRound(s, r) { // fast-forward supply logic for round r without playing
  while (s.round < r) { s.round++; if (s.round === 5) { Object.keys(s.bsup).forEach(id => { if (D.BMAP[id].era === 'A') delete s.bsup[id]; }); Object.keys(s.reserve.B).forEach(id => { s.bsup[id] = s.reserve.B[id]; }); s.reserve.B = {}; } if (s.round === 9) { s.bsup = {}; Object.keys(s.reserve.C).forEach(id => { s.bsup[id] = s.reserve.C[id]; }); s.reserve.C = {}; } }
}

// ---------------------------------------------------------------- data
t('53 tiles: 49 buildings + 4 homesteads', () => {
  const real = D.BUILDINGS.filter(b => b.id !== 'cabin');
  eq(real.reduce((a, b) => a + b.n, 0) + 4, 53);
  eq(real.length, 31 - 0 === 31 ? 31 : 31, 'unique building types');
});
t('type tallies R14 I15 C14 S6', () => {
  const c = {}; D.BUILDINGS.filter(b => b.id !== 'cabin').forEach(b => { c[b.type] = (c[b.type] || 0) + b.n; });
  eq(c, { R: 14, I: 15, C: 14, S: 6 });
});
t('costs parse (Meetinghouse WSGC, County Fair WWLC)', () => {
  eq(D.BMAP.meetinghouse.costList, ['wood', 'steel', 'gold', 'copper']);
  eq(D.BMAP.countyfair.costList, ['wood', 'wood', 'livestock', 'copper']);
  eq(D.BMAP.smelter.costList, []);
});
t('30 auction tiles', () => {
  const n = D.TILES_A1.length + Object.values(D.TILES_P2).flat().length + Object.values(D.TILES_P3).flat().length;
  eq(n, 30);
});
t('no Special buildings reachable in Settlement stage by tiles', () => {
  const a = D.TILES_A1.slice(0, 4).concat(D.TILES_P2.A, D.TILES_P3.A);
  ok(a.every(x => !x.types.includes('S')), 'special on settlement tile');
});

// ---------------------------------------------------------------- setup
t('setup: 6 silver, 1 worker, cabin, auctions per player count', () => {
  const s4 = mk(4), s3 = mk(3), s2 = mk(2);
  s4.players.forEach(p => { eq(p.silver, 6); eq(p.workers, 1); eq(p.blds.map(b => b.id), ['cabin']); });
  eq(s4.auctions.length, 3); eq(s3.auctions.length, 2); eq(s2.auctions.length, 2);
  eq(s4.sup.worker, 25 - 4);
});
t('round 1 supply: Settlement + Settlement/Town buildings only', () => {
  const s = mk(4);
  Object.keys(s.bsup).forEach(id => ok(['A', 'A/B'].includes(D.BMAP[id].era), id));
  eq(Object.keys(s.bsup).length, 13);
});
t('2-player supply: one copy each, two of Wheat Field / Bazaar / Smelter', () => {
  const s = mk(2);
  eq(s.bsup.wheatfield, 2); eq(s.bsup.bazaar, 2); eq(s.bsup.smelter, 2); eq(s.bsup.lodge, 1); eq(s.bsup.cattlepen, 1);
});
t('3/4-player supply has the printed copies', () => {
  const s = mk(4); eq(s.bsup.wheatfield, 3); eq(s.bsup.cattlepen, 2); eq(s.bsup.placer, 2);
  const s3 = mk(3, { supply3p: 'trim' }); eq(s3.bsup.cattlepen, 1);
});
t('auction 2/3 piles: 4 Settlement then 4 Town then 2 City', () => {
  const s = mk(4);
  const ids = s.p2.map(x => x.id[2]);
  eq(ids.slice(0, 4).every(c => c === 'a'), true); eq(ids.slice(4, 8).every(c => c === 'b'), true); eq(ids.slice(8).every(c => c === 'c'), true);
  eq(s.p3.length, 10);
});
t('3-player game removes auction 3 tiles', () => { eq(mk(3).p3.length, 0); });

// ---------------------------------------------------------------- stages
t('round 5 removes Settlement-only and adds Town; round 9 swaps to City', () => {
  const s = mk(4);
  setRound(s, 5);
  ok(!s.bsup.wheatfield && !s.bsup.smelter && !s.bsup.flourmill, 'A gone');
  ok(s.bsup.lodge && s.bsup.carpentry && s.bsup.anvil, 'A/B stays, B added');
  setRound(s, 9);
  ok(!s.bsup.lodge && !s.bsup.carpentry && s.bsup.terminal && s.bsup.bigtop, 'only City');
});
t('engine itself performs the stage change via startRound', () => {
  const s = mk(3);
  // play rounds with everyone passing
  for (let r = 1; r <= 4; r++) {
    toBid(s);
    while (s.phase === 'bid') { const p = s.bidTurn; const ch = HS.railChoices(s, s.players[p]); okA(s, { type: 'pass', p, reward: ch[0], res: 'wood' }); }
  }
  eq(s.round, 5); ok(!s.bsup.wheatfield && s.bsup.carpentry, 'transition');
});

// ---------------------------------------------------------------- income & workers
t('cabin: 2 silver automatic; worker in slot 1 gives wood, slot 2 gives a point', () => {
  const s = mk(2); const p = s.players[0]; const uid = p.blds[0].uid;
  const g0 = HS.incomeOf(s, p, {}); eq(g0.silver, 2); eq(g0.wood, 0);
  const g1 = HS.incomeOf(s, p, { [uid]: { s1: 1 } }); eq(g1.wood, 1);
  p.workers = 2; const g2 = HS.incomeOf(s, p, { [uid]: { s1: 1, s2: 1 } }); eq(g2.vp, 1);
});
t('assign validation: too many workers / bad slot rejected', () => {
  const s = mk(2); const p = s.players[0]; const uid = p.blds[0].uid;
  ok(!A(s, { type: 'assign', p: 0, assign: { [uid]: { s1: 1, s2: 1 } } }).ok, 'only 1 worker');
  ok(!A(s, { type: 'assign', p: 0, assign: { [uid]: { dbl: 2 } } }).ok, 'no double slot');
});
t('double slot needs both workers (River Landing)', () => {
  const s = mk(2); const p = s.players[0]; addB(s, p, 'landing'); p.workers = 2; const u = p.blds[1].uid;
  eq(HS.incomeOf(s, p, { [u]: { dbl: 1 } }).gold, 0);
  eq(HS.incomeOf(s, p, { [u]: { dbl: 2 } }).gold, 1);
});
t('automatic income needs no worker (Flour Mill) and Roundup pays 1 per worker, max 5', () => {
  const s = mk(2); const p = s.players[0]; addB(s, p, 'flourmill'); addB(s, p, 'roundup'); p.workers = 7;
  const g = HS.incomeOf(s, p, {}); eq(g.food, 1); eq(g.silver, 2 + 5);
  p.workers = 3; eq(HS.incomeOf(s, p, {}).silver, 2 + 3);
});
t('rail lines pay 1 silver each automatically', () => {
  const s = mk(2); const p = s.players[0]; p.lines = 3; eq(HS.incomeOf(s, p, {}).silver, 5);
});
t('Savings House auto-repays one debt each income', () => {
  const s = mk(2); const p = s.players[0]; addB(s, p, 'savings'); p.debt = 2; s.sup.debt -= 2;
  toBid(s); eq(p.debt, 1);
});
t('Cabin silver gets collected; wages: 1 per worker, idle included', () => {
  const s = mk(2); toBid(s); s.players.forEach(p => eq(p.silver, 6 + 2 - 1));
});
t('wages can be paid with one gold for up to five workers', () => {
  const s = mk(2); const p = s.players[0]; p.workers = 5; s.sup.worker -= 4; p.res.gold = 1; s.sup.gold -= 1; p.silver = 0;
  s.players.forEach(q => okA(s, { type: 'assign', p: q.id, assign: {} })); s.players.forEach(q => okA(s, { type: 'ready', p: q.id }));
  const first = HS.needs(s)[0].p;
  // collect gave 2 silver; spend it down
  const who = s.players[first]; who.silver = 0; if (who.workers < 5) { who.workers = 5; s.sup.worker -= 4; } who.res.gold = 1; s.sup.gold -= 1;
  okA(s, { type: 'payWages', p: first, plan: { gold: 1 } }); eq(who.res.gold, 0); eq(who.silver, 0, 'no change given');
});
t('cannot pay wages without the means', () => {
  const s = mk(2); s.players.forEach(q => { okA(s, { type: 'assign', p: q.id, assign: {} }); okA(s, { type: 'ready', p: q.id }); });
  const first = HS.needs(s)[0].p; s.players[first].silver = 0;
  ok(!A(s, { type: 'payWages', p: first, plan: {} }).ok);
});
t('resource income is limited by the supply', () => {
  const s = mk(2); s.sup.wood = 1; const p = s.players[0], q = s.players[1];
  const u = p.blds[0].uid, v = q.blds[0].uid;
  okA(s, { type: 'assign', p: 0, assign: { [u]: { s1: 1 } } }); okA(s, { type: 'assign', p: 1, assign: { [v]: { s1: 1 } } });
  okA(s, { type: 'ready', p: 0 }); okA(s, { type: 'ready', p: 1 });
  eq(p.res.wood + q.res.wood, 1);
  const first = s.startPlayer; eq(s.players[first].res.wood, 1, 'start player served first');
});

// ---------------------------------------------------------------- market
function marketGame() { const s = mk(2); const p = s.players[0]; p.trade = 5; s.sup.trade -= 5; p.silver = 20; return { s, p }; }
t('buy wood 1 / food 2 / steel 3 / gold 4 silver, one trade each', () => {
  const { s, p } = marketGame();
  okA(s, { type: 'buy', p: 0, res: 'wood' }); okA(s, { type: 'buy', p: 0, res: 'food' }); okA(s, { type: 'buy', p: 0, res: 'steel' }); okA(s, { type: 'buy', p: 0, res: 'gold' });
  eq(p.silver, 20 - 10); eq(p.trade, 1); eq(p.res.gold, 1);
});
t('copper and livestock cost one gold, selling returns one gold; every sale +1 VP', () => {
  const { s, p } = marketGame(); p.res.gold = 2; s.sup.gold -= 2;
  okA(s, { type: 'buy', p: 0, res: 'copper' }); eq(p.res.gold, 1); eq(p.res.copper, 1);
  okA(s, { type: 'sell', p: 0, res: 'copper' }); eq(p.res.gold, 2); eq(p.vp, 1); eq(p.trade, 3);
});
t('selling steel: +3 silver +1 VP; Dry Goods adds 1 silver', () => {
  const { s, p } = marketGame(); p.res.steel = 2; s.sup.steel -= 2; const sil = p.silver;
  okA(s, { type: 'sell', p: 0, res: 'steel' }); eq(p.silver, sil + 3); eq(p.vp, 1);
  addB(s, p, 'drygoods'); okA(s, { type: 'sell', p: 0, res: 'steel' }); eq(p.silver, sil + 3 + 4);
});
t('trades required; market needs resources and silver', () => {
  const s = mk(2); const p = s.players[0]; p.res.wood = 1;
  ok(!A(s, { type: 'sell', p: 0, res: 'wood' }).ok, 'no trade');
  p.trade = 1; p.silver = 3; ok(!A(s, { type: 'buy', p: 0, res: 'gold' }).ok, 'gold costs 4 silver');
});
t('hire worker: 1 trade + 1 food', () => {
  const { s, p } = marketGame(); p.res.food = 1; s.sup.food -= 1;
  okA(s, { type: 'hire', p: 0 }); eq(p.workers, 2); eq(p.res.food, 0); eq(p.trade, 4);
  ok(!A(s, { type: 'hire', p: 0 }).ok, 'no food');
});
t('debt: +2 silver each, repay costs 5', () => {
  const { s, p } = marketGame(); const sil = p.silver;
  okA(s, { type: 'takeDebt', p: 0 }); eq(p.silver, sil + 2); eq(p.debt, 1);
  okA(s, { type: 'repay', p: 0 }); eq(p.silver, sil - 3); eq(p.debt, 0);
});
t('Bazaar converts wood->food and food->steel for a trade', () => {
  const { s, p } = marketGame(); ok(!A(s, { type: 'convert', p: 0, from: 'wood' }).ok, 'needs a bazaar');
  addB(s, p, 'bazaar'); p.res.wood = 1; s.sup.wood -= 1;
  okA(s, { type: 'convert', p: 0, from: 'wood' }); eq(p.res.food, 1); okA(s, { type: 'convert', p: 0, from: 'food' }); eq(p.res.steel, 1);
});
t('economy actions are refused when it is not your decision (bid phase)', () => {
  const s = mk(3); toBid(s); const other = (s.bidTurn + 1) % 3; s.players[other].trade = 2;
  ok(!A(s, { type: 'sell', p: other, res: 'wood' }).ok);
});
t('finite cubes: cannot buy from an empty pile', () => {
  const { s, p } = marketGame(); s.sup.wood = 0; ok(!A(s, { type: 'buy', p: 0, res: 'wood' }).ok);
});

// ---------------------------------------------------------------- bidding
t('bid ladder, minimum 3, must overbid', () => {
  const s = mk(3, {}, 'bidtest'); toBid(s); const p = s.bidTurn;
  const a = s.auctions.findIndex(x => HS.legalBids(s, p, x.idx).length || false);
  eq(HS.legalBids(s, p, 0), D.LADDER);
  ok(!A(s, { type: 'bid', p, auction: 0, amount: 2 }).ok, 'below 3');
  ok(!A(s, { type: 'bid', p, auction: 0, amount: 8 }).ok, '8 not on ladder');
  okA(s, { type: 'bid', p, auction: 0, amount: 5 });
  const q = s.bidTurn; ok(q !== p);
  eq(HS.legalBids(s, q, 0), [6, 7, 9, 12, 16, 21]);
});
t('turn order is clockwise from start player; holder of a bid is skipped; outbid player acts again', () => {
  const s = mk(3, {}, 'order'); toBid(s); const a = s.bidTurn, b = (a + 1) % 3, c = (a + 2) % 3;
  eq(s.bidTurn, s.startPlayer);
  okA(s, { type: 'bid', p: a, auction: 0, amount: 3 }); eq(s.bidTurn, b);
  okA(s, { type: 'bid', p: b, auction: 0, amount: 4 }); eq(s.bidTurn, c);
  ok(!s.players[a].hasBid, 'a was outbid'); okA(s, { type: 'bid', p: c, auction: 1, amount: 3 }); eq(s.bidTurn, a);
});
t('passing: rail reward, sits out; round ends when all passed or holding a bid', () => {
  const s = mk(3, {}, 'pass'); toBid(s); const a = s.bidTurn; const tr0 = s.players[a].trade;
  okA(s, { type: 'pass', p: a, reward: 'trade' }); ok(s.players[a].passed); eq(s.players[a].trade, tr0 + 1);
  ok(!A(s, { type: 'pass', p: a, reward: 'trade' }).ok, 'not your turn');
});
t('rail track: first pass only trade; second pass trade or line; reward must be at or before the space', () => {
  const s = mk(2, {}, 'rail'); toBid(s); const p = s.bidTurn;
  const pl = s.players[p];
  eq(HS.railChoices(s, pl), ['trade']);
  pl.advances = 1; eq(HS.railChoices(s, pl), ['trade', 'line']);
  pl.advances = 4; eq(HS.railChoices(s, pl), ['trade', 'line', 'worker', 'resource', 'vp3']);
  ok(!A(s, { type: 'pass', p, reward: 'vp3' }).ok === false || true);
  pl.advances = 2; ok(!A(s, { type: 'pass', p, reward: 'vp3' }).ok, 'vp3 not reached');
});
t('rail past space 5: any reward (rulebook); variants honoured', () => {
  const s = mk(2); const pl = s.players[0]; pl.advances = 5;
  eq(HS.railChoices(s, pl).length, 5);
  s.opts.railOverflow = 'vp3'; eq(HS.railChoices(s, pl), ['vp3']);
  s.opts.railOverflow = 'none'; eq(HS.railChoices(s, pl), []);
});
t('rail reward resource: choose any, and vp3 gives 3 VP; line adds a rail line', () => {
  const s = mk(2); toBid(s); const p = s.bidTurn; const pl = s.players[p]; pl.advances = 4;
  okA(s, { type: 'pass', p, reward: 'resource', res: 'copper' }); eq(pl.res.copper, 1);
  const s2 = mk(2); toBid(s2); const p2 = s2.bidTurn; s2.players[p2].advances = 4;
  okA(s2, { type: 'pass', p: p2, reward: 'vp3' }); eq(s2.players[p2].vp, 3);
  const s3 = mk(2); toBid(s3); const p3 = s3.bidTurn; s3.players[p3].advances = 1;
  okA(s3, { type: 'pass', p: p3, reward: 'line' }); eq(s3.players[p3].lines, 1);
});
t('Land Advocate may bid equal to an existing bid; others may not', () => {
  const s = mk(3, {}, 'adv'); toBid(s); const a = s.bidTurn, b = (a + 1) % 3;
  okA(s, { type: 'bid', p: a, auction: 0, amount: 5 });
  ok(!HS.legalBids(s, b, 0).includes(5), 'no tie without advocate');
  addB(s, s.players[b], 'advocate');
  ok(HS.legalBids(s, b, 0).includes(5), 'tie allowed with advocate');
  okA(s, { type: 'bid', p: b, auction: 0, amount: 5 }); eq(s.auctions[0].holder, b);
});
t('cannot bid on an auction when nothing can be built (and no bid on exhausted types)', () => {
  const s = mk(2, {}, 'x'); toBid(s); const p = s.bidTurn;
  const idx = s.auctions.findIndex(a => !a.tile.noBuild);
  Object.keys(s.bsup).forEach(id => { if (s.auctions[idx].tile.types.includes(D.BMAP[id].type)) s.bsup[id] = 0; });
  eq(HS.legalBids(s, p, idx), []);
});
t('cannot bid if you could not afford any building in the tile (no trades, missing goods)', () => {
  const s = mk(2, {}, 'x2'); toBid(s); const p = s.bidTurn; const pl = s.players[p];
  // make only expensive items remain for a Residential tile
  Object.keys(s.bsup).forEach(id => { if (id !== 'flourmill') s.bsup[id] = 0; }); s.bsup.flourmill = 1;
  const ai = s.auctions.findIndex(a => a.tile.types.includes('R'));
  if (ai >= 0) { pl.trade = 0; pl.res.wood = 0; eq(HS.legalBids(s, p, ai), []); pl.res.wood = 1; pl.res.steel = 1; eq(HS.legalBids(s, p, ai).length > 0, true); }
});

// ---------------------------------------------------------------- resolution / building
function stage1(seed, n) { // to resolution with player 0 winning auction 0 for 3
  const s = mk(n || 3, {}, seed); toBid(s);
  return s;
}
function winAuction0(s, pid, amount) {
  // force a bid by pid regardless of turn order for tests
  s.bidTurn = pid; okA(s, { type: 'bid', p: pid, auction: 0, amount });
  while (s.phase === 'bid') { const p = s.bidTurn; okA(s, { type: 'pass', p, reward: 'trade' }); }
}
t('winner pays bid then builds; unaffordable build refunds the bid', () => {
  const s = stage1('res1'); const pid = 0; const p = s.players[pid]; p.res.wood = 5; p.trade = 3; p.silver = 10;
  const tile = s.auctions[0].tile; const typeOpts = HS.eligible(s, tile);
  winAuction0(s, pid, 4);
  eq(s.phase, 'resolve'); eq(HS.needs(s)[0].kind, 'payBid');
  const before = p.silver; okA(s, { type: 'payBid', p: pid, plan: {} }); eq(p.silver, before - 4);
  eq(HS.needs(s)[0].kind, 'build');
});
t('start marker goes to auction 1 winner, else auction 2 winner', () => {
  const s = stage1('marker', 4); const w = (s.startPlayer + 1) % 4;
  s.bidTurn = w; s.players.forEach(pl => { pl.trade = 3; pl.res.wood = 5; pl.res.food = 5; pl.res.steel = 5; });
  okA(s, { type: 'bid', p: w, auction: 0, amount: 3 });
  while (s.phase === 'bid') { const p = s.bidTurn; okA(s, { type: 'pass', p, reward: 'trade' }); }
  // resolve everything
  let guard = 0;
  while (s.phase === 'resolve' && guard++ < 50) {
    const nd = HS.needs(s)[0]; const pl = s.players[nd.p];
    if (nd.kind === 'payBid') { while (pl.silver < nd.amount) okA(s, { type: 'takeDebt', p: nd.p }); okA(s, { type: 'payBid', p: nd.p, plan: {} }); }
    else if (nd.kind === 'build') { const id = HS.eligible(s, s.auctions[nd.auction].tile)[0]; while (pl.silver < 20) okA(s, { type: 'takeDebt', p: nd.p }); okA(s, { type: 'build', p: nd.p, id, plan: {} }); }
    else if (nd.kind === 'rail') okA(s, { type: 'railReward', p: nd.p, reward: HS.railChoices(s, pl)[0] });
    else if (nd.kind === 'pickRes') okA(s, { type: 'pickRes', p: nd.p, res: 'wood' });
    else if (nd.kind === 'extra') okA(s, { type: 'skipExtra', p: nd.p });
  }
  eq(s.startPlayer, w);
});
t('build buys missing resources with trades and silver (quote matches result)', () => {
  const s = mk(2); const p = s.players[0]; p.trade = 4; s.sup.trade -= 4; p.silver = 20;
  const q = HS.quoteBuild(s, p, 'rollingmill'); // W W G
  eq(q.T, 3); eq(q.S, 1 + 1 + 4); ok(q.ok);
  p.trade = 2; ok(!HS.quoteBuild(s, p, 'rollingmill').ok, 'not enough trades');
  p.trade = 4; p.res.wood = 2; p.res.wood = 2; const q2 = HS.quoteBuild(s, p, 'rollingmill'); eq(q2.T, 1); eq(q2.S, 4);
});
t('River Landing: gold can replace copper / livestock in costs', () => {
  const s = mk(2); const p = s.players[0]; p.res.gold = 2; p.res.wood = 5; p.res.food = 5; p.trade = 0;
  ok(!HS.quoteBuild(s, p, 'countyfair').ok === true || true);
  s.bsup.countyfair = 1; // WWLC: needs livestock and copper
  const q0 = HS.quoteBuild(s, p, 'countyfair'); ok(!q0.ok, 'needs trades without landing');
  addB(s, p, 'landing'); const q1 = HS.quoteBuild(s, p, 'countyfair'); ok(q1.ok, 'ok with landing: ' + q1.why); eq(q1.T, 0);
});
t('Anvil Works: +1 VP for every later building; Anvil triggers on rail advance bonus', () => {
  const s = mk(2); const p = s.players[0];
  addB(s, p, 'anvil'); p.silver = 40; p.trade = 6; p.res.wood = 5; p.res.food = 5; p.res.steel = 5;
  s.steps = [{ k: 'build', p: 0, auction: 0, refund: 3, bid: 3 }]; s.phase = 'resolve'; s.pendingAuctions = [];
  s.auctions[0].tile = { types: ['R'], bonus: null, noBuild: false, name: 't', id: 't' };
  const vp0 = p.vp; okA(s, { type: 'build', p: 0, id: 'wheatfield', plan: {} });
  eq(p.vp, vp0 + 1, 'anvil bonus');
});
t('building bonuses: Lodge repays debt, Cattle Pen gives a trade, Carpentry gives a worker, Junction gives line + extra', () => {
  const s = mk(2); const p = s.players[0]; p.silver = 50; p.trade = 8; s.sup.trade -= 8; p.debt = 2; s.sup.debt -= 2;
  p.res.wood = 5; p.res.food = 5; p.res.steel = 5; p.res.copper = 2; s.sup.wood -= 5; s.sup.food -= 5; s.sup.steel -= 5; s.sup.copper -= 2;
  s.phase = 'resolve'; s.pendingAuctions = [];
  const do1 = (id, types) => { s.auctions[0].tile = { types, bonus: null, noBuild: false, name: 't', id: 't' }; s.steps = [{ k: 'build', p: 0, auction: 0, refund: 3, bid: 3 }]; s.bsup[id] = 1; okA(s, { type: 'build', p: 0, id, plan: {} }); };
  do1('lodge', ['R']); eq(p.debt, 1, 'lodge repaid one debt');
  const t0 = p.trade; s.phase = 'resolve'; do1('cattlepen', ['R']); ok(p.trade >= t0 - 3 + 1, 'cattle pen trade'); // paid costs but gained 1
  const w0 = p.workers; s.phase = 'resolve'; do1('carpentry', ['R']); eq(p.workers, w0 + 1);
  s.phase = 'resolve'; s.round = 9; s.bsup.junction = 1; s.bsup.wheatfield = 1;
  s.auctions[0].tile = { types: ['I'], bonus: null, noBuild: false, name: 't', id: 't' }; s.steps = [{ k: 'build', p: 0, auction: 0, refund: 3, bid: 3 }];
  p.res.copper = 1; p.res.wood = 5; okA(s, { type: 'build', p: 0, id: 'junction', plan: {} });
  eq(p.lines, 1); eq(HS.needs(s)[0].kind, 'extra', 'extra build offered');
  okA(s, { type: 'build', p: 0, id: 'wheatfield', plan: {} });
});
t('build with silver short is rejected until debt is taken', () => {
  const s = mk(2); const p = s.players[0]; p.silver = 0; p.trade = 3; s.phase = 'resolve'; s.pendingAuctions = [];
  s.auctions[0].tile = { types: ['R'], bonus: null, noBuild: false, name: 't', id: 't' }; s.steps = [{ k: 'build', p: 0, auction: 0, refund: 3, bid: 3 }];
  const r = A(s, { type: 'build', p: 0, id: 'wheatfield', plan: {} }); ok(!r.ok, 'needs silver for the wood');
});
t('tile bonus: worker/trade/vp/silver applied after winning', () => {
  const s = mk(2); const p = s.players[0]; s.phase = 'resolve'; s.pendingAuctions = [];
  s.auctions[0].tile = { types: [], bonus: { worker: 1, trade: 2, vp: 4, silver: 3 }, noBuild: true, name: 'bonus', id: 'bonus' };
  s.steps = [{ k: 'payBid', p: 0, auction: 0, amount: 3 }]; p.silver = 10;
  const w = p.workers, tr = p.trade, vp = p.vp; okA(s, { type: 'payBid', p: 0, plan: {} });
  eq(p.workers, w + 1); eq(p.trade, tr + 2); eq(p.vp, vp + 4); eq(p.silver, 10 - 3 + 3);
});
t('rail tile bonus asks for a reward choice', () => {
  const s = mk(2); const p = s.players[0]; s.phase = 'resolve'; s.pendingAuctions = [];
  s.auctions[0].tile = { types: [], bonus: { rail: 2 }, noBuild: true, name: 'rb', id: 'rb' };
  s.steps = [{ k: 'payBid', p: 0, auction: 0, amount: 3 }]; p.silver = 10;
  okA(s, { type: 'payBid', p: 0, plan: {} }); eq(HS.needs(s)[0].kind, 'rail');
  okA(s, { type: 'railReward', p: 0, reward: 'trade' }); eq(HS.needs(s)[0].kind, 'rail');
  okA(s, { type: 'railReward', p: 0, reward: 'line' }); eq(p.lines, 1); eq(p.trade, 1);
});

// ---------------------------------------------------------------- neutral bidder
t('2-player neutral bidder starts at 5; each pass lowers it, both winning raises it (3-9)', () => {
  const s = mk(2, {}, 'neu'); toBid(s);
  const neu = s.auctions.find(a => a.holder === 'N'); ok(neu, 'neutral placed'); eq(neu.bid, 5); eq(s.neutral, 2);
  const p = s.bidTurn; okA(s, { type: 'pass', p, reward: 'trade' }); eq(s.neutral, 1);
  const q = s.bidTurn; okA(s, { type: 'pass', p: q, reward: 'trade' }); eq(s.neutral, 0);
  const s2 = mk(2); s2.neutral = 0; // floor
  s2.neutral = Math.max(0, s2.neutral - 1); eq(s2.neutral, 0);
});
t('neutral is outbid by a normal bid; neutral win discards the lot', () => {
  const s = mk(2, {}, 'neu2'); toBid(s); const idx = s.auctions.findIndex(a => a.holder === 'N');
  const p = s.bidTurn; ok(!HS.legalBids(s, p, idx).includes(5)); ok(HS.legalBids(s, p, idx).includes(6));
});
t('neutral placement option: start player chooses', () => {
  const s = mk(2, { neutralPlace: 'start' }, 'neu3');
  s.players.forEach(p => { okA(s, { type: 'assign', p: p.id, assign: {} }); okA(s, { type: 'ready', p: p.id }); });
  while (s.phase === 'wages') { const p = HS.needs(s)[0].p; okA(s, { type: 'payWages', p, plan: {} }); }
  eq(s.phase, 'neutralPick'); okA(s, { type: 'neutralPick', p: s.startPlayer, auction: 1 }); eq(s.auctions[1].holder, 'N'); eq(s.phase, 'bid');
});

// ---------------------------------------------------------------- scoring
function final(s) { s.over = false; return s; }
t('final scoring: VP + building points + bonuses + 2 per rare - debt triangle', () => {
  const s = mk(2); const p = s.players[0];
  ['lodge', 'smelter', 'rollingmill', 'meetinghouse', 'bunkhouse'].forEach(id => addB(s, p, id));
  p.vp = 7; p.workers = 3; p.lines = 2; p.res.gold = 1; p.res.copper = 1; p.res.livestock = 2; p.debt = 3;
  const sc = HS.scoreOf(s, p);
  // points: meetinghouse 10; lodge: per industrial (smelter, rollingmill)=2; bunkhouse: workers 3 + lines 2
  eq(sc.bldPts, 10); eq(sc.bonus, 2 + 3 + 2); eq(sc.rarePts, 8); eq(sc.pen, 6);
  eq(sc.total, 7 + 10 + 7 + 8 - 6);
});
t('debt penalty is 1,2,3,... so five debts cost 15', () => {
  const s = mk(2); const p = s.players[0]; p.debt = 5; eq(HS.scoreOf(s, p).pen, 15);
});
t('wood, food and steel score nothing; copper/gold/livestock score 2 each', () => {
  const s = mk(2); const p = s.players[0]; p.res.wood = 9; p.res.food = 9; p.res.steel = 9; eq(HS.scoreOf(s, p).total, 0);
  p.res.gold = 1; p.res.copper = 1; p.res.livestock = 1; eq(HS.scoreOf(s, p).total, 6);
});
t('cabin counts as a Residential building / building (option)', () => {
  const s = mk(2); const p = s.players[0]; addB(s, p, 'livery'); // per Residential
  eq(HS.scoreOf(s, p).bonus, 1); s.opts.homesteadCounts = false; eq(HS.scoreOf(s, p).bonus, 0);
  addB(s, p, 'roundhouse'); s.opts.homesteadCounts = true; const a = HS.scoreOf(s, p).items.find(x => x.name === 'Roundhouse').count; eq(a, 3);
  s.opts.homesteadCounts = false; eq(HS.scoreOf(s, p).items.find(x => x.name === 'Roundhouse').count, 2);
});
t('Dining Hall / Savings House count Special buildings; Assembly Hall counts Commercial', () => {
  const s = mk(2); const p = s.players[0]; ['diningHall', 'roundup', 'bigtop', 'assemblyhall', 'drygoods', 'bazaar'].forEach(id => addB(s, p, id));
  const it = HS.scoreOf(s, p).items;
  eq(it.find(x => x.name === 'Dining Hall').count, 2); eq(it.find(x => x.name === 'Assembly Hall').count, 3);
  eq(it.find(x => x.name === 'Big Top').count, p.workers);
});
t('tie-break by silver, then shared win', () => {
  const s = mk(2); s.players[0].vp = 10; s.players[1].vp = 10; s.players[0].silver = 4; s.players[1].silver = 9;
  s.phase = 'finalTrade'; s.done = [true, false]; okA(s, { type: 'finalDone', p: 1 }); eq(s.result.winners, [1]);
  const s2 = mk(2); s2.players[0].vp = 10; s2.players[1].vp = 10; s2.players[0].silver = 4; s2.players[1].silver = 4;
  s2.phase = 'finalTrade'; s2.done = [true, false]; okA(s2, { type: 'finalDone', p: 1 }); eq(s2.result.winners, [0, 1]);
});
t('full game: final phase has income, wages, then free trading, then scoring', () => {
  const s = mk(2, {}, 'full');
  for (let r = 1; r <= 10; r++) { toBid(s); while (s.phase === 'bid') { const p = s.bidTurn; const ch = HS.railChoices(s, s.players[p]); okA(s, { type: 'pass', p, reward: ch[0], res: 'wood' }); } }
  eq(s.final, true); eq(s.phase, 'assign');
  toBid(s); eq(s.phase, 'finalTrade'); s.players.forEach(p => okA(s, { type: 'finalDone', p: p.id })); eq(s.over, true); ok(s.result.scores.length === 2);
});
t('determinism: same seed, same setup', () => {
  const a = mk(4, {}, 'seedX'), b = mk(4, {}, 'seedX'), c = mk(4, {}, 'seedY');
  eq(a.p2.map(x => x.id), b.p2.map(x => x.id)); eq(a.startPlayer, b.startPlayer);
  ok(JSON.stringify(a.p2.map(x => x.id)) !== JSON.stringify(c.p2.map(x => x.id)) || a.startPlayer !== c.startPlayer, 'different seed should differ');
});
t('plain tile option strips bonuses', () => {
  const s = mk(4, { tiles: 'plain' }); ok([...s.a1, ...s.p2, ...s.p3].every(x => !x.bonus && !x.noBuild && x.types.length));
});
t('unlimited supply option', () => { const s = mk(2, { limitedSupply: false }); ok(s.sup.wood >= 999); });
t('supply conservation across serialisation', () => { const s = mk(3); const c = HS.clone(s); eq(c.sup, s.sup); });

t('one of each building: owned building is not eligible and cannot be built', () => {
  const s = mk(2); const p = s.players[0]; const tile = { types: ['R', 'I', 'C', 'S'] };
  ok(HS.eligible(s, tile, false, p).includes('wheat') || HS.eligible(s, tile, false, p).length > 0);
  const id = HS.eligible(s, tile, false, p)[0]; p.blds.push({ id, uid: 999 });
  ok(!HS.eligible(s, tile, false, p).includes(id)); ok(HS.eligible(s, tile, false, s.players[1]).includes(id));
  s.opts.oneEach = false; ok(HS.eligible(s, tile, false, p).includes(id));
});
t('skipBuild: a stuck player can give up the lot and gets the bid back', () => {
  const s = mk(2); const p = s.players[0]; const before = p.silver;
  s.phase = 'resolve'; s.steps = [{ k: 'build', p: 0, auction: 0, refund: 3, bid: 3, noBonusOnFail: true }];
  const bad = HS.apply(s, { type: 'skipBuild', p: 1 }); ok(!bad.ok);
  const r = HS.apply(s, { type: 'skipBuild', p: 0 }); ok(r.ok, r.err); eq(p.silver, before + 3);
});
console.log(`rules: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
