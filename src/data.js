/* CLAIMSTAKE - game data.
   Numbers (costs, slots, points, bonuses) come from the supplied building reference table.
   Names, flavour and the 30 auction tiles are original. */
(function (root) {
  'use strict';

  const RES = ['wood', 'food', 'steel', 'gold', 'copper', 'livestock'];
  const LETTER = { W: 'wood', F: 'food', S: 'steel', G: 'gold', C: 'copper', L: 'livestock' };
  const TYPES = { R: 'Residential', I: 'Industrial', C: 'Commercial', S: 'Special' };
  // Market going rates (silver). Copper / livestock trade against one gold cube.
  const PRICE = { wood: 1, food: 2, steel: 3, gold: 4 };
  const LADDER = [3, 4, 5, 6, 7, 9, 12, 16, 21];
  const SUPPLY = { wood: 14, food: 14, steel: 14, gold: 12, copper: 10, livestock: 10,
                   trade: 36, debt: 36, line: 27, worker: 25 };
  // Rail track spaces 1..5
  const RAIL = ['trade', 'line', 'worker', 'resource', 'vp3'];

  // b(id, name, type, copies, era, cost, pts, auto, s1, s2, dbl, onBuild, special, final, blurb)
  function b(id, name, type, n, era, cost, pts, o) {
    return Object.assign({ id, name, type, n, era, cost, pts, auto: null, s1: null, s2: null, dbl: null,
      onBuild: null, special: null, final: null, blurb: '' }, o || {});
  }

  const BUILDINGS = [
    // ---------- Residential
    b('cabin', 'Cabin', 'R', 0, '-', '', 0, { auto: { silver: 2 }, s1: { wood: 1 }, s2: { vp: 1 },
      blurb: 'Your starting claim.' }),
    b('wheatfield', 'Wheat Field', 'R', 3, 'A', 'W', 0, { s1: { trade: 1, silver: 2 }, s2: { food: 1 } }),
    b('flourmill', 'Flour Mill', 'R', 1, 'A', 'WS', 2, { auto: { food: 1 } }),
    b('lodge', 'Lodge', 'R', 1, 'A/B', 'WW', 0, { auto: { silver: 2 }, onBuild: { debtPay: 1 },
      final: [{ per: 'I' }] }),
    b('cattlepen', 'Cattle Pen', 'R', 2, 'A/B', 'WFS', 0, { s1: { livestock: 1 }, onBuild: { trade: 1 } }),
    b('bunkhouse', 'Bunkhouse', 'R', 1, 'A/B', 'SS', 0, { auto: { silver: 1, trade: 1 },
      final: [{ per: 'worker' }, { per: 'line' }] }),
    b('carpentry', 'Carpentry Shed', 'R', 2, 'B', 'S', 2, { auto: { vp: 1 }, onBuild: { worker: 1 } }),
    b('meetinghouse', 'Meetinghouse', 'R', 1, 'B', 'WSGC', 10, { auto: { vp: 2 } }),
    b('guestranch', 'Guest Ranch', 'R', 2, 'C', 'WF', 3, { final: [{ per: 'worker' }] }),
    b('assemblyhall', 'Assembly Hall', 'R', 1, 'C', 'WWC', 10, { final: [{ per: 'C' }] }),
    // ---------- Industrial
    b('smelter', 'Smelter', 'I', 3, 'A', '', 0, { s1: { steel: 1 } }),
    b('rollingmill', 'Rolling Mill', 'I', 1, 'A', 'WWG', 0, { auto: { steel: 1 } }),
    b('landing', 'River Landing', 'I', 2, 'A/B', 'W', 0, { dbl: { gold: 1 }, special: 'goldSub' }),
    b('placer', 'Placer Claim', 'I', 2, 'A/B', 'WS', 0, { s1: { gold: 1 } }),
    b('redshaft', 'Red Shaft', 'I', 2, 'A/B', 'WWS', 0, { s1: { copper: 1 } }),
    b('anvil', 'Anvil Works', 'I', 2, 'B', 'SS', 1, { s1: { vp: 2 }, onBuild: { rail: 1 }, special: 'forge' }),
    b('packing', 'Packing House', 'I', 1, 'B', 'WL', 2, { s1: { vp: 2 }, s2: { vp: 2 } }),
    b('junction', 'Junction Depot', 'I', 2, 'C', 'WC', 3, { onBuild: { line: 1, extra: 1 } }),
    // ---------- Commercial
    b('bazaar', 'Bazaar', 'C', 3, 'A', 'W', 2, { auto: { trade: 1 }, s1: { silver: 2 }, special: 'convert' }),
    b('drygoods', 'Dry Goods', 'C', 2, 'A/B', 'S', 2, { auto: { trade: 1 }, special: 'sellBonus' }),
    b('furexchange', 'Fur Exchange', 'C', 1, 'A/B', 'G', 0, { auto: { trade: 2 } }),
    b('freightyard', 'Freight Yard', 'C', 2, 'B', 'WS', 0, { auto: { silver: 2 }, onBuild: { rail: 1 },
      final: [{ per: 'line' }] }),
    b('livery', 'Livery', 'C', 1, 'B', 'L', 0, { auto: { trade: 1, vp: 1 }, final: [{ per: 'R' }] }),
    b('savings', 'Savings House', 'C', 1, 'B', 'SC', 3, { auto: { debtPay: 1 }, special: 'tradeSilver',
      final: [{ per: 'S' }] }),
    b('terminal', 'Grand Terminal', 'C', 2, 'C', 'SS', 6, { final: [{ per: 'line' }] }),
    b('diningHall', 'Dining Hall', 'C', 2, 'C', 'WL', 8, { final: [{ per: 'S' }] }),
    // ---------- Special
    b('roundup', 'Roundup Grounds', 'S', 1, 'B', 'FL', 4, { auto: { silverPerWorker: 5 } }),
    b('advocate', 'Land Advocate', 'S', 1, 'B', 'WGL', 4, { auto: { vp: 2 }, special: 'tieBid',
      final: [{ per: 'C' }] }),
    b('assemblyplant', 'Assembly Plant', 'S', 1, 'B', 'SSC', 6, { auto: { vp: 2 }, final: [{ per: 'I' }] }),
    b('countyfair', 'County Fair', 'S', 1, 'B', 'WWLC', 6, { auto: { gold: 1 }, final: [{ per: 'R' }] }),
    b('bigtop', 'Big Top', 'S', 1, 'C', 'FFL', 8, { final: [{ per: 'worker' }] }),
    b('roundhouse', 'Roundhouse', 'S', 1, 'C', 'SSGC', 6, { onBuild: { rail: 1 }, final: [{ per: 'building' }] }),
  ];
  const BMAP = {};
  BUILDINGS.forEach(x => { BMAP[x.id] = x; x.costList = x.cost.split('').filter(Boolean).map(c => LETTER[c]); });

  // ---------- Auction tiles (ORIGINAL SET - contents of the printed tiles are not public)
  // types: building types the winner may construct. bonus: gained when the auction is won.
  function t(id, name, types, bonus, extra) {
    return Object.assign({ id, name, types, bonus: bonus || null, noBuild: false }, extra || {});
  }
  // Auction 1: one tile per round, face up.
  const TILES_A1 = [
    t('a1r1', 'Prairie Lot', ['R'], null),
    t('a1r2', 'Smoke Row', ['I'], { trade: 1 }),
    t('a1r3', 'Market Square', ['C'], null),
    t('a1r4', "Settlers' Rise", ['R'], { worker: 1 }),
    t('a1r5', 'Ironworks Lot', ['I'], { rail: 1 }),
    t('a1r6', 'Trade Street', ['C'], { trade: 2 }),
    t('a1r7', 'Civic Green', ['S'], null),
    t('a1r8', "Founders' Lot", ['R'], { silver: 3 }),
    t('a1r9', 'Furnace Row', ['I'], { vp: 2 }),
    t('a1r10', 'Grand Avenue', ['C'], { vp: 2 }),
  ];
  // Pools for auctions 2 and 3: 4 Settlement, 4 Town, 2 City each (shuffled within stage).
  const TILES_P2 = {
    A: [t('p2a1', 'River Bend Lot', ['R'], { resource: 1 }), t('p2a2', 'Quarry Lot', ['I'], null),
        t('p2a3', 'Corner Lot', ['C'], null), t('p2a4', 'Sunny Acre', ['R'], null)],
    B: [t('p2b1', 'Fairground Lot', ['S'], null), t('p2b2', 'Depot Spur', ['I'], { rail: 1 }),
        t('p2b3', 'Mercantile Row', ['C'], null), t('p2b4', 'Parsonage Lot', ['R'], { debtPay: 1 })],
    C: [t('p2c1', 'Garden District', ['R'], null), t('p2c2', 'Exposition Ground', ['S'], { vp: 2 })],
  };
  const TILES_P3 = {
    A: [t('p3a1', 'Foundry Flats', ['I'], { trade: 1 }), t('p3a2', 'Bazaar Lane', ['C'], { trade: 1 }),
        t('p3a3', 'Cottage Row', ['R'], { trade: 1 }), t('p3a4', 'Slag Heap Lot', ['I'], { silver: 3 })],
    B: [t('p3b1', 'Showground', ['S'], { vp: 2 }), t('p3b2', 'Rail Boom', [], { rail: 2 }, { noBuild: true }),
        t('p3b3', 'Dockside Lot', ['I'], { silver: 3 }), t('p3b4', 'Grand Bazaar', ['C'], { rail: 1 })],
    C: [t('p3c1', 'Land Grant', [], { vp: 5, trade: 1 }, { noBuild: true }),
        t('p3c2', 'Boulevard Lot', ['C'], { worker: 1 })],
  };
  const TILES_PLAIN = {
    // 'plain' option: same building types, no bonuses, no no-build tiles
    strip(tile) { return Object.assign({}, tile, { bonus: null, noBuild: false, types: tile.types.length ? tile.types : ['R', 'I', 'C'] }); },
  };

  // ---------- Options and rule notes
  const OPTION_DEFS = [
    { key: 'tiles', label: 'Auction tiles', def: 'standard',
      choices: [['standard', 'Frontier set (bonus tiles)'], ['plain', 'Plain (types only, no bonuses)']],
      tag: 'designed',
      help: 'The printed auction tiles are not public, so this is an original set of 30. Plain removes every bonus and no-building tile.' },
    { key: 'railOverflow', label: 'Rail track past space 5', def: 'any',
      choices: [['any', 'Choose any reward'], ['vp3', '3 VP only'], ['none', 'No reward']],
      tag: 'confirmed',
      help: 'Rulebook: further advances let you choose any reward. Self-play shows this can make early passing very strong in cash-poor games; the alternatives are offered for experimenting.' },
    { key: 'limitedSupply', label: 'Resource supply', def: true,
      choices: [[true, 'Limited cubes (box counts)'], [false, 'Unlimited']], tag: 'confirmed',
      help: 'Box counts: 14 wood, 14 food, 14 steel, 12 gold, 10 copper, 10 livestock. When a pile is empty nobody can gain that resource.' },
    { key: 'homesteadCounts', label: 'Cabin counts as a building for end bonuses', def: true,
      choices: [[true, 'Yes (Residential)'], [false, 'No']], tag: 'designed',
      help: 'The starting tile is printed as a Residential building. Affects "per Residential" and "per building" scoring.' },
    { key: 'trainExtra', label: 'Junction Depot extra building', def: 'free',
      choices: [['free', 'Resource cost only (no bid)'], ['bid', 'Also pay the winning bid again']], tag: 'designed',
      help: 'The table says you may build an additional building of any type. Whether it needs another bid is not stated.' },
    { key: 'neutralPlace', label: '2-player neutral bid placement', def: 'random',
      choices: [['random', 'Random auction'], ['start', 'Start player chooses']], tag: 'designed',
      help: 'The neutral token (starts at 5, +1 if both players win, -1 per pass; range 3-9) is placed before bidding. Where is not stated.' },
    { key: 'supply3p', label: '3-player building supply', def: 'full',
      choices: [['full', 'All copies'], ['trim', 'Trimmed (like 2 players)']], tag: 'designed',
      help: 'Rules list no removals for 3 players. Trimmed makes the supply tighter.' },
    { key: 'hiddenInfo', label: 'Opponents\' goods and money', def: true,
      choices: [[true, 'Hidden (like the board game)'], [false, 'Open to everyone']], tag: 'confirmed',
      help: 'In the board game each player keeps their silver, goods and trade tokens behind a screen. Hidden: you see an opponent\'s buildings, workers, victory points, debt and rail progress, but not their silver, goods or trade tokens. Everything is revealed when the game ends.' },
    { key: 'advisor', label: 'Show advisor hints', def: true,
      choices: [[true, 'On'], [false, 'Off']], tag: 'ui',
      help: 'Shows the bot advisor\'s estimate of what an auction is worth to you.' },
  ];

  const RULE_NOTES = [
    ['confirmed', 'Ten rounds: Settlement (1-4), Town (5-8), City (9-10). At round 5 unbuilt Settlement-only buildings are removed and Town buildings added; at round 9 everything unbuilt is removed and City buildings added.'],
    ['confirmed', 'Each round: assign workers in secret, collect income, pay 1 silver per worker (idle too; a gold pays up to five), bid and pass, then build in auction order.'],
    ['confirmed', 'Bid ladder 3, 4, 5, 6, 7, 9, 12, 16, 21. You may bid beyond your cash; payment can use the market, gold, or debt.'],
    ['confirmed', 'Passing advances you on the rail track and gives that space\'s reward or any earlier one; you sit out the rest of the bidding.'],
    ['confirmed', 'Winning Auction 1 gives you the start marker (then Auction 2, then 3). 2-3 players use two auctions per round, 4 players use three.'],
    ['confirmed', 'Market: wood 1, food 2, steel 3, gold 4 silver; copper and livestock trade for one gold. Every trade costs a trade token and every sale scores 1 VP.'],
    ['confirmed', 'Debt gives 2 silver, repaying costs 5. At the end each unpaid debt costs 1, 2, 3... VP in total.'],
    ['confirmed', 'Double worker slots need two workers. Automatic income needs no worker. Each spur line pays 1 silver.'],
    ['confirmed', 'Final scoring: VP + building points + bonuses + 2 VP per gold, copper and livestock - debt penalty. Silver breaks ties; still tied = shared win.'],
    ['confirmed', '2 players: one copy of each building (two each of Wheat Field, Bazaar, Smelter); a neutral bidder starts at 5.'],
    ['designed', 'Auction tile contents are an original design (see options).'],
    ['designed', 'If the building you won is exhausted before you build, your bid is refunded.'],
    ['designed', 'Bazaar: spend one trade token to convert one wood to food, or one food to steel.'],
    ['designed', 'Savings House: each trade token counts as 1 silver when you pay.'],
    ['designed', 'River Landing: gold may replace copper or livestock in building costs.'],
    ['designed', 'Hiring a worker costs 1 trade token and 1 food, any time you are making decisions.'],
  ];

  const api = { RES, LETTER, TYPES, PRICE, LADDER, SUPPLY, RAIL, BUILDINGS, BMAP, TILES_A1, TILES_P2, TILES_P3,
    TILES_PLAIN, OPTION_DEFS, RULE_NOTES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HSDATA = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
