/* Catalemmings — dibuix, interfície i so. */
(function () {
  'use strict';
  const E = window.CatEngine, LEVELS = window.CAT_LEVELS;
  const W = E.W, H = E.H, T = E.T;
  const $ = s => document.querySelector(s);

  /* =========================================================
     Dades de les habilitats
     ========================================================= */
  const SKILL_INFO = {
    calcots:   { nom: 'Calçots',   desc: 'Amb la panxa plena de calçots baixa planant de qualsevol alçada. Es pot donar a qui camina o ja cau.' },
    saltar:    { nom: 'Saltar',    desc: 'Un salt llarg endavant: per a forats estrets o per passar per sobre dels antiavalots si l\'encertes.' },
    blocar:    { nom: 'Blocar',    desc: 'Es planta amb els braços oberts i la colla es gira. Clica\'l una altra vegada amb Blocar per deixar-lo anar.' },
    pont:      { nom: 'Fer pont',  desc: 'Col·loca dotze maons en rampa per creuar forats. Si es queda curt, dona-li un altre pont.' },
    mur:       { nom: 'Mur de pedra', curt: 'Mur', desc: 'Aixeca al davant un marge de pedra seca que atura les pilotes de goma i també la colla. Després es gira.' },
    castell:   { nom: 'Castell',   desc: 'Aixeca un castell de quatre pisos. La resta s\'hi enfila i passa murs de la mateixa alçada.' },
    picar:     { nom: 'Picar',     desc: 'Obre un túnel endavant a cops de pic. Camina amb el pic a punt fins que troba paret. El marbre no cedeix.' },
    cavar:     { nom: 'Cavar',     desc: 'Excava cap avall fins que troba buit. El marbre no cedeix.' },
    cassolada: { nom: 'Cassolada', desc: 'Pica la cassola: els antiavalots, els polítics de lleis (i la seva barrera) i els de «Torneu a casa!» que siguin a prop fugen.' },
    pastis:    { nom: 'Pastís de nata', curt: 'Pastís', desc: 'Llança un pastís de nata endavant. Si hi ha un rei a la trona, apunta a la cara: el pedestal desapareix i el rei cau a terra.' }
  };
  const ORDER = E.SKILLS;
  const STATE_NAME = {
    walk: 'caminant', fall: 'caient', jump: 'saltant', climb: 'enfilant-se', build: 'fent pont', bash: 'picant',
    dig: 'cavant', cass: 'fent cassolada', shrug: 'acabant el pont', block: 'blocant', castell: 'fent castell',
    exit: 'arribant a l\'estelada', angry: 'se\'n torna a casa', wall: 'aixecant un mur', throw: 'tirant un pastís'
  };

  /* =========================================================
     Paleta i sprites (pixel art, 1 caràcter = 1 píxel lògic)
     ========================================================= */
  const PAL = {
    R: '#d42a2a', r: '#9c1a1c', S: '#f1c29a', E: '#2a1a12', W: '#f4efe4', B: '#1c1c26', P: '#33427a',
    F: '#e6d3a8', A: '#ff5a48', O: '#cf6235', T: '#aab3bd', t: '#7a4b2a', M: '#8a4a24', G: '#4fae3c',
    g: '#2c7a26', K: '#20263a', V: '#86a8d0', N: '#28325a', D: '#1b2240', Q: 'rgba(190,212,238,0.72)',
    H: '#3a2a1e', C: '#3f9447', X: '#ece6da', Y: '#f2f2f2', J: '#2b2b35', L: '#22222a', Z: '#9a9a9a',
    w: '#ffffff', p: '#fbf6e6', n: '#a89a80', y: '#f2c230', v: '#9d1a30', e: '#ffffff'
  };
  const HEAD = ['..RRR..', '.RRRR.r', '.SSSE..', '.SSSS..'];
  const SPR = {
    walk: [
      [...HEAD, '..WWW..', '.SWWWS.', '..BBB..', '..PPP..', '.P...P.', 'FF...FF'],
      [...HEAD, '..WWW..', '..WWWS.', '..BBB..', '..PPP..', '..PP...', '..FF...'],
      [...HEAD, '..WWW..', '.SWWW..', '..BBB..', '..PPP..', '.P..P..', 'FF..FF.'],
      [...HEAD, '..WWW..', '..WWWS.', '..BBB..', '..PPP..', '...PP..', '...FF..']
    ],
    arms: [['S.RRR.S', 'WRRRRrW', '.SSSE..', '.SSSS..', '..WWW..', '..WWW..', '..BBB..', '..PPP..', '.P...P.', 'FF...FF']],
    block: [['..RRR..', '.RRRRR.', '.SESES.', '.SSSSS.', 'SWWWWWS', '.WWWWW.', '..BBB..', '..PPP..', '.P...P.', 'FF...FF']],
    build: [
      [...HEAD, '..WWWSO', '..WWW..', '..BBB..', '..PPP..', '..P.P..', '.FF.FF.'],
      [...HEAD, '..WWW..', '..WWWS.', '..BBB.O', '..PPP..', '..P.P..', '.FF.FF.']
    ],
    bash: [
      ['..RRR...T', '.RRRR.rTT', '.SSSE.t..', '.SSSSt...', '..WWS....', '..WWW....', '..BBB....', '..PPP....', '..P.P....', '.FF.FF...'],
      ['..RRR....', '.RRRR.r..', '.SSSE....', '.SSSS....', '..WWWSttt', '..WWW...T', '..BBB...T', '..PPP....', '..P.P....', '.FF.FF...']
    ],
    dig: [
      [...HEAD, '..WWW.T', '..WWWSt', '..BBB.t', '..PPP.t', '..P.P.T', '.FF.FF.'],
      [...HEAD, '..WWW..', '..WWWS.', '..BBBt.', '..PPPt.', '..P.Pt.', '.FF.FTT']
    ],
    cass: [
      ['..RRR..T', '.RRRR.rT', '.SSSE.S.', '.SSSS.W.', '..WWWW..', '..WWWSMM', '..BBB.MM', '..PPP...', '..P.P...', '.FF.FF..'],
      ['..RRR...', '.RRRR.r.', '.SSSE...', '.SSSS...', '..WWWWST', '..WWWSMM', '..BBB.MM', '..PPP...', '..P.P...', '.FF.FF..']
    ],
    jump: [['S.RRR.S', 'WRRRRrW', '.SSSE..', '.SSSS..', '..WWW..', '..WWW..', '..BBB..', '.PPPP..', '.P..PF.', 'FF.....']],
    police: [
      ['..KKK....', '.KKKKK...', '.KVVVKQ..', '.KSSSKQ..', '..NNN.Q..', '.NNNNNQ..', 'NNNNNNQ..', '.NNNN.Q..', '.DDDD.Q..', '.DD.DDQ..', '.D...D...', 'KK...KK..'],
      ['..KKK....', '.KKKKK...', '.KVVVKQ..', '.KSSSKQ..', '..NNN.Q..', '.NNNNNQ..', 'NNNNNNQ..', '.NNNN.Q..', '.DDDD.Q..', '.DD.DDQ..', '..D.D....', '.KK.KK...']
    ],
    politic: [['..ZZZ..', '.ZSSS..', '.SSSE..', '..SSS..', '.JWrJ..', 'JJWrJJ.', 'JJJrJJ.', 'JJJJJJ.', '.JJJJ..', '.JJJJ..', '.LL.LL.', '.LL.LL.', 'KK..KK.']],
    mini: [['.H.', '.S.', 'CCC', 'CCC', 'BBB', 'XXX', 'X.X', 'X.X', 'X.X', 'F.F']],
    enxaneta: [['.Y.', '.S.', 'CCC', 'CCC', 'BBB', 'X.X', 'X.X', 'F.F']],
    // cap acotxat, camí de casa
    trist: [
      ['.......', '.RRRr..', 'RRRR.r.', '.SSSS..', '..SSE..', '.WWWW..', '.WWWS..', '..BBB..', '..PPP..', '.FF.FF.'],
      ['.......', '.RRRr..', 'RRRR.r.', '.SSSS..', '..SSE..', '.WWWW..', '.WWWS..', '..BBB..', '..PP...', '..FF...']
    ],
    // estirat a terra, camí de l'hospital
    estirat: [['rRR.......', 'RSSWWWBPPF', '.SEWWWBPPF']],
    // el rei, assegut, amb corona, barba i mantell d'ermini
    rei: [['.y.y.y.', '.yyyyy.', '.SSSSS.', '.SSSES.', '.ZZZZZ.', 'veBeBev', 'vvvvvvv', 'vvvvvvv', '.vvvvv.', '.vv.vv.', '.KK.KK.']],
    reiSensCorona: [['.......', '.ZZZZZ.', '.SSSSS.', '.SSSES.', '.ZZZZZ.', 'veBeBev', 'vvvvvvv', 'vvvvvvv', '.vvvvv.', '.vv.vv.', '.KK.KK.']],
    // aixecant pedres
    paleta: [
      [...HEAD, '..WWWS.', '..WWW.n', '..BBB..', '..PPP..', '..P.P..', '.FF.FF.'],
      ['..RRRn.', '.RRRRSr', '.SSSE..', '.SSSS..', '..WWW..', '..WWW..', '..BBB..', '..PPP..', '..P.P..', '.FF.FF.']
    ]
  };
  // Compila cada sprite a una llista de rectangles [x, y, color] amb l'àncora a la columna central de la base.
  const ANCHOR = { police: 4, mini: 1, enxaneta: 1 };
  const COMPILED = {};
  for (const k in SPR) {
    COMPILED[k] = SPR[k].map(rows => {
      const out = [];
      const ax = ANCHOR[k] !== undefined ? ANCHOR[k] : 3;
      rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch !== '.') out.push([i - ax, j - rows.length + 1, ch]);
        }
      });
      return out;
    });
  }
  function sprite(g, name, frame, x, y, dir, alpha, swap) {
    const list = COMPILED[name][frame % COMPILED[name].length];
    if (alpha !== undefined && alpha < 1) g.globalAlpha = Math.max(0, alpha);
    for (const [dx, dy, ch] of list) {
      const c = (swap && swap[ch]) || ch;
      g.fillStyle = PAL[c] || c;
      g.fillRect(x + (dir < 0 ? -dx : dx), y + dy, 1, 1);
    }
    g.globalAlpha = 1;
  }

  /* =========================================================
     Temes visuals dels nivells
     ========================================================= */
  const THEMES = {
    muntanya: { sky: ['#1b2756', '#6a3f73', '#e2834f', '#f6c06a'], far: '#4a3a6a', near: '#2f2550', kind: 'agulles' },
    ciutat: { sky: ['#14214e', '#4b3a78', '#c8607a', '#f0a070'], far: '#3b3566', near: '#26254c', kind: 'ciutat' },
    institucions: { sky: ['#161c38', '#2f3a66', '#6f7aa6', '#a7aecb'], far: '#3a4170', near: '#272d52', kind: 'palau' },
    nit: { sky: ['#050a1f', '#0c1838', '#1c2f66', '#33498a'], far: '#18234a', near: '#0f1734', kind: 'ciutat', stars: true }
  };

  function hash(x, y, s) {
    let n = (x * 374761393 + y * 668265263 + (s || 0) * 1442695041) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  /* ---------- colors del terreny ---------- */
  function earthColor(theme, x, y, depth) {
    const n = (hash(x, y, 7) - 0.5) * 14;
    const fade = 1 - Math.min(depth, 80) / 260;
    const mul = (c, f) => [c[0] * f + n, c[1] * f + n, c[2] * f + n];
    if (theme === 'muntanya') {
      if (depth <= 1) return hash(x, y, 3) > 0.5 ? [92, 148, 58] : [70, 122, 46];
      if (depth === 2) return [120, 104, 58];
      // conglomerat de Montserrat: còdols arrodonits en una matriu rogenca
      const cs = 7, cx = Math.floor(x / cs), cy = Math.floor(y / cs);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const gx = cx + a, gy = cy + b;
        if (hash(gx, gy, 11) < 0.25) continue;
        const px = gx * cs + hash(gx, gy, 1) * cs, py = gy * cs + hash(gx, gy, 2) * cs;
        const r = 1.6 + hash(gx, gy, 4) * 2.4;
        const dx = x + 0.5 - px, dy = y + 0.5 - py;
        if (dx * dx + dy * dy <= r * r) {
          const k = Math.floor(hash(gx, gy, 5) * 4);
          const base = [[208, 186, 156], [150, 140, 134], [196, 128, 98], [128, 92, 72]][k];
          const edge = dx * dx + dy * dy > (r - 1) * (r - 1) && dy > 0 ? 0.82 : 1;
          return mul(base, fade * edge);
        }
      }
      return mul([166, 104, 78], fade);
    }
    if (theme === 'ciutat' || theme === 'nit') {
      const night = theme === 'nit' ? 0.72 : 1;
      if (depth <= 1) return mul([178, 178, 172], night);
      if (depth === 2) return mul([120, 120, 118], night);
      // pedra de Montjuïc en filades
      const row = Math.floor((y - 3) / 6);
      const off = (row % 2) * 7;
      if ((y - 3) % 6 === 0 || (x + off) % 14 === 0) return mul([116, 88, 64], fade * night);
      const v = hash(Math.floor((x + off) / 14), row, 9) * 22;
      return mul([192 + v * 0.4, 152 + v * 0.3, 102], fade * night);
    }
    // institucions
    if (depth <= 1) return [150, 152, 160];
    if (depth === 2) return [110, 112, 122];
    if (hash(Math.floor(x / 3), Math.floor(y / 3), 13) > 0.92) return mul([150, 130, 112], fade);
    return mul([112, 86, 70], fade);
  }
  function terrainColor(theme, x, y, t, depth) {
    const n = (hash(x, y, 17) - 0.5) * 10;
    if (t === T.STEEL) {
      const row = Math.floor(y / 10), off = (row % 2) * 8;
      if (y % 10 === 0 || (x + off) % 16 === 0) return [158, 158, 172];
      const vein = Math.sin(x * 0.16 + y * 0.31 + Math.sin(y * 0.21 + x * 0.05) * 2.2);
      if (vein > 0.93) return [176, 176, 190];
      return [218 + n, 218 + n, 224 + n];
    }
    if (t === T.BRICK) return x % 6 === 0 ? [142, 58, 28] : [207 + n, 98 + n, 53];
    if (t === T.STONE) {
      // marge de pedra seca: pedres irregulars sense morter
      const row = Math.floor(y / 3), off = (row % 2) * 3;
      const cx = Math.floor((x + off) / 5);
      const gap = (y % 3 === 0 && hash(cx, row, 21) > 0.25) || ((x + off) % 5 === 0 && hash(cx, row, 22) > 0.3);
      if (gap) return [60, 52, 40];
      const k = hash(cx, row, 23);
      const base = k < 0.33 ? [176, 160, 128] : k < 0.66 ? [150, 140, 120] : [192, 170, 130];
      return [base[0] + n, base[1] + n, base[2] + n];
    }
    if (t === T.WALL) {
      const row = Math.floor(y / 6), off = (row % 2) * 6;
      if (y % 6 === 0 || (x + off) % 12 === 0) return [92, 96, 108];
      return [146 + n, 150 + n, 158 + n];
    }
    return earthColor(theme, x, y, depth);
  }

  /* =========================================================
     Estat de la interfície
     ========================================================= */
  const cv = $('#joc'), ctx = cv.getContext('2d');
  const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
  const lctx = layer.getContext('2d');
  const terrCv = document.createElement('canvas'); terrCv.width = W; terrCv.height = H;
  const tctx = terrCv.getContext('2d');
  const bgCv = document.createElement('canvas');
  let terrImg = null, terrDirty = true;
  let S = 2;

  let lvl = 0, cur = null, curOrigin = 'joc', game = null, sel = 'pont';
  let mode = 'joc', editorOverlay = null;
  let running = false, paused = false, fast = false;
  let pointer = null, hoverCat = null, shake = 0;
  let nukeArmed = 0, resultShown = false;
  let soundOn = true;
  let progress = loadProgress();

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem('catalemmings.v1')) || { best: {} }; } catch (e) { return { best: {} }; }
  }
  function saveProgress() {
    try { localStorage.setItem('catalemmings.v1', JSON.stringify(progress)); } catch (e) { /* sense emmagatzematge */ }
  }

  /* ---------- ordre i nivells amagats del menú (només en aquest navegador; levels.js no canvia) ---------- */
  const ORDER_KEY = 'catalemmings.ordre';
  let levelOrder = loadOrder();
  function loadOrder() {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(ORDER_KEY)); } catch (e) { /* sense emmagatzematge */ }
    const valid = i => Number.isInteger(i) && i >= 0 && i < LEVELS.length;
    const order = (o && Array.isArray(o.order) ? o.order : []).filter((i, k, a) => valid(i) && a.indexOf(i) === k);
    // els nivells nous de levels.js van al final
    for (let i = 0; i < LEVELS.length; i++) if (!order.includes(i)) order.push(i);
    const hidden = (o && Array.isArray(o.hidden) ? o.hidden : []).filter(valid);
    return { order, hidden: hidden.length < LEVELS.length ? hidden : [] };
  }
  function saveOrder() {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(levelOrder)); } catch (e) { /* sense emmagatzematge */ }
  }
  // nivells del joc visibles, en l'ordre triat (índexs de LEVELS)
  function playList() { return levelOrder.order.filter(i => !levelOrder.hidden.includes(i)); }
  function levelLabel(i) { const p = playList().indexOf(i); return p >= 0 ? `Nivell ${p + 1}` : 'Nivell amagat'; }
  function nextLevel(i) { const l = playList(), p = l.indexOf(i); return p >= 0 ? l[p + 1] : undefined; }

  /* =========================================================
     Carregar nivell
     ========================================================= */
  function loadLevel(i) { setupLevel(LEVELS[i], i, 'joc'); }

  // origin: 'joc' (nivell de la llista), 'propi' (nivell desat), 'prova' (prova de l'editor), 'editor' (vista de l'editor)
  function setupLevel(L, idx, origin, keepColors) {
    const themeChanged = !cur || cur.tema !== L.tema;
    cur = L; lvl = idx; curOrigin = origin;
    game = new E.Game(L);
    running = false; paused = false; fast = false; resultShown = false; nukeArmed = 0;
    flagFall = null;
    if (!keepColors || !terrImg) {
      terrImg = tctx.createImageData(W, H);
      recolorColumns(0, W - 1);
    }
    game.changed.length = 0;
    terrDirty = true;
    if (!keepColors || themeChanged) buildBackground();
    // habilitat seleccionada per defecte: la primera disponible
    sel = ORDER.find(s => game.skills[s] > 0) || 'pont';
    const nom = L.nom || 'Sense nom';
    $('#nivellNom').textContent = idx >= 0 ? `${levelLabel(idx)} · ${nom}`
      : origin === 'prova' ? `Prova · ${nom}` : origin === 'editor' ? `Editor · ${nom}` : `Nivell propi · ${nom}`;
    updateSkillButtons();
    updateControls();
    updateHud(true);
    setStatus(null);
  }

  // torna a pintar columnes senceres (profunditat correcta per a herba i voreres)
  function recolorColumns(x0, x1) {
    if (game.changed.length) game.changed.length = 0;
    const d = terrImg.data, m = game.terrain, theme = cur.tema;
    x0 = Math.max(0, Math.floor(x0)); x1 = Math.min(W - 1, Math.ceil(x1));
    for (let x = x0; x <= x1; x++) {
      let depth = 0;
      for (let y = 0; y < H; y++) {
        const i = y * W + x, t = m[i], o = i * 4;
        if (!t) { depth = 0; d[o + 3] = 0; continue; }
        depth++;
        const c = terrainColor(theme, x, y, t, depth);
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
    terrDirty = true;
  }

  function applyChanges() {
    if (!game.changed.length) return;
    const d = terrImg.data, theme = cur.tema;
    for (const i of game.changed) {
      const t = game.terrain[i], o = i * 4;
      if (!t) { d[o + 3] = 0; continue; }
      const x = i % W, y = (i / W) | 0;
      const c = terrainColor(theme, x, y, t, 9);
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    game.changed.length = 0;
    terrDirty = true;
  }

  /* =========================================================
     Mida del canvas
     ========================================================= */
  // mòbil en horitzontal (l'escenari omple la pantalla) i mòbil en vertical (cal girar-lo)
  const mqCompact = window.matchMedia('(orientation: landscape) and (max-height: 540px)');
  const mqGira = window.matchMedia('(orientation: portrait) and (max-width: 700px) and (pointer: coarse)');

  function resize() {
    const wrap = $('#scroll');
    let s;
    if (mqCompact.matches) {
      // l'escenari sencer ha de cabre entre les dues columnes d'habilitats
      s = Math.min(wrap.parentElement.clientWidth / W, $('#escenari').clientHeight / H);
    } else {
      s = wrap.clientWidth / W;
      const maxH = window.innerHeight * 0.7;
      if (H * s > maxH) s = maxH / H;
      s = Math.max(s, 1.35);
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.width = Math.round(W * s) + 'px';
    cv.style.height = Math.round(H * s) + 'px';
    cv.width = Math.round(W * s * dpr);
    cv.height = Math.round(H * s * dpr);
    S = cv.width / W;
    buildBackground();
  }

  /* =========================================================
     Fons: cel i siluetes
     ========================================================= */
  function buildBackground() {
    if (!game) return;
    const th = THEMES[cur.tema] || THEMES.muntanya;
    bgCv.width = cv.width; bgCv.height = cv.height;
    const g = bgCv.getContext('2d');
    const w = bgCv.width, h = bgCv.height;
    const grad = g.createLinearGradient(0, 0, 0, h);
    const stops = [0, 0.36, 0.56, 0.68];
    th.sky.forEach((c, i) => grad.addColorStop(stops[i], c));
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.save(); g.scale(S, S);
    if (th.stars) {
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,255,${0.3 + hash(i, 1, 2) * 0.6})`;
        g.fillRect(Math.floor(hash(i, 2, 3) * W), Math.floor(hash(i, 3, 4) * H * 0.55), 1, 1);
      }
      g.fillStyle = '#f4ecc8';
      g.beginPath(); g.arc(520, 46, 14, 0, Math.PI * 2); g.fill();
      g.fillStyle = th.sky[0];
      g.beginPath(); g.arc(527, 41, 13, 0, Math.PI * 2); g.fill();
    } else {
      g.fillStyle = 'rgba(255,236,190,0.55)';
      g.beginPath(); g.arc(120, 168, 22, 0, Math.PI * 2); g.fill();
    }
    if (th.kind === 'agulles') {
      drawAgulles(g, th.far, 175, 0.9, 1);
      drawAgulles(g, th.near, 205, 1.2, 2);
    } else if (th.kind === 'ciutat') {
      drawCity(g, th.far, 185, 1, !!th.stars);
      drawCity(g, th.near, 215, 2, !!th.stars);
    } else {
      drawPalau(g, th.far, th.near);
    }
    g.restore();
  }
  // les agulles de Montserrat: dits de roca arrodonits
  function drawAgulles(g, color, base, scale, seed) {
    g.fillStyle = color;
    let x = -10;
    let i = 0;
    while (x < W + 20) {
      const w = (10 + hash(i, seed, 1) * 16) * scale;
      const hgt = (30 + hash(i, seed, 2) * 70) * scale * (0.6 + 0.4 * Math.sin(x / 90 + seed));
      const top = base - hgt;
      g.beginPath();
      g.moveTo(x, H);
      g.lineTo(x, top + w / 2);
      g.arc(x + w / 2, top + w / 2, w / 2, Math.PI, 0);
      g.lineTo(x + w, H);
      g.fill();
      x += w * (0.55 + hash(i, seed, 3) * 0.35);
      i++;
    }
  }
  function drawCity(g, color, base, seed, night) {
    let x = -5, i = 0;
    while (x < W + 10) {
      const w = 14 + hash(i, seed, 1) * 26;
      const hgt = 20 + hash(i, seed, 2) * 60;
      g.fillStyle = color;
      g.fillRect(x, base - hgt, w, H);
      if (night) {
        for (let wy = base - hgt + 4; wy < base; wy += 6)
          for (let wx = x + 3; wx < x + w - 3; wx += 5)
            if (hash(Math.floor(wx), Math.floor(wy), seed) > 0.72) { g.fillStyle = 'rgba(255,214,120,0.55)'; g.fillRect(wx, wy, 2, 3); }
      }
      x += w + 1; i++;
    }
    if (seed === 1) {
      // quatre campanars punxeguts a l'horitzó
      g.fillStyle = color;
      const cx = 430;
      [[0, 95], [12, 110], [24, 112], [36, 98]].forEach(([dx, hh]) => {
        g.beginPath();
        g.moveTo(cx + dx, base);
        g.lineTo(cx + dx, base - hh * 0.55);
        g.quadraticCurveTo(cx + dx + 4, base - hh - 6, cx + dx + 8, base - hh * 0.55);
        g.lineTo(cx + dx + 8, base);
        g.fill();
      });
    }
  }
  function drawPalau(g, far, near) {
    g.fillStyle = far;
    g.fillRect(0, 150, W, H);
    // cúpula i columnata
    g.beginPath(); g.arc(470, 120, 34, Math.PI, 0); g.fill();
    g.fillRect(430, 118, 80, 40);
    g.fillRect(420, 100, 100, 6);
    g.fillStyle = near;
    for (let x = 0; x < W; x += 22) g.fillRect(x, 160, 8, 60);
    g.fillRect(0, 154, W, 8);
    g.fillRect(0, 205, W, H);
  }

  /* =========================================================
     Dibuix dels elements del nivell (capa lògica 640×320)
     ========================================================= */
  function drawEntrance(g) {
    const e = game.entrance, x = e.x, y = e.y;
    const open = game.tick > 18;
    // teulada
    for (let r = 0; r < 8; r++) {
      const half = 9 + r * 1.2;
      for (let i = Math.round(-half); i <= Math.round(half); i++) {
        g.fillStyle = (i + r) % 4 === 0 ? '#8e3420' : '#b5482a';
        g.fillRect(x + i, y - 34 + r, 1, 1);
      }
    }
    g.fillStyle = '#d8c3a0'; g.fillRect(x - 13, y - 26, 27, 14);
    g.fillStyle = '#6b4a35';
    g.fillRect(x - 13, y - 13, 27, 1);
    g.fillRect(x - 13, y - 26, 1, 14); g.fillRect(x + 13, y - 26, 1, 14);
    // finestra amb arc
    g.fillStyle = '#3a2a1e'; g.fillRect(x - 10, y - 23, 3, 4); g.fillRect(x + 8, y - 23, 3, 4);
    // porta
    g.fillStyle = open ? '#1a0f0a' : '#8a5a33';
    g.fillRect(x - 5, y - 23, 11, 10);
    if (open) {
      g.fillStyle = '#8a5a33';
      g.fillRect(x - 8, y - 23, 3, 10); g.fillRect(x + 6, y - 23, 3, 10);
    }
    drawSpanishFlag(g);
  }

  /* ---------- la bandera espanyola de la casa ----------
     Oneja al teulat mentre els catalemmings en surten. Quan n'arriben prou
     a l'estelada (els que calen per superar el nivell), cau a terra. */
  const FLAG_W = 18, FLAG_H = 24;
  const flagCv = document.createElement('canvas'); flagCv.width = FLAG_W; flagCv.height = FLAG_H;
  const fgc = flagCv.getContext('2d');
  let flagFall = null;
  function paintSpanishFlag(tick) {
    fgc.clearRect(0, 0, FLAG_W, FLAG_H);
    fgc.fillStyle = '#d6d6d6'; fgc.fillRect(0, 1, 1, FLAG_H - 1);
    fgc.fillStyle = '#ffd21f'; fgc.fillRect(0, 0, 1, 1);
    for (let i = 0; i < 16; i++) {
      const wave = Math.round(Math.sin(tick * 0.15 - i * 0.4) * 1.2 * (i / 16));
      for (let j = 0; j < 10; j++) {
        let col = (j < 3 || j > 7) ? '#c60b1e' : '#ffc400';
        // escut, reduït a quatre píxels
        if (i >= 3 && i <= 4 && j >= 4 && j <= 6) col = (i + j) % 2 ? '#a3131d' : '#8a5a1a';
        fgc.fillStyle = col;
        fgc.fillRect(1 + i, 1 + j + wave, 1, 1);
      }
    }
  }
  function drawSpanishFlag(g) {
    const e = game.entrance;
    const f = flagFall;
    if (f && f.landed) {
      // pal estirat a terra i la bandera arrugada al costat
      const gy = f.ground, sx = Math.round(f.x), d = f.side;
      g.fillStyle = '#bdbdbd';
      for (let i = 0; i < 22; i++) g.fillRect(sx + d * i, gy - 1, 1, 1);
      const rows = ['#c60b1e', '#ffc400', '#ffc400', '#c60b1e'];
      for (let i = 0; i < 14; i++) {
        const lift = (i % 5 === 2) ? 1 : 0;
        const h = 4 - (i > 11 ? 1 : 0);
        for (let j = 0; j < h; j++) {
          g.fillStyle = rows[j + (4 - h)];
          g.fillRect(sx + d * (9 + i), gy - 2 - j - lift, 1, 1);
        }
      }
      return;
    }
    paintSpanishFlag(game.tick);
    if (!f) { g.drawImage(flagCv, e.x, e.y - 33 - FLAG_H); return; }
    g.save();
    g.translate(f.x + 0.5, f.y);
    g.rotate(f.ang);
    g.drawImage(flagCv, -0.5, -FLAG_H);
    g.restore();
  }
  function groundBelow(x, y) {
    for (let yy = Math.max(0, y); yy < H; yy++) if (game.solid(x, yy)) return yy;
    return H;
  }
  // un pas de física de la bandera, sincronitzat amb els tics del joc
  function updateFlag() {
    if (!game) return;
    const e = game.entrance;
    if (!flagFall) {
      if (game.saved >= game.needed) {
        flagFall = { t: 0, x: e.x, y: e.y - 33, vy: 0, ang: 0, side: e.x < W / 2 ? 1 : -1, landed: false, after: 0 };
        game.say(e.x, e.y - 62, 'Cric, crac…', 'good');
        sfx('flagfall');
      }
      return;
    }
    const f = flagFall;
    if (f.landed) { f.after++; return; }
    f.t++;
    if (f.t <= 18) {
      // primer s'inclina sobre la base, cada cop més de pressa
      f.ang = f.side * Math.PI * 0.4 * Math.pow(f.t / 18, 2);
      return;
    }
    // després rellisca del teulat i cau
    f.vy = Math.min(f.vy + 0.35, 4);
    f.x += f.side * 1.6;
    f.y += f.vy;
    f.ang = f.side * Math.min(Math.PI / 2, Math.abs(f.ang) + 0.05);
    const tipX = f.x + Math.sin(f.ang) * 22, tipY = f.y - Math.cos(f.ang) * 22;
    const hit = game.solid(Math.round(f.x), Math.round(f.y) + 1) || game.solid(Math.round(tipX), Math.round(tipY) + 1);
    if (hit || f.y >= H - 2) {
      f.landed = true;
      f.ground = groundBelow(Math.round(f.x + f.side * 11), Math.round(Math.min(f.y, tipY)) - 6);
      if (f.ground >= H) f.ground = H - 1;
      game.say(f.x + f.side * 14, f.ground - 12, 'Plof!', 'good');
      sfx('flagland');
      shake = 5;
    }
  }

  function drawExit(g) {
    const e = game.exit, x = e.x, y = e.y;
    // portal de pedra
    for (let j = 0; j < 20; j++) for (let i = -9; i <= 9; i++) {
      const inside = Math.abs(i) <= 5 && j <= 13;
      const arch = j > 13 && j <= 15 && Math.abs(i) <= 5 - (j - 13) * 2;
      if (inside || arch) continue;
      g.fillStyle = ((i + 20) % 5 === 0 || j % 4 === 0) ? '#8c7652' : '#cdb58a';
      g.fillRect(x + i, y - j, 1, 1);
    }
    // llum de llibertat dins el portal
    const pulse = 0.75 + Math.sin(game.tick * 0.12) * 0.2;
    g.fillStyle = `rgba(255,226,120,${pulse})`;
    g.fillRect(x - 5, y - 13, 11, 14);
    for (let j = 14; j <= 15; j++) { const w = 5 - (j - 13) * 2; g.fillRect(x - w, y - j, w * 2 + 1, 1); }
    // pal i estelada
    const left = x + 40 > W;
    const px = left ? x - 9 : x + 9;
    g.fillStyle = '#e6e6e6'; g.fillRect(px, y - 48, 1, 30);
    g.fillStyle = '#ffd21f'; g.fillRect(px, y - 49, 1, 1);
    drawEstelada(g, px, y - 47, left ? -1 : 1, game.tick);
  }
  // estelada: nou franges grogues i vermelles, triangle blau i estrella blanca
  const STAR = ['..w..', 'wwwww', '.www.', '.w.w.'];
  function drawEstelada(g, poleX, top, dir, tick) {
    const fw = 27, fh = 18;
    for (let i = 0; i < fw; i++) {
      const wave = Math.round(Math.sin(tick * 0.15 - i * 0.38) * 1.3 * (i / fw));
      const x = poleX + dir * (i + 1);
      for (let j = 0; j < fh; j++) {
        const tri = i < 10 * (1 - Math.abs(j - 8.5) / 9.5);
        let col = Math.floor(j / 2) % 2 === 0 ? '#ffd21f' : '#da121a';
        if (tri) col = '#0f47af';
        g.fillStyle = col;
        g.fillRect(x, top + j + wave, 1, 1);
      }
    }
    STAR.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === 'w') {
        const ci = 1 + i, wave = Math.round(Math.sin(tick * 0.15 - ci * 0.38) * 1.3 * (ci / 27));
        g.fillStyle = '#ffffff';
        g.fillRect(poleX + dir * (ci + 1), top + 7 + j + wave, 1, 1);
      }
    });
  }

  function mallet(tr) {
    const ph = game.slamPhase(tr), P = tr.period, s = tr.slam;
    const down = P - s, lower = 12, rise = 10;
    let k;
    if (ph >= down) k = 1;
    else if (ph >= down - lower) k = (ph - (down - lower)) / lower;
    else if (ph < rise) k = 1 - ph / rise;
    else k = 0;
    return { k: k * k, warn: ph >= down - lower - 6 && ph < down };
  }
  function drawTribunalBack(g, tr) {
    const x0 = tr.x0 - 14, x1 = tr.x1 + 14, y = tr.y;
    // frontó
    const mid = (x0 + x1) / 2, top = y - 66;
    for (let j = 0; j < 14; j++) {
      const half = (x1 - x0) / 2 * (j / 14);
      g.fillStyle = j === 13 ? '#9a96a0' : '#e4dfd4';
      g.fillRect(Math.round(mid - half), top + j, Math.round(half * 2), 1);
    }
    // entaulament
    g.fillStyle = '#d8d2c6'; g.fillRect(x0, y - 52, x1 - x0, 11);
    g.fillStyle = '#9a96a0'; g.fillRect(x0, y - 42, x1 - x0, 1); g.fillRect(x0, y - 52, x1 - x0, 1);
    // columnes
    for (const cx of [x0 + 2, x1 - 7]) {
      g.fillStyle = '#e4dfd4'; g.fillRect(cx, y - 41, 5, 41);
      g.fillStyle = '#b8b2a8'; g.fillRect(cx + 1, y - 41, 1, 41); g.fillRect(cx + 3, y - 41, 1, 41);
      g.fillStyle = '#d0cabe'; g.fillRect(cx - 1, y - 42, 7, 2);
    }
    // bandereta roja i groga al capdamunt
    g.fillStyle = '#cccccc'; g.fillRect(Math.round(mid), top - 14, 1, 14);
    for (let j = 0; j < 8; j++) {
      g.fillStyle = j < 2 || j > 5 ? '#c60b1e' : '#ffc400';
      g.fillRect(Math.round(mid) + 1, top - 14 + j, 11, 1);
    }
    // zona de perill
    const m = mallet(tr);
    if (m.warn || game.isSlamming(tr)) {
      g.fillStyle = game.isSlamming(tr) ? 'rgba(227,39,46,0.45)' : 'rgba(255,170,40,0.28)';
      g.fillRect(tr.x0, y - 14, tr.x1 - tr.x0 + 1, 15);
    }
  }
  function drawMallet(g, tr) {
    const m = mallet(tr), y = tr.y;
    const raised = y - 30, bottom = Math.round(raised + (y - raised) * m.k);
    const mid = Math.round((tr.x0 + tr.x1) / 2);
    // mànec
    g.fillStyle = '#6a3f1d'; g.fillRect(mid - 1, y - 41, 3, bottom - 11 - (y - 41));
    // cap de la maça
    for (let j = 0; j < 11; j++) {
      g.fillStyle = j === 0 ? '#b57a42' : j > 8 ? '#5e3516' : '#8b5a2b';
      g.fillRect(tr.x0, bottom - 11 + j, tr.x1 - tr.x0 + 1, 1);
    }
    g.fillStyle = '#c9a54a';
    g.fillRect(tr.x0 + 3, bottom - 11, 3, 11); g.fillRect(tr.x1 - 5, bottom - 11, 3, 11);
  }

  function drawPolitician(g, p) {
    let alpha = 1, x = p.x;
    if (p.state === 'gone') return;
    if (p.state === 'flee') { alpha = 1 - p.t / 40; x = p.x - Math.round(p.t * 1.5); }
    const on = game.barrierOn(p);
    sprite(g, 'politic', 0, x, p.y, 1, alpha);
    if (on && p.state === 'active') {
      // braç enlaire amb el paper de la llei
      g.fillStyle = PAL.J; g.fillRect(x + 3, p.y - 12, 1, 3);
      g.fillStyle = PAL.S; g.fillRect(x + 4, p.y - 14, 1, 2);
      g.fillStyle = PAL.p; g.fillRect(x + 5, p.y - 17, 3, 4);
      g.fillStyle = '#c60b1e'; g.fillRect(x + 6, p.y - 14, 1, 1);
    }
    if (p.state === 'active') {
      // faristol
      g.fillStyle = '#5b3a22'; g.fillRect(x + 1, p.y - 8, 9, 9);
      g.fillStyle = '#7a5032'; g.fillRect(x, p.y - 9, 11, 2);
      g.fillStyle = '#c9a54a'; g.fillRect(x + 4, p.y - 6, 3, 3);
    }
  }
  function drawBarrier(g, p) {
    const on = game.barrierOn(p);
    const bx = p.bx, w = p.bw, y0 = p.by0, y1 = p.by1;
    g.fillStyle = '#3d3d48'; g.fillRect(bx - 1, y1 - 1, w + 2, 2);
    if (!on) return;
    for (let y = y0; y <= y1; y++) {
      g.fillStyle = Math.floor((y - y0) / 3) % 2 ? '#f2f2f2' : '#d4202a';
      g.fillRect(bx, y, w, 1);
    }
    // senyal de prohibit
    const cx = bx + w / 2 - 0.5, cy = y0 - 6;
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
      const r = Math.hypot(i, j);
      if (r > 5.3) continue;
      g.fillStyle = r > 3.6 ? '#d4202a' : (Math.abs(j) <= 0 && Math.abs(i) <= 3 ? '#d4202a' : '#ffffff');
      g.fillRect(Math.round(cx + i), cy + j, 1, 1);
    }
  }

  function drawPolice(g, p) {
    let alpha = 1, frame = Math.floor(game.tick / 8) % 2;
    let face = p.face;
    if (p.state === 'flee') { alpha = 1 - p.t / 45; face = p.fdir; frame = Math.floor(game.tick / 3) % 2; }
    sprite(g, 'police', frame, p.x, p.y, face, alpha);
    // porra
    if (p.state === 'patrol') {
      const up = p.grab > 0 && (game.tick % 6 < 3);
      g.fillStyle = '#111';
      const bx = p.x - face * 3;
      if (up) g.fillRect(bx, p.y - 13, 1, 5); else g.fillRect(bx, p.y - 7, 1, 4);
    }
  }

  const SPEAKER_SWAP = {
    casa: { J: '#55555f', r: '#d4202a' },
    estructures: { J: '#24427e', r: '#f0b400', Z: '#3a2a1e' }
  };
  function drawSpeaker(g, sp) {
    let alpha = 1, face = -1;
    if (sp.state === 'flee') { alpha = 1 - sp.t / 45; face = sp.fdir; }
    else {
      // mira cap al catalemming més proper
      let best = null;
      for (const c of game.cats) if (c.state !== 'gone' && (!best || Math.abs(c.x - sp.x) < Math.abs(best.x - sp.x))) best = c;
      if (best) face = best.x < sp.x ? -1 : 1;
    }
    const x = sp.x, y = sp.y;
    sprite(g, 'politic', 0, x, y, face, alpha, SPEAKER_SWAP[sp.kind]);
    g.globalAlpha = Math.max(0, alpha);
    if (sp.kind === 'casa') {
      // braç estirat assenyalant cap a casa
      const up = sp.state === 'active' && game.tick % 40 < 20;
      g.fillStyle = '#55555f'; g.fillRect(x + face * 3, y - 8 - (up ? 1 : 0), 1, 1); g.fillRect(x + face * 4, y - 9 - (up ? 1 : 0), 1, 1);
      g.fillStyle = PAL.S; g.fillRect(x + face * 5, y - 10 - (up ? 1 : 0), 1, 1);
    } else {
      // plànols enrotllats sota el braç
      g.fillStyle = '#9cc4ef'; g.fillRect(x - face * 1, y - 7, 1, 5);
      g.fillStyle = '#ffffff'; g.fillRect(x - face * 1, y - 7, 1, 1);
    }
    g.globalAlpha = 1;
  }
  function drawShooter(g, sh) {
    const f = sh.face, x = sh.x, y = sh.y;
    sprite(g, 'police', 0, x, y, f, 1, { Q: 'rgba(0,0,0,0)' });
    // escopeta de pilotes de goma
    g.fillStyle = '#2a2a2a';
    for (let i = 1; i <= 9; i++) g.fillRect(x + f * i, y - 6, 1, 1);
    g.fillStyle = '#5a3a1e'; g.fillRect(x - f * 1, y - 5, 1, 2); g.fillRect(x, y - 5, 1, 1);
    if (sh.flash > 0) {
      g.fillStyle = '#ffe680'; g.fillRect(x + f * 10, y - 7, 1, 3); g.fillRect(x + f * 11, y - 6, 1, 1);
    }
  }
  // icones petites dels objectes per a la guia de l'editor (32×24 píxels)
  function objectIcon(g, type) {
    g.clearRect(0, 0, 32, 24);
    const ground = c => { g.fillStyle = c || '#7a5a44'; g.fillRect(0, 22, 32, 2); };
    switch (type) {
      case 'entrada':
        ground();
        for (let r = 0; r < 6; r++) { const half = 6 + r; g.fillStyle = r % 2 ? '#8e3420' : '#b5482a'; g.fillRect(16 - half, 9 + r, half * 2 + 1, 1); }
        g.fillStyle = '#d8c3a0'; g.fillRect(8, 15, 17, 7);
        g.fillStyle = '#1a0f0a'; g.fillRect(14, 16, 5, 6);
        g.fillStyle = '#d6d6d6'; g.fillRect(16, 0, 1, 9);
        g.fillStyle = '#c60b1e'; g.fillRect(17, 0, 9, 6);
        g.fillStyle = '#ffc400'; g.fillRect(17, 2, 9, 2);
        break;
      case 'sortida':
        ground();
        g.fillStyle = '#e6e6e6'; g.fillRect(2, 0, 1, 22);
        drawEstelada(g, 2, 1, 1, 0);
        break;
      case 'policia':
        ground();
        for (const x of [7, 16, 25]) sprite(g, 'police', 0, x, 21, -1);
        break;
      case 'escopeta':
        ground();
        sprite(g, 'police', 0, 24, 21, -1, 1, { Q: 'rgba(0,0,0,0)' });
        g.fillStyle = '#2a2a2a'; for (let i = 1; i <= 9; i++) g.fillRect(24 - i, 15, 1, 1);
        g.fillStyle = '#ffe680'; g.fillRect(13, 14, 1, 3);
        g.fillStyle = '#121212'; g.fillRect(5, 14, 2, 2);
        g.fillStyle = '#6b6b6b'; g.fillRect(5, 14, 1, 1);
        break;
      case 'politic':
        ground();
        sprite(g, 'politic', 0, 7, 21, 1);
        g.fillStyle = '#5b3a22'; g.fillRect(8, 14, 9, 8);
        g.fillStyle = '#7a5032'; g.fillRect(7, 13, 11, 2);
        for (let y = 4; y < 22; y++) { g.fillStyle = Math.floor((y - 4) / 3) % 2 ? '#f2f2f2' : '#d4202a'; g.fillRect(25, y, 4, 1); }
        break;
      case 'casa': case 'estructures':
        ground();
        sprite(g, 'politic', 0, 16, 21, -1, 1, SPEAKER_SWAP[type]);
        if (type === 'casa') {
          g.fillStyle = '#55555f'; g.fillRect(12, 13, 1, 1); g.fillRect(11, 12, 1, 1);
          g.fillStyle = PAL.S; g.fillRect(10, 11, 1, 1);
        } else {
          g.fillStyle = '#9cc4ef'; g.fillRect(17, 14, 1, 5);
          g.fillStyle = '#ffffff'; g.fillRect(17, 14, 1, 1);
        }
        break;
      case 'rei':
        g.fillStyle = '#d4a017'; g.fillRect(10, 0, 13, 12);
        g.fillStyle = '#23408f'; g.fillRect(11, 1, 11, 11);
        g.fillStyle = '#c9a54a'; g.fillRect(9, 12, 15, 2);
        g.fillStyle = '#e2dfe6'; g.fillRect(10, 14, 13, 8);
        g.fillStyle = '#bdb8c6'; g.fillRect(10, 18, 13, 1);
        g.fillStyle = '#a9a3b4'; g.fillRect(9, 22, 15, 2);
        sprite(g, 'rei', 0, 16, 11, -1);
        g.fillStyle = PAL.y; g.fillRect(11, 2, 1, 7);
        drawPie(g, 4, 8);
        break;
      case 'tribunal':
        g.fillStyle = '#e4dfd4';
        for (let j = 0; j < 5; j++) { const half = 14 * (j + 1) / 5; g.fillRect(Math.round(16 - half), j, Math.round(half * 2), 1); }
        g.fillStyle = '#d8d2c6'; g.fillRect(1, 5, 30, 3);
        g.fillStyle = '#e4dfd4'; g.fillRect(2, 8, 3, 14); g.fillRect(27, 8, 3, 14);
        g.fillStyle = '#6a3f1d'; g.fillRect(15, 8, 2, 5);
        g.fillStyle = '#8b5a2b'; g.fillRect(6, 13, 20, 5);
        g.fillStyle = '#c9a54a'; g.fillRect(8, 13, 2, 5); g.fillRect(22, 13, 2, 5);
        g.fillStyle = '#dadae0'; g.fillRect(0, 22, 32, 2);
        break;
    }
  }

  function drawBalls(g) {
    for (const b of game.balls) {
      g.fillStyle = '#121212'; g.fillRect(b.x, b.y - 1, 2, 2);
      g.fillStyle = '#6b6b6b'; g.fillRect(b.x, b.y - 1, 1, 1);
    }
    for (const p of game.puffs) {
      if (p.t < 0) continue;
      g.fillStyle = p.cream ? `rgba(255,248,230,${1 - p.t / 12})` : `rgba(210,210,210,${1 - p.t / 12})`;
      const r = 1 + Math.floor(p.t / 3);
      g.fillRect(p.x - r, p.y - r, 1, 1); g.fillRect(p.x + r, p.y - r, 1, 1);
      g.fillRect(p.x - r, p.y + r, 1, 1); g.fillRect(p.x + r, p.y + r, 1, 1);
    }
  }

  // un pastís de nata: base de pasta, nata i una cirera
  function drawPie(g, x, y) {
    g.fillStyle = '#c98a4a'; g.fillRect(x - 1, y, 3, 1);
    g.fillStyle = '#fff3d6'; g.fillRect(x - 1, y - 1, 3, 1);
    g.fillStyle = '#d4202a'; g.fillRect(x, y - 2, 1, 1);
  }
  function drawPies(g) {
    for (const p of game.pies) drawPie(g, Math.round(p.x), Math.round(p.y));
  }
  function creamFace(g, x, y) {
    g.fillStyle = '#fffaf0';
    g.fillRect(x - 2, y - 9, 5, 3);
    g.fillRect(x - 1, y - 6, 1, 1); g.fillRect(x + 1, y - 6, 1, 2);
  }
  function drawCrown(g, x, y) {
    g.fillStyle = PAL.y;
    g.fillRect(x - 2, y, 5, 1); g.fillRect(x - 2, y - 1, 1, 1); g.fillRect(x, y - 1, 1, 1); g.fillRect(x + 2, y - 1, 1, 1);
  }
  // rei a la trona dalt del pedestal; quan rep el pastís, el pedestal desapareix i el rei cau
  function drawKing(g, k) {
    const hw = k.w >> 1, x = k.x;
    if (k.state === 'throne') {
      const top = k.y - k.h + 1;
      for (let y = top; y <= k.y; y++) {
        const fromTop = y - top, fromBase = k.y - y;
        const wide = fromBase < 3 ? 1 : 0;
        for (let i = -hw - wide; i <= hw + wide; i++) {
          let col = (fromTop - 2) % 8 === 0 || (i + hw + (Math.floor((fromTop - 2) / 8) % 2) * 4) % 9 === 0 ? '#bdb8c6' : '#e2dfe6';
          if (fromTop < 2) col = fromTop === 0 ? '#e8c862' : '#c9a54a';
          if (fromBase === 2) col = '#c9a54a';
          if (fromBase < 2) col = '#a9a3b4';
          g.fillStyle = col;
          g.fillRect(x + i, y, 1, 1);
        }
      }
      // trona: respatller daurat amb vellut vermell
      const sy = top - 1;
      g.fillStyle = '#d4a017'; g.fillRect(x - 6, sy - 18, 13, 19);
      g.fillStyle = '#23408f'; g.fillRect(x - 5, sy - 17, 11, 17);
      g.fillStyle = '#d4a017'; g.fillRect(x - 2, sy - 20, 5, 2); g.fillRect(x, sy - 21, 1, 1);
      sprite(g, 'rei', 0, x, sy, -1);
      // ceptre
      g.fillStyle = PAL.y; g.fillRect(x - 5, sy - 11, 1, 7); g.fillRect(x - 6, sy - 12, 3, 1);
      return;
    }
    if (k.state === 'falling') {
      const fy = Math.round(k.fy);
      sprite(g, 'reiSensCorona', 0, x, fy, -1);
      creamFace(g, x, fy);
      drawCrown(g, x - 6 - Math.round(k.t * 0.6), fy - 12 - Math.round(Math.sin(k.t * 0.3) * 3));
      return;
    }
    // a terra, ensabonat de nata i amb la corona al costat
    sprite(g, 'reiSensCorona', 0, x, k.y, -1);
    creamFace(g, x, k.y);
    drawCrown(g, x - 9, k.y);
    if (k.t < 120 && game.tick % 12 < 8) {
      g.fillStyle = '#ffd21f';
      const a = game.tick * 0.25;
      for (let i = 0; i < 3; i++) g.fillRect(Math.round(x + Math.cos(a + i * 2.1) * 5), Math.round(k.y - 13 + Math.sin(a + i * 2.1) * 1.5), 1, 1);
    }
  }

  function drawCastell(g, c) {
    const h = c.h, x = c.x, y = c.y;
    // pinya: gent que aguanta per sota
    if (h > 0) {
      for (const dx of [-7, 7]) sprite(g, 'mini', 0, x + dx, y, 1, 0.85, { C: '#2f6e36' });
    }
    const tiers = Math.floor(h / 10);
    const pos = [[-3, 0, 3], [-2, 2], [-2, 2]];
    for (let t = 0; t < Math.min(tiers, 3); t++) {
      for (const dx of pos[t]) sprite(g, 'mini', 0, x + dx, y - t * 10, 1);
    }
    if (tiers >= 4) {
      sprite(g, 'enxaneta', 0, x, y - 30, 1);
      if (Math.floor(game.tick / 10) % 2) { g.fillStyle = PAL.S; g.fillRect(x + 2, y - 39, 1, 2); }
    }
  }

  function drawCat(g, c) {
    const f4 = Math.floor(c.frame / 2) % 4, f2 = Math.floor(c.frame / 4) % 2;
    const x = c.x, y = c.y, d = c.dir;
    switch (c.state) {
      case 'walk': sprite(g, 'walk', f4, x, y, d); break;
      case 'fall':
        sprite(g, 'arms', 0, x, y, d);
        if (c.floater && c.fall > 14) drawCalcotUmbrella(g, x, y - 10, c.frame);
        break;
      case 'jump': sprite(g, 'jump', 0, x, y, d); break;
      case 'climb': sprite(g, 'arms', 0, x, y, d); break;
      case 'shrug': sprite(g, 'arms', 0, x, y, d); break;
      case 'block': sprite(g, 'block', 0, x, y, d); break;
      case 'build': sprite(g, 'build', f2, x, y, d); break;
      case 'wall': sprite(g, 'paleta', f2, x, y, d); break;
      case 'throw':
        if (c.t < 7) { sprite(g, 'arms', 0, x, y, d); drawPie(g, x - d * 2, y - 11); }
        else sprite(g, 'walk', 1, x, y, d);
        break;
      case 'bash': sprite(g, c.dug ? 'bash' : 'walk', c.dug ? f2 : f4, x, y, d); if (!c.dug) { g.fillStyle = PAL.T; g.fillRect(x + d * 4, y - 9, 1, 2); } break;
      case 'dig': sprite(g, 'dig', f2, x, y, d); break;
      case 'cass': sprite(g, 'cass', Math.floor(c.t / 3) % 2, x, y, d); break;
      case 'castell': drawCastell(g, c); return;
      case 'exit': {
        const hop = (c.t % 8) < 4 ? 2 : 0;
        sprite(g, 'arms', 0, x, y - hop, d, 1 - c.t / 26);
        return;
      }
      case 'angry': {
        const a = c.t < 30 ? 1 : 1 - (c.t - 30) / 30;
        if (c.reason === 'casa') {
          sprite(g, 'trist', Math.floor(c.t / 6) % 2, x, y, d, Math.min(1, a * 1.4));
          return;
        }
        if (c.reason === 'hospital') {
          sprite(g, 'estirat', 0, x, y, d, a);
          if (c.t > 6 && (c.t % 12) < 9) {
            g.globalAlpha = a;
            g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 12, 5, 5);
            g.fillStyle = '#d4202a'; g.fillRect(x, y - 11, 1, 3); g.fillRect(x - 1, y - 10, 3, 1);
            g.globalAlpha = 1;
          }
          return;
        }
        const sx = (c.t % 4 < 2) ? 1 : 0;
        sprite(g, c.reason === 'police' ? 'arms' : 'walk', 0, x + sx, y, d, a, { S: 'A' });
        if (c.t % 10 < 6) {
          g.globalAlpha = a; g.fillStyle = '#e8e8e8';
          g.fillRect(x - 2, y - 12 - (c.t % 10 > 2 ? 1 : 0), 1, 2); g.fillRect(x + 2, y - 13, 1, 2);
          g.globalAlpha = 1;
        }
        return;
      }
    }
    if (c.floater && c.state !== 'fall') { g.fillStyle = PAL.G; g.fillRect(x + d * 3, y - 8, 1, 1); }
  }
  // un calçot gegant fa de paraigua
  function drawCalcotUmbrella(g, x, y, frame) {
    const rows = ['G.g.G.g.G', '.GgGgGgG.', '..gGGGg..', '...ggg...', '....p....', '....p....'];
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] !== '.') { g.fillStyle = PAL[row[i]]; g.fillRect(x + i - 4, y - 6 + j, 1, 1); }
    });
    // bufarades
    if (frame % 6 < 3) { g.fillStyle = 'rgba(220,230,200,0.6)'; g.fillRect(x - 1, y + 12, 1, 1); g.fillRect(x + 1, y + 14, 1, 1); }
  }

  /* =========================================================
     Composició de cada fotograma
     ========================================================= */
  function render() {
    if (!game) return;
    applyChanges();
    if (terrDirty) { tctx.putImageData(terrImg, 0, 0); terrDirty = false; }

    const g = lctx;
    g.clearRect(0, 0, W, H);
    for (const tr of game.tribunals) drawTribunalBack(g, tr);
    drawEntrance(g);
    drawExit(g);
    for (const p of game.politicians) drawPolitician(g, p);
    g.drawImage(terrCv, 0, 0);
    for (const p of game.politicians) if (p.state !== 'gone') drawBarrier(g, p);
    for (const c of game.cats) if (c.state === 'castell') drawCat(g, c);
    for (const p of game.police) drawPolice(g, p);
    for (const sp of game.speakers) drawSpeaker(g, sp);
    for (const sh of game.shooters) drawShooter(g, sh);
    for (const k of game.kings) drawKing(g, k);
    for (const c of game.cats) if (c.state !== 'castell') drawCat(g, c);
    drawBalls(g);
    drawPies(g);
    for (const tr of game.tribunals) drawMallet(g, tr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bgCv, 0, 0);
    let ox = 0, oy = 0;
    if (shake > 0) { ox = (shake % 2 ? 1 : -1) * S; oy = (shake % 3 ? 1 : 0) * S * 0.5; }
    ctx.drawImage(layer, ox, oy, W * S, H * S);
    if (mode === 'editor') { if (editorOverlay) editorOverlay(ctx, S); }
    else drawOverlay();
  }

  function drawOverlay() {
    const c = ctx;
    c.save();
    c.scale(S, S);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    // l'antiavalots de l'escopeta apunta
    for (const sh of game.shooters) {
      if (sh.state !== 'aim') continue;
      const need = sh.shots === 0 ? sh.aimFirst : sh.period;
      const left = need - sh.t;
      if (sh.shots === 0 || left < 12) {
        c.font = '700 9px "Pixelify Sans", monospace';
        c.fillStyle = game.tick % 10 < 5 ? '#ff7a6e' : '#ffd21f';
        c.fillText('!', sh.x, sh.y - 16);
      }
    }
    // rètol del tribunal
    for (const tr of game.tribunals) {
      c.font = '600 7px "Pixelify Sans", monospace';
      c.fillStyle = '#4a4650';
      c.fillText('TRIBUNAL', (tr.x0 + tr.x1) / 2, tr.y - 44);
    }
    // ones de la cassolada
    for (const k of game.cats) {
      if (k.state !== 'cass' || k.t < 6) continue;
      const r = (k.t - 6) * 3.2;
      c.strokeStyle = `rgba(255,210,31,${Math.max(0, 0.8 - (k.t - 6) / 34)})`;
      c.lineWidth = 0.8;
      for (const rr of [r, r * 0.6]) {
        c.beginPath(); c.arc(k.x + k.dir * 4, k.y - 6, rr, 0, Math.PI * 2); c.stroke();
      }
    }
    // marcador del catalemming sota el cursor
    if (hoverCat && running) {
      const k = hoverCat.cat, ok = hoverCat.ok;
      const x0 = k.x - 5, y0 = k.y - (k.state === 'castell' ? 42 : 12), x1 = k.x + 5, y1 = k.y + 2;
      c.strokeStyle = ok ? '#ffd21f' : 'rgba(255,255,255,0.55)';
      c.lineWidth = 1;
      c.beginPath();
      for (const [ax, ay, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
        c.moveTo(ax + sx * 3, ay); c.lineTo(ax, ay); c.lineTo(ax, ay + sy * 3);
      }
      c.stroke();
    }
    // textos flotants
    c.font = '700 9px "Pixelify Sans", monospace';
    c.lineJoin = 'round';
    for (const t of game.texts) {
      const a = t.t < 35 ? 1 : 1 - (t.t - 35) / 15;
      const y = t.y - t.t * 0.35;
      c.globalAlpha = Math.max(0, a);
      c.lineWidth = 2.4; c.strokeStyle = 'rgba(10,16,40,0.9)';
      const tx = Math.max(24, Math.min(W - 24, t.x));
      c.strokeText(t.txt, tx, y);
      c.fillStyle = t.kind === 'good' ? '#ffd21f' : t.kind === 'bad' ? '#ff7a6e' : '#ffffff';
      c.fillText(t.txt, tx, y);
    }
    c.globalAlpha = 1;
    if (paused && running) {
      c.fillStyle = 'rgba(6,12,32,0.45)'; c.fillRect(0, 0, W, H);
      c.font = '700 22px "Pixelify Sans", monospace';
      c.fillStyle = '#ffd21f'; c.fillText('PAUSA', W / 2, H / 2);
    }
    c.restore();
  }

  /* =========================================================
     Interfície
     ========================================================= */
  function buildSkillButtons() {
    const box = $('#habilitats');
    box.innerHTML = '';
    ORDER.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hab';
      b.id = 'hab-' + s;
      b.dataset.skill = s;
      b.setAttribute('aria-pressed', 'false');
      b.title = SKILL_INFO[s].desc;
      const icon = document.createElement('canvas');
      icon.width = 20; icon.height = 20;
      drawIcon(icon.getContext('2d'), s);
      b.append(icon);
      b.insertAdjacentHTML('beforeend', `<span class="hab-nom">${SKILL_INFO[s].curt || SKILL_INFO[s].nom}</span><span class="compte">0</span><span class="tecla">${(i + 1) % 10}</span>`);
      b.addEventListener('click', () => selectSkill(s));
      box.append(b);
    });
  }
  function drawIcon(g, s) {
    switch (s) {
      case 'calcots': {
        const rows = ['.......g..g', '......gGgG.', '.....gGGg..', '....GGg....', '...ppG.....', '..ppp......', '.ppp.......', 'pp.........', 'EE.........'];
        rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { g.fillStyle = PAL[r[i]]; g.fillRect(4 + i, 5 + j, 1, 1); } });
        g.fillStyle = '#b8471c'; g.fillRect(13, 15, 4, 2); g.fillRect(14, 14, 2, 1);
        break;
      }
      case 'saltar':
        sprite(g, 'jump', 0, 11, 13, 1);
        g.fillStyle = '#ffd21f'; [[3, 17], [4, 15], [5, 13], [15, 12], [16, 14], [17, 16]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
        break;
      case 'blocar': sprite(g, 'block', 0, 10, 15, 1); break;
      case 'pont':
        for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#a8461f' : '#cf6235'; g.fillRect(2 + k * 2, 17 - k, 6, 1); g.fillRect(2 + k * 2, 18 - k, 6, 1); }
        sprite(g, 'build', 0, 13, 11, 1);
        break;
      case 'castell':
        for (const dx of [-3, 0, 3]) sprite(g, 'mini', 0, 10 + dx, 19, 1);
        for (const dx of [-2, 2]) sprite(g, 'mini', 0, 10 + dx, 9, 1);
        g.fillStyle = PAL.S; g.fillRect(10, 0, 1, 1);
        break;
      case 'picar':
        g.fillStyle = '#8a8f99'; g.fillRect(15, 2, 4, 16);
        g.fillStyle = '#6a6e78'; for (let y = 4; y < 18; y += 4) g.fillRect(15, y, 4, 1);
        sprite(g, 'bash', 1, 8, 16, 1);
        break;
      case 'cavar':
        g.fillStyle = '#7a5032'; g.fillRect(2, 15, 16, 4);
        g.fillStyle = '#1a0f0a'; g.fillRect(7, 15, 6, 4);
        sprite(g, 'dig', 0, 9, 14, 1);
        break;
      case 'pastis':
        g.fillStyle = '#c98a4a'; g.fillRect(4, 13, 12, 3); g.fillRect(5, 16, 10, 1);
        g.fillStyle = '#a86a32'; for (let x = 5; x < 16; x += 3) g.fillRect(x, 14, 1, 2);
        g.fillStyle = '#fff3d6'; g.fillRect(4, 10, 12, 3); g.fillRect(5, 8, 10, 2); g.fillRect(7, 6, 6, 2);
        g.fillStyle = '#ffffff'; g.fillRect(6, 9, 3, 1); g.fillRect(8, 7, 2, 1);
        g.fillStyle = '#d4202a'; g.fillRect(9, 3, 2, 3);
        g.fillStyle = '#2c7a26'; g.fillRect(10, 2, 1, 1);
        break;
      case 'mur':
        for (let y = 6; y < 19; y++) for (let x = 12; x < 19; x++) {
          const row = Math.floor(y / 3), gap = y % 3 === 0 || (x + (row % 2) * 2) % 4 === 0;
          g.fillStyle = gap ? '#3c3428' : ((x + row) % 3 ? '#b4a07e' : '#958a74');
          g.fillRect(x, y, 1, 1);
        }
        sprite(g, 'paleta', 1, 7, 18, 1);
        break;
      case 'cassolada':
        sprite(g, 'cass', 0, 8, 16, 1);
        g.fillStyle = '#ffd21f'; [[16, 6], [17, 8], [16, 10], [18, 4], [19, 7], [18, 11]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
        break;
    }
  }
  function selectSkill(s) {
    if (game && !skillVisible(s)) return;
    sel = s;
    ensureAudio();
    updateSkillButtons();
    setStatus(null);
  }
  // només es veuen les habilitats que encara es poden fer servir;
  // «Blocar» es queda mentre hi hagi algun blocador per deixar anar
  function skillVisible(s) {
    return game.skills[s] > 0 || (s === 'blocar' && game.cats.some(c => c.state === 'block'));
  }
  let habKey = '';
  function updateSkillButtons() {
    if (!game) return;
    const vis = ORDER.filter(skillVisible);
    // si l'habilitat triada s'ha acabat, passa a la primera que en quedi
    if (vis.length && !vis.includes(sel)) { sel = vis[0]; setStatus(null); }
    for (const s of ORDER) {
      const b = document.getElementById('hab-' + s);
      if (!b) continue;
      const n = game.skills[s];
      b.querySelector('.compte').textContent = n;
      b.classList.toggle('buida', n <= 0);
      b.hidden = !vis.includes(s);
      b.setAttribute('aria-pressed', s === sel ? 'true' : 'false');
      b.setAttribute('aria-label', `${SKILL_INFO[s].nom}: en queden ${n}`);
    }
    const key = (mqCompact.matches ? 'c:' : 'n:') + vis.join(',');
    if (key !== habKey) { habKey = key; layoutSkills(vis); }
  }
  // a l'ordinador, una fila sota l'escenari; al mòbil en horitzontal, repartides a banda i banda
  function layoutSkills(vis) {
    const box = $('#habilitats'), esq = $('#habEsq'), dre = $('#habDre');
    const half = Math.ceil(vis.length / 2);
    const focused = document.activeElement;
    for (const s of ORDER) {
      const b = document.getElementById('hab-' + s);
      const k = vis.indexOf(s);
      (!mqCompact.matches || k < 0 ? box : k < half ? esq : dre).append(b);
    }
    if (focused && focused.classList.contains('hab') && !focused.hidden) focused.focus({ preventScroll: true });
  }
  function updateControls() {
    $('#vRitme').textContent = game.rate;
    $('#btnPausa').setAttribute('aria-pressed', paused ? 'true' : 'false');
    $('#btnRapid').setAttribute('aria-pressed', fast ? 'true' : 'false');
    const r = $('#btnRetirada');
    r.classList.toggle('armat', nukeArmed > 0);
    r.textContent = nukeArmed > 0 ? 'Segur? Torna a clicar' : 'Tots a casa';
  }
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; document.getElementById(id).textContent = v; } }
  function updateHud(force) {
    if (force) for (const k in hudCache) delete hudCache[k];
    const st = game.stats();
    setText('vFora', `${st.released}/${st.total}`);
    setText('vDins', String(st.inside));
    setText('vLliures', `${st.saved} de ${st.needed}`);
    setText('vEnfadats', String(st.lost));
    setText('vTemps', `${Math.floor(st.time / 60)}:${String(st.time % 60).padStart(2, '0')}`);
    $('#barraLliures').style.width = (st.saved / st.total * 100) + '%';
    $('#marcaCal').style.left = `calc(${st.needed / st.total * 100}% - 1px)`;
  }
  function setStatus(txt) {
    const el = $('#estat');
    if (txt) { el.innerHTML = txt; return; }
    const n = game ? game.skills[sel] : 0;
    el.innerHTML = `<b>${SKILL_INFO[sel].nom}</b> (${n}) · ${SKILL_INFO[sel].desc}`;
  }

  /* ---------- capes ---------- */
  const capa = $('#capa');
  // si una finestra (descripció, resultat, menú, diàlegs) no hi cap, l'escenari creix fins que hi càpiga sencera
  const escenari = $('#escenari');
  let capaRO = null;
  function fitCapa() {
    const card = capa.firstElementChild;
    if (capa.hidden || !card || mqCompact.matches) { escenari.style.minHeight = ''; return; }
    const need = Math.ceil(card.getBoundingClientRect().height) + 40; // marges de la capa i vora de l'escenari
    escenari.style.minHeight = need > cv.offsetHeight + 6 ? need + 'px' : '';
  }
  new MutationObserver(() => {
    if (capaRO) capaRO.disconnect();
    if (window.ResizeObserver && capa.firstElementChild) {
      capaRO = new ResizeObserver(fitCapa);
      capaRO.observe(capa.firstElementChild);
    }
    fitCapa();
  }).observe(capa, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', fitCapa);
  function hazardsOf(L) {
    const out = [];
    const txt = (L.text || '').toLowerCase();
    if (txt.includes('barranc') || txt.includes('forat') || txt.includes('alçada')) out.push('barrancs');
    const n = k => (L[k] || []).length > 0;
    if (n('police')) out.push('antiavalots');
    if (n('politicians')) out.push('polítics');
    if (n('tribunals')) out.push('tribunal');
    for (const sp of (L.speakers || [])) out.push(sp.kind === 'casa' ? '«Torneu a casa!»' : '«Estructures d\'estat!»');
    if (n('shooters')) out.push('escopeta');
    if (n('kings')) out.push('rei');
    if (txt.includes('mur')) out.push('murs');
    return out.join(' · ');
  }
  function showMenu() {
    setMode('joc');
    running = false;
    const list = playList();
    const cards = list.map(i => {
      const L = LEVELS[i];
      const best = progress.best[i];
      const done = best !== undefined && best >= L.needed;
      return `<button type="button" class="nivell-card" data-l="${i}">
        <span class="num">${levelLabel(i)}</span>
        <span class="nom">${escHtml(L.nom)}</span>
        <span class="obst">${hazardsOf(L)}</span>
        <span class="fet ${done ? '' : 'no'}">${done ? `Superat · rècord ${best} de ${L.total}` : (best !== undefined ? `Intentat · rècord ${best} de ${L.total}` : 'Per jugar')}</span>
      </button>`;
    }).join('');
    const nHidden = LEVELS.length - list.length;
    capa.innerHTML = `<div class="fitxa ampla">
      <p class="cella">Tria nivell</p>
      <h2>Cap a la llibertat</h2>
      <div class="cap-seccio">
        <h3>Nivells del joc</h3>
        <button type="button" class="boto-mig" id="btnOrganitza">Organitza</button>
      </div>
      <p>${list.length} nivells, de més fàcil a més difícil. Tots estan oberts: pots començar per on vulguis.${nHidden ? ` (${nHidden} amagat${nHidden > 1 ? 's' : ''}.)` : ''}</p>
      <div class="llista-nivells">${cards}</div>
      <div class="cap-seccio">
        <h3>Els meus nivells</h3>
        <div class="botons-fitxa">
          <button type="button" class="boto-mig" id="btnElsMeus">Edita i esborra</button>
          <button type="button" class="boto-mig principal" id="btnObreEditor">Obre l'editor</button>
        </div>
      </div>
      <div class="llista-nivells" id="menuPropis"><p class="buit">Carregant…</p></div>
    </div>`;
    capa.hidden = false;
    capa.querySelectorAll('.nivell-card[data-l]').forEach(b => b.addEventListener('click', () => { loadLevel(+b.dataset.l); showIntro(); }));
    $('#btnOrganitza').addEventListener('click', () => showOrganize());
    $('#btnElsMeus').addEventListener('click', () => window.CatEditor && window.CatEditor.openList());
    $('#btnObreEditor').addEventListener('click', () => window.CatEditor && window.CatEditor.open());
    fillOwnLevels();
  }
  // els nivells desats amb l'editor, al costat dels del joc
  function fillOwnLevels() {
    const box = $('#menuPropis'), CE = window.CatEditor;
    if (!box) return;
    if (!CE) { box.innerHTML = '<p class="buit">L\'editor no està disponible.</p>'; return; }
    CE.listLevels().then(items => {
      if (!box.isConnected) return;
      if (!items.length) { box.innerHTML = '<p class="buit">Encara no n\'has fet cap. Obre l\'editor per crear-ne un.</p>'; return; }
      box.innerHTML = items.map(it => `<button type="button" class="nivell-card" data-id="${escHtml(it.id)}">
        <span class="num">Nivell propi</span>
        <span class="nom">${escHtml(it.nom || 'Sense nom')}</span>
        <span class="obst">${hazardsOf(it)}</span>
        <span class="fet no">${it.total} catalemmings · cal salvar-ne ${it.needed}</span>
      </button>`).join('');
      box.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => CE.play(items.find(x => x.id === b.dataset.id))));
    }, () => {
      if (box.isConnected) box.innerHTML = '<p class="buit">No s\'han pogut carregar els teus nivells.</p>';
    });
  }
  // canviar l'ordre i amagar nivells del joc
  function showOrganize(focus) {
    const vis = playList();
    const rows = levelOrder.order.map((i, k, all) => {
      const L = LEVELS[i], hidden = levelOrder.hidden.includes(i);
      const nom = escHtml(L.nom);
      return `<div class="fila-propi${hidden ? ' amagat' : ''}" data-l="${i}">
        <div class="info"><span class="nom">${nom}</span><span class="detall">${hidden ? 'Amagat' : levelLabel(i)} · número ${i + 1} a levels.js</span></div>
        <div class="botons-fitxa">
          <button type="button" class="boto-mig fletxa" data-a="amunt" aria-label="Puja «${nom}»"${k === 0 ? ' disabled' : ''}>↑</button>
          <button type="button" class="boto-mig fletxa" data-a="avall" aria-label="Baixa «${nom}»"${k === all.length - 1 ? ' disabled' : ''}>↓</button>
          <button type="button" class="boto-mig" data-a="amaga"${!hidden && vis.length === 1 ? ' disabled title="Ha de quedar almenys un nivell visible"' : ''}>${hidden ? 'Mostra' : 'Amaga'}</button>
        </div>
      </div>`;
    }).join('');
    const custom = levelOrder.hidden.length || levelOrder.order.some((v, k) => v !== k);
    capa.innerHTML = `<div class="fitxa ampla">
      <p class="cella">Tria nivell</p>
      <h2>Organitza els nivells</h2>
      <p>Canvia l'ordre amb les fletxes i amaga els nivells que no vulguis veure al menú. Es desa en aquest navegador: el fitxer levels.js no canvia.</p>
      <div class="llista-propis">${rows}</div>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran" id="orgFet">Fet</button>
        <button type="button" class="boto-gran secundari" id="orgRestaura"${custom ? '' : ' disabled'}>Restaura l'ordre original</button>
      </div>
    </div>`;
    capa.hidden = false;
    capa.querySelectorAll('.fila-propi').forEach(row => {
      const i = +row.dataset.l;
      row.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
        const o = levelOrder.order, k = o.indexOf(i), a = b.dataset.a;
        if (a === 'amunt' && k > 0) [o[k - 1], o[k]] = [o[k], o[k - 1]];
        else if (a === 'avall' && k < o.length - 1) [o[k + 1], o[k]] = [o[k], o[k + 1]];
        else if (a === 'amaga') {
          const h = levelOrder.hidden;
          if (h.includes(i)) h.splice(h.indexOf(i), 1);
          else if (playList().length > 1) h.push(i);
        }
        saveOrder();
        showOrganize({ l: i, a });
      }));
    });
    $('#orgFet').addEventListener('click', showMenu);
    $('#orgRestaura').addEventListener('click', () => {
      levelOrder = { order: LEVELS.map((L, i) => i), hidden: [] };
      saveOrder();
      showOrganize();
    });
    // el focus es queda al botó que s'acaba de fer servir (o al del costat si ara està desactivat)
    if (focus) {
      const row = capa.querySelector(`.fila-propi[data-l="${focus.l}"]`);
      const btn = row && ([...row.querySelectorAll('[data-a]')].find(b => b.dataset.a === focus.a && !b.disabled) || row.querySelector('[data-a]:not(:disabled)'));
      if (btn) btn.focus({ preventScroll: false });
    } else $('#orgFet').focus({ preventScroll: true });
  }
  function showIntro() {
    running = false;
    const L = cur;
    const pct = Math.round(L.needed / L.total * 100);
    const pos = playList().indexOf(lvl);
    const lloc = lvl >= 0 ? (pos >= 0 ? `Nivell ${pos + 1} de ${playList().length}` : 'Nivell amagat') : curOrigin === 'prova' ? 'Prova de l\'editor' : 'Nivell propi';
    const tornar = curOrigin === 'prova' ? 'Torna a l\'editor' : 'Tots els nivells';
    const chips = ORDER.filter(s => (L.skills[s] || 0) > 0).map(s => `<span class="xip">${SKILL_INFO[s].nom} <b>${L.skills[s]}</b></span>`).join('');
    capa.innerHTML = `<div class="fitxa">
      <p class="cella">${lloc}</p>
      <h2>${escHtml(L.nom || 'Sense nom')}</h2>
      ${L.text ? `<p>${escHtml(L.text)}</p>` : ''}
      <ul class="fets">
        <li>Catalemmings <b>${L.total}</b></li>
        <li>Cal salvar-ne <b>${L.needed}</b> (${pct}%)</li>
        <li>Temps <b>${Math.floor(L.time / 60)}:${String(L.time % 60).padStart(2, '0')}</b></li>
      </ul>
      <div class="xips">${chips}</div>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran" id="btnSomhi">Som-hi!</button>
        <button type="button" class="boto-gran secundari" id="btnMenu">${tornar}</button>
      </div>
    </div>`;
    capa.hidden = false;
    $('#btnSomhi').addEventListener('click', start);
    $('#btnMenu').addEventListener('click', backFromLevel);
    $('#btnSomhi').focus({ preventScroll: true });
  }
  function start() {
    ensureAudio();
    capa.hidden = true;
    running = true; paused = false;
    updateControls();
    sfx('start');
  }
  function showResult() {
    resultShown = true;
    running = false;
    const r = game.result, L = cur;
    if (lvl >= 0) {
      const prev = progress.best[lvl];
      if (prev === undefined || r.saved > prev) { progress.best[lvl] = r.saved; saveProgress(); }
    }
    const next = lvl >= 0 ? nextLevel(lvl) : undefined;
    const last = next === undefined;
    let title, body;
    if (r.success) {
      title = lvl >= 0 && lvl === playList()[playList().length - 1] ?'Llibertat! Tots els nivells superats' : 'Llibertat!';
      body = (r.saved === r.total ? 'No n\'has perdut ni un. La colla sencera ja és sota l\'estelada.' : 'Prou catalemmings han arribat a l\'estelada.') + ' I la bandera espanyola de casa ja és a terra.';
    } else {
      title = r.timeout ? 'S\'ha acabat el temps' : 'Massa catalemmings enfadats';
      body = lvl >= 0 ? `En calien ${r.needed}. Torna-hi: cada nivell té solució amb les habilitats que dona.` : `En calien ${r.needed}.`;
    }
    capa.innerHTML = `<div class="fitxa ${r.success ? '' : 'fracas'}">
      <p class="cella">${lvl >= 0 ? levelLabel(lvl) : curOrigin === 'prova' ? 'Prova de l\'editor' : 'Nivell propi'} · ${escHtml(L.nom || 'Sense nom')}</p>
      <h2>${title}</h2>
      <p class="resultat-xifra">${r.saved}<small> de ${r.total} lliures · en calien ${r.needed}</small></p>
      <p>${body}</p>
      <div class="botons-fitxa">
        ${r.success && !last ? '<button type="button" class="boto-gran" id="btnSeg">Següent nivell</button>' : ''}
        <button type="button" class="boto-gran ${r.success && !last ? 'secundari' : ''}" id="btnRep">Repeteix</button>
        <button type="button" class="boto-gran secundari" id="btnMenu2">${curOrigin === 'prova' ? 'Torna a l\'editor' : 'Tots els nivells'}</button>
      </div>
    </div>`;
    capa.hidden = false;
    const seg = $('#btnSeg');
    if (seg) seg.addEventListener('click', () => { loadLevel(next); showIntro(); });
    $('#btnRep').addEventListener('click', restart);
    $('#btnMenu2').addEventListener('click', backFromLevel);
    sfx(r.success ? 'win' : 'lose');
    (seg || $('#btnRep')).focus({ preventScroll: true });
  }

  /* ---------- entrada ---------- */
  function toLogical(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function pick(p, tol) {
    if (!p || !game) return null;
    tol = tol || 7;
    let best = null, bestScore = 1e9;
    for (const c of game.cats) {
      if (c.state === 'gone' || c.state === 'exit' || c.state === 'angry') continue;
      const top = c.state === 'castell' ? c.y - 40 : c.y - 12;
      if (Math.abs(c.x - p.x) > tol || p.y < top - tol / 2 || p.y > c.y + tol / 2 + 1) continue;
      const ok = game.canAssign(c, sel);
      const score = Math.abs(c.x - p.x) + Math.abs(c.y - 5 - p.y) * 0.5 - (ok ? 100 : 0);
      if (score < bestScore) { bestScore = score; best = { cat: c, ok }; }
    }
    return best;
  }
  cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pointer = toLogical(e); });
  cv.addEventListener('pointerleave', () => { pointer = null; hoverCat = null; });
  cv.addEventListener('click', e => {
    if (mode !== 'joc' || !running || !game || game.over) return;
    ensureAudio();
    const h = pick(toLogical(e), e.pointerType && e.pointerType !== 'mouse' ? 12 : 7);
    if (!h) return;
    if (h.ok) {
      const wasBlock = h.cat.state === 'block' && sel === 'blocar';
      game.assign(h.cat, sel);
      updateSkillButtons();
      setStatus(wasBlock ? '<b>Blocar</b> · l\'has deixat anar: torna a caminar.' : null);
    } else {
      sfx('nope');
      if (game.skills[sel] <= 0 && !(sel === 'blocar' && h.cat.state === 'block')) setStatus(`<b>${SKILL_INFO[sel].nom}</b> · no en queda cap. Tria una altra habilitat.`);
      else setStatus(`<b>${SKILL_INFO[sel].nom}</b> · aquest catalemming ara mateix no pot (està ${STATE_NAME[h.cat.state] || 'ocupat'}).`);
    }
  });

  $('#btnPausa').addEventListener('click', togglePause);
  $('#btnRapid').addEventListener('click', toggleFast);
  $('#btnReinicia').addEventListener('click', restart);
  $('#btnRetirada').addEventListener('click', armNuke);
  $('#ritmeMenys').addEventListener('click', () => changeRate(-5));
  $('#ritmeMes').addEventListener('click', () => changeRate(5));
  $('#btnNivells').addEventListener('click', showMenu);
  $('#btnEditor').addEventListener('click', () => { if (window.CatEditor) window.CatEditor.open(); });
  $('#btnSo').addEventListener('click', () => {
    soundOn = !soundOn;
    const b = $('#btnSo');
    b.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    b.textContent = soundOn ? 'So: sí' : 'So: no';
    if (soundOn) { ensureAudio(); sfx('assign'); }
  });

  function togglePause() { if (!running) return; paused = !paused; updateControls(); }
  function toggleFast() { fast = !fast; updateControls(); }
  function restart() {
    if (mode !== 'joc') return;
    if (lvl >= 0) loadLevel(lvl); else setupLevel(cur, -1, curOrigin);
    showIntro();
  }
  function backFromLevel() {
    if (curOrigin === 'prova' && window.CatEditor) window.CatEditor.open();
    else showMenu();
  }
  function setMode(m) {
    const changed = mode !== m;
    mode = m;
    document.body.classList.toggle('mode-editor', m === 'editor');
    if (m === 'editor') { running = false; capa.hidden = true; }
    else { cv.style.touchAction = ''; cv.style.cursor = ''; }
    $('#btnEditor').setAttribute('aria-pressed', m === 'editor' ? 'true' : 'false');
    if (changed) resize();
  }

  /* ---------- orientació del mòbil ---------- */
  function updateOrientation() {
    $('#gira').hidden = !mqGira.matches;
    if (mqGira.matches && running && !paused) { paused = true; updateControls(); }
  }
  for (const mq of [mqCompact, mqGira]) {
    const f = () => { updateOrientation(); resize(); fitCapa(); };
    if (mq.addEventListener) mq.addEventListener('change', f); else mq.addListener(f);
  }
  // on es pugui, pantalla completa i horitzontal encara que el mòbil tingui el gir blocat
  const btnPantalla = $('#btnPantalla');
  btnPantalla.hidden = !(document.documentElement.requestFullscreen && screen.orientation && screen.orientation.lock);
  btnPantalla.addEventListener('click', () => {
    document.documentElement.requestFullscreen()
      .then(() => screen.orientation.lock('landscape'))
      .catch(() => { btnPantalla.hidden = true; });
  });
  function escHtml(t) {
    return String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function changeRate(d) { if (!game) return; game.setRate(game.rate + d); updateControls(); }
  function armNuke() {
    if (!running || !game || game.over) return;
    if (nukeArmed > 0) { game.nuke(); nukeArmed = 0; }
    else nukeArmed = 75;
    updateControls();
  }

  document.addEventListener('keydown', e => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (mode !== 'joc') return;
    const k = e.key.toLowerCase();
    if (k >= '0' && k <= '9') { const sk = ORDER[k === '0' ? 9 : +k - 1]; if (sk) { selectSkill(sk); e.preventDefault(); } return; }
    if (k === 'p' || k === ' ') { if (running) { togglePause(); e.preventDefault(); } return; }
    if (k === 'f') { toggleFast(); return; }
    if (k === 'r') { restart(); return; }
    if (k === '+' || k === '=') { changeRate(5); return; }
    if (k === '-') { changeRate(-5); return; }
  });

  /* =========================================================
     So (sintetitzat, només després d'un clic)
     ========================================================= */
  let actx = null;
  function ensureAudio() {
    if (actx || !soundOn) return;
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
  }
  function tone(freq, dur, type, vol, when, slide) {
    if (!actx || !soundOn) return;
    const t = actx.currentTime + (when || 0);
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, when, freq) {
    if (!actx || !soundOn) return;
    const t = actx.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(actx.sampleRate * dur));
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = actx.createBufferSource(); src.buffer = buf;
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200;
    const g = actx.createGain(); g.gain.value = vol || 0.1;
    src.connect(f); f.connect(g); g.connect(actx.destination);
    src.start(t);
  }
  const played = {};
  function sfx(name) {
    if (!actx || !soundOn) return;
    if (actx.state === 'suspended') actx.resume();
    const now = performance.now();
    if (played[name] && now - played[name] < 70) return;
    played[name] = now;
    switch (name) {
      case 'assign': tone(880, 0.06, 'square', 0.035); break;
      case 'nope': tone(180, 0.08, 'square', 0.03); break;
      case 'saved': tone(659, 0.08, 'square', 0.035); tone(988, 0.12, 'square', 0.035, 0.07); break;
      case 'angry': tone(220, 0.22, 'sawtooth', 0.04, 0, 90); break;
      case 'police': noise(0.12, 0.18, 0, 600); tone(130, 0.2, 'sawtooth', 0.04, 0.02, 70); break;
      case 'cass': for (let i = 0; i < 4; i++) { tone(1900 + i * 80, 0.05, 'triangle', 0.05, i * 0.07); noise(0.04, 0.12, i * 0.07, 3200); } break;
      case 'slam': tone(90, 0.3, 'sine', 0.22, 0, 38); noise(0.18, 0.2, 0, 300); break;
      case 'law': tone(392, 0.09, 'square', 0.03); tone(330, 0.12, 'square', 0.03, 0.1); break;
      case 'brick': tone(520, 0.03, 'triangle', 0.03); break;
      case 'castell': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.05, i * 0.09)); break;
      case 'nuke': tone(500, 0.6, 'sawtooth', 0.04, 0, 80); break;
      case 'start': tone(392, 0.08, 'square', 0.035); tone(523, 0.12, 'square', 0.035, 0.09); break;
      case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.04, i * 0.12)); break;
      case 'lose': [392, 349, 311, 262].forEach((f, i) => tone(f, 0.2, 'triangle', 0.05, i * 0.16)); break;
      case 'flagfall': tone(240, 0.7, 'sawtooth', 0.025, 0, 140); tone(180, 0.5, 'square', 0.015, 0.25, 110); break;
      case 'flagland': tone(110, 0.25, 'sine', 0.2, 0, 50); noise(0.16, 0.18, 0, 400); break;
      case 'shot': noise(0.1, 0.22, 0, 900); tone(160, 0.08, 'square', 0.04, 0, 60); break;
      case 'ploc': tone(760, 0.05, 'triangle', 0.05, 0, 420); break;
      case 'stone': noise(0.05, 0.12, 0, 500); break;
      case 'fugida': tone(300, 0.3, 'triangle', 0.05, 0, 900); break;
      case 'llanca': tone(420, 0.18, 'triangle', 0.035, 0, 980); break;
      case 'pastis': noise(0.22, 0.28, 0, 650); tone(210, 0.18, 'sine', 0.12, 0, 70); break;
      case 'corona': tone(1320, 0.08, 'triangle', 0.05); tone(1560, 0.12, 'triangle', 0.05, 0.08); tone(90, 0.2, 'sine', 0.18, 0.05, 45); break;
    }
  }
  function drainEvents() {
    for (const ev of game.events) {
      sfx(ev);
      if (ev === 'slam') shake = 8;
    }
    game.events.length = 0;
  }

  /* =========================================================
     Bucle principal
     ========================================================= */
  const STEP_MS = 1000 / E.TPS;
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += now - last; last = now;
    if (acc > 250) acc = 250;
    while (acc >= STEP_MS) {
      acc -= STEP_MS;
      if (game && running && !paused) {
        const n = fast ? 3 : 1;
        for (let i = 0; i < n; i++) { if (!game.over) game.step(); updateFlag(); }
        drainEvents();
        if (shake > 0) shake--;
        if (nukeArmed > 0 && --nukeArmed === 0) updateControls();
      }
    }
    if (game && mode === 'editor') {
      render();
    } else if (game) {
      hoverCat = running ? pick(pointer) : null;
      render();
      updateHud();
      updateSkillButtons();
      const flagDone = !game.result || !game.result.success || (flagFall && flagFall.landed && flagFall.after >= 30);
      if (game.over && !resultShown && flagDone) showResult();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- logotip: una estelada petita ---------- */
  (function drawLogo() {
    const g = $('#logo').getContext('2d');
    for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) {
      const tri = i < 7 * (1 - Math.abs(j - 5.5) / 6.5);
      g.fillStyle = tri ? '#0f47af' : (Math.floor(j / 1.34) % 2 === 0 ? '#ffd21f' : '#da121a');
      g.fillRect(i, j, 1, 1);
    }
    g.fillStyle = '#fff';
    [[2, 5], [3, 5], [4, 5], [3, 4], [3, 6], [2, 7], [4, 7]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  })();

  // API per a l'editor de nivells (editor.js)
  window.CatApp = {
    E, LEVELS, SKILL_INFO, ORDER, canvas: cv,
    game: () => game,
    mode: () => mode,
    toLogical,
    preview(L, keepColors) { setMode('editor'); setupLevel(L, -1, 'editor', keepColors); },
    playCustom(L, origin) { setMode('joc'); setupLevel(L, -1, origin || 'propi'); showIntro(); },
    recolorColumns,
    setMode, showMenu,
    setOverlay(fn) { editorOverlay = fn; },
    sfx(name) { ensureAudio(); sfx(name); },
    objectIcon,
    capa
  };

  // accés per a proves automàtiques
  window.__catDebug = {
    load(i) { loadLevel(i); start(); },
    steps(n) { for (let i = 0; i < n; i++) { if (!game.over) game.step(); updateFlag(); } drainEvents(); },
    flag: () => flagFall,
    frame() { render(); updateHud(); updateSkillButtons(); },
    game: () => game
  };

  buildSkillButtons();
  loadLevel(playList()[0]);
  resize();
  updateOrientation();
  showIntro();
  window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render());
  requestAnimationFrame(frame);
})();
