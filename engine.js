/* Catalemmings — motor del joc.
   No toca el DOM: es pot executar al navegador i a Node (per a proves). */
(function (root) {
  'use strict';

  const W = 640, H = 320;
  const T = { EMPTY: 0, EARTH: 1, STEEL: 2, BRICK: 3, WALL: 4, STONE: 5 };
  const CAT_H = 10;          // alçada d'un catalemming (píxels lògics)
  const STEP_UP = 6;         // graó màxim que pugen caminant
  const STEP_DOWN = 3;       // baixada màxima sense començar a caure
  const SAFE_FALL = 56;      // caiguda màxima sense enfadar-se
  const FALL_SPEED = 3;
  const CASTELL_H = 40;      // quatre pisos de deu píxels
  const CASS_RADIUS = 120;   // abast de la cassolada
  const TPS = 25;            // tics per segon

  const SKILLS = ['calcots', 'saltar', 'blocar', 'pont', 'mur', 'castell', 'picar', 'cavar', 'cassolada', 'pastis'];
  const MUR_H = 14;
  const SLOGANS = { casa: 'Torneu a casa!', estructures: 'Estructures d\'estat!' };
  const SKILL_STATE = { saltar: 'jump', blocar: 'block', pont: 'build', mur: 'wall', castell: 'castell', picar: 'bash', cavar: 'dig', cassolada: 'cass', pastis: 'throw' };
  const ALIVE = new Set(['walk', 'fall', 'jump', 'climb', 'build', 'wall', 'bash', 'dig', 'cass', 'throw', 'shrug', 'block', 'castell']);
  const MOVING = new Set(['walk', 'fall', 'jump', 'climb', 'build', 'wall', 'bash', 'dig', 'cass', 'throw', 'shrug']);
  const REASONS = { fall: 'Patacada!', police: 'Detingut!', court: 'Condemnat!', abyss: 'Adéu!', nuke: 'Prou!', casa: 'Me\'n torno a casa…', hospital: 'A l\'hospital!' };

  /* ---------- API per construir el terreny dels nivells ---------- */
  function buildApi(m) {
    function set(x, y, t) { if (x >= 0 && x < W && y >= 0 && y < H) m[y * W + x] = t; }
    return {
      W, H, T,
      rect(x, y, w, h, t = T.EARTH) {
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, t);
      },
      clear(x, y, w, h) { this.rect(x, y, w, h, T.EMPTY); },
      ellipse(cx, cy, rx, ry, t = T.EARTH) {
        for (let j = Math.floor(cy - ry); j <= cy + ry; j++)
          for (let i = Math.floor(cx - rx); i <= cx + rx; i++) {
            const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
            if (dx * dx + dy * dy <= 1) set(i, j, t);
          }
      },
      poly(pts, t = T.EARTH) {
        let x0 = W, x1 = 0, y0 = H, y1 = 0;
        for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        for (let j = Math.floor(y0); j <= y1; j++)
          for (let i = Math.floor(x0); i <= x1; i++) {
            const px = i + 0.5, py = j + 0.5;
            let inside = false;
            for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
              const [xa, ya] = pts[a], [xb, yb] = pts[b];
              if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) inside = !inside;
            }
            if (inside) set(i, j, t);
          }
      },
      get(x, y) { return (x < 0 || x >= W || y < 0 || y >= H) ? 0 : m[y * W + x]; },
      load(arr) { m.set(arr); }
    };
  }

  /* ---------- terreny en text (format de l'editor) ----------
     Tirades «tipus + llargada en base 36 + punt», fila a fila. */
  function decodeMask(s) {
    const m = new Uint8Array(W * H);
    let i = 0;
    for (const part of String(s).split('.')) {
      if (!part) continue;
      const t = +part[0], n = parseInt(part.slice(1), 36);
      if (!(t >= 0 && t <= 5) || !(n > 0)) throw new Error('terreny');
      if (t) m.fill(t, i, Math.min(i + n, m.length));
      i += n;
    }
    if (i !== W * H) throw new Error('terreny');
    return m;
  }

  /* ---------- Partida ---------- */
  function Game(level) {
    this.L = level;
    this.terrain = new Uint8Array(W * H);
    // un nivell defineix el terreny amb una funció build(a) o amb el text «terreny» de l'editor
    if (typeof level.build === 'function') level.build(buildApi(this.terrain));
    else if (level.terreny) this.terrain.set(decodeMask(level.terreny));
    this.changed = [];
    this.cats = [];
    this.nextId = 1;
    this.skills = {};
    for (const s of SKILLS) this.skills[s] = (level.skills && level.skills[s]) || 0;
    this.total = level.total;
    this.needed = level.needed;
    this.released = 0; this.saved = 0; this.lost = 0;
    this.rateMin = level.rate; this.rate = level.rate;
    this.tick = 0;
    this.timeLeft = level.time * TPS;
    this.releaseTimer = this.interval() - 30;
    this.entrance = level.entrance;
    this.exit = level.exit;
    this.police = [];
    for (const g of (level.police || [])) {
      for (let i = 0; i < g.n; i++) {
        const x0 = g.x0 + i * 9, x1 = g.x1 + i * 9;
        this.police.push({ x0, x1, fx: x0, x: x0, y: g.y, dir: 1, speed: g.speed, state: 'patrol', face: g.face || -1, t: 0, grab: 0 });
      }
    }
    this.tribunals = (level.tribunals || []).map(t => Object.assign({ phase: 0 }, t));
    this.politicians = (level.politicians || []).map(p => Object.assign({ phase: 0, state: 'active', t: 0, wasOn: false }, p));
    // polítics a peu de carrer: «Torneu a casa!» i «Estructures d'estat!»
    this.speakers = (level.speakers || []).map(sp => ({
      kind: sp.kind, x0: sp.x0, x1: sp.x1 !== undefined ? sp.x1 : sp.x0, fx: sp.x0, x: sp.x0, y: sp.y,
      dir: 1, speed: sp.speed || 0, state: 'active', t: 0, talk: 20
    }));
    // antiavalots amb escopeta de pilotes de goma
    this.shooters = (level.shooters || []).map(sh => ({
      x: sh.x, y: sh.y, face: sh.face || -1, range: sh.range || 200, aimFirst: sh.aimFirst || 90,
      period: sh.period || 30, state: 'idle', t: 0, shots: 0, flash: 0
    }));
    this.balls = [];
    // rei assegut a la trona, dalt d'un pedestal que fa de paret
    this.kings = (level.kings || []).map(k => ({
      x: k.x, y: k.y, w: k.w || 18, h: k.h || 34, state: 'throne', t: 0, fy: 0, vy: 0, talk: 40
    }));
    this.pies = [];
    this.puffs = [];
    this.castells = []; this.blockers = [];
    this.texts = []; this.events = [];
    this.nuking = false;
    this.over = false; this.result = null;
  }

  Game.prototype = {
    interval() { return Math.round(8 + (99 - this.rate) * 0.55); },
    setRate(v) { this.rate = Math.max(this.rateMin, Math.min(99, v)); },
    terr(x, y) {
      x |= 0; y |= 0;
      if (x < 0 || x >= W) return T.STEEL;
      if (y < 0 || y >= H) return T.EMPTY;
      return this.terrain[y * W + x];
    },
    setT(x, y, t) {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const i = y * W + x;
      if (this.terrain[i] === t) return;
      this.terrain[i] = t;
      this.changed.push(i);
    },
    // el pedestal del rei, mentre el rei hi segui
    kingAt(x, y) {
      for (const k of this.kings) {
        if (k.state === 'throne' && Math.abs(x - k.x) <= (k.w >> 1) && y <= k.y && y > k.y - k.h) return k;
      }
      return null;
    },
    castellAt(x, y) {
      for (const k of this.castells) if (Math.abs(x - k.x) <= 4 && y <= k.y && y > k.y - k.h) return k;
      return null;
    },
    solid(x, y) {
      x |= 0; y |= 0;
      if (x < 0 || x >= W) return true;
      if (y < 0 || y >= H) return false;
      if (this.terrain[y * W + x]) return true;
      return !!this.castellAt(x, y) || !!this.kingAt(x, y);
    },
    say(x, y, txt, kind) { if (txt) this.texts.push({ x, y, txt, kind: kind || 'info', t: 0 }); },

    barrierOn(p) { return p.state === 'active' && ((this.tick + p.phase) % (p.on + p.off)) < p.on; },
    blockedByBarrier(c, nx) {
      for (const p of this.politicians) {
        if (!this.barrierOn(p)) continue;
        const inside = x => x >= p.bx && x < p.bx + p.bw;
        if (inside(nx) && !inside(c.x) && c.y >= p.by0 && c.y <= p.by1 + 1) return true;
      }
      return false;
    },
    blockedByBlocker(c, nx) {
      for (const b of this.blockers) {
        if (b === c) continue;
        if (Math.abs(c.y - b.y) > 8) continue;
        if ((b.x - c.x) * c.dir > 0 && Math.abs(nx - b.x) <= 4) return true;
      }
      return false;
    },
    slamPhase(tr) { return (this.tick + tr.phase) % tr.period; },
    isSlamming(tr) { return this.slamPhase(tr) >= tr.period - tr.slam; },

    spawn() {
      const e = this.entrance;
      this.cats.push({ id: this.nextId++, x: e.x, y: e.y, dir: e.dir || 1, state: 'fall', fall: 0, t: 0, floater: false, frame: 0 });
      this.released++;
    },

    /* ---------- un tic de simulació ---------- */
    step() {
      if (this.over) return;
      this.tick++;
      this.timeLeft--;

      if (!this.nuking && this.released < this.total) {
        this.releaseTimer++;
        if (this.releaseTimer >= this.interval()) { this.releaseTimer = 0; this.spawn(); }
      }

      this.updateHazards();
      this.castells = this.cats.filter(c => c.state === 'castell');
      this.blockers = this.cats.filter(c => c.state === 'block');

      for (const c of this.cats) {
        this.updateCat(c);
        if (MOVING.has(c.state) && this.inExit(c)) {
          c.state = 'exit'; c.t = 0; this.saved++;
          this.events.push('saved');
          this.say(this.exit.x, this.exit.y - 24, 'Lliure!', 'good');
        }
      }
      this.checkHazards();

      if (this.nuking && this.tick % 3 === 0) {
        const c = this.cats.find(c => ALIVE.has(c.state));
        if (c) this.lose(c, 'nuke');
      }

      this.cats = this.cats.filter(c => c.state !== 'gone');
      for (const t of this.texts) t.t++;
      this.texts = this.texts.filter(t => t.t < 50);

      const busy = this.cats.some(c => MOVING.has(c.state) || c.state === 'exit' || c.state === 'angry');
      const allOut = this.released >= this.total || this.nuking;
      if (this.timeLeft <= 0 || (allOut && !busy)) {
        this.over = true;
        this.result = {
          saved: this.saved, needed: this.needed, total: this.total,
          success: this.saved >= this.needed, timeout: this.timeLeft <= 0
        };
      }
    },

    updateHazards() {
      for (const p of this.police) {
        if (p.state === 'patrol') {
          p.fx += p.dir * p.speed;
          if (p.fx >= p.x1) { p.fx = p.x1; p.dir = -1; }
          else if (p.fx <= p.x0) { p.fx = p.x0; p.dir = 1; }
          p.x = Math.round(p.fx);
          if (p.grab > 0) p.grab--;
        } else if (p.state === 'flee') {
          p.t++; p.fx += p.fdir * 2.2; p.x = Math.round(p.fx);
          if (p.t >= 45) p.state = 'gone';
        }
      }
      this.police = this.police.filter(p => p.state !== 'gone');

      for (const p of this.politicians) {
        if (p.state === 'flee') { p.t++; if (p.t >= 40) p.state = 'gone'; continue; }
        if (p.state !== 'active') continue;
        const on = this.barrierOn(p);
        if (on && !p.wasOn) { this.say(p.x, p.y - 30, p.lema || 'LLEI!', 'bad'); this.events.push('law'); }
        p.wasOn = on;
      }
      for (const tr of this.tribunals) {
        if (this.slamPhase(tr) === tr.period - tr.slam) this.events.push('slam');
      }

      for (const sp of this.speakers) {
        if (sp.state === 'flee') {
          sp.t++; sp.fx += sp.fdir * 1.8; sp.x = Math.round(sp.fx);
          if (sp.t >= 45) sp.state = 'gone';
          continue;
        }
        if (sp.speed) {
          sp.fx += sp.dir * sp.speed;
          if (sp.fx >= sp.x1) { sp.fx = sp.x1; sp.dir = -1; }
          else if (sp.fx <= sp.x0) { sp.fx = sp.x0; sp.dir = 1; }
          sp.x = Math.round(sp.fx);
        }
        if (sp.talk > 0) sp.talk--;
        const near = this.cats.some(c => ALIVE.has(c.state) && Math.abs(c.x - sp.x) < 150 && Math.abs(c.y - sp.y) < 40);
        if (near && sp.talk === 0) { sp.talk = 120; this.say(sp.x, sp.y - 20, SLOGANS[sp.kind], 'bad'); }
      }
      this.speakers = this.speakers.filter(sp => sp.state !== 'gone');

      for (const sh of this.shooters) this.updateShooter(sh);
      this.updateKings();
      this.updatePies();
      this.updateBalls();
      for (const p of this.puffs) p.t++;
      this.puffs = this.puffs.filter(p => p.t < 12);
    },

    updateShooter(sh) {
      if (sh.flash > 0) sh.flash--;
      const target = this.cats.some(c => ALIVE.has(c.state) && c.state !== 'castell' &&
        (c.x - sh.x) * sh.face > 6 && Math.abs(c.x - sh.x) <= sh.range && Math.abs(c.y - sh.y) <= 10);
      if (!target) { sh.state = 'idle'; sh.t = 0; return; }
      if (sh.state === 'idle') { sh.state = 'aim'; sh.t = 0; }
      sh.t++;
      const need = sh.shots === 0 ? sh.aimFirst : sh.period;
      if (sh.t >= need) {
        this.balls.push({ x: sh.x + sh.face * 7, y: sh.y - 6, dir: sh.face, d: 0 });
        sh.shots++; sh.flash = 4; sh.t = 0;
        this.events.push('shot');
      }
    },

    updateBalls() {
      for (const b of this.balls) {
        for (let i = 0; i < 4 && !b.dead; i++) {
          b.x += b.dir; b.d++;
          if (b.x < 0 || b.x >= W || b.d > 420) { b.dead = true; break; }
          if (this.solid(b.x, b.y)) {
            b.dead = true;
            this.puffs.push({ x: b.x - b.dir, y: b.y, t: 0 });
            this.events.push('ploc');
            break;
          }
          for (const c of this.cats) {
            if (!ALIVE.has(c.state) || c.state === 'castell') continue;
            if (Math.abs(c.x - b.x) <= 2 && b.y <= c.y && b.y >= c.y - CAT_H + 1) {
              this.lose(c, 'hospital');
              b.dead = true;
              break;
            }
          }
        }
      }
      this.balls = this.balls.filter(b => !b.dead);
    },

    // el polític de les estructures fa girar la colla, tret de qui fa olor de calçot
    blockedBySpeaker(c, nx) {
      for (const sp of this.speakers) {
        if (sp.kind !== 'estructures' || sp.state !== 'active') continue;
        if (Math.abs(c.y - sp.y) > 8) continue;
        if ((sp.x - c.x) * c.dir > 0 && Math.abs(nx - sp.x) <= 4) {
          if (c.floater) {
            sp.state = 'flee'; sp.t = 0; sp.fdir = c.dir;
            this.say(sp.x, sp.y - 20, 'Quina flaire de calçot!', 'good');
            this.events.push('fugida');
            return false;
          }
          return true;
        }
      }
      return false;
    },

    checkHazards() {
      for (const c of this.cats) {
        if (!ALIVE.has(c.state)) continue;
        for (const p of this.police) {
          if (p.state !== 'patrol') continue;
          if (Math.abs(c.x - p.x) <= 5 && c.y >= p.y - 11 && c.y - CAT_H + 1 <= p.y) {
            p.grab = 14;
            this.lose(c, 'police');
            break;
          }
        }
        if (!ALIVE.has(c.state)) continue;
        for (const sp of this.speakers) {
          if (sp.kind !== 'casa' || sp.state !== 'active') continue;
          if (Math.abs(c.x - sp.x) <= 4 && c.y >= sp.y - 12 && c.y - CAT_H + 1 <= sp.y) {
            this.lose(c, 'casa');
            break;
          }
        }
        if (!ALIVE.has(c.state)) continue;
        for (const tr of this.tribunals) {
          if (this.isSlamming(tr) && c.x >= tr.x0 && c.x <= tr.x1 && c.y >= tr.y - 14 && c.y <= tr.y + 2) {
            this.lose(c, 'court');
            break;
          }
        }
      }
    },

    inExit(c) {
      const e = this.exit;
      return Math.abs(c.x - e.x) <= 4 && c.y >= e.y - 12 && c.y <= e.y + 1;
    },

    lose(c, reason) {
      if (!ALIVE.has(c.state)) return;
      this.lost++;
      this.events.push(reason === 'police' ? 'police' : 'angry');
      if (reason === 'abyss') { c.state = 'gone'; this.say(c.x, H - 8, REASONS.abyss, 'bad'); return; }
      c.state = 'angry'; c.reason = reason; c.t = 0;
      if (reason === 'casa') c.dir = -c.dir;
      this.say(c.x, c.y - 16, REASONS[reason], 'bad');
    },

    updateCat(c) {
      c.frame++;
      switch (c.state) {
        case 'fall': return this.doFall(c);
        case 'walk': return this.doWalk(c);
        case 'jump': return this.doJump(c);
        case 'climb': return this.doClimb(c);
        case 'build': return this.doBuild(c);
        case 'bash': return this.doBash(c);
        case 'dig': return this.doDig(c);
        case 'cass': return this.doCass(c);
        case 'castell': return this.doCastell(c);
        case 'block':
          if (!this.solid(c.x, c.y + 1)) { c.state = 'fall'; c.fall = 0; }
          return;
        case 'shrug':
          if (!this.solid(c.x, c.y + 1)) { c.state = 'fall'; c.fall = 0; return; }
          if (++c.t >= 12) c.state = 'walk';
          return;
        case 'exit': if (++c.t >= 24) c.state = 'gone'; return;
        case 'angry':
          c.t++;
          if (c.reason === 'casa' && c.t % 3 === 0) c.x += c.dir;
          if (c.t >= 60) c.state = 'gone';
          return;
        case 'wall': return this.doWall(c);
        case 'throw': return this.doThrow(c);
      }
    },

    startFall(c) { c.state = 'fall'; c.fall = 0; },

    doWalk(c) {
      if (!this.solid(c.x, c.y + 1)) {
        let d = 1;
        while (d <= STEP_DOWN && !this.solid(c.x, c.y + 1 + d)) d++;
        if (d > STEP_DOWN) return this.startFall(c);
        c.y += d; return;
      }
      const nx = c.x + c.dir;
      if (this.blockedByBlocker(c, nx) || this.blockedByBarrier(c, nx) || this.blockedBySpeaker(c, nx)) { c.dir = -c.dir; return; }
      const k = this.castellAt(nx, c.y);
      if (k && c.y - (k.y - k.h) > STEP_UP) { c.state = 'climb'; c.t = 0; return; }
      if (this.solid(nx, c.y)) {
        let up = 0;
        for (let h = 1; h <= STEP_UP; h++) if (!this.solid(nx, c.y - h)) { up = h; break; }
        if (!up || this.solid(nx, c.y - up - CAT_H + 1)) { c.dir = -c.dir; return; }
        c.x = nx; c.y -= up; return;
      }
      c.x = nx;
      let d = 0;
      while (d <= STEP_DOWN && !this.solid(c.x, c.y + 1 + d)) d++;
      if (d > STEP_DOWN) return this.startFall(c);
      c.y += d;
    },

    doFall(c) {
      const sp = (c.floater && c.fall > 14) ? 1 : FALL_SPEED;
      for (let i = 0; i < sp; i++) {
        if (this.solid(c.x, c.y + 1)) return this.land(c);
        c.y++; c.fall++;
        if (c.y >= H + CAT_H) return this.lose(c, 'abyss');
      }
      if (this.solid(c.x, c.y + 1)) this.land(c);
    },
    land(c) {
      if (c.fall > SAFE_FALL && !c.floater) return this.lose(c, 'fall');
      c.state = 'walk'; c.fall = 0;
    },

    doJump(c) {
      c.vy = Math.min(c.vy + 0.35, FALL_SPEED);
      if (!c.hblock) {
        for (let i = 0; i < 2; i++) {
          const nx = c.x + c.dir;
          if (this.solid(nx, c.y) || this.solid(nx, c.y - CAT_H + 1) || this.blockedByBarrier(c, nx)) { c.hblock = true; break; }
          c.x = nx;
        }
      }
      c.fy += c.vy;
      const ty = Math.round(c.fy);
      while (c.y > ty) {
        if (this.solid(c.x, c.y - CAT_H)) { c.fy = c.y; c.vy = 0; break; }
        c.y--;
      }
      while (c.y < ty) {
        if (this.solid(c.x, c.y + 1)) break;
        c.y++;
        if (c.y >= H + CAT_H) return this.lose(c, 'abyss');
      }
      c.peak = Math.min(c.peak, c.y);
      if (c.vy > 0 && this.solid(c.x, c.y + 1)) {
        if (c.y - c.peak > SAFE_FALL && !c.floater) return this.lose(c, 'fall');
        c.state = 'walk'; c.fall = 0; return;
      }
      if (c.floater && c.y - c.peak > 30) { c.state = 'fall'; c.fall = 15; }
    },

    doClimb(c) {
      if (this.solid(c.x, c.y - CAT_H)) { c.dir = -c.dir; return this.startFall(c); }
      c.y--;
      if (!this.solid(c.x + c.dir, c.y)) { c.x += c.dir; c.state = 'walk'; }
    },

    doBuild(c) {
      if (!this.solid(c.x, c.y + 1)) return this.startFall(c);
      c.t++;
      if (c.t < 4 || (c.t - 4) % 8 !== 0) return;
      for (let i = 0; i < 6; i++) {
        const bx = c.x + c.dir * i;
        if (this.terr(bx, c.y) === T.EMPTY && !this.castellAt(bx, c.y)) this.setT(bx, c.y, T.BRICK);
      }
      c.bricks++;
      this.events.push('brick');
      c.y -= 1;
      for (let k = 0; k < 2; k++) {
        const nx = c.x + c.dir;
        if (this.solid(nx, c.y) || this.solid(nx, c.y - CAT_H + 1)) { c.state = 'walk'; c.dir = -c.dir; return; }
        c.x = nx;
      }
      if (c.bricks >= 12) { c.state = 'shrug'; c.t = 0; }
    },

    doBash(c) {
      if (!this.solid(c.x, c.y + 1)) return this.startFall(c);
      c.t++;
      let ahead = false;
      for (let d = 1; d <= 8 && !ahead; d++)
        for (let r = c.y - CAT_H + 1; r <= c.y - 1; r++)
          if (this.terr(c.x + c.dir * d, r) !== T.EMPTY || this.kingAt(c.x + c.dir * d, r)) { ahead = true; break; }
      if (!ahead) {
        // encara no ha començat: camina amb el pic a punt fins trobar paret
        if (!c.dug) {
          this.doWalk(c);
          if (c.state === 'walk') c.state = 'bash';
          return;
        }
        c.state = 'walk'; return;
      }
      if (c.t % 2) return;
      c.dug = (c.dug || 0) + 1;
      for (let d = 1; d <= 3; d++)
        for (let r = c.y - CAT_H + 1; r <= c.y; r++)
          if (this.terr(c.x + c.dir * d, r) === T.STEEL || this.kingAt(c.x + c.dir * d, r)) {
            c.state = 'walk'; c.dir = -c.dir;
            this.say(c.x, c.y - 16, 'Clanc!', 'info');
            return;
          }
      for (let d = 1; d <= 3; d++)
        for (let r = c.y - CAT_H + 1; r <= c.y; r++) this.setT(c.x + c.dir * d, r, T.EMPTY);
      c.x += c.dir;
    },

    doDig(c) {
      c.t++;
      if (c.t % 4) return;
      for (let dx = -1; dx <= 1; dx++)
        if (this.terr(c.x + dx, c.y + 1) === T.STEEL) {
          c.state = 'walk';
          this.say(c.x, c.y - 16, 'Clanc!', 'info');
          return;
        }
      let any = false;
      for (let dx = -4; dx <= 4; dx++) {
        const t = this.terr(c.x + dx, c.y + 1);
        if (t !== T.EMPTY && t !== T.STEEL) { this.setT(c.x + dx, c.y + 1, T.EMPTY); any = true; }
      }
      if (!any) return this.startFall(c);
      c.y++;
    },

    // marge de pedra seca: s'aixeca filera a filera davant del catalemming
    doWall(c) {
      if (!this.solid(c.x, c.y + 1)) return this.startFall(c);
      c.t++;
      if (c.t % 2) return;
      if (c.rows === 0) {
        for (const o of this.cats) {
          if (o === c || !MOVING.has(o.state)) continue;
          const rel = (o.x - c.x) * c.dir;
          if (rel >= 1 && rel <= 8 && Math.abs(o.y - c.y) <= 4) o.x = c.x;
        }
      }
      const yy = c.y - c.rows;
      for (let i = 2; i <= 7; i++) {
        const xx = c.x + c.dir * i;
        if (this.terr(xx, yy) === T.EMPTY) this.setT(xx, yy, T.STONE);
      }
      c.rows++;
      if (c.rows % 3 === 0) this.events.push('stone');
      if (c.rows >= MUR_H) { c.state = 'walk'; c.dir = -c.dir; }
    },

    // llança un pastís de nata: si hi ha un rei a davant, apunta a la cara
    doThrow(c) {
      if (!this.solid(c.x, c.y + 1)) return this.startFall(c);
      c.t++;
      if (c.t === 7 && !c.thrown) {
        c.thrown = true;
        const hx = c.x + c.dir * 3, hy = c.y - 8, g = 0.3;
        let target = null;
        for (const k of this.kings) {
          if (k.state !== 'throne') continue;
          const dx = (k.x - c.x) * c.dir;
          if (dx > 0 && dx <= 240 && (!target || dx < (target.x - c.x) * c.dir)) target = k;
        }
        let vx, vy;
        if (target) {
          const tx = target.x - c.dir, ty = target.y - target.h - 8;
          const T = Math.max(10, Math.min(40, Math.abs(tx - hx) / 3.2));
          vx = (tx - hx) / T;
          vy = (ty - hy - 0.5 * g * T * T) / T;
        } else { vx = c.dir * 2.6; vy = -3.4; }
        this.pies.push({ x: hx, y: hy, vx, vy, dir: c.dir, t: 0 });
        this.events.push('llanca');
      }
      if (c.t >= 16) c.state = 'walk';
    },

    updatePies() {
      for (const p of this.pies) {
        for (let s = 0; s < 4 && !p.dead; s++) {
          p.vy += 0.3 / 4;
          p.x += p.vx / 4; p.y += p.vy / 4;
          const px = Math.round(p.x), py = Math.round(p.y);
          for (const k of this.kings) {
            if (k.state !== 'throne') continue;
            const fy = k.y - k.h - 8;
            if (Math.abs(px - k.x) <= 4 && py >= fy - 6 && py <= fy + 5) { this.hitKing(k); p.dead = true; break; }
          }
          if (p.dead) break;
          if (px < 0 || px >= W || py >= H) { p.dead = true; break; }
          if (py >= 0 && (this.terr(px, py) !== T.EMPTY || this.castellAt(px, py))) {
            p.dead = true;
            this.puffs.push({ x: px, y: py - 1, t: 0, cream: true });
            this.say(px, py - 8, 'Plof!', 'info');
            this.events.push('ploc');
          }
        }
      }
      this.pies = this.pies.filter(p => !p.dead);
    },

    hitKing(k) {
      k.state = 'falling'; k.t = 0; k.fy = k.y - k.h; k.vy = -1.5;
      this.say(k.x, k.y - k.h - 26, 'Plaf!', 'good');
      this.events.push('pastis');
      for (let i = 0; i < 4; i++) this.puffs.push({ x: k.x - 6 + i * 4, y: k.y - Math.round(k.h / 2), t: -i, cream: false });
    },

    updateKings() {
      for (const k of this.kings) {
        if (k.state === 'throne') {
          if (k.talk > 0) k.talk--;
          const near = this.cats.some(c => ALIVE.has(c.state) && Math.abs(c.x - k.x) < 140 && Math.abs(c.y - k.y) < 50);
          if (near && k.talk === 0) { k.talk = 160; this.say(k.x, k.y - k.h - 26, 'Bla, bla, bla…', 'bad'); }
        } else if (k.state === 'falling') {
          k.t++;
          k.vy = Math.min(k.vy + 0.35, 4);
          k.fy += k.vy;
          if (k.fy >= k.y) { k.fy = k.y; k.state = 'down'; k.t = 0; this.say(k.x, k.y - 20, 'Ai, la corona!', 'good'); this.events.push('corona'); }
        } else k.t++;
      }
    },

    doCass(c) {
      if (!this.solid(c.x, c.y + 1)) return this.startFall(c);
      c.t++;
      if (c.t === 8) { this.scare(c); this.events.push('cass'); }
      if (c.t >= 40) c.state = 'walk';
    },

    scare(c) {
      let n = 0;
      for (const p of this.police) {
        if (p.state === 'patrol' && Math.abs(p.x - c.x) <= CASS_RADIUS && Math.abs(p.y - c.y) <= 60) {
          p.state = 'flee'; p.t = 0; p.fdir = p.x >= c.x ? 1 : -1; n++;
        }
      }
      for (const p of this.politicians) {
        if (p.state === 'active' && Math.abs(p.x - c.x) <= CASS_RADIUS && Math.abs(p.y - c.y) <= 80) {
          p.state = 'flee'; p.t = 0; n++;
        }
      }
      for (const sp of this.speakers) {
        if (sp.kind === 'casa' && sp.state === 'active' && Math.abs(sp.x - c.x) <= CASS_RADIUS && Math.abs(sp.y - c.y) <= 60) {
          sp.state = 'flee'; sp.t = 0; sp.fdir = sp.x >= c.x ? 1 : -1; n++;
        }
      }
      this.say(c.x, c.y - 18, n ? 'Fora!' : 'Clinc!', n ? 'good' : 'info');
    },

    doCastell(c) {
      if (c.h >= CASTELL_H) return;
      c.h = Math.min(CASTELL_H, c.h + 2);
      for (const o of this.cats) {
        if (o === c || !MOVING.has(o.state)) continue;
        if (Math.abs(o.x - c.x) <= 4 && o.y <= c.y && o.y > c.y - c.h) o.y = c.y - c.h;
      }
      if (c.h === CASTELL_H) {
        this.say(c.x, c.y - CASTELL_H - 10, 'Carregat!', 'good');
        this.events.push('castell');
      }
    },

    /* ---------- habilitats ---------- */
    canAssign(c, s) {
      if (!c) return false;
      if (s === 'blocar' && c.state === 'block') return true; // alliberar-lo és gratis
      if ((this.skills[s] || 0) <= 0) return false;
      if (s === 'calcots') return !c.floater && ALIVE.has(c.state) && c.state !== 'castell';
      if (!['walk', 'build', 'bash', 'dig', 'shrug'].includes(c.state)) return false;
      if (c.state === SKILL_STATE[s] && !(s === 'pont' && c.bricks >= 9)) return false;
      if (!this.solid(c.x, c.y + 1)) return false;
      if (s === 'blocar' || s === 'castell') {
        for (const b of this.cats) {
          if (b === c || (b.state !== 'block' && b.state !== 'castell')) continue;
          if (Math.abs(b.x - c.x) < 10 && Math.abs(b.y - c.y) < 12) return false;
        }
      }
      return true;
    },

    assign(c, s) {
      if (!this.canAssign(c, s)) return false;
      if (s === 'blocar' && c.state === 'block') { c.state = 'walk'; this.events.push('assign'); return true; }
      this.skills[s]--;
      this.events.push('assign');
      c.t = 0;
      switch (s) {
        case 'calcots': c.floater = true; break;
        case 'saltar': c.state = 'jump'; c.vy = -4.2; c.fy = c.y; c.peak = c.y; c.hblock = false; break;
        case 'blocar': c.state = 'block'; break;
        case 'pont': c.state = 'build'; c.bricks = 0; break;
        case 'castell': {
          // si hi ha una paret a prop, el castell s'aixeca arran d'ella
          for (let d = 1; d <= 20; d++) {
            const x = c.x + c.dir * d;
            if (!this.solid(x, c.y + 1)) break;
            const wall = yy => this.terr(x, yy) || this.kingAt(x, yy);
            if (wall(c.y) && wall(c.y - 7)) { if (d > 5) c.x += c.dir * (d - 5); break; }
          }
          c.state = 'castell'; c.h = 0;
          break;
        }
        case 'picar': c.state = 'bash'; c.dug = 0; break;
        case 'mur': c.state = 'wall'; c.rows = 0; break;
        case 'pastis': c.state = 'throw'; c.thrown = false; break;
        case 'cavar': c.state = 'dig'; break;
        case 'cassolada': c.state = 'cass'; break;
      }
      return true;
    },

    nuke() { if (!this.nuking) { this.nuking = true; this.events.push('nuke'); } },

    stats() {
      let inside = 0;
      for (const c of this.cats) if (ALIVE.has(c.state)) inside++;
      return { released: this.released, total: this.total, saved: this.saved, needed: this.needed, lost: this.lost, inside, time: Math.max(0, Math.ceil(this.timeLeft / TPS)) };
    }
  };

  const api = { Game, W, H, T, TPS, CAT_H, CASTELL_H, MUR_H, SKILLS, CASS_RADIUS, SAFE_FALL, decodeMask };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatEngine = api;
})(this);
