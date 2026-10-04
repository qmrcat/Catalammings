/* Catalemmings — editor de nivells.
   Fa servir l'API que exposa game.js (window.CatApp) i el motor (CatEngine). */
(function () {
  'use strict';
  const A = window.CatApp;
  if (!A) return;
  const E = A.E, W = E.W, H = E.H, T = E.T, TPS = E.TPS;
  const $ = s => document.querySelector(s);
  const esc = t => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const TEMES = [['muntanya', 'Muntanya'], ['ciutat', 'Ciutat'], ['institucions', 'Institucions'], ['nit', 'Nit']];
  const TERRENYS = [
    { id: 'terra', t: T.EARTH, nom: 'Terra', color: '#a8694e' },
    { id: 'marbre', t: T.STEEL, nom: 'Marbre', color: '#dadae0' },
    { id: 'mur', t: T.WALL, nom: 'Mur', color: '#92969e' },
    { id: 'pedra', t: T.STONE, nom: 'Pedra seca', color: '#b0a07e' },
    { id: 'esborra', t: T.EMPTY, nom: 'Esborra', color: null }
  ];
  const OBJECTES = [
    { id: 'entrada', nom: 'Casa' },
    { id: 'sortida', nom: 'Estelada' },
    { id: 'policia', nom: 'Antiavalots' },
    { id: 'escopeta', nom: 'Escopeta' },
    { id: 'politic', nom: 'Polític de lleis' },
    { id: 'casa', nom: '«Torneu a casa!»' },
    { id: 'estructures', nom: '«Estructures d\'estat!»' },
    { id: 'tribunal', nom: 'Tribunal' },
    { id: 'rei', nom: 'Rei a la trona' }
  ];
  const ARR = { policia: 'police', escopeta: 'shooters', politic: 'politicians', casa: 'speakers', estructures: 'speakers', tribunal: 'tribunals', rei: 'kings' };
  const SAFE_FALL = E.SAFE_FALL;

  /* =========================================================
     Codificació del terreny (longituds de tirada)
     ========================================================= */
  function encodeMask(m) {
    let out = '', t = m[0], n = 0;
    for (let i = 0; i < m.length; i++) {
      if (m[i] === t) n++;
      else { out += t + n.toString(36) + '.'; t = m[i]; n = 1; }
    }
    return out + t + n.toString(36) + '.';
  }
  const decodeMask = E.decodeMask;

  /* ---------- dades d'un nivell, netes i dins de límits ---------- */
  const num = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? clamp(v, a, b) : d; };
  const int = (v, a, b, d) => Math.round(num(v, a, b, d));
  function normalize(d) {
    d = d || {};
    const skills = {};
    for (const s of E.SKILLS) skills[s] = int(d.skills && d.skills[s], 0, 99, 0);
    const total = int(d.total, 1, 80, 10);
    const ent = d.entrance || {}, ex = d.exit || {};
    return {
      v: 1,
      nom: String(d.nom || 'Nivell sense nom').slice(0, 60),
      text: String(d.text || '').slice(0, 400),
      tema: TEMES.some(t => t[0] === d.tema) ? d.tema : 'muntanya',
      total,
      needed: int(d.needed, 1, total, Math.min(total, 7)),
      rate: int(d.rate, 1, 99, 30),
      time: int(d.time, 30, 1800, 300),
      skills,
      entrance: { x: int(ent.x, 14, W - 14, 60), y: int(ent.y, 36, H - 2, 198), dir: ent.dir === -1 ? -1 : 1 },
      exit: { x: int(ex.x, 10, W - 10, 580), y: int(ex.y, 20, H - 1, 219) },
      police: (d.police || []).slice(0, 20).map(p => {
        const x0 = int(p.x0, 0, W, 200);
        return { x0, x1: int(p.x1, x0, W, x0 + 60), y: int(p.y, 12, H - 1, 219), n: int(p.n, 1, 6, 3), speed: num(p.speed, 0.05, 3, 0.5) };
      }),
      politicians: (d.politicians || []).slice(0, 10).map(p => {
        const y = int(p.y, 14, H - 1, 219), by1 = int(p.by1, 0, H - 1, y);
        return {
          x: int(p.x, 0, W, 300), y, bx: int(p.bx, 0, W - 2, 330), bw: int(p.bw, 2, 20, 6),
          by0: int(p.by0, 0, by1, by1 - 40), by1,
          on: int(p.on, 10, 600, 110), off: int(p.off, 10, 600, 70), phase: int(p.phase, 0, 1000, 0),
          lema: String(p.lema || 'LLEI!').slice(0, 14)
        };
      }),
      tribunals: (d.tribunals || []).slice(0, 10).map(t => {
        const x0 = int(t.x0, 0, W, 280);
        const slam = int(t.slam, 2, 30, 8);
        return { x0, x1: int(t.x1, x0 + 10, W, x0 + 80), y: int(t.y, 70, H - 1, 219), period: int(t.period, slam + 10, 400, 70), slam, phase: int(t.phase, 0, 400, 0) };
      }),
      speakers: (d.speakers || []).slice(0, 20).map(p => {
        const x0 = int(p.x0, 0, W, 250);
        return { kind: p.kind === 'estructures' ? 'estructures' : 'casa', x0, x1: int(p.x1, x0, W, x0 + 60), y: int(p.y, 14, H - 1, 219), speed: num(p.speed, 0, 3, 0.3) };
      }),
      kings: (d.kings || []).slice(0, 10).map(k => ({
        x: int(k.x, 0, W, 330), y: int(k.y, 20, H - 1, 219), w: int(k.w, 10, 40, 18), h: int(k.h, 14, 80, 34)
      })),
      shooters: (d.shooters || []).slice(0, 10).map(s => ({
        x: int(s.x, 0, W, 400), y: int(s.y, 12, H - 1, 219), face: s.face === 1 ? 1 : -1,
        range: int(s.range, 30, 640, 200), aimFirst: int(s.aimFirst, 5, 400, 90), period: int(s.period, 8, 200, 30)
      }))
    };
  }
  // converteix les dades de l'editor en un nivell que el motor pot jugar
  function toPlayable(d, mask) {
    const data = normalize(d);
    const copy = JSON.parse(JSON.stringify(data));
    copy.build = a => a.load(mask);
    return copy;
  }

  /* =========================================================
     On es desen els nivells: emmagatzematge de l'artifact
     (privat per persona) o, si no n'hi ha, aquest navegador.
     ========================================================= */
  const LOCAL_KEY = 'catalemmings.nivells', DRAFT_KEY = 'catalemmings.esborrany';
  const store = {
    mode: 'local', db: null, uid: null, ready: null,
    init() {
      if (this.ready) return this.ready;
      this.ready = (async () => {
        try {
          if (window.claude && typeof window.claude.use === 'function') {
            const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
            const uid = user ? await user.id() : null;
            if (db && uid) { this.db = db; this.uid = uid; this.mode = 'db'; }
          }
        } catch (e) { this.mode = 'local'; }
        updateStatus();
      })();
      return this.ready;
    },
    col() { return this.db.collection('data/users/' + this.uid); },
    readLocal() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch (e) { return {}; } },
    writeLocal(map) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(map)); return true; } catch (e) { return false; } },
    async list() {
      await this.init();
      if (this.mode === 'db') {
        const snap = await this.col().get();
        return snap.docs.filter(d => d.exists).map(d => Object.assign({}, d.data(), { id: d.id }));
      }
      const map = this.readLocal();
      return Object.keys(map).map(id => Object.assign({}, map[id], { id }));
    },
    async save(id, body) {
      await this.init();
      if (this.mode === 'db') {
        try { await this.col().doc(id).set(body); return 'db'; }
        catch (e) {
          if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 600 + Math.random() * 600)); await this.col().doc(id).set(body); return 'db'; }
          if (e && e.code === 'quota_exceeded') throw new Error('No hi ha més espai per desar nivells. Esborra\'n algun que ja no facis servir.');
          // sense permís d'escriptura: ho desem al navegador
          this.mode = 'local';
          updateStatus();
        }
      }
      const map = this.readLocal();
      map[id] = body;
      if (!this.writeLocal(map)) throw new Error('Aquest navegador no deixa desar res. Exporta el codi del nivell per no perdre\'l.');
      return 'local';
    },
    async remove(id) {
      await this.init();
      if (this.mode === 'db') { await this.col().doc(id).delete(); return; }
      const map = this.readLocal(); delete map[id]; this.writeLocal(map);
    }
  };

  /* =========================================================
     Estat de l'editor
     ========================================================= */
  const ed = {
    data: null, mask: null, id: null, dirty: false,
    tool: 'terra', shape: 'pinzell', size: 8,
    sel: null, drag: null, stroke: null, rectStart: null, pointer: null,
    undo: [], built: false, msg: ''
  };

  function defaultLevel(kind) {
    const mask = new Uint8Array(W * H);
    if (kind !== 'buit') for (let y = 220; y < H; y++) mask.fill(T.EARTH, y * W, y * W + W);
    const data = normalize({
      nom: 'Nivell nou', text: '', tema: 'muntanya', total: 10, needed: 7, rate: 30, time: 300,
      skills: { blocar: 2, pont: 2, picar: 2, cavar: 2 },
      entrance: { x: 60, y: 198, dir: 1 }, exit: { x: 580, y: 219 }
    });
    return { data, mask };
  }
  function fromBuiltin(i) {
    const L = A.LEVELS[i];
    const g = new E.Game(L);
    const data = normalize(JSON.parse(JSON.stringify({
      nom: L.nom + ' (còpia)', text: L.text, tema: L.tema, total: L.total, needed: L.needed, rate: L.rate, time: L.time,
      skills: L.skills, entrance: L.entrance, exit: L.exit, police: L.police, politicians: L.politicians,
      tribunals: L.tribunals, speakers: L.speakers, shooters: L.shooters, kings: L.kings
    })));
    return { data, mask: g.terrain.slice() };
  }
  function serialize() {
    return Object.assign({}, normalize(ed.data), { terreny: encodeMask(ed.mask), updated: Date.now() });
  }
  function newId() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // torna a muntar la vista prèvia (el terreny es conserva)
  function refresh(keepColors) {
    A.preview(toPlayable(ed.data, ed.mask), keepColors);
    ed.mask = A.game().terrain;
  }
  function loadInto(data, mask, id) {
    ed.data = normalize(data);
    ed.mask = mask;
    ed.id = id || null;
    ed.dirty = false;
    ed.sel = null;
    ed.undo = [];
    refresh(false);
    renderAll();
  }

  /* ---------- desfer ---------- */
  function pushUndo() {
    ed.undo.push({ data: JSON.stringify(ed.data), mask: ed.mask.slice() });
    if (ed.undo.length > 30) ed.undo.shift();
    updateUndo();
  }
  function undo() {
    const u = ed.undo.pop();
    if (!u) return;
    const theme = ed.data.tema;
    ed.data = JSON.parse(u.data);
    A.game().terrain.set(u.mask);
    ed.sel = null;
    refresh(theme === ed.data.tema);
    A.recolorColumns(0, W - 1);
    markDirty();
    renderAll();
  }
  function updateUndo() { const b = $('#edDesfes'); if (b) b.disabled = !ed.undo.length; }

  /* ---------- esborrany automàtic (només en aquest navegador) ---------- */
  let draftTimer = 0;
  function markDirty() {
    ed.dirty = true;
    updateStatus();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ id: ed.id, dirty: ed.dirty, data: serialize() })); } catch (e) { /* sense emmagatzematge */ }
    }, 800);
  }
  function restoreDraft() {
    try {
      const raw = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (!raw || !raw.data) return false;
      ed.data = normalize(raw.data);
      ed.mask = decodeMask(raw.data.terreny);
      ed.id = raw.id || null;
      ed.dirty = !!raw.dirty;
      return true;
    } catch (e) { return false; }
  }

  /* =========================================================
     Terreny i objectes
     ========================================================= */
  function solidAt(x, y) { return A.game().terr(x, y) !== T.EMPTY && x >= 0 && x < W; }
  // fila on un personatge té els peus si el deixem caure des de (x, y)
  function feet(x, y) {
    for (let yy = Math.max(0, Math.round(y)); yy < H; yy++) if (solidAt(x, yy)) return yy - 1;
    return null;
  }
  function paintSegment(a, b, t) {
    const g = A.game(), r = ed.size / 2;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / Math.max(0.5, r / 2)));
    for (let s = 0; s <= steps; s++) {
      const cx = a.x + (b.x - a.x) * s / steps, cy = a.y + (b.y - a.y) * s / steps;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          if (dx * dx + dy * dy <= r * r || (r <= 0.5 && Math.floor(cx) === x && Math.floor(cy) === y)) g.setT(x, y, t);
        }
      ed.stroke.minX = Math.min(ed.stroke.minX, cx - r - 1);
      ed.stroke.maxX = Math.max(ed.stroke.maxX, cx + r + 1);
    }
  }
  function rectOf(a, b) {
    const x0 = clamp(Math.floor(Math.min(a.x, b.x)), 0, W - 1), x1 = clamp(Math.floor(Math.max(a.x, b.x)), 0, W - 1);
    const y0 = clamp(Math.floor(Math.min(a.y, b.y)), 0, H - 1), y1 = clamp(Math.floor(Math.max(a.y, b.y)), 0, H - 1);
    return { x0, x1, y0, y1 };
  }
  function fillRect(a, b, t) {
    const g = A.game(), r = rectOf(a, b);
    for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) g.setT(x, y, t);
    A.recolorColumns(r.x0 - 1, r.x1 + 1);
  }

  function getEntity(s) {
    if (!s) return null;
    if (s.type === 'entrada') return ed.data.entrance;
    if (s.type === 'sortida') return ed.data.exit;
    return ed.data[ARR[s.type]][s.idx];
  }
  function boxOf(type, o) {
    switch (type) {
      case 'entrada': return { x0: o.x - 15, y0: o.y - 60, x1: o.x + 18, y1: o.y - 8 };
      case 'sortida': return { x0: o.x - 10, y0: o.y - 22, x1: o.x + 10, y1: o.y + 1 };
      case 'policia': return { x0: o.x0 - 5, y0: o.y - 13, x1: o.x1 + (o.n - 1) * 9 + 5, y1: o.y + 1 };
      case 'escopeta': return { x0: o.x - 6, y0: o.y - 13, x1: o.x + 6, y1: o.y + 1 };
      case 'politic': return { x0: Math.min(o.x - 5, o.bx - 3), y0: Math.min(o.y - 15, o.by0 - 12), x1: Math.max(o.x + 11, o.bx + o.bw + 3), y1: o.y + 1 };
      case 'casa': case 'estructures': return { x0: o.x0 - 5, y0: o.y - 14, x1: o.x1 + 5, y1: o.y + 1 };
      case 'tribunal': return { x0: o.x0 - 14, y0: o.y - 80, x1: o.x1 + 14, y1: o.y + 1 };
      case 'rei': return { x0: o.x - (o.w >> 1) - 2, y0: o.y - o.h - 22, x1: o.x + (o.w >> 1) + 2, y1: o.y + 1 };
    }
    return null;
  }
  function allEntities() {
    const out = [];
    out.push({ type: 'sortida', idx: 0 });
    out.push({ type: 'entrada', idx: 0 });
    ed.data.shooters.forEach((o, i) => out.push({ type: 'escopeta', idx: i }));
    ed.data.speakers.forEach((o, i) => out.push({ type: o.kind, idx: i }));
    ed.data.police.forEach((o, i) => out.push({ type: 'policia', idx: i }));
    ed.data.politicians.forEach((o, i) => out.push({ type: 'politic', idx: i }));
    ed.data.tribunals.forEach((o, i) => out.push({ type: 'tribunal', idx: i }));
    ed.data.kings.forEach((o, i) => out.push({ type: 'rei', idx: i }));
    return out;
  }
  function hitTest(p) {
    for (const s of allEntities()) {
      const b = boxOf(s.type, getEntity(s));
      if (b && p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1) return s;
    }
    return null;
  }
  function anchorX(type, o) {
    if (type === 'policia') return Math.round((o.x0 + o.x1 + (o.n - 1) * 9) / 2);
    if (type === 'casa' || type === 'estructures' || type === 'tribunal') return Math.round((o.x0 + o.x1) / 2);
    return o.x;
  }
  // mou un objecte dx píxels i el deixa sobre el terra que hi hagi sota el punter
  function moveEntity(type, o, orig, dx, py, dyRaw) {
    const shiftX = k => { o[k] = clamp(orig[k] + dx, 0, W); };
    if (type === 'entrada') { shiftX('x'); o.x = clamp(o.x, 14, W - 14); o.y = clamp(Math.round(orig.y + dyRaw), 36, H - 2); return; }
    if (type === 'politic') { shiftX('x'); shiftX('bx'); }
    else if (type === 'sortida' || type === 'escopeta' || type === 'rei') shiftX('x');
    else { shiftX('x0'); shiftX('x1'); }
    const fy = feet(anchorX(type, o), py - 8);
    const ny = fy === null ? orig.y : fy;
    if (type === 'politic') { const d = ny - orig.y; o.y = ny; o.by0 = orig.by0 + d; o.by1 = orig.by1 + d; }
    else o.y = ny;
  }
  function placeObject(tool, p) {
    const x = clamp(Math.round(p.x), 8, W - 8);
    const fy = feet(x, p.y - 8);
    const y = fy === null ? clamp(Math.round(p.y), 14, H - 2) : fy;
    const d = ed.data;
    let sel = null;
    switch (tool) {
      case 'entrada': d.entrance = { x: clamp(x, 14, W - 14), y: clamp(Math.round(p.y) + 10, 36, H - 2), dir: d.entrance.dir || 1 }; sel = { type: 'entrada', idx: 0 }; break;
      case 'sortida': d.exit = { x: clamp(x, 10, W - 10), y }; sel = { type: 'sortida', idx: 0 }; break;
      case 'policia': d.police.push({ x0: x - 40, x1: x + 20, y, n: 3, speed: 0.5 }); sel = { type: 'policia', idx: d.police.length - 1 }; break;
      case 'escopeta': d.shooters.push({ x, y, face: x > d.entrance.x ? -1 : 1, range: 200, aimFirst: 90, period: 30 }); sel = { type: 'escopeta', idx: d.shooters.length - 1 }; break;
      case 'politic': d.politicians.push({ x, y, bx: x + 30, bw: 6, by0: y - 40, by1: y, on: 110, off: 70, phase: 0, lema: 'LLEI!' }); sel = { type: 'politic', idx: d.politicians.length - 1 }; break;
      case 'casa': case 'estructures':
        d.speakers.push({ kind: tool, x0: x - 30, x1: x + 30, y, speed: tool === 'casa' ? 0.35 : 0.3 });
        sel = { type: tool, idx: d.speakers.length - 1 }; break;
      case 'tribunal': d.tribunals.push({ x0: x - 40, x1: x + 40, y, period: 70, slam: 8, phase: 0 }); sel = { type: 'tribunal', idx: d.tribunals.length - 1 }; break;
      case 'rei': d.kings.push({ x, y, w: 18, h: 34 }); sel = { type: 'rei', idx: d.kings.length - 1 }; break;
    }
    ed.sel = sel;
    refresh(true);
    markDirty();
    renderProps();
    A.sfx('assign');
  }
  function deleteSelected() {
    const s = ed.sel;
    if (!s || s.type === 'entrada' || s.type === 'sortida') return;
    pushUndo();
    ed.data[ARR[s.type]].splice(s.idx, 1);
    ed.sel = null;
    refresh(true);
    markDirty();
    renderProps();
  }

  /* =========================================================
     Ratolí i dits sobre l'escenari
     ========================================================= */
  const cv = A.canvas;
  const active = () => A.mode() === 'editor';
  const isTerrainTool = () => TERRENYS.some(t => t.id === ed.tool);

  cv.addEventListener('pointerdown', e => {
    if (!active() || ed.tool === 'vista' || e.button > 0) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* res */ }
    const p = A.toLogical(e);
    ed.pointer = p;
    const terr = TERRENYS.find(t => t.id === ed.tool);
    if (terr) {
      pushUndo();
      if (ed.shape === 'rect') ed.rectStart = p;
      else { ed.stroke = { last: p, t: terr.t, minX: W, maxX: 0 }; paintSegment(p, p, terr.t); }
      return;
    }
    if (ed.tool === 'selecciona') {
      const hit = hitTest(p);
      ed.sel = hit;
      if (hit) {
        pushUndo();
        ed.drag = { start: p, orig: JSON.parse(JSON.stringify(getEntity(hit))), moved: false };
      }
      renderProps();
      return;
    }
    pushUndo();
    placeObject(ed.tool, p);
  });
  cv.addEventListener('pointermove', e => {
    if (!active()) return;
    const p = A.toLogical(e);
    ed.pointer = p;
    if (ed.stroke) { paintSegment(ed.stroke.last, p, ed.stroke.t); ed.stroke.last = p; }
    else if (ed.drag) {
      const dx = Math.round(p.x - ed.drag.start.x), dy = p.y - ed.drag.start.y;
      if (!ed.drag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      ed.drag.moved = true;
      moveEntity(ed.sel.type, getEntity(ed.sel), ed.drag.orig, dx, p.y, dy);
      refresh(true);
    }
  });
  function endPointer() {
    if (ed.stroke) {
      A.recolorColumns(ed.stroke.minX, ed.stroke.maxX);
      ed.stroke = null;
      markDirty();
    } else if (ed.rectStart) {
      const terr = TERRENYS.find(t => t.id === ed.tool);
      if (terr && ed.pointer) fillRect(ed.rectStart, ed.pointer, terr.t);
      ed.rectStart = null;
      markDirty();
    } else if (ed.drag) {
      if (ed.drag.moved) { markDirty(); renderProps(); }
      else { ed.undo.pop(); updateUndo(); }
      ed.drag = null;
    }
  }
  cv.addEventListener('pointerup', e => { if (active()) endPointer(); });
  cv.addEventListener('pointercancel', e => { if (active()) endPointer(); });
  cv.addEventListener('pointerleave', () => { if (active() && !ed.stroke && !ed.drag && !ed.rectStart) ed.pointer = null; });

  document.addEventListener('keydown', e => {
    if (!active()) return;
    const tag = e.target && e.target.tagName;
    if (/INPUT|TEXTAREA|SELECT/.test(tag || '')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && ed.sel) { e.preventDefault(); deleteSelected(); }
    if (e.key === 'Escape' && ed.sel) { ed.sel = null; renderProps(); }
  });

  /* =========================================================
     Dibuix d'ajudes sobre l'escenari
     ========================================================= */
  function dashedRect(c, b, color) {
    c.save();
    c.setLineDash([2, 2]);
    c.strokeStyle = color; c.lineWidth = 0.6;
    c.strokeRect(b.x0 + 0.5, b.y0 + 0.5, b.x1 - b.x0, b.y1 - b.y0);
    c.restore();
  }
  function label(c, txt, x, y, color) {
    c.font = '600 7px "Pixelify Sans", monospace';
    c.textAlign = 'center';
    c.lineWidth = 2; c.strokeStyle = 'rgba(8,14,36,0.9)';
    c.strokeText(txt, x, y);
    c.fillStyle = color || '#ffffff';
    c.fillText(txt, x, y);
  }
  function overlay(ctx, S) {
    if (!ed.data) return;
    const c = ctx, d = ed.data;
    c.save();
    c.scale(S, S);
    c.lineJoin = 'round';
    // recorreguts de patrulla
    c.save(); c.setLineDash([3, 2]); c.lineWidth = 0.8;
    for (const p of d.police) { c.strokeStyle = 'rgba(134,168,208,0.9)'; c.beginPath(); c.moveTo(p.x0, p.y + 3); c.lineTo(p.x1 + (p.n - 1) * 9, p.y + 3); c.stroke(); }
    for (const p of d.speakers) { c.strokeStyle = 'rgba(255,210,31,0.8)'; c.beginPath(); c.moveTo(p.x0, p.y + 3); c.lineTo(p.x1, p.y + 3); c.stroke(); }
    c.restore();
    // abast de les escopetes
    for (const s of d.shooters) {
      const x1 = clamp(s.x + s.face * s.range, 0, W);
      c.fillStyle = 'rgba(227,39,46,0.14)';
      c.fillRect(Math.min(s.x, x1), s.y - 10, Math.abs(x1 - s.x), 10);
      label(c, `tret a ${(s.aimFirst / TPS).toFixed(1)} s`, s.x, s.y - 16, '#ff7a6e');
    }
    // barreres dels polítics de lleis (sempre visibles a l'editor)
    for (const p of d.politicians) {
      dashedRect(c, { x0: p.bx, y0: p.by0, x1: p.bx + p.bw - 1, y1: p.by1 }, 'rgba(255,122,110,0.95)');
      c.save(); c.setLineDash([1, 2]); c.strokeStyle = 'rgba(255,122,110,0.6)'; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(p.x + 5, p.y - 6); c.lineTo(p.bx, p.y - 6); c.stroke(); c.restore();
    }
    // zones de la maça dels tribunals
    for (const t of d.tribunals) {
      c.fillStyle = 'rgba(227,39,46,0.22)';
      c.fillRect(t.x0, t.y - 14, t.x1 - t.x0 + 1, 15);
    }
    // caiguda des de la casa
    const e = d.entrance;
    const fy = feet(e.x, e.y);
    c.save(); c.setLineDash([2, 2]); c.lineWidth = 0.7;
    if (fy === null) {
      c.strokeStyle = '#ff7a6e';
      c.beginPath(); c.moveTo(e.x + 0.5, e.y); c.lineTo(e.x + 0.5, H); c.stroke();
      label(c, 'cauen al buit!', e.x, Math.min(H - 6, e.y + 20), '#ff7a6e');
    } else {
      const drop = fy - e.y;
      const bad = drop > SAFE_FALL;
      c.strokeStyle = bad ? '#ff7a6e' : 'rgba(255,255,255,0.55)';
      c.beginPath(); c.moveTo(e.x + 0.5, e.y); c.lineTo(e.x + 0.5, fy); c.stroke();
      if (bad) label(c, 'massa alt!', e.x, e.y + drop / 2, '#ff7a6e');
    }
    c.restore();
    // fletxa de sortida de la colla
    c.fillStyle = '#ffd21f';
    const ax = e.x + e.dir * 18, ay = e.y - 18;
    c.beginPath(); c.moveTo(ax + e.dir * 4, ay); c.lineTo(ax, ay - 3); c.lineTo(ax, ay + 3); c.fill();
    // objecte seleccionat
    if (ed.sel) {
      const b = boxOf(ed.sel.type, getEntity(ed.sel));
      if (b) dashedRect(c, { x0: b.x0 - 1, y0: b.y0 - 1, x1: b.x1 + 1, y1: b.y1 + 1 }, '#ffd21f');
    }
    // cursor
    const p = ed.pointer;
    if (p) {
      if (ed.rectStart && isTerrainTool()) {
        const r = rectOf(ed.rectStart, p);
        c.fillStyle = ed.tool === 'esborra' ? 'rgba(255,122,110,0.25)' : 'rgba(255,210,31,0.25)';
        c.fillRect(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1);
        dashedRect(c, { x0: r.x0, y0: r.y0, x1: r.x1 + 1, y1: r.y1 + 1 }, '#ffd21f');
        label(c, `${r.x1 - r.x0 + 1}×${r.y1 - r.y0 + 1}`, (r.x0 + r.x1) / 2, r.y0 - 3, '#ffd21f');
      } else if (isTerrainTool()) {
        c.strokeStyle = ed.tool === 'esborra' ? '#ff7a6e' : '#ffd21f';
        c.lineWidth = 0.7;
        if (ed.shape === 'rect') {
          c.beginPath(); c.moveTo(p.x - 4, p.y); c.lineTo(p.x + 4, p.y); c.moveTo(p.x, p.y - 4); c.lineTo(p.x, p.y + 4); c.stroke();
        } else {
          c.beginPath(); c.arc(p.x, p.y, Math.max(0.8, ed.size / 2), 0, Math.PI * 2); c.stroke();
        }
      } else if (ed.tool !== 'selecciona' && ed.tool !== 'vista') {
        const o = OBJECTES.find(o => o.id === ed.tool);
        const fy2 = feet(Math.round(p.x), p.y - 8);
        c.strokeStyle = '#ffd21f'; c.lineWidth = 0.7;
        const gy = ed.tool === 'entrada' ? p.y + 10 : (fy2 === null ? p.y : fy2);
        c.beginPath(); c.moveTo(p.x - 4, gy + 1); c.lineTo(p.x + 4, gy + 1); c.stroke();
        if (o) label(c, '+ ' + o.nom, p.x, gy - 16, '#ffd21f');
      }
    }
    c.restore();
  }
  A.setOverlay(overlay);

  /* =========================================================
     Panell de l'editor
     ========================================================= */
  const panel = $('#editor');
  function toolButton(id, nom, extra, title) {
    return `<button type="button" class="eina" data-tool="${id}" aria-pressed="false"${title ? ` title="${esc(title)}"` : ''}>${extra || ''}${esc(nom)}</button>`;
  }
  function buildPanel() {
    const terr = TERRENYS.map(t => toolButton(t.id, t.nom,
      `<span class="mostra${t.color ? '' : ' buida'}" style="${t.color ? 'background:' + t.color : ''}"></span>`, TERRA_INFO[t.id])).join('');
    const objs = OBJECTES.map(o => toolButton(o.id, o.nom, '', INFO[o.id].fa + (INFO[o.id].supera ? ' Com se supera: ' + INFO[o.id].supera : ''))).join('');
    panel.innerHTML = `
      <div class="eines" role="toolbar" aria-label="Eines de l'editor">
        <div class="grup-eines"><span class="etiqueta">Terreny</span>${terr}</div>
        <div class="grup-eines">
          <span class="etiqueta">Forma</span>
          <button type="button" class="eina" data-shape="pinzell" aria-pressed="false">Pinzell</button>
          <button type="button" class="eina" data-shape="rect" aria-pressed="false">Rectangle</button>
          <div class="camp" style="flex-direction:row;align-items:center;gap:6px">
            <label for="edMida">Gruix</label>
            <select id="edMida">${[1, 2, 4, 8, 12, 20, 32].map(n => `<option value="${n}">${n}</option>`).join('')}</select>
          </div>
        </div>
        <div class="grup-eines"><span class="etiqueta">Objectes</span>
          ${toolButton('selecciona', 'Selecciona i mou')}${objs}
          ${toolButton('vista', 'Desplaça la vista')}
        </div>
      </div>
      <div class="accions">
        <button type="button" class="boto-mig principal" id="edProva">Prova el nivell</button>
        <button type="button" class="boto-mig" id="edDesa">Desa</button>
        <button type="button" class="boto-mig" id="edDesfes">Desfés</button>
        <button type="button" class="boto-mig" id="edNou">Nou</button>
        <button type="button" class="boto-mig" id="edLlista">Els meus nivells</button>
        <button type="button" class="boto-mig" id="edExporta">Exporta codi</button>
        <button type="button" class="boto-mig" id="edImporta">Importa codi</button>
        <button type="button" class="boto-mig" id="edLevelsJs">Codi per a levels.js</button>
        <button type="button" class="boto-mig" id="edSurt">Surt de l'editor</button>
      </div>
      <p class="estat-editor" id="edEstat" aria-live="polite"></p>
      <ul class="avisos" id="edAvisos"></ul>
      <div class="editor-cos">
        <section class="quadre" id="edProps" aria-label="Objecte seleccionat"></section>
        <section class="quadre" aria-label="Dades del nivell">
          <h3>Nivell</h3>
          <div class="camps" id="edNivell"></div>
          <h3>Habilitats</h3>
          <div class="camps habs" id="edHabs"></div>
        </section>
      </div>
      ${guideHtml()}`;
    panel.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => {
      ed.tool = b.dataset.tool;
      if (ed.tool !== 'selecciona') ed.sel = null;
      updateTools();
      renderProps();
    }));
    paintIcons(panel);
    panel.querySelectorAll('[data-shape]').forEach(b => b.addEventListener('click', () => { ed.shape = b.dataset.shape; if (!isTerrainTool()) ed.tool = 'terra'; updateTools(); }));
    $('#edMida').addEventListener('change', e => { ed.size = +e.target.value; });
    $('#edProva').addEventListener('click', playTest);
    $('#edDesa').addEventListener('click', save);
    $('#edDesfes').addEventListener('click', undo);
    $('#edNou').addEventListener('click', () => guardUnsaved(newDialog));
    $('#edLlista').addEventListener('click', () => openList());
    $('#edExporta').addEventListener('click', exportDialog);
    $('#edImporta').addEventListener('click', () => guardUnsaved(importDialog));
    $('#edLevelsJs').addEventListener('click', levelsJsDialog);
    $('#edSurt').addEventListener('click', () => { A.showMenu(); });
    ed.built = true;
  }
  function updateTools() {
    panel.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === ed.tool ? 'true' : 'false'));
    panel.querySelectorAll('[data-shape]').forEach(b => b.setAttribute('aria-pressed', isTerrainTool() && b.dataset.shape === ed.shape ? 'true' : 'false'));
    $('#edMida').value = String(ed.size);
    $('#edMida').disabled = ed.shape === 'rect' || !isTerrainTool();
    cv.style.touchAction = ed.tool === 'vista' ? 'pan-x' : 'none';
    cv.style.cursor = ed.tool === 'vista' ? 'grab' : ed.tool === 'selecciona' ? 'pointer' : 'crosshair';
    const hints = {
      vista: 'Arrossega per desplaçar l\'escenari (útil al mòbil).',
      selecciona: 'Clica un objecte per veure\'n les propietats i arrossega\'l per moure\'l. Suprimeix l\'esborra.'
    };
    if (hints[ed.tool]) setMsg(hints[ed.tool]);
    else if (isTerrainTool()) setMsg(ed.shape === 'rect' ? 'Arrossega per omplir un rectangle.' : 'Pinta arrossegant. Tria el gruix del pinzell al costat.');
    else setMsg('Clica a l\'escenari per posar-hi l\'objecte. Es col·loca sobre el terra que hi hagi a sota.');
  }

  /* ---------- formulari del nivell ---------- */
  function field(id, labelTxt, html, wide) {
    return `<div class="camp${wide ? ' ample' : ''}"><label for="${id}">${labelTxt}</label>${html}</div>`;
  }
  function renderLevelForm() {
    const d = ed.data;
    $('#edNivell').innerHTML = [
      field('fNom', 'Nom', `<input id="fNom" type="text" maxlength="60" value="${esc(d.nom)}">`, true),
      field('fText', 'Descripció (es mostra abans de jugar)', `<textarea id="fText" maxlength="400" rows="2">${esc(d.text)}</textarea>`, true),
      field('fTema', 'Tema', `<select id="fTema">${TEMES.map(([v, n]) => `<option value="${v}"${v === d.tema ? ' selected' : ''}>${n}</option>`).join('')}</select>`),
      field('fTotal', 'Catalemmings', `<input id="fTotal" type="number" min="1" max="80" value="${d.total}">`),
      field('fNeeded', 'Cal salvar-ne', `<input id="fNeeded" type="number" min="1" max="${d.total}" value="${d.needed}">`),
      field('fRate', 'Ritme mínim (1–99)', `<input id="fRate" type="number" min="1" max="99" value="${d.rate}">`),
      field('fTime', 'Temps (segons)', `<input id="fTime" type="number" min="30" max="1800" step="10" value="${d.time}">`)
    ].join('');
    $('#edHabs').innerHTML = E.SKILLS.map(s => field('h_' + s, esc(A.SKILL_INFO[s].nom),
      `<input id="h_${s}" type="number" min="0" max="99" value="${d.skills[s] || 0}">`)).join('');
    // cada camp escriu directament a ed.data; en sortir-ne només se'n corregeix el valor mostrat
    const bind = (id, set, get) => {
      const el = $('#' + id);
      el.addEventListener('focus', pushUndo, { once: true });
      el.addEventListener('input', () => { set(el.value); markDirty(); });
      el.addEventListener('change', () => {
        if (get) el.value = get();
        const nd = $('#fNeeded');
        nd.max = ed.data.total; nd.value = ed.data.needed;
        validate();
      });
    };
    const D = () => ed.data;
    bind('fNom', v => { D().nom = v.slice(0, 60); updateStatus(); const h = $('#nivellNom'); if (h) h.textContent = 'Editor · ' + (D().nom || 'Sense nom'); });
    bind('fText', v => { D().text = v.slice(0, 400); });
    bind('fTotal', v => { const d2 = D(); d2.total = int(v, 1, 80, d2.total); if (d2.needed > d2.total) d2.needed = d2.total; }, () => D().total);
    bind('fNeeded', v => { const d2 = D(); d2.needed = int(v, 1, d2.total, d2.needed); }, () => D().needed);
    bind('fRate', v => { D().rate = int(v, 1, 99, D().rate); }, () => D().rate);
    bind('fTime', v => { D().time = int(v, 30, 1800, D().time); }, () => D().time);
    $('#fTema').addEventListener('change', e => { pushUndo(); D().tema = e.target.value; refresh(false); markDirty(); });
    for (const sk of E.SKILLS) bind('h_' + sk, v => { D().skills[sk] = int(v, 0, 99, 0); }, () => D().skills[sk]);
  }

  /* ---------- propietats de l'objecte seleccionat ---------- */
  const PROPS = {
    entrada: o => [['dir', 'Els catalemmings surten cap a', 'select', [[1, 'la dreta'], [-1, 'l\'esquerra']], o.dir]],
    sortida: () => [],
    policia: o => [
      ['n', 'Agents a la línia', 'number', [1, 6, 1], o.n],
      ['rec', 'Recorregut (px)', 'number', [0, 400, 5], o.x1 - o.x0],
      ['speed', 'Velocitat', 'number', [0.05, 3, 0.05], o.speed]
    ],
    escopeta: o => [
      ['face', 'Dispara cap a', 'select', [[-1, 'l\'esquerra'], [1, 'la dreta']], o.face],
      ['range', 'Abast (px)', 'number', [30, 640, 10], o.range],
      ['aimFirst', 'Primer tret (segons)', 'number', [0.2, 16, 0.1], +(o.aimFirst / TPS).toFixed(1)],
      ['period', 'Entre trets (segons)', 'number', [0.4, 8, 0.1], +(o.period / TPS).toFixed(1)]
    ],
    politic: o => [
      ['lema', 'Lema', 'text', 14, o.lema],
      ['bdist', 'Barrera a (px del polític)', 'number', [-300, 300, 2], o.bx - o.x],
      ['bh', 'Alçada de la barrera (px)', 'number', [8, 120, 2], o.by1 - o.by0],
      ['on', 'Barrera aixecada (s)', 'number', [0.4, 24, 0.2], +(o.on / TPS).toFixed(1)],
      ['off', 'Barrera abaixada (s)', 'number', [0.4, 24, 0.2], +(o.off / TPS).toFixed(1)]
    ],
    casa: o => [
      ['kind', 'Crida', 'select', [['casa', '«Torneu a casa!»'], ['estructures', '«Estructures d\'estat!»']], o.kind],
      ['rec', 'Recorregut (px)', 'number', [0, 400, 5], o.x1 - o.x0],
      ['speed', 'Velocitat', 'number', [0, 3, 0.05], o.speed]
    ],
    rei: o => [
      ['kh', 'Alçada del pedestal (px)', 'number', [14, 80, 1], o.h],
      ['kw', 'Amplada del pedestal (px)', 'number', [10, 40, 2], o.w]
    ],
    tribunal: o => [
      ['amp', 'Amplada de la maça (px)', 'number', [10, 240, 2], o.x1 - o.x0],
      ['period', 'Un cop cada (segons)', 'number', [0.8, 16, 0.1], +(o.period / TPS).toFixed(1)]
    ]
  };
  PROPS.estructures = PROPS.casa;
  const TITOL = {
    entrada: 'Casa (entrada)', sortida: 'Estelada (sortida)', policia: 'Línia d\'antiavalots', escopeta: 'Antiavalots amb escopeta',
    politic: 'Polític de lleis', casa: 'Polític «Torneu a casa!»', estructures: 'Polític «Estructures d\'estat!»', tribunal: 'Tribunal', rei: 'Rei a la trona'
  };
  // què fa cada objecte i com se supera (guia i panell lateral)
  const INFO = {
    entrada: {
      fa: 'D\'aquí surten els catalemmings, un darrere l\'altre, al ritme que marca el nivell. Quan se\'n salven prou, la bandera espanyola del teulat cau a terra.',
      consell: 'La línia de punts marca la caiguda fins a terra. Si surt en vermell és de més de 56 px i s\'enfadaran en caure, tret que tinguin calçots.'
    },
    sortida: {
      fa: 'És la llibertat: cada catalemming que hi arriba compta com a salvat.',
      consell: 'Posa-la sobre terra ferma. Només n\'hi pot haver una.'
    },
    policia: {
      fa: 'Una línia d\'agents patrulla d\'un costat a l\'altre. Qui els toca queda detingut i se\'n torna a casa enfadat.',
      supera: 'Una cassolada a prop (fa fugir tots els agents que té a l\'abast), saltar-los per sobre si encertes el moment, o passar per sota terra cavant i picant.'
    },
    escopeta: {
      fa: 'Quan té catalemmings a tret, apunta i dispara pilotes de goma. Qui en rep una se\'n va a l\'hospital. El primer tret tarda una estona; la franja vermella marca l\'abast.',
      supera: 'Aixeca un mur de pedra per aturar les pilotes i la colla, i passa per sota terra cavant i picant. Les pilotes també s\'aturen contra qualsevol terreny i contra els castells.'
    },
    politic: {
      fa: 'Dicta lleis que aixequen i abaixen una barrera cada pocs segons. La colla s\'hi gira, però no es perd ningú.',
      supera: 'Esperar que la barrera baixi, o fer una cassolada a prop: el polític fuig i la barrera desapareix.'
    },
    casa: {
      fa: 'Es passeja cridant «Torneu a casa!». Qui hi xoca abaixa el cap i se\'n torna a casa: es perd.',
      supera: 'Una cassolada a prop el fa fugir. També se\'l pot saltar per sobre.'
    },
    estructures: {
      fa: 'Es passeja parlant d\'estructures d\'estat i fa girar tothom que se li acosta. No es perd ningú, però no passen.',
      supera: 'Dona calçots a un catalemming: quan hi topa, l\'olor fa fugir el polític i el camí queda lliure per a tothom.'
    },
    rei: {
      fa: 'Un rei seu a la trona dalt d\'un pedestal de marbre. El pedestal fa de paret: la colla s\'hi gira i no passa. Picar-lo no serveix («Clanc!»).',
      supera: 'Dona «Pastís de nata» a un catalemming: li tira a la cara, el pedestal desapareix i el rei cau a terra. També es pot passar per sobre amb un castell (si el pedestal no fa més de 46 px) o per sota terra cavant i picant.',
      consell: 'El pastís busca el rei que tingui al davant, fins a 240 px de distància.'
    },
    tribunal: {
      fa: 'Una maça gegant cau cada pocs segons sobre la zona vermella. Qui hi és a sota queda condemnat i se\'n torna a casa.',
      supera: 'Passar per sota terra cavant i picant. Si la zona és estreta i la maça tarda a caure, també s\'hi pot passar a temps.',
      consell: 'Posa marbre sota el tribunal perquè no s\'hi pugui cavar just a sota.'
    }
  };
  const TERRA_INFO = {
    terra: 'Terreny normal. Es pot cavar i picar.',
    marbre: 'No es pot cavar ni picar: qui ho intenta sent «Clanc!» i para. Serveix per obligar a seguir un camí concret.',
    mur: 'Es comporta com la terra (es pot cavar i picar), però té aspecte de paret. Si fa més de 6 px d\'alt, la colla no el pot pujar caminant: cal un castell (fins a 40 px), picar-lo o fer un pont.',
    pedra: 'El mateix material que fa l\'habilitat «Mur de pedra». Atura les pilotes de goma i es pot cavar i picar.',
    esborra: 'Treu terreny: fa forats, barrancs i coves. Un catalemming que cau més de 56 px s\'enfada, i si cau pel fons de l\'escenari es perd.'
  };
  function infoHtml(key) {
    const i = INFO[key];
    if (!i) return '';
    return `<p class="info-obj"><b>Què fa:</b> ${esc(i.fa)}</p>`
      + (i.supera ? `<p class="info-obj"><b>Com se supera:</b> ${esc(i.supera)}</p>` : '')
      + (i.consell ? `<p class="info-obj"><b>Consell:</b> ${esc(i.consell)}</p>` : '');
  }
  function paintIcons(root) {
    root.querySelectorAll('canvas[data-icon]').forEach(c => { if (A.objectIcon) A.objectIcon(c.getContext('2d'), c.dataset.icon); });
  }
  function guideHtml() {
    const objs = OBJECTES.map(o => `<article class="guia-item">
        <canvas width="32" height="24" data-icon="${o.id}" aria-hidden="true"></canvas>
        <div><h4>${esc(TITOL[o.id])}</h4>${infoHtml(o.id)}</div>
      </article>`).join('');
    const terr = TERRENYS.map(t => `<article class="guia-item">
        <span class="mostra-gran${t.color ? '' : ' buida'}" style="${t.color ? 'background:' + t.color : ''}" aria-hidden="true"></span>
        <div><h4>${esc(t.nom)}</h4><p class="info-obj">${esc(TERRA_INFO[t.id])}</p></div>
      </article>`).join('');
    return `<details class="quadre guia" id="edGuia" open>
      <summary>Guia: què fa cada objecte i com se supera</summary>
      <div class="guia-llista">
        <p class="guia-sub">Objectes</p>${objs}
        <p class="guia-sub">Terrenys</p>${terr}
      </div>
    </details>`;
  }
  function renderProps() {
    const box = $('#edProps');
    if (!box) return;
    const s = ed.sel, o = getEntity(s);
    if (!s || !o) {
      if (INFO[ed.tool]) {
        box.innerHTML = `<div class="cap-obj"><canvas width="32" height="24" data-icon="${ed.tool}" aria-hidden="true"></canvas><h3>${esc(TITOL[ed.tool])}</h3></div>
          ${infoHtml(ed.tool)}<p>Clica a l'escenari per posar-n'hi un. Es col·loca sobre el terra que hi hagi a sota.</p>`;
        paintIcons(box);
      } else if (TERRA_INFO[ed.tool]) {
        const t = TERRENYS.find(x => x.id === ed.tool);
        box.innerHTML = `<div class="cap-obj"><span class="mostra-gran${t.color ? '' : ' buida'}" style="${t.color ? 'background:' + t.color : ''}"></span><h3>${esc(t.nom)}</h3></div><p class="info-obj">${esc(TERRA_INFO[t.id])}</p>`;
      } else {
        box.innerHTML = `<h3>Objecte</h3><p>Tria «Selecciona i mou» i clica un objecte de l'escenari per canviar-ne les propietats. Amb una eina d'objecte, cada clic en posa un de nou.</p>`;
      }
      return;
    }
    const defs = PROPS[s.type](o);
    const fields = defs.map(([k, lab, kind, opt, val]) => {
      const id = 'p_' + k;
      if (kind === 'select') return field(id, lab, `<select id="${id}">${opt.map(([v, n]) => `<option value="${v}"${String(v) === String(val) ? ' selected' : ''}>${n}</option>`).join('')}</select>`);
      if (kind === 'text') return field(id, lab, `<input id="${id}" type="text" maxlength="${opt}" value="${esc(val)}">`);
      return field(id, lab, `<input id="${id}" type="number" min="${opt[0]}" max="${opt[1]}" step="${opt[2]}" value="${val}">`);
    }).join('');
    const canDelete = s.type !== 'entrada' && s.type !== 'sortida';
    box.innerHTML = `<div class="cap-obj"><canvas width="32" height="24" data-icon="${s.type}" aria-hidden="true"></canvas><h3>${esc(TITOL[s.type])}</h3></div>${infoHtml(s.type)}
      ${fields ? `<div class="camps">${fields}</div>` : ''}
      ${canDelete ? '<div class="accions"><button type="button" class="boto-mig perill" id="pEsborra">Esborra l\'objecte</button></div>' : ''}`;
    for (const [k, , kind, opt] of defs) {
      const el = $('#p_' + k);
      el.addEventListener('focus', pushUndo, { once: true });
      el.addEventListener(kind === 'select' ? 'change' : 'input', () => {
        if (kind === 'select') pushUndo();
        setProp(s, getEntity(s), k, kind === 'number' ? clamp(Number(el.value) || 0, opt[0], opt[1]) : el.value);
        refresh(true);
        markDirty();
        validate();
        if (k === 'kind') renderProps();
      });
    }
    if (canDelete) $('#pEsborra').addEventListener('click', deleteSelected);
    paintIcons(box);
  }
  function setProp(s, o, k, v) {
    const ticks = x => Math.max(1, Math.round(x * TPS));
    switch (k) {
      case 'dir': o.dir = +v === -1 ? -1 : 1; break;
      case 'n': o.n = Math.round(v); break;
      case 'rec': o.x1 = clamp(o.x0 + Math.round(v), o.x0, W); break;
      case 'speed': o.speed = v; break;
      case 'face': o.face = +v === 1 ? 1 : -1; break;
      case 'range': o.range = Math.round(v); break;
      case 'aimFirst': o.aimFirst = ticks(v); break;
      case 'period':
        if (s.type === 'tribunal') o.period = Math.max(o.slam + 10, ticks(v));
        else o.period = Math.max(8, ticks(v));
        break;
      case 'lema': o.lema = String(v).slice(0, 14) || 'LLEI!'; break;
      case 'bdist': o.bx = clamp(o.x + Math.round(v), 0, W - o.bw); break;
      case 'bh': o.by0 = o.by1 - Math.round(v); break;
      case 'on': o.on = ticks(v); break;
      case 'off': o.off = ticks(v); break;
      case 'kind': o.kind = v === 'estructures' ? 'estructures' : 'casa'; s.type = o.kind; break;
      case 'kh': o.h = Math.round(v); break;
      case 'kw': o.w = Math.round(v); break;
      case 'amp': { const c = (o.x0 + o.x1) / 2; o.x0 = clamp(Math.round(c - v / 2), 0, W); o.x1 = clamp(o.x0 + Math.round(v), o.x0 + 10, W); break; }
    }
  }

  /* ---------- comprovacions ---------- */
  function validate() {
    const d = ed.data, out = [];
    const e = d.entrance, fy = feet(e.x, e.y);
    if (fy === null) out.push('Sota la casa no hi ha terra: tots els catalemmings cauran al buit.');
    else if (fy - e.y > SAFE_FALL && !(d.skills.calcots > 0)) out.push('Des de la casa fins a terra hi ha massa alçada i no hi ha calçots: tots s\'enfadaran en caure.');
    if (!solidAt(d.exit.x, d.exit.y + 1)) out.push('L\'estelada no és sobre terra ferma.');
    if (d.needed > d.total) out.push('Cal salvar-ne més dels que hi ha.');
    if (!E.SKILLS.some(s => d.skills[s] > 0)) out.push('No hi ha cap habilitat: el jugador no podrà fer res.');
    const ul = $('#edAvisos');
    if (ul) ul.innerHTML = out.map(t => `<li>${esc(t)}</li>`).join('');
    return out;
  }

  /* ---------- estat ---------- */
  function setMsg(t) { ed.msg = t; updateStatus(); }
  function updateStatus() {
    const el = $('#edEstat');
    if (!el || !ed.data) return;
    const where = store.mode === 'db' ? 'al teu compte' : 'en aquest navegador';
    const saved = ed.dirty ? (ed.id ? 'Hi ha canvis sense desar.' : 'Encara no s\'ha desat.') : (ed.id ? `Desat ${where}.` : '');
    el.innerHTML = `<b>${esc(ed.data.nom)}</b> · ${esc(saved)} ${esc(ed.msg || '')}`;
    updateUndo();
  }
  function renderAll() {
    if (!ed.built) buildPanel();
    updateTools();
    renderLevelForm();
    renderProps();
    validate();
    updateStatus();
  }

  /* =========================================================
     Accions
     ========================================================= */
  function playTest() {
    ed.data = normalize(ed.data);
    A.playCustom(toPlayable(ed.data, ed.mask.slice()), 'prova');
  }
  async function save() {
    const btn = $('#edDesa');
    btn.disabled = true;
    setMsg('Desant…');
    try {
      if (!ed.id) ed.id = newId();
      const where = await store.save(ed.id, serialize());
      ed.dirty = false;
      setMsg(where === 'db' ? '' : 'Com que aquí no hi ha emmagatzematge del compte, s\'ha desat en aquest navegador.');
      markDraftClean();
      A.sfx('saved');
    } catch (e) {
      setMsg(e && e.message ? e.message : 'No s\'ha pogut desar. Torna-ho a provar d\'aquí a una estona.');
    }
    btn.disabled = false;
  }
  function markDraftClean() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ id: ed.id, dirty: false, data: serialize() })); } catch (e) { /* res */ }
  }

  /* ---------- capes (diàlegs dins la pàgina) ---------- */
  const capa = A.capa;
  function showCapa(html, wide) {
    capa.innerHTML = `<div class="fitxa${wide ? ' ampla' : ''}">${html}</div>`;
    capa.hidden = false;
  }
  function closeCapa() { capa.hidden = true; capa.innerHTML = ''; }

  function guardUnsaved(next) {
    if (!ed.data || !ed.dirty) return next();
    showCapa(`<p class="cella">Editor</p><h2>Tens canvis sense desar</h2>
      <p>«${esc(ed.data.nom)}» té canvis que no has desat. Si continues, es perdran.</p>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran" id="gDesa">Desa i continua</button>
        <button type="button" class="boto-gran secundari" id="gPerd">Continua sense desar</button>
        <button type="button" class="boto-gran secundari" id="gCancel">Cancel·la</button>
      </div>`);
    $('#gDesa').addEventListener('click', async () => { closeCapa(); await save(); if (!ed.dirty) next(); });
    $('#gPerd').addEventListener('click', () => { ed.dirty = false; closeCapa(); next(); });
    $('#gCancel').addEventListener('click', closeCapa);
  }

  function newDialog() {
    if (A.mode() !== 'editor') open(true);
    const opts = A.LEVELS.map((L, i) => `<option value="${i}">${i + 1}. ${esc(L.nom)}</option>`).join('');
    showCapa(`<p class="cella">Editor</p><h2>Nivell nou</h2>
      <p>Comença amb un terra pla, amb l'escenari buit o amb una còpia d'un nivell del joc per modificar-lo.</p>
      <div class="tria-nou">
        <button type="button" class="boto-gran" id="nPla">Terra plana</button>
        <button type="button" class="boto-gran secundari" id="nBuit">Escenari buit</button>
      </div>
      <div class="camp"><label for="nCopia">Còpia d'un nivell del joc</label><select id="nCopia">${opts}</select></div>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran secundari" id="nFesCopia">Fes-ne una còpia</button>
        <button type="button" class="boto-gran secundari" id="nCancel">Cancel·la</button>
      </div>`);
    const start = ({ data, mask }) => { closeCapa(); loadInto(data, mask, null); ed.dirty = true; markDirty(); setMsg('Nivell nou a punt.'); };
    $('#nPla').addEventListener('click', () => start(defaultLevel('pla')));
    $('#nBuit').addEventListener('click', () => start(defaultLevel('buit')));
    $('#nFesCopia').addEventListener('click', () => start(fromBuiltin(+$('#nCopia').value)));
    $('#nCancel').addEventListener('click', closeCapa);
  }

  async function openList() {
    showCapa(`<p class="cella">Els meus nivells</p><h2>Els meus nivells</h2><p id="lEstat">Carregant…</p><div class="llista-propis" id="lLlista"></div>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran" id="lNou">Crea'n un de nou</button>
        <button type="button" class="boto-gran secundari" id="lTanca">${A.mode() === 'editor' ? 'Torna a l\'editor' : 'Tots els nivells'}</button>
      </div>`, true);
    $('#lNou').addEventListener('click', () => guardUnsaved(newDialog));
    $('#lTanca').addEventListener('click', () => { if (A.mode() === 'editor') closeCapa(); else A.showMenu(); });
    let items = [];
    try { items = await store.list(); }
    catch (e) { $('#lEstat').textContent = 'No s\'han pogut carregar els nivells. Torna-ho a provar d\'aquí a una estona.'; return; }
    if (!$('#lLlista')) return;
    items.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const where = store.mode === 'db' ? 'Es desen al teu compte: només els veus tu.' : 'Es desen en aquest navegador.';
    $('#lEstat').textContent = items.length ? where : `Encara no n'has desat cap. ${where}`;
    $('#lLlista').innerHTML = items.map(it => {
      const n = normalize(it);
      const when = it.updated ? new Date(it.updated).toLocaleString('ca-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
      return `<div class="fila-propi" data-id="${esc(it.id)}">
        <div class="info"><span class="nom">${esc(n.nom)}</span><span class="detall">${n.total} catalemmings · cal salvar-ne ${n.needed}${when ? ' · ' + esc(when) : ''}</span></div>
        <div class="botons-fitxa">
          <button type="button" class="boto-mig principal" data-a="juga">Juga</button>
          <button type="button" class="boto-mig" data-a="edita">Edita</button>
          <button type="button" class="boto-mig perill" data-a="esborra">Esborra</button>
        </div>
      </div>`;
    }).join('');
    $('#lLlista').querySelectorAll('.fila-propi').forEach(row => {
      const it = items.find(x => x.id === row.dataset.id);
      row.querySelector('[data-a="juga"]').addEventListener('click', () => {
        try { closeCapa(); A.playCustom(toPlayable(it, decodeMask(it.terreny)), 'propi'); }
        catch (e) { showError('Aquest nivell té el terreny malmès i no es pot obrir.'); }
      });
      row.querySelector('[data-a="edita"]').addEventListener('click', () => guardUnsaved(() => {
        try { closeCapa(); open(true); loadInto(it, decodeMask(it.terreny), it.id); markDraftClean(); }
        catch (e) { showError('Aquest nivell té el terreny malmès i no es pot obrir.'); }
      }));
      const del = row.querySelector('[data-a="esborra"]');
      del.addEventListener('click', async () => {
        if (!del.classList.contains('armat')) { del.classList.add('armat'); del.textContent = 'Segur? Clica de nou'; setTimeout(() => { del.classList.remove('armat'); del.textContent = 'Esborra'; }, 3000); return; }
        del.disabled = true;
        try {
          await store.remove(it.id);
          if (ed.id === it.id) { ed.id = null; ed.dirty = true; updateStatus(); }
          row.remove();
        } catch (e) { del.disabled = false; del.textContent = 'No s\'ha pogut esborrar'; }
      });
    });
  }
  function showError(t) {
    showCapa(`<p class="cella">Editor</p><h2>No es pot obrir</h2><p>${esc(t)}</p><div class="botons-fitxa"><button type="button" class="boto-gran" id="eTanca">D'acord</button></div>`);
    $('#eTanca').addEventListener('click', closeCapa);
  }

  /* ---------- exportar i importar ---------- */
  function b64url(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(t) {
    const s = atob(t.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  async function pipe(bytes, stream) {
    const w = stream.writable.getWriter();
    w.write(bytes); w.close();
    return new Uint8Array(await new Response(stream.readable).arrayBuffer());
  }
  async function exportCode() {
    const body = serialize();
    delete body.updated;
    const bytes = new TextEncoder().encode(JSON.stringify(body));
    if (window.CompressionStream) {
      try { return 'CATLEM1z.' + b64url(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch (e) { /* sense compressió */ }
    }
    return 'CATLEM1j.' + b64url(bytes);
  }
  async function importCode(text) {
    const t = String(text).replace(/\s+/g, '');
    const m = /^CATLEM1([zj])\.([A-Za-z0-9_-]+)$/.exec(t);
    if (!m) throw new Error('Això no sembla un codi de nivell de Catalemmings.');
    let bytes = unb64url(m[2]);
    if (m[1] === 'z') {
      if (!window.DecompressionStream) throw new Error('Aquest navegador no pot llegir codis comprimits.');
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    }
    const d = JSON.parse(new TextDecoder().decode(bytes));
    return { data: normalize(d), mask: decodeMask(d.terreny) };
  }
  async function exportDialog() {
    ed.data = normalize(ed.data);
    showCapa(`<p class="cella">Exporta</p><h2>Codi del nivell</h2>
      <p>Copia aquest codi i comparteix-lo. Qui el tingui el pot obrir amb «Importa codi» a l'editor.</p>
      <textarea class="codi" id="xCodi" readonly>Generant…</textarea>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran" id="xCopia">Copia el codi</button>
        <button type="button" class="boto-gran secundari" id="xTanca">Tanca</button>
      </div>`);
    const ta = $('#xCodi');
    ta.value = await exportCode();
    $('#xTanca').addEventListener('click', closeCapa);
    $('#xCopia').addEventListener('click', () => {
      const b = $('#xCopia');
      const fallback = () => { ta.focus(); ta.select(); b.textContent = 'Seleccionat: copia\'l amb el teclat'; };
      try {
        navigator.clipboard.writeText(ta.value).then(() => { b.textContent = 'Copiat'; }, fallback);
      } catch (e) { fallback(); }
    });
  }
  // el nivell escrit com una entrada de l'array LEVELS de levels.js
  function levelsJsSnippet() {
    const d = normalize(ed.data);
    const J = v => JSON.stringify(v);
    const obj = o => '{ ' + Object.keys(o).map(k => `${k}: ${J(o[k])}`).join(', ') + ' }';
    const skills = {};
    for (const s of E.SKILLS) if (d.skills[s]) skills[s] = d.skills[s];
    let out = '    {\n';
    out += `      nom: ${J(d.nom)},\n`;
    out += `      tema: ${J(d.tema)},\n`;
    out += `      text: ${J(d.text)},\n`;
    out += `      total: ${d.total}, needed: ${d.needed}, rate: ${d.rate}, time: ${d.time},\n`;
    out += `      skills: ${obj(skills)},\n`;
    out += `      entrance: ${obj(d.entrance)},\n`;
    out += `      exit: ${obj(d.exit)},\n`;
    for (const k of ['police', 'politicians', 'tribunals', 'speakers', 'shooters', 'kings']) {
      if (!d[k].length) continue;
      out += `      ${k}: [\n` + d[k].map(o => '        ' + obj(o)).join(',\n') + '\n      ],\n';
    }
    out += `      terreny: ${J(encodeMask(ed.mask))}\n`;
    out += '    }';
    return out;
  }
  function levelsJsDialog() {
    showCapa(`<p class="cella">levels.js</p><h2>Afegeix-lo als nivells del joc</h2>
      <p>Aquest bloc és el nivell escrit com una entrada de la llista <b>LEVELS</b> de <b>levels.js</b>. Obre el fitxer, posa una coma després de l'últim nivell (just abans de <b>];</b>) i enganxa-hi el bloc. Sortirà al menú com un nivell més, després dels que ja hi ha.</p>
      <textarea class="codi" id="jsCodi" readonly></textarea>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran" id="jsCopia">Copia el bloc</button>
        <button type="button" class="boto-gran secundari" id="jsTanca">Tanca</button>
      </div>`, true);
    const ta = $('#jsCodi');
    ta.value = levelsJsSnippet();
    $('#jsTanca').addEventListener('click', closeCapa);
    $('#jsCopia').addEventListener('click', () => {
      const b = $('#jsCopia');
      const fallback = () => { ta.focus(); ta.select(); b.textContent = 'Seleccionat: copia\'l amb el teclat'; };
      try { navigator.clipboard.writeText(ta.value).then(() => { b.textContent = 'Copiat'; }, fallback); }
      catch (e) { fallback(); }
    });
  }

  function importDialog() {
    if (A.mode() !== 'editor') open(true);
    showCapa(`<p class="cella">Importa</p><h2>Obre un nivell des d'un codi</h2>
      <p>Enganxa el codi que comença per <b>CATLEM1</b>. S'obrirà com un nivell nou sense desar.</p>
      <textarea class="codi" id="iCodi" placeholder="CATLEM1z…"></textarea>
      <p id="iError" class="avisos" style="list-style:none;padding:0"></p>
      <div class="botons-fitxa">
        <button type="button" class="boto-gran" id="iObre">Obre el nivell</button>
        <button type="button" class="boto-gran secundari" id="iTanca">Cancel·la</button>
      </div>`);
    $('#iTanca').addEventListener('click', closeCapa);
    $('#iObre').addEventListener('click', async () => {
      try {
        const { data, mask } = await importCode($('#iCodi').value);
        closeCapa();
        loadInto(data, mask, null);
        ed.dirty = true; markDirty();
        setMsg('Nivell importat. Desa\'l per tenir-lo a «Els meus nivells».');
      } catch (e) {
        $('#iError').textContent = e && e.message && !/JSON|terreny/.test(e.message) ? e.message : 'El codi no és vàlid o està incomplet. Comprova que l\'has copiat sencer.';
      }
    });
    $('#iCodi').focus();
  }

  /* =========================================================
     Obrir l'editor
     ========================================================= */
  function open(silent) {
    store.init();
    if (!ed.data) {
      if (!restoreDraft()) { const d = defaultLevel('pla'); ed.data = d.data; ed.mask = d.mask; ed.dirty = false; }
    }
    if (A.mode() !== 'editor' || !silent) {
      closeCapa();
      refresh(false);
      renderAll();
    }
    if (!silent) setMsg('Pinta el terreny, col·loca la casa, l\'estelada i els obstacles, i prova el nivell.');
  }

  window.CatEditor = { open: () => open(false), openList, encodeMask, decodeMask, toPlayable, normalize, exportCode, importCode, levelsJsSnippet };
})();
