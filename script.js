'use strict';
/* ==========================================================================
   Molecular Bonding Lab
   --------------------------------------------------------------------------
   Sections
     1. Chemistry data (elements, names, presets)
     2. Vector helpers
     3. Model: atoms, bonds, valence rules, bond types
     4. Physics: bond springs + VSEPR electron-domain repulsion
     5. Analysis: formula, shape, polarity, bond summary
     6. UI: 3D renderer, interaction, panels
   ========================================================================== */

/* ==========================================================================
   1. CHEMISTRY DATA
   ========================================================================== */
const ELEMENTS = {
  //        valence  valence e-  lone pairs  electronegativity  covalent radius (pm)  display radius (px)
  H:  { sym: 'H',  name: 'Hydrogen',   val: 1, ve: 1, lp: 0, en: 2.20, cr: 31,  mass: 1.008,  r: 17, color: '#e8eef7', metal: false },
  C:  { sym: 'C',  name: 'Carbon',     val: 4, ve: 4, lp: 0, en: 2.55, cr: 76,  mass: 12.011, r: 27, color: '#59606e', metal: false },
  N:  { sym: 'N',  name: 'Nitrogen',   val: 3, ve: 5, lp: 1, en: 3.04, cr: 71,  mass: 14.007, r: 26, color: '#4a7dff', metal: false },
  O:  { sym: 'O',  name: 'Oxygen',     val: 2, ve: 6, lp: 2, en: 3.44, cr: 66,  mass: 15.999, r: 25, color: '#ff4d4f', metal: false },
  F:  { sym: 'F',  name: 'Fluorine',   val: 1, ve: 7, lp: 3, en: 3.98, cr: 57,  mass: 18.998, r: 22, color: '#9be564', metal: false },
  Cl: { sym: 'Cl', name: 'Chlorine',   val: 1, ve: 7, lp: 3, en: 3.16, cr: 102, mass: 35.45,  r: 32, color: '#2fbf71', metal: false },
  S:  { sym: 'S',  name: 'Sulfur',     val: 2, ve: 6, lp: 2, en: 2.58, cr: 105, mass: 32.06,  r: 33, color: '#f2cf3a', metal: false },
  P:  { sym: 'P',  name: 'Phosphorus', val: 3, ve: 5, lp: 1, en: 2.19, cr: 107, mass: 30.974, r: 33, color: '#ff9f1c', metal: false },
  Na: { sym: 'Na', name: 'Sodium',     val: 1, ve: 1, lp: 0, en: 0.93, cr: 166, mass: 22.990, r: 38, color: '#b07cff', metal: true  },
  Mg: { sym: 'Mg', name: 'Magnesium',  val: 2, ve: 2, lp: 0, en: 1.31, cr: 141, mass: 24.305, r: 35, color: '#2ec4b6', metal: true  },
};

/* Order in which element symbols are written in a formula.
   With carbon present: C, H, then the rest alphabetically (Hill system).
   Without carbon: metals first, then N-group / H / S / Cl / O / F so that
   we get NH3, H2O, H2S, HCl, NaCl, MgCl2, ... the way chemists write them. */
const FORMULA_ORDER = ['Na', 'Mg', 'P', 'N', 'H', 'S', 'Cl', 'O', 'F'];

const NAMES = {
  H2: 'Hydrogen', N2: 'Nitrogen', O2: 'Oxygen', F2: 'Fluorine', Cl2: 'Chlorine',
  H2O: 'Water', H2O2: 'Hydrogen peroxide', NH3: 'Ammonia', N2H4: 'Hydrazine',
  PH3: 'Phosphine', PCl3: 'Phosphorus trichloride', NF3: 'Nitrogen trifluoride',
  OF2: 'Oxygen difluoride', H2S: 'Hydrogen sulfide', HCl: 'Hydrogen chloride', HF: 'Hydrogen fluoride',
  CH4: 'Methane', C2H6: 'Ethane', C2H4: 'Ethene (ethylene)', C2H2: 'Ethyne (acetylene)',
  CO2: 'Carbon dioxide', CO: 'Carbon monoxide', CS2: 'Carbon disulfide', CCl4: 'Carbon tetrachloride',
  CH2O: 'Formaldehyde', CH4O: 'Methanol', CH3Cl: 'Chloromethane', CH5N: 'Methylamine',
  C2H6O: 'Ethanol / dimethyl ether (isomers)',
  NaCl: 'Sodium chloride', NaF: 'Sodium fluoride', NaH: 'Sodium hydride', Na2O: 'Sodium oxide',
  Na2S: 'Sodium sulfide', MgO: 'Magnesium oxide', MgCl2: 'Magnesium chloride', MgS: 'Magnesium sulfide',
};

/* Molecular geometry from (X = bonded atoms, E = lone pairs) on the central atom. */
const GEOMETRY = {
  '2,0': { name: 'Linear', ideal: 180 },
  '3,0': { name: 'Trigonal planar', ideal: 120 },
  '4,0': { name: 'Tetrahedral', ideal: 109.5 },
  '2,1': { name: 'Bent', ideal: 120 },
  '2,2': { name: 'Bent', ideal: 104.5 },
  '3,1': { name: 'Trigonal pyramidal', ideal: 107 },
};

const ORDER_WORD = ['', 'single', 'double', 'triple'];
const ORDER_SIGN = ['', '–', '=', '≡'];

const PRESETS = [
  { label: 'H₂',   title: 'Hydrogen',          atoms: ['H', 'H'],                          bonds: [[0, 1, 1]] },
  { label: 'O₂',   title: 'Oxygen (double)',   atoms: ['O', 'O'],                          bonds: [[0, 1, 2]] },
  { label: 'N₂',   title: 'Nitrogen (triple)', atoms: ['N', 'N'],                          bonds: [[0, 1, 3]] },
  { label: 'HCl',  title: 'Hydrogen chloride', atoms: ['H', 'Cl'],                         bonds: [[0, 1, 1]] },
  { label: 'H₂O',  title: 'Water',             atoms: ['O', 'H', 'H'],                     bonds: [[0, 1, 1], [0, 2, 1]] },
  { label: 'CO₂',  title: 'Carbon dioxide',    atoms: ['C', 'O', 'O'],                     bonds: [[0, 1, 2], [0, 2, 2]] },
  { label: 'NH₃',  title: 'Ammonia',           atoms: ['N', 'H', 'H', 'H'],                bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  { label: 'CH₄',  title: 'Methane',           atoms: ['C', 'H', 'H', 'H', 'H'],           bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  { label: 'C₂H₄', title: 'Ethene',            atoms: ['C', 'C', 'H', 'H', 'H', 'H'],      bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] },
  { label: 'C₂H₂', title: 'Ethyne',            atoms: ['C', 'C', 'H', 'H'],                bonds: [[0, 1, 3], [0, 2, 1], [1, 3, 1]] },
  { label: 'CH₃OH', title: 'Methanol',         atoms: ['C', 'O', 'H', 'H', 'H', 'H'],      bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1]] },
  { label: 'NaCl', title: 'Sodium chloride',   atoms: ['Na', 'Cl'],                        bonds: [[0, 1, 1]] },
  { label: 'MgO',  title: 'Magnesium oxide',   atoms: ['Mg', 'O'],                         bonds: [[0, 1, 2]] },
  { label: 'MgCl₂', title: 'Magnesium chloride', atoms: ['Mg', 'Cl', 'Cl'],                bonds: [[0, 1, 1], [0, 2, 1]] },
];

const MAX_ATOMS = 60;

/* ==========================================================================
   2. VECTOR HELPERS  (vectors are plain [x, y, z] arrays)
   ========================================================================== */
const TAU = Math.PI * 2;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a); return l < 1e-9 ? [1, 0, 0] : [a[0] / l, a[1] / l, a[2] / l]; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function randUnit() {
  const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, z = Math.random() * 2 - 1;
  const l = Math.hypot(x, y, z);
  return l < 0.05 ? [0, 1, 0] : [x / l, y / l, z / l];
}

/* ==========================================================================
   3. MODEL
   ========================================================================== */
const world = { atoms: [], bonds: [], nextId: 1, version: 0 };

/** Classify a bond from the electronegativity difference. */
function bondType(a, b) {
  const d = Math.abs(a.el.en - b.el.en);
  const metalPair = a.el.metal !== b.el.metal;
  if (d >= 1.7 || (metalPair && d >= 1.2)) return 'ionic';
  if (d >= 0.4) return 'polar';
  return 'nonpolar';
}

function restLen(b) {
  const base = (b.a.el.cr + b.b.el.cr) * 0.95;
  if (b.type === 'ionic') return base * 0.85;
  return base * [1, 1, 0.88, 0.8][b.order];
}

function addAtom(sym, pos) {
  const a = {
    id: world.nextId++, sym, el: ELEMENTS[sym],
    p: pos.slice(), v: [0, 0, 0], dom: [], drag: false,
    nb: [], dnb: [], adj: new Set(), used: 0, free: 0, charge: 0, ionicOrder: 0,
  };
  world.atoms.push(a);
  refresh();
  return a;
}

function removeAtom(a) {
  world.bonds = world.bonds.filter((b) => b.a !== a && b.b !== a);
  world.atoms = world.atoms.filter((x) => x !== a);
  refresh();
}

function clearWorld() {
  world.atoms = [];
  world.bonds = [];
  refresh();
}

function findBond(a, b) {
  return world.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
}

function limitMsg(x) {
  return `${x.el.name} can form at most ${x.el.val} bond${x.el.val > 1 ? 's' : ''}, so its valence is full.`;
}

/** Create a bond, or raise the order of an existing one. */
function tryBond(a, b) {
  if (a === b) return { ok: false, msg: '' };
  const ex = findBond(a, b);
  if (ex) {
    if (ex.order >= 3) return { ok: false, msg: 'Triple is the highest bond order.' };
    if (a.free < 1 || b.free < 1) return { ok: false, msg: limitMsg(a.free < 1 ? a : b) };
    ex.order++;
    refresh();
    return { ok: true, bond: ex, msg: `Bond raised to ${ORDER_WORD[ex.order]}.` };
  }
  if (a.free < 1 || b.free < 1) return { ok: false, msg: limitMsg(a.free < 1 ? a : b) };
  const bond = { a, b, order: 1, type: 'polar' };
  world.bonds.push(bond);
  refresh();
  return { ok: true, bond, msg: '' };
}

/** Lower a bond's order, or break it when it is already single. */
function lowerBond(b) {
  if (b.order > 1) b.order--;
  else world.bonds.splice(world.bonds.indexOf(b), 1);
  refresh();
}

/** Recompute everything derived from the atom/bond lists. */
function refresh() {
  world.version++;
  for (const a of world.atoms) {
    a.nb = []; a.dnb = []; a.adj = new Set();
    a.used = 0; a.charge = 0; a.ionicOrder = 0;
  }
  for (const b of world.bonds) {
    b.type = bondType(b.a, b.b);
    b.a.used += b.order; b.b.used += b.order;
    b.a.adj.add(b.b); b.b.adj.add(b.a);
    if (b.type === 'ionic') {
      const cat = b.a.el.en <= b.b.el.en ? b.a : b.b;
      const an = cat === b.a ? b.b : b.a;
      cat.charge += b.order; an.charge -= b.order;
      cat.ionicOrder += b.order; an.ionicOrder += b.order;
      b.cation = cat; b.anion = an;
      cat.dnb.push(an);                       // a cation arranges its anions around itself
    } else {
      b.a.nb.push({ atom: b.b, bond: b });
      b.b.nb.push({ atom: b.a, bond: b });
      b.a.dnb.push(b.b); b.b.dnb.push(b.a);
    }
  }
  for (const a of world.atoms) {
    a.free = Math.max(0, a.el.val - a.used);
    const ionic = a.ionicOrder > 0;
    reconcileDomains(a, 'lp', ionic ? 0 : a.el.lp);   // lone pairs
    reconcileDomains(a, 'e', ionic ? 0 : a.free);     // unpaired electrons (open valence)
  }
}

/** Keep the number of lone-pair / unpaired-electron domains in sync with the chemistry. */
function reconcileDomains(a, type, want) {
  const cur = a.dom.filter((d) => d.type === type);
  while (cur.length > want) {
    // drop the domain that points most directly at an existing bond partner
    let bi = 0, bs = -2;
    cur.forEach((d, i) => {
      let s = -2;
      for (const n of a.dnb) s = Math.max(s, dot(norm(sub(n.p, a.p)), d.v));
      if (s > bs) { bs = s; bi = i; }
    });
    const rem = cur.splice(bi, 1)[0];
    a.dom.splice(a.dom.indexOf(rem), 1);
  }
  while (cur.length < want) {
    const d = { type, v: randUnit() };
    if (a.dnb.length) {
      let s = [0, 0, 0];
      for (const n of a.dnb) s = add(s, norm(sub(n.p, a.p)));
      if (len(s) > 0.1) d.v = norm(add(mul(s, -1), mul(randUnit(), 0.6)));
    }
    cur.push(d);
    a.dom.push(d);
  }
}

/** The nearest atom that `a` could bond with if it were released here. */
function findSnap(a) {
  let best = null, bd = Infinity;
  for (const o of world.atoms) {
    if (o === a || a.adj.has(o)) continue;
    if (a.free < 1 || o.free < 1) continue;
    const d = len(sub(a.p, o.p));
    const limit = (a.el.cr + o.el.cr) * 0.95 * 1.3 + 10;
    if (d < limit && d < bd) { best = o; bd = d; }
  }
  return best;
}

function buildPreset(preset, center) {
  const made = preset.atoms.map((sym) => {
    const off = mul(randUnit(), 45);
    return addAtom(sym, add(center, off));
  });
  for (const [i, j, order] of preset.bonds) {
    const r = tryBond(made[i], made[j]);
    for (let k = 1; k < order && r.ok; k++) tryBond(made[i], made[j]);
  }
  return made;
}

/* ==========================================================================
   4. PHYSICS
   ========================================================================== */
const BOUNDS = { x: 1e9, y: 1e9, z: 240 };
const K_BOND = 0.18, K_REP = 0.12, K_LP = 0.12, K_ANG = 0.10, K_PLANE = 0.05;
const W_LP = 1.3, W_E = 0.9, DAMP = 0.8, MAX_SPEED = 40;

/**
 * One relaxation step.
 *  - bond springs hold atoms at their ideal bond length
 *  - non-bonded atoms are pushed apart so they never overlap
 *  - VSEPR: every electron domain (bond, lone pair, unpaired e-) repels the others
 *    around its atom, which produces linear, trigonal, tetrahedral, bent ... shapes
 *  - double bonds keep their substituents in one plane (ethene is flat)
 */
function physicsStep() {
  const atoms = world.atoms, n = atoms.length;
  if (!n) return;
  const idx = new Map();
  atoms.forEach((a, i) => idx.set(a, i));
  const F = atoms.map(() => [0, 0, 0]);
  const push = (i, f) => { F[i][0] += f[0]; F[i][1] += f[1]; F[i][2] += f[2]; };

  // 1. bond springs
  for (const b of world.bonds) {
    const d = sub(b.b.p, b.a.p);
    const L = Math.max(len(d), 0.01);
    const f = mul(d, ((L - restLen(b)) * K_BOND) / L);
    push(idx.get(b.a), f);
    push(idx.get(b.b), mul(f, -1));
  }

  // 2. steric repulsion between atoms that are not directly bonded
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const A = atoms[i], B = atoms[j];
      if (A.adj.has(B)) continue;
      let d = sub(B.p, A.p), L = len(d);
      const minD = (A.el.r + B.el.r) * 1.55 + 14;
      if (L >= minD) continue;
      if (L < 0.01) { d = randUnit(); L = 1; }
      const f = mul(d, ((minD - L) * K_REP) / L);
      push(i, mul(f, -1));
      push(j, f);
    }
  }

  // 3. VSEPR electron-domain repulsion
  for (const a of atoms) {
    const ia = idx.get(a);
    const doms = [];
    for (const nb of a.dnb) doms.push({ u: norm(sub(nb.p, a.p)), w: 1, nb });
    for (const d of a.dom) doms.push({ u: d.v, w: d.type === 'lp' ? W_LP : W_E, d });
    const m = doms.length;
    if (m < 2) continue;
    const fv = doms.map(() => [0, 0, 0]);
    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        const diff = sub(doms[i].u, doms[j].u);
        const d2 = Math.max(dot(diff, diff), 1e-3);
        const mag = (doms[i].w * doms[j].w) / (d2 * Math.sqrt(d2));
        for (let k = 0; k < 3; k++) { fv[i][k] += diff[k] * mag; fv[j][k] -= diff[k] * mag; }
      }
    }
    doms.forEach((dm, i) => {
      const f = fv[i];
      const rad = dot(f, dm.u);
      const ft = [f[0] - dm.u[0] * rad, f[1] - dm.u[1] * rad, f[2] - dm.u[2] * rad];   // tangential part
      if (dm.d) {
        dm.d.v = norm(add(dm.d.v, mul(ft, K_LP)));
      } else {
        const L = len(sub(dm.nb.p, a.p));
        const p = mul(ft, K_ANG * L);
        push(idx.get(dm.nb), p);
        push(ia, mul(p, -1));
      }
    });
  }

  // 4. planarity around double bonds
  for (const b of world.bonds) {
    if (b.type === 'ionic' || b.order !== 2) continue;
    const A = b.a, B = b.b;
    const axis = norm(sub(B.p, A.p));
    const xs = A.nb.filter((q) => q.atom !== B).map((q) => q.atom);
    const ys = B.nb.filter((q) => q.atom !== A).map((q) => q.atom);
    if (!xs.length || !ys.length) continue;
    const perp = (p, o) => { const r = sub(p, o); return sub(r, mul(axis, dot(r, axis))); };
    const r0 = perp(xs[0].p, A.p), l0 = len(r0);
    if (l0 < 1e-3) continue;
    const ref = mul(r0, 1 / l0);
    const align = (atom, origin) => {
      const r = perp(atom.p, origin);
      const target = mul(ref, dot(r, ref));
      push(idx.get(atom), mul(sub(target, r), K_PLANE));
    };
    xs.forEach((x) => align(x, A.p));
    ys.forEach((y) => align(y, B.p));
  }

  // 5. soft walls + integration
  for (let i = 0; i < n; i++) {
    const a = atoms[i], f = F[i];
    for (let k = 0; k < 3; k++) {
      const lim = k === 0 ? BOUNDS.x : k === 1 ? BOUNDS.y : BOUNDS.z;
      if (a.p[k] > lim) f[k] -= (a.p[k] - lim) * 0.15;
      if (a.p[k] < -lim) f[k] -= (a.p[k] + lim) * 0.15;
    }
    if (a.drag) { a.v = [0, 0, 0]; continue; }
    let v = mul(add(a.v, f), DAMP);
    const s = len(v);
    if (s > MAX_SPEED) v = mul(v, MAX_SPEED / s);
    a.v = v;
    a.p = add(a.p, v);
  }
}

/* ==========================================================================
   5. ANALYSIS
   ========================================================================== */
function components() {
  const seen = new Set(), out = [];
  for (const a of world.atoms) {
    if (seen.has(a)) continue;
    const comp = [], stack = [a];
    seen.add(a);
    while (stack.length) {
      const x = stack.pop();
      comp.push(x);
      for (const y of x.adj) if (!seen.has(y)) { seen.add(y); stack.push(y); }
    }
    out.push(comp);
  }
  return out;
}

function formulaOf(comp) {
  const counts = {};
  for (const a of comp) counts[a.sym] = (counts[a.sym] || 0) + 1;
  let syms = Object.keys(counts);
  if (counts.C) {
    syms.sort((x, y) => {
      const rank = (s) => (s === 'C' ? 0 : s === 'H' ? 1 : 2);
      return rank(x) - rank(y) || (x < y ? -1 : 1);
    });
  } else {
    syms.sort((x, y) => FORMULA_ORDER.indexOf(x) - FORMULA_ORDER.indexOf(y));
  }
  let plain = '', html = '';
  for (const s of syms) {
    plain += s + (counts[s] > 1 ? counts[s] : '');
    html += s + (counts[s] > 1 ? `<sub>${counts[s]}</sub>` : '');
  }
  return { plain, html };
}

/** Partial charge indicator: positive when the atom is less electronegative than its partners. */
function partialOf(a) {
  let s = 0;
  for (const q of a.nb) s += q.atom.el.en - a.el.en;
  return s;
}

function angleDeg(a, p, b) {
  const u = norm(sub(a, p)), v = norm(sub(b, p));
  return (Math.acos(clamp(dot(u, v), -1, 1)) * 180) / Math.PI;
}

function analyzeMolecules() {
  return components().map((comp) => {
    const set = new Set(comp);
    const bonds = world.bonds.filter((b) => set.has(b.a));
    const f = formulaOf(comp);
    const ionic = bonds.some((b) => b.type === 'ionic');
    const complete = comp.every((a) => a.free === 0);
    const mass = comp.reduce((s, a) => s + a.el.mass, 0);
    const info = {
      atoms: comp, bonds, plain: f.plain, formulaHTML: f.html, ionic, complete, mass,
      name: complete && NAMES[f.plain] ? NAMES[f.plain] : null,
      kind: comp.length === 1 ? 'Isolated atom' : ionic ? 'Ionic compound' : 'Molecule',
      geometry: null, polarity: null, dipole: null,
    };

    // ---- geometry (covalent molecules) ----
    if (comp.length === 1) {
      info.geometry = { text: 'Single atom' };
    } else if (ionic) {
      info.geometry = { text: comp.length === 2 ? 'Ion pair' : 'Ionic arrangement' };
    } else if (comp.length === 2) {
      info.geometry = { text: 'Linear (diatomic)' };
    } else {
      let center = null;
      for (const a of comp) if (a.nb.length >= 2 && (!center || a.nb.length > center.nb.length)) center = a;
      if (center) {
        const X = center.nb.length, E = center.el.lp;
        const g = GEOMETRY[`${X},${E}`];
        const angles = [];
        for (let i = 0; i < X; i++)
          for (let j = i + 1; j < X; j++)
            angles.push(angleDeg(center.nb[i].atom.p, center.p, center.nb[j].atom.p));
        const avg = angles.reduce((s, v) => s + v, 0) / angles.length;
        const centers = comp.filter((a) => a.nb.length >= 2).length;
        info.geometry = {
          text: g ? g.name : 'Irregular',
          ideal: g ? g.ideal : null,
          measured: Math.round(avg),
          axe: `AX${X}${E ? 'E' + (E > 1 ? E : '') : ''}`.replace('AX2', 'AX₂').replace('AX3', 'AX₃').replace('AX4', 'AX₄'),
          centers,
          open: !complete,
        };
      } else {
        info.geometry = { text: 'Chain' };
      }
    }

    // ---- polarity (sum of bond dipoles) ----
    if (!bonds.length) {
      info.polarity = { text: '–' };
    } else if (ionic) {
      info.polarity = { text: 'Ionic (full charges)' };
    } else {
      let sum = [0, 0, 0];
      for (const b of bonds) {
        const d = b.b.el.en - b.a.el.en;                 // positive: pulls toward b
        sum = add(sum, mul(norm(sub(b.b.p, b.a.p)), d));
      }
      const mag = len(sum);
      const polar = mag > 0.3;
      info.polarity = { text: polar ? 'Polar molecule' : 'Nonpolar molecule', polar, mag };
      if (polar) {
        let c = [0, 0, 0];
        for (const a of comp) c = add(c, a.p);
        info.dipole = { center: mul(c, 1 / comp.length), dir: norm(sum) };
      }
    }

    // ---- bond summary ----
    const groups = new Map();
    for (const b of bonds) {
      const s1 = b.a.sym, s2 = b.b.sym;
      const [x, y] = FORMULA_ORDER.indexOf(s1) <= FORMULA_ORDER.indexOf(s2) ? [s1, s2] : [s2, s1];
      const key = `${x}|${y}|${b.order}|${b.type}`;
      if (!groups.has(key)) {
        groups.set(key, { x, y, order: b.order, type: b.type, count: 0, den: Math.abs(b.a.el.en - b.b.el.en) });
      }
      groups.get(key).count++;
    }
    info.bondGroups = [...groups.values()];

    info.open = comp
      .filter((a) => a.free > 0)
      .reduce((m, a) => { m[a.sym] = (m[a.sym] || 0) + a.free; return m; }, {});
    return info;
  });
}

/* ==========================================================================
   Exports for headless testing (no effect in the browser)
   ========================================================================== */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ELEMENTS, PRESETS, world, addAtom, tryBond, lowerBond, removeAtom, clearWorld, refresh,
    physicsStep, buildPreset, analyzeMolecules, findSnap, angleDeg, sub, norm, dot, len, add,
  };
}

/* ==========================================================================
   6. USER INTERFACE
   ========================================================================== */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `rgb(${r},${g},${b})`;
}
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function initUI() {
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene'), ctx = canvas.getContext('2d'), stage = $('stage');
  const FOCAL = 1100;

  let W = 800, H = 500;
  const cam = { yaw: 0.5, pitch: 0.28, zoom: 1 };
  const opts = { elec: true, lp: true, charges: true, dipole: true, labels: true, rotate: false, autobond: true };
  let mode = 'move';
  let selected = null;       // selected atom
  let pending = null;        // first atom chosen in Bond mode
  let hover = null;          // { atom } or { bond }
  let drag = null;           // active pointer interaction
  let snap = null;           // atom that the dragged atom would bond with
  const mouse = { x: 0, y: 0 };
  let infos = [];
  let lastVersion = -1, lastHTML = '', frameNo = 0, toastTimer = 0;

  /* ---------- camera maths ---------- */
  function project(p) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = cy * p[0] + sy * p[2];
    const z1 = -sy * p[0] + cy * p[2];
    const y2 = cp * p[1] - sp * z1;
    const z2 = sp * p[1] + cp * z1;
    const s = (FOCAL / (FOCAL + z2)) * cam.zoom;
    return { x: W / 2 + x1 * s, y: H / 2 + y2 * s, s, z: z2 };
  }
  function unproject(sx, sy, z2) {
    const cy = Math.cos(cam.yaw), sy_ = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const s = (FOCAL / (FOCAL + z2)) * cam.zoom;
    const x1 = (sx - W / 2) / s, y2 = (sy - H / 2) / s;
    const y = cp * y2 + sp * z2;
    const z1 = -sp * y2 + cp * z2;
    return [cy * x1 - sy_ * z1, y, sy_ * x1 + cy * z1];
  }

  /* ---------- sizing ---------- */
  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(300, r.width); H = Math.max(300, r.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    BOUNDS.x = (W / 2 - 60) / cam.zoom; BOUNDS.y = (H / 2 - 60) / cam.zoom;
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ---------- toast ---------- */
  function toast(msg, good) {
    if (!msg) return;
    const t = $('toast');
    t.textContent = msg;
    t.classList.toggle('good', !!good);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- palette ---------- */
  const palette = $('palette');
  Object.values(ELEMENTS).forEach((el) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'atom-btn';
    b.draggable = true;
    b.title = `${el.name} · valence ${el.val} · electronegativity ${el.en.toFixed(2)}`;
    b.setAttribute('aria-label', `Add ${el.name}`);
    const dark = luminance(el.color) < 0.55;
    b.style.background = `radial-gradient(circle at 32% 30%, ${shade(el.color, 0.55)}, ${el.color} 45%, ${shade(el.color, -0.45)})`;
    b.style.color = dark ? '#fff' : '#0b1220';
    b.innerHTML = `<span class="sym">${el.sym}</span><span class="en">${el.en.toFixed(2)}</span>`;
    b.addEventListener('click', () => addFromPalette(el.sym));
    b.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', el.sym); e.dataTransfer.effectAllowed = 'copy'; });
    palette.appendChild(b);
  });

  function nearestDist(p) {
    let m = Infinity;
    for (const a of world.atoms) m = Math.min(m, len(sub(a.p, p)));
    return m;
  }
  function spawnPos() {
    let best = null, bd = -1;
    for (let i = 0; i < 24; i++) {
      const p = unproject(W * (0.3 + Math.random() * 0.4), H * (0.3 + Math.random() * 0.4), 0);
      const d = nearestDist(p);
      if (d > bd) { bd = d; best = p; }
    }
    return best;
  }
  function addFromPalette(sym, at) {
    if (world.atoms.length >= MAX_ATOMS) return toast(`The stage is full (${MAX_ATOMS} atoms). Clear some atoms first.`);
    const a = addAtom(sym, at || spawnPos());
    selected = a;
    if (at && opts.autobond) {
      const t = findSnap(a);
      if (t) bondWithFeedback(a, t);
    }
  }

  /* ---------- presets ---------- */
  const presetBox = $('presets');
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-btn';
    b.textContent = p.label;
    b.title = p.title;
    b.addEventListener('click', () => loadPreset(p));
    presetBox.appendChild(b);
  });
  function loadPreset(p) {
    if (!$('keepExisting').checked) clearWorld();
    if (world.atoms.length + p.atoms.length > MAX_ATOMS) return toast('Not enough room on the stage for that molecule.');
    let center = [0, 0, 0];
    if (world.atoms.length) {
      let bd = -1;
      for (let i = 0; i < 30; i++) {
        const c = [(Math.random() - 0.5) * BOUNDS.x * 1.3, (Math.random() - 0.5) * BOUNDS.y * 1.2, (Math.random() - 0.5) * 80];
        const d = nearestDist(c);
        if (d > bd) { bd = d; center = c; }
      }
    }
    const made = buildPreset(p, center);
    selected = made[0];
    pending = null;
  }

  /* ---------- actions ---------- */
  $('btnClear').addEventListener('click', () => { clearWorld(); selected = pending = snap = null; });
  $('btnShake').addEventListener('click', () => world.atoms.forEach((a) => { a.v = add(a.v, mul(randUnit(), 22)); }));
  $('btnView').addEventListener('click', () => { cam.yaw = 0.5; cam.pitch = 0.28; cam.zoom = 1; resize(); });
  $('btnFill').addEventListener('click', () => {
    const targets = world.atoms.filter((a) => a.sym !== 'H' && !a.el.metal && a.ionicOrder === 0 && a.free > 0);
    if (!targets.length) return toast('Every atom already has its valence filled.', true);
    let added = 0;
    for (const a of targets) {
      const need = a.free;
      for (let i = 0; i < need; i++) {
        if (world.atoms.length >= MAX_ATOMS) { toast('Stage is full.'); return; }
        const h = addAtom('H', add(a.p, mul(randUnit(), 80)));
        tryBond(a, h);
        added++;
      }
    }
    toast(`Added ${added} hydrogen atom${added > 1 ? 's' : ''}.`, true);
  });

  /* ---------- modes ---------- */
  const modeHints = {
    move: 'Drag an atom to move it; drop it next to another atom to bond. Drag empty space to rotate the view.',
    bond: 'Click one atom, then another, to bond them. Click an existing bond to raise it to double or triple.',
    erase: 'Click an atom to delete it. Click a bond to lower its order or break it.',
  };
  function setMode(m) {
    mode = m;
    pending = null; snap = null;
    document.querySelectorAll('#modes button').forEach((b) => {
      const on = b.dataset.mode === m;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', on);
    });
    $('modeHint').textContent = modeHints[m];
    canvas.style.cursor = m === 'move' ? 'default' : 'crosshair';
  }
  document.querySelectorAll('#modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  setMode('move');

  /* ---------- toggles ---------- */
  const bindOpt = (id, key) => { const el = $(id); el.checked = opts[key]; el.addEventListener('change', () => { opts[key] = el.checked; }); };
  bindOpt('optElec', 'elec'); bindOpt('optLP', 'lp'); bindOpt('optCharges', 'charges'); bindOpt('optDipole', 'dipole');
  bindOpt('optLabels', 'labels'); bindOpt('optAuto', 'autobond'); bindOpt('optRotate', 'rotate');

  /* ---------- keyboard ---------- */
  window.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'm') setMode('move');
    else if (k === 'b') setMode('bond');
    else if (k === 'e') setMode('erase');
    else if (k === 'escape') { pending = null; snap = null; }
    else if ((k === 'delete' || k === 'backspace') && selected) { removeAtom(selected); selected = null; }
  });

  /* ---------- hit testing ---------- */
  function hitAtom(pt) {
    let best = null, bz = Infinity;
    for (const a of world.atoms) {
      const pr = a._pr;
      if (!pr) continue;
      if (Math.hypot(pt.x - pr.x, pt.y - pr.y) <= a.el.r * pr.s + 4 && pr.z < bz) { best = a; bz = pr.z; }
    }
    return best;
  }
  function hitBond(pt) {
    let best = null, bd = 9;
    for (const b of world.bonds) {
      const A = b.a._pr, B = b.b._pr;
      if (!A || !B) continue;
      const dx = B.x - A.x, dy = B.y - A.y, l2 = dx * dx + dy * dy || 1;
      const t = clamp(((pt.x - A.x) * dx + (pt.y - A.y) * dy) / l2, 0, 1);
      const d = Math.hypot(pt.x - (A.x + dx * t), pt.y - (A.y + dy * t));
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  function localPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* ---------- bonding feedback ---------- */
  function bondWithFeedback(a, b) {
    const r = tryBond(a, b);
    if (!r.ok) { toast(r.msg); return r; }
    if (r.msg) toast(r.msg, true);
    else if (r.bond) {
      const t = r.bond.type;
      const label = t === 'ionic' ? 'ionic bond (electron transfer)' : t === 'polar' ? 'polar covalent bond' : 'nonpolar covalent bond';
      toast(`${a.sym}–${b.sym}: ${label}, ΔEN ${Math.abs(a.el.en - b.el.en).toFixed(2)}`, true);
    }
    return r;
  }

  /* ---------- pointer interaction ---------- */
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const pt = localPoint(e);
    mouse.x = pt.x; mouse.y = pt.y;
    const atom = hitAtom(pt);
    const bond = atom ? null : hitBond(pt);

    if (mode === 'erase') {
      if (atom) { if (selected === atom) selected = null; removeAtom(atom); }
      else if (bond) lowerBond(bond);
      return;
    }
    if (mode === 'bond') {
      if (atom) {
        if (!pending) pending = atom;
        else if (pending === atom) pending = null;
        else { bondWithFeedback(pending, atom); pending = null; }
        selected = atom;
      } else if (bond) {
        bondWithFeedback(bond.a, bond.b);
      } else pending = null;
      return;
    }
    // move mode
    if (atom) {
      selected = atom;
      const pr = atom._pr;
      drag = { kind: 'atom', atom, z: pr.z, dx: pr.x - pt.x, dy: pr.y - pt.y };
      atom.drag = true;
      canvas.style.cursor = 'grabbing';
    } else {
      drag = { kind: 'rotate', x: pt.x, y: pt.y };
      selected = null;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const pt = localPoint(e);
    mouse.x = pt.x; mouse.y = pt.y;
    if (drag && drag.kind === 'atom') {
      drag.atom.p = unproject(pt.x + drag.dx, pt.y + drag.dy, drag.z);
      snap = opts.autobond ? findSnap(drag.atom) : null;
    } else if (drag && drag.kind === 'rotate') {
      cam.yaw += (pt.x - drag.x) * 0.008;
      cam.pitch = clamp(cam.pitch + (pt.y - drag.y) * 0.008, -1.45, 1.45);
      drag.x = pt.x; drag.y = pt.y;
    } else {
      const a = hitAtom(pt);
      hover = a ? { atom: a } : (() => { const b = hitBond(pt); return b ? { bond: b } : null; })();
      canvas.style.cursor = hover ? (mode === 'move' ? 'grab' : 'pointer') : (mode === 'move' ? 'default' : 'crosshair');
    }
  });

  function endDrag() {
    if (drag && drag.kind === 'atom') {
      drag.atom.drag = false;
      if (snap) bondWithFeedback(drag.atom, snap);
      snap = null;
    }
    drag = null;
    canvas.style.cursor = mode === 'move' ? 'default' : 'crosshair';
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { if (!drag) hover = null; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cam.zoom = clamp(cam.zoom * Math.exp(-e.deltaY * 0.001), 0.5, 2.2);
    BOUNDS.x = (W / 2 - 60) / cam.zoom; BOUNDS.y = (H / 2 - 60) / cam.zoom;
  }, { passive: false });

  canvas.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const sym = e.dataTransfer.getData('text/plain');
    if (!ELEMENTS[sym]) return;
    const pt = localPoint(e);
    addFromPalette(sym, unproject(pt.x, pt.y, 0));
  });

  /* ======================================================================
     RENDERING
     ====================================================================== */
  function drawBackground() {
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#13234a');
    g.addColorStop(1, '#050a16');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(120,160,230,0.10)';
    for (let x = 20; x < W; x += 40) for (let y = 20; y < H; y += 40) ctx.fillRect(x, y, 1.5, 1.5);
  }

  function drawAtom(a, pr) {
    const r = a.el.r * pr.s;
    const g = ctx.createRadialGradient(pr.x - r * 0.35, pr.y - r * 0.4, r * 0.08, pr.x, pr.y, r);
    g.addColorStop(0, shade(a.el.color, 0.6));
    g.addColorStop(0.45, a.el.color);
    g.addColorStop(1, shade(a.el.color, -0.5));
    ctx.save();
    if (a === selected || (hover && hover.atom === a) || a === pending) {
      ctx.shadowColor = a === pending ? '#ffd166' : '#4cc9f0';
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, r, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, r, 0, TAU); ctx.stroke();
    if (opts.labels) {
      ctx.fillStyle = luminance(a.el.color) > 0.6 ? '#0b1220' : '#ffffff';
      ctx.font = `800 ${Math.max(9, r * 0.82)}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a.sym, pr.x, pr.y + r * 0.04);
    }
  }

  function lineOffsets(order) {
    return order === 1 ? [0] : order === 2 ? [-0.5, 0.5] : [-1, 0, 1];
  }

  function drawStickHalf(b, p1, p2, color, nx, ny, sAvg) {
    const gap = 8.5 * sAvg;
    const lw = [0, 8, 5.2, 4][b.order] * sAvg;
    for (const o of lineOffsets(b.order)) {
      const ox = nx * o * gap, oy = ny * o * gap;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = shade(color, -0.55); ctx.lineWidth = lw + 2.4 * sAvg;
      ctx.beginPath(); ctx.moveTo(p1.x + ox, p1.y + oy); ctx.lineTo(p2.x + ox, p2.y + oy); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(p1.x + ox, p1.y + oy); ctx.lineTo(p2.x + ox, p2.y + oy); ctx.stroke();
      ctx.strokeStyle = shade(color, 0.55); ctx.lineWidth = lw * 0.32;
      ctx.beginPath(); ctx.moveTo(p1.x + ox - nx * lw * 0.18, p1.y + oy - ny * lw * 0.18);
      ctx.lineTo(p2.x + ox - nx * lw * 0.18, p2.y + oy - ny * lw * 0.18); ctx.stroke();
    }
  }

  function drawElectrons(b, pa, pb, time) {
    const dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L, sAvg = (pa.s + pb.s) / 2;
    const bias = clamp((b.b.el.en - b.a.el.en) * 0.1, -0.22, 0.22);   // electrons sit nearer the more electronegative atom
    ctx.save();
    ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10 * sAvg;
    ctx.fillStyle = '#ffe08a';
    lineOffsets(b.order).forEach((o, k) => {
      const t0 = 0.5 + bias + Math.sin(time * 2.4 + k * 1.9) * 0.025;
      for (const dt of [-0.055, 0.055]) {
        const t = t0 + dt;
        const x = pa.x + dx * t + nx * o * 8.5 * sAvg, y = pa.y + dy * t + ny * o * 8.5 * sAvg;
        ctx.beginPath(); ctx.arc(x, y, 3.3 * sAvg, 0, TAU); ctx.fill();
      }
    });
    ctx.restore();
  }

  function drawIonicBond(b, pa, pb, time) {
    const sAvg = (pa.s + pb.s) / 2;
    const cat = b.cation === b.a ? pa : pb, an = b.cation === b.a ? pb : pa;
    ctx.save();
    ctx.setLineDash([7 * sAvg, 7 * sAvg]);
    ctx.lineDashOffset = -time * 14;
    ctx.strokeStyle = 'rgba(201,180,255,0.85)';
    ctx.lineWidth = 3 * sAvg;
    ctx.shadowColor = '#b07cff'; ctx.shadowBlur = 8;
    const dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    lineOffsets(b.order).forEach((o) => {
      const ox = nx * o * 8 * sAvg, oy = ny * o * 8 * sAvg;
      ctx.beginPath(); ctx.moveTo(pa.x + ox, pa.y + oy); ctx.lineTo(pb.x + ox, pb.y + oy); ctx.stroke();
    });
    ctx.restore();
    if (opts.elec) {                                        // electrons flowing from the cation to the anion
      ctx.save();
      ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffe08a';
      for (let k = 0; k < 3 * b.order; k++) {
        const t = (time * 0.35 + k / (3 * b.order)) % 1;
        const o = lineOffsets(b.order)[k % b.order];
        const x = lerp(cat.x, an.x, t) + nx * o * 8 * sAvg, y = lerp(cat.y, an.y, t) + ny * o * 8 * sAvg;
        ctx.globalAlpha = Math.sin(t * Math.PI);
        ctx.beginPath(); ctx.arc(x, y, 3 * sAvg, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawDomain(a, d, time) {
    const R = a.el.r;
    if (d.type === 'lp') {
      const q1 = project(add(a.p, mul(d.v, R * 0.9))), q2 = project(add(a.p, mul(d.v, R + 30)));
      const s = (q1.s + q2.s) / 2;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(110,210,255,0.20)'; ctx.lineWidth = 19 * s;
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(140,230,255,0.35)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke();
      const mx = lerp(q1.x, q2.x, 0.58), my = lerp(q1.y, q2.y, 0.58);
      const dx = q2.x - q1.x, dy = q2.y - q1.y, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 9;
      ctx.fillStyle = '#9af0ff';
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.arc(mx + nx * 4.4 * s * sgn, my + ny * 4.4 * s * sgn, 2.9 * s, 0, TAU); ctx.fill();
      }
      ctx.restore();
    } else {
      const q = project(add(a.p, mul(d.v, R + 16)));
      const pulse = 1 + Math.sin(time * 3 + a.id) * 0.12;
      ctx.save();
      ctx.strokeStyle = '#ff9f43'; ctx.lineWidth = 2 * q.s;
      ctx.shadowColor = '#ff9f43'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(q.x, q.y, 4.4 * q.s * pulse, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,159,67,0.35)'; ctx.fill();
      ctx.restore();
    }
  }

  function badge(text, x, y, fg, bg) {
    ctx.save();
    ctx.font = '700 12px system-ui, sans-serif';
    const w = ctx.measureText(text).width + 12;
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 10, w, 20, 10); else ctx.rect(x - w / 2, y - 10, w, 20);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 0.5);
    ctx.restore();
  }

  function chargeText(c) {
    const m = Math.abs(c);
    return (m > 1 ? m : '') + (c > 0 ? '+' : '−');
  }

  function drawOverlays() {
    // charge labels
    if (opts.charges) {
      for (const a of world.atoms) {
        const pr = a._pr, r = a.el.r * pr.s;
        const x = pr.x + r * 0.95, y = pr.y - r * 0.95;
        if (a.charge !== 0) {
          badge(chargeText(a.charge), x, y, '#fff', a.charge > 0 ? '#c0392b' : '#2d6cdf');
        } else if (a.nb.length) {
          const p = partialOf(a);
          if (Math.abs(p) >= 0.4) badge(p > 0 ? 'δ+' : 'δ−', x, y, p > 0 ? '#ffd6d6' : '#cfe0ff', p > 0 ? 'rgba(192,57,43,.75)' : 'rgba(45,108,223,.75)');
        }
      }
    }
    // net dipole arrows
    if (opts.dipole) {
      for (const m of infos) {
        if (!m.dipole) continue;
        const { center, dir } = m.dipole;
        const tail = project(add(center, mul(dir, -70))), head = project(add(center, mul(dir, 70)));
        const ang = Math.atan2(head.y - tail.y, head.x - tail.x);
        ctx.save();
        ctx.strokeStyle = '#ffb703'; ctx.fillStyle = '#ffb703';
        ctx.lineWidth = 3.2; ctx.lineCap = 'round';
        ctx.shadowColor = '#ffb703'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(head.x - Math.cos(ang - 0.4) * 14, head.y - Math.sin(ang - 0.4) * 14);
        ctx.lineTo(head.x - Math.cos(ang + 0.4) * 14, head.y - Math.sin(ang + 0.4) * 14);
        ctx.closePath(); ctx.fill();
        ctx.lineWidth = 2;                                   // the little "+" at the tail of a dipole arrow
        ctx.beginPath();
        ctx.moveTo(tail.x - 5, tail.y); ctx.lineTo(tail.x + 5, tail.y);
        ctx.moveTo(tail.x, tail.y - 5); ctx.lineTo(tail.x, tail.y + 5);
        ctx.stroke();
        ctx.restore();
      }
    }
    // bond preview lines
    ctx.save();
    ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    if (pending && pending._pr) {
      ctx.strokeStyle = '#ffd166';
      ctx.beginPath(); ctx.moveTo(pending._pr.x, pending._pr.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
    }
    if (drag && drag.kind === 'atom' && snap) {
      const A = drag.atom._pr, B = snap._pr;
      ctx.strokeStyle = '#6ee7a8';
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(B.x, B.y, snap.el.r * B.s + 7, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function render(time) {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    for (const a of world.atoms) a._pr = project(a.p);

    const items = [];
    for (const b of world.bonds) {
      const pa = b.a._pr, pb = b.b._pr;
      const pm = project(mul(add(b.a.p, b.b.p), 0.5));
      if (b.type === 'ionic') {
        items.push({ z: pm.z, draw: () => drawIonicBond(b, pa, pb, time) });
        continue;
      }
      const dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const hl = hover && hover.bond === b;
      items.push({ z: (pa.z + pm.z) / 2, draw: () => { ctx.save(); if (hl) { ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 14; } drawStickHalf(b, pa, pm, b.a.el.color, nx, ny, (pa.s + pm.s) / 2); ctx.restore(); } });
      items.push({ z: (pb.z + pm.z) / 2, draw: () => { ctx.save(); if (hl) { ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 14; } drawStickHalf(b, pb, pm, b.b.el.color, nx, ny, (pb.s + pm.s) / 2); ctx.restore(); } });
      if (opts.elec) items.push({ z: pm.z - 3, draw: () => drawElectrons(b, pa, pb, time) });
    }
    for (const a of world.atoms) {
      items.push({ z: a._pr.z, draw: () => drawAtom(a, a._pr) });
      if (opts.lp) {
        for (const d of a.dom) {
          const q = project(add(a.p, mul(d.v, a.el.r + 14)));
          items.push({ z: q.z, draw: () => drawDomain(a, d, time) });
        }
      }
    }
    items.sort((x, y) => y.z - x.z);          // far first, near last
    for (const it of items) it.draw();
    drawOverlays();
  }

  /* ======================================================================
     ANALYSIS PANEL
     ====================================================================== */
  const analysisEl = $('analysis');
  const TYPE_LABEL = { nonpolar: 'Nonpolar covalent', polar: 'Polar covalent', ionic: 'Ionic' };

  function cardHTML(m) {
    const sel = selected && m.atoms.includes(selected);
    const g = m.geometry;
    let shape = g.text;
    if (g.measured !== undefined) {
      shape += ` <small>${g.axe} · ${g.measured}°${g.ideal ? ' (ideal ' + g.ideal + '°)' : ''}</small>`;
    }
    const pol = m.polarity.polar === undefined ? m.polarity.text : (m.polarity.polar ? '<span style="color:#ffb703">Polar</span>' : 'Nonpolar');
    const rows = m.bondGroups.map((q) => `
      <li>
        <span class="b-sym">${q.x}${ORDER_SIGN[q.order]}${q.y}</span>
        <span class="b-count">×${q.count}</span>
        <span class="t-chip t-${q.type}">${TYPE_LABEL[q.type]}</span>
        <span class="b-den">ΔEN ${q.den.toFixed(2)}</span>
      </li>`).join('');
    const open = Object.entries(m.open).map(([s, n]) => `${s} needs ${n} more bond${n > 1 ? 's' : ''}`).join(' · ');
    return `
      <article class="mol ${sel ? 'is-selected' : ''}">
        <header>
          <div class="formula">${m.formulaHTML}</div>
          <div class="mname ${m.name ? '' : 'muted'}">${m.name || (m.complete ? 'Unnamed structure' : 'Incomplete structure')}</div>
        </header>
        <div class="badges">
          <span class="badge">${m.kind}</span>
          <span class="badge ${m.complete ? 'ok' : 'warn'}">${m.complete ? 'All valences filled' : 'Open valences'}</span>
        </div>
        <dl>
          <dt>Molar mass</dt><dd>${m.mass.toFixed(2)} g/mol</dd>
          <dt>Atoms · bonds</dt><dd>${m.atoms.length} · ${m.bonds.length}</dd>
          <dt>Shape</dt><dd>${shape}</dd>
          <dt>Polarity</dt><dd>${pol}</dd>
        </dl>
        ${m.bonds.length ? `<h4>Bonds</h4><ul class="bonds">${rows}</ul>` : ''}
        ${open ? `<p class="open-list">${open}</p>` : ''}
      </article>`;
  }

  function updateAnalysis() {
    infos = analyzeMolecules();
    const html = infos.length
      ? infos.slice(0, 8).map(cardHTML).join('') + (infos.length > 8 ? `<p class="hint">…and ${infos.length - 8} more.</p>` : '')
      : '<div class="none">Nothing here yet. Add atoms or load a preset to see its formula, shape, polarity and bond types.</div>';
    if (html !== lastHTML) { analysisEl.innerHTML = html; lastHTML = html; }
    $('emptyHint').classList.toggle('hidden', world.atoms.length > 0);
  }

  /* ======================================================================
     MAIN LOOP
     ====================================================================== */
  function frame(now) {
    const time = now / 1000;
    physicsStep(); physicsStep();
    if (opts.rotate && !drag) cam.yaw += 0.006;
    frameNo++;
    if (world.version !== lastVersion || frameNo % 10 === 0) {
      lastVersion = world.version;
      updateAnalysis();
    }
    render(time);
    requestAnimationFrame(frame);
  }

  // Start with a friendly example so the stage is never blank on first load.
  loadPreset(PRESETS.find((p) => p.title === 'Water'));
  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
  else initUI();
}
