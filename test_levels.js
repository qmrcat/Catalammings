const E = require('./engine.js');
const LEVELS = require('./levels.js');

function firstPolice(g, c) {
  let best = null;
  for (const p of g.police) if (p.state === 'patrol' && Math.abs(p.y - c.y) < 20 && (p.x - c.x) * c.dir > 0)
    if (!best || Math.abs(p.x - c.x) < Math.abs(best.x - c.x)) best = p;
  return best;
}
const walkR = c => c.state === 'walk' && c.dir === 1;
const nearPolice = (c, g) => { const p = firstPolice(g, c); return p && c.x >= p.x - 80 && c.x <= p.x - 12; };
const has = (g, st) => g.cats.some(c => c.state === st);

const STRATS = [
  [ // 1
    { s: 'pont', n: 1, when: (c) => walkR(c) && c.x >= 284 && c.x <= 288 },
    { s: 'blocar', n: 1, when: (c, g) => walkR(c) && c.x >= 255 && c.x <= 262 && has(g, 'build') },
    { s: 'blocar', n: 1, when: (c, g) => c.state === 'block' && !has(g, 'build') && g._bridge },
  ],
  [ // 2
    { s: 'castell', n: 1, when: (c) => walkR(c) && c.x >= 288 && c.x <= 292 },
  ],
  [ // 3
    { s: 'cassolada', n: 2, when: (c, g) => walkR(c) && nearPolice(c, g) },
  ],
  [ // 4
    { s: 'calcots', n: 99, when: (c) => c.state === 'walk' && c.x < 200 && c.y < 120 && !c.floater },
    { s: 'pont', n: 1, when: (c) => walkR(c) && c.x >= 494 && c.x <= 497 },
    { s: 'blocar', n: 1, when: (c, g) => walkR(c) && c.x >= 470 && c.x <= 480 && has(g, 'build') },
    { s: 'blocar', n: 1, when: (c, g) => c.state === 'block' && !has(g, 'build') && g._bridge },
  ],
  [ // 5
    { s: 'cavar', n: 1, when: (c) => walkR(c) && c.x >= 240 && c.x <= 243 && c.y < 200 },
    { s: 'blocar', n: 1, when: (c, g) => walkR(c) && c.x >= 262 && c.x <= 270 && c.y < 200 && has(g, 'dig') },
    { s: 'picar', n: 1, when: (c) => walkR(c) && c.y > 230 && c.x >= 438 && c.x <= 444 },
  ],
  [ // 6
    { s: 'calcots', n: 99, when: (c) => c.state === 'walk' && c.x < 150 && c.y < 125 && !c.floater },
    { s: 'cassolada', n: 1, when: (c, g) => walkR(c) && nearPolice(c, g) },
    { s: 'castell', n: 1, when: (c) => walkR(c) && c.x >= 326 && c.x <= 330 },
    { s: 'pont', n: 1, when: (c) => walkR(c) && c.x >= 474 && c.x <= 477 },
    { s: 'blocar', n: 1, when: (c, g) => walkR(c) && c.x >= 455 && c.x <= 465 && has(g, 'build') },
    { s: 'blocar', n: 1, when: (c, g) => c.state === 'block' && !has(g, 'build') && g._bridge },
  ],
  [ // 7
    { s: 'cassolada', n: 2, when: (c, g) => walkR(c) && nearPolice(c, g) },
    { s: 'castell', n: 1, when: (c) => walkR(c) && c.x >= 236 && c.x <= 240 && c.y < 215 },
    { s: 'cavar', n: 1, when: (c) => walkR(c) && c.x >= 286 && c.x <= 289 && c.y < 215 },
    { s: 'blocar', n: 1, when: (c, g) => walkR(c) && c.x >= 304 && c.x <= 312 && c.y < 215 && has(g, 'dig') },
  ],
  [ // 8
    { s: 'cassolada', n: 1, when: (c, g) => walkR(c) && g.speakers.some(sp => sp.x - c.x > 15 && sp.x - c.x < 100) },
  ],
  [ // 9
    { s: 'calcots', n: 1, when: (c) => walkR(c) && c.x > 120 && c.y > 200 },
    { s: 'pont', n: 1, when: (c) => walkR(c) && c.x >= 394 && c.x <= 397 },
    { s: 'blocar', n: 1, when: (c, g) => walkR(c) && c.x >= 365 && c.x <= 375 && has(g, 'build') },
    { s: 'blocar', n: 1, when: (c, g) => c.state === 'block' && !has(g, 'build') && g._bridge },
  ],
  [ // 10
    { s: 'mur', n: 1, when: (c) => walkR(c) && c.x >= 218 && c.x <= 222 },
    { s: 'cavar', n: 1, when: (c, g) => c.state === 'walk' && c.x >= 203 && c.x <= 207 && c.y < 215 && g.terr(225, 200) === 5 },
    { s: 'picar', n: 1, when: (c) => walkR(c) && c.y >= 240 && c.x >= 205 },
  ],
  [ // 11
    { s: 'pastis', n: 1, when: (c) => walkR(c) && c.x >= 230 && c.x <= 250 },
    { s: 'pont', n: 1, when: (c) => walkR(c) && c.x >= 454 && c.x <= 457 },
    { s: 'blocar', n: 1, when: (c, g) => walkR(c) && c.x >= 425 && c.x <= 435 && has(g, 'build') },
    { s: 'blocar', n: 1, when: (c, g) => c.state === 'block' && !has(g, 'build') && g._bridge },
  ],
];

function run(i, strat) {
  const g = new E.Game(LEVELS[i]);
  const used = strat ? strat.map(() => 0) : [];
  let guard = 0;
  while (!g.over && guard++ < 30000) {
    if (strat) strat.forEach((r, k) => {
      if (used[k] >= r.n) return;
      for (const c of g.cats) if (r.when(c, g) && g.assign(c, r.s)) { used[k]++; break; }
    });
    g.step();
    if (g.cats.some(c => c.state === 'shrug')) g._bridge = true;
  }
  return { ...g.result, secs: Math.round(g.tick / 25), used, reasons: g._reasons };
}

// comptar motius de pèrdua
const lose0 = E.Game.prototype.lose;
E.Game.prototype.lose = function (c, r) { this._reasons = this._reasons || {}; if (c.state !== 'angry' && c.state !== 'gone' && c.state !== 'exit') this._reasons[r] = (this._reasons[r] || 0) + 1; return lose0.call(this, c, r); };

let ok = true;
LEVELS.forEach((L, i) => {
  const a = run(i, null);
  const b = run(i, STRATS[i]);
  const good = !a.success && b.success;
  ok = ok && good;
  console.log(`${good ? 'OK ' : 'XX '} ${i + 1}. ${L.nom.padEnd(24)} sense fer res: ${a.saved}/${a.needed} ${JSON.stringify(a.reasons || {})} | amb estratègia: ${b.saved}/${b.needed} en ${b.secs}s usades ${b.used} ${JSON.stringify(b.reasons || {})}`);
});
process.exit(ok ? 0 : 1);
