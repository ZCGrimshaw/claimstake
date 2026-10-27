/* CLAIMSTAKE art v2: richer vector building sprites (200x180 viewBox, ground ellipse centred at y=150). Style test. */
(function (root) {
  'use strict';
  const INK = '#2b1d14';
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="g-log" x1="0" x2="1"><stop offset="0" stop-color="#d9a566"/><stop offset=".55" stop-color="#b57d47"/><stop offset="1" stop-color="#8a5a33"/></linearGradient>
  <linearGradient id="g-plank" x1="0" x2="1"><stop offset="0" stop-color="#b98d58"/><stop offset="1" stop-color="#7b5836"/></linearGradient>
  <linearGradient id="g-stone" x1="0" x2="1"><stop offset="0" stop-color="#b9c0c6"/><stop offset=".6" stop-color="#8d99a4"/><stop offset="1" stop-color="#65717d"/></linearGradient>
  <linearGradient id="g-brick" x1="0" x2="1"><stop offset="0" stop-color="#c06a57"/><stop offset="1" stop-color="#85473c"/></linearGradient>
  <linearGradient id="g-roofR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c0694e"/><stop offset="1" stop-color="#8e4632"/></linearGradient>
  <linearGradient id="g-roofI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f94b3"/><stop offset="1" stop-color="#52627c"/></linearGradient>
  <linearGradient id="g-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa457"/><stop offset="1" stop-color="#4d6b3a"/></linearGradient>
  <linearGradient id="g-pine" x1="0" x2="1"><stop offset="0" stop-color="#4f7d4b"/><stop offset="1" stop-color="#2d4f33"/></linearGradient>
  <linearGradient id="g-red" x1="0" x2="1"><stop offset="0" stop-color="#e0634e"/><stop offset="1" stop-color="#a93a2e"/></linearGradient>
  <linearGradient id="g-cream" x1="0" x2="1"><stop offset="0" stop-color="#fff0cf"/><stop offset="1" stop-color="#dcc79c"/></linearGradient>
  <linearGradient id="g-white" x1="0" x2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#d9cdb4"/></linearGradient>
  <linearGradient id="g-wd2" x1="0" x2="1"><stop offset="0" stop-color="#c9985c"/><stop offset="1" stop-color="#7b5230"/></linearGradient>
  <linearGradient id="g-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb5d6"/><stop offset="1" stop-color="#2f6f8f"/></linearGradient>
  <linearGradient id="g-blu" x1="0" x2="1"><stop offset="0" stop-color="#8cb6e0"/><stop offset="1" stop-color="#35557a"/></linearGradient>
  <linearGradient id="g-wheat" x1="0" x2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#b8861f"/></linearGradient>
  <linearGradient id="g-gold" x1="0" x2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset="1" stop-color="#b8801a"/></linearGradient>
  <linearGradient id="g-copper" x1="0" x2="1"><stop offset="0" stop-color="#ffc79a"/><stop offset="1" stop-color="#9a4a24"/></linearGradient>
  <radialGradient id="g-glow" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#ffc561"/><stop offset="1" stop-color="#e48a2c"/></radialGradient>
  <radialGradient id="g-fire" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#ffb23d"/><stop offset="1" stop-color="#d4501c"/></radialGradient>
  <radialGradient id="g-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  <pattern id="p-logs" width="10" height="9" patternUnits="userSpaceOnUse"><path d="M0 8.5h10" stroke="#5d3b20" stroke-width="1.6"/><path d="M0 4.5h10" stroke="#e8c48c" stroke-width=".7" opacity=".55"/></pattern>
  <pattern id="p-shingle" width="12" height="8" patternUnits="userSpaceOnUse"><path d="M0 7.5h12M6 0v7.5M0 3.5v4M12 3.5v4" stroke="#2b1d14" stroke-width="1" opacity=".45" fill="none"/><path d="M0 .5h12" stroke="#fff" stroke-width=".6" opacity=".18"/></pattern>
  <pattern id="p-bricks" width="14" height="8" patternUnits="userSpaceOnUse"><path d="M0 7.5h14M7 0v4M0 4v4M14 4v4M0 3.5h14" stroke="#4a2a22" stroke-width=".9" opacity=".5" fill="none"/></pattern>
  <pattern id="p-stones" width="16" height="12" patternUnits="userSpaceOnUse"><path d="M0 11.5h16M8 0v6M0 6v6M16 6v6M0 5.5h16" stroke="#46525e" stroke-width=".9" opacity=".5" fill="none"/></pattern>
  <pattern id="p-stripe" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#c9412f"/><rect x="10" width="10" height="10" fill="#fff0cf"/></pattern>
  </defs></svg>`;

  const o = 'stroke="' + INK + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';
  const o1 = 'stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"';
  const ground = (rx = 88) => `<ellipse cx="108" cy="156" rx="${rx - 8}" ry="12" fill="#2b1d14" opacity=".22"/><ellipse cx="100" cy="150" rx="${rx}" ry="16" fill="url(#g-grass)" ${o1}/><path d="M24 148l3-7 3 7M168 146l3-8 3 8M60 160l2-6 3 6M140 162l2-6 3 6" stroke="#3d5a2f" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const pine = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="22" width="6" height="12" fill="#6b4423" ${o1}/><path d="M0 -30l16 26h-9l13 20h-40l13-20h-9z" fill="url(#g-pine)" ${o1}/><path d="M0 -30l-6 10M-4 -4l-8 10" stroke="#9cc476" stroke-width="1.4" opacity=".6" fill="none"/></g>`;
  const smoke = (x, y) => `<g class="a2-smoke" fill="#e9eef2" opacity=".85"><circle cx="${x}" cy="${y}" r="5"/><circle cx="${x + 5}" cy="${y - 11}" r="7"/><circle cx="${x + 1}" cy="${y - 24}" r="9"/></g>`;
  const win = (x, y, w, h, shut = true) => `<g><rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="2" fill="url(#g-halo)" opacity=".0" class="a2-halo"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="url(#g-glow)" ${o1} class="a2-glow"/><path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="${INK}" stroke-width="1.2"/>${shut ? `<rect x="${x - 5}" y="${y}" width="5" height="${h}" fill="#4f7aa6" ${o1}/><rect x="${x + w}" y="${y}" width="5" height="${h}" fill="#4f7aa6" ${o1}/>` : ''}</g>`;
  const flag = (x, y, col) => `<g class="a2-flag"><path d="M${x} ${y}v-30" stroke="${INK}" stroke-width="2"/><path d="M${x} ${y - 30}h22l-5 7 5 7h-22z" fill="${col}" ${o1}/></g>`;
  const lantern = (x, y) => `<g><path d="M${x} ${y - 10}v4" stroke="${INK}" stroke-width="1.5"/><rect x="${x - 4}" y="${y - 6}" width="8" height="10" rx="2" fill="url(#g-glow)" ${o1} class="a2-glow"/></g>`;

  // ---- shared parts
  const wallOf = (kind, x, y, w, h) => {
    const f = { log: 'url(#g-log)', plank: 'url(#g-plank)', brick: 'url(#g-brick)', stone: 'url(#g-stone)', white: 'url(#g-white)', cream: 'url(#g-cream)' }[kind];
    const p = { log: 'p-logs', plank: null, brick: 'p-bricks', stone: 'p-stones', white: null, cream: null }[kind];
    const planks = kind === 'plank' || kind === 'white' ? `<path d="${Array.from({ length: Math.floor(w / 9) }, (_, i) => `M${x + 9 * (i + 1)} ${y}v${h}`).join('')}" stroke="${kind === 'white' ? '#9a8d78' : '#4b3220'}" stroke-width="1" opacity=".45"/>` : '';
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${o}/>${p ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p})"/>` : ''}${planks}<rect x="${x + w * .72}" y="${y}" width="${w * .28}" height="${h}" fill="#1a1020" opacity=".16"/>`;
  };
  const roofT = (x1, x2, y1, y2, g, acc, pat = 'p-shingle') => `<path d="M${x1} ${y2}L${x1 + (x2 - x1) * .0 + 28} ${y1}H${x2 - 28}L${x2} ${y2}Z" fill="url(#${g})" ${o}/><path d="M${x1} ${y2}L${x1 + 28} ${y1}H${x2 - 28}L${x2} ${y2}Z" fill="url(#${pat})"/><path d="M${x1 + 28} ${y1}H${x2 - 28}L${x2} ${y2}H${x2 - 26}z" fill="#000" opacity=".12"/><path d="M${x1 + 4} ${y2 - 2}L${x1 + 29} ${y1 + 3}" stroke="#fff" stroke-width="2" opacity=".35"/><path d="M${x1 - 2} ${y2}H${x2 + 2}" stroke="${acc}" stroke-width="4" stroke-linecap="round"/>`;
  const gable = (cx, y, w, h, g, acc, pat = 'p-shingle') => `<path d="M${cx - w / 2 - 6} ${y}L${cx} ${y - h}L${cx + w / 2 + 6} ${y}Z" fill="url(#${g})" ${o}/><path d="M${cx - w / 2 - 6} ${y}L${cx} ${y - h}L${cx + w / 2 + 6} ${y}Z" fill="url(#${pat})"/><path d="M${cx} ${y - h}L${cx + w / 2 + 6} ${y}H${cx + 6}z" fill="#000" opacity=".14"/><path d="M${cx - w / 2 - 6} ${y}H${cx + w / 2 + 6}" stroke="${acc}" stroke-width="4" stroke-linecap="round"/>`;
  const doorA = (x, y, w, h) => `<path d="M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}z" fill="#6e4524" ${o}/><path d="M${x + w / 2} ${y}v${h}" stroke="#3a2412" stroke-width="1" opacity=".6"/><circle cx="${x + w - 4}" cy="${y + h * .6}" r="1.6" fill="#f2c36a"/>`;
  const doorR = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#6e4524" ${o}/><path d="M${x + w / 2} ${y}v${h}" stroke="#3a2412" stroke-width="1" opacity=".6"/><circle cx="${x + w - 4}" cy="${y + h * .55}" r="1.6" fill="#f2c36a"/>`;
  const chim = (x, y, h, g = 'g-stone') => `<rect x="${x}" y="${y}" width="16" height="${h}" fill="url(#${g})" ${o}/><rect x="${x - 3}" y="${y - 4}" width="22" height="7" fill="#6f7c88" ${o}/>${smoke(x + 8, y - 12)}`;
  const person = (x, y, col, hat = '#8a5a33') => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="1" rx="6" ry="2" fill="${INK}" opacity=".25"/><rect x="-4" y="-12" width="8" height="12" rx="3" fill="${col}" ${o1}/><circle cx="0" cy="-16" r="4" fill="#f0c6a0" ${o1}/><path d="M-6 -17h12" stroke="${INK}" stroke-width="1.4"/><path d="M-4 -17a4 4 0 018 0z" fill="${hat}" ${o1}/></g>`;
  const barrel = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-7 0v-12q7-3 14 0v12q-7 3-14 0z" fill="url(#g-wd2)" ${o1}/><path d="M-7 -8q7 2 14 0M-7 -3q7 2 14 0" stroke="#4b3220" fill="none" stroke-width="1.2"/></g>`;
  const crate = (x, y, s = 14, col = 'url(#g-plank)') => `<g transform="translate(${x} ${y})"><rect x="0" y="${-s}" width="${s}" height="${s}" fill="${col}" ${o1}/><path d="M0 ${-s}l${s} ${s}M${s} ${-s}L0 0" stroke="#4b3220" stroke-width="1" opacity=".5"/></g>`;
  const fence = (x1, x2, y) => `<g ${o1} fill="#a98757"><path d="M${x1} ${y - 8}H${x2}M${x1} ${y - 15}H${x2}" stroke="${INK}" stroke-width="3.4" fill="none"/><path d="M${x1} ${y - 8}H${x2}M${x1} ${y - 15}H${x2}" stroke="#d9ad72" stroke-width="1.6" fill="none"/>${Array.from({ length: Math.floor((x2 - x1) / 18) + 1 }, (_, i) => `<rect x="${x1 + i * 18 - 2}" y="${y - 20}" width="5" height="20" fill="#b98d58"/>`).join('')}</g>`;
  const sign = (x, y, w, h, col = '#e4d6b8') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${col}" ${o1}/><path d="M${x + 5} ${y + h / 2}h${w - 10}" stroke="#a8977a" stroke-width="2" stroke-dasharray="5 3" stroke-linecap="round"/>`;
  const cow = (x, y, flip = 1) => `<g transform="translate(${x} ${y}) scale(${flip} 1)"><ellipse cx="2" cy="2" rx="14" ry="3.4" fill="${INK}" opacity=".22"/><rect x="-12" y="-14" width="24" height="13" rx="6" fill="#f4ead2" ${o1}/><circle cx="-4" cy="-9" r="3.2" fill="#8a5a33"/><circle cx="5" cy="-6" r="2.6" fill="#8a5a33"/><rect x="-10" y="-3" width="3" height="6" fill="#d9c9a3" ${o1}/><rect x="6" y="-3" width="3" height="6" fill="#d9c9a3" ${o1}/><rect x="10" y="-17" width="9" height="9" rx="3" fill="#a8764a" ${o1}/><path d="M12 -18l-2 -4M18 -18l2 -4" stroke="${INK}" stroke-width="1.4"/><circle cx="15.5" cy="-13" r="1" fill="${INK}"/></g>`;
  const rails = (y, x1, x2) => `<g><path d="M${x1} ${y}H${x2}M${x1 + 4} ${y + 6}H${x2 - 4}" stroke="${INK}" stroke-width="3.6"/><path d="M${x1} ${y}H${x2}M${x1 + 4} ${y + 6}H${x2 - 4}" stroke="#aab6c2" stroke-width="1.6"/>${Array.from({ length: Math.floor((x2 - x1) / 10) }, (_, i) => `<path d="M${x1 + 5 + i * 10} ${y - 1}l-2 8" stroke="#6b4423" stroke-width="3"/>`).join('')}</g>`;
  const tower = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-10 0l-4 40M10 0l4 40M-12 20h24" stroke="${INK}" stroke-width="3"/><path d="M-12 -18h24v18q-12 5-24 0z" fill="url(#g-wd2)" ${o}/><path d="M-14 -18L0 -30l14 12z" fill="url(#g-roofI)" ${o1}/><path d="M-12 -10q12 4 24 0" stroke="#4b3220" fill="none"/></g>`;

  const TPL = {
    cabin: (c) => `${pine(26, 112, 1.05)}${pine(176, 118, .9)}${ground()}
      <rect x="116" y="30" width="22" height="50" fill="url(#g-stone)" ${o}/><rect x="116" y="30" width="22" height="50" fill="url(#p-stones)"/><rect x="112" y="26" width="30" height="8" fill="#6f7c88" ${o}/>${smoke(127, 18)}
      <rect x="40" y="86" width="122" height="62" fill="url(#g-log)" ${o}/><rect x="40" y="86" width="122" height="62" fill="url(#p-logs)"/>
      <rect x="130" y="86" width="32" height="62" fill="#1a1020" opacity=".2"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<ellipse cx="40" cy="${91 + i * 9}" rx="4" ry="4.5" fill="#d9ad72" ${o1}/><ellipse cx="162" cy="${91 + i * 9}" rx="4" ry="4.5" fill="#b0773f" ${o1}/>`).join('')}
      <path d="M28 92L58 52H146L176 92Z" fill="url(#g-roofR)" ${o}/><path d="M28 92L58 52H146L176 92Z" fill="url(#p-shingle)"/><path d="M58 52H146L176 92H150L128 52Z" fill="#000" opacity=".12"/><path d="M33 90L60 55" stroke="#c98c63" stroke-width="2" opacity=".6"/>
      <path d="M40 92h122v6H40z" fill="#000" opacity=".22"/>${flag(66, 56, c.acc)}<path d="M28 92h148" stroke="${c.acc}" stroke-width="4" stroke-linecap="round"/>
      <path d="M76 148V112a13 13 0 0126 0v36z" fill="#6e4524" ${o}/><path d="M89 100v48M82 106v42M96 106v42" stroke="#3a2412" stroke-width="1" opacity=".6"/><circle cx="96" cy="130" r="1.8" fill="#f2c36a"/>
      ${win(118, 108, 22, 20)}${lantern(108, 100)}
      <rect x="70" y="148" width="38" height="6" rx="1" fill="#a98757" ${o1}/>
      <g transform="translate(150 146)"><ellipse cx="0" cy="8" rx="11" ry="4" fill="#2b1d14" opacity=".25"/><rect x="-8" y="-4" width="16" height="12" rx="2" fill="#a0713f" ${o1}/><ellipse cx="0" cy="-4" rx="8" ry="3" fill="#d9ad72" ${o1}/><path d="M2 -4l9-18" stroke="#6b4423" stroke-width="2.4" stroke-linecap="round"/><path d="M8 -24l8 4-3 6z" fill="#9aa8b4" ${o1}/></g>
      <g transform="translate(46 140)">${[0, 1, 2].map(i => `<ellipse cx="${i * 9}" cy="8" rx="4.2" ry="4.4" fill="#d9ad72" ${o1}/>`).join('')}${[0, 1].map(i => `<ellipse cx="${4.5 + i * 9}" cy="1" rx="4.2" ry="4.4" fill="#c28f55" ${o1}/>`).join('')}</g>
      <g>${[[60, 154, '#f27f9c'], [64, 157, '#fff'], [138, 156, '#f2d34c'], [146, 158, '#f27f9c']].map(f => `<circle cx="${f[0]}" cy="${f[1]}" r="2" fill="${f[2]}" ${o1}/>`).join('')}</g>
      `,

    smelter: (c) => `${pine(20, 116, .95)}${ground()}
      <rect x="132" y="22" width="26" height="100" fill="url(#g-brick)" ${o}/><rect x="132" y="22" width="26" height="100" fill="url(#p-bricks)"/><rect x="128" y="16" width="34" height="9" fill="#5d3228" ${o}/><path d="M158 22v100" stroke="#000" opacity=".2" stroke-width="8"/>${smoke(145, 6)}
      <path d="M26 150V92l8-10h98l8 10v58z" fill="url(#g-stone)" ${o}/><path d="M26 150V92l8-10h98l8 10v58z" fill="url(#p-stones)"/><path d="M110 82h22l8 10v58h-30z" fill="#000" opacity=".16"/>
      <path d="M22 92L34 70H132L144 92Z" fill="url(#g-roofI)" ${o}/><path d="M22 92L34 70H132L144 92Z" fill="url(#p-shingle)"/>${flag(46, 72, c.acc)}<path d="M22 92h122" stroke="${c.acc}" stroke-width="4" stroke-linecap="round"/>
      <path d="M52 150v-34a24 24 0 0148 0v34z" fill="#1d1a1c" ${o}/><path d="M60 150v-30a16 16 0 0132 0v30z" fill="url(#g-fire)" class="a2-fire"/><path d="M68 150q4-14 8-6t8-10" stroke="#fff3b0" stroke-width="2" fill="none" opacity=".8"/>
      <ellipse cx="76" cy="110" rx="34" ry="30" fill="url(#g-halo)" opacity=".5" class="a2-halo2"/>
      <rect x="40" y="112" width="72" height="5" fill="#4a5560" ${o1}/><rect x="40" y="108" width="6" height="42" fill="#4a5560" ${o1}/><rect x="106" y="108" width="6" height="42" fill="#4a5560" ${o1}/>
      <g transform="translate(150 150)"><ellipse cx="6" cy="6" rx="18" ry="4" fill="#2b1d14" opacity=".25"/><path d="M-8 -16h28l-4 18H-4z" fill="#6c7782" ${o1}/><circle cx="-1" cy="6" r="4" fill="#3b4650" ${o1}/><circle cx="13" cy="6" r="4" fill="#3b4650" ${o1}/><path d="M-6 -16q8-10 14-4t12 4" fill="#e9b52f" ${o1}/><path d="M0 -20l5 3 4-4 4 4" fill="none" stroke="#ffd96b" stroke-width="1.6"/></g>
      <g transform="translate(18 150)">${[0, 1, 2].map(i => `<path d="M${i * 11} 0l4-9h8l4 9z" fill="#b9c7d6" ${o1}/>`).join('')}<path d="M5 -9l4-9h8l4 9z" fill="#d6e0ea" ${o1}/></g>
      <g transform="translate(112 142)"><path d="M0 0h10l-2 12H2z" fill="#8a5a33" ${o1}/><path d="M1 0q4-6 8 0" fill="none" stroke="${INK}" stroke-width="1.4"/></g>
      `,

    bigtop: (c) => `${pine(18, 120, .85)}${pine(184, 122, .8)}${ground(92)}
      <path d="M100 8v20" stroke="${INK}" stroke-width="3"/><path d="M100 8h24l-6 8 6 8h-24z" class="a2-flag" fill="${c.acc}" ${o1}/>
      <path d="M100 24L28 92H172z" fill="url(#p-stripe)" ${o}/><path d="M100 24L28 92H172z" fill="url(#g-cream)" opacity=".0"/><path d="M100 24L172 92H128z" fill="#1a1020" opacity=".18"/><path d="M100 24L40 80" stroke="#fff" stroke-width="3" opacity=".25"/>
      <path d="M28 92h144v34H28z" fill="url(#p-stripe)" ${o}/><path d="M118 92h54v34h-54z" fill="#1a1020" opacity=".18"/>
      <path d="M28 92q7 11 14 0t14 0 14 0 14 0 14 0 14 0 14 0 14 0 14 0 14 0 14 0 14 0" fill="#c9412f" ${o1}/>
      <path d="M78 150V112q22-26 44 0v38z" fill="#2a1a24" ${o}/><path d="M86 150V114q14-18 28 0v36z" fill="url(#g-glow)" class="a2-glow"/><path d="M100 96v54" stroke="#2a1a24" stroke-width="2.4"/>
      <path d="M78 112q10-18 22-14-6 12-22 14zM122 112q-10-18-22-14 6 12 22 14z" fill="#c9412f" ${o1}/>
      <g>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${40 + i * 20} 100l5 9-10 0z" fill="${['#f2b34c', '#7ec8e3', '#c590d6', '#8fc08a'][i % 4]}" ${o1}/>`).join('')}<path d="M40 100Q100 118 160 100" fill="none" stroke="${INK}" stroke-width="1.2"/></g>
      <g transform="translate(46 146)"><rect x="-12" y="-22" width="24" height="24" fill="url(#g-plank)" ${o1}/><path d="M-14 -22l14-10 14 10z" fill="${c.acc}" ${o1}/><rect x="-6" y="-14" width="12" height="9" fill="url(#g-glow)" ${o1} class="a2-glow"/></g>
      <g transform="translate(150 146)"><path d="M0 0v-26" stroke="${INK}" stroke-width="3"/><path d="M-4 -26h8l-2-8q-2-6-4 0z" fill="url(#g-fire)" ${o1} class="a2-fire"/></g>`,
    field: (c) => `${ground(92)}<path d="M20 150L38 104H162L180 150z" fill="#8a6a3a" ${o}/>${[0, 1, 2, 3, 4].map(r => `<path d="M${26 + r * 2 - r * 0} ${146 - r * 9}L${174 - r * 2} ${146 - r * 9}" stroke="#6d4f27" stroke-width="3" opacity=".5"/>${Array.from({ length: 14 }, (_, i) => `<g transform="translate(${34 + i * 9.6 - r * 1.2} ${142 - r * 9})"><path d="M0 4V-8" stroke="#8aa04a" stroke-width="1.6"/><ellipse cx="0" cy="-11" rx="2.4" ry="5" fill="url(#g-wheat)" stroke="${INK}" stroke-width=".8"/><ellipse cx="-3" cy="-7" rx="2" ry="4" transform="rotate(-25 -3 -7)" fill="url(#g-wheat)" stroke="${INK}" stroke-width=".8"/><ellipse cx="3" cy="-7" rx="2" ry="4" transform="rotate(25 3 -7)" fill="url(#g-wheat)" stroke="${INK}" stroke-width=".8"/></g>`).join('')}`).join('')}
      <g transform="translate(100 118)"><path d="M0 0V30" stroke="#6b4423" stroke-width="3.4"/><path d="M-16 8h32" stroke="#6b4423" stroke-width="3.4"/><circle cx="0" cy="-6" r="6" fill="#e9c98a" ${o1}/><path d="M-10 -9h20" stroke="${INK}" stroke-width="2"/><path d="M-6 -10a6 6 0 0112 0z" fill="#6b4423" ${o1}/><path d="M-14 8l-5 8 6-2zM14 8l5 8-6-2z" fill="#a98757" ${o1}/><circle cx="-2" cy="-6" r="1" fill="${INK}"/><circle cx="2" cy="-6" r="1" fill="${INK}"/></g>
      ${fence(20, 60, 152)}${fence(140, 182, 152)}
      <g transform="translate(160 100)">${wallOf('plank', 0, 0, 28, 26)}<path d="M-4 0L14 -14L32 0z" fill="url(#g-roofR)" ${o1}/><path d="M-4 0H32" stroke="${c.acc}" stroke-width="3"/></g>
      <g fill="#2b1d14"><path d="M54 90l5-3 1 4zM130 84l5-3 1 4z"/></g>`,
    windmill: (c) => `${pine(24, 116, .9)}${ground()}
      <path d="M72 150L84 62H116L128 150z" fill="url(#g-stone)" ${o}/><path d="M72 150L84 62H116L128 150z" fill="url(#p-stones)"/><path d="M110 62H116L128 150H112z" fill="#000" opacity=".16"/>
      <path d="M80 62L100 36L120 62z" fill="url(#g-roofR)" ${o}/><path d="M80 62h40" stroke="${c.acc}" stroke-width="4" stroke-linecap="round"/>
      ${doorA(92, 122, 16, 28)}${win(94, 84, 12, 14, false)}
      <g transform="translate(100 56)"><g class="a2-spin">${[0, 90, 180, 270].map(a => `<g transform="rotate(${a})"><path d="M0 0V-46" stroke="${INK}" stroke-width="3.4"/><path d="M2 -8H17V-44H2z" fill="url(#g-cream)" ${o1}/><path d="M2 -20H17M2 -32H17" stroke="#a8977a" stroke-width="1"/></g>`).join('')}</g><circle r="5" fill="#6e4524" ${o1}/></g>
      <g transform="translate(142 148)">${[0, 1].map(i => `<path d="M${i * 14} 0l-2-14q9-5 18 0l-2 14z" fill="url(#g-cream)" ${o1}/>`).join('')}<path d="M7 -14q9-4 18 0l-2 -12q-7-3-14 0z" fill="#f4ead2" ${o1}/></g>
      <g fill="#fff" opacity=".6"><circle cx="150" cy="86" r="1.6"/><circle cx="158" cy="92" r="1.2"/><circle cx="146" cy="96" r="1"/></g>`,
    house2: (c) => `${pine(22, 118, .9)}${pine(180, 120, .8)}${ground()}
      ${wallOf(c.big ? 'plank' : 'log', 40, 84, 124, 66)}${wallOf(c.big ? 'plank' : 'log', 52, 52, 100, 36)}
      ${gable(102, 54, 100, 26, 'g-roofR', c.acc)}${gable(102, 88, 124, 16, 'g-roofR', c.acc)}
      ${c.chimney ? chim(134, 28, 32) : ''}
      ${win(62, 62, 14, 14)}${win(126, 62, 14, 14)}${win(56, 106, 18, 16)}${win(130, 106, 18, 16)}${doorA(92, 112, 20, 38)}
      <rect x="44" y="138" width="116" height="5" fill="#a98757" ${o1}/><path d="M48 138v12M80 138v12M122 138v12M156 138v12" stroke="${INK}" stroke-width="2.6"/><path d="M48 143H156" stroke="${INK}" stroke-width="2"/>
      ${c.big ? `<path d="M40 100H164" stroke="${c.acc}" stroke-width="3" opacity=".0"/><path d="M62 96q6 6 12 0t12 0 12 0 12 0 12 0 12 0 12 0" fill="none" stroke="${c.acc}" stroke-width="3"/>${person(70, 150, '#c590d6')}${person(138, 150, '#7ec8e3', '#e4d6b8')}` : `<g transform="translate(100 74)"><path d="M-14 0q-6-8-2-14M14 0q6-8 2-14M-8 -6q-4-8 0-12M8 -6q4-8 0-12" stroke="#e9dfc8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-14 6h28" stroke="#6b4423" stroke-width="3"/></g>`}
      ${lantern(86, 100)}`,
    pens: (c) => `${ground(92)}
      <path d="M30 148L40 98H160L170 148z" fill="#9a8148" ${o}/><path d="M44 140l4-30M72 144l2-34M100 146V108M128 144l-2-34M156 140l-4-30" stroke="#6d5a2f" stroke-width="2" opacity=".6"/>
      ${cow(68, 128)}${cow(110, 122, -1)}${cow(144, 134)}
      ${fence(26, 174, 150)}${fence(34, 166, 100)}
      <g transform="translate(14 150)"><path d="M0 0L8 -30H48L56 0z" fill="url(#g-plank)" ${o}/><path d="M-4 -30L28 -48L60 -30z" fill="url(#g-roofR)" ${o}/><path d="M-4 -30H60" stroke="${c.acc}" stroke-width="3"/></g>
      <g transform="translate(150 96)"><path d="M0 0h30v10H0z" fill="url(#g-wd2)" ${o1}/><path d="M2 0q14 -6 26 0" fill="#7fc3e0" ${o1}/></g>
      <g transform="translate(98 100)"><ellipse cx="0" cy="0" rx="16" ry="9" fill="#e7c25f" ${o1}/><path d="M-12 -2l24 0M-8 3l16 0" stroke="#b8861f" stroke-width="1.2"/></g>`,
    long: (c) => `${pine(18, 120, .85)}${ground(92)}
      ${wallOf('plank', 22, 86, 156, 64)}${roofT(14, 186, 56, 88, 'g-roofR', c.acc)}
      ${[0, 1, 2, 3, 4].map(i => win(34 + i * 28, 100, 14, 16, false)).join('')}${doorR(88, 112, 22, 38)}
      <g>${[0, 1, 2, 3].map(i => `<g transform="translate(${34 + i * 38} 138)"><path d="M0 -10v10" stroke="${INK}" stroke-width="2"/><path d="M-5 -9q5 -6 10 0z" fill="${['#8a5a33', '#4f7aa6', '#a8764a', '#6b4423'][i]}" ${o1}/></g>`).join('')}</g>
      ${chim(150, 40, 20)}<rect x="22" y="144" width="156" height="6" fill="#a98757" ${o1}/>${lantern(76, 108)}${person(160, 150, '#c9412f')}`,
    shed: (c) => `${ground(90)}
      <rect x="34" y="94" width="132" height="56" fill="#2a1a24" ${o}/><path d="M34 94h132v56H34z" fill="url(#g-wd2)" opacity=".25"/>
      <path d="M20 96L40 62H160L180 96z" fill="url(#g-roofR)" ${o}/><path d="M20 96L40 62H160L180 96z" fill="url(#p-shingle)"/><path d="M20 96H180" stroke="${c.acc}" stroke-width="4" stroke-linecap="round"/>
      <path d="M32 96V150M168 96V150" stroke="${INK}" stroke-width="7"/><path d="M32 96V150M168 96V150" stroke="#b98d58" stroke-width="3.6"/>
      <rect x="48" y="126" width="68" height="8" fill="url(#g-plank)" ${o1}/><path d="M54 134v16M110 134v16" stroke="${INK}" stroke-width="3"/>
      ${[0, 1, 2].map(i => `<path d="M${56 + i * 26} 100v14" stroke="#9aa8b4" stroke-width="2.4"/><path d="M${52 + i * 26} 114h8l-2 8h-4z" fill="#b9c7d6" ${o1}/>`).join('')}
      <g transform="translate(138 150)"><rect x="-8" y="-24" width="30" height="8" fill="#d9ad72" ${o1}/>${[0, 1, 2].map(i => `<rect x="${-8 + i * 11}" y="-16" width="10" height="16" fill="${['#c28f55', '#d9ad72', '#b98d58'][i]}" ${o1}/>`).join('')}</g>
      <g transform="translate(72 125)"><path d="M0 0l-10 -14h20z" fill="#d9ad72" ${o1}/></g>${lantern(100, 108)}${person(122, 150, '#7ec8e3')}`,
    church: (c) => `${pine(22, 118, .9)}${pine(180, 118, .9)}${ground()}
      ${wallOf('white', 56, 96, 88, 54)}${gable(100, 98, 88, 34, 'g-roofI', c.acc)}
      ${wallOf('white', 84, 50, 32, 50)}<path d="M80 52L100 20L120 52z" fill="url(#g-roofI)" ${o}/><path d="M100 4v18M94 11h12" stroke="${INK}" stroke-width="3"/><path d="M100 4v18M94 11h12" stroke="#f2e0b0" stroke-width="1.4"/>
      <path d="M92 76v-12a8 8 0 0116 0v12z" fill="#2a1a24" ${o1}/><path d="M97 72a3 3 0 016 0z" fill="#f2b34c"/>
      ${doorA(88, 118, 24, 32)}${win(64, 108, 14, 22, false)}${win(122, 108, 14, 22, false)}
      <path d="M42 150h116v-6H42z" fill="#c9b88e" ${o1}/><path d="M82 150h36v6H82z" fill="#d9c9a3" ${o1}/>
      <g transform="translate(168 120)"><rect x="0" y="-20" width="22" height="14" fill="url(#g-plank)" ${o1}/><path d="M2 -16h18" stroke="#e4d6b8" stroke-width="1.6"/><path d="M4 -6v26M18 -6v26" stroke="${INK}" stroke-width="2.4"/></g>${person(40, 152, '#8f5ba6', '#2b1d14')}`,
    hall: (c) => `${pine(16, 120, .8)}${pine(186, 120, .8)}${ground(94)}
      ${wallOf('cream', 34, 90, 132, 60)}
      <path d="M26 92L100 52L174 92z" fill="url(#g-white)" ${o}/><path d="M100 52L174 92H100z" fill="#000" opacity=".1"/><path d="M26 92H174" stroke="${c.acc}" stroke-width="4"/><circle cx="100" cy="76" r="8" fill="url(#g-glow)" ${o1} class="a2-glow"/>
      ${[0, 1, 2, 3, 4].map(i => `<rect x="${42 + i * 29}" y="92" width="9" height="54" fill="url(#g-cream)" ${o1}/>`).join('')}
      ${doorA(90, 114, 20, 36)}${win(54, 108, 14, 22, false)}${win(132, 108, 14, 22, false)}${[0, 1, 2].map(i => `<path d="M${38 + i * 6} 150h${124 - i * 12}v-${4}" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".0"/>`).join('')}
      <path d="M30 150h140v-5H30zM24 155h152v-5H24z" fill="#d9c9a3" ${o1}/><path d="M100 52V36" stroke="${INK}" stroke-width="2.6"/><path d="M100 36h20l-5 6 5 6h-20z" fill="${c.acc}" ${o1} class="a2-flag"/>${person(54, 156, '#4f7aa6', '#2b1d14')}${person(150, 156, '#c590d6', '#e4d6b8')}`,
    factory: (c) => `${pine(14, 122, .8)}${ground(94)}
      ${wallOf(c.stone ? 'stone' : 'brick', 26, 92, 148, 58)}
      ${[0, 1, 2].map(i => `<path d="M${26 + i * 49} 92V70L${75 + i * 49 - 0} 92z" fill="url(#g-roofI)" ${o}/>`).join('')}
      <path d="M26 92H174" stroke="${c.acc}" stroke-width="4"/>
      ${[0, 1, 2, 3, 4].map(i => win(38 + i * 28, 104, 14, 14, false)).join('')}${doorR(88, 120, 26, 30)}
      <rect x="148" y="30" width="18" height="62" fill="url(#g-brick)" ${o}/><rect x="148" y="30" width="18" height="62" fill="url(#p-bricks)"/><rect x="145" y="25" width="24" height="7" fill="#5d3228" ${o}/>${smoke(157, 14)}
      <rect x="40" y="42" width="14" height="50" fill="url(#g-brick)" ${o}/><rect x="37" y="38" width="20" height="6" fill="#5d3228" ${o}/>${smoke(47, 26)}
      ${c.gear ? `<g transform="translate(100 62)"><g class="a2-spin"><circle r="11" fill="#8d9eb0" ${o1}/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="-2" y="-15" width="4" height="6" fill="#8d9eb0" transform="rotate(${a})" ${o1}/>`).join('')}<circle r="4" fill="#2b1d14"/></g></g>` : ''}
      ${c.pig ? `<g transform="translate(100 66)"><ellipse cx="0" cy="0" rx="12" ry="8" fill="#f2b3a8" ${o1}/><circle cx="10" cy="0" r="4" fill="#f7c9c0" ${o1}/><circle cx="-6" cy="-6" r="3" fill="#f2b3a8" ${o1}/></g>` : ''}
      ${crate(30, 150, 14)}${crate(46, 150, 14)}${crate(38, 136, 12)}${rails(156, 120, 190)}`,
    dock: (c) => `<ellipse cx="100" cy="150" rx="94" ry="18" fill="url(#g-water)" ${o1}/><path d="M24 148q8-4 16 0t16 0 16 0M120 154q8-4 16 0t16 0" stroke="#bfe3f5" stroke-width="1.6" fill="none" opacity=".7"/>
      <path d="M16 110H128L138 146H8z" fill="url(#g-plank)" ${o}/><path d="M24 120H122M20 132H132" stroke="#4b3220" stroke-width="1.2" opacity=".6"/><path d="M26 146v8M60 146v8M96 146v8M126 146v8" stroke="${INK}" stroke-width="4"/>
      ${barrel(34, 118)}${crate(50, 120, 16)}${crate(66, 120, 12)}${person(86, 118, '#c9412f')}
      <g transform="translate(142 132)"><path d="M-6 8L0 -8H54L60 8z" fill="url(#g-red)" ${o}/><rect x="6" y="-26" width="30" height="18" fill="url(#g-white)" ${o}/><rect x="12" y="-22" width="8" height="8" fill="url(#g-glow)" ${o1}/><rect x="40" y="-30" width="9" height="22" fill="#44525f" ${o}/><path d="M38 -30h13l-2-4h-9z" fill="#44525f" ${o1}/>${smoke(44, -42)}<path d="M-2 4h60" stroke="${c.acc}" stroke-width="3"/></g>
      <g transform="translate(20 108)"><path d="M0 0V-24" stroke="${INK}" stroke-width="3"/>${lantern(0, -22)}</g>`,
    mine: (c) => `${ground(94)}<path d="M8 150L36 74L72 56L110 40L150 62L184 100L192 150z" fill="url(#g-stone)" ${o}/><path d="M8 150L36 74L72 56L110 40L150 62L184 100L192 150z" fill="url(#p-stones)"/><path d="M110 40L150 62L184 100L192 150H130z" fill="#000" opacity=".16"/>
      <path d="M62 150V110L100 96L138 110V150z" fill="#241a14" ${o}/><path d="M56 150V104L100 88L144 104V150" fill="none" stroke="#b98d58" stroke-width="7"/><path d="M56 150V104L100 88L144 104V150" fill="none" stroke="${INK}" stroke-width="1.4"/>
      ${rails(142, 70, 190)}
      <g transform="translate(150 142)"><path d="M-10 -14H20L16 4H-6z" fill="#6c7782" ${o1}/><circle cx="-2" cy="6" r="4" fill="#3b4650" ${o1}/><circle cx="14" cy="6" r="4" fill="#3b4650" ${o1}/>${c.ore === 'gold' ? '<path d="M-8 -14l4 -8 6 4 6 -6 6 8z" fill="url(#g-gold)" stroke="#2b1d14" stroke-width="1.2"/>' : '<path d="M-8 -14l4 -8 6 4 6 -6 6 8z" fill="url(#g-copper)" stroke="#2b1d14" stroke-width="1.2"/>'}</g>
      ${c.head ? `<g transform="translate(40 110)"><path d="M0 40L14 -28L28 40M6 14H22M3 28H25" fill="none" stroke="${INK}" stroke-width="5"/><path d="M0 40L14 -28L28 40M6 14H22M3 28H25" fill="none" stroke="#b98d58" stroke-width="2.4"/><circle cx="14" cy="-30" r="8" fill="#5c6b7a" ${o1}/><circle cx="14" cy="-30" r="2.6" fill="${INK}"/></g>` : `<g transform="translate(34 138)"><path d="M0 12h40" stroke="${INK}" stroke-width="2"/><path d="M4 12l6-22h22l6 22z" fill="url(#g-wd2)" ${o1}/><path d="M12 -2q8 -10 16 0" stroke="#7fc3e0" stroke-width="3" fill="none"/></g>`}
      ${[[84, 118], [98, 112], [118, 120], [130, 130]].map(g => `<path d="M${g[0]} ${g[1]}l3 -4 3 4-3 4z" fill="${c.ore === 'gold' ? '#ffd96b' : '#e8955f'}" ${o1}/>`).join('')}${flag(168, 98, c.acc)}${lantern(100, 100)}`,
    forge: (c) => `${ground(90)}
      <path d="M22 100L40 64H160L178 100z" fill="url(#g-roofR)" ${o}/><path d="M22 100L40 64H160L178 100z" fill="url(#p-shingle)"/><path d="M22 100H178" stroke="${c.acc}" stroke-width="4"/>
      <path d="M32 100V150M168 100V150" stroke="${INK}" stroke-width="8"/><path d="M32 100V150M168 100V150" stroke="#b98d58" stroke-width="4"/>
      <rect x="44" y="104" width="112" height="46" fill="#2a1a24" opacity=".85"/>
      <g transform="translate(60 150)"><rect x="0" y="-36" width="42" height="36" fill="url(#g-stone)" ${o}/><rect x="0" y="-36" width="42" height="36" fill="url(#p-stones)"/><path d="M9 0v-16a12 12 0 0124 0v16z" fill="#1d1a1c" ${o1}/><path d="M13 0v-13a8 8 0 0116 0v13z" fill="url(#g-fire)" class="a2-fire"/></g>
      <g transform="translate(118 148)"><path d="M0 0L6 -12H32L38 0z" fill="#3b4650" ${o}/><path d="M32 -12h14l-5 5h-9z" fill="#3b4650" ${o1}/><rect x="10" y="0" width="18" height="6" fill="#6b4423" ${o1}/><path d="M8 -12h22" stroke="#9aa8b4" stroke-width="2"/></g>
      <g fill="#ffd96b" class="a2-glow"><circle cx="112" cy="132" r="1.6"/><circle cx="106" cy="126" r="1.2"/><circle cx="118" cy="124" r="1.4"/></g>
      ${chim(138, 36, 32)}<g transform="translate(160 118)"><path d="M0 0q8 -12 16 0" fill="none" stroke="#b9c7d6" stroke-width="3"/></g>${person(100, 152, '#6b4423')}`,
    depot: (c) => `${ground(96)}${rails(152, 4, 196)}
      ${wallOf('plank', 40, 92, 100, 54)}${roofT(32, 148, 66, 94, 'g-roofI', c.acc)}
      ${doorR(84, 112, 22, 34)}${win(52, 106, 16, 18, false)}${win(114, 106, 16, 18, false)}
      <rect x="28" y="140" width="130" height="8" fill="url(#g-plank)" ${o1}/>
      <g transform="translate(97 74)"><circle r="9" fill="url(#g-white)" ${o1}/><path d="M0 -6V0l4 3" stroke="${INK}" stroke-width="1.6" fill="none"/></g>
      ${tower(176, 104)}
      <g transform="translate(16 152)"><rect x="0" y="-8" width="26" height="6" fill="#6c7782" ${o1}/><path d="M6 -8l4 -8M20 -8l-4 -8M4 -16h18" stroke="${INK}" stroke-width="2.4" fill="none"/><circle cx="6" cy="0" r="4" fill="#3b4650" ${o1}/><circle cx="20" cy="0" r="4" fill="#3b4650" ${o1}/></g>${flag(144, 94, c.acc)}${lantern(70, 100)}${person(120, 148, '#4f7aa6', '#2b1d14')}`,
    tents: (c) => `${ground(94)}${[[28, 0, '#c9412f'], [100, 1, '#2a8f84'], [64, 2, '#e7b83f']].sort((a, b) => a[1] - b[1]).map(t => '').join('')}
      ${[[34, 120, 0.9, '#c9412f'], [150, 118, 0.9, '#2a8f84'], [92, 134, 1.2, '#e7b83f']].map((t, i) => `<g transform="translate(${t[0]} ${t[1]}) scale(${t[2]})"><path d="M-34 30L0 -30L34 30z" fill="${t[3]}" ${o}/><path d="M-34 30L0 -30L-12 30zM12 30L0 -30L34 30z" fill="#fff0cf" opacity=".85"/><path d="M0 -30L34 30H12z" fill="#000" opacity=".14"/><path d="M-34 30q8 8 17 0t17 0 17 0 17 0" fill="${t[3]}" ${o1}/><path d="M-8 30V10q8-10 16 0V30z" fill="#2a1a24" ${o1}/><path d="M0 -30v-8" stroke="${INK}" stroke-width="2.4"/><path d="M0 -38h12l-3 4 3 4H0z" fill="${c.acc}" ${o1} class="a2-flag"/></g>`).join('')}
      <g>${[[56, 96], [112, 100], [172, 100]].map(l => lantern(l[0], l[1])).join('')}<path d="M10 96Q100 112 190 96" fill="none" stroke="${INK}" stroke-width="1.4"/></g>
      ${barrel(62, 152)}${crate(70, 152, 14)}${crate(126, 154, 14)}${barrel(140, 154)}${person(104, 156, '#c590d6', '#e4d6b8')}`,
    store: (c) => `${pine(14, 122, .8)}${ground(94)}
      ${wallOf(c.dining ? 'brick' : 'plank', 36, 76, 128, 74)}<path d="M30 76H170L162 56H38z" fill="url(#g-plank)" ${o}/><path d="M40 62H160" stroke="#4b3220" stroke-width="1" opacity=".5"/>
      <path d="M30 76H170" stroke="${c.acc}" stroke-width="4"/>${sign(62, 62, 76, 14, '#e4d6b8')}
      ${c.chimney ? chim(140, 22, 36) : ''}
      <path d="M32 98H168V108q-8 8-17 0t-17 0-17 0-17 0-17 0-17 0-17 0z" fill="${c.acc}" ${o}/><path d="M32 98H168V102H32z" fill="#fff" opacity=".25"/>
      ${win(48, 114, 30, 22, false)}${win(122, 114, 30, 22, false)}${doorR(90, 112, 20, 38)}
      ${c.fur ? `<g>${[0, 1, 2, 3].map(i => `<path d="M${44 + i * 22} 82q-8 14 0 26q8 -12 0 -26z" fill="${['#8a5a33', '#a8764a', '#6b4423', '#c28f55'][i]}" ${o1}/>`).join('')}</g>` : ''}
      ${c.dining ? `<g transform="translate(170 106)"><path d="M0 0L10 -14L20 0z" fill="#e9eef2" ${o1}/><path d="M10 -14V-22" stroke="${INK}" stroke-width="2"/><circle cx="10" cy="-24" r="3" fill="#ffd96b" ${o1}/></g>` : `${barrel(46, 152)}${crate(54, 152, 14)}${barrel(150, 152)}`}
      <rect x="30" y="148" width="140" height="6" fill="#a98757" ${o1}/>${lantern(86, 100)}${person(120, 152, '#8fc08a', '#e4d6b8')}`,
    yard: (c) => `${ground(96)}${rails(150, 6, 194)}
      ${[0, 1, 2].map(i => `<g>${crate(24 + i * 22, 146, 20, ['url(#g-plank)', 'url(#g-red)', 'url(#g-blu)'][i])}${i < 2 ? crate(34 + i * 22, 126, 18, ['url(#g-blu)', 'url(#g-plank)'][i]) : ''}</g>`).join('')}
      <g transform="translate(120 148)"><path d="M0 0V-62M0 -62H48" stroke="${INK}" stroke-width="7"/><path d="M0 0V-62M0 -62H48" stroke="#b98d58" stroke-width="3.4"/><path d="M48 -62V-34" stroke="${INK}" stroke-width="2"/><path d="M40 -34h16l-3 8H43z" fill="#8d9eb0" ${o1}/>${crate(30, -8, 14, 'url(#g-red)')}</g>
      <g transform="translate(160 150)"><rect x="-4" y="-22" width="40" height="22" fill="url(#g-plank)" ${o}/><path d="M-6 -22L16 -36L38 -22z" fill="url(#g-roofI)" ${o1}/><rect x="6" y="-14" width="10" height="14" fill="#2a1a24" ${o1}/><path d="M-6 -22H38" stroke="${c.acc}" stroke-width="3"/></g>
      <g transform="translate(70 168)"></g>${flag(14, 128, c.acc)}${person(106, 152, '#e0705a')}`,
    barn: (c) => `${pine(14, 124, .8)}${ground(94)}
      <path d="M30 150V98L46 70H154L170 98V150z" fill="url(#g-red)" ${o}/><path d="M30 150V98L46 70H154L170 98V150z" fill="url(#p-logs)" opacity=".35"/><path d="M130 70H154L170 98V150H130z" fill="#000" opacity=".16"/>
      <path d="M22 102L46 56H154L178 102h-8L150 66H50L30 102z" fill="url(#g-roofI)" ${o}/><path d="M22 102h8M170 102h8" stroke="${c.acc}" stroke-width="4"/>
      <rect x="82" y="108" width="36" height="42" fill="#3a2412" ${o}/><path d="M82 108l36 42M118 108L82 150" stroke="#f4ead2" stroke-width="3.4"/><rect x="82" y="108" width="36" height="42" fill="none" stroke="#f4ead2" stroke-width="3.4"/>
      <rect x="90" y="76" width="20" height="20" fill="#3a2412" ${o1}/><path d="M90 76l20 20M110 76L90 96" stroke="#f4ead2" stroke-width="2.4"/><path d="M100 62v-8" stroke="${INK}" stroke-width="3"/><circle cx="100" cy="54" r="3" fill="#b9c7d6" ${o1}/>
      ${win(46, 112, 18, 16, false)}${win(136, 112, 18, 16, false)}
      <g transform="translate(14 150)"><ellipse cx="0" cy="2" rx="14" ry="3" fill="${INK}" opacity=".22"/><path d="M-12 -18q6-8 16-4l8-6q4 2 2 8l-2 8-4 18h-4l-2-12h-8l-2 12h-4z" fill="#8a5a33" ${o1}/></g>
      <g transform="translate(176 152)"><ellipse cx="0" cy="2" rx="12" ry="3" fill="${INK}" opacity=".22"/><path d="M-10 -16q6-8 14-4l6-6q4 2 2 8l-2 6-4 16h-4l-2-10h-6l-2 10h-4z" fill="#d9ad72" ${o1}/></g>${crate(50, 152, 12)}${person(140, 152, '#4f7aa6')}`,
    bank: (c) => `${pine(14, 122, .8)}${pine(188, 124, .8)}${ground(94)}
      ${wallOf('stone', 36, 88, 128, 62)}<path d="M28 90H172L166 78H34z" fill="url(#g-white)" ${o}/><path d="M34 78L100 50L166 78z" fill="url(#g-white)" ${o}/><path d="M100 50L166 78H100z" fill="#000" opacity=".1"/><path d="M28 90H172" stroke="${c.acc}" stroke-width="4"/>
      <path d="M80 50a20 16 0 0140 0z" fill="url(#g-roofI)" ${o}/><path d="M100 34v-10" stroke="${INK}" stroke-width="2.4"/><circle cx="100" cy="22" r="3" fill="#ffd96b" ${o1}/><circle cx="100" cy="68" r="6" fill="url(#g-glow)" ${o1} class="a2-glow"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${44 + i * 36}" y="92" width="9" height="54" fill="url(#g-cream)" ${o1}/>`).join('')}
      <rect x="86" y="112" width="28" height="38" fill="#3b4650" ${o}/><circle cx="100" cy="131" r="8" fill="#b9c7d6" ${o1}/><path d="M100 123v16M92 131h16" stroke="${INK}" stroke-width="1.6"/>
      ${win(54, 112, 12, 18, false)}${win(134, 112, 12, 18, false)}<path d="M30 150h140v-5H30zM24 155h152v-5H24z" fill="#cfd8e0" ${o1}/>${lantern(70, 108)}${person(150, 156, '#2b1d14', '#2b1d14')}`,
    terminal: (c) => `${ground(96)}${rails(152, 4, 196)}
      ${wallOf('brick', 24, 86, 152, 64)}<path d="M16 88H184L176 72H24z" fill="url(#g-white)" ${o}/><path d="M16 88H184" stroke="${c.acc}" stroke-width="4"/>
      <rect x="80" y="40" width="40" height="48" fill="url(#g-brick)" ${o}/><path d="M74 40L100 18L126 40z" fill="url(#g-roofI)" ${o}/><circle cx="100" cy="54" r="11" fill="url(#g-white)" ${o}/><path d="M100 47v7l5 3" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M100 18v-10" stroke="${INK}" stroke-width="2.4"/><path d="M100 8h14l-4 5 4 5h-14z" fill="${c.acc}" ${o1} class="a2-flag"/>
      <path d="M40 150V118a16 16 0 0132 0V150zM128 150V118a16 16 0 0132 0V150z" fill="url(#g-glow)" ${o}/><path d="M56 118V150M144 118V150" stroke="${INK}" stroke-width="2"/>
      ${doorA(88, 108, 24, 42)}<g transform="translate(40 150)"><rect x="0" y="-10" width="32" height="10" fill="#c9412f" ${o1}/><circle cx="8" cy="2" r="4" fill="#3b4650" ${o1}/><circle cx="24" cy="2" r="4" fill="#3b4650" ${o1}/></g>${smoke(148, 104)}${person(112, 158, '#e0705a')}${person(130, 158, '#7ec8e3', '#e4d6b8')}`,
    arena: (c) => `${ground(96)}<ellipse cx="100" cy="124" rx="78" ry="22" fill="#d6b27a" ${o}/><ellipse cx="100" cy="124" rx="60" ry="14" fill="#c99e62" opacity=".7"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${30 + i * 17} ${112 + Math.abs(i - 4) * -0 + Math.pow(i - 4, 2) * .9}v30" stroke="${INK}" stroke-width="5"/><path d="M${30 + i * 17} ${112 + Math.pow(i - 4, 2) * .9}v30" stroke="#b98d58" stroke-width="2.4"/>`).join('')}<ellipse cx="100" cy="132" rx="78" ry="20" fill="none" stroke="${INK}" stroke-width="5"/><ellipse cx="100" cy="132" rx="78" ry="20" fill="none" stroke="#d9ad72" stroke-width="2.4"/>
      <g transform="translate(26 92)"><path d="M0 0H56V28H0z" fill="url(#g-plank)" ${o}/><path d="M-4 0L28 -16L60 0z" fill="url(#g-roofR)" ${o1}/><path d="M-4 0H60" stroke="${c.acc}" stroke-width="3"/>${[0, 1, 2, 3].map(i => `<circle cx="${8 + i * 13}" cy="12" r="3.4" fill="#f0c6a0" ${o1}/>`).join('')}</g>
      <g transform="translate(110 110)"><path d="M0 24q4-22 14-24l8-8q4 2 4 8l-4 6 6 18h-5l-5-10-8 10z" fill="#6b4423" ${o1}/>${person(34, 22, '#c9412f')}<path d="M40 8q14 -16 4 -24" fill="none" stroke="#c28f55" stroke-width="2"/></g>
      <g fill="#e8d4a8" opacity=".7"><circle cx="86" cy="150" r="5"/><circle cx="94" cy="154" r="7"/><circle cx="104" cy="150" r="4"/></g>${flag(176, 128, c.acc)}${flag(24, 134, c.acc)}`,
    fair: (c) => `${ground(96)}
      <g transform="translate(100 74)"><path d="M-22 76L0 0L22 76" fill="none" stroke="${INK}" stroke-width="7"/><path d="M-22 76L0 0L22 76" fill="none" stroke="#b98d58" stroke-width="3.4"/>
      <g class="a2-spin"><circle r="42" fill="none" stroke="${INK}" stroke-width="5"/><circle r="42" fill="none" stroke="${c.acc}" stroke-width="2.6"/>${[0, 45, 90, 135].map(a => `<path d="M0 -42V42" stroke="${INK}" stroke-width="3.2" transform="rotate(${a})"/>`).join('')}${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * 45 * Math.PI / 180; return `<g transform="translate(${Math.sin(a) * 42} ${-Math.cos(a) * 42})"><rect x="-6" y="-2" width="12" height="9" rx="2" fill="${['#c9412f', '#e7b83f', '#2a8f84', '#4f7aa6'][i % 4]}" ${o1} class="a2-keep"/></g>`; }).join('')}<circle r="5" fill="#ffd96b" ${o1}/></g></g>
      <g transform="translate(24 150)">${wallOf('plank', 0, -28, 38, 28)}<path d="M-4 -28H42L36 -42H2z" fill="url(#p-stripe)" ${o1}/><path d="M6 -18h26" stroke="#e4d6b8" stroke-width="5"/></g>
      <g transform="translate(150 150)">${wallOf('plank', 0, -26, 34, 26)}<path d="M-4 -26H38L32 -38H2z" fill="${c.acc}" ${o1}/><circle cx="17" cy="-12" r="6" fill="#f4ead2" ${o1}/></g>
      <path d="M10 70Q100 100 190 70" fill="none" stroke="${INK}" stroke-width="1.4"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${22 + i * 31} ${74 + Math.sin(i * 1.05) * 4}l5 9-10 0z" fill="${['#f2b34c', '#7ec8e3', '#c590d6', '#8fc08a', '#e0705a', '#f2b34c'][i]}" ${o1}/>`).join('')}${person(124, 154, '#c590d6', '#e4d6b8')}${person(80, 156, '#7ec8e3')}`,
    roundhouse: (c) => `${ground(96)}${rails(152, 4, 196)}
      <path d="M16 150a84 84 0 01168 0z" fill="url(#g-brick)" ${o}/><path d="M16 150a84 84 0 01168 0z" fill="url(#p-bricks)"/><path d="M100 66a84 84 0 0184 84H100z" fill="#000" opacity=".14"/>
      <path d="M10 150a90 90 0 01180 0h-10a80 80 0 00-160 0z" fill="url(#g-roofI)" ${o}/><path d="M10 150H190" stroke="${c.acc}" stroke-width="4"/>
      ${[0, 1, 2, 3].map(i => `<path d="M${34 + i * 36} 150v-34a14 14 0 0128 0v34z" fill="#241a14" ${o1}/>`).join('')}
      <g transform="translate(88 150)"><rect x="0" y="-26" width="38" height="26" fill="#44525f" ${o}/><rect x="-2" y="-44" width="10" height="20" fill="#44525f" ${o}/>${smoke(3, -52)}<circle cx="8" cy="-2" r="6" fill="#d9e1e8" ${o1}/><circle cx="28" cy="-2" r="6" fill="#d9e1e8" ${o1}/><path d="M38 -26l10 14v12H38z" fill="#c9412f" ${o1}/></g>
      <ellipse cx="100" cy="162" rx="30" ry="6" fill="#6c7782" ${o1}/><path d="M100 60V40" stroke="${INK}" stroke-width="3"/>${flag(100, 60, c.acc)}`,
    office: (c) => `${pine(18, 120, .85)}${ground(92)}
      ${wallOf('plank', 44, 84, 112, 66)}${roofT(36, 164, 60, 86, 'g-roofR', c.acc)}
      <path d="M44 84H156" stroke="#4b3220" stroke-width="1" opacity=".0"/>${sign(62, 66, 76, 14, '#f4ead2')}
      ${win(56, 98, 20, 22, false)}${win(124, 98, 20, 22, false)}${doorR(88, 110, 24, 40)}
      <g transform="translate(18 150)"><path d="M10 0L16 -34L22 0M16 -34L34 0" stroke="${INK}" stroke-width="3.4" fill="none"/><path d="M10 0L16 -34L22 0M16 -34L34 0" stroke="#b98d58" stroke-width="1.6" fill="none"/><rect x="8" y="-42" width="16" height="9" rx="2" fill="#5c6b7a" ${o1}/><circle cx="16" cy="-38" r="2.4" fill="#bfe3f5"/></g>
      <g transform="translate(160 152)"><rect x="0" y="-18" width="26" height="18" fill="url(#g-plank)" ${o1}/><path d="M3 -18l8 -9 10 9" fill="#f4ead2" ${o1}/><path d="M4 -10h18" stroke="#a8977a" stroke-width="2"/></g>
      <g transform="translate(46 116)"><path d="M0 0h18v22H0z" fill="#e4d6b8" ${o1}/><path d="M3 5h12M3 10h12M3 15h8" stroke="#a8977a" stroke-width="1.4"/><circle cx="14" cy="18" r="3" fill="#c9412f"/></g>${lantern(78, 106)}${person(138, 154, '#4f7aa6', '#2b1d14')}`,
  };
  const ACC = { R: '#d9806a', I: '#8aa5c8', C: '#52b5aa', S: '#b88acb' };
  const SPEC = {
    cabin: { t: 'cabin', r: 'R' }, wheatfield: { t: 'field', r: 'R' }, flourmill: { t: 'windmill', r: 'R' },
    lodge: { t: 'house2', r: 'R', chimney: 1 }, cattlepen: { t: 'pens', r: 'R' }, bunkhouse: { t: 'long', r: 'R' },
    carpentry: { t: 'shed', r: 'R' }, meetinghouse: { t: 'church', r: 'R' }, guestranch: { t: 'house2', r: 'R', big: 1 },
    assemblyhall: { t: 'hall', r: 'R' },
    smelter: { t: 'smelter', r: 'I' }, rollingmill: { t: 'factory', r: 'I' }, landing: { t: 'dock', r: 'I' },
    placer: { t: 'mine', r: 'I', ore: 'gold' }, redshaft: { t: 'mine', r: 'I', ore: 'copper', head: 1 }, anvil: { t: 'forge', r: 'I' },
    packing: { t: 'factory', r: 'I', pig: 1 }, junction: { t: 'depot', r: 'I' },
    bazaar: { t: 'tents', r: 'C' }, drygoods: { t: 'store', r: 'C' }, furexchange: { t: 'store', r: 'C', fur: 1, chimney: 1 },
    freightyard: { t: 'yard', r: 'C' }, livery: { t: 'barn', r: 'C' }, savings: { t: 'bank', r: 'C' },
    terminal: { t: 'terminal', r: 'C' }, diningHall: { t: 'store', r: 'C', dining: 1, chimney: 1 },
    roundup: { t: 'arena', r: 'S' }, advocate: { t: 'office', r: 'S' }, assemblyplant: { t: 'factory', r: 'S', gear: 1, stone: 1 },
    countyfair: { t: 'fair', r: 'S' }, bigtop: { t: 'bigtop', r: 'S' }, roundhouse: { t: 'roundhouse', r: 'S' },
  };
  function sprite(id, cls) {
    const sp = SPEC[id] || SPEC.cabin;
    return `<svg class="spr spr2 ${cls || ''}" viewBox="0 0 200 180" role="img" aria-hidden="true">${TPL[sp.t](Object.assign({ acc: ACC[sp.r] }, sp))}</svg>`;
  }
  const CSS = `.spr2{overflow:visible}
  .a2-spin{animation:a2sp 28s linear infinite;transform-box:view-box}
  @keyframes a2sp{to{transform:rotate(360deg)}}
  .a2-smoke{animation:a2s 5s ease-in infinite;transform-box:fill-box;transform-origin:center bottom}
  @keyframes a2s{0%{transform:translateY(8px) scale(.7);opacity:0}25%{opacity:.85}100%{transform:translateY(-26px) scale(1.25);opacity:0}}
  .a2-flag{animation:a2f 3s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}
  @keyframes a2f{0%,100%{transform:skewY(0)}50%{transform:skewY(-6deg)}}
  .a2-glow{animation:a2g 4.5s ease-in-out infinite}
  @keyframes a2g{0%,100%{filter:brightness(1)}45%{filter:brightness(1.18)}60%{filter:brightness(.92)}}
  .a2-fire{animation:a2fi 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center bottom}
  @keyframes a2fi{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.07) scaleX(.96)}}
  .a2-halo2{animation:a2h 2.8s ease-in-out infinite}@keyframes a2h{0%,100%{opacity:.4}50%{opacity:.62}}
  @media (prefers-reduced-motion:reduce){.a2-smoke,.a2-flag,.a2-glow,.a2-fire,.a2-halo2,.a2-spin{animation:none}}`;
  root.ClaimArt2 = { DEFS, sprite, CSS, TPL, SPEC };
  if (root.HSART && root.document) {
    root.HSART.sprite = sprite;
    const st = root.document.createElement('style'); st.textContent = CSS; root.document.head.appendChild(st);
  }
})(typeof window !== 'undefined' ? window : globalThis);
