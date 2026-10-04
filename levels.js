/* Catalemmings — nivells.
   Coordenades en píxels lògics (640 × 320). y creix cap avall.
   La «y» de l'entrada i la sortida és la fila on el catalemming té els peus. */
(function (root) {
  'use strict';
  const T = { EMPTY: 0, EARTH: 1, STEEL: 2, BRICK: 3, WALL: 4, STONE: 5 };

  const LEVELS = [
    {
      nom: 'El barranc del Bruc',
      tema: 'muntanya',
      text: 'Un barranc talla el camí cap a l\'estelada. Planta un blocador perquè la colla no caigui, fes un pont des de la vora i, quan estigui acabat, torna a clicar el blocador amb «Blocar» per deixar-lo anar.',
      total: 10, needed: 7, rate: 30, time: 300,
      skills: { pont: 3, blocar: 2 },
      entrance: { x: 70, y: 178, dir: 1 },
      exit: { x: 570, y: 199 },
      build(a) {
        a.rect(0, 200, 290, 120);
        a.rect(312, 200, 328, 120);
        a.ellipse(160, 201, 48, 7);
        a.ellipse(450, 201, 40, 6);
      }
    },
    {
      nom: 'El mur',
      tema: 'muntanya',
      text: 'Un mur massa alt per pujar-hi. Pica\'l de cantó o aixeca-hi un castell al davant: la resta de la colla s\'hi enfilarà i el passarà per sobre.',
      total: 12, needed: 9, rate: 40, time: 300,
      skills: { picar: 2, castell: 2, blocar: 1 },
      entrance: { x: 60, y: 198, dir: 1 },
      exit: { x: 585, y: 219 },
      build(a) {
        a.rect(0, 220, 640, 100);
        a.rect(300, 180, 30, 40, T.WALL);
        a.ellipse(140, 221, 40, 6);
        a.ellipse(470, 221, 50, 5);
      }
    },
    {
      nom: 'Antiavalots a la plaça',
      tema: 'ciutat',
      text: 'Dues línies d\'antiavalots patrullen la plaça. Qui hi topa, el detenen i se\'n torna a casa enfadat. Una cassolada a prop els fa recular; o salta\'ls per sobre si vas fi.',
      total: 15, needed: 12, rate: 35, time: 300,
      skills: { cassolada: 2, saltar: 3, blocar: 2 },
      entrance: { x: 40, y: 208, dir: 1 },
      exit: { x: 605, y: 229 },
      police: [
        { x0: 300, x1: 370, y: 229, n: 4, speed: 0.4 },
        { x0: 470, x1: 520, y: 229, n: 3, speed: 0.6 }
      ],
      build(a) {
        a.rect(0, 230, 640, 90);
      }
    },
    {
      nom: 'Decret llei',
      tema: 'ciutat',
      text: 'Del terrat a baix hi ha massa alçada: amb la panxa plena de calçots planen tranquil·lament. A baix, un polític aixeca barreres a cop de llei. I després, un forat.',
      total: 12, needed: 9, rate: 20, time: 360,
      skills: { calcots: 12, pont: 2, blocar: 2, cassolada: 1 },
      entrance: { x: 40, y: 88, dir: 1 },
      exit: { x: 600, y: 249 },
      politicians: [
        { x: 405, y: 249, bx: 440, bw: 6, by0: 206, by1: 249, on: 110, off: 70, phase: 0, lema: 'LLEI!' }
      ],
      build(a) {
        a.rect(0, 110, 200, 210);
        a.rect(200, 250, 300, 70);
        a.rect(522, 250, 118, 70);
      }
    },
    {
      nom: 'El Tribunal',
      tema: 'institucions',
      text: 'La maça del tribunal no perdona ningú que passi per sota. El terra de marbre no es pot foradar, però la terra d\'abans, sí. Hi ha un soterrani…',
      total: 15, needed: 11, rate: 40, time: 360,
      skills: { cavar: 2, picar: 2, blocar: 2 },
      entrance: { x: 50, y: 168, dir: 1 },
      exit: { x: 605, y: 243 },
      tribunals: [
        { x0: 300, x1: 380, y: 189, period: 70, slam: 8, phase: 0 }
      ],
      build(a) {
        a.rect(0, 190, 560, 30);
        a.rect(0, 244, 640, 76);
        a.rect(285, 190, 110, 30, T.STEEL);
        a.rect(450, 220, 22, 24, T.WALL);
      }
    },
    {
      nom: 'La Diada',
      tema: 'muntanya',
      text: 'Tot el que has après en un sol recorregut: calçots per baixar, cassolada, un mur, una llei i un barranc. Fes servir bé cada habilitat, que no en sobren.',
      total: 15, needed: 10, rate: 25, time: 420,
      skills: { calcots: 15, cassolada: 1, saltar: 2, castell: 1, picar: 1, pont: 2, blocar: 2 },
      entrance: { x: 40, y: 98, dir: 1 },
      exit: { x: 600, y: 199 },
      police: [
        { x0: 200, x1: 250, y: 199, n: 3, speed: 0.5 }
      ],
      politicians: [
        { x: 395, y: 199, bx: 420, bw: 6, by0: 170, by1: 199, on: 100, off: 80, phase: 30, lema: 'DECRET!' }
      ],
      build(a) {
        a.rect(0, 120, 150, 200);
        a.rect(150, 200, 490, 120);
        a.clear(480, 200, 22, 120);
        a.rect(340, 160, 16, 40, T.WALL);
        a.ellipse(560, 201, 30, 5);
      }
    },
    {
      nom: 'Cap a les urnes',
      tema: 'nit',
      text: 'Les urnes són a l\'altra banda. Antiavalots a dalt, un mur, un tribunal i més antiavalots al soterrani. Vint catalemmings i cal que en passin catorze.',
      total: 20, needed: 14, rate: 45, time: 420,
      skills: { cassolada: 2, castell: 1, picar: 1, cavar: 1, blocar: 3, saltar: 1 },
      entrance: { x: 40, y: 188, dir: 1 },
      exit: { x: 605, y: 263 },
      police: [
        { x0: 130, x1: 180, y: 209, n: 3, speed: 0.5 },
        { x0: 440, x1: 500, y: 263, n: 2, speed: 0.6 }
      ],
      tribunals: [
        { x0: 330, x1: 400, y: 209, period: 66, slam: 8, phase: 20 }
      ],
      build(a) {
        a.rect(0, 210, 560, 30);
        a.rect(0, 264, 640, 56);
        a.rect(250, 166, 16, 44, T.WALL);
        a.rect(320, 210, 90, 30, T.STEEL);
      }
    },
    {
      nom: 'Torneu a casa!',
      tema: 'ciutat',
      text: 'Un polític es passeja pel carrer cridant «Torneu a casa!». Qui hi topa, abaixa el cap i se\'n torna. Una cassolada a prop el fa fugir.',
      total: 12, needed: 10, rate: 35, time: 300,
      skills: { cassolada: 1, blocar: 1, saltar: 2 },
      entrance: { x: 50, y: 198, dir: 1 },
      exit: { x: 600, y: 219 },
      speakers: [
        { kind: 'casa', x0: 300, x1: 380, y: 219, speed: 0.35 }
      ],
      build(a) {
        a.rect(0, 220, 640, 100);
      }
    },
    {
      nom: 'Estructures d\'estat',
      tema: 'institucions',
      text: 'Aquest polític només parla d\'estructures d\'estat i fa girar tothom que se li acosta. L\'olor de calçot, però, no la suporta: un catalemming ben atipat el fa fugir. Després hi ha un forat.',
      total: 12, needed: 9, rate: 35, time: 300,
      skills: { calcots: 2, pont: 2, blocar: 1 },
      entrance: { x: 50, y: 198, dir: 1 },
      exit: { x: 600, y: 219 },
      speakers: [
        { kind: 'estructures', x0: 250, x1: 290, y: 219, speed: 0.3 }
      ],
      build(a) {
        a.rect(0, 220, 400, 100);
        a.rect(422, 220, 218, 100);
      }
    },
    {
      nom: 'Pilotes de goma',
      tema: 'nit',
      text: 'Un antiavalots amb escopeta dispara pilotes de goma a qui té a tret, i qui en rep una acaba a l\'hospital. Tarda una mica a disparar la primera. Aixeca un mur de pedra per aturar la colla, cava fins al marbre i passa per sota terra.',
      total: 12, needed: 8, rate: 35, time: 360,
      skills: { mur: 2, cavar: 1, picar: 1 },
      entrance: { x: 50, y: 188, dir: 1 },
      exit: { x: 600, y: 249 },
      shooters: [
        { x: 430, y: 209, face: -1, range: 200, aimFirst: 90, period: 30 }
      ],
      build(a) {
        a.rect(0, 210, 520, 110);
        a.rect(520, 250, 120, 70);
        a.rect(140, 241, 380, 10, T.STEEL);
      }
    },
    {
      nom: "Tres d'octubre",
      tema: "nit",
      text: "Els polítics ens intenten enganyar, però aquesta vegada no els hi farem cas, ni han fet les estructures, ni tornarem a casa, menja calçots hi ha uns polítics que no els agrada, a uns altres no els agraden les cassolades, vigila les pilotes de goma.",
      total: 12, needed: 7, rate: 30, time: 300,
      skills: { calcots: 2, blocar: 2, pont: 2, mur: 2, picar: 2, cavar: 2, cassolada: 2 },
      entrance: { x: 53, y: 199, dir: 1 },
      exit: { x: 589, y: 283 },
      speakers: [
        { kind: "estructures", x0: 115, x1: 175, y: 211, speed: 0.3 },
        { kind: "casa", x0: 483, x1: 543, y: 273, speed: 0.35 }
      ],
      shooters: [
        { x: 388, y: 191, face: -1, range: 200, aimFirst: 90, period: 30 }
      ],
      kings: [
        { x: 370, y: 240, w: 18, h: 34 }
      ],
      terreny: "02j1i.16.0hh.1d.0hc.1g.0h9.1k.0h7.1m.0h4.1p.0h2.1q.0h0.1t.0gy.1u.03y.11v.0b4.1w.03x.11w.0b2.1y.03w.127.0aq.110.03v.12d.0ai.1m.01.1g.03u.12f.0af.1n.02.1h.03s.12g.0ad.1p.01.1i.03r.12h.0aa.1r.01.1k.03p.12j.0a7.11f.03n.12m.0a2.11j.03l.12o.09y.11m.03k.12p.09u.11q.03j.12q.09s.11s.03i.12q.09q.11v.03h.12q.09o.1s.03.113.03g.12r.09m.1y.01.111.03f.12r.09k.11k.04.1e.03f.12r.09j.11a.01.1c.03.1f.03d.12s.07r.19.01f.11e.02.1d.01.1f.03c.12t.07o.1f.017.11j.02.1s.03c.12t.07l.1z.0f.12o.03c.12u.078.18.01.114.06.12v.03c.12u.074.11h.02.12z.03c.12u.072.14j.03d.12v.06x.14o.03c.12w.06u.14r.03b.12x.06q.14v.03a.12x.06o.14z.038.12x.047.17h.033.13f.03j.182.02s.13j.03f.183.02r.13l.03d.184.02q.13l.03d.184.02q.13m.03c.185.02p.13n.03b.185.02p.13u.034.185.02p.13u.034.186.02o.13v.011.11.021.186.02o.13w.032.186.02o.142.02w.186.02o.145.02t.186.02o.147.02r.187.02n.14a.02o.188.02m.14b.02n.18a.02k.14d.02l.18d.02h.14g.02i.18j.02b.14h.02h.18l.029.14i.02g.18l.029.14j.02f.18m.028.14k.02e.1fe.02e.17g.21.17y.02d.16w.2l.17z.02c.16w.2l.180.02b.16w.2l.180.02b.16w.2l.181.02a.16w.2l.181.02a.16w.2l.182.029.16w.2l.183.027.16x.2l.183.027.16x.2l.184.026.16x.2l.184.026.16x.2l.185.025.16x.2l.185.025.16x.2l.186.024.16x.2l.186.024.16x.2l.186.024.16x.2l.187.023.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.138.072.16x.2l.18a.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.13j.020.16x.25c.1cg.25c.1cg.25c.1cg.25c.1cg.25c.1cg.25c.1cg.25c.1cg.25c.1cg.25c.1cg.23t.1dz.2l.1cn1."
    },
    {
      nom: 'La trona',
      tema: 'institucions',
      text: 'Un rei presideix el camí assegut a la trona, dalt d\'un pedestal que no deixa passar ningú. Un bon pastís de nata a la cara el fa baixar de cop. També t\'hi pots enfilar amb un castell. I després, un barranc.',
      total: 12, needed: 10, rate: 35, time: 300,
      skills: { pastis: 1, castell: 1, pont: 2, blocar: 1 },
      entrance: { x: 50, y: 198, dir: 1 },
      exit: { x: 600, y: 219 },
      kings: [
        { x: 330, y: 219, w: 18, h: 34 }
      ],
      build(a) {
        a.rect(0, 220, 640, 100);
        a.clear(460, 220, 22, 100);
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LEVELS;
  else root.CAT_LEVELS = LEVELS;
})(this);
