// ================= LEGENDARY PARTNERS (v166) =================
// A legendary or mythical Pokémon is nobody's for good. It stays with a trainer for 3–5 seasons (rolled when it
// joins; a baby legendary counts from its catch), then moves on in the offseason. Between partners it waits in
// the League where it was first found (S.legendPool, one per League), keeping its lifetime stats, awards and IVs.
// The next trainer to find it, catch it or be given it gets that same Pokémon, at their own level. A legendary
// never goes back to a trainer it has already been with. Ultra Beasts and Paradox Pokémon are not covered.
const LEGEND_TENURE = [5, 8]; // (0.37.0, the owner: longer with everyone; was 3 to 5)
// v184: Missingno stays longer, and can glitch away mid-season
const GLITCH_TENURE = [6, 10], GLITCH_CHANCE = 0.0005, GLITCH_LEAVE = 0.001;
const LEG_UB_LINES = new Set(BABY_LEGENDS.filter(b => { const q = [b]; while (q.length) { const n = q.shift(); if (SP[n].ub || ULTRA_BEASTS.includes(n)) return true; for (const e of SP[n].evos || []) q.push(e.to); } return false; }));
function isLegendLine(sp) {
  const s = SP[sp]; if (!s || s.ub || s.paradox || ULTRA_BEASTS.includes(sp)) return false;
  if (s.legend) return true;
  const b = LINE[sp] || sp;
  return BABY_LEGENDS.includes(b) && !LEG_UB_LINES.has(b) && SP[b].label !== 'One of a kind';
}
// (0.20.0) one of each legendary in the world: the waiting pool is the world's (S.wPool), not each League's
const legendPool = () => S.wPool || (S.wPool = []);
const lineOf = sp => LINE[sp] || sp;
// the individual of this line waiting in the bound League (the most experienced, should there ever be two)
function pooledLegend(sp) { const b = lineOf(sp); return legendPool().filter(m => lineOf(m.sp) === b).sort((x, y) => ((y.st && y.st.b) || 0) - ((x.st && x.st.b) || 0))[0] || null; }
const wasPartner = (t, m) => !!(t && m && (m.partners || []).some(p => p.id === t.id));
// a legendary never chooses the same trainer twice
// v194: or it's banned in the trainer's League
const legendBlocked = (t, sp) => (isLegendLine(sp) && wasPartner(t, pooledLegend(sp))) || bannedIn(sp, lgOf(t));
// v184: one legendary at a time. A trainer who already holds a legendary (or has one on its way to them) is passed over by
// any legendary that chooses, and can take part in a contested event (encounter, storm, roamer, rare find) but not win it.
function legendFull(t) {
  if (!t || !t.team) return false;
  if (t.team.some(m => isLegendLine(m.sp))) return true;
  return (S.legendGifts || []).some(g => g.id === t.id);
}
const statSnap = m => { const x = m.st || {}; return { b: x.b || 0, w: x.w || 0, l: x.l || 0, ko: x.ko || 0 }; };
// a legendary-line Pokémon joins t: if this League's one is waiting, t gets that one (same Pokémon, t's level and
// the joining details of `fresh`); otherwise `fresh` itself starts its story. Returns the Pokémon to put on the team.
function claimLegend(t, fresh) {
  if (!fresh || !isLegendLine(fresh.sp)) return fresh;
  let m = fresh;
  const p = pooledLegend(fresh.sp);
  if (p && !wasPartner(t, p)) {
    S.wPool = legendPool().filter(x => x !== p);
    m = p;
    m.lvl = fresh.lvl; m.met = fresh.met; m.metFr = fresh.metFr; m.fr = fresh.fr; m.gift = fresh.gift; m.cap = fresh.cap;
    m.form = 0; m.ss = null; m.item = null; delete m.bond;
    if (fresh.wormhole) m.wormhole = true;
    refreshMoves(m);
  }
  if (m.lgHome == null) m.lgHome = S.lg || 0;
  const n = isGlitch(m.sp) ? ri(GLITCH_TENURE[0], GLITCH_TENURE[1]) : ri(LEGEND_TENURE[0], LEGEND_TENURE[1]);
  m.leg = { until: curSeason() + n - 1, n };
  (m.partners = m.partners || []).push({ id: t.id, name: dn(t), from: curSeason(), to: null, at: statSnap(m) });
  if (m !== fresh && m.partners.length > 1) news(`${m.sp} has a new partner: ${dn(t)}. It was last with ${m.partners[m.partners.length - 2].name}.`, 'title', t.id);
  return m;
}
// a legendary leaves t (moved on, released, or its trainer retired): it goes back to the League it was first found in
function releaseLegend(t, m, why) {
  if (!m || !isLegendLine(m.sp) || !m.partners) return false;
  const p = m.partners.find(x => x.id === t.id && x.to == null);
  if (p) { p.to = S.season || 1; const now = statSnap(m); p.st = { b: now.b - p.at.b, w: now.w - p.at.w, l: now.l - p.at.l, ko: now.ko - p.at.ko }; p.why = why; }
  if (t.mega && t.mega.uid === m.uid) t.mega.uid = null;
  m.leg = null; m.cap = null; m.gift = null;
  if (!legendPool().includes(m)) legendPool().push(m);
  return true;
}
// offseason: legendaries whose time is up move on (never leaving a trainer with no Pokémon)
function legendDepartures() {
  for (const t of Object.values(S.trainers)) {
    if (['retired', 'prospect'].includes(t.role)) continue;
    for (const m of t.team.slice()) {
      if (!m.leg || m.leg.until > S.season || !isLegendLine(m.sp)) continue;
      if (t.team.length <= 1) { m.leg.until = S.season + 1; continue; }
      const seasons = (S.season || 1) - ((m.partners || []).slice(-1)[0] || { from: S.season }).from + 1;
      farewell(t, m, `moved on after ${seasons} year${seasons === 1 ? '' : 's'}`);
      t.team = t.team.filter(x => x !== m);
      inLeague(homeLeague(t), () => news(`${m.sp} moved on from ${dn(t)} after ${seasons} year${seasons === 1 ? '' : 's'} together. It will wait for a new partner.`, 'title', t.id));
      if (STAFF_ROLES.includes(t.role)) inLeague(lgOf(t), () => backfillElite(t, m));
    }
  }
}
// v173: when a legendary leaves a Gym Leader, an Elite Four member or the Champion, the empty spot goes to one of
// that trainer's own former Pokémon: first one set aside on their bench, then one from their former Pokémon list
// (left behind on promotion, swapped out, released…) that isn't on anyone's team now and isn't a legendary.
// On-type Pokémon and ones with a longer record come first; nothing from the same evolution line as a teammate.
// Only if they've never had another Pokémon does the League assign a new one, as before.
function backfillElite(t, gone) {
  const slot = eliteSlot(t); if (!slot) return;
  const onTeam = new Set(); for (const x of Object.values(S.trainers)) for (const m of x.team || []) onTeam.add(m.uid);
  while (t.team.length < slot.size) {
    const lines = new Set(t.team.map(m => LINE[m.sp]));
    const gymStaff = (t.role === 'leader' || t.role === 'gymtrainer') && !!t.specialty;
    const fits = sp => SP[sp] && !lines.has(LINE[sp]) && !isLegendLine(sp) && !SP[sp].legend && !SP[sp].ub && !bannedIn(sp, S.lg || 0) && (!gymStaff || onSpec(t, sp));
    const score = (sp, st, left) => (onSpec(t, sp) ? 1000 : 0) + Math.min(200, (st && st.b) || 0) + (left || 0) / 100 + SP[sp].bst / 1000;
    let back = null, how = '';
    const bench = (t.bench || []).filter(m => fits(m.sp));
    if (bench.length) {
      back = bench.sort((a, b) => score(b.sp, b.st) - score(a.sp, a.st))[0];
      t.bench = t.bench.filter(m => m !== back); how = 'bench';
    } else {
      const al = (t.alumni || []).filter(a => !a.legendRef && a.uid != null && !onTeam.has(a.uid) && fits(a.sp));
      const a = al.sort((x, y) => score(y.sp, y.st, y.left) - score(x.sp, x.st, x.left))[0];
      if (a) {
        back = { uid: a.uid, sp: a.sp, lvl: a.lvl || slot.lvl, st: a.st || blankStat(), met: a.met, nat: a.nat, iv: a.iv, fr: Math.max(a.fr || 70, 120), cov: a.cov, abSlot: a.abSlot, deltaAb: a.deltaAb, radAb: a.radAb,
          evoLog: a.evoLog, best: a.best, sweeps: a.sweeps, megas: a.megas, bonds: a.bonds, awards: a.awards, alpha: a.alpha, shiny: a.shiny, radiant: a.radiant, delta: a.delta, lucky: a.lucky, pkrs: a.pkrs };
        for (const k of Object.keys(back)) if (back[k] === undefined) delete back[k];
        ensureMon(back);
        t.alumni = t.alumni.filter(x => x !== a); how = a.why ? `(${a.why} in Year ${a.left})` : '';
      }
    }
    if (back) {
      back.rejoined = (back.rejoined || []).concat({ season: curSeason(), for: gone.sp });
      onTeam.add(back.uid); t.team.push(back);
      news(`${back.sp} is back on ${dn(t)}'s team, taking the spot ${gone.sp} left${how === 'bench' ? ' (it had been set aside)' : how ? ' ' + how : ''}.`, 'move', t.id);
    } else {
      const fresh = staffPicks(t, slot.lvl, 1, { lines, team: t.team, mixed: t.role === 'champion' || !t.specialty })[0];
      if (!fresh) break;
      stamp(fresh, 'assigned'); t.team.push(fresh);
      news(`${dn(t)} had no former Pokémon to bring back, so the League assigned ${fresh.sp} to fill the spot ${gone.sp} left.`, 'move', t.id);
    }
  }
  relevelElite(t);
}

// ================= SEASON =================
function challengers() { return S.challengers.map(T); }

const SHINY_CHANCE = 0.004; // per wild Pokémon offered
// Delta Pokémon: rarer than alphas but more common than shinies. They keep their primary type but have an unusual secondary type (a
// single-type Pokémon gains one), with outstanding IVs. The Delta type stays through evolution.
const DELTA_CHANCE = 0.008; // twice as common as shinies, about half as common as alphas
function monTypes(m) {
  const base = SP[m.sp].types; if (!m.delta) return base;
  return base[0] === m.delta ? [base[0]] : [base[0], m.delta];
}
// an unusual type: one that appears nowhere in the Pokémon's evolution line
function rollDelta(sp) { const own = lineTypes(sp); const pool = TYPES.filter(t => !own.has(t)); return pick(pool.length ? pool : TYPES); }
function makeDelta(o) { o.delta = rollDelta(o.sp); if (o.moves) refreshMoves(o); if (o.abSlot) o.abSlot = rollAbSlot(o); if (!o.shiny) o.iv = ivSet(() => ri(28, 31)); return o; }
// v200: Radiant Pokémon. Rarer than shinies. A Radiant wears its species' shiny image, always has at least Good IVs (every IV 16+),
// and always has an ability its line never has that is stronger in battle than any of the line's own. It replaces the
// Pokémon's own ability and stays through evolution.
const RADIANT_CHANCE = 0.003;
// how much an ability does in battle: 5 the strongest, 0 a drawback; anything unlisted is 2
const AB_TIER = {};
[[5, 'Huge Power,Pure Power,Speed Boost,Adaptability,Multiscale,Shadow Shield,Protean,Magic Guard,Beast Boost,Intrepid Sword,Gorilla Tactics,Protosynthesis,Quark Drive,Orichalcum Pulse,Hadron Engine,Tera Shell,Sword of Ruin,Beads of Ruin,Chilling Neigh,Grim Neigh'],
 [4, "Intimidate,Regenerator,Moxie,Tough Claws,Sheer Force,Unaware,Drought,Drizzle,Sand Stream,Snow Warning,Electric Surge,Psychic Surge,Grassy Surge,Misty Surge,Fluffy,Ice Scales,Fur Coat,Prism Armor,Dauntless Shield,Tablets of Ruin,Vessel of Ruin,Soul-Heart,Simple,Contrary,Serene Grace,Good as Gold,Magic Bounce,Shadow Tag,Wonder Guard,Dragon's Maw,Steelworker,Transistor,Download,Fairy Aura,Dark Aura,Sharpness,Strong Jaw,Mega Launcher,Skill Link"],
 [3, "Technician,Guts,Levitate,Thick Fat,Filter,Solid Rock,Sturdy,Mold Breaker,Teravolt,Turboblaze,Swift Swim,Chlorophyll,Sand Rush,Slush Rush,Sand Force,Solar Power,Flash Fire,Water Absorb,Volt Absorb,Sap Sipper,Lightning Rod,Storm Drain,Motor Drive,Dry Skin,Poison Heal,Prankster,Gale Wings,Victory Star,Natural Cure,Marvel Scale,Hustle,No Guard,Defiant,Competitive,Full Metal Body,Analytic,Berserk,Illusion,Toxic Chain,Poison Puppeteer,Mind's Eye,Iron Barbs,Rough Skin,Cursed Body,Flower Gift,Battery,Power Spot,Unseen Fist,Iron Fist,Punk Rock,Pixilate,Refrigerate,Galvanize,Reckless,Heatproof,Corrosion,Bad Dreams,Triage"],
 [0, 'Truant,Slow Start,Defeatist,Run Away,Pickup,Rattled,Wimp Out,Emergency Exit,Wandering Spirit,Mummy,Aura Break,Klutz']].forEach(([n, l]) => l.split(',').forEach(k => { AB_TIER[k] = n; }));
const abTier = k => AB_TIER[k] ?? 2;
// abilities that only make sense with one Pokémon's own forms or body, so they never come as a Radiant ability
const RADIANT_NEVER = new Set(['Glitch', 'Zero to Hero', 'Gulp Missile', 'Hunger Switch', 'Schooling', 'Shields Down', 'Disguise', 'Ice Face', 'Stance Change', 'Multitype', 'RKS System', 'Forecast', 'Mimicry']);
// abilities that only pay off for a physical (or special) attacker, or for certain types
const AB_PHYS = new Set(['Huge Power', 'Pure Power', 'Gorilla Tactics', 'Hustle', 'Moxie', 'Tough Claws', 'Guts', 'Intrepid Sword', 'Sword of Ruin', 'Chilling Neigh', 'Orichalcum Pulse', 'Sharpness', 'Strong Jaw', 'Iron Fist', 'Reckless', 'Unseen Fist', 'Anger Point']);
const AB_SPEC = new Set(['Grim Neigh', 'Soul-Heart', 'Beads of Ruin', 'Solar Power', 'Mega Launcher', 'Berserk', 'Punk Rock']);
const AB_TYPES = { Drought: ['Fire', 'Grass'], 'Orichalcum Pulse': ['Fire'], Chlorophyll: ['Grass', 'Fire'], 'Solar Power': ['Fire', 'Grass'], 'Flower Gift': ['Grass'],
  Drizzle: ['Water'], 'Swift Swim': ['Water'], 'Sand Stream': ['Rock', 'Ground', 'Steel'], 'Sand Rush': ['Rock', 'Ground', 'Steel'], 'Sand Force': ['Rock', 'Ground', 'Steel'],
  'Snow Warning': ['Ice'], 'Slush Rush': ['Ice'], 'Electric Surge': ['Electric'], 'Hadron Engine': ['Electric'], Transistor: ['Electric'], 'Psychic Surge': ['Psychic'],
  'Grassy Surge': ['Grass'], 'Misty Surge': ['Fairy'], 'Fairy Aura': ['Fairy'], 'Dark Aura': ['Dark'], "Dragon's Maw": ['Dragon'], Steelworker: ['Steel'], 'Gale Wings': ['Flying'],
  Corrosion: ['Poison'], 'Toxic Chain': ['Poison'], 'Poison Puppeteer': ['Poison'], 'Bad Dreams': ['Dark'], 'Battery': ['Electric'], Pixilate: ['Normal'], Refrigerate: ['Normal'], Galvanize: ['Normal'] };
function lineAbilities(sp) { const root = LINE[sp] || sp, out = new Set(), q = [root]; while (q.length) { const n = q.shift(); Object.values(SPECIES_AB[n] || {}).forEach(a => a && out.add(a)); for (const e of SP[n].evos || []) q.push(e.to); } return out; }
function rollRadiantAbility(o) {
  const own = lineAbilities(o.sp), b = bsOf(o.sp), phys = b.atk >= b.spa, tys = monTypes(o);
  const best = Math.max(0, ...[...own].filter(k => ABILITIES[k]).map(abTier));
  const fits = k => ABILITIES[k] && !own.has(k) && !RADIANT_NEVER.has(k) && !(AB_PHYS.has(k) && !phys) && !(AB_SPEC.has(k) && phys) && !(AB_TYPES[k] && !AB_TYPES[k].some(t => tys.includes(t)));
  const all = Object.keys(ABILITIES).filter(fits);
  // stronger than anything its line has; a line that already has a top ability gets a different top one
  let pool = all.filter(k => abTier(k) > best); if (!pool.length) pool = all.filter(k => abTier(k) >= Math.min(5, best));
  if (!pool.length) return null;
  // stronger abilities, and ones made for its type, turn up more often
  const w = pool.map(k => (abTier(k) >= 5 ? 3 : abTier(k) === 4 ? 2 : 1) * (AB_TYPES[k] ? 3 : 1)); let r = rand() * w.reduce((a, x) => a + x, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
function makeRadiant(o) {
  o.radiant = true; o.shiny = undefined;
  o.iv = Object.fromEntries(STAT_KEYS.map(k => [k, Math.max((o.iv && o.iv[k]) || 0, ri(16, 31))]));
  o.radAb = rollRadiantAbility(o) || undefined;
  return o;
}
const ALPHA_CHANCE = 0.015; // per wild Pokémon offered, before the Scouting bonus (up to +1%)
const sctOf = t => t.r.sct;
function wildOffers(t) {
  const avg = t.team.length ? t.team.reduce((a, m) => a + m.lvl, 0) / t.team.length : 10;
  const L = Math.max(5, Math.round(avg - 3 + sctOf(t) / 40));
  const cap = 300 + Math.min(1, runWeeks(t) / 24) * 190 + sctOf(t) * 0.7 + (t.role === 'champion' ? 200 : 0) + (hasTrait(t, 'collector') ? 25 : 0);
  const luck = hasTrait(t, 'collector') ? 2 : 1;
  const items = [];
  for (const b of BASES) {
    const f = formAt(b, L, t.specialty); const s = SP[f];
    if (s.bst > cap || t.team.some(m => LINE[m.sp] === b) || !wildOk(b)) continue; // (0.27.0) only what the region has
    let w = SP[b].rare ? 0.12 + sctOf(t) / 400 : 1;
    const fit = specFit(t, f); if (fit) w *= fit === 2 ? 7 : t.spec2 ? 2.6 : 4;
    if (SP[b].starter) w *= 0.25;
    items.push([f, w]);
  }
  const out = [];
  const draw = list => {
    if (!list.length) return null;
    let tot = list.reduce((a, x) => a + x[1], 0), r = rand() * tot, j = 0;
    for (; j < list.length - 1; j++) { r -= list[j][1]; if (r <= 0) break; }
    const [f] = list[j];
    const k = items.findIndex(x => x[0] === f); items.splice(k, 1);
    // rarely, an alpha: guaranteed outstanding IVs and it arrives already hot. Scouting makes them a little more common.
    const alpha = featOn('alpha') && rand() < (ALPHA_CHANCE + sctOf(t) / 100 * 0.01) * luck;
    // even more rarely, a shiny: perfect IVs and it arrives on fire. It can be an alpha too.
    let o;
    if (featOn('shiny') && rand() < SHINY_CHANCE * luck) o = ensureMon({ sp: f, lvl: L, shiny: true, alpha: alpha || undefined, form: 3, iv: ivSet(31) });
    else if (alpha) o = ensureMon({ sp: f, lvl: L, alpha: true, form: 1.5, iv: ivSet(() => ri(28, 31)) });
    else o = ensureMon({ sp: f, lvl: L });
    if (featOn('delta') && rand() < DELTA_CHANCE * luck) makeDelta(o);
    if (featOn('radiant') && !o.shiny && rand() < RADIANT_CHANCE * luck) makeRadiant(o);
    return o;
  };
  // specialists mostly find Pokémon of their own type: two on-type slots, one open slot
  const onType = () => items.filter(x => onSpec(t, x[0]));
  // a dual specialist's two on-type slots go one to each type, so a big type like Normal can't crowd out the other
  const ofType = ty => items.filter(x => SP[x[0]].types.includes(ty));
  for (let k = 0; k < 3 && items.length; k++) {
    const pool = t.spec2 && k < 2 ? ofType(k === 0 ? t.specialty : t.spec2) : null;
    const o = pool && pool.length ? draw(pool) : (t.specialty && k < 2 && onType().length) ? draw(onType()) : draw(items);
    if (o) out.push(o);
  }
  // a mass outbreak this week: the open slot is the swarming species, much more often an alpha or a shiny
  const ob = activeOutbreak();
  if (ob && out.length && !t.team.some(m => LINE[m.sp] === LINE[ob.sp])) {
    const f = formAt(ob.sp, L, t.specialty);
    const alpha = featOn('alpha') && rand() < (ALPHA_CHANCE + sctOf(t) / 100 * 0.01) * luck * OUTBREAK_ALPHA;
    const shiny = featOn('shiny') && rand() < SHINY_CHANCE * luck * OUTBREAK_SHINY;
    out[out.length - 1] = shiny ? ensureMon({ sp: f, lvl: L, outbreak: true, shiny: true, alpha: alpha || undefined, form: 3, iv: ivSet(31) })
      : alpha ? ensureMon({ sp: f, lvl: L, outbreak: true, alpha: true, form: 1.5, iv: ivSet(() => ri(28, 31)) })
      : ensureMon({ sp: f, lvl: L, outbreak: true });
    if (featOn('delta') && rand() < DELTA_CHANCE * luck * OUTBREAK_ALPHA) makeDelta(out[out.length - 1]);
    if (featOn('radiant') && !out[out.length - 1].shiny && rand() < RADIANT_CHANCE * luck * OUTBREAK_SHINY) makeRadiant(out[out.length - 1]);
  }
  // very rarely, the open slot is a baby legendary instead
  let rareFind = false;
  if (featOn('rarefind') && out.length && rand() < BABY_CHANCE + sctOf(t) / 100 * 0.0015) { const free = legendFull(t) ? [] : freeBabies().filter(b => !legendBlocked(t, b)); if (free.length) { const b0 = pick(free), pb = pooledLegend(b0), b = pb ? pb.sp : b0; out[out.length - 1] = ensureMon({ sp: b, lvl: L, baby: true }); rareFind = true; catchNews(`${t.name} spotted a ${b} while exploring!`, 'circuit', t.id); } }
  // v184: rarer still, a legendary in the open slot: a sealed chamber, a hidden glade, a ring in the air
  if (featOn('greatlegends') && !rareFind && out.length && !legendFull(t) && rand() < LEGEND_FIND + sctOf(t) / 100 * 0.0008) {
    const free = FIND_LEGENDS.filter(sp => greatFree(sp) && !legendBlocked(t, sp) && !(sp === 'Shaymin' && S.week + 1 > 12));
    if (free.length) { const sp0 = regionPick(free), pl = pooledLegend(sp0), sp = pl ? pl.sp : sp0, lvl = Math.max(L, Math.floor(Math.max(...t.team.map(m => m.lvl), L)));
      out[out.length - 1] = ensureMon({ sp, lvl, legendFind: true, form: 1, iv: ivSet(() => ri(20, 31)) }); rareFind = true; }
  }
  // (0.20.0) Area Zero is open: now and then a Paradox Pokémon in the open slot
  if (featOn('rarefind') && !rareFind && out.length && areaZeroOpen() && rand() < PARADOX_FIND + sctOf(t) / 100 * 0.002) {
    const held = paradoxHeld(), free = PARADOX.filter(sp => !held.has(sp) && !bannedIn(sp, lgOf(t)));
    if (free.length) { const sp = pick(free), lvl = Math.max(L, Math.floor(Math.max(...t.team.map(m => m.lvl), L)));
      out[out.length - 1] = ensureMon({ sp, lvl, paradoxFind: true, form: 1, iv: ivSet(() => ri(20, 31)) }); rareFind = true; }
  }
  // a roaming legendary near this trainer's route (v182)
  if (featOn('roamers') && S.roamer && !rareFind) roamOffer(t, out, L);
  // an open Ultra Wormhole near this trainer: the Ultra Beast is waiting, at the level of their strongest Pokémon
  if (S.wormhole && S.wormhole.id === t.id && out.length && !ownedLegends().has(S.wormhole.sp)) {
    const lvl = Math.max(L, Math.floor(Math.max(...t.team.map(m => m.lvl), L)));
    out[out.length - 1] = ensureMon({ sp: S.wormhole.sp, lvl, wormhole: true, form: 1 });
  }
  // v194: nothing banned in the trainer's League turns up
  return out.filter(o => !bannedIn(o.sp, lgOf(t)));
}
function addCatch(t, offer, releaseUid) {
  // two trainers can spot the same baby legendary in a week; only the first to catch it gets it
  if (SP[offer.sp].baby && !freeBabies().includes(LINE[offer.sp])) return null;
  if (offer.wormhole && ownedLegends().has(offer.sp)) return null;
  if (bannedIn(offer.sp, lgOf(t))) return null;
  // two challengers can find the roamer in the same week; only the first to catch it gets it
  if (offer.roam && (!S.roamer || S.roamer.sp !== offer.sp || !greatFree(offer.sp))) return null;
  if (legendBlocked(t, offer.sp) || (isLegendLine(offer.sp) && legendFull(t))) return null;
  if (offer.legendFind && !greatFree(offer.sp)) return null;
  if (offer.paradoxFind && paradoxHeld().has(offer.sp)) return null;
  let m = stamp(ensureMon({ uid: uid(), sp: offer.sp, lvl: offer.lvl, iv: offer.iv, nat: offer.nat, cov: offer.cov, alpha: offer.alpha || undefined, shiny: offer.shiny || undefined, radiant: offer.radiant || undefined, radAb: offer.radAb || undefined, delta: offer.delta || undefined, deltaAb: offer.deltaAb || undefined, form: offer.alpha || offer.shiny ? offer.form : undefined }), 'caught');
  if (t.team.length >= 6) {
    const idx = releaseUid != null ? t.team.findIndex(x => x.uid === releaseUid) : -1;
    if (idx < 0) return null;
    farewell(t, t.team[idx], 'released for a new catch');
    t.team.splice(idx, 1);
  }
  if (t.role === 'champion') m.cap = Math.max(...t.team.map(x => x.cap || x.lvl), m.lvl);
  m = claimLegend(t, m);
  t.team.push(m);
  if (SP[m.sp].baby) catchNews(`${t.name} caught ${m.sp}! It's the only one in the league.`, 'circuit', t.id);
  if (offer.wormhole && GREAT_LEGENDS.includes(m.sp)) recordGreat(t, m, 'caught');
  if (offer.roam) roamCaught(t, m);
  if (offer.legendFind) { m.met.how = 'find'; recordGreat(t, m, 'caught'); catchNews(`${dn(t)} found and caught ${m.sp}! ${FIND_STORY[m.sp] || ''}`, 'title', t.id); logSky(`${dn(t)} found ${m.sp}`); }
  if (offer.wormhole) { m.met.how = 'wormhole'; catchNews(`${t.name} caught ${SP[m.sp].ub ? 'the Ultra Beast ' : ''}${m.sp}!`, 'title', t.id); }
  return m;
}
// the strongest stat total anywhere in a Pokémon's line from here on: what it can grow into
function linePeak(sp) { let best = SP[sp].bst; const q = [sp]; while (q.length) { const n = q.shift(); best = Math.max(best, SP[n].bst); for (const e of SP[n].evos || []) q.push(e.to); } return best; }
const WILDCARD_PEAK = 500; // an off-type Pokémon this strong (at its peak) is worth a specialist's wildcard slot
// a specialist's wildcard: their best strong off-type Pokémon, if they have one
function wildcardOf(t) {
  if (!t.specialty) return null;
  const off = t.team.filter(m => !onSpec(t, m.sp) && linePeak(m.sp) >= WILDCARD_PEAK);
  return off.length ? off.reduce((a, b) => (monPower(a) * linePeak(a.sp) > monPower(b) * linePeak(b.sp) ? a : b)) : null;
}
function aiCatch(t) {
  const offers = wildOffers(t);
  if (!offers.length) return null;
  const onT = sp => onSpec(t, sp);
  const wild = wildcardOf(t);
  // specialists want one strong off-type Pokémon for coverage: until they have one, a strong off-type find rates like an on-type one
  const wildcardFit = o => t.specialty && !onT(o.sp) && !wild && linePeak(o.sp) >= WILDCARD_PEAK;
  const val = o => (o.roam || o.wormhole ? 1000 : SP[o.sp].baby ? 900 : Math.max(SP[o.sp].bst, wildcardFit(o) ? (SP[o.sp].bst + linePeak(o.sp)) / 2 : 0)) * (specFit(t, o.sp) === 2 ? 1.45 : onT(o.sp) || wildcardFit(o) ? 1.35 : 1) * (o.shiny ? 1.4 : 1) * (o.radiant ? 1.5 : 1) * (o.delta ? 1.3 : 1) * (o.alpha ? 1.3 : 1);
  // (0.21.0) gym memory: a catch that answers what beat them at their next gym is worth more, as Strategy allows
  const mem = gmemNext(t), lean = o => mem ? 1 + GMEM_CATCH * gmemLearn(t) * counterScore(SP[formAt(o.sp, GYM_LV[t.badges.length])].types, mem) : 1;
  const best = offers.reduce((a, b) => (val(a) * lean(a) > val(b) * lean(b) ? a : b));
  if (t.team.length < 6) return addCatch(t, best);
  // release off-type Pokémon first when the new catch fits the trainer's type, but keep the wildcard
  // AI trainers hang on to special Pokémon (alphas, shinies, Deltas, legendaries...); only a special catch can push one out
  let keepable = t.team.filter(m => !isSpecial(m));
  if (!keepable.length && isSpecial(best)) keepable = t.team.filter(m => !babyLine(m.sp));
  const offT = keepable.filter(m => !onT(m.sp) && m !== wild);
  const releasePool = onT(best.sp) ? (offT.length ? offT : keepable.filter(m => m !== wild)) : wildcardFit(best) ? keepable : keepable.filter(m => m !== wild);
  if (!releasePool.length) return null;
  const weakest = releasePool.reduce((a, b) => (monPower(a) < monPower(b) ? a : b));
  const swapEdge = onT(best.sp) && !onT(weakest.sp) ? 0.85 : wildcardFit(best) ? 0.95 : 1.08;
  // judge a wildcard by what it grows into, since it'll level up fast as a new catch
  const worth = (best.roam || best.wormhole ? 1000 : SP[best.sp].baby ? 900 : wildcardFit(best) ? (SP[best.sp].bst + linePeak(best.sp)) / 2 : SP[best.sp].bst) * Math.max(1, lean(best));
  if (best.lvl * worth > monPower(weakest) * 450 * swapEdge) return addCatch(t, best, weakest.uid);
  return null;
}
function aiAction(t) {
  if (S.wormhole && S.wormhole.id === t.id) return 'explore';
  if (wantsLegend(t)) return 'seek';
  return aiActionBase(t);
}
function aiActionBase(t) {
  const ob = activeOutbreak();
  if (ob && t.role === 'challenger' && !t.team.some(m => LINE[m.sp] === LINE[ob.sp])) {
    const fits = onSpec(t, formAt(ob.sp, 60, t.specialty)) || linePeak(ob.sp) >= 500;
    if (fits && rand() < 0.55) return 'explore';
  }
  // with no levels to gain, a run is spent building a roster and taking on the gyms: a challenger wants at
  // least as many Pokémon as the next gym's leader fields, and keeps looking for more now and then. With eight
  // badges they take on the Elite Four when ready: up to READY_WEEKS weeks spent filling the team to six first.
  const b = t.badges.length, n = t.team.length;
  if (b >= 8) { if (n < 6 && (t.ready || 0) < READY_WEEKS) { t.ready = (t.ready || 0) + 1; return 'explore'; } return 'league'; }
  // (0.21.0) between tries at a gym that beat them, a learner sometimes looks for a counter before going back in
  if (t.gymAt != null && triesAt(t, t.gymAt) > 0 && gmemNext(t) && rand() < GMEM_EXPLORE * gmemLearn(t)) return 'explore';
  if (n < Math.min(6, GYM_SIZE[b]) && rand() < 0.85) return 'explore';
  if (n < 6 && rand() < 0.25) return 'explore';
  return rand() < 0.1 ? 'train' : 'challenge';
}
// ================= SEASON AWARDS =================
// Handed out when the League ends. Trainers and Pokémon keep them (t.awards, m.awards), and each season's winners
// are stored with its history entry (h.awards).
const AWARDS = {
  toy:  { name: 'Trainer of the Year', short: 'Trainer of the Year' },
  roy:  { name: 'Rookie of the Year', short: 'Rookie of the Year' },
  mip:  { name: 'Most Improved Trainer', short: 'Most Improved' },
  gloy: { name: 'Gym Leader of the Year', short: 'Gym Leader of the Year' },
  e4oy: { name: 'Elite Four Member of the Year', short: 'Elite Four of the Year' },
  poy:  { name: 'Pokémon of the Year', short: 'Pokémon of the Year' },
  coy:  { name: 'Catch of the Year', short: 'Catch of the Year' },
};
// a challenger's year, scored: League runs and badges (year points), gym record and road wins
function seasonScore(t) {
  const wl = t.weekLog || [];
  const gw = wl.filter(w => w.act === 'challenge' && w.won).length, gl = wl.filter(w => w.act === 'challenge' && w.won === false).length;
  const rw = wl.filter(w => w.road && w.road.won).length;
  return trainerPoints(t) * 2 + gw - gl * 0.5 + rw * 0.5;
}
const monYear = m => (m.ss && m.ss.season === S.season && m.ss.b >= 6 ? m.ss.ko * 2 + m.ss.w + m.ss.lw * 3 + (m.ss.dmg || 0) / 2500 : 0);
function giveAward(k, t, m, why) {
  (t.awards = t.awards || []).push({ k, season: S.season, lg: S.lg || 0 });
  if (m) (m.awards = m.awards || []).push({ k, season: S.season, lg: S.lg || 0 });
  return { k, id: t.id, name: dn(t), uid: m ? m.uid : null, sp: m ? m.sp : null, why };
}
function seasonAwards(L) {
  const out = [];
  const cands = [...new Set([...S.challengers, ...L.entries.map(e => e.id)])].map(T).filter(t => t && t.role !== 'retired' && t.seasonHist && t.seasonHist.length);
  // a challenger can make several runs in a year: their best League run is the one that counts
  const bestRun = t => L.entries.filter(x => x.id === t.id).sort((a, b) => b.stage - a.stage)[0];
  const scored = cands.map(t => ({ t, s: seasonScore(t), e: bestRun(t) })).sort((a, b) => b.s - a.s);
  const res = x => { const b = yearOf(x.t).b; return x.e ? (x.e.stage === 5 ? 'won the title' : x.e.stage === 4 ? 'reached the title match' : `reached Elite Four #${x.e.stage + 1}`) : `${b} badge${b === 1 ? '' : 's'} in their best run`; };
  if (scored[0]) out.push(giveAward('toy', scored[0].t, null, res(scored[0])));
  // no rookie award in the founding season, when everyone is new
  const rook = S.season > 1 && scored.find(x => x.t.seasonHist.length === 1 && x.t.joined === S.season);
  if (rook) out.push(giveAward('roy', rook.t, null, res(rook)));
  const imp = cands.filter(t => t.seasonHist.length >= 2 && t.seasonHist[t.seasonHist.length - 2].season === S.season - 1 && t.seasonHist[t.seasonHist.length - 2].pts != null)
    .map(t => { const h = t.seasonHist, a = h[h.length - 2], b = h[h.length - 1]; return { t, d: (b.pts - a.pts) + (b.ovr - a.ovr) * 0.25, from: a.pts, to: b.pts }; })
    .filter(x => x.d > 0).sort((a, b) => b.d - a.d)[0];
  if (imp) out.push(giveAward('mip', imp.t, null, `${imp.from} → ${imp.to} year points`));
  const gl = S.gyms.map((g, i) => ({ g, i, t: T(g.leader) })).filter(x => x.t && x.g.w + x.g.l >= 5).sort((a, b) => b.g.w / (b.g.w + b.g.l) - a.g.w / (a.g.w + a.g.l) || b.g.w - a.g.w)[0];
  if (gl) out.push(giveAward('gloy', gl.t, null, `${townName(gl.i)} Gym, ${gl.g.w}–${gl.g.l}`));
  const e4 = S.e4.map(id => T(id)).filter(Boolean).map(t => ({ t, w: L.entries.filter(e => e.lostTo === t.id).length })).filter(x => x.w > 0).sort((a, b) => b.w - a.w)[0];
  if (e4) out.push(giveAward('e4oy', e4.t, null, `stopped ${e4.w} challenger${e4.w === 1 ? '' : 's'}`));
  const mons = [];
  // Gym Leaders' Pokémon battle every week and have their own award, so Pokémon of the Year goes to everyone else's
  for (const t of leagueTrainers()) if (!['retired', 'leader'].includes(t.role) && t.team) for (const m of t.team) mons.push({ t, m, v: monYear(m) });
  mons.sort((a, b) => b.v - a.v);
  if (mons[0] && mons[0].v > 0) { const { t, m } = mons[0]; out.push(giveAward('poy', t, m, `${m.ss.ko} KOs, ${m.ss.w}–${m.ss.l}`)); }
  const rare = m => (m.shiny ? 14 : 0) + (m.radiant ? 16 : 0) + (m.delta ? 12 : 0) + (m.alpha ? 6 : 0) + (SP[m.sp].legend ? 10 : 0) + (SP[m.sp].baby || babyLine(m.sp) ? 10 : 0);
  const caught = mons.filter(x => x.m.met && x.m.met.season === S.season && ['caught', 'wormhole'].includes(x.m.met.how)).map(x => ({ ...x, c: x.v + rare(x.m) })).sort((a, b) => b.c - a.c)[0];
  if (caught) { const { t, m } = caught; const tag = [m.radiant && 'Radiant', m.shiny && 'shiny', m.delta && 'Delta', m.alpha && 'alpha'].filter(Boolean).join(' '); out.push(giveAward('coy', t, m, `${tag ? tag + ', ' : ''}caught in ${weekName(m.met.week - 1)}`)); }
  return out;
}
// ================= LEGACY TRAINERS =================
// When a notable trainer retires, there's a chance that some seasons later their child sets out as a challenger: same
// specialty, a strong potential, often the same trait, and a starter from their parent's signature line.
function legacyChance(t) {
  if (t.famous) return 0;
  const aw = t.awards || [];
  let p = 0;
  if (t.career.titles >= 1) p = Math.max(p, 0.65);
  if (aw.some(a => a.k === 'toy')) p = Math.max(p, 0.55);
  if (t.prevRole === 'e4' || (t.career.e4Wins || 0) >= 10) p = Math.max(p, 0.4);
  if (aw.length || t.prevRole === 'leader' || (t.seasonHist || []).filter(h => h.badges === 8).length >= 3) p = Math.max(p, 0.25);
  return p;
}
function scheduleLegacy(t) {
  const p = featOn('legacy') ? legacyChance(t) : 0; if (!p || rand() >= p) return;
  (S.legacyQueue = S.legacyQueue || []).push({ parent: t.id, at: S.season + ri(2, 10) });
}
// the parent's signature line: the Pokémon that battled most for them, if it's an ordinary line. Legendaries, rare
// finds and other one-of-a-kind Pokémon are never passed down: only one of each can exist at a time.
const legacyTop = p => (p.team || []).concat(p.alumni || []).filter(m => m.st && m.st.b).sort((a, b) => b.st.b - a.st.b)[0] || null;
const oneOfAKind = sp => !!(SP[sp].legend || SP[sp].baby || babyLine(sp) || SP[sp].ub || SP[sp].paradox);
function legacyLine(p) {
  const all = (p.team || []).concat(p.alumni || []).filter(m => m.st && m.st.b);
  all.sort((a, b) => b.st.b - a.st.b);
  for (const m of all) { const base = LINE[m.sp]; if (base && SP[base] && BASES.includes(base) && !SP[base].legend && !SP[base].baby && !babyLine(base)) return base; }
  return null;
}
function makeLegacy(q) {
  const p = T(q.parent); if (!p) return null;
  const age = ri(11, 16);
  const t = newTrainer({ age, quality: ri(46, 58) + Math.max(0, age - 14), role: 'prospect', specialty: p.specialty === undefined ? undefined : p.specialty, noFamous: true });
  if (p.spec2 && t.specialty === p.specialty) t.spec2 = p.spec2;
  if (p.trait && rand() < 0.5) t.trait = p.trait;
  t.pot = clamp(Math.max(t.pot, ovr(t) + ri(16, 26)), ovr(t), 99);
  t.legacy = { parent: p.id, name: dn(p) };
  (p.children = p.children || []).push(t.id);
  starterTeam(t, 9);
  const base = legacyLine(p);
  if (base) {
    const m = stamp(makeMon(base, 9, t.specialty), 'starter'); m.met.how = 'legacy'; m.met.from = p.id;
    if (t.team.length) t.team[0] = m; else t.team.push(m);
  }
  const top = legacyTop(p), skipped = top && oneOfAKind(top.sp) ? top.sp : null;
  if (skipped) t.legacy.skipped = skipped;
  news(`Legacy prospect: ${dn(t)}, child of ${dn(p)}, is setting out as a challenger${base ? ` with a ${t.team[0].sp} from the family line` : ''}.${skipped ? ` ${p.name}'s ${skipped} couldn't be passed down: only one of each legendary can exist at a time.` : ''}`, 'circuit', t.id);
  return t;
}
// ================= GREAT LEGENDARY EVENTS =================
// The 22 box-art legendaries (GREAT_LEGENDS) only enter the world through story triggers. Two kinds:
//  - encounters (S.legend): the legendary appears near a town for 5 weeks; any challenger can spend a week seeking it.
//    v177: every attempt is one battle against it at full strength (raid HP), and each trainer's damage adds up to
//    their own total. Once the combined damage reaches LEGEND_BARS full defeats it's worn down, and when that happens,
//    or when its time runs out, it goes to the trainer who did the most damage (a tie is settled by a battle).
//    Each attempt rolls the challenger's luck for the day, so the same team can do brilliantly one week and struggle
//    the next. A failed attempt still earns experience, more the more damage it did. At most one encounter a season.
//  - gifts: the legendary chooses a trainer and joins them with no battle (a reward for something rare).
const LEGEND_HP = 7, LEGEND_WEEKS = 5, LEGEND_AI = 0.22, LEGEND_LV = 18, LEGEND_BARS = 4, LEGEND_LUCK = [0.5, 2];
// the challenger's luck for one attempt: from x0.5 to x2, centred on x1 and usually somewhere in between
function legendLuck() { const lo = Math.log(LEGEND_LUCK[0]), hi = Math.log(LEGEND_LUCK[1]); return Math.exp(lo + (hi - lo) * (rand() + rand()) / 2); }
// damage totals per trainer (an encounter from an older save starts its tally afresh)
function legendState(L) { if (L && !L.dmg) { L.dmg = {}; L.tries = {}; L.total = 0; } return L; }
const legendRank = L => Object.entries(legendState(L).dmg).map(([id, d]) => ({ id: +id, d, n: L.tries[id] || 0 })).sort((a, b) => b.d - a.d);
const greatFree = sp => !ownedLegends().has(sp) && !legendElsewhere(sp) && !bannedIn(sp, S.lg || 0);
// (0.20.0) a legendary another League's event or gift has in hand (an encounter, a roamer, a storm, a wormhole, a gift on
// its way) can't turn up here too: there is one of each in the world. (0.31.0) One for each region of the world that has
// it at home (`legendCap`): true when those held and those other Leagues' events have in hand fill its places
function legendElsewhere(sp) {
  let n = legendHeld(sp);
  for (let i = 0; i < nLeagues(); i++) {
    if (i === (S.lg || 0)) continue;
    const L = S.leagues[i]; if (!L) continue;
    for (const x of [L.legend, L.roamer, L.storm, L.wormhole]) if (x && x.sp === sp) n++;
    n += (L.legendGifts || []).filter(g => g.sp === sp).length;
  }
  return n >= legendCap(sp);
}
const everCaught = sp => !!(S.greatCaught && S.greatCaught[sp]);
// (0.20.0) legendaries belong to a region (all nine since 0.28.0): an event for one of a region's own turns up about
// LEGEND_HOME_MUL times as often in a League of that region and LEGEND_AWAY_MUL as often elsewhere; the rest as before
const BUILTIN_LEGEND_HOME = { Articuno: 0, Zapdos: 0, Moltres: 0, Mewtwo: 0, Mew: 0, Raikou: 1, Entei: 1, Suicune: 1, Lugia: 1, 'Ho-Oh': 1, Celebi: 1,
  Regirock: 2, Regice: 2, Registeel: 2, Latias: 2, Latios: 2, Kyogre: 2, Groudon: 2, Rayquaza: 2, Jirachi: 2, Deoxys: 2,
  Uxie: 3, Mesprit: 3, Azelf: 3, Dialga: 3, Palkia: 3, Giratina: 3, Heatran: 3, Regigigas: 3, Cresselia: 3, Darkrai: 3, Shaymin: 3, Manaphy: 3, Arceus: 3, Phione: 3, Enamorus: 3, 'Bloodmoon Ursaluna': 3,
  // (0.28.0) the later regions
  Victini: 4, Cobalion: 4, Terrakion: 4, Virizion: 4, Tornadus: 4, Thundurus: 4, Landorus: 4, Reshiram: 4, Zekrom: 4, Kyurem: 4, Keldeo: 4, Meloetta: 4, Genesect: 4,
  Xerneas: 5, Yveltal: 5, Zygarde: 5, 'Zygarde 10%': 5, Diancie: 5, Hoopa: 5, Volcanion: 5, 'Eternal Flower Floette': 5,
  'Type: Null': 6, Silvally: 6, 'Tapu Koko': 6, 'Tapu Lele': 6, 'Tapu Bulu': 6, 'Tapu Fini': 6, Cosmog: 6, Cosmoem: 6, Solgaleo: 6, Lunala: 6, Necrozma: 6, Magearna: 6, Marshadow: 6, Zeraora: 6, Meltan: 6, Melmetal: 6,
  Nihilego: 6, Buzzwole: 6, Pheromosa: 6, Xurkitree: 6, Celesteela: 6, Kartana: 6, Guzzlord: 6, Poipole: 6, Naganadel: 6, Stakataka: 6, Blacephalon: 6,
  Zacian: 7, Zamazenta: 7, Eternatus: 7, Kubfu: 7, 'Urshifu (Single Strike)': 7, 'Urshifu (Rapid Strike)': 7, Zarude: 7, Regieleki: 7, Regidrago: 7, Glastrier: 7, Spectrier: 7, Calyrex: 7,
  'Galarian Articuno': 7, 'Galarian Zapdos': 7, 'Galarian Moltres': 7,
  'Wo-Chien': 8, 'Chien-Pao': 8, 'Ting-Lu': 8, 'Chi-Yu': 8, Koraidon: 8, Miraidon: 8, Okidogi: 8, Munkidori: 8, Fezandipiti: 8, Ogerpon: 8, Terapagos: 8, Pecharunt: 8 };
// (0.30.0) the bound world's homes, from its regions' legends (applyRegions)
let LEGEND_HOME = BUILTIN_LEGEND_HOME;
// (0.31.0) every region a legendary is at home in (a custom region can share one with its built-in home, or with another
// custom region): the world holds one of it for each, at most
let LEGEND_HOMES = {};
const legendHomes = sp => LEGEND_HOMES[sp] || (LEGEND_HOME[sp] != null ? [LEGEND_HOME[sp]] : []);
const legendCap = sp => Math.max(1, legendHomes(sp).length);
const LEGEND_HOME_MUL = 3, LEGEND_AWAY_MUL = 0.5;
function regionMul(sp) { const h = legendHomes(sp); return !h.length ? 1 : h.includes(S.region || 0) ? LEGEND_HOME_MUL : LEGEND_AWAY_MUL; }
// a pick weighted by region
function regionPick(list) { const tot = list.reduce((a, sp) => a + regionMul(sp), 0); let r = rand() * tot; for (const sp of list) { r -= regionMul(sp); if (r <= 0) return sp; } return list[list.length - 1]; }
// (0.20.0) Paradox Pokémon: an expedition to Area Zero (Koraidon, Miraidon or Terapagos appearing) opens the crater for a
// year in that League, and exploring challengers can then find a Paradox Pokémon. One of each in the world at a time;
// they are not legendaries (no partner years, not under one-legendary-a-trainer). To be evaluated later (the owner).
const AREA_ZERO = ['Koraidon', 'Miraidon', 'Terapagos'], AREA_ZERO_WEEKS = 48, PARADOX_FIND = 0.004;
function paradoxHeld() { const s = new Set(); for (const t of Object.values(S.trainers)) if (!['retired', 'prospect'].includes(t.role)) for (const m of t.team) if (SP[m.sp].paradox) s.add(m.sp); return s; }
const areaZeroOpen = () => !!(S.areaZero && S.turn < S.areaZero.until);
// the Darkest Day: every battle swings wildly while Eternatus is loose
const legendChaos = () => (S.legend && S.legend.sp === 'Eternatus' && S.phase === 'season' ? 0.7 + rand() * 0.7 : 1);
function recordGreat(t, m, how, gi) {
  (S.greatCaught = S.greatCaught || {})[m.sp] = { id: t.id, season: S.season, how };
  // (0.20.0) the city where it joined becomes a legendary site: the encounter's or roamer's town, else the challenger's next gym
  if (inLg(t)) noteSite(gi != null && gi >= 0 ? gi : t.role === 'challenger' && t.badges.length < 8 && t.gymAt != null ? t.gymAt : ri(0, S.gyms.length - 1), m.sp);
  (t.greatLegends = t.greatLegends || []).push({ sp: m.sp, season: S.season, how, lg: S.lg || 0 });
  noteLegends(t);
}
// every legendary a trainer has ever had on their team (for Arceus)
function noteLegends(t) { const s = new Set(t.legendsEver || []); for (const m of t.team || []) if (SP[m.sp].legend) s.add(m.sp); t.legendsEver = [...s]; }
function legendMon(t, sp) {
  const lvl = Math.max(20, Math.floor(Math.max(...t.team.map(m => m.lvl), 20)) + 2);
  const m = stamp(makeMon(sp, lvl), 'gift'); m.met = { how: isGlitch(sp) ? 'glitch' : 'legend', season: S.season, week: S.week + 1 }; m.fr = 150;
  if (t.role === 'champion') m.cap = Math.max(...t.team.map(x => x.cap || x.lvl), m.lvl);
  return claimLegend(t, m);
}
// a legendary joins a trainer: if the team is full, they let their weakest ordinary Pokémon go
// (0.11.0 fix) how many Pokémon t may hold: a post's team size for staff (a gym trainer at gym 8 holds five), else six.
// A legendary joining a gym trainer or Gym Leader used to be added on top of a short post team.
const teamCap = t => { const sl = STAFF_ROLES.includes(t.role) ? eliteSlot(t) : null; return sl ? sl.size : 6; };
function joinLegend(t, sp, how, why) {
  if (!greatFree(sp) || legendBlocked(t, sp) || legendFull(t)) return null;
  if (t.team.length >= teamCap(t)) {
    const keep = m => (t.mega && t.mega.uid === m.uid) || m.bond === t.id;
    const out = t.team.filter(m => !isSpecial(m) && !keep(m)).sort((a, b) => monPower(a) - monPower(b))[0] || t.team.filter(m => !SP[m.sp].legend && !keep(m)).sort((a, b) => monPower(a) - monPower(b))[0];
    if (!out) return null;
    farewell(t, out, `released to make room for ${sp}`); t.team = t.team.filter(x => x !== out);
  }
  const m = legendMon(t, sp); t.team.push(m); recordGreat(t, m, how);
  news(`${why} ${sp} joined ${dn(t)}!`, 'title', t.id);
  return m;
}
const LEGEND_STORY = {
  Groudon: 'Groudon has awakened. The drought will last until someone catches it.',
  Kyogre: 'Kyogre has awakened. The rain will last until someone catches it.',
  Rayquaza: 'Rayquaza has descended from Sky Pillar to restore the balance.',
  Dialga: 'Spear Pillar has opened, and Dialga has appeared.',
  Palkia: 'Spear Pillar has opened, and Palkia has appeared.',
  Giratina: 'With Spear Pillar disturbed, the Distortion World has torn open, and Giratina has come through.',
  Kyurem: 'Kyurem has stirred in the Giant Chasm.',
  Yveltal: 'Yveltal has awakened from its long sleep.',
  Koraidon: 'An expedition to Area Zero has found Koraidon.',
  Miraidon: 'An expedition to Area Zero has found Miraidon.',
  Eternatus: 'The Darkest Day has begun: Eternatus is loose, and every battle is chaos until it is caught.',
  Terapagos: 'An expedition to Area Zero has found Terapagos sleeping deep in the crater.',
  Regigigas: 'The great doors of Snowpoint Temple have opened, and Regigigas is stirring.',
  Darkrai: 'A New Moon: Darkrai is loose, and sleep brings nightmares. Pokémon put to sleep stay asleep longer until it is caught.',
  Cresselia: 'A Full Moon: Cresselia has been seen gliding over the region.',
  Deoxys: 'A meteor came down near the region, and something inside it has woken: Deoxys.',
  Heatran: 'A volcano near the region has erupted, and Heatran has crawled out of the magma.',
  Genesect: 'A laboratory near the region lost power, and something ancient and armoured broke out: Genesect.',
  Xerneas: 'A great tree glowing in rainbow colours has been seen in the forest. Xerneas has awakened.',
};
const RARE_ENCOUNTER = 0.002; // v184: per week, each of Regigigas, Darkrai, Cresselia, Deoxys and Heatran, in weeks 5–16
const LEGEND_FALLBACK_CHANCE = 0.0015; // per week, per legendary, in weeks 5–16
const LEGEND_FALLBACK = [
  ['Groudon', 'Groudon stirred deep beneath the earth on its own. The drought will last until someone catches it.'],
  ['Kyogre', 'Kyogre rose from the sea floor on its own. The rain will last until someone catches it.'],
  ['Dialga', 'A tremor shook Spear Pillar, and Dialga appeared.'],
  ['Palkia', 'A tremor shook Spear Pillar, and Palkia appeared.'],
  ['Yveltal', 'Yveltal woke from its long sleep on its own.'],
  ['Xerneas', 'A great tree glowing in rainbow colours has been seen in the forest. Xerneas has awakened.'],
  ['Reshiram', 'With no one to control it, Reshiram, the dragon of truth, sought out the trainer with the deepest bond.'],
  ['Zekrom', 'With no one to control it, Zekrom, the dragon of ideals, sought out the strongest trainer.'],
];
// the level of a typical challenger right now
function circuitLevel() {
  const ls = challengers().map(t => topAvg(t, 3)).sort((a, b) => a - b);
  return ls.length ? ls[Math.floor(ls.length / 2)] : 20;
}
function startLegend(sp, why) {
  if (!featOn('greatlegends') || !greatFree(sp) || S.legend || S.phase !== 'season' || S.legendSeason === S.season) return false;
  const lvl = Math.min(100, Math.round(circuitLevel()) + LEGEND_LV), gi = ri(0, S.gyms.length - 1);
  S.legend = { sp, season: S.season, from: S.week + 1, until: S.turn + (['Groudon', 'Kyogre'].includes(sp) ? LEGEND_WEEKS * 3 : LEGEND_WEEKS), town: townName(gi), gi, lvl, attempts: 0, dmg: {}, tries: {}, total: 0 };
  S.legendSeason = S.season;
  if (AREA_ZERO.includes(sp)) S.areaZero = { sp, until: S.turn + AREA_ZERO_WEEKS };
  noteSite(gi, sp);
  news(`${why || LEGEND_STORY[sp] || sp + ' has appeared.'} It's near ${S.legend.town}; challengers can seek it until ${turnDate(S.legend.until)}, and it goes to whoever does the most damage.`, 'title');
  return true;
}
// one week's attempt at the legendary: a full-strength battle; the damage adds to this trainer's total
function legendBattle(t, entry) {
  const L = legendState(S.legend); if (!L) return null;
  const boss = { id: -1, name: L.sp, cls: 'Wild', role: 'villain', kind: 'legend', r: { str: 80, trn: 80, bnd: 50, sct: 50, nrv: 80 }, specialty: SP[L.sp].types[0], spec2: null, team: [makeMon(L.sp, L.lvl)], badges: [], weekLog: [], career: {}, trait: null, seasons: 0 };
  const luck = legendLuck();
  const res = battle(t, boss, 'raid', `${L.sp} · near ${L.town}`, { boss: { hpMul: LEGEND_HP, hpFrac: 1, luck, who: t } });
  L.attempts++;
  const dealt = clamp(1 - res.bossHp, 0, 1);
  L.dmg[t.id] = (L.dmg[t.id] || 0) + dealt; L.tries[t.id] = (L.tries[t.id] || 0) + 1; L.total += dealt;
  entry.legend = { sp: L.sp, dealt: Math.round(dealt * 100), luck: Math.round(luck * 100) / 100, total: Math.round(L.dmg[t.id] * 100), caught: false };
  if (L.total >= LEGEND_BARS) {
    const w = settleLegend(`${L.sp} has been worn down!`);
    entry.legend.caught = !!w && w.id === t.id; res.legendCaught = entry.legend.caught;
  }
  return res;
}
const luckWord = x => x >= 1.45 ? 'brilliant' : x >= 1.12 ? 'good' : x > 0.88 ? 'steady' : x > 0.68 ? 'poor' : 'dreadful';
// the encounter ends (worn down, out of time, or the season over): the trainer who did the most damage gets it.
// A tie at the top is fought out, winner stays on. Returns the trainer it went to, if any.
function settleLegend(reason, force) {
  const L = legendState(S.legend); if (!L) return null;
  S.legend = null;
  const elig = id => { const t = T(id); return t && t.role !== 'retired' && t.team && t.team.length && !legendBlocked(t, L.sp) && !legendFull(t); };
  const rank = legendRank(L).filter(r => r.d > 0 && elig(r.id));
  if (!rank.length || !greatFree(L.sp)) { news(`${reason} ${L.sp} slipped away with no one to claim it. It may return one day.`, 'title'); return null; }
  const top = rank.filter(r => Math.round(r.d * 1000) === Math.round(rank[0].d * 1000));
  let w = T(top[0].id), tie = '';
  if (top.length > 1) {
    for (const r of top.slice(1)) {
      const o = T(r.id), res = battle(w, o, 'rival', `Tiebreak for ${L.sp} · ${dn(o)}`);
      w = res.winner === 0 ? w : o;
    }
    tie = `, tied with ${top.filter(r => r.id !== w.id).map(r => dn(T(r.id))).join(' and ')}, then won the battle to settle it`;
  }
  const r = rank.find(x => x.id === w.id);
  const why = `${reason} ${dn(w)} did the most damage to it (${Math.round(r.d * 100)}% over ${r.n} attempt${r.n === 1 ? '' : 's'})${tie}:`;
  awardLegend(w, L.sp, why, force, L.gi);
  return w;
}
function awardLegend(t, sp, why, force, gi) {
  if (t.team.length >= 6) { const out = t.team.filter(x => !isSpecial(x) && !(t.mega && t.mega.uid === x.uid) && x.bond !== t.id).sort((a, b) => monPower(a) - monPower(b))[0] || t.team.filter(x => !SP[x.sp].legend).sort((a, b) => monPower(a) - monPower(b))[0] || t.team[0]; farewell(t, out, `released to make room for ${sp}`); t.team = t.team.filter(x => x !== out); }
  const m = legendMon(t, sp); t.team.push(m); recordGreat(t, m, 'caught', gi);
  news(`${why} ${sp} joined ${dn(t)}!`, 'title', t.id);
  return m;
}
// should this trainer spend the week on the legendary? Never if it has already been with them (it won't go back to a
// trainer it has left); not when gyms can't wait; not when they're too far behind the leader to catch up
// a legendary attempt is worth more experience than a lost gym battle, and more the more damage it did: about a third
// of the way from a loss to a training week for a typical attempt, up to most of a training week for a full defeat
function wantsLegend(t) {
  const L = legendState(S.legend); if (!L || t.role !== 'challenger' || t.rest != null || legendBlocked(t, L.sp) || legendFull(t)) return false;
  if (topAvg(t, 3) < L.lvl - 30) return false;
  const mine = L.dmg[t.id] || 0, rank = legendRank(L), lead = rank.length ? rank[0].d : 0;
  const tries = Math.max(1, L.until - S.turn);
  if (lead - mine > tries * 0.6) return false;
  const leading = rank.length && rank[0].id === t.id;
  return rand() < LEGEND_AI * (t.badges.length >= 8 ? 1.6 : 1) * (leading ? 1.5 : mine > 0 ? 1.25 : 1) * (L.attempts === 0 ? 1.3 : 1);
}
// each week: an encounter that ran out leaves; scheduled appearances and rare story events may begin
function legendWeek() {
  if (S.phase !== 'season') return;
  const L = S.legend;
  if (L && S.turn + 1 >= L.until) settleLegend(`${L.sp} is about to leave ${L.town}!`);
  // gifts due (wings, Mewtwo, Arceus). A legendary only comes to its trainer out on the circuit: if they're the
  // Champion, Elite Four or a Gym Leader it waits for them (a box legendary defending the title tilts the League)
  for (const g of (S.legendGifts || []).filter(g => g.season < S.season || (g.season === S.season && g.week <= S.week + 1))) {
    const t = T(g.id);
    // a trainer who changed Leagues takes the gift with them, if that League has no one holding it yet
    if (!featOn('greatlegends') || !t || t.role === 'retired' || !inLeague(lgOf(t), () => greatFree(g.sp))) { S.legendGifts = S.legendGifts.filter(x => x !== g); continue; }
    if (t.role !== 'challenger') continue;
    S.legendGifts = S.legendGifts.filter(x => x !== g);
    inLeague(lgOf(t), () => joinLegend(t, g.sp, g.how, g.why));
  }
  glitchWeek();
  if (!featOn('greatlegends') || S.legend || S.legendSeason === S.season || rand() >= 0.25) return; // any week of the year, at the source's yearly rate (it rolled in 12 of a year's 24 weeks)
  if (S.rayquazaDue === S.season && rand() < 0.3) { S.rayquazaDue = null; startLegend('Rayquaza'); return; }
  if ((everCaught('Dialga') || everCaught('Palkia')) && rand() < 0.02 * regionMul('Giratina')) { startLegend('Giratina'); return; }
  if ((everCaught('Reshiram') || everCaught('Zekrom')) && rand() < 0.02) { startLegend('Kyurem'); return; }
  // these legendaries appear on their own now and then
  for (const [sp, why] of shuffle(LEGEND_FALLBACK.slice())) {
    if (!greatFree(sp) || rand() >= LEGEND_FALLBACK_CHANCE * regionMul(sp)) continue;
    if (sp === 'Reshiram' || sp === 'Zekrom') {
      const key = sp === 'Reshiram' ? 'bnd' : 'str';
      const t = challengers().filter(x => x.team.length && !legendFull(x)).sort((a, b) => b.r[key] - a.r[key])[0];
      if (t) { joinLegend(t, sp, 'chosen', why); return; }
      continue;
    }
    if (startLegend(sp, why)) return;
  }
  if (rand() < 0.012) { const f = ['Koraidon', 'Miraidon', 'Terapagos'].filter(greatFree); if (f.length) { startLegend(pick(f)); return; } }
  if (rand() < 0.003) { startLegend('Eternatus'); return; }
  // v184: rare encounters of their own
  for (const sp of shuffle(['Regigigas', 'Darkrai', 'Cresselia', 'Deoxys', 'Heatran', 'Genesect'])) if (rand() < RARE_ENCOUNTER * regionMul(sp) && startLegend(sp)) return;
  // v185: legendaries from this league's own Pokédex, rarer still
  // (0.31.0) a custom region's own legendary is at home there (×3), elsewhere ×0.5, and never away from home if locked
  for (const sp of shuffle(DEX_LEGENDS.slice())) if (SP[sp] && SP[sp].dexLegend && rand() < DEX_LEGEND_CHANCE * (SP[sp].homeOnly != null && SP[sp].homeOnly !== S.region ? 0 : regionMul(sp)) && startLegend(sp, `A legendary Pokémon no one has ever recorded has appeared: ${sp}.`)) return;
}
// v184: Missingno. Very rarely it glitches onto a random challenger's team (weighted toward those having a poor
// season, but anyone can get it). It stays 6–10 seasons, and now and then it glitches away mid-season.
function glitchWeek() {
  if (!featOn('greatlegends') || S.phase !== 'season') return;
  // leaving mid-season: never during the League, never as a trainer's last Pokémon
  for (const t of leagueTrainers()) {
    if (['retired', 'prospect'].includes(t.role) || !t.team || t.team.length <= 1) continue;
    const m = t.team.find(x => isGlitch(x.sp)); if (!m || rand() >= GLITCH_LEAVE * EVENT_PACE) continue;
    const from = ((m.partners || []).slice(-1)[0] || { from: S.season }).from, seasons = (S.season || 1) - from + 1;
    farewell(t, m, `glitched away`);
    t.team = t.team.filter(x => x !== m);
    news(`${dn(t)}'s Missingno flickered, broke apart into static and was gone, partway through its ${seasons === 1 ? 'first' : glitchOrd(seasons)} year with them.`, 'title', t.id);
    if (STAFF_ROLES.includes(t.role)) backfillElite(t, m);
  }
  if (!greatFree('Missingno') || rand() >= GLITCH_CHANCE * 18 / YEAR_WEEKS) return;
  const pool = challengers().filter(t => t.team.length && t.rest == null && !legendBlocked(t, 'Missingno') && !legendFull(t));
  if (!pool.length) return;
  // poor performers weigh up to four times as much: fewest badges, then worst record this season
  const score = t => t.badges.length * 3 + (t.weekLog || []).filter(e => e && e.won).length;
  const hi = Math.max(...pool.map(score)), lo = Math.min(...pool.map(score));
  const w = t => 1 + 3 * (hi === lo ? 0 : (hi - score(t)) / (hi - lo));
  let r = rand() * pool.reduce((a, t) => a + w(t), 0), t = pool[pool.length - 1];
  for (const x of pool) { r -= w(x); if (r <= 0) { t = x; break; } }
  joinLegend(t, 'Missingno', 'glitch', `Something went wrong. ${dn(t)}'s team list flickered, a row of static appeared at the bottom, and`);
}
const glitchOrd = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
// rivals: winning a rival battle can draw the heroes of the Slumbering Weald
function weald(w) {
  if (!featOn('greatlegends') || S.wealdSeason === S.season || rand() >= 0.08 * EVENT_PACE) return;
  const f = ['Zacian', 'Zamazenta'].filter(greatFree); if (!f.length || legendFull(w)) return;
  S.wealdSeason = S.season;
  joinLegend(w, pick(f), 'chosen', `Drawn by a rivalry fought out in full, the Slumbering Weald stirred.`);
}
// offseason: wings for Lugia and Ho-Oh (never to the same trainer), Mewtwo for a first title, Arceus for a collector
function legendOffseason(L, awards) {
  if (!featOn('greatlegends')) return;
  for (const t of leagueTrainers()) if (t.role !== 'retired' && t.team) noteLegends(t);
  const next = S.season + 1, gifts = S.legendGifts = S.legendGifts || [];
  const pending = sp => gifts.some(g => g.sp === sp);
  const champ = T(S.champion);
  // v184: a trainer already holding a legendary, or with one on its way, is passed over; the gift goes to the next in line
  const field = [...new Set([...S.challengers, ...L.entries.map(e => e.id)])].map(T).filter(x => x && x.role !== 'retired' && x.team && x.team.length);
  const open = x => x && !legendFull(x);
  const bySeason = (except) => field.filter(x => open(x) && !(except || []).includes(x.id)).sort((a, b) => seasonScore(b) - seasonScore(a));
  const give = (t, sp, how, why, note) => { gifts.push({ id: t.id, sp, how, season: next, week: ri(3, 14), why }); news(note, 'title', t.id); return t; };
  let silver = null;
  if (greatFree('Lugia') && !pending('Lugia') && rand() < regionMul('Lugia')) {
    const t = open(champ) ? champ : bySeason()[0];
    if (t) silver = give(t, 'Lugia', 'wing', `Drawn by the Silver Wing ${t.name} received${t === champ ? ' as Champion' : ''},`, `${dn(t)} received a Silver Wing${t === champ ? '' : ' (the Champion already has a legendary partner)'}. Lugia may come for its bearer once they're out on the circuit.`);
  }
  if (greatFree('Ho-Oh') && !pending('Ho-Oh') && rand() < RAINBOW_CHANCE * regionMul('Ho-Oh')) {
    const toy = (awards || []).find(a => a.k === 'toy'); let t = toy && T(toy.id);
    // the wings never go to the same trainer, or to anyone with a legendary already: the Rainbow Wing passes to the next-best season
    if (!open(t) || (silver && t.id === silver.id)) t = bySeason(silver ? [silver.id] : [])[0] || null;
    if (t) give(t, 'Ho-Oh', 'wing', `Drawn by the Rainbow Wing ${t.name} received,`, `${dn(t)} received a Rainbow Wing. Ho-Oh may come for its bearer once they're out on the circuit.`);
  }
  // Mewtwo: Cerulean Cave opens to a challenger who won their first title this season
  if (open(champ) && L.startChamp !== champ.id && (champ.titleSeasons || []).length === 1 && greatFree('Mewtwo') && !pending('Mewtwo') && rand() < 0.5 * regionMul('Mewtwo')) {
    gifts.push({ id: champ.id, sp: 'Mewtwo', how: 'cave', season: next, week: ri(2, 10), why: `Cerulean Cave opened to the new Champion, and inside,` });
    news(`Rumors say Cerulean Cave has opened to ${dn(champ)}...`, 'title', champ.id);
  }
  // Arceus (v184): now and then it appears to the trainer with the finest career who has never had a legendary at all,
  // and only once in a career
  if (greatFree('Arceus') && !pending('Arceus') && rand() < ARCEUS_CHANCE * regionMul('Arceus')) {
    const career = x => (x.career.titles || 0) * 12 + (x.career.badges || 0) + (x.career.e4Wins || 0) * 2;
    const t = field.filter(x => open(x) && !x.arceusChosen && !(x.legendsEver || []).length && (x.seasons || 0) >= 3).sort((a, b) => career(b) - career(a))[0];
    if (t) { t.arceusChosen = next; gifts.push({ id: t.id, sp: 'Arceus', how: 'chosen', season: next, week: ri(4, 16), why: `After a long career without a single legendary partner, ${t.name} was found worthy:` }); news(`Something stirs at the Hall of Origin. ${dn(t)} has never had a legendary partner...`, 'title', t.id); }
  }
  // v184: legendaries that choose by character or by how a season went. Each looks for its trainer only some offseasons.
  const pickBy = (f, keep) => { const c = field.filter(x => open(x) && x.role === 'challenger' && (!keep || keep(x))); return c.length ? c.sort((a, b) => f(b) - f(a))[0] : null; };
  const wins = x => (x.weekLog || []).filter(w => (w.act === 'challenge' && w.won) || (w.road && w.road.won)).length;
  const kos = x => x.team.reduce((a, m) => a + (m.ss && m.ss.season === S.season ? m.ss.ko : 0), 0);
  for (const g of shuffle(CHARACTER_GIFTS)) {
    if (!greatFree(g.sp) || pending(g.sp) || rand() >= CHARACTER_CHANCE * regionMul(g.sp)) continue;
    const t = pickBy(g.rank(x => ({ wins: wins(x), kos: kos(x), score: seasonScore(x) })), g.keep && (x => g.keep(x, L)));
    if (!t) continue;
    give(t, g.sp, 'chosen', g.why(t), `${g.sign(t)} ${g.sp} may come to ${dn(t)} in the new year.`);
  }
  // Rayquaza follows a season in which Groudon or Kyogre was caught
  if (S.greatCaught && ['Groudon', 'Kyogre'].some(sp => S.greatCaught[sp] && S.greatCaught[sp].season === S.season) && greatFree('Rayquaza')) S.rayquazaDue = next;
}
// v184: who each of these legendaries chooses. rank scores a challenger (higher is better); keep limits who can be chosen
const ARCEUS_CHANCE = 0.12, CHARACTER_CHANCE = 0.12, RAINBOW_CHANCE = 0.5;
// badges this season against last season's (a first season counts from none)
const improved = x => { const h = (x.seasonHist || []).filter(e => e.badges != null); const now = x.badges.length, before = h.length > 1 ? h[h.length - 2].badges : 0; return now - before + rand() * 0.5; };
const CHARACTER_GIFTS = [
  { sp: 'Uxie', rank: s => x => x.r.str, sign: t => `Uxie, the Being of Knowledge, has taken an interest in ${t.name}'s strategy.`, why: t => `Drawn by ${t.name}'s sharp mind,` },
  { sp: 'Mesprit', rank: s => x => x.r.bnd, sign: t => `Mesprit, the Being of Emotion, was moved by ${t.name}'s bond with their Pokémon.`, why: t => `Drawn by ${t.name}'s bond with their Pokémon,` },
  { sp: 'Azelf', rank: s => x => x.r.nrv, sign: t => `Azelf, the Being of Willpower, has noticed ${t.name}'s nerve.`, why: t => `Drawn by ${t.name}'s nerve,` },
  { sp: 'Glastrier', rank: s => x => x.r.trn, sign: t => `Hoofprints in the frost lead toward ${t.name}, the hardest trainer on the circuit.`, why: t => `Drawn by ${t.name}'s relentless training,` },
  { sp: 'Spectrier', rank: s => x => x.r.sct, sign: t => `Something unseen has been watching ${t.name}, the circuit's sharpest scout.`, why: t => `Drawn by ${t.name}'s keen eye,` },
  { sp: 'Pecharunt', rank: s => x => -x.r.bnd, sign: t => `Pecharunt has its eye on ${t.name}, whose bond with their Pokémon is the weakest on the circuit.`, why: t => `Sensing a weak bond to exploit,` },
  { sp: 'Volcanion', rank: s => x => s(x).kos, sign: t => `Steam rose from the mountains: Volcanion has heard of ${t.name}, who scored the most knockouts this season.`, why: t => `Drawn by ${t.name}'s knockouts,` },
  { sp: 'Victini', rank: s => x => s(x).wins, sign: t => `Victini, the Victory Pokémon, has been following ${t.name}, who won the most battles this season.`, why: t => `Drawn by ${t.name}'s run of victories,` },
  { sp: 'Marshadow', rank: s => x => (x.weekLog || []).filter(w => w.road && w.road.won).length, sign: t => `A shadow has been trailing ${t.name}, the road's top battler this season.`, why: t => `Stepping out of ${t.name}'s shadow,` },
  { sp: 'Zeraora', keep: x => x.badges.length >= 8 && x.badgeWeek, rank: s => x => -(x.badgeWeek || 99), sign: t => `Zeraora was seen racing alongside ${t.name}, the fastest through the badge circuit this year.`, why: t => `Drawn by ${t.name}'s speed,` },
  { sp: 'Magearna', rank: s => x => ovr(x), sign: t => `An old machine has been sent to ${t.name}, the circuit's best-rated challenger.`, why: t => `Built for a trainer like ${t.name},` },
  { sp: 'Meloetta', rank: s => x => s(x).score, sign: t => `A melody follows ${t.name}, who had the best year of any challenger.`, why: t => `Drawn by ${t.name}'s season,` },
  { sp: 'Jirachi', rank: s => x => rand(), sign: t => `The Millennium Comet passed overhead, and ${t.name}'s wish was the one Jirachi heard.`, why: t => `Granting ${t.name}'s wish,` },
  { sp: 'Celebi', rank: s => x => improved(x), sign: t => `Celebi passed through time to see ${t.name}, who came further this year than anyone.`, why: t => `Travelling through time to meet ${t.name},` },
  // (0.20.0) the Swords of Justice and Keldeo, who had no way in since the seed (they came from villain events)
  { sp: 'Cobalion', rank: s => x => yearOf(x).runs, sign: t => `Cobalion has watched ${t.name} set out again and again this year without giving up.`, why: t => `Drawn by ${t.name}'s resolve,` },
  { sp: 'Terrakion', rank: s => x => yearOf(x).b * 10 - ovr(x), sign: t => `Terrakion has taken the side of ${t.name}, who went further this year than anyone rated as low.`, why: t => `Standing with the underdog,` },
  { sp: 'Virizion', keep: x => yearOf(x).b >= 6, rank: s => x => -(x.age || 30), sign: t => `Virizion has noticed ${t.name}, the youngest challenger to win six badges in a run this year.`, why: t => `Drawn by ${t.name}'s youth and promise,` },
  { sp: 'Keldeo', keep: x => (x.seasons || 0) <= 1, rank: s => x => yearOf(x).b + (yearOf(x).st || 0), sign: t => `Keldeo has been racing alongside ${t.name}, the best of this year's newcomers.`, why: t => `Resolute to prove itself beside ${t.name},` },
  { sp: 'Diancie', keep: x => x.team.some(m => m.sp === 'Carbink'), rank: s => x => s(x).score, sign: t => `Diancie heard that ${t.name} looks after a Carbink.`, why: t => `Looking for the trainer who cares for Carbink,` },
];
// ================= WILD LEGENDARY EVENTS (v182) =================
// The legendaries below the great ones now come into the world through events that fit them, instead of as the
// Champion's reward. At most one roamer and one storm a season in each League (Landorus can follow a storm).
//  - Roamers (Raikou, Entei, Suicune, Latias, Latios): seen near one town at a time, moving on most weeks. A challenger
//    exploring on the way to that town's gym may find it among the week's wild Pokémon and catch it like any other
//    (v182: no battle). After 7–9 weeks it leaves the region.
//  - Storms (Articuno, Moltres, Zapdos, Tornadus, Thundurus, then Landorus): a front covers the whole region for four
//    weeks, changing the weather in every battle and powering up one type. The legendary inside it chooses the
//    challenger who won the most battles during the storm (at least STORM_MIN), whatever their type.
const ROAMERS = ['Raikou', 'Entei', 'Suicune', 'Latias', 'Latios', 'Okidogi', 'Munkidori', 'Fezandipiti'];
const ROAM_WEEKS = [7, 9], ROAM_CHANCE = 0.6, ROAM_FIRST = 2, ROAM_LAST = YEAR_WEEKS - 4;
const ROAM_MEET = 0.25; // chance a challenger exploring near its town finds it among the week's wild Pokémon
const ROAM_STORY = {
  Raikou: 'Thunder cracked over {town} out of a clear sky. Raikou is roaming the region.',
  Entei: 'The ground near {town} rumbled like a volcano, and Entei was seen racing past. It is roaming the region.',
  Suicune: 'The water near {town} ran suddenly clear. Suicune is roaming the region.',
  Latias: 'A red-and-white blur streaked low over {town}. Latias is roaming the region.',
  Latios: 'A blue-and-white blur streaked low over {town}. Latios is roaming the region.',
  Okidogi: 'Something big and toxic has been seen prowling near {town}. Okidogi, one of the Loyal Three, is roaming the region.',
  Munkidori: 'A strange monkey was seen leaping between rooftops in {town}. Munkidori, one of the Loyal Three, is roaming the region.',
  Fezandipiti: 'A dazzling bird swept over {town}, leaving a sweet, poisonous scent. Fezandipiti, one of the Loyal Three, is roaming the region.',
};
// the town a challenger is working toward (their next gym); a trainer with all eight badges goes anywhere
const nearTown = t => (t.badges.length < 8 ? (t.gymAt != null ? t.gymAt : null) : null);
// the odds a challenger exploring this week finds the roamer: full near its town, half one town away, a third with all
// eight badges (they're anywhere on the road), none further off
function roamChance(t) {
  const R = S.roamer; if (!R || t.role !== 'challenger' || t.rest != null || !t.team.length || legendBlocked(t, R.sp) || legendFull(t) || !greatFree(R.sp)) return 0;
  const near = nearTown(t), gap = near === null ? null : Math.abs(near - R.town);
  if (gap !== null && gap > 1) return 0;
  return ROAM_MEET * (gap === null ? 0.35 : gap === 1 ? 0.5 : 1);
}
function startRoamer(sp) {
  const town = ri(0, S.gyms.length - 1);
  S.roamer = { sp, town, from: S.turn + 2, until: S.turn + 1 + ri(ROAM_WEEKS[0], ROAM_WEEKS[1]), seen: 0, trail: [town] };
  S.roamSeason = S.season;
  news(`${ROAM_STORY[sp].replace('{town}', townName(town))} Challengers exploring on the way to ${townName(town)} Gym may find it among the wild Pokémon.`, 'title');
  logSky(`${sp} began roaming near ${townName(town)}`);
}
// the roamer turns up in a challenger's wild Pokémon: in the open slot, at the level of their strongest Pokémon
function roamOffer(t, out, L) {
  if (!out.length || rand() >= roamChance(t)) return;
  const R = S.roamer, lvl = Math.max(L, Math.floor(Math.max(...t.team.map(m => m.lvl), L)));
  out[out.length - 1] = ensureMon({ sp: R.sp, lvl, roam: true, form: 1, iv: ivSet(() => ri(20, 31)) });
  R.seen++;
}
// a challenger caught the roamer
function roamCaught(t, m) {
  const R = S.roamer; S.roamer = null;
  m.met.how = 'roamer'; recordGreat(t, m, 'caught', R.town);
  catchNews(`${dn(t)} caught ${m.sp}, the roaming legendary, near ${townName(R.town)}!`, 'title', t.id);
  logSky(`${dn(t)} caught ${m.sp} near ${townName(R.town)}`);
}
function roamWeek() {
  if (S.phase !== 'season') return;
  const R = S.roamer;
  if (R) {
    if (S.turn + 1 >= R.until || !greatFree(R.sp)) {
      S.roamer = null;
      news(`${R.sp} has left the region${R.seen ? `, after being spotted by ${R.seen} explorer${R.seen === 1 ? '' : 's'}` : ''}. It may roam here again one day.`, 'title');
      logSky(`${R.sp} left the region uncaught`);
      return;
    }
    if (rand() < 0.55) { R.town = pick(S.gyms.map((_, i) => i).filter(i => i !== R.town)); R.trail.push(R.town); }
    return;
  }
  // each season may have one roamer, planned when the season starts (about three seasons in five)
  if (!featOn('roamers') || S.roamSeason === S.season) return;
  if (!S.roamPlan || S.roamPlan.season !== S.season) S.roamPlan = { season: S.season, wk: rand() < ROAM_CHANCE ? ri(ROAM_FIRST, ROAM_LAST) : null };
  if (S.roamPlan.wk == null || S.week + 2 < S.roamPlan.wk) return;
  const free = ROAMERS.filter(greatFree); if (free.length) startRoamer(regionPick(free)); else S.roamSeason = S.season;
}
// a legendary from a wild event joins t, who makes room for it
function giveWildLegend(t, sp, how, why, force) {
  if (!greatFree(sp) || legendBlocked(t, sp) || legendFull(t)) { news(`${sp} slipped away. It may return one day.`, 'title'); return null; }
  if (t.team.length >= teamCap(t)) {
    const keep = m => (t.mega && t.mega.uid === m.uid) || m.bond === t.id;
    const out = t.team.filter(m => !isSpecial(m) && !keep(m)).sort((a, b) => monPower(a) - monPower(b))[0] || t.team.filter(m => !SP[m.sp].legend && !keep(m)).sort((a, b) => monPower(a) - monPower(b))[0] || t.team[0];
    farewell(t, out, `released to make room for ${sp}`); t.team = t.team.filter(x => x !== out);
  }
  const m = legendMon(t, sp); t.team.push(m); recordGreat(t, m, how);
  news(why, 'title', t.id);
  return m;
}

// ---------- storms ----------
// wx: the battle weather it brings (or none); type: the type it powers up; mul: the boost
// to that type's moves on top of any weather; at: the weeks it can begin (the season's 24 weeks run spring → winter)
const STORMS = {
  Moltres:   { name: 'Heat wave',     wx: 'sun',  type: 'Fire',     mul: 1,    at: [7, 11],  story: 'A scorching heat wave has settled over the region. Moltres has been seen burning across the sky.' },
  Articuno:  { name: 'Blizzard',      wx: 'snow', type: 'Ice',      mul: 1.15, at: [17, 20], story: 'An early blizzard has swept down from the north. Articuno is said to fly at its heart.' },
  Zapdos:    { name: 'Electric storm', wx: null,  type: 'Electric', mul: 1.2,  at: [2, 6],   story: 'Lightning storms are crackling across the region. Zapdos has been seen among the clouds.' },
  Thundurus: { name: 'Thunderstorm',  wx: 'rain', type: 'Electric', mul: 1.1,  at: [4, 14],  story: 'Thundurus has whipped up thunderstorms over the region, and the rain hasn\'t let up.' },
  Tornadus:  { name: 'Gale',          wx: null,   type: 'Flying',   mul: 1.2,  at: [4, 14],  story: 'Tornadus is loose, and fierce gales are tearing across the region.' },
  Landorus:  { name: 'Bountiful calm', wx: null,  type: 'Ground',   mul: 1.15, at: [8, 20],  story: 'Landorus has come down to calm the skies. The land feels rich and strong.' },
  // v184: Enamorus brings spring; the island guardians lay down terrain; the Treasures of Ruin curse the region; and now
  // and then a bird storm is its Galarian form's instead
  Enamorus:  { name: 'Bloom',         wx: null,   type: 'Fairy',    mul: 1.15, at: [2, 8],   story: 'Flowers burst open everywhere at once. Enamorus has brought spring to the region.' },
  'Tapu Koko': { name: 'Electric Terrain', wx: null, type: 'Electric', mul: 1.2, at: [3, 18], story: 'Tapu Koko, guardian of the islands, has charged the ground with electricity to test the region\'s trainers.' },
  'Tapu Lele': { name: 'Psychic Terrain',  wx: null, type: 'Psychic',  mul: 1.2, at: [3, 18], story: 'Tapu Lele, guardian of the islands, has scattered its strange glowing scales over the region.' },
  'Tapu Bulu': { name: 'Grassy Terrain',   wx: null, type: 'Grass',    mul: 1.2, at: [3, 18], story: 'Tapu Bulu, guardian of the islands, has made grass spring up over every battlefield.' },
  'Tapu Fini': { name: 'Misty Terrain',    wx: null, type: 'Fairy',    mul: 1.2, at: [3, 18], story: 'Tapu Fini, guardian of the islands, has wrapped the region in a dense, glittering mist.' },
  'Wo-Chien':  { name: 'Tablets of Ruin',  wx: null, cat: 'P', mul: 0.85, at: [3, 20], story: 'A stake was pulled from the ground, and Wo-Chien is free. Its curse weakens physical attacks everywhere.' },
  'Chien-Pao': { name: 'Sword of Ruin',    wx: null, cat: 'P', mul: 1.15, at: [3, 20], story: 'A stake was pulled from the ground, and Chien-Pao is free. Its curse shatters defenses everywhere.' },
  'Ting-Lu':   { name: 'Vessel of Ruin',   wx: null, cat: 'S', mul: 0.85, at: [3, 20], story: 'A stake was pulled from the ground, and Ting-Lu is free. Its curse weakens special attacks everywhere.' },
  'Chi-Yu':    { name: 'Beads of Ruin',    wx: null, cat: 'S', mul: 1.15, at: [3, 20], story: 'A stake was pulled from the ground, and Chi-Yu is free. Its curse melts special defenses everywhere.' },
  'Galarian Articuno': { name: 'Psychic haze', wx: null, type: 'Psychic', mul: 1.15, at: [17, 20], galar: 'Articuno', story: 'A cold, strange haze has drifted in. It isn\'t Articuno at its heart, but Galarian Articuno.' },
  'Galarian Zapdos':   { name: 'Stampede',     wx: null, type: 'Fighting', mul: 1.15, at: [2, 6],  galar: 'Zapdos', story: 'Something is running across the region faster than anything should. It isn\'t Zapdos, but Galarian Zapdos.' },
  'Galarian Moltres':  { name: 'Dark blaze',   wx: null, type: 'Dark',     mul: 1.15, at: [7, 11], galar: 'Moltres', story: 'Sinister purple flames are burning across the sky. It isn\'t Moltres, but Galarian Moltres.' },
};
const GALAR_STORM = 0.15; // the chance a bird storm is its Galarian form's
// what a storm does, in words
function stormFx(s) {
  const bits = [s.wx ? `${WEATHER_NAME[s.wx].toLowerCase()} in every battle` : ''];
  if (s.cat) bits.push(`${s.cat === 'P' ? 'physical' : 'special'} attacks do ${Math.round(Math.abs(s.mul - 1) * 100)}% ${s.mul > 1 ? 'more' : 'less'} damage`);
  else if (s.mul !== 1) bits.push(`${s.type} moves hit ${Math.round((s.mul - 1) * 100)}% harder`);
  return bits.filter(Boolean).join(', and ');
}
const STORM_WEEKS = 4, STORM_MIN = 3, STORM_CHANCE = 0.75, LANDORUS_CHANCE = 0.25;
// each storm keeps its own part of the year: the source's weeks of a 24-week season, on a 48-week year
const stormAt = sp => STORMS[sp].at.map(w => w * 2);
const stormOn = () => S.phase === 'season' && S.storm ? STORMS[S.storm.sp] : null;
// every attack of the storm's type hits harder while it lasts
function stormMul(ty, phys) { const s = stormOn(); if (!s || s.mul === 1) return 1; if (s.cat) return (s.cat === 'P') === !!phys ? s.mul : 1; return ty === s.type ? s.mul : 1; }
function startStorm(sp, why) {
  const s = STORMS[sp];
  S.storm = { sp, type: s.type, from: S.turn + 2, until: S.turn + 1 + STORM_WEEKS, w: {}, ko: {} };
  S.stormSeason = S.season;
  if (sp === 'Tornadus' || sp === 'Thundurus') S.forcesStorm = S.season;
  news(`${why || s.story} ${s.name} until ${turnDate(S.storm.until)}: ${stormFx(s)}. ${sp} will choose the challenger who wins the most battles while it lasts.`, 'title');
  logSky(`${s.name}: ${sp} brought it over the region`);
}
// battles won (and knockouts, to settle ties) by challengers while the storm lasts, every kind of battle counted.
// Whatever their type: a storm's legendary isn't drawn to Pokémon of its own type.
function stormWin(t, won, ko) {
  const st = S.storm; if (!st || S.phase !== 'season' || t.role !== 'challenger' || !inLg(t)) return;
  if (!st.w) { st.w = {}; st.ko = {}; } // a storm from an earlier build of v182 starts its tally afresh
  if (won) st.w[t.id] = (st.w[t.id] || 0) + 1;
  if (ko) st.ko[t.id] = (st.ko[t.id] || 0) + ko;
}
const stormRank = st => Object.keys(Object.assign({}, st.w || {}, st.ko || {})).map(id => ({ id: +id, w: (st.w || {})[id] || 0, k: (st.ko || {})[id] || 0 })).filter(r => { const t = T(r.id); return r.w && t && t.role === 'challenger' && t.team.length && !legendFull(t) && !legendBlocked(t, st.sp); }).sort((a, b) => b.w - a.w || b.k - a.k);
function settleStorm(force) {
  const st = S.storm; if (!st) return;
  S.storm = null;
  const s = STORMS[st.sp], top = stormRank(st)[0];
  if (!top || top.w < STORM_MIN || !greatFree(st.sp)) { news(`The ${s.name.toLowerCase()} has passed, and ${st.sp} went with it. No challenger stood out enough.`, 'title'); logSky(`${s.name} passed; ${st.sp} chose no one`); return; }
  const t = T(top.id);
  logSky(`${st.sp} chose ${dn(t)} (${top.w} wins in the ${s.name.toLowerCase()})`);
  giveWildLegend(t, st.sp, 'chosen', `As the ${s.name.toLowerCase()} passed, ${st.sp} came down to ${dn(t)}, who won ${top.w} battles in it, more than any other challenger.`, force);
}
function stormWeek() {
  if (S.phase !== 'season') return;
  if (S.storm) { if (S.turn + 1 >= S.storm.until) settleStorm(false); return; }
  if (!featOn('storms')) return;
  const wk = S.week + 2; // the week it would begin
  // Landorus comes to calm the skies after Tornadus or Thundurus has stormed this season
  if (S.forcesStorm === S.season && S.stormSeason === S.season && S.landorusSeason !== S.season && wk <= stormAt('Landorus')[1] && greatFree('Landorus') && rand() < LANDORUS_CHANCE) { S.landorusSeason = S.season; startStorm('Landorus'); return; }
  // each season may have one storm (about three seasons in four), planned when the season starts: which one, and a
  // week in its own part of the year, so the winter blizzard is as likely as the spring storms
  if (S.stormSeason === S.season) return;
  if (!S.stormPlan || S.stormPlan.season !== S.season) {
    const ok = Object.keys(STORMS).filter(sp => sp !== 'Landorus' && !STORMS[sp].galar && greatFree(sp));
    let sp = ok.length && rand() < STORM_CHANCE ? regionPick(ok) : null;
    const gal = sp && Object.keys(STORMS).find(k => STORMS[k].galar === sp);
    if (gal && greatFree(gal) && rand() < GALAR_STORM) sp = gal;
    S.stormPlan = { season: S.season, sp, wk: sp ? ri(Math.max(stormAt(sp)[0], S.week + 2), Math.max(stormAt(sp)[1], S.week + 2)) : null };
  }
  const P = S.stormPlan;
  if (P.sp && wk >= P.wk) { if (greatFree(P.sp) && wk <= stormAt(P.sp)[1] + 1) startStorm(P.sp); else S.stormSeason = S.season; }
}
// a short record of the region's legendary sightings, newest first
function logSky(text) { (S.skyLog = S.skyLog || []).unshift({ season: S.season, week: S.week + 1, text }); S.skyLog.length = Math.min(S.skyLog.length, 40); }
// ================= THE WORLD'S LEAGUES =================
// after a world is made or loaded: point the engine at the bound League
function applyCfg() {
  S.cfg = S.cfg || {};
  S.cfg.leagues = S.cfg.leagues || 1;
  applyRegions(); // (0.30.0) the world's own regions
}
// ---------- several Leagues ----------
// Each League keeps its own gyms, Elite Four, Champion, circuit, events and history. The bound League's state sits
// directly on S (so S.gyms is always "this League's gyms"); the others wait in S.leagues until bound.
const LEAGUE_FIELDS = ['vault', 'gyms', 'e4', 'champion', 'challengers', 'legend', 'legendSeason', 'legendGifts', 'greatCaught', 'rayquazaDue', 'wealdSeason', 'outbreak', 'outbreakLog', 'wormhole', 'metaMons', 'meta', 'league', 'history', 'stats', 'region', 'lgName', 'areaZero', 'roamer', 'roamSeason', 'storm', 'stormSeason', 'forcesStorm', 'landorusSeason', 'skyLog', 'roamPlan', 'stormPlan', 'bans', 'banBallot', 'banLog', 'banCount', 'lastLeague', 'runAvg', 'lastTitle', 'seatLogs', 'steer', 'metaNow', 'metaLog', 'metaTrend', 'metaYear', 'metaAt', 'seatB', 'banProt', 'fin', 'seatName', 'founder', 'prest', 'gmem', 'ranch', 'oldNames', 'plans', 'postSet', 'seatRule'];
const nLeagues = () => (S && S.leagues ? S.leagues.length : 1);
const lgOf = t => (t && t.lg) || 0;
// (0.17.0, stage 5) the League the player runs: League 0 until they leave it to found their own (S.me)
const ME = () => (S && S.me) || 0;
// the League that actually lists a trainer (circuit or post); falls back to their tag. Used before anything that
// moves a trainer, so a stale tag can never act on the wrong League (v163)
function dropFromCircuits(id) {
  S.challengers = S.challengers.filter(x => x !== id);
  for (const L of S.leagues || []) if (L && L !== S) L.challengers = L.challengers.filter(x => x !== id);
}
function homeLeague(t) {
  if (!t || !S.leagues || S.leagues.length < 2) return lgOf(t);
  for (let i = 0; i < S.leagues.length; i++) {
    const L = i === (S.lg || 0) ? S : S.leagues[i];
    if (L && (L.champion === t.id || L.e4.includes(t.id) || L.challengers.includes(t.id) || L.gyms.some(g => g.leader === t.id))) return i;
  }
  return lgOf(t);
}
const inLg = t => lgOf(t) === (S.lg || 0);
function useLeague(i) {
  i = i || 0;
  if (!S.leagues || i === (S.lg || 0) || i >= S.leagues.length) return;
  stampLeague();
  const out = {};
  for (const f of LEAGUE_FIELDS) out[f] = S[f];
  S.leagues[S.lg || 0] = out;
  const inn = S.leagues[i];
  for (const f of LEAGUE_FIELDS) S[f] = inn[f];
  S.leagues[i] = null; S.lg = i;
}
// run fn with League i bound, then put back whichever League was bound before
let LG_CTX = 0; // > 0 while code runs for one League in particular (its news is tagged with that League)
function inLeague(i, fn) { const was = S.lg || 0; useLeague(i); LG_CTX++; try { return fn(); } finally { LG_CTX--; useLeague(was); } }
function eachLeague(fn) { const out = []; for (let i = 0; i < nLeagues(); i++) out.push(inLeague(i, () => fn(i))); return out; }
const leagueName = i => i == null || i === (S.lg || 0) ? S.lgName : i < 0 ? ((S.folded || [])[-i - 1] || { name: 'a League that folded' }).name : (S.leagues[i] ? S.leagues[i].lgName : LEAGUE_SETS[i].name);
const lgShort = i => leagueName(i).replace(' League', '');
// trainers on this League's circuit and in its posts
function leagueTrainers() { return Object.values(S.trainers).filter(inLg); }
// put every trainer the bound League holds on its books
function stampLeague() { for (const id of [...S.challengers, ...staffIds()]) { const t = T(id); if (t) t.lg = S.lg || 0; } }
// how many challengers a League's circuit holds
const CIRCUIT_SIZE = 30; // the founding field of a League (24 before 0.6.0, 36 before 0.41.0). A circuit has no cap (0.4.0): everyone who wants to challenge does
const START_TEAM = 3; // Pokémon a challenger sets out with on each run (their best; a tuning dial)
// positions held (Gym Leader, Elite Four, Champion), for the Trainers tab
function postPlace(t, role) {
  if (role === 'leader') { const i = S.gyms.findIndex(g => g.leader === t.id); return i >= 0 ? `${townName(i)} Gym` : 'Gym'; }
  if (role === 'e4') { const i = S.e4.indexOf(t.id); return i >= 0 ? `Elite Four #${i + 1}` : 'Elite Four'; }
  if (role === 'gymtrainer') { const i = S.gyms.findIndex(g => (g.trainers || []).includes(t.id)); return i >= 0 ? `${townName(i)} Gym (gym trainer)` : 'Gym trainer'; }
  return 'Champion';
}
const curSeason = () => S.season || 1;
function closePost(t) { const p = (t.posts || []).find(x => x.to == null); if (p) { p.to = Math.max(p.from, S.season || 1); t.leftAt = S.turn; t.leftLg = p.lg; } }
// (0.13.0) a move within the League's staff this week costs no signing fee
function openPost(t, role) { if (t.talk != null) { const k = talkOf(t); if (k) talkGone(k, `${t.name} took another post before the deadline.`); } if (t.spon) { endContract(t, 'took a post'); t.sponFrom = null; } const was = (t.posts || []).some(x => x.to == null) || (t.leftAt === S.turn && t.leftLg === (S.lg || 0)); closePost(t); (t.posts = t.posts || []).push({ role, place: postPlace(t, role), from: curSeason(), to: null, lg: S.lg || 0 }); setAmbition(t, role); postPay(t, was); setContract(t, role, was); storeHire(t, role, was); }
// year points: 1 per badge, 3 for reaching the League, 2 per Elite Four win, 10 for the title, added up over
// every run of the year as they happen (yearOf(t).pts)
function trainerPoints(t) { return t.yr && t.yr.season === S.season ? t.yr.pts : 0; }
// ================= THE WEEK =================
// One continuous world (0.4.0). Every challenger is on their own clock: they set out on a run, take on the gyms
// with three tries at each, take on the Elite Four and Champion once they have eight badges and are ready, and
// rest between runs. Nothing waits for a season to end.
const READY_WEEKS = 3;        // weeks a challenger with eight badges may spend filling their team before the Elite Four
const REST_WEEKS = [6, 10];   // rest between runs at the same League
const REST_OLDER = 40;        // from this age a challenger rests two weeks longer
const REST_QUICK = [2, 3];    // rest before a run at a different League, after a run that reached the Elite Four
const TOUR_CHANCE = 0.75;     // a challenger who reached the Elite Four takes their next run to another League this often (decided 0.5.0)
const GIVE_UP_RUNS = 3;       // this many runs in a row that ended earlier than a typical run...
const GIVE_UP_CHANCE = 0.2;   // ...and a challenger gives up this often, at the end of each further early run (0.5.0: an older, larger field)
const GIVE_UP_GRACE = 3;      // nobody gives up in their first three years on the circuit
const GIVE_UP_MOVE = 0.25;    // with other Leagues to go to, this often they try one of those instead of retiring
const FOUNDING_STAGGER = 7;   // a founding field sets out over this many weeks
const TITLE_LOGS = 8;         // title battles kept for replay
// how many weeks into their run a challenger is (0 while resting or off the circuit)
const runWeeks = t => (t && t.role === 'challenger' && t.rest == null && t.runStart != null ? S.turn - t.runStart : 0);
// the bound League's running record of the year: League runs (entries), titles conceded, runs that ended on three
// losses, and how far the best challenger has got
function yearLeague() {
  if (!S.league) S.league = { season: S.season, entries: [], logs: [], conceded: [], startChamp: S.champion, out: 0, runs: 0, best: 0, bestId: null, gyms: [], seats: [[], [], [], [], []] };
  return S.league;
}
// the year report (0.8.0): everyone who held a place in each gym this year, and the tries each of them turned back
function yearGym(g) {
  const L = yearLeague(); L.gyms = L.gyms || [];
  return L.gyms[g] = L.gyms[g] || { lead: [], gt: [], by: {}, wl: 0, wt: 0 };
}
const addOnce = (a, id) => { if (id != null && !a.includes(id)) a.push(id); };
// who holds each post right now, added to the year's holders (every week, and at New Year)
function noteHolders() {
  const L = yearLeague();
  S.gyms.forEach((gym, g) => { const y = yearGym(g); addOnce(y.lead, gym.leader); for (const id of gym.trainers || []) addOnce(y.gt, id); });
  L.seats = L.seats || [[], [], [], [], []];
  [...S.e4, S.champion].forEach((id, k) => addOnce(L.seats[k], id));
}
// how far a challenger got this year: 0 to 8 badges, 9 to 12 Elite Four members beaten, 13 the title
const yearDepth = t => { const y = yearOf(t); return y.st != null ? 8 + y.st : y.b; };
// a trainer's own tally of the year (it starts afresh by itself when the year changes)
function yearOf(t) { if (!t.yr || t.yr.season !== S.season) t.yr = { season: S.season, b: 0, st: null, pts: 0, runs: 0 }; return t.yr; }
// how far a challenger has got: 0 to 8 badges, 9 to 12 Elite Four members beaten, 13 the title
function noteDepth(t, d) {
  const L = yearLeague(), y = yearOf(t);
  y.b = Math.max(y.b, t.badges.length);
  if (d > L.best) { L.best = d; L.bestId = t.id; }
}
// why a sim should pause for the player (the first reason of the week wins): a title conceded, a post that fell
// vacant, the New Year report
// with a League staffed by hand, only the player's own League stops the sim (and New Year, for everyone)
function stopFor(why, text) {
  if (why !== 'newyear' && handOn() && LG_CTX > 0 && (S.lg || 0) !== ME()) return;
  if (!S.stop) S.stop = { why, text: text || '' };
}
// a change to the world, kept for the year's review
function noteChange(text) { (S.yearChanges = S.yearChanges || []).push(nLeagues() > 1 ? `${lgShort(S.lg || 0)}: ${text}` : text); }
// a challenger sets out on a run: no badges, fresh tries, and their best START_TEAM Pokémon
function setOut(t) {
  autoEquip(t);
  t.badges = []; t.badgeWeek = null; t.gymStage = {}; t.gymTries = {}; t.gymLine = {}; t.gymAt = null; t.rest = null; t.ready = 0; t.mega = null;
  t.runStart = S.turn; t.runs = (t.runs || 0) + 1;
  for (const m of t.team) m.form = (m.form || 0) * 0.3;
  if (t.team.length > START_TEAM) applyRegistration(t, bestThree(t));
  setTeamLevel(t, GYM_LV[0]);
  t.gymAt = pickGym(t); // (0.32.0) the first gym of their route
  yearLeague().runs++; yearOf(t).runs++; entryFee();
}
// a run is over, on a third loss at one gym (stage is null) or after the Elite Four and Champion. The challenger
// may leave the circuit here; otherwise they rest, then set out again from the first gym.
function endRun(t, entry, stage) {
  const L = yearLeague(), depth = t.badges.length + (stage || 0);
  t.last = { season: S.season, week: S.week, badges: t.badges.length, stage: stage == null ? null : stage };
  if (stage == null) { L.out++; entry.out = true; }
  // a run that ended earlier than a typical run at this League (a running average) counts as an early one
  const typical = S.runAvg == null ? depth : S.runAvg;
  S.runAvg = S.runAvg == null ? depth : S.runAvg * 0.97 + depth * 0.03;
  t.early = stage == null && depth <= typical ? (t.early || 0) + 1 : 0;
  if (t.spon) sponRun(t, stage, depth); // (0.17.0) a sponsored contender's run: bounties for its sponsor
  // a challenger who accepted a post takes it up now (0.9.0): no retiring, giving up or changing Leagues; they rest
  // until the week's hiring is settled
  if (t.hired && stage === 5 && rand() < BACKOUT_CHANCE) {
    // (0.10.0) a title on their last run before arriving: half the time they back out
    const h = t.hired; cancelIncoming(h, `${t.name} won the title on their last run and backed out`);
    t.hired = null; t.hireDue = false;
    stopFor('ambition', `${dn(t)} won the title and backed out of becoming ${hireTarget(h)}.`);
  }
  if (t.hired) { t.hireDue = true; t.leaving = null; t.rest = S.turn + 1; return; }
  if (t.conq) { t.rest = S.turn + 1; return; } // (0.46.0) an Instant Conqueror takes the seat once the run is over
  // retiring with age or after a long dry spell was decided on their birthday and waited for the run to end
  if (t.leaving) { const why = t.leaving; t.leaving = null; retire(t, why); if (t.role !== 'challenger') return; }
  // weak challengers give up: several early runs in a row, and they retire or try their luck at another League
  // (0.41.0) likelier in a crowded regional field, less in a thin one (crowdMul)
  if (t.early >= GIVE_UP_RUNS && (t.seasons || 0) >= GIVE_UP_GRACE && !comebackProtected(t) && rand() < GIVE_UP_CHANCE * crowdMul(S.region)) {
    if (crowdMul(S.region) > 1) FIELD_LOG.crowdQuit++;
    const n = t.early;
    if (nLeagues() > 1 && rand() < GIVE_UP_MOVE && leagueMove(t, true)) t.early = 0;
    else { retire(t, `after ${n} runs in a row that ended early`); if (t.role !== 'challenger') return; }
  }
  // between runs a challenger may change Leagues. One who reached the Elite Four and goes to a different League
  // has a quick turnaround; the longer rest only keeps a challenger from trying the same League over and over.
  // (0.17.0) a contender goes to the League they were sent at, or comes home when recalled or the contract is over
  if (t.spon && sponMove(t)) { if (!t.spon) t.sponFrom = null; t.rest = S.turn + ri(REST_QUICK[0], REST_QUICK[1]); return; }
  // (0.41.0) a challenger staying in the region draws which of its Leagues to take on next (regionDraw)
  const moved = leagueMove(t, stage != null && rand() < TOUR_CHANCE) || regionDraw(t);
  t.rest = S.turn + (moved && stage != null ? ri(REST_QUICK[0], REST_QUICK[1]) : ri(REST_WEEKS[0], REST_WEEKS[1]) + (t.age >= REST_OLDER ? 2 : 0));
  starTalks(t, stage); // (0.53.0) a star's run is over: talks may open
}
const MOVE_CROWD = 1.25;
// a challenger moves to another League's circuit between runs: a Triple Crown chaser or a Globetrotter when its
// matchups suit them clearly better, anyone when `keen`
function leagueMove(t, keen) {
  if (nLeagues() < 2 || t.role !== 'challenger' || t.spon) return false;
  const from = lgOf(t);
  // (0.18.0) prestige draws challengers: PRESTIGE_DRAW per 100 prestige on top of the matchups
  // (0.41.0) a challenger who isn't chasing a Triple Crown or the world won't move into a region whose field is already
  // MOVE_CROWD times its aim (tours and give-up moves would otherwise pile challengers into the most attractive region)
  const roomy = i => slamChaser(t) || globetrotter(t) || lgRegion(i) === lgRegion(from) || fieldCrowd(lgRegion(i)) < MOVE_CROWD;
  const best = Array.from({ length: nLeagues() }, (_, i) => i).filter(i => slamRoom(t, i) && roomy(i) && !(S.founding && i === ME())).map(i => ({ i, gain: slamFit(t, i) - slamFit(t, from) + PRESTIGE_DRAW * (prestOf(i) - prestOf(from)) / 100 })).sort((a, b) => b.gain - a.gain)[0];
  if (!best) return false;
  const pulled = (slamChaser(t) || globetrotter(t)) && best.gain > MOVE_EDGE * (globetrotter(t) ? 0.5 : 1);
  if (!pulled && !keen) return false;
  shiftLeague(t, best.i);
  inLeague(best.i, () => news(`${dn(t)} moved from the ${leagueName(from)} to the ${leagueName(best.i)}.`, 'move', t.id));
  return true;
}
// (0.15.0, catch-up) runs that reach the Elite Four as a share of runs, by League, over the last two years. Until
// 0.41.0 weak challengers moved to a leakier League's circuit (easeMove); since the regional field it weighs in their
// draw (drawWeights) and in rivals' choice of targets for contenders.
function leagueEase() {
  if (S.easeAt === S.season && S.ease) return S.ease;
  S.ease = eachLeague(() => { const h = S.history.slice(-2), r = h.reduce((a, x) => a + (x.runs || 0), 0); return r ? h.reduce((a, x) => a + (x.qualifiers || 0), 0) / r : 0; });
  S.easeAt = S.season; return S.ease;
}
function doAction(t, act) {
  if (act === 'seek' && (t.role !== 'challenger' || !S.legend || legendBlocked(t, S.legend.sp))) act = 'train';
  const entry = { wk: S.week + 1, act };
  if (act === 'seek') {
    legendBattle(t, entry);
  } else if (act === 'league' && t.role === 'challenger' && t.badges.length >= 8) {
    leagueRun(t, entry);
  } else if (act === 'challenge' && t.role === 'challenger' && t.badges.length < 8) {
    gymTry(t, entry);
  } else if (act === 'explore') {
    const m = aiCatch(t);
    const ob = activeOutbreak();
    if (m && ob && LINE[m.sp] === LINE[ob.sp]) { ob.caught++; if (m.alpha) ob.alpha++; if (m.shiny) ob.shiny++; entry.outbreak = true; }
    if (m) { entry.caught = m.sp; if (m.alpha) entry.alpha = true; if (m.shiny) entry.shiny = true; if (m.radiant) entry.radiant = true; if (m.delta) entry.delta = m.delta;
      if (m.delta) catchNews(`${dn(t)} caught a Delta ${m.sp}, an unusual ${monTypes(m).join('/')} type${m.deltaAb && featOn('abilities') ? ` with an unusual ability, ${m.deltaAb}` : ''}!`, 'circuit', t.id);
      if (m.radiant) catchNews(`${dn(t)} caught a Radiant ${m.alpha ? 'alpha ' : ''}${m.sp}${m.radAb && featOn('abilities') ? `, glowing with ${m.radAb}` : ''}!`, 'circuit', t.id);
      if (m.shiny) catchNews(`${dn(t)} caught a shiny ${m.alpha ? 'alpha ' : ''}${m.sp}!`, 'circuit', t.id);
      else if (m.alpha) catchNews(`${dn(t)} caught an alpha ${m.sp}!`, 'circuit', t.id); }
    { const found = exploreFind(t); if (found) entry.found = found; }
    // the wormhole closes once its trainer has explored there, caught or not
    if (S.wormhole && S.wormhole.id === t.id) { const w = S.wormhole; S.wormhole = null; if (!m || m.sp !== w.sp) catchNews(`${w.sp} slipped back through the Ultra Wormhole before ${t.name} could catch it.`, 'circuit', t.id); }
  } else {
    entry.act = 'train';
    for (const m of t.team) m.fr = Math.min(255, (m.fr ?? 70) + Math.round((1 + Math.round(t.r.bnd / 50)) * temperFr(m)));
  }
  if (t.role !== 'challenger') return entry; // they retired when their run ended
  // the whole team stands at the level of the trainer's next battle (new catches and new badges included)
  setTeamLevel(t, challengerLevel(t));
  entry.learned = []; t.learned = [];
  t.weekLog.push(entry);
  return entry;
}
// who stands in gym g's line, in order; a challenger's gym trainers beaten only count while this stays the same
const gymLineKey = g => [...(S.gyms[g].trainers || []), S.gyms[g].leader].join(',');
// how many gym trainers a challenger has beaten at their next gym, as things stand
// (0.32.0) a challenger's progress is kept gym by gym: tries used (t.gymTries[g]), gym trainers beaten (t.gymStage[g],
// counted only while t.gymLine[g] is still the gym's line) and the gym they are heading for now (t.gymAt)
const triesAt = (t, g) => (t.gymTries && t.gymTries[g]) || 0;
const stageAtGym = (t, g) => (t.gymStage && t.gymStage[g] && t.gymLine && t.gymLine[g] === gymLineKey(g) ? t.gymStage[g] : 0);
const gymStageNow = t => (t.gymAt != null ? stageAtGym(t, t.gymAt) : 0);
// ---- the route (0.32.0) ----
// With gyms in any order a challenger picks their next gym from those they haven't beaten: the one their team matches
// best (its Pokémon against the types of the gym's line), putting off gyms that beat them before (gym memory) and gyms
// where they have used tries. A sharp trainer (Strategy) reads it well; a poor one picks close to randomly. They pick
// again after every badge and every loss (they may well go straight back). All numbers provisional.
const ROUTE_NOISE = 1.6, ROUTE_MEM = 0.5, ROUTE_TRY = 0.2;
const lineTypesOf = g => [...new Set([...(S.gyms[g].trainers || []), S.gyms[g].leader].map(T).filter(Boolean).flatMap(foeTypes))];
function gymMatch(t, g) {
  const ty = lineTypesOf(g); if (!ty.length || !t.team.length) return 0;
  return t.team.reduce((a, m) => a + counterScore(monTypes(m), ty), 0) / t.team.length;
}
function pickGym(t) {
  const open = S.gyms.map((_, g) => g).filter(g => !t.badges.includes(g));
  if (open.length === 1) return open[0];
  const noise = (100 - t.r.str) / 100 * ROUTE_NOISE, learn = gmemLearn(t);
  const sc = g => gymMatch(t, g) - (gmemAt(t, g) ? ROUTE_MEM * learn : 0) - ROUTE_TRY * triesAt(t, g) + (rand() - 0.5) * 2 * noise;
  return open.map(g => [g, sc(g)]).sort((a, b) => b[1] - a[1])[0][0];
}
function nextGym(t) { if (t.gymAt == null || t.badges.includes(t.gymAt)) t.gymAt = pickGym(t); return t.gymAt; }
const GYM_WATCH = 3; // badges conceded kept per gym for watching
// (0.21.0) the progress board's recent lists per gym: gym.recent = { thru: [[id, turn, try, [core]]], wall: [[id, turn,
// lostTo]] }, the last BOARD_KEEP of each (names, tries and results only, no battles); gym.out counts runs walled there
// this year and gym.beat the types in the squads that took its badge this year (both reset at New Year)
const BOARD_KEEP = 8;
function boardNote(gym, k, row) { const r = gym.recent = gym.recent || { thru: [], wall: [] }; r[k].push(row); if (r[k].length > BOARD_KEEP) r[k].shift(); }
// ---- gym memory (0.21.0) ----
// After a loss at a gym a challenger remembers the types of the trainer who beat them there (a trainer with no type
// focus: their team's two commonest types). On later tries they pick their squad against those types and lean their
// catches toward counters; Strategy sets how well they learn. The memory belongs to the League (League field gmem:
// { trainerId: { gym: { line, sps, ty } } }), so it is kept across runs there and never carried to another League.
// It is wiped when the gym changes: a new leader or gym trainer (the line), or GMEM_CHANGE of the line's Pokémon
// replaced since the memory formed (steer swaps, the losing-streak adaptation, a ban replacement). A gym that never
// changes erodes; one that keeps changing holds. All numbers provisional.
const GMEM_CHANGE = 0.3, GMEM_SQUAD = 1.2, GMEM_CATCH = 0.35, GMEM_EXPLORE = 0.3, GMEM_TYPES = 4;
const gmemLearn = t => clamp(((t.r ? t.r.str : 50) - 20) / 60, 0.2, 1);
// the species standing in gym g's line now
const gymLineSps = g => [...(S.gyms[g].trainers || []), S.gyms[g].leader].map(T).filter(Boolean).flatMap(x => x.team.map(m => m.sp));
// what a trainer brings to a gym: their class's types, else their team's two commonest types
function foeTypes(foe) {
  const st = specTypes(foe); if (st.length) return st;
  const n = {}; for (const m of foe.team) for (const ty of monTypes(m)) n[ty] = (n[ty] || 0) + 1;
  return Object.keys(n).sort((a, b) => n[b] - n[a]).slice(0, 2);
}
// the remembered types at gym g of the bound League, or null; a memory the gym has outgrown is wiped here
function gmemAt(t, g) {
  const m = S.gmem && S.gmem[t.id] && S.gmem[t.id][g]; if (!m) return null;
  if (m.line !== gymLineKey(g)) { gmemWipe(t.id, g); return null; }
  const now = gymLineSps(g), left = m.sps.slice(); let gone = 0;
  for (const sp of now) { const i = left.indexOf(sp); if (i >= 0) left.splice(i, 1); else gone++; }
  if (gone / Math.max(1, now.length) >= GMEM_CHANGE) { gmemWipe(t.id, g); return null; }
  return m.ty;
}
function gmemWipe(id, g) { const all = S.gmem && S.gmem[id]; if (!all) return; delete all[g]; if (!Object.keys(all).length) delete S.gmem[id]; }
function gmemNote(t, g, foe) {
  S.gmem = S.gmem || {};
  const all = S.gmem[t.id] = S.gmem[t.id] || {};
  let m = all[g];
  if (m && (m.line !== gymLineKey(g) || !gmemAt(t, g))) m = null;
  if (!m) m = all[g] = { line: gymLineKey(g), sps: gymLineSps(g), ty: [] };
  for (const ty of foeTypes(foe)) if (!m.ty.includes(ty)) m.ty.push(ty);
  if (m.ty.length > GMEM_TYPES) m.ty = m.ty.slice(-GMEM_TYPES);
}
// how well a set of types answers remembered ones: hitting them hard counts, being hit hard by them counts against
function counterScore(types, mem) {
  if (!mem || !mem.length) return 0;
  let v = 0; for (const ty of mem) v += (bestMult(types, [ty]) >= 2 ? 1 : 0) - (bestMult([ty], types) >= 2 ? 0.6 : 0);
  return v / mem.length;
}
// the memory at a challenger's next gym (their League), if any
const gmemNext = t => t.role === 'challenger' && t.badges && t.badges.length < 8 && t.gymAt != null ? gmemAt(t, t.gymAt) : null;
// a trainer who retired or took a post forgets: the store is pruned at New Year (one away on another League's
// circuit keeps theirs for when they come back)
function gmemPrune() {
  if (!S.gmem) return;
  for (const id of Object.keys(S.gmem)) { const t = T(+id); if (!t || t.role !== 'challenger') delete S.gmem[id]; }
}
// One try at a gym: the gym trainers still standing, then the leader, healed between battles, every battle at the
// gym's set level. A trainer already beaten stays beaten. A loss to anyone costs one of the run's three tries
// at this gym; the third loss ends the run.
function gymTry(t, entry) {
  const b = t.badges.length, g = nextGym(t), gym = S.gyms[g], lvl = GYM_LV[b], size = GYM_SIZE[b];
  const line = (gym.trainers || []).map(T).filter(Boolean).concat([T(gym.leader)]);
  // a challenger part-way through a gym whose staff changed keeps their tries but must beat its line from the first
  // trainer again (0.7.0)
  const key = gymLineKey(g);
  if (!t.gymTries || typeof t.gymTries !== 'object') t.gymTries = {};
  if (!t.gymStage || typeof t.gymStage !== 'object') t.gymStage = {};
  if (!t.gymLine || typeof t.gymLine !== 'object') t.gymLine = {};
  if (t.gymStage[g] && t.gymLine[g] !== key) t.gymStage[g] = 0;
  setTeamLevel(t, lvl);
  entry.gym = g; entry.b = b; entry.won = true; entry.tryNo = triesAt(t, g) + 1;
  const mem = gmemAt(t, g); // (0.21.0) what beat them here before
  const yg = yearGym(g), band = stageBand(b);
  yg.sb = yg.sb || [[0, 0], [0, 0], [0, 0]]; yg.sb[band][0]++; // (0.32.0) tries and holds by the challenger's stage
  let res = null;
  for (let k = Math.min(t.gymStage[g] || 0, line.length - 1); k < line.length; k++) {
    const foe = line[k], isLeader = k === line.length - 1;
    const autoItems = itemsOn();
    if (autoItems) autoEquip(t, foe); // items picked for this battle
    // (0.32.0) the trainer in front of them fields the number this stage needs (a gym trainer one fewer than the
    // leader), at this stage's level
    const vs = t.team.filter(m => obeys(t, m, lvl)), restore = staffField(foe, lvl, Math.max(1, isLeader ? size : size - 1), vs.length ? vs : t.team);
    try {
      res = setBattle(t, foe, lvl, 'gym', isLeader ? `${townName(g)} Gym · badge ${b + 1}` : `${townName(g)} Gym · gym trainer ${dn(foe)}`, gymWeatherType(T(gym.leader)), homeEdge(g), mem);
    } finally { restore(); }
    if (autoItems) autoEquip(t);
    entry.opp = foe.id; entry.left = res.sides[0].left; entry.stage = k;
    if (res.winner !== 0) {
      entry.won = false;
      t.career.gymL++; gym.w++; gym.streak = 0;
      if (isLeader) gym.lw = (gym.lw || 0) + 1; else foe.career.gymW = (foe.career.gymW || 0) + 1;
      addOnce(isLeader ? yg.lead : yg.gt, foe.id); yg.by[foe.id] = (yg.by[foe.id] || 0) + 1; if (isLeader) yg.wl++; else yg.wt++;
      yg.sb[band][1]++;
      t.gymTries[g] = triesAt(t, g) + 1;
      gmemNote(t, g, foe);
      t.gymAt = null; // (0.32.0) they pick their next gym again (it may be this one)
      if (t.gymTries[g] < GYM_TRIES) t.gymAt = pickGym(t);
      else { gym.out = (gym.out || 0) + 1; boardNote(gym, 'wall', [t.id, S.turn, foe.id]); const th = themeOf(); news(th.out ? th.out(dn(t), townName(g), b) : `${dn(t)} lost a third time at ${townName(g)} ${gymWord()}. Their run is over with ${b} badge${b === 1 ? '' : 's'}.`, 'circuit', t.id); endRun(t, entry, null); }
      return;
    }
    if (!isLeader) { foe.career.gymL = (foe.career.gymL || 0) + 1; t.gymStage[g] = k + 1; t.gymLine[g] = key; }
  }
  boardNote(gym, 'thru', [t.id, S.turn, entry.tryNo, res ? res.sides[0].team.map(m => m.sp).slice(0, 3) : [], b]);
  if (res) { gym.beat = gym.beat || {}; for (const m of res.sides[0].team) for (const ty of m.types || []) gym.beat[ty] = (gym.beat[ty] || 0) + 1; }
  t.badges.push(g); t.career.badges++; t.career.gymW++; gym.l++;
  contenderRenown(t, g); // (0.40.0) a contender's badge earns their sponsor renown in this city
  delete t.gymStage[g]; delete t.gymLine[g]; t.gymAt = t.badges.length < 8 ? pickGym(t) : null;
  // the player's League keeps the last few badges each gym conceded, to watch (0.7.0)
  if ((S.lg || 0) === ME() && res) { res.when = { season: S.season, week: S.week }; (gym.watch = gym.watch || []).push(res); if (gym.watch.length > GYM_WATCH) gym.watch.shift(); }
  yearOf(t).pts++; noteDepth(t, t.badges.length);
  gymLost(g, t);
  if (t.badges.length === 8) {
    t.badgeWeek = S.turn - t.runStart + 1; t.ready = 0; earnMega(t);
    news(`${dn(t)} completed the badge circuit in ${t.badgeWeek} weeks and will take on the Elite Four.`, 'circuit', t.id);
  }
  gymItemOffer(t, b, T(gym.leader));
}
// One run at the Elite Four and the Champion, as soon as a challenger with eight badges is ready. Every battle is at
// a set level for both sides, six against (up to) six, healed between battles; a loss to anyone ends it. The Champion
// keeps the seat whatever happens: a challenger who beats them is credited with a title, and it is a title conceded.
// (0.21.0) the Hall of Fame on winning: every title win is its own entry at once, with the team that beat the
// Champion (species, moves, item, ability, as each was at the title's level), the year, the League, the Champion beaten
// and whether the winner was a sponsored contender. S.hof = [{ uid, id, season, week, lg, champ, spon, team }]; the
// title battle carries the entry's uid (r.hof) while the League keeps it. Anyone with an entry is a Hall of Famer
// (t.hof, t.hofN entries). Nobody is inducted at retirement any more.
function hofEnter(q, champ, r) {
  const pool = q.team.slice(), team = [];
  for (const b of r.sides[0].team) {
    const i = pool.findIndex(m => m.sp === b.sp); const m = i >= 0 ? pool.splice(i, 1)[0] : null;
    team.push({ sp: b.sp, lv: b.L, moves: m && m.moves ? m.moves.slice() : [], item: m ? heldItem(m) || null : null, ab: b.ab || null, shiny: !!b.shiny });
  }
  const e = { uid: uid(), id: q.id, season: S.season, week: S.week, lg: S.lg || 0, champ: champ.id, cw: postWord('champion'), spon: q.spon ? q.spon.lg : null, team, route: (q.badges || []).map(townName) };
  (S.hof = S.hof || []).push(e); r.hof = e.uid;
  q.hof = true; q.hofN = (q.hofN || 0) + 1;
  return e;
}
const hofOf = t => (S.hof || []).filter(e => e.id === t.id);
function leagueRun(q, entry) {
  const L = yearLeague(), y = yearOf(q);
  for (const id of [...S.e4, S.champion]) { const s = T(id); if (s) eliteMega(s); }
  if (hasMega(q) && !megaHolder(q)) assignMegaStone(q);
  q.career.leagueApps++; y.pts += 3;
  const e = { id: q.id, stage: 0, lostTo: null, week: S.week, route: (q.badges || []).map(townName) };
  let ok = true, conq = false;
  for (let i = 0; i < 4; i++) {
    const foe = T(S.e4[i]);
    setTeamLevel(q, E4_LV[i]);
    if (itemsOn()) autoEquip(q, foe);
    const r = setBattle(q, foe, E4_LV[i], 'league', `Elite Four · ${dn(foe)}`, undefined, homeEdge('seat'));
    if (r.winner === 1) { ok = false; e.stage = i; e.lostTo = foe.id; foe.career.e4Wins++; break; }
    y.pts += 2; noteDepth(q, 9 + i);
  }
  if (ok) {
    e.stage = 4; // through the Elite Four: the title match
    const champ = T(S.champion);
    setTeamLevel(q, champLv());
    if (itemsOn()) autoEquip(q, champ);
    const r = setBattle(q, champ, champLv(), 'title', `Championship · ${dn(champ)}`, undefined, homeEdge('seat'));
    r.when = { season: S.season, week: S.week };
    L.logs.push(r); if (L.logs.length > TITLE_LOGS) L.logs.shift();
    if (r.winner === 0) {
      e.stage = 5; y.pts += 10; noteDepth(q, 13);
      q.career.titles++;
      (q.titleSeasons = q.titleSeasons || []).push(S.season); (q.titleLgs = q.titleLgs || []).push(S.lg || 0); (q.titleAges = q.titleAges || []).push({ season: S.season, age: q.age });
      champ.career.conceded = (champ.career.conceded || 0) + 1;
      L.conceded.push(q.id); S.lastTitle = S.turn;
      hofEnter(q, champ, r);
      conq = conquerNow(q); if (conq) q.conq = true; // (0.46.0) an Instant Conqueror: the seat changes hands after the run ends
      const msg = `${dn(q)} defeated ${dn(champ)} and won the ${S.lgName} title! ${conq ? `Under the Conqueror rule, ${q.name} takes the ${postWord('champion')}'s seat` : `${champ.name} keeps the ${postWord('champion')}'s seat`}; the League has conceded ${L.conceded.length === 1 ? 'a title' : L.conceded.length + ' titles'} this year.`;
      news(msg, 'title', q.id); if (!conq) stopFor('title', msg);
    } else {
      e.lostTo = champ.id; champ.career.defenses++;
      const th = themeOf(); news(th.defend ? th.defend(dn(champ), dn(q)) : `${dn(champ)} defended the title against ${dn(q)}.`, 'title', champ.id); // (0.42.0) the theme's wording
    }
  } else news(`${dn(q)}'s run at the ${S.lgName} ended against ${dn(T(e.lostTo))} of the ${postWord('e4')}.`, 'title', q.id);
  L.entries.push(e);
  y.st = Math.max(y.st == null ? -1 : y.st, e.stage);
  // a deep League run (reaching the last Elite Four member or further) earns a rare item
  if (itemsOn() && e.stage >= 3) {
    let k = rollItem(3); for (let i = 0; i < 20 && ITEMS[k].tier < 2; i++) k = rollItem(3);
    bagAdd(q, k); autoEquip(q);
  }
  entry.league = e.stage; if (e.lostTo) entry.opp = e.lostTo;
  endRun(q, entry, e.stage);
  if (conq) { q.conq = null; seatConquerNow(q); }
}
// one week of the whole world
function simWeek() {
  S.stop = null;
  migrationWeek(); // (0.27.0) migration waves, world-level, before anyone catches or buys
  eachLeague(leagueWeek);
  moneyWeek();
  sponsorWeek();
  hireArrivals();
  eachLeague(ambitionWeek);
  eachLeague(contractWeek); // (0.52.0) contracts: renewal windows and endings
  talksWeek(); // (0.53.0) open talks: offers, raises, deadlines
  challengeWeek();
  seatWeek(); // (0.43.0) a Term appointment left unanswered
  birthdays();
  arrivals();
  S.week++; S.turn = (S.turn || 0) + 1;
  eachLeague(() => { maybeWormhole(); maybeOutbreak(); });
  if (S.week >= YEAR_WEEKS) newYear();
}
// one League's week: every challenger who is out on a run acts; one whose rest is over sets out again
function leagueWeek() {
  noteHolders();
  if (S.week % QUARTER_WEEKS === 0 && S.turn > 0) planReview(); // (0.39.0) the quarterly team review (your League)
  if (S.week % 4 === 0 && S.turn > 0) steerMonth();
  for (const id of shuffle(S.challengers)) {
    const t = T(id); if (!t || t.role !== 'challenger' || !S.challengers.includes(id)) continue;
    if (t.rest == null && t.runStart == null) t.rest = S.turn; // new to the circuit
    if (t.rest != null) { if (S.turn < t.rest) continue; setOut(t); }
    doAction(t, aiAction(t));
  }
  roadBattles();
  checkBonds();
  legendWeek();
  roamWeek();
  stormWeek();
}
// newcomers set out one at a time through the year, and anyone without a place takes one: a circuit has no cap
function arrivals() {
  const every = Math.round(YEAR_WEEKS / NEWCOMERS_PER_LEAGUE);
  if (S.week % every === Math.floor(every / 2)) fieldArrivals(); // (0.41.0) by region, to each region's field
  if (S.freeAgents.length) fillCircuits(S.freeAgents.slice());
  academyWeek();
}

// ---------- World Championship: the Champions of every League meet once the Leagues are done ----------
function worldBattle(a, b, round, W) {
  // fought on neutral ground: no League's weather or meta stats carry over
  // fought on copies: win or lose, a Champion goes home exactly as they arrived (form, records), so the
  // World Championship never tilts their own League's next title race
  const copy = t => JSON.parse(JSON.stringify(t));
  const A = copy(T(a)), B = copy(T(b));
  const keep = { stats: S.stats, dex: S.dex, dexSeason: S.dexSeason };
  S.stats = { ko: {}, use: {} }; S.dex = {}; S.dexSeason = {};
  let r;
  try { r = inLeague(lgOf(T(a)), () => battle(A, B, 'title', `World Championship ${round} · ${dn(A)} vs ${dn(B)}`, { equal: true, world: true })); }
  finally { Object.assign(S, keep); }
  r.world = round;
  const w = r.winner === 0 ? a : b, l = w === a ? b : a;
  W.matches.push({ round, a, b, winner: w, log: r });
  return { w, l };
}
function worldChampionship() {
  const champs = eachLeague(() => S.champion);
  const W = { season: S.season, entrants: champs.slice(), matches: [], winner: null, runner: null };
  // 2.0: a knockout for any number of Leagues; with an odd field the Champions with the strongest teams get byes
  let P = 2; while (P < champs.length) P *= 2;
  const byes = P - champs.length;
  const ranked = byes ? champs.slice().sort((a, b) => teamPower(T(b)) - teamPower(T(a))) : shuffle(champs.slice());
  let alive = ranked.slice(0, byes); W.byes = alive.slice();
  const rest = shuffle(ranked.slice(byes));
  const rname = n => n <= 2 ? 'Final' : n <= 4 ? 'Semifinal' : 'Quarterfinal';
  if (rest.length && champs.length > 2) { const nm = rname(P); const next = []; for (let x = 0; x + 1 < rest.length; x += 2) next.push(worldBattle(rest[x], rest[x + 1], nm, W).w); alive = alive.concat(next); } else alive = alive.concat(rest);
  while (alive.length > 2) { const nm = rname(alive.length), next = []; for (let x = 0; x + 1 < alive.length; x += 2) next.push(worldBattle(alive[x], alive[x + 1], nm, W).w); if (alive.length % 2) next.push(alive[alive.length - 1]); alive = next; }
  const f = worldBattle(alive[0], alive[1], 'Final', W);
  W.winner = f.w; W.runner = f.l;
  const t = T(f.w);
  t.career.worlds = (t.career.worlds || 0) + 1; (t.worldSeasons = t.worldSeasons || []).push(S.season);
  (S.worldHist = S.worldHist || []).push({ season: S.season, winner: f.w, runner: f.l, winnerName: dn(t), runnerName: dn(T(f.l)), winnerLg: lgOf(t), runnerLg: lgOf(T(f.l)), entrants: champs.slice() });
  S.worlds = W;
  news(`${dn(t)}, Champion of the ${leagueName(lgOf(t))}, won the Year ${S.season} World Championship, beating ${dn(T(f.l))} of the ${leagueName(lgOf(T(f.l)))} in the final!`, 'title', t.id);
}
// how far a challenger got, in words (see L.report.best)
function depthName(d) { return d <= 8 ? `${d} badge${d === 1 ? '' : 's'}` : d <= 12 ? `beat ${d - 8} of the Elite Four` : 'won the title'; }

// a new Elite Four member from outside the circuit (sometimes a famous trainer)
function outsiderE4(i) {
  const q = capQ(66); // (0.23.0) no stronger than the League's prestige can attract
  const fam = !(S.cfg && S.cfg.allFamous) && famousOk(q) && rand() < FAMOUS_POST_CHANCE ? famousAvailable(f => f.spec && f.age >= 18 && (/Elite Four|Kahuna|Master/.test(f.cls) || f.tags.includes('brain')) && !S.e4.some((x, j) => j !== i && x && T(x) && T(x).specialty === f.spec)) : [];
  const nt = fam.length ? makeFamous(pick(fam), 'e4', staffQ(q), E4_LV[i]) : newTrainer({ age: ri(30, 45), quality: staffQ(q), role: 'e4' });
  installElite(nt, 'e4', i);
  return nt;
}

// ================= OFFSEASON / WORLD CHANGES =================
function retire(t, why) { const i = homeLeague(t); t.lg = i; return inLeague(i, () => retireHere(t, why)); }
// a League's founding Champion is guaranteed its first six seasons: whatever would have retired them sends them
// back to the circuit instead (a free agent just stays a free agent)
const FOUNDER_SEASONS = 6;
const founderProtected = t => !!t.foundingChamp && (S.season || 0) < FOUNDER_SEASONS;
// a Gym Leader who came back to the circuit is guaranteed five seasons there, whatever their age
const comebackProtected = t => t.noRetireUntil != null && (S.season || 0) < t.noRetireUntil;
function retireHere(t, why) {
  if (t.talk != null && t.role !== 'champion') { const k = talkOf(t); if (k) talkGone(k, `${t.name} retired before the deadline.`); } // (0.53.0)
  if (t.spon) { endContract(t, 'retired'); t.sponFrom = null; } // (0.17.0) a contender's contract ends with their career
  // the reigning Champion never retires; the title only changes hands in battle
  if (t.id === S.champion && t.role === 'champion') return;
  if (t.role === 'retired') return;
  if (founderProtected(t) || comebackProtected(t)) {
    if (['leader', 'e4', 'exchamp', 'gymtrainer'].includes(t.role)) { closePost(t); t.role = 'challenger'; t.returned = S.season; t.lg = S.lg || 0; t.rest = S.turn + 1; if (!S.challengers.includes(t.id)) S.challengers.push(t.id); news(`${dn(t)}, ${founderProtected(t) ? "the League's founding Champion" : 'back from a long run as a Gym Leader'}, isn't ready to retire and returns to the badge circuit.`, 'move', t.id); }
    return;
  }
  const was = dn(t);
  closePost(t);
  if (t.role === 'challenger') S.challengers = S.challengers.filter(x => x !== t.id);
  for (const m of t.team.filter(x => x.partners && isLegendLine(x.sp))) { farewell(t, m, `moved on when ${t.name} retired`); t.team = t.team.filter(x => x !== m); }
  t.prevRole = t.role; t.role = 'retired'; t.retiredSeason = S.season;
  scheduleLegacy(t);
  compactRetired(t);
  // (0.21.0) title winners enter the Hall of Fame when they win, not when they retire
  news(`${was} retired${why ? ' ' + why : ''}.${t.hof ? ` A Hall of Famer, with ${t.hofN || 1} entr${(t.hofN || 1) === 1 ? 'y' : 'ies'}.` : ''}`, 'move', t.id);
}
// a retired trainer keeps their career, but not last season's week-by-week log or Pokémon that barely battled:
// it keeps saves small enough for the browser with several Leagues
function compactRetired(t) {
  t.weekLog = []; t.store = null; t.storePick = null; // (0.37.0)
  t.alumni = (t.alumni || []).filter(m => m.st && m.st.b >= 3).slice(0, 8);
  trimH2h(t);
}
// ---- Elite Four seat challenges ----
// A seat only changes hands in battle. The loser decides whether to retire or go back to the circuit:
// young trainers almost always try again, older ones usually retire.
// Retiring for age needs both: age 50+ and at least this trainer's career length (15–20 seasons, set once).
// ---------- a crossroads: 10 straight seasons without completing the badge circuit ----------
// A challenger who isn't near retirement age gets a chance each offseason to either retire or reinvent themselves:
// a new type and the class that goes with it, a Pokémon of that type, and a small bump to every rating.
// The count starts over after a reinvention.
const CROSSROADS_SEASONS = 10, CROSSROADS_CHANCE = 0.3, CROSSROADS_RETIRE = 0.5, CROSSROADS_MAX_AGE = 42;
function dryStreak(t) {
  let n = 0;
  for (const h of (t.seasonHist || []).slice().reverse()) { if (t.reinvented && h.season <= t.reinvented) break; if (h.badges === 8) break; n++; }
  return n;
}
// returns why they will retire (at the end of their run), or null
function crossroads(t) {
  if (t.role !== 'challenger' || t.famous || comebackProtected(t) || t.age > CROSSROADS_MAX_AGE || dryStreak(t) < CROSSROADS_SEASONS || rand() >= CROSSROADS_CHANCE) return null;
  if (rand() < CROSSROADS_RETIRE) return `after ${dryStreak(t)} years without completing the badge circuit`;
  reinvent(t);
  return null;
}
function reinvent(t) {
  const was = dn(t), oldSpec = t.specialty;
  // a new type with a class that suits the trainer
  const types = shuffle(TYPES.filter(ty => ty !== t.specialty && (CLASSES[ty] || []).some(([, g]) => !g || g === t.gender)));
  // the new class can't be one that already has a trainer with this name
  let ty = null, cls = null;
  for (const cand of types) { const opts = CLASSES[cand].filter(([c, g]) => (!g || g === t.gender) && !titleNameTaken(c, t.name, t)); if (opts.length) { ty = cand; cls = pick(opts)[0]; break; } }
  if (!ty) return;
  t.specialty = ty; t.spec2 = null; t.cls = cls;
  for (const k of RK) t.r[k] = clamp(t.r[k] + ri(2, 4), 1, 99);
  t.pot = Math.max(t.pot, ovr(t) + ri(1, 3));
  // a Pokémon of the new type to build around, at the team's level
  const lvl = Math.max(5, Math.floor(Math.max(...t.team.map(m => m.lvl), 10)) - 2);
  const cands = [...new Set(BASES.filter(b => SP[b].types.includes(ty)).map(b => formAt(b, lvl)))].filter(f => SP[f].bst <= 320 + lvl * 6 && !t.team.some(m => LINE[m.sp] === LINE[f]));
  let got = null;
  if (cands.length) {
    got = stamp(makeMon(pick(cands), lvl), 'caught');
    if (t.team.length >= 6) { const out = t.team.filter(m => !isSpecial(m) && !SP[m.sp].legend).sort((a, b) => monPower(a) - monPower(b))[0]; if (out) { farewell(t, out, 'released when ' + t.name + ' changed class'); t.team = t.team.filter(m => m !== out); } else got = null; }
    if (got) t.team.push(got);
  }
  t.reinvented = S.season; (t.classHist = t.classHist || []).push({ season: S.season, from: was, to: dn(t), spec: ty, fromSpec: oldSpec || null });
  const msg = `${was} hit a wall after ${CROSSROADS_SEASONS}+ years without completing the badge circuit and reinvented themselves as ${dn(t)}, a ${ty}-type specialist${got ? ` (new partner: ${got.sp})` : ''}. Every rating went up a little.`;
  news(msg, 'move', t.id);
}
// (0.10.0) a career's length: set by the age a trainer started at (young starters run longest), stretched by strong
// ratings and a title (up to CAREER_MERIT years) and by long service in posts (a year per five, up to CAREER_SERVICE)
const CAREER_MERIT = 3, CAREER_SERVICE = 2;
function careerBase(t) {
  if (!t.span) { const s = t.age - (t.seasons || 0); t.span = s <= 14 ? ri(22, 30) : s <= 24 ? ri(18, 26) : s <= 34 ? ri(14, 22) : ri(8, 16); }
  return t.span;
}
function careerSpan(t) {
  const o = ovr(t), merit = (o >= 80 ? 2 : o >= 72 ? 1 : 0) + ((t.career && t.career.titles) ? 1 : 0);
  return careerBase(t) + Math.min(CAREER_MERIT, merit) + Math.min(CAREER_SERVICE, Math.floor(postYears(t) / 5));
}
function ageRetireChance(t) { if (comebackProtected(t) || slamProtected(t) || t.age < 50 || (t.seasons || 0) < careerSpan(t)) return 0; return clamp((t.age - 48) * 0.1, 0.1, 0.9); }
// Losing a post (Champion, Elite Four, or stepping down as a Gym Leader): over 45 with a career of 10+ seasons they retire,
// otherwise they go back to the circuit.
const POST_RETIRE_AGE = 45, POST_RETIRE_CAREER = 10;
// a member of staff who leaves for another run as a challenger is guaranteed five years on the circuit (0.10.0: the
// ambition replaces the source's automatic Gym Leader comeback)
const COMEBACK_GUARD = 5;
const retiresOnLosingPost = t => !comebackProtected(t) && !slamProtected(t) && t.age > POST_RETIRE_AGE && (t.seasons || 0) >= POST_RETIRE_CAREER;
function returnToCircuit(t, why) {
  closePost(t);
  if (t.role === 'challenger') return;
  t.role = 'challenger'; t.returned = S.season; t.lg = S.lg || 0; t.rest = S.turn + 1;
  if (!S.challengers.includes(t.id)) S.challengers.push(t.id);
  news(`${t.name} ${why} and will return to the badge circuit.`, 'move', t.id);
}
function retireOrReturn(t, why) {
  if (retiresOnLosingPost(t)) { retire(t, why); return 'retired'; }
  returnToCircuit(t, why);
  return 'returned';
}
// ================= SEAT CHALLENGES (0.11.0, stage 2c) =================
// At New Year each League holds at most one challenge for the Champion's seat and one for an Elite Four seat. An
// Elite Four member who wants promotion, has held the seat in two calendar years (this one included) and didn't have
// the worst record of the four challenges the Champion. A Gym Leader who wants promotion and whose gym was one of the
// three best-holding last year, or a challenger who reached the Elite Four this year when the seat's holder is CHAL_OLD
// or older (0.14.0; until then also with an OVR edge of 2), challenges the weakest Elite Four seat (the worst record
// of the four, else the lowest OVR for age). One set-level battle at the seat's level. The challenger fields a team
// built for the seat (a Gym Leader's is topped up to six as on joining the Elite Four), kept if they win. A beaten
// Champion takes the winner's Elite Four seat; a beaten Elite Four member takes the winning Gym Leader's gym, or goes
// back to the circuit (or retires) if a challenger beat them. A beaten member of staff keeps their post and turns
// restless (their promotion clock moves a year on). Anyone who challenged waits CHAL_WAIT years. In the player's
// League each challenge waits for a yes or no (S.chalPending, CHAL_ANSWER weeks, then it goes ahead); a refusal makes
// a member of staff restless too. The year's challenges go into its history entry (h.chal); the battles are kept in
// S.seatLogs (SEAT_LOGS a League). All numbers provisional.
const SEAT_LOGS = 6, CHAL_WAIT = 2, CHAL_ANSWER = 4, CHAL_OLD = 50, CHAL_SEAT_YEARS = 1; // (0.34.0) one year in the seat, was 2
const seatYears = t => { const p = (t.posts || []).find(x => x.to == null); return p ? S.season - p.from + 1 : 0; };
const canChallenge = t => !!t && !t.acting && t.stepDown == null && (t.chalAt == null || S.season - t.chalAt >= CHAL_WAIT);
const wantsUp = t => !!(t.wish && t.wish.k === 'up');
// the seat a Gym Leader or a deep run challenges: the worst record of the four, else the lowest OVR for age
function weakestSeat(skip) {
  const seats = S.e4.map((id, k) => ({ k, t: T(id) })).filter(x => x.t && !x.t.acting && x.k !== skip);
  if (!seats.length) return null;
  const score = x => ovr(x.t) - x.t.age / 6 - (x.t.e4Poor || 0) * 100;
  return seats.sort((a, b) => score(a) - score(b))[0].k;
}
function champChallenger() {
  if (founderChamp(T(S.champion)) || champGrace()) return null; // (0.15.0) nobody challenges a founder Champion in their window
  return S.e4.map(T).filter(t => t && t.role === 'e4' && canChallenge(t) && wantsUp(t) && !(t.e4Poor > 0) && seatYears(t) >= CHAL_SEAT_YEARS)
    .sort((a, b) => ovr(b) - ovr(a))[0] || null;
}
function seatChallenger(skip, not) {
  const slot = weakestSeat(skip); if (slot == null) return null;
  const inc = T(S.e4[slot]), cands = [];
  S.gyms.forEach((g, i) => { const t = T(g.leader); if (t && !g.acting && canChallenge(t) && wantsUp(t) && (t.wallStreak || 0) >= 1) cands.push({ t, from: 'leader', gym: i }); });
  for (const id of new Set(yearLeague().entries.map(e => e.id))) {
    const t = T(id);
    if (t && t.id !== not && t.role === 'challenger' && !t.spon && S.challengers.includes(id) && canChallenge(t) && !t.hired && !t.hireDue && !t.leaving && inc.age >= CHAL_OLD) cands.push({ t, from: 'circuit', gym: null });
  }
  const c = cands.sort((a, b) => ovr(b.t) - ovr(a.t))[0];
  return c ? { k: 'e4', cand: c.t.id, inc: inc.id, slot, from: c.from, gym: c.gym } : null;
}
function chalText(x) {
  const c = T(x.cand), i = T(x.inc);
  if (x.from === 'claim') return `${dn(c)}, who beat Champion ${i.name} for the title this year, claims the Champion's seat.`;
  if (x.called) return `You called ${dn(c)} (${callFrom(x)}) to challenge Champion ${i.name} for the Champion's seat.`;
  if (x.k === 'champ') return `${dn(c)} (Elite Four #${x.slot + 1}${x.from === 'rival' ? ` of the ${leagueName(x.lg)}` : ''}) challenges Champion ${i.name} for the Champion's seat.`;
  return `${dn(c)} (${x.from === 'leader' ? `${townName(x.gym)} Gym Leader` : 'after a run to the Elite Four'}) challenges ${dn(i)} for Elite Four seat #${x.slot + 1}.`;
}
// is everyone still where they were when the challenge was made?
function chalValid(x) {
  const c = T(x.cand), i = T(x.inc);
  if (!c || !i || i.acting || c.acting) return false;
  if (x.from === 'claim') return S.champion === x.inc && claimFree(c);
  if (x.from === 'rival') return S.champion === x.inc && x.lg < nLeagues() && inLeague(x.lg, () => S.e4[x.slot] === x.cand);
  if (x.k === 'champ') {
    if (S.champion !== x.inc) return false;
    if (x.from === 'leader') return S.gyms[x.gym].leader === x.cand && !S.gyms[x.gym].acting; // (0.34.0) called
    if (x.from === 'circuit') return claimFree(c); // (0.34.0) a called title winner
    return S.e4[x.slot] === x.cand;
  }
  if (S.e4[x.slot] !== x.inc) return false;
  if (x.from === 'leader') return S.gyms[x.gym].leader === x.cand && !S.gyms[x.gym].acting;
  return c.role === 'challenger' && S.challengers.includes(c.id) && !c.hired && !c.hireDue;
}
// at New Year (leagueNewYear, after the year's history entry): find this year's challenges; rival Leagues fight them at once
function seatChallenges(changes) {
  if (fixedStaff() || S.founding) return;
  // (0.34.0) in the player's League the Champion's seat is challenged only when the player calls a challenge
  // (callChallenge) or allows a title claim; a rival League's manager calls its New Year challenge by aim (CALL_AI)
  // (0.43.0) called challenges, claims and rivals' challenges for the Champion's seat only under the Protected rule
  const mine = playerLeague(), prot = seatRuleKey() === 'protected', callAi = prot && !mine && rand() < (CALL_AI[S.fin && S.fin.aim] || 0.6);
  const out = [], cl = prot ? claimant() : null, c = cl || !callAi ? null : champChallenger();
  // (0.22.0) a title claim takes the year's one challenge for the Champion's seat
  if (cl) out.push({ k: 'champ', cand: cl.id, inc: S.champion, slot: null, from: 'claim', gym: null });
  else if (c) out.push({ k: 'champ', cand: c.id, inc: S.champion, slot: S.e4.indexOf(c.id), from: 'e4', gym: null });
  else if (callAi) { const r = rivalChampChallenger(); if (r) out.push(r); }
  const s = seatChallenger(c ? S.e4.indexOf(c.id) : null, cl ? cl.id : null);
  if (s) out.push(s);
  for (const x of out) { x.season = S.season; T(x.cand).chalAt = S.season; }
  if (playerLeague()) {
    for (const x of out) {
      const claim = x.from === 'claim';
      x.due = S.turn + (claim ? CLAIM_ANSWER : CHAL_ANSWER); (S.chalPending = S.chalPending || []).push(x);
      if (claim) T(x.cand).claimOn = x.due;
      const msg = claim ? `${chalText(x)} Allow the battle, turn the claim down, or offer them a post by ${turnDate(x.due)}; unanswered, the claim lapses and they leave unhappy.`
        : `${chalText(x)} Approve or refuse it by ${turnDate(x.due)}; unanswered, it goes ahead.`;
      news(msg, 'move', x.cand); changes.push(msg); stopFor('challenge', msg);
    }
  } else for (const x of out) changes.push(x.from === 'claim' && rand() >= (CLAIM_AI_YES[S.fin && S.fin.aim] || 0.5) ? claimRefused(x, 'refused') : runChallenge(x));
  seatRuleNewYear(changes); // (0.43.0) the League's seat rule
}
// ---- title claims (0.22.0) ----
// A challenger who beat the Champion for the title this year and wants a seat (most would rather keep travelling)
// can claim the Champion's seat at New Year, but the League decides: in the player's League nothing changes without
// the player. They can allow the claim battle (the Champion fields their full team with the seat's edge and a little
// more), turn it down, or offer the claimant a post through the usual hiring (a claimant is glad to take one). A claim
// turned down, or left unanswered for CLAIM_ANSWER weeks, costs the League CLAIM_PRESTIGE prestige and the claimant
// leaves unhappy: with another League in the world they go to its circuit, and that League may sponsor them back as a
// contender. A Champion in their first CLAIM_GRACE calendar years can't be challenged for the seat by anyone. A
// Champion who loses a claim battle leaves the post: retired if their career is long enough, else back on the circuit
// of another League (with one League, this one). Rival Leagues allow a claim by aim (CLAIM_AI_YES) and turn it down
// otherwise. The multi-year sim turns every claim down. All numbers provisional.
const CLAIM_WANT = 0.5, CLAIM_GRACE = 1, CLAIM_ANSWER = 8, CLAIM_EDGE = 1.05, CLAIM_PRESTIGE = 2, CLAIM_ACCEPT = 0.35;
const CLAIM_AI_YES = { wall: 0.35, star: 0.7, money: 0.5 };
const champGrace = () => { const c = T(S.champion); return !c || seatYears(c) < CLAIM_GRACE; };
const claimOn = t => !!t && t.claimOn != null && S.turn <= t.claimOn;
// still a challenger on this circuit, free to fight for the seat
const claimFree = t => !!t && t.role === 'challenger' && S.challengers.includes(t.id) && !t.spon && !t.hired && !t.hireDue && !t.leaving && t.talk == null;
function wantsSeat(t) {
  let p = CLAIM_WANT;
  if (t.age < 20) p -= 0.2; else if (t.age >= 30) p += 0.15;
  if ((t.titleSeasons || []).length >= 2) p += 0.1;
  if (t.grudge != null) p -= 0.15;
  return rand() < clamp(p, 0.05, 0.8);
}
function claimant() {
  if (founderChamp(T(S.champion)) || champGrace()) return null;
  const c = [...new Set(yearLeague().conceded)].map(T).filter(t => claimFree(t) && canChallenge(t) && wantsSeat(t));
  return c.sort((a, b) => ovr(b) - ovr(a))[0] || null;
}
// a claim turned down (why: 'refused', 'unanswered'): prestige lost, and the claimant leaves unhappy
function claimRefused(x, why) {
  const c = T(x.cand), me = S.lg || 0; c.claimOn = null;
  chalRecord(x, { refused: true, unanswered: why === 'unanswered' || undefined });
  S.prest = Math.max(0, (S.prest || 0) - CLAIM_PRESTIGE);
  c.grudge = S.season; c.grudgeLg = me;
  let away = null;
  if (claimFree(c) && c.rest != null && nLeagues() > 1) { // one out on a run stays, unhappy, until it ends
    const to = pick(Array.from({ length: nLeagues() }, (_, i) => i).filter(i => i !== me && !(S.founding && i === ME())));
    if (to != null) {
      shiftLeague(c, to); away = to;
      // the League they joined may send them straight back as its contender
      if (!inLeague(to, () => playerLeague())) inLeague(to, () => { if (S.fin && S.fin.money > SPON_AIM_SPARE && rand() < CLAIM_SPON) sendContender(c.id, me); });
    }
  }
  const back = c.spon && c.spon.to === me;
  const msg = `${why === 'unanswered' ? `${c.name}'s claim to the Champion's seat lapsed unanswered` : `The ${S.lgName} turned down ${c.name}'s claim to the Champion's seat`}. ${c.name} left unhappy${away != null ? ` for the ${leagueName(away)}${back ? ', who signed them as a contender against the ' + S.lgName : ''}` : ''}.`;
  news(msg, 'move', c.id);
  return msg;
}
const CLAIM_SPON = 0.5;
// the claimant took a post the player offered (or anything else ended the claim): no cost
function claimEnded(x) {
  const c = T(x.cand); if (c) c.claimOn = null;
  const took = c && (c.hired || c.hireDue || STAFF_ROLES.includes(c.role));
  chalRecord(x, took ? { offered: true } : { lapsed: true });
  const msg = took ? `${c.name} took the post you offered instead of claiming the Champion's seat.` : `${c ? c.name : 'A'}'s claim to the Champion's seat lapsed: the Champion or the claimant moved on first.`;
  news(msg, 'move', x.cand);
  return msg;
}
// (0.15.0) an Elite Four member of another League who wants promotion and is restless, with two years in the seat and
// not the worst of their four, may challenge this League's Champion (the strongest goes); at most one a League a year
function rivalChampChallenger() {
  if (nLeagues() < 2 || founderChamp(T(S.champion)) || champGrace()) return null;
  const me = S.lg || 0; let best = null;
  for (let j = 0; j < nLeagues(); j++) if (j !== me) inLeague(j, () => {
    for (const t of S.e4.map(T)) if (t && t.role === 'e4' && canChallenge(t) && wantsUp(t) && restless(t) && !(t.e4Poor > 0) && seatYears(t) >= CHAL_SEAT_YEARS && (!best || ovr(t) > ovr(T(best.cand)))) best = { k: 'champ', cand: t.id, inc: null, slot: S.e4.indexOf(t.id), from: 'rival', lg: j, gym: null };
  });
  if (best) best.inc = S.champion;
  return best;
}
// a member of staff whose challenge was refused or lost: their promotion clock moves a year on
function chalRestless(t) {
  if (!t || !wantsUp(t) || !ambClock(t) || t.quit) return;
  t.wish.since -= YEAR_WEEKS;
  if (S.turn >= ambDue(t) && !conHolds(t)) { if (t.role === 'gymtrainer') staffQuits(t); else announceQuit(t, S.turn + QUIT_NOTICE); }
}
function chalRecord(x, extra) {
  const h = S.history.find(e => e.season === x.season), rec = { k: x.k, slot: x.slot, cand: x.cand, inc: x.inc, from: x.from, gym: x.gym, called: x.called || undefined, ...extra };
  if (h) (h.chal = h.chal || []).push(rec);
  else if (x.season === S.season) (yearLeague().chal = yearLeague().chal || []).push(rec); // (0.34.0) a called challenge mid-year: into the year's entry at New Year
  return rec;
}
// fight one challenge; returns what happened, in words
function runChallenge(x) {
  const cand = T(x.cand), inc = T(x.inc);
  if (!chalValid(x)) {
    chalRecord(x, { lapsed: true });
    const msg = `${cand ? cand.name : 'A'}'s seat challenge lapsed: ${x.k === 'champ' ? 'the Champion\'s seat' : `Elite Four seat #${x.slot + 1}`} or the challenger's post changed first.`;
    news(msg, 'move', x.cand); return msg;
  }
  const champ = x.k === 'champ', lvl = champ ? CHAMP_LV : E4_LV[x.slot], keep = cand.team;
  if (x.from === 'leader') {
    cand.team = cand.team.slice();
    if (cand.team.length < E4_SIZE) staffPicks(cand, lvl, E4_SIZE - cand.team.length, { lines: cand.team.map(m => LINE[m.sp]), team: cand.team, mixed: !cand.specialty }).forEach(m => cand.team.push(stamp(m, 'assigned')));
  } else if (x.from === 'circuit' || x.from === 'claim') setTeamLevel(cand, lvl);
  const claim = x.from === 'claim'; if (claim) cand.claimOn = null;
  const seat = champ ? "the Champion's seat" : `Elite Four seat #${x.slot + 1}`;
  const res = setBattle(cand, inc, lvl, 'league', `${claim ? 'Title claim' : 'Seat challenge'} · ${champ ? 'Champion' : `Elite Four #${x.slot + 1}`}`, undefined, claim ? homeEdge('seat') * CLAIM_EDGE : undefined);
  res.at = S.turn; res.cand = cand.id; res.when = { season: S.season, week: S.week };
  (S.seatLogs = S.seatLogs || []).push(res); if (S.seatLogs.length > SEAT_LOGS) S.seatLogs.shift();
  const won = res.winner === 0;
  chalRecord(x, { won, at: S.turn });
  let text;
  if (won) {
    if (claim || (champ && x.from === 'circuit')) {
      S.champion = null; inc.role = 'exchamp'; inc.letGoAt = S.turn; inc.deposedBy = cand.id; // (as when a Champion retires)
      retireOrReturn(inc, `lost the Champion's seat to ${cand.name}`); const fate = inc.role === 'retired' ? 'retired' : 'returned';
      let away = null;
      if (fate === 'returned' && nLeagues() > 1) { away = pick(Array.from({ length: nLeagues() }, (_, i) => i).filter(i => i !== (S.lg || 0) && !(S.founding && i === ME()))); if (away != null) shiftLeague(inc, away); }
      installElite(cand, 'champion');
      text = `${cand.name} won the ${claim ? 'claim battle' : 'seat challenge'} against ${inc.name} and is the new Champion of the ${S.lgName}. ${inc.name} ${fate === 'retired' ? 'retired' : away != null ? `is heading to the ${leagueName(away)}'s circuit` : 'is heading back to the badge circuit'}.`;
    } else if (x.from === 'rival') {
      // (0.15.0) across Leagues the two trade places, with no fees either way
      const home = S.lg || 0, quiet = L => { if (S.fin) S.fin.quiet = L; };
      inLeague(x.lg, () => { S.e4[x.slot] = null; });
      S.champion = null; inc.e4Poor = 0; quiet(true); installElite(cand, 'champion'); quiet(false);
      inLeague(x.lg, () => { quiet(true); installElite(inc, 'e4', x.slot); quiet(false); });
      useLeague(home);
      text = `${cand.name} of the ${leagueName(x.lg)} beat Champion ${inc.name} in a seat challenge and is the new Champion of the ${S.lgName}. ${inc.name} takes ${cand.name}'s Elite Four seat (#${x.slot + 1}) in the ${leagueName(x.lg)}.`;
    } else if (champ && x.from === 'leader') {
      // (0.34.0) a called Gym Leader takes the seat; the beaten Champion takes over their gym
      S.gyms[x.gym].leader = null; S.champion = null;
      installElite(cand, 'champion'); installElite(inc, 'leader', x.gym); staffGym(x.gym);
      text = `${cand.name} beat Champion ${inc.name} in a seat challenge and is the new Champion of the ${S.lgName}. ${inc.name} takes over ${townName(x.gym)} Gym (${typeLabel(inc)}).`;
    } else if (champ) {
      S.e4[x.slot] = null; S.champion = null; inc.e4Poor = 0;
      installElite(cand, 'champion'); installElite(inc, 'e4', x.slot);
      text = `${cand.name} beat Champion ${inc.name} in a seat challenge and is the new Champion of the ${S.lgName}. ${inc.name} takes ${cand.name}'s Elite Four seat (#${x.slot + 1}).`;
    } else if (x.from === 'leader') {
      S.e4[x.slot] = null; S.gyms[x.gym].leader = null; inc.e4Poor = 0;
      installElite(cand, 'e4', x.slot); installElite(inc, 'leader', x.gym); staffGym(x.gym);
      text = `${cand.name} won ${seat} from ${inc.name} in a seat challenge. ${inc.name} takes over ${townName(x.gym)} Gym (${typeLabel(inc)}).`;
    } else {
      S.e4[x.slot] = null; inc.e4Poor = 0; inc.letGoAt = S.turn;
      const fate = retireOrReturn(inc, `lost Elite Four seat #${x.slot + 1} to ${cand.name} in a seat challenge`);
      installElite(cand, 'e4', x.slot);
      text = `${cand.name}, after a run to the Elite Four, won ${seat} from ${inc.name} in a seat challenge. ${inc.name} ${fate === 'retired' ? 'retired' : 'is heading back to the badge circuit'}.`;
    }
  } else {
    if (x.from === 'leader') cand.team = keep;
    else if (x.from === 'circuit' || claim) setTeamLevel(cand, challengerLevel(cand)); // back to the level of their next battle
    chalRestless(cand);
    text = `${champ ? 'Champion ' : ''}${inc.name} defended ${seat} against ${cand.name} in a ${claim ? 'claim battle' : 'seat challenge'}${x.from !== 'circuit' && !claim && wantsUp(cand) ? `; ${cand.name} is restless` : ''}.`;
  }
  news(text, champ ? 'title' : 'move', won ? cand.id : inc.id);
  return text;
}
// the player's answer to a challenge waiting in their League (i: its index in S.chalPending); returns the text
function answerChallenge(i, yes) {
  return inLeague(ME(), () => {
    const x = (S.chalPending || [])[i]; if (!x) return null;
    S.chalPending.splice(i, 1);
    let msg;
    if (yes) msg = runChallenge(x);
    else if (x.from === 'claim') msg = claimRefused(x, 'refused');
    else if (x.called) { // (0.34.0) calling off your own challenge: nobody turns restless, and the call stays used
      chalRecord(x, { refused: true, calledOff: true }); const c = T(x.cand); if (c) c.chalAt = null;
      msg = `You called off ${c ? c.name : 'the'}'s challenge for the Champion's seat.`;
      news(msg, 'move', x.cand);
    } else {
      chalRecord(x, { refused: true }); const c = T(x.cand); chalRestless(c);
      msg = `You refused ${c.name}'s challenge for ${x.k === 'champ' ? "the Champion's seat" : `Elite Four seat #${x.slot + 1}`}${x.from !== 'circuit' && wantsUp(c) ? `; ${c.name} is restless` : ''}.`;
      news(msg, 'move', c.id);
    }
    noteChange(msg);
    return msg;
  });
}
// every week: a challenge the player hasn't answered in CHAL_ANSWER weeks goes ahead
// (0.22.0) a title claim is never fought without the player: unanswered, it lapses; one whose claimant took a post (or
// whose Champion moved on) ends quietly
function challengeWeek() {
  const ended = x => x.from === 'claim' && inLeague(ME(), () => !chalValid(x));
  if (!(S.chalPending || []).some(x => S.turn >= x.due || ended(x))) return;
  inLeague(ME(), () => {
    for (const x of S.chalPending.filter(x => S.turn >= x.due || ended(x))) {
      S.chalPending.splice(S.chalPending.indexOf(x), 1);
      const msg = x.from !== 'claim' ? runChallenge(x) : !chalValid(x) ? claimEnded(x) : claimRefused(x, 'unanswered');
      noteChange(msg); stopFor('challenge', msg);
    }
  });
}
// the multi-year sim: nobody is there to answer, so every waiting challenge goes ahead, except title claims, which
// are turned down (no roster move without the player)
function approveAllChallenges() { while ((S.chalPending || []).length) answerChallenge(0, S.chalPending[0].from !== 'claim'); seatWeek(true); }

// ---- called challenges (0.34.0) ----
// The manager of a League decides when its Champion's seat is fought for: up to CALL_MAX times a calendar year, the
// player can call a challenge against their own Champion and name the challenger: one of their Elite Four members or
// Gym Leaders, or a title winner of this year or last still on the circuit. It is fought CALL_WEEKS later (or sooner,
// if the player says so), one battle at the Champion's level, as any seat challenge; the player can call it off. The
// challenger still waits CHAL_WAIT years before challenging again. A Champion called against is put out by it: each
// call in a year makes it likelier (CALL_UNHAPPY a call) that they come to want to leave (a bigger League's seat, or
// to step down), restless at once. A founder Champion can't be called against inside their window. Rival Leagues'
// managers call their New Year challenge by aim (CALL_AI). All numbers provisional.
const CALL_MAX = 3, CALL_WEEKS = 4, CALL_UNHAPPY = 0.2;
const CALL_AI = { wall: 0.5, star: 0.9, money: 0.6 };
const callsUsed = () => S.calls && S.calls.season === S.season ? S.calls.n : 0;
const callFrom = x => x.from === 'e4' ? `Elite Four #${x.slot + 1}` : x.from === 'leader' ? `${townName(x.gym)} Gym Leader` : 'a title winner';
const titledLately = t => (t.titleSeasons || []).some(y => y >= S.season - 1);
// why no challenge can be called right now in the player's League, or null
function callBlock() {
  return inLeague(ME(), () => {
    const ch = T(S.champion);
    if (!handOn() || !ch) return 'Your League has no Champion.';
    if (S.founding) return 'Your League is still being founded.';
    if (founderChamp(ch)) return `${ch.name} is the League's founding Champion and can't be challenged until year ${ch.founderUntil}.`;
    if (seatRuleKey() !== 'protected') return `Your League's seat rule is ${seatRuleName(seatRuleKey())}: called challenges are only for the Protected rule.`;
    if ((S.chalPending || []).some(x => x.k === 'champ')) return "A challenge for the Champion's seat is already waiting.";
    if (callsUsed() >= CALL_MAX) return `You have called ${CALL_MAX} challenges this year.`;
    return null;
  });
}
// who the player can call: { t, from, slot, gym, block }
function callCands() {
  return inLeague(ME(), () => {
    const out = [], why = t => !canChallenge(t) ? (t.acting ? 'acting' : t.stepDown != null ? 'stepping down' : 'challenged within two years') : null;
    S.e4.forEach((id, k) => { const t = T(id); if (t) out.push({ t, from: 'e4', slot: k, gym: null, block: why(t) }); });
    S.gyms.forEach((g, i) => { const t = T(g.leader); if (t) out.push({ t, from: 'leader', slot: null, gym: i, block: g.acting ? 'acting' : why(t) }); });
    for (const id of S.challengers) { const t = T(id); if (t && claimFree(t) && titledLately(t)) out.push({ t, from: 'circuit', slot: null, gym: null, block: why(t) }); }
    return out;
  });
}
// call a challenge against the player's Champion (id: the challenger); returns an error or null
function callChallenge(id) {
  const b = callBlock(); if (b) return b;
  const c = callCands().find(x => x.t.id === id);
  if (!c) return 'They can\'t be called to challenge the Champion.';
  if (c.block) return `${c.t.name} can't challenge now (${c.block}).`;
  return inLeague(ME(), () => {
    const ch = T(S.champion);
    const x = { k: 'champ', cand: id, inc: ch.id, slot: c.slot, from: c.from, gym: c.gym, called: true, season: S.season, due: S.turn + CALL_WEEKS };
    (S.chalPending = S.chalPending || []).push(x); c.t.chalAt = S.season;
    S.calls = { season: S.season, n: callsUsed() + 1 };
    const msg = `${chalText(x)} It is fought on ${turnDate(x.due)}.`;
    news(msg, 'move', id); noteChange(msg);
    champCalledOn(ch);
    return null;
  });
}
// a Champion called against: the more calls this year, the likelier they come to want to leave, restless at once
function champCalledOn(ch) {
  if (!ch || founderChamp(ch) || ch.quit || ch.stepDown != null) return;
  ch.called = ch.called && ch.called.season === S.season ? { season: S.season, n: ch.called.n + 1 } : { season: S.season, n: 1 };
  if (ch.wish && ch.wish.k !== 'stay' && ch.wish.k !== 'run') return; // already wants out
  if (rand() >= CALL_UNHAPPY * ch.called.n) return;
  ch.wish = { k: nLeagues() > 1 && rand() < 0.5 ? 'up' : 'step', since: S.turn - AMB_RESTLESS_YEARS * YEAR_WEEKS };
  const msg = `Champion ${ch.name} is unhappy at being challenged and ${ch.wish.k === 'up' ? "has started looking at bigger Leagues' seats" : 'is thinking of stepping down'}.`;
  news(msg, 'move', ch.id); noteChange(msg);
}


// The meta: the five species that performed best this season on the circuit. Only challengers' Pokémon count (Gym
// Leaders and the Elite Four are who has to answer it), and a species needs 8+ battles; ranked by knockouts per
// battle, with wins as a tiebreak.
function metaMons() {
  const agg = {};
  for (const t of challengers()) for (const m of t.team) {
    const ss = m.ss; if (!ss || ss.season !== S.season) continue;
    const a = agg[m.sp] = agg[m.sp] || { sp: m.sp, b: 0, ko: 0, w: 0 };
    a.b += ss.b; a.ko += ss.ko; a.w += ss.w;
  }
  return Object.values(agg).filter(a => a.b >= 8).sort((x, y) => y.ko / y.b - x.ko / x.b || y.w / y.b - x.w / x.b).slice(0, 5).map(a => a.sp);
}
const effVs = (atk, sp) => SP[sp].types.reduce((m, d) => m * effOne(atk, d), 1);
// attacking types that hit the most meta Pokémon super effectively (then by total effectiveness)
function counterTypesFor(mons) {
  if (!mons || !mons.length) return [];
  const sc = TYPES.map(a => ({ a, n: mons.filter(sp => effVs(a, sp) >= 2).length, v: mons.reduce((x, sp) => x + effVs(a, sp), 0) })).filter(x => x.n > 0);
  sc.sort((x, y) => y.n - x.n || y.v - x.v);
  return sc.slice(0, 3).map(x => x.a);
}
// what the current meta counters are (older saves stored a single type in S.meta)
function metaCounters() { if (S.metaMons && S.metaMons.length) return counterTypesFor(S.metaMons); return S.meta && TYPES.includes(S.meta) ? TYPES.filter(a => effOne(a, S.meta) === 2) : []; }

// ================= STEERS AND THE META (0.12.0, stage 2d) =================
// A steer is a standing instruction for how a post's team is built. It belongs to the post, not to the trainer
// (a new holder follows it too): each Gym Leader's gym (its gym trainers follow it), each Elite Four seat and the
// Champion's, plus a League line used wherever a post has none. Everyone follows a steer; real Strategy decides how
// closely. A steer only changes what the team builder favours, and a team follows it one Pokémon a month; someone new
// to a post builds to it at once. All numbers are provisional (design doc 4.10).
const STEERS = {
  bal: ['Balanced', 'No steer: the trainer builds as they see fit.'],
  trend: ['Counter the trend', "Answer the circuit's top performers of the last 12 weeks."],
  year: ["Counter the year's meta", 'Answer the top performers of last year and this year so far.'],
  bulk: ['Favour bulk', 'Prefer Pokémon with high HP and defences, at some cost in raw strength.'],
  power: ['Hit hard', 'Prefer fast, hard-hitting Pokémon, at some cost in bulk.'],
  cover: ['Cover weaknesses', 'Avoid stacking weaknesses, and add Pokémon that answer them.'],
  keep: ['Keep their own Pokémon', 'Hold the team together: no monthly swaps, a move keeps up to four of their own, and a famous trainer works their signature Pokémon back in.'],
};
const STEER_KEYS = Object.keys(STEERS);
const META_MONTHS = 3, META_LOG = 24, META_MIN_B = 8, STEER_EDGE = 0.25, KEEP_CORE = 4, TREND_SHIFT = 3;
function steerState() { return S.steer = S.steer || { line: 'bal', posts: {} }; }
// the key of the post a member of staff holds in the bound League ('champion', 'e4:2', 'gym:5')
function postKey(t) { const p = postOf(t); return !p ? null : p.post === 'champion' ? 'champion' : p.post === 'e4' ? 'e4:' + p.slot : 'gym:' + p.slot; }
const steerAt = key => (key && steerState().posts[key]) || steerState().line || 'bal';
const steerOf = t => (t && STAFF_ROLES.includes(t.role) ? steerAt(postKey(t)) : 'bal');
const steerName = s => (STEERS[s] || STEERS.bal)[0];
// key 'line' sets the League line; s null clears a post's own steer (it then follows the line)
function setSteer(key, s) {
  if (s != null && !STEERS[s]) return false;
  const st = steerState();
  if (key === 'line') st.line = s || 'bal'; else if (s == null) delete st.posts[key]; else st.posts[key] = s;
  return true;
}
// how closely a trainer follows a steer: their real Strategy (the builder's offset doesn't apply)
const steerFollow = t => clamp((t.r.str - 30) / 50, 0.2, 1);
const isCounter = s => s === 'trend' || s === 'year';
const steerMeta = s => (s === 'trend' ? S.metaTrend || [] : s === 'year' ? S.metaYear || [] : []);
// what a steer adds to a pick's score in the team builder (weak: the team's stacked weaknesses so far)
function steerScore(s, sp, weak, meta) {
  const b = bsOf(sp), tot = SP[sp].bst || 1, ty = SP[sp].types;
  if (s === 'bulk') return ((b.hp + b.def + b.spd) / tot - 0.5) * 8;
  if (s === 'power') return ((b.spe + Math.max(b.atk, b.spa)) / tot - 0.33) * 8;
  if (s === 'cover') { let v = 0; for (const a of TYPES) { const n = weak[a] || 0; if (!n) continue; const e = ty.reduce((m, d) => m * effOne(a, d), 1); if (e >= 2) v -= 0.4 * n; else if (e < 1) v += 0.3 * n; } return v; }
  if (isCounter(s) && meta.length) {
    let v = 0;
    for (const f of meta) { if (!SP[f]) continue; if (ty.some(x => effVs(x, f) >= 2)) v += 1; if (SP[f].types.some(x => ty.reduce((m, d) => m * effOne(x, d), 1) >= 2)) v -= 0.6; }
    return v / meta.length * 3;
  }
  return 0;
}
// a countering typed trainer may field one Pokémon off their type that answers the meta: the strongest answers
// under their Scouting ceiling
function offTypePool(t, L, meta) {
  const ty = specTypes(t), cap = 340 + L * 6.2 + (bld(t, 'sct') - 50) * SCOUT_BST, set = new Set();
  for (const b of regional(BASES)) { const f = formAt(b, L, t.specialty), s = SP[f]; if (s && s.bst <= cap && !s.types.some(x => ty.includes(x)) && !bannedIn(f, S.lg || 0)) set.add(f); }
  return [...set].map(sp => [sp, steerScore('trend', sp, {}, meta) + SP[sp].bst / 300]).filter(x => x[1] > 2).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
}
// the lines of a famous trainer's signature team
const signatureLines = t => (t.famousTeam ? new Set(signaturePicks(t.famousTeam).filter(sp => SP[sp]).map(sp => LINE[sp])) : null);

// ---------- the meta: a trend and the year ----------
// Every battle a challenger's Pokémon fight is counted for the League it is on (metaNote, called from battle()). At the
// start of each month the month just ended goes into S.metaLog, and two readings are made: the trend (the five top
// performers of the last three months) and the year (last full year plus this year so far). Ranked as the meta report
// is: knockouts per battle, then wins, with 8+ battles.
function metaNote(sp, r, won) { const now = S.metaNow = S.metaNow || {}, a = now[sp] = now[sp] || [0, 0, 0]; a[0]++; a[1] += r.ko || 0; if (won) a[2]++; }
function metaTop(months) {
  const agg = {};
  for (const mo of months) for (const [sp, a] of Object.entries(mo.agg || {})) { const x = agg[sp] = agg[sp] || [0, 0, 0]; x[0] += a[0]; x[1] += a[1]; x[2] += a[2]; }
  return Object.entries(agg).filter(([sp, a]) => SP[sp] && a[0] >= META_MIN_B).sort((x, y) => y[1][1] / y[1][0] - x[1][1] / x[1][0] || y[1][2] / y[1][0] - x[1][2] / x[1][0]).slice(0, 5).map(x => x[0]);
}
function metaMonth() {
  const log = S.metaLog = S.metaLog || [];
  log.push({ s: S.week === 0 ? S.season - 1 : S.season, w: (S.week + YEAR_WEEKS - 4) % YEAR_WEEKS, agg: S.metaNow || {} });
  S.metaNow = {};
  if (log.length > META_LOG) log.splice(0, log.length - META_LOG);
  const old = S.metaTrend || [];
  S.metaTrend = metaTop(log.slice(-META_MONTHS));
  S.metaYear = metaTop(log.filter(x => x.s >= S.season - 1));
  S.metaAt = S.turn;
  const fresh = S.metaTrend.filter(sp => !old.includes(sp));
  // a shift: three or more of the five are new and the types that answer it have changed
  if (old.length && fresh.length >= TREND_SHIFT && counterTypesFor(old)[0] !== counterTypesFor(S.metaTrend)[0]) {
    news(`The trend on the circuit has shifted: ${S.metaTrend.join(', ')} are the top performers of the last 12 weeks (new: ${fresh.join(', ')}).`, 'meta');
    if (playerLeague()) stopFor('meta', `The trend has shifted: ${fresh.join(', ')} are new among the top performers.`);
  }
}
// the types that answer a reading, and whether a member of staff can answer it on their own type
const metaTypes = s => counterTypesFor(steerMeta(s));
function answersOnType(t, s) { if (!t) return false; const c = metaTypes(s), ty = specTypes(t); return !!c.length && (!ty.length || ty.some(x => c.includes(x))); }
// rival Leagues steer by a simple rule each month: a gym that can answer the trend on its type counters it, an Elite
// Four member or Champion who can answer the year's meta counters that; everyone else is Balanced
function rivalSteers() {
  const st = steerState(); st.line = 'bal'; st.posts = {};
  S.gyms.forEach((g, i) => { if (answersOnType(T(g.leader), 'trend')) st.posts['gym:' + i] = 'trend'; });
  S.e4.forEach((id, k) => { if (answersOnType(T(id), 'year')) st.posts['e4:' + k] = 'year'; });
  if (answersOnType(T(S.champion), 'year')) st.posts.champion = 'year';
}

// ---------- following a steer, one Pokémon a month ----------
const weakOf = team => { const w = {}; for (const m of team) for (const a of TYPES) if (SP[m.sp].types.reduce((x, d) => x * effOne(a, d), 1) >= 2) w[a] = (w[a] || 0) + 1; return w; };
function swapMon(t, out, inn, why) {
  farewell(t, out, why);
  t.team = t.team.filter(m => m !== out);
  t.team.push(inn); relevelElite(t);
  if (playerLeague()) news(`${dn(t)} swapped ${out.sp} for ${inn.sp} (${why.replace(/^swapped out /, '')}).`, 'move', t.id);
}
function steerSwap(t, slot, s) {
  if (ranchFor(t)) return ranchSwap(t, slot, s); // (0.25.0) senior staff swap with the ranch
  const mixed = t.role === 'champion' || !t.specialty, own = mixed ? [] : specTypes(t);
  // an off-type Pokémon stays only under a counter steer
  const off = t.team.find(m => m.offType);
  if (off && !isCounter(s)) {
    const rest = t.team.filter(m => m !== off), inn = staffPicks(t, slot.lvl, 1, { lines: rest.map(m => LINE[m.sp]), team: rest, mixed, steer: 'bal' })[0];
    if (inn) swapMon(t, off, stamp(inn, 'assigned'), 'swapped out as the steer changed');
    return;
  }
  if (s === 'bal') return;
  if (s === 'keep') {
    // a famous trainer works one signature Pokémon back in, in place of the weakest Pokémon that isn't one
    const sig = signatureLines(t); if (!sig) return;
    const missing = signaturePicks(t.famousTeam).find(sp => SP[sp] && !t.team.some(m => LINE[m.sp] === LINE[sp]) && !bannedIn(sp, S.lg || 0));
    const drop = t.team.filter(m => !sig.has(LINE[m.sp]) && !isSpecial(m)).sort((a, b) => SP[a.sp].bst - SP[b.sp].bst)[0];
    if (missing && drop) swapMon(t, drop, stamp(makeMon(missing, slot.lvl, t.specialty), 'starter'), 'swapped out for a signature Pokémon');
    return;
  }
  const threats = TYPES.filter(a => own.some(d => effOne(a, d) >= 2)), fol = steerFollow(t), meta = steerMeta(s);
  const val = (sp, rest) => { const w = weakOf(rest); return fitScore(sp, w, threats) + fol * steerScore(s, sp, w, meta); };
  const worst = t.team.filter(m => !isSpecial(m) && !(t.mega && t.mega.uid === m.uid)).map(m => { const rest = t.team.filter(x => x !== m); return { m, rest, v: val(m.sp, rest) }; }).sort((a, b) => a.v - b.v)[0];
  if (!worst) return;
  const inn = staffPicks(t, slot.lvl, 1, { lines: worst.rest.map(m => LINE[m.sp]), team: worst.rest, mixed, steer: s })[0];
  if (!inn || LINE[inn.sp] === LINE[worst.m.sp] || val(inn.sp, worst.rest) < worst.v + STEER_EDGE) return;
  swapMon(t, worst.m, stamp(inn, 'assigned'), `swapped out to follow the steer (${steerName(s)})`);
}
// the start of each month in each League: the meta readings, rival Leagues' steers, then every steered team moves
// one Pokémon closer to its steer
function steerMonth() {
  metaMonth();
  if (!playerLeague()) aimMonth(); // (0.15.0) steers and spending by the League's aim
  else if (simAutoAim()) autoMonth(simAutoAim()); // (0.50.0) the multi-year sim managing your League
  for (const id of staffIds()) { const t = T(id), slot = t && eliteSlot(t); if (slot && t.team && t.team.length) steerSwap(t, slot, steerOf(t)); }
}
// a Gym Leader back on the circuit for a title run isn't offered a gym again during their guaranteed seasons
// The source's performance moves are switched off until the player decides them (design doc, open items): a leader
// replaced after three poor seasons, a leader returning to the circuit after a run of strong ones, and a challenger
// taking an Elite Four seat after a deep League run. Only the dead poor-leader branch in the New Year gym loop is
// left behind it (rival Leagues use replacePoorStaff; the comeback is an ambition; seat challenges are 0.11.0's).
const AUTO_STAFF_MOVES = false;
// the wall report sims Leagues whose staff all come from one quality tier, so no challenger walks into a post
const fixedStaff = () => !!(S.cfg && S.cfg.staffBoost != null);
// ================= THE WORLD'S SLOW CHANGES =================
// Spread through the year (0.4.0). Every trainer has a birthday week: they grow a year older and their ratings
// move then, and that is when retirement is decided. A challenger out on a run retires when it ends; staff leave
// at once, and the post is filled at once. Only the wall report, the awards, the meta report and the bans wait
// for New Year.
const bweek = t => (t.bw != null ? t.bw : (t.bw = (t.id * 13) % YEAR_WEEKS));
function birthdays() {
  const prog = S.yearProgress = S.yearProgress || {};
  for (const t of Object.values(S.trainers)) {
    if (t.role === 'retired' || t.role === 'prospect' || bweek(t) !== S.week) continue;
    trimH2h(t);
    const before = { ...t.r, ovr: ovr(t) };
    t.age++;
    grow(t); // (0.24.0) one growth model for everyone
    if (t.role === 'challenger') {
      const sh = t.seasonHist[t.seasonHist.length - 1];
      if (sh && sh.badges === 8) t.r.nrv = clamp(t.r.nrv + ri(1, 3), 1, 99);
      if (sh && sh.stage != null && sh.stage >= 4) { t.r.nrv = clamp(t.r.nrv + 2, 1, 99); t.r.str = clamp(t.r.str + 1, 1, 99); }
    }
    t.pot = growPot(t);
    prog[t.id] = { before, after: { ...t.r, ovr: ovr(t) } };
    // --- retiring: with age (50+ and past their career length), after a long dry spell, or for poor ratings
    if (t.role === 'challenger') {
      inLeague(homeLeague(t), () => {
        careerSpan(t);
        let why = rand() < ageRetireChance(t) ? `after ${t.seasons} years` : crossroads(t);
        if (!why && t.seasons >= 5 && ovr(t) < 38 && rand() < 0.25) why = 'from competition';
        if (!why) return;
        if (t.rest != null) retire(t, why); else t.leaving = why; // out on a run: they see it through first
      });
    } else if (t.role === 'free') {
      if (rand() < ageRetireChance(t)) retire(t, `after ${t.seasons} years`);
      else if (S.season - (t.freeSince || S.season) >= 3 && rand() < 0.5) retire(t, 'after three years off the circuit');
    } else if (STAFF_ROLES.includes(t.role)) {
      // 0.6.0: staff step down only after a long career, announced a year ahead; they leave on the next birthday
      inLeague(homeLeague(t), () => { if (t.stepDown != null) staffRetires(t); else if (!t.acting && rand() < stepDownChance(t)) announceStepDown(t); else if (!t.acting) driftAmbition(t); });
    }
  }
}
// ================= GROWTH (0.24.0, design doc 6.3) =================
// One model for every trainer, staff and challengers alike, replacing the source's potential ceiling. A trainer grows
// until their peak (GROW_PEAK, their late 20s), holds, and declines slowly from GROW_DECLINE (their mid 30s), faster
// with age. Growth counts from the start of a career, not age: a late starter grows for GROW_LATE years from the
// start, and declines GROW_LATE_DECLINE years after it, no later than GROW_DECLINE_MAX. Each birthday every rating moves
// by the stage's step × the trainer's talent (a stable draw, GROW_TALENT) × their coach's Training (a gym trainer's
// leader, a Gym Leader's or Elite Four member's Champion, else their own) × the training hall at their post (+GROW_HALL a
// level; it also slows the decline), less as a rating nears the top. A Late Bloomer peaks and declines
// GROW_BLOOM years later. All numbers provisional.
const GROW_PEAK = 28, GROW_DECLINE = 35, GROW_LATE = 4, GROW_LATE_DECLINE = 6, GROW_DECLINE_MAX = 40, GROW_BLOOM = 3;
const GROW_STEP = [[17, 3.0], [22, 2.0], [99, 1.2]]; // [up to age, points a year] while growing
const GROW_DROP = [[44, 0.7], [52, 1.2], [99, 1.8]]; // [up to age, points a year] while declining
const GROW_TALENT = [0.6, 1.4], GROW_HALL = 0.12, GROW_HALL_SLOW = 0.1;
// the age a career started (set when a trainer is made; older trainers get it from their years)
const startAge = t => (t.start != null ? t.start : (t.start = t.age - (t.seasons || 0)));
// a late starter is one whose career began after their natural peak was near
function growAges(t) {
  const s = startAge(t), b = hasTrait(t, 'lateBloomer') ? GROW_BLOOM : 0;
  const decline = Math.max(GROW_DECLINE, Math.min(s + GROW_LATE_DECLINE, GROW_DECLINE_MAX)) + b;
  const peak = Math.min(decline, Math.max(GROW_PEAK, s + GROW_LATE)) + b;
  return { peak, decline };
}
const talent = t => GROW_TALENT[0] + (((t.id * 40503) >>> 0) % 101) / 100 * (GROW_TALENT[1] - GROW_TALENT[0]);
const stepAt = (tbl, age) => tbl.find(([a]) => age <= a)[1];
// whose Training speeds t's growth
function coachOf(t) {
  if (!STAFF_ROLES.includes(t.role)) return t;
  return inLeague(homeLeague(t), () => {
    if (t.role === 'gymtrainer') { const g = S.gyms.find(x => (x.trainers || []).includes(t.id)); return (g && T(g.leader)) || t; }
    if (t.role === 'champion') return t;
    return T(S.champion) || t;
  });
}
const coachMul = t => 0.7 + 0.6 * clamp((coachOf(t).r.trn - 20) / 60, 0, 1); // Training 50 = ×1
// the training hall at a member of staff's post (0 while the League is in the red)
const hallAt = t => STAFF_ROLES.includes(t.role) ? inLeague(homeLeague(t), () => lapsed() ? 0 : hallLv(t)) : 0;
// the birthday's change to every rating (t.age is already the new age)
function grow(t) {
  const { peak, decline } = growAges(t), hall = hallAt(t);
  if (t.age <= peak) {
    const step = stepAt(GROW_STEP, t.age) * talent(t) * coachMul(t) * (1 + GROW_HALL * hall);
    for (const k of RK) { const room = clamp((96 - t.r[k]) / 40, 0.15, 1); t.r[k] = clamp(Math.round(t.r[k] + step * room + (rand() - 0.5) * 2), 1, 99); }
  } else if (t.age <= decline) {
    for (const k of RK) t.r[k] = clamp(t.r[k] + ri(-1, 1), 1, 99);
  } else {
    const drop = stepAt(GROW_DROP, t.age) * Math.max(0.3, 1 - GROW_HALL_SLOW * hall);
    for (const k of RK) t.r[k] = clamp(Math.round(t.r[k] - drop + (rand() - 0.5) * 2), 1, 99);
  }
}
// a trainer's potential: their OVR now plus the growth still ahead at their own pace (coach and hall left out)
function growPot(t) {
  const { peak } = growAges(t);
  let o = ovr(t);
  for (let a = t.age + 1; a <= peak; a++) o += stepAt(GROW_STEP, a) * talent(t) * clamp((96 - o) / 40, 0.15, 1);
  return clamp(Math.round(o), ovr(t), 99);
}
// ---------- stepping down (0.6.0) ----------
// A member of staff only thinks of stepping down once they are past their career length and have held posts for
// STEP_DOWN_YEARS years. They announce it a year ahead (a news item, a tag on their card and a stop) and leave on
// their next birthday. Nobody else leaves a post on their own; replacing staff becomes the player's in stage 2.
const STEP_DOWN_YEARS = 10;
function postYears(t) { return (t.posts || []).reduce((a, p) => a + Math.max(0, (p.to == null ? curSeason() : p.to) - p.from), 0); }
function stepDownChance(t) {
  if (founderChamp(t)) return 0; // (0.15.0) a founder Champion's window
  const over = (t.seasons || 0) - careerSpan(t);
  if (over < 0 || postYears(t) < STEP_DOWN_YEARS) return 0;
  // (0.10.0) the odds rise with each year past their career length, and a little with age past 50
  return clamp(0.2 + over * 0.1 + Math.max(0, t.age - 50) * 0.03, 0.2, 0.8);
}
// a post in words, for news and the picker
function postName(t) {
  if (t.role === 'champion') return `${postWord('champion')} of the ${S.lgName}`;
  if (t.role === 'e4') return `${postWord('e4')} seat #${S.e4.indexOf(t.id) + 1}`;
  // (0.28.0) Alola's gyms are its island challenge: a Kahuna's grand trial with Trial Captains before it. (0.30.0) Any
  // region can rename the posts (its `posts`)
  // (0.42.0) the League's own post names or theme first (postWord)
  if (t.role === 'leader') return `${townName(S.gyms.findIndex(g => g.leader === t.id))} ${postWord('leader')}`;
  if (t.role === 'gymtrainer') return `${townName(S.gyms.findIndex(g => (g.trainers || []).includes(t.id)))} ${postWord('gymtrainer')}`;
  return '';
}
function announceStepDown(t) {
  t.stepDown = S.turn + YEAR_WEEKS; t.quit = null;
  const msg = `${dn(t)} (${postName(t)}) will step down in ${weekName(S.week)} of Year ${S.season + 1}, after ${t.seasons} years.`;
  news(msg, 'move', t.id); noteChange(msg);
  if (t.role !== 'gymtrainer') stopFor('stepdown', msg);
}
// a member of staff leaves. In the player's League a Gym Leader's or Elite Four seat waits for the player, held by
// an acting holder (see vacancies below); elsewhere the post is filled at once, the same automatic way as before.
function staffRetires(t) {
  const changes = [], mine = playerLeague();
  t.stepDown = null;
  if (t.role === 'leader') {
    const i = S.gyms.findIndex(g => g.leader === t.id); if (i < 0) return;
    retire(t, 'after a long career');
    if (mine) { const a = actingLeader(i); changes.push(`${t.name} stepped down from ${townName(i)} Gym. ${dn(a)} is acting leader until you choose a new one.`); openVacancy('leader', i); }
    else { fillGym(i, changes); staffGym(i); }
  } else if (t.role === 'gymtrainer') {
    const i = S.gyms.findIndex(g => (g.trainers || []).includes(t.id)); if (i < 0) return;
    const g = S.gyms[i]; g.trainers[g.trainers.indexOf(t.id)] = null;
    retire(t, `from ${townName(i)} Gym`); staffGym(i);
    changes.push(`${t.name} retired from ${townName(i)} Gym${g.acting ? '' : ', and a new gym trainer was taken on'}.`);
  } else if (t.role === 'e4') {
    const i = S.e4.indexOf(t.id); if (i < 0) return;
    retire(t, 'from the Elite Four');
    if (mine) { const a = actingE4(i); changes.push(`${t.name} stepped down from the Elite Four. ${a.name} stands in at seat #${i + 1} until you choose a new member.`); openVacancy('e4', i); }
    else { const nt = rivalE4(i); changes.push(`${t.name} stepped down; ${nt.name} (${typeLabel(nt)}) joins the Elite Four.`); }
    news(changes[changes.length - 1], 'move', T(S.e4[i]).id);
  } else if (t.role === 'champion') {
    // the Champion's seat is never empty: the strongest Elite Four member moves up at once, and their seat is filled
    // (in the player's League, an acting member holds it until the player chooses)
    const seat = champHeirSeat(); // (0.43.0) by the seat rule
    const at = seat != null ? seat : 0, m = T(S.e4[at]);
    t.role = 'exchamp'; retire(t, `as Champion of the ${S.lgName}`);
    S.e4[at] = null; m.acting = false; installElite(m, 'champion');
    if (mine) { const a = actingE4(at); openVacancy('e4', at); changes.push(`Champion ${t.name} stepped down. ${dn(m)} moves up from the Elite Four to become Champion; ${a.name} stands in at seat #${at + 1} until you choose a new member.`); }
    else { const nt = rivalE4(at); changes.push(`Champion ${t.name} retired. ${dn(m)} moves up from the Elite Four to become Champion, and ${nt.name} (${typeLabel(nt)}) fills Elite Four seat #${at + 1}.`); }
    news(changes[changes.length - 1], 'title', m.id);
  }
  for (const c of changes) noteChange(c);
  if (changes.length && t.role !== 'gymtrainer') stopFor('vacancy', changes[0]);
}
// ---------- vacancies in the player's League (0.6.0) ----------
// A vacant Gym Leader's or Elite Four seat waits for the player. Meanwhile it has an acting holder: the gym's
// stronger gym trainer stands in as leader (the gym runs one gym trainer short and fights under the acting leader's
// type), and an Elite Four seat is held by a stand-in at founding strength. S.vacancies lists the open posts.
function actingLeader(i) {
  const g = S.gyms[i], ts = (g.trainers || []).map(T).filter(Boolean).sort((a, b) => ovr(b) - ovr(a));
  let a = ts[0];
  if (a) { g.trainers[g.trainers.indexOf(a.id)] = null; closePost(a); a.role = 'leader'; g.leader = a.id; openPost(a, 'leader'); relevelElite(a); }
  else { a = newTrainer({ age: ri(26, 44), quality: staffQ(48 + i * 2), role: 'leader', noFamous: true }); installElite(a, 'leader', i); }
  a.acting = true; g.acting = true;
  staffGym(i); // a gym that had only one gym trainer left (an acting leader stepping down) takes one on (0.7.0)
  return a;
}
function actingE4(i) {
  const a = newTrainer({ age: ri(30, 50), quality: staffQ(64 + i), role: 'e4', noFamous: true });
  a.acting = true; installElite(a, 'e4', i);
  return a;
}
const VACANCY_OUTSIDERS = 2;
function openVacancy(post, slot) {
  // a post that opens again (its acting holder left) gets fresh outsiders; the old ones join the circuit (0.7.0)
  const was = vacancyAt(post, slot), incoming = was ? was.incoming : null;
  for (const v of (S.vacancies || []).filter(v => v.post === post && v.slot === slot)) { const rest = (v.outsiders || []).filter(x => T(x) && T(x).role === 'prospect'); rest.forEach(x => { T(x).outsider = false; }); fillCircuits(rest); }
  S.vacancies = (S.vacancies || []).filter(v => !(v.post === post && v.slot === slot));
  // (0.23.0) no stronger than the League's prestige can attract (scouting still finds a little better)
  const q = capQ(post === 'leader' ? 52 + slot * 2 : 66) + (playerLeague() ? 2 * scoutLv() : 0);
  const outsiders = [];
  for (let k = 0; k < VACANCY_OUTSIDERS + (playerLeague() ? scoutLv() : 0); k++) {
    const fam = famousOk(q) && rand() < FAMOUS_POST_CHANCE && !(S.cfg && S.cfg.allFamous) ? famousAvailable(f => f.age >= 18) : [];
    const t = fam.length ? makeFamous(pick(fam), 'prospect', staffQ(q), 30) : newTrainer({ age: ri(24, 46), quality: staffQ(q), role: 'prospect', specialty: rand() < 0.06 ? null : pick(TYPES) });
    if (!fam.length) fieldTeam(t, 5);
    t.outsider = true; outsiders.push(t.id);
  }
  S.vacancies.push({ post, slot, since: S.turn, outsiders, incoming: incoming != null ? incoming : null });
}
// who can fill a vacancy: every challenger on the circuit, the League's own gym trainers (and the acting leader),
// the vacancy's outsiders, and (0.7.0) the League's other Gym Leaders and Elite Four members: picking one of them
// moves them, and the post they leave opens as a vacancy of its own. Acting holders of other posts and the Champion
// can't be picked. Best first. `opts.noStaff` leaves the senior staff out ("Fill it for me" and the sims).
function vacancyCands(v, opts = {}) {
  const out = [];
  // (0.41.0) the region's field: this League's circuit and the region's other challengers resting between runs
  for (const t of fieldPool()) if (t && t.role === 'challenger' && t.age >= 16 && (!t.hired || t.id === v.incoming) && !underContract(t)) out.push({ t, from: 'circuit' });
  for (const t of hireRetirees()) out.push({ t, from: 'retired' });
  S.gyms.forEach((g, i) => {
    for (const id of g.trainers || []) if (T(id)) out.push({ t: T(id), from: 'gym', gym: i });
    if (v.post === 'leader' && i === v.slot && g.acting) out.push({ t: T(g.leader), from: 'acting', gym: i });
    else if (!opts.noStaff && T(g.leader) && !T(g.leader).acting) out.push({ t: T(g.leader), from: 'leader', gym: i });
  });
  if (!opts.noStaff) S.e4.forEach((id, k) => { const t = T(id); if (t && !t.acting && !(v.post === 'e4' && k === v.slot)) out.push({ t, from: 'e4', seat: k }); });
  for (const id of v.outsiders || []) if (T(id) && T(id).role === 'prospect') out.push({ t: T(id), from: 'outsider' });
  // (0.15.0) other Leagues' staff who want promotion and would be moving up
  if (!opts.noStaff) for (const t of otherStaffFor(v.post, 0)) out.push({ t, from: 'rival', lg: homeLeague(t) });
  // (0.15.0) challengers resting on other Leagues' circuits (an offer; they come at once if they take it)
  if (!opts.noStaff) for (const t of otherCircuits(() => true)) out.push({ t, from: 'away', lg: lgOf(t) });
  // (0.10.0) a member of staff may refuse the move (a step down, or a sideways move when they want to stay put)
  for (const c of out) if (c.from === 'leader' || c.from === 'e4') c.refuse = refusal(c.t, v.post, v.slot);
  // (0.23.0) anyone joining from outside the League's staff must find its prestige enough
  for (const c of out) if (['circuit', 'retired', 'rival', 'away'].includes(c.from)) c.refuse = prestBlock(c.t) || c.refuse;
  // (0.53.0) a trainer in talks is offered for there (the Talks page); a star or another League's staff opens talks
  for (const c of out) if (['circuit', 'rival', 'away'].includes(c.from)) { if (c.t.talk != null) c.refuse = c.refuse || 'in talks (see Talks)'; else if (c.from === 'rival' || isStar(c.t)) { c.talks = true; if (!canTalk(c.t) && !c.refuse) c.refuse = 'not open to talks now'; } }
  return out.sort((a, b) => ovr(b.t) - ovr(a.t));
}
// fill vacancy v with trainer id (in the player's League). Unpicked outsiders go on to the circuit.
function fillVacancy(v, id, opts = {}) {
  return inLeague(ME(), () => {
    const t = T(id); if (!t || !(S.vacancies || []).includes(v)) return false;
    const cand = vacancyCands(v).find(c => c.t === t);
    if ((!cand || cand.refuse) && !(opts.hired && t.role === 'challenger') && !opts.talk) return false;
    // anyone else who had accepted this post isn't coming now (0.9.0)
    if (v.incoming != null && v.incoming !== id) cancelIncoming(v, `${t.name} took the post`);
    v.incoming = null; t.hired = null; t.hireDue = false;
    const was = cand && cand.from === 'rival' ? `the ${leagueName(cand.lg)}` : postName(t) || (t.outsider ? 'an outsider' : t.role === 'retired' ? 'retirement' : `the ${S.lgName} circuit`);
    if (cand && cand.from === 'rival') leaveForPost(t, S.lgName);
    if (t.role === 'retired') unretire(t);
    // the trainer leaves wherever they were; a Gym Leader or Elite Four member leaves a vacancy behind (0.7.0)
    if (t.role === 'challenger') dropFromCircuits(t.id);
    const chain = (t.role === 'leader' || t.role === 'e4') && !t.acting ? vacate(t) : null;
    let gymLeft = null;
    if (t.role === 'gymtrainer') { gymLeft = S.gyms.findIndex(g => (g.trainers || []).includes(t.id)); const g = S.gyms[gymLeft]; g.trainers[g.trainers.indexOf(t.id)] = null; closePost(t); }
    t.outsider = false;
    let text;
    if (v.post === 'leader') {
      const g = S.gyms[v.slot], a = T(g.leader);
      if (a === t) { t.acting = false; g.acting = false; installElite(t, 'leader', v.slot); }
      else {
        // the acting leader goes back to the gym trainer's place they left
        if (a && a.acting) { closePost(a); a.acting = false; a.role = 'gymtrainer'; const k = g.trainers.indexOf(null); g.trainers[k >= 0 ? k : g.trainers.length] = a.id; openPost(a, 'gymtrainer'); relevelElite(a); ranchSync(); }
        g.acting = false; g.leader = null;
        installElite(t, 'leader', v.slot);
      }
      text = `${dn(t)} (${typeLabel(t)}), from ${was}, is the new leader of ${townName(v.slot)} Gym.`;
      staffGym(v.slot);
    } else {
      const a = T(S.e4[v.slot]);
      if (a && a.acting) { S.e4[v.slot] = null; a.acting = false; retire(a, 'after standing in on the Elite Four'); }
      installElite(t, 'e4', v.slot);
      text = `${dn(t)} (${typeLabel(t)}), from ${was}, joins the Elite Four in seat #${v.slot + 1}.`;
    }
    if (gymLeft != null && gymLeft >= 0) staffGym(gymLeft);
    S.vacancies = S.vacancies.filter(x => x !== v);
    const rest = (v.outsiders || []).filter(x => x !== id && T(x) && T(x).role === 'prospect');
    rest.forEach(x => { T(x).outsider = false; });
    fillCircuits(rest);
    news(text, 'move', t.id); noteChange(text);
    // the vacancy a move opened, if any, so the page can go straight to it
    return chain && chain.vacancy ? chain.vacancy : true;
  });
}
// "Fill it for me": the best candidate who doesn't hold a senior post (so nothing else opens)
// (0.9.0) A challenger may turn the offer down (the next best is asked) or accept mid-run (then the post waits for
// them); a vacancy someone is already coming to is left alone. Returns 'later' when someone is coming, else what
// fillVacancy returned.
function autoFillVacancy(v) {
  if (v.incoming != null) return 'later';
  return inLeague(ME(), () => {
    for (const c of vacancyCands(v, { noStaff: true })) {
      if (c.refuse || c.talks) continue; // (0.23.0) below their prestige minimum; (0.53.0) stars and other Leagues' staff need talks
      if (c.from !== 'circuit') return fillVacancy(v, c.t.id);
      if (!canOffer(c.t)) continue;
      const o = offerPost({ post: v.post, slot: v.slot }, c.t);
      if (o.res === 'now') return o.r;
      if (o.res === 'later') return 'later';
    }
    return false;
  });
}
// the multi-year sim (nobody there to choose): a member of staff who wants promotion and is within PROMOTE_EDGE OVR of
// the best newcomer moves up (0.10.0), and the post they leave is filled the same way; everything else as Fill it for me
function fillAllVacancies() {
  for (let n = 0; n < 30; n++) {
    const open = (S.vacancies || []).filter(v => v.incoming == null);
    if (!open.length) return;
    let did = false;
    for (const v of open) { if (!(S.vacancies || []).includes(v)) continue; if (promoteForVacancy(v) || autoFillVacancy(v)) did = true; }
    if (!did) return;
  }
}
// ---------- staffing at will (0.7.0) ----------
// In the player's League any Gym Leader, Elite Four member or gym trainer can be let go, moved or swapped at any
// time, with no cost or limit before money exists. A senior post that someone leaves opens as a vacancy with an
// acting holder, exactly as when staff step down. The Champion can't be replaced by hand: the seat changes only
// when the Champion steps down (seat challenges are for stage 2).
// the post a member of staff holds in the bound League
function postOf(t) {
  if (!t) return null;
  if (t.role === 'champion' && S.champion === t.id) return { post: 'champion', slot: 0 };
  if (t.role === 'leader') { const i = S.gyms.findIndex(g => g.leader === t.id); return i < 0 ? null : { post: 'leader', slot: i }; }
  if (t.role === 'e4') { const i = S.e4.indexOf(t.id); return i < 0 ? null : { post: 'e4', slot: i }; }
  if (t.role === 'gymtrainer') { const i = S.gyms.findIndex(g => (g.trainers || []).includes(t.id)); return i < 0 ? null : { post: 'gymtrainer', slot: i, k: S.gyms[i].trainers.indexOf(t.id) }; }
  return null;
}
// a member of staff leaves their post (they are moving or being let go). A Gym Leader's or Elite Four seat opens
// with an acting holder; a gym trainer's place is simply left empty for the caller to fill. Returns the post left,
// with the vacancy it opened.
function vacate(t) {
  const p = postOf(t); if (!p || p.post === 'champion') return null;
  closePost(t);
  if (p.post === 'leader') { S.gyms[p.slot].leader = null; actingLeader(p.slot); openVacancy('leader', p.slot); }
  else if (p.post === 'e4') { S.e4[p.slot] = null; actingE4(p.slot); openVacancy('e4', p.slot); }
  else { const g = S.gyms[p.slot]; g.trainers[p.k] = null; }
  if (p.post !== 'gymtrainer') p.vacancy = S.vacancies[S.vacancies.length - 1];
  return p;
}
// someone let go: back to the circuit, or retired if they are over 45 with 10+ years behind them (the rule for a
// lost post). Staff who had announced they were stepping down retire, but now and then (GRUDGE_CHANCE) take being
// let go early as a slight and come back to the circuit to challenge the League instead.
const GRUDGE_CHANCE = 0.15;
function letGo(t, was) {
  t.letGoAt = S.turn; // the automatic gym trainer pick leaves them alone for a year
  const free = leavingSet(t); // (0.49.0) leaving anyway: no severance
  t.quit = null;
  // (0.10.0) someone who asked for another run goes on it
  if (t.wish && t.wish.k === 'run' && t.wish.asked != null && t.stepDown == null) return comeback(t, was);
  t.wish = null;
  severance(t, was, free);
  // (0.53.0) let go while a promise of no step down or release stands: a certain grudge
  if (breakPromise(t)) { t.stepDown = null; returnToCircuit(t, `was let go as ${was} against the League's promise`); t.grudge = S.season; t.grudgeLg = S.lg || 0; return grudgeAway(t); }
  // (0.37.0) someone who stored their own legendary with this League takes being let go hard: a certain grudge, and
  // likelier than usual to take it to another League
  if (t.storedLg != null && t.storedLg === (S.lg || 0)) {
    t.storedLg = null; t.stepDown = null;
    returnToCircuit(t, `took being let go as ${was} hard, after trusting the League with a legendary`); t.grudge = S.season; t.grudgeLg = S.lg || 0;
    if (nLeagues() < 2 || rand() >= GRUDGE_AWAY_LEG) return 'grudge';
    shiftLeague(t, pick(Array.from({ length: nLeagues() }, (_, i) => i).filter(i => i !== homeLeague(t)))); return 'away';
  }
  if (t.stepDown != null) {
    t.stepDown = null;
    if (rand() < GRUDGE_CHANCE) { returnToCircuit(t, `took being let go as ${was} as a slight`); t.grudge = S.season; t.grudgeLg = S.lg || 0; return grudgeAway(t); }
    retire(t, `after being let go as ${was}`); return 'retired';
  }
  return retireOrReturn(t, `was let go as ${was}`);
}
// let go of a member of staff in the player's League. Returns the vacancy it opened (a senior post), true (a gym
// trainer, whose place is filled at once from the circuit) or false.
function releaseStaff(id) {
  return inLeague(ME(), () => {
    const t = T(id), p = postOf(t);
    if (!p || p.post === 'champion' || t.acting) return false;
    const was = postName(t);
    vacate(t);
    const fate = letGo(t, was);
    if (p.post === 'gymtrainer') staffGym(p.slot);
    const where = fate === 'retired' ? 'and retired' : fate === 'grudge' ? 'and, stung, returns to the circuit to challenge the League' : 'and returns to the circuit';
    const text = `You let ${t.name} go as ${was} ${where}.${p.post === 'leader' ? ` ${dn(T(S.gyms[p.slot].leader))} is acting leader until you choose.` : p.post === 'e4' ? ` ${T(S.e4[p.slot]).name} stands in until you choose.` : ''}`;
    news(text, 'move', t.id); noteChange(text);
    return p.post === 'gymtrainer' ? true : S.vacancies[S.vacancies.length - 1];
  });
}
// two Gym Leaders swap gyms, or two Elite Four members swap seats, in one step. Each rebuilds their team for the new
// post; a gym trainer who no longer fits the new leader's type is let go and replaced from the circuit.
function swapStaff(a, b) {
  return inLeague(ME(), () => {
    const A = T(a), B = T(b), pa = postOf(A), pb = postOf(B);
    if (!pa || !pb || a === b || pa.post !== pb.post || !['leader', 'e4'].includes(pa.post) || A.acting || B.acting || swapRefusal(A, B)) return false;
    let text;
    if (pa.post === 'leader') {
      S.gyms[pa.slot].leader = null; S.gyms[pb.slot].leader = null;
      installElite(A, 'leader', pb.slot); installElite(B, 'leader', pa.slot);
      staffGym(pa.slot); staffGym(pb.slot);
      text = `${dn(A)} and ${dn(B)} swapped gyms: ${A.name} now leads ${townName(pb.slot)} Gym, ${B.name} ${townName(pa.slot)} Gym.`;
    } else {
      S.e4[pa.slot] = null; S.e4[pb.slot] = null;
      installElite(A, 'e4', pb.slot); installElite(B, 'e4', pa.slot);
      text = `${dn(A)} and ${dn(B)} swapped Elite Four seats: ${A.name} is now #${pb.slot + 1}, ${B.name} #${pa.slot + 1}.`;
    }
    news(text, 'move', A.id); noteChange(text);
    return true;
  });
}
// who can take gym trainer place k at gym i by the player's hand: fitting challengers on the circuit (the same rule
// as the automatic pick), the League's other gym trainers who fit, and its Gym Leaders and Elite Four members who fit
// (a demotion; the post they leave opens). Best first.
function gymTrainerCands(i) {
  const g = S.gyms[i], L = T(g.leader), out = [];
  if (!L) return out;
  for (const t of fieldPool()) if (t && t.role === 'challenger' && t.age >= 16 && !t.leaving && !t.hired && !underContract(t) && gymFits(t, L) && !(t.rest == null && t.badges.length >= 8) && !(t.titleSeasons || []).length) out.push({ t, from: 'circuit' });
  for (const t of hireRetirees(x => gymFits(x, L))) out.push({ t, from: 'retired' });
  for (const id of g.outs || []) { const t = T(id); if (t && t.role === 'prospect' && gymFits(t, L)) out.push({ t, from: 'outsider' }); }
  S.gyms.forEach((h, j) => {
    if (j !== i) for (const id of h.trainers || []) { const t = T(id); if (t && gymFits(t, L)) out.push({ t, from: 'gym', gym: j }); }
    const hl = T(h.leader); if (j !== i && hl && !hl.acting && gymFits(hl, L)) out.push({ t: hl, from: 'leader', gym: j });
  });
  S.e4.forEach((id, k) => { const t = T(id); if (t && !t.acting && gymFits(t, L)) out.push({ t, from: 'e4', seat: k }); });
  for (const c of out) if (['gym', 'leader', 'e4'].includes(c.from)) c.refuse = refusal(c.t, 'gymtrainer', i);
  for (const c of out) if (['circuit', 'retired'].includes(c.from)) c.refuse = prestBlock(c.t) || c.refuse; // (0.23.0)
  return out.sort((a, b) => ovr(b.t) - ovr(a.t));
}
// put trainer id in gym trainer place k at gym i, letting go of whoever holds it. A gym under an acting leader runs
// one short, so only a place that is held can be changed there. Returns the vacancy a moved senior member left, or
// true, or false.
function placeGymTrainer(i, k, id, opts = {}) {
  return inLeague(ME(), () => {
    const g = S.gyms[i], t = T(id), old = T((g.trainers || [])[k]);
    if (!t || k < 0 || k >= GYM_TRAINERS || (g.acting && !old) || old === t) return false;
    if (opts.hired ? !(t.role === 'challenger' && T(g.leader) && gymFits(t, T(g.leader))) : !gymTrainerCands(i).some(c => c.t === t && !c.refuse)) return false;
    // anyone else who had accepted this place isn't coming now (0.9.0)
    if (g.incoming && g.incoming[k] != null && g.incoming[k] !== id) cancelIncoming({ post: 'gymtrainer', slot: i, k }, `${t.name} took the place`);
    if (g.incoming) g.incoming[k] = null;
    t.hired = null; t.hireDue = false;
    const back = t.role === 'retired', outsider = t.role === 'prospect';
    if (back) unretire(t);
    if (outsider) { t.outsider = false; g.outs = (g.outs || []).filter(x => x !== t.id); }
    const was = postName(t), p = postOf(t);
    if (old) { const ow = postName(old); g.trainers[k] = null; closePost(old); letGo(old, ow); }
    if (p) vacate(t);
    takeGymTrainer(t, i, k, p ? `${dn(t)} moved from ${was} to become a gym trainer at ${townName(i)} Gym.` : back ? `${dn(t)} came out of retirement to become a gym trainer at ${townName(i)} Gym.` : outsider ? `Outsider ${dn(t)} became a gym trainer at ${townName(i)} Gym.` : null);
    flushGymOutsiders(i);
    if (p && p.post === 'gymtrainer') staffGym(p.slot);
    noteChange(`${t.name} is now a gym trainer at ${townName(i)} Gym${old ? `, in place of ${old.name}` : ''}.`);
    return p && p.vacancy ? p.vacancy : true;
  });
}
// ---------- hiring (0.9.0, stage 2a) ----------
// There is no separate hiring pool: the pool is simply everyone a League can hire right now. For the player that is
// the League's circuit (an offer, which a challenger can turn down; one who accepts mid-run finishes the run first,
// for up to HIRE_NOTICE weeks, while the post's current holder stays), the League's own staff (they move at once),
// recent retirees (they come out of retirement at once) and outsiders the game makes for a post (they accept at once;
// the ones not picked join the circuit). Rival Leagues hire from their own circuit, recent retirees and outsiders,
// and take a challenger at once. All numbers here are provisional (design doc 4.8).
const HIRE_NOTICE = 8, REFUSED_WEEKS = 24;
const RETIREE_YEARS = 3, RETIREE_MAX_AGE = 55, RETIREE_MIN_OVR = 55;
const GYM_HIRE_MIN = 48, E4_HIRE_MIN = 54, E4_HIRE_EDGE = 5, POOR_YEARS = 3, E4_POOR_MIN_RUNS = 3, GT_OUTSIDERS = 2;
// a retired trainer's age now (birthdays stop at retirement)
const retAge = t => t.age + Math.max(0, (S.season || 0) - (t.retiredSeason || S.season || 0));
// recent retirees who would come back for a post: retired in the last RETIREE_YEARS years, under RETIREE_MAX_AGE now,
// and still good enough (any League's: retirement belongs to the world)
function hireRetirees(fit) {
  if (fixedStaff()) return [];
  return Object.values(S.trainers).filter(t => t.role === 'retired' && t.retiredSeason != null && (S.season || 0) - t.retiredSeason <= RETIREE_YEARS
    && retAge(t) < RETIREE_MAX_AGE && ovr(t) >= RETIREE_MIN_OVR && t.team.length && (!fit || fit(t)));
}
// a retiree takes a post: back into the world, the years away added to their age. A Hall of Famer stays one.
function unretire(t) {
  // (0.31.0) the duplicate-legendary bug: a retiree keeps an Ultra Beast, Paradox Pokémon or other legendary with no
  // partner years, and retirees don't count toward one of each, so another could turn up meanwhile. One whose places
  // are taken by the time they come back has moved on (checked while they still count as retired)
  const full = ownedLegends(), px = paradoxHeld(), babies = new Set(freeBabies());
  for (const m of t.team.slice()) {
    const s = SP[m.sp]; if (!s) continue;
    if ((s.legend && !s.baby && full.has(m.sp)) || (s.paradox && px.has(m.sp)) || (s.baby && !babies.has(LINE[m.sp]))) { farewell(t, m, `had moved on by the time ${t.name} came out of retirement`); t.team = t.team.filter(x => x !== m); }
  }
  if (t.mega && !t.team.some(m => m.uid === t.mega.uid)) t.mega = null;
  t.age = retAge(t); t.unretired = S.season; t.retiredSeason = null; t.prevRole = null; t.lg = S.lg || 0; t.role = 'free';
  t.leaving = null; t.stepDown = null;
}
// may the player offer challenger t a post now? (one who turned the League down isn't asked again for half a year)
const canOffer = t => t.refusedAt == null || S.turn - t.refusedAt >= REFUSED_WEEKS;
// does challenger t take the post offered? Younger trainers, title winners, those doing well on a run and anyone
// holding a grudge are less keen; a gym trainer's place is less tempting than a seat on the Elite Four.
function acceptsOffer(t, post) {
  if (!willSign(t)) return false; // (0.23.0) below their prestige minimum, nobody signs
  let p = 0.75;
  if (t.age < 20) p -= 0.15; else if (t.age >= 35) p += 0.15;
  const cl = claimOn(t); // (0.22.0) a claimant waiting on the League's answer is glad of a post
  if ((t.titleSeasons || []).length && !cl) p -= 0.25;
  if (cl) p += CLAIM_ACCEPT;
  if (t.rest == null) { p -= 0.1; if (t.badges.length >= 6) p -= 0.25; }
  if (post === 'gymtrainer') p -= 0.1; else if (post === 'e4') p += 0.1;
  if (t.grudge != null) p -= 0.3;
  // (0.14.0, the balance retune) a challenger doing well against the League wants the title, not a post
  if (impressed(t) && !cl) p -= IMPRESS_REFUSE;
  // (0.13.0) the scouting office and a bid over the asking pay (0.16.0: in every League, rival Leagues bid too)
  p += 0.04 * scoutLv() + BID_ODDS * Math.round((t.bidMul ? t.bidMul - 1 : 0) / 0.25);
  // (0.16.0) one of the League's own, raised in its youth academy, is loyal to it
  if (ownAcademy(t)) p += ACADEMY_LOYAL;
  p -= CON_ODDS * conMiss(t, post, t.conAsk); // (0.52.0) a contract length they don't want
  p += prestigePull(); // (0.18.0) trainers prefer a prestigious League
  return rand() < clamp(p, 0.1, 0.95);
}
// ================= PRESTIGE GATING (0.23.0, design doc 6.3) =================
// Every trainer has a prestige minimum for joining a League: nothing below PM_FREE OVR, then PM_PER a point of OVR
// above it, plus PM_REC of their own career prestige (titles, the Hall of Fame, badges, years; at most PM_REC_MAX),
// plus PM_FAMOUS for a famous trainer. Ambition lowers it: a trainer hungry for a post (another League's staff who
// want promotion, a claimant waiting on an answer, and about one challenger in four by nature) signs at PM_HUNGRY of
// it, and one holding a grudge against another League at PM_GRUDGE. It applies at founding, to hires and to offers, in
// every League; the League's own staff moving between its posts, outsiders the game makes for a post (made no
// stronger than the League's prestige can attract: prestQ) and staff following the player to a new League are
// exempt. All numbers provisional.
const PM_FREE = 62, PM_PER = 4.5, PM_REC = 0.3, PM_REC_MAX = 20, PM_FAMOUS = 15, PM_HUNGRY = 0.7, PM_GRUDGE = 0.6, PM_HUNGRY_SHARE = 25;
// a stable draw per trainer (from the id): about PM_HUNGRY_SHARE in 100 are hungry by nature
const hungerDraw = t => ((t.id * 2654435761) >>> 0) % 100;
function hungry(t) {
  if (STAFF_ROLES.includes(t.role)) return !!(t.wish && t.wish.k === 'up');
  return !!claimOn(t) || hungerDraw(t) < PM_HUNGRY_SHARE;
}
// trainer t's prestige minimum to join League lg (the bound League by default)
function prestMin(t, lg) {
  if (!t || !t.r) return 0;
  if (lg == null) lg = S.lg || 0;
  let m = Math.max(0, ovr(t) - PM_FREE) * PM_PER + Math.min(PM_REC_MAX, trainerPrestige(t) * PM_REC) + (t.famous ? PM_FAMOUS : 0);
  if (hungry(t)) m *= PM_HUNGRY * (1 - SEAT_HUNGRY * seatOpen(lg)); // (0.43.0) a seat they could win
  if (t.grudge != null && t.grudgeLg != null && t.grudgeLg !== lg) m *= PM_GRUDGE;
  const hc = homeCity(t); if (hc != null && strongholdOf(S.cities[hc], lg)) m *= STRONG_RECRUIT; // (0.40.0) a hometown League's Stronghold
  return Math.round(m);
}
// would t sign for League lg now? (always in the report's fixed tiers)
function willSign(t, lg) {
  if (lg == null) lg = S.lg || 0;
  if (!t || fixedStaff() || t.outsider || t.carried) return true;
  if (STAFF_ROLES.includes(t.role) && homeLeague(t) === lg) return true;
  return prestMin(t, lg) <= prestOf(lg);
}
// the reason shown on a candidate who won't sign, or null
const prestBlock = (t, lg) => willSign(t, lg) ? null : `needs prestige ${prestMin(t, lg)} (you have ${Math.round(prestOf(lg == null ? (S.lg || 0) : lg))})`;
// the strongest outsider the bound League's prestige can attract (a quality, about an OVR), and a post's outsider
// quality capped by it; a famous outsider only when the League could sign one at that quality
const prestQ = () => PM_FREE + prestOf(S.lg || 0) / PM_PER;
const capQ = q => fixedStaff() ? q : Math.min(q, Math.floor(prestQ()));
const famousOk = q => fixedStaff() || prestOf(S.lg || 0) >= PM_FAMOUS + Math.max(0, q - PM_FREE) * PM_PER;
// (0.17.0, stage 5) a sponsored contender under contract to another League than `lg` (the bound League by default):
// nobody else can hire them or seat them while the contract runs
const underContract = (t, lg) => !!(t && t.spon && t.spon.lg !== (lg == null ? (S.lg || 0) : lg));
// a challenger on the player's circuit who did well against the League this year or last: reached the Elite Four, or
// won IMPRESS_BADGES badges in a run. Returns the reason in words, or null.
const IMPRESS_BADGES = 6, IMPRESS_REFUSE = 0.6;
function impressed(t) {
  if (!t || t.role !== 'challenger') return null;
  const y = t.yr && t.yr.season === S.season ? { b: t.yr.b, st: t.yr.st, when: 'this year' } : null;
  const h = (t.seasonHist || [])[t.seasonHist.length - 1];
  const p = h && h.season === S.season - 1 && (h.lg || 0) === (S.lg || 0) ? { b: h.badges, st: h.stage, when: 'last year' } : null;
  for (const x of [y, p]) if (x) { if (x.st != null) return `reached the Elite Four ${x.when}`; if (x.b >= IMPRESS_BADGES) return `${x.b} badges in a run ${x.when}`; }
  return null;
}
// what a hired challenger is coming to, in words
function hireTarget(h) { return h.post === 'leader' ? `${townName(h.slot)} Gym Leader` : h.post === 'e4' ? `Elite Four seat #${h.slot + 1}` : `gym trainer at ${townName(h.slot)} Gym`; }
// offer challenger t a post: target { post: 'leader'|'e4', slot } for a vacancy, { post: 'gymtrainer', slot, k } for a
// gym trainer's place. Returns { res: 'now' | 'later' | 'refused' | 'cool', r } (r: what installing them returned).
function offerPost(target, t) {
  if (!canOffer(t)) return { res: 'cool' };
  if (!acceptsOffer(t, target.post)) {
    t.refusedAt = S.turn;
    const msg = `${dn(t)} turned down an offer to become ${hireTarget(target)}.`;
    news(msg, 'move', t.id); noteChange(msg);
    return { res: 'refused' };
  }
  if (t.rest != null) return { res: 'now', r: installHire(target, t.id) };
  // out on a run: they finish it first, for up to HIRE_NOTICE weeks; the post's holder stays meanwhile
  cancelIncoming(target, `the post went to ${t.name}`);
  t.hired = { ...target, at: S.turn, by: S.turn + HIRE_NOTICE };
  if (target.post === 'gymtrainer') { const g = S.gyms[target.slot]; g.incoming = g.incoming || []; g.incoming[target.k] = t.id; }
  else { const v = vacancyAt(target.post, target.slot); if (v) v.incoming = t.id; }
  const msg = `${dn(t)} accepted an offer to become ${hireTarget(target)} and will take it up after their run (by ${turnDate(t.hired.by)} at the latest).`;
  news(msg, 'move', t.id); noteChange(msg);
  return { res: 'later' };
}
const vacancyAt = (post, slot) => (S.vacancies || []).find(v => v.post === post && v.slot === slot) || null;
// install a hire now: a vacancy through fillVacancy, a gym trainer's place through placeGymTrainer
function installHire(target, id) {
  if (target.post === 'gymtrainer') return placeGymTrainer(target.slot, target.k, id, { hired: true });
  const v = vacancyAt(target.post, target.slot);
  return v ? fillVacancy(v, id, { hired: true }) : false;
}
// whoever was coming to this post isn't any more (the player chose someone else, or the post changed)
function cancelIncoming(target, why) {
  let id = null;
  if (target.post === 'gymtrainer') { const g = S.gyms[target.slot]; id = (g.incoming || [])[target.k]; if (g.incoming) g.incoming[target.k] = null; }
  else { const v = vacancyAt(target.post, target.slot); if (v) { id = v.incoming; v.incoming = null; } }
  const t = T(id); if (!t || !t.hired) return;
  t.hired = null; t.hireDue = false; t.bidMul = t.conAsk = null;
  if (why) { const msg = `${dn(t)} will not become ${hireTarget(target)} after all: ${why}.`; news(msg, 'move', t.id); noteChange(msg); }
}
// the player withdraws an offer someone accepted
function withdrawOffer(id) { return inLeague(ME(), () => { const t = T(id); if (!t || !t.hired) return false; cancelIncoming(t.hired, 'the League withdrew its offer'); return true; }); }
// once a week (after every League's week): hired challengers whose run ended, or whose time is up, take their post
function hireArrivals() {
  if (!handOn()) return;
  inLeague(ME(), () => {
    for (const t of Object.values(S.trainers)) {
      const h = t.hired; if (!h) continue;
      const drop = why => { cancelIncoming(h, why); t.hired = null; t.hireDue = false; };
      if (t.role !== 'challenger' || !S.challengers.includes(t.id)) { drop(`${t.name} is no longer on the circuit`); continue; }
      if (!t.hireDue && S.turn < h.by) continue;
      const cut = !t.hireDue && t.rest == null;
      if (h.post === 'gymtrainer') { const g = S.gyms[h.slot], L = T(g.leader); if (!L || !gymFits(t, L) || (g.acting && !T((g.trainers || [])[h.k]))) { drop(`${townName(h.slot)} Gym changed`); continue; } }
      else if (!vacancyAt(h.post, h.slot)) { drop('the post was filled'); continue; }
      if (cut) { const msg = `${dn(t)} left their run with ${t.badges.length} badge${t.badges.length === 1 ? '' : 's'} to take up the post of ${hireTarget(h)}.`; news(msg, 'move', t.id); }
      t.hired = null; t.hireDue = false; t.leaving = null;
      const target = { ...h };
      if (target.post === 'gymtrainer') { const g = S.gyms[target.slot]; if (g.incoming) g.incoming[target.k] = null; }
      else { const v = vacancyAt(target.post, target.slot); if (v) v.incoming = null; }
      installHire(target, t.id);
    }
  });
}
// a vacancy for the player: offer a circuit challenger, or install anyone else at once
// (0.13.0) bid: pay over the asking (one of BIDS) to improve the odds; nobody new is hired while the League is in the red
function hireForVacancy(v, id, bid = 0) {
  return inLeague(ME(), () => {
    const t = T(id), c = vacancyCands(v).find(x => x.t === t);
    if (!c || c.refuse) return { res: false };
    if (booksOn() && S.fin.money < 0 && !['leader', 'e4', 'gym', 'acting'].includes(c.from)) return { res: 'broke' };
    if (c.talks) return talkFromHire(t, v.post, v.slot, bid); // (0.53.0) stars and other Leagues' staff: talks
    if (c.from === 'circuit' || c.from === 'away') return bidOffer({ post: v.post, slot: v.slot }, t, bid);
    return { res: 'now', r: fillVacancy(v, id) };
  });
}
function hireForGymTrainer(i, k, id, bid = 0) {
  return inLeague(ME(), () => {
    const t = T(id), c = gymTrainerCands(i).find(x => x.t === t), g = S.gyms[i];
    if (!c || c.refuse || k < 0 || k >= GYM_TRAINERS || (g.acting && !T((g.trainers || [])[k]))) return { res: false };
    if (booksOn() && S.fin.money < 0 && ['circuit', 'outsider', 'retired'].includes(c.from)) return { res: 'broke' };
    if (c.from === 'circuit') return bidOffer({ post: 'gymtrainer', slot: i, k }, t, bid);
    return { res: 'now', r: placeGymTrainer(i, k, id) };
  });
}
// an offer with a bid: the bid stays with them until they take the post (or the offer falls through)
function bidOffer(target, t, bid) {
  t.bidMul = booksOn() && BIDS.includes(bid) && bid > 0 ? 1 + bid : null;
  const r = offerPost(target, t);
  if (r.res === 'refused' || r.res === 'cool') t.bidMul = t.conAsk = null;
  return r;
}
// outsiders for a gym trainer's place picked by hand: GT_OUTSIDERS trainers of the leader's type, made when the
// picker opens and kept until a place at that gym is filled by hand or New Year (then they join the circuit)
function gymOutsiders(i) {
  return inLeague(ME(), () => {
    const g = S.gyms[i], L = T(g.leader); if (!L) return [];
    g.outs = (g.outs || []).filter(x => T(x) && T(x).role === 'prospect');
    const ty = specTypes(L);
    while (g.outs.length < GT_OUTSIDERS + scoutLv()) {
      const t = newTrainer({ age: ri(18, 34), quality: staffQ(capQ(46 + i * 2) + 2 * scoutLv()), role: 'prospect', specialty: ty.length ? pick(ty) : (rand() < 0.14 ? null : pick(TYPES)), noFamous: true });
      fieldTeam(t, 4); t.outsider = true; g.outs.push(t.id);
    }
    return g.outs.slice();
  });
}
function flushGymOutsiders(i) {
  const g = S.gyms[i], rest = (g.outs || []).filter(x => T(x) && T(x).role === 'prospect');
  g.outs = null;
  rest.forEach(x => { T(x).outsider = false; });
  if (rest.length) fillCircuits(rest);
}
// ---- rival Leagues (and any League nobody staffs by hand) ----
// the best of the League's own circuit and the recent retirees at OVR min or better; a challenger must accept the
// offer (the next best is asked if they don't). Null when nobody fits (then the League makes an outsider).
function rivalHire(min, exclude = [], post = null, bidAt = null) {
  if (fixedStaff()) return null;
  // (0.16.0) a rich League bids over the asking pay (aimBid), which makes challengers and other Leagues' staff likelier
  // to come, and costs it more every week after
  const bid = bidAt != null ? bidAt : aimBid(), steps = Math.round(bid / 0.25);
  // (0.15.0) by the League's aim: a wall-builder takes the best, a star-maker leans to youth, a money-maker to trainers
  // near the floor (cheaper); in the red, anyone takes the cheapest who fits
  const aim = S.fin && S.fin.aim, red = S.fin && S.fin.money < 0;
  const val = t => red ? -ovr(t) : aim === 'star' ? ovr(t) + Math.max(0, 30 - t.age) * 0.6 : aim === 'money' ? ovr(t) + (ovr(t) <= min + 8 ? 100 : 0) : ovr(t) + (t.role === 'challenger' ? t.career.badges / 4 : 0);
  const cs = fieldPool().filter(t => t && t.role === 'challenger' && !exclude.includes(t.id) && !t.hired && t.talk == null && !underContract(t) && !comebackProtected(t) && !t.leaving && t.age >= 17 && t.seasons >= 2 && ovr(t) >= min && !(t.letGoAt != null && S.turn - t.letGoAt < YEAR_WEEKS))
    .concat(hireRetirees(t => ovr(t) >= min && !exclude.includes(t.id) && !(t.letGoAt != null && S.turn - t.letGoAt < YEAR_WEEKS)))
    .concat(post ? otherCircuits(t => t.age >= 17 && t.seasons >= 2 && ovr(t) >= min && !exclude.includes(t.id) && !comebackProtected(t) && !(t.letGoAt != null && S.turn - t.letGoAt < YEAR_WEEKS)) : [])
    .concat(post && post !== 'e4' ? otherStaffFor(post, min).filter(t => !exclude.includes(t.id) && rand() < POACH_ACCEPT + BID_ODDS * steps) : []).filter(t => willSign(t)).sort((a, b) => val(b) - val(a));
  for (const t of cs) {
    if (t.role === 'retired') return t;
    t.bidMul = bid ? 1 + bid : null;
    if (STAFF_ROLES.includes(t.role) || acceptsOffer(t, 'leader')) return t;
    t.bidMul = null;
  }
  return null;
}
// a rival League's vacant Elite Four seat: the best of its circuit and the recent retirees at E4_HIRE_MIN, else an
// outsider (sometimes famous)
function rivalE4(i) {
  const c = rivalHire(E4_HIRE_MIN, [], 'e4');
  const own = promoteWithin('e4', i, c ? ovr(c) - PROMOTE_EDGE : E4_HIRE_MIN - PROMOTE_EDGE);
  if (own) { if (c) c.bidMul = null; const ch = []; moveUpWithin(own, 'e4', i, ch); ch.forEach(noteChange); return own; }
  if (!c) return outsiderE4(i);
  if (c.role === 'retired') unretire(c);
  if (STAFF_ROLES.includes(c.role)) { const from = leagueName(homeLeague(c)); leaveForPost(c, S.lgName); news(`${dn(c)} left the ${from} to join the ${S.lgName}'s Elite Four.`, 'move', c.id); }
  dropFromCircuits(c.id);
  installElite(c, 'e4', i);
  return c;
}
// ---------- staff moving between Leagues (0.15.0, stage 4) ----------
// A member of another League's staff who wants promotion takes a bigger post (gym trainer → Gym Leader, Gym Leader →
// Elite Four) when offered: rival Leagues ask with POACH_ACCEPT odds, the player's offers are always taken. Their old
// post opens in their League (an acting holder in the player's; filled at once elsewhere), and their old League
// receives the signing fee the new one pays (postPay). Nobody is poached while a poach is being refilled.
const POACH_ACCEPT = 0.6;
let POACH_DEPTH = 0;
function otherStaffFor(post, min) {
  const out = [], me = S.lg || 0;
  if (POACH_DEPTH || nLeagues() < 2 || fixedStaff()) return out;
  for (let j = 0; j < nLeagues(); j++) if (j !== me) inLeague(j, () => { if (!(handOn() && j === ME())) for (const t of staffIds().map(T)) if (t && t.talk == null && t.wish && t.wish.k === 'up' && !t.acting && !t.quit && t.stepDown == null && !founderChamp(t) && ((post === 'leader' && t.role === 'gymtrainer') || (post === 'e4' && t.role === 'leader')) && ovr(t) >= min) out.push(t); });
  return out;
}
// (0.15.0) challengers on other Leagues' circuits who are resting between runs (so they could come at once), not hired
// or leaving, and passing `fit`: any League can offer them a post
function otherCircuits(fit) {
  const out = [], me = S.lg || 0;
  if (nLeagues() < 2 || fixedStaff()) return out;
  // (0.41.0) other regions only: the region's own challengers are in the League's field (fieldPool)
  for (let j = 0; j < nLeagues(); j++) if (j !== me && lgRegion(j) !== S.region) inLeague(j, () => { for (const t of challengers()) if (t && t.role === 'challenger' && t.rest != null && !underContract(t, me) && !t.hired && !t.hireDue && !t.leaving && t.age >= 16 && fit(t)) out.push(t); });
  return out;
}
function leaveForPost(t, toName) {
  POACH_DEPTH++;
  try {
    inLeague(homeLeague(t), () => {
      const p = postOf(t); if (!p) return;
      const mine = playerLeague(), was = postName(t);
      t.quit = null;
      if (mine) vacate(t);
      else { closePost(t); if (p.post === 'leader') S.gyms[p.slot].leader = null; else if (p.post === 'e4') S.e4[p.slot] = null; else S.gyms[p.slot].trainers[p.k] = null; }
      const text = `${t.name} left ${was} for a bigger post at the ${toName}.`;
      news(text, 'move', t.id); noteChange(text);
      const ch = [];
      if (p.post === 'gymtrainer') staffGym(p.slot);
      else if (!mine) { if (p.post === 'leader') { fillGym(p.slot, ch); staffGym(p.slot); } else rivalE4(p.slot); }
      ch.forEach(noteChange);
      if (mine && p.post !== 'gymtrainer') stopFor('vacancy', `${text} ${p.post === 'leader' ? `${dn(T(S.gyms[p.slot].leader))} is acting leader` : `${T(S.e4[p.slot]).name} stands in`} until you choose.`);
    });
  } finally { POACH_DEPTH--; }
  t.role = 'free';
}
// the Elite Four seat with the worst record of the year (runs stopped of runs faced), from the year's history
// entry; null in a year with fewer than E4_POOR_MIN_RUNS runs at the Elite Four. Each holder's t.e4Poor counts the
// years in a row they had the worst record (acting holders aren't counted).
function noteE4Records(h) {
  if (!h || !h.seats || h.seats[0].faced < E4_POOR_MIN_RUNS) return null;
  const seats = S.e4.map((id, k) => ({ k, t: T(id), s: h.seats[k] })).filter(x => x.t && !x.t.acting && x.s && x.s.faced);
  if (!seats.length) return null;
  seats.sort((a, b) => a.s.stopped / a.s.faced - b.s.stopped / b.s.faced || ovr(a.t) - ovr(b.t));
  const worst = seats[0].t;
  S.e4.forEach((id, k) => { const t = T(id); if (!t) return; t.e4Poor = t === worst ? (t.e4Poor || 0) + 1 : 0; if (h.seats[k]) h.seats[k].poor = t.e4Poor; });
  return seats[0].k;
}
// poor staff are replaced in Leagues nobody staffs by hand (the player only gets a warning): at most one gym a year
// (its leader held under 30% of 12+ tries POOR_YEARS years in a row) and one Elite Four seat (the worst record of the
// four POOR_YEARS years in a row, and someone at least E4_HIRE_EDGE OVR better is available)
function replacePoorStaff(changes, worstSeat) {
  if (playerLeague() || fixedStaff()) return;
  const gi = S.gyms.map((g, i) => ({ g, i, t: T(g.leader) })).filter(x => x.t && x.g.poorFor === x.t.id && (x.g.poor || 0) >= POOR_YEARS)
    .sort((a, b) => b.g.poor - a.g.poor || a.g.w / Math.max(1, a.g.w + a.g.l) - b.g.w / Math.max(1, b.g.w + b.g.l))[0];
  if (gi) {
    const { g, i, t } = gi, n = g.poor;
    g.leader = null; g.poor = 0; t.letGoAt = S.turn;
    const fate = retireOrReturn(t, `was replaced as ${townName(i)} Gym Leader after ${n} poor years in a row`);
    changes.push(`${dn(t)} was replaced at ${townName(i)} Gym after ${n} poor years in a row${fate === 'retired' ? ' and retired' : ''}.`);
    fillGym(i, changes); staffGym(i);
  }
  if (worstSeat != null) {
    const t = T(S.e4[worstSeat]);
    if (t && (t.e4Poor || 0) >= POOR_YEARS) {
      const c = rivalHire(Math.max(E4_HIRE_MIN, ovr(t) + E4_HIRE_EDGE), [t.id]);
      if (c) {
        S.e4[worstSeat] = null; t.e4Poor = 0; t.letGoAt = S.turn;
        const fate = retireOrReturn(t, `lost Elite Four seat #${worstSeat + 1} after ${POOR_YEARS} years with the worst record of the four`);
        const back = c.role === 'retired'; if (back) unretire(c);
        dropFromCircuits(c.id); installElite(c, 'e4', worstSeat);
        changes.push(`${dn(c)}${back ? ', out of retirement,' : ''} replaced ${t.name} on the Elite Four (seat #${worstSeat + 1}) after ${POOR_YEARS} years with the worst record of the four; ${t.name} ${fate === 'retired' ? 'retired' : 'returns to the circuit'}.`);
        news(changes[changes.length - 1], 'move', c.id);
      }
    }
  }
}
// a vacant gym goes to the circuit's best challenger or to an outsider
function fillGym(i, changes) {
  // (0.9.0) the best of the League's circuit and the recent retirees at GYM_HIRE_MIN, else an outsider
  const cand = rivalHire(GYM_HIRE_MIN, [], 'leader');
  // (0.10.0) a member of staff who wants promotion and is nearly as good comes first
  const own = promoteWithin('leader', i, cand ? ovr(cand) - PROMOTE_EDGE : GYM_HIRE_MIN - PROMOTE_EDGE);
  if (own) { if (cand) cand.bidMul = null; moveUpWithin(own, 'leader', i, changes); return; }
  let nl;
  if (cand) {
    const back = cand.role === 'retired', away = STAFF_ROLES.includes(cand.role), from = away ? leagueName(homeLeague(cand)) : null; if (back) unretire(cand);
    if (away) leaveForPost(cand, S.lgName);
    changes.push(back ? `${dn(cand)} came out of retirement to lead ${townName(i)} Gym (${typeLabel(cand)}).` : away ? `${dn(cand)} left the ${from} to lead ${townName(i)} Gym (${typeLabel(cand)}).` : `${dn(cand)} left the circuit to lead ${townName(i)} Gym (${typeLabel(cand)}).`);
    dropFromCircuits(cand.id); installElite(cand, 'leader', i);
    nl = cand;
  } else {
    // sometimes the outsider is a famous trainer of the right type
    const q = capQ(52 + i * 2); // (0.23.0) no stronger than the League's prestige can attract
    const fam = !(S.cfg && S.cfg.allFamous) && famousOk(q) && rand() < FAMOUS_POST_CHANCE ? famousAvailable(f => f.spec && (/Leader|Kahuna|Captain|Elite Four/.test(f.cls) || f.tags.includes('brain')) && f.age >= 14) : [];
    nl = fam.length ? makeFamous(pick(fam), 'leader', staffQ(q), GYM_LV[GYM_TOP]) : newTrainer({ age: ri(26, 44), quality: staffQ(q), role: 'leader' });
    changes.push(`Outsider ${nl.name} was appointed leader of ${townName(i)} Gym (${typeLabel(nl)}).`);
    installElite(nl, 'leader', i);
  }
  news(changes[changes.length - 1], 'move', nl.id);
}

// ================= AMBITIONS (0.10.0, stage 2b) =================
// Each member of staff has one ambition (design doc 4.5): promotion (a gym trainer wants a gym, a Gym Leader a later
// gym or the Elite Four, an Elite Four member a higher seat; seat #4 wants the Champion's seat and waits without a
// clock until seat challenges exist), stay put, or another run as a challenger. It is set when they take a post, from
// age, ratings, post and record, and can change on a birthday. Promotion waits AMB_WAIT_YEARS in the post; ignored,
// a senior member announces they are leaving (QUIT_NOTICE weeks) and leaves with a grudge, and a gym trainer just
// goes. Another run comes as a request: let them go, or they leave anyway RUN_HOLD weeks after asking. (0.34.0) The
// Champion has ambitions too: stay put (the commonest), a bigger League's seat (promotion with its clock, only with
// another League in the world), another run, or to step down (its own clock: then notice, and they retire or take an
// Elite Four seat). A founder Champion stays put through their window. Staff refuse a step down (unless their record is poor) and, when they want to stay put or want
// another run, a sideways move or a swap. All numbers are provisional.
const AMB_WAIT_YEARS = 3, AMB_RESTLESS_YEARS = 2, QUIT_NOTICE = 12, RUN_HOLD = YEAR_WEEKS, COMEBACK_STREAK = 5;
const AMB_DRIFT = 0.12, GRUDGE_AWAY = 0.5, BACKOUT_CHANCE = 0.5, PROMOTE_EDGE = 5;
// how senior a post is: every gym trainer's place is the same; later gyms and higher seats are bigger posts
const rankOf = (post, slot) => post === 'gymtrainer' ? 0 : post === 'leader' ? 10 + slot : post === 'e4' ? 20 + slot : 30;
const CHAMP_DRIFT = 0.25, CHAMP_STEP_AGE = 40;
function pickAmbition(t, role, slot) {
  if (role === 'champion') { // (0.34.0)
    if (founderChamp(t)) return 'stay';
    const o = ovr(t), yrs = seatYears(t);
    const stay = 2 + (t.age >= 40 ? 1 : 0);
    const up = nLeagues() > 1 ? Math.max(0, 0.4 + (o - 65) / 20 + (t.age < 32 ? 0.3 : 0)) : 0;
    const run = t.age < 32 && o >= 62 ? 0.35 : 0;
    const step = 0.3 + (t.age >= CHAMP_STEP_AGE ? 0.5 : 0) + Math.max(0, yrs - 3) * 0.1;
    const r = rand() * (stay + up + run + step);
    return r < stay ? 'stay' : r < stay + up ? 'up' : r < stay + up + run ? 'run' : 'step';
  }
  const o = ovr(t), titled = !!(t.career && t.career.titles);
  let up = Math.max(0.15, 1 + (o - 60) / 15 + (t.age < 30 ? 0.5 : 0) - (t.age >= 45 ? 0.8 : 0));
  if (role === 'e4' && slot === 3) up *= 0.7;
  const stay = 1 + (t.age >= 40 ? 0.8 : 0) + (t.age >= 50 ? 1 : 0);
  const run = role !== 'gymtrainer' && t.age < 36 && !titled && o >= 62 ? 0.15 : 0;
  const r = rand() * (up + stay + run);
  return r < up ? 'up' : r < up + stay ? 'stay' : 'run';
}
// a new post: a new ambition, its clock starting now (a move up answers promotion; any move cancels a notice)
function setAmbition(t, role) {
  if (!STAFF_ROLES.includes(role)) { t.wish = null; t.quit = null; return; }
  const p = postOf(t);
  t.wish = { k: pickAmbition(t, role, p ? p.slot : 0), since: S.turn }; t.quit = null;
}
// on a birthday: a Gym Leader with COMEBACK_STREAK outstanding years in a row may want another run; promotion fades
// with age; now and then the ambition simply changes
function driftAmbition(t) {
  if (!t.wish || t.quit || t.stepDown != null) return;
  const a = t.wish;
  if (a.k === 'run') return;
  if (t.role === 'champion') { // (0.34.0) a Champion's ambition is picked afresh more often; one who wants out stays wanting out
    if (a.k === 'stay' && rand() < CHAMP_DRIFT) { const k = pickAmbition(t, 'champion', 0); if (k !== 'stay') t.wish = { k, since: S.turn }; }
    return;
  }
  if (t.role === 'leader' && (t.wallStreak || 0) >= COMEBACK_STREAK && t.age < 50 && rand() < 1 / 3) { t.wish = { k: 'run', since: S.turn, streak: t.wallStreak }; return; }
  if (a.k === 'up' && t.age >= 45 && rand() < 0.25) { t.wish = { k: 'stay', since: S.turn }; return; }
  if (rand() < AMB_DRIFT) { const p = postOf(t), k = pickAmbition(t, t.role, p ? p.slot : 0); if (k !== a.k) t.wish = { k, since: S.turn }; }
}
// does this ambition have a clock? (every promotion but the Champion's; since 0.11.0 seat #4 too, as seat challenges exist)
// (0.34.0) the Champion's: a bigger League's seat (with another League in the world) and stepping down
function ambClock(t) {
  const p = postOf(t); if (!t.wish || !p) return false;
  if (p.post === 'champion') return !founderChamp(t) && ((t.wish.k === 'up' && nLeagues() > 1) || t.wish.k === 'step');
  return t.wish.k === 'up';
}
// the turn promotion runs out (null when there is no clock)
const ambDue = t => ambClock(t) ? t.wish.since + AMB_WAIT_YEARS * YEAR_WEEKS : null;
const restless = t => ambClock(t) && S.turn - t.wish.since >= AMB_RESTLESS_YEARS * YEAR_WEEKS;
const ambWho = t => t.role === 'champion' ? "a bigger League's seat" : t.role === 'gymtrainer' ? 'a gym of their own' : t.role === 'e4' && postOf(t) && postOf(t).slot === S.e4.length - 1 ? "the Champion's seat" : t.role === 'e4' ? "a higher seat or the Champion's" : t.role === 'leader' && postOf(t) && postOf(t).slot === S.gyms.length - 1 ? 'a seat on the Elite Four' : 'a bigger post';
// once a week, in each League: requests for another run, promotion running out, and notices running out
function ambitionWeek() {
  if (fixedStaff()) return;
  const mine = playerLeague();
  for (const id of staffIds()) {
    const t = T(id);
    if (!t || t.acting || t.stepDown != null || !postOf(t) || (t.role === 'champion' && founderChamp(t))) continue;
    if (!t.wish) setAmbition(t, t.role);
    const a = t.wish;
    if (t.quit) { if (S.turn >= t.quit.at && t.talk == null && !champUpTalks(t)) staffQuits(t); continue; } // (0.54.0) a Champion after a bigger seat: talks first
    if (a.k === 'run') {
      if (a.asked == null) {
        a.asked = S.turn;
        const msg = `${dn(t)} (${postName(t)}) wants another run as a challenger${a.streak ? ` after ${a.streak} outstanding years in a row` : ''}${conHolds(t) ? `. Under contract, they stay until ${turnDate(t.con.until)} unless you let them go` : mine ? `. Let them go, or they leave anyway on ${turnDate(S.turn + RUN_HOLD)}` : ''}.`;
        news(msg, 'move', t.id); noteChange(msg);
        if (mine) stopFor('ambition', msg);
      }
      if (conHolds(t)) continue; // (0.52.0) a contract holds against ambition
      if (!mine) { staffQuits(t); continue; }
      if (S.turn >= a.asked + RUN_HOLD) { staffQuits(t); continue; } // (0.54.0) a contract that held them past their date: they go now
      if (S.turn >= a.asked + RUN_HOLD - QUIT_NOTICE) announceQuit(t, a.asked + RUN_HOLD);
    } else if (ambClock(t) && S.turn >= ambDue(t) && !conHolds(t)) {
      if (t.role === 'gymtrainer') staffQuits(t); else announceQuit(t, S.turn + QUIT_NOTICE);
    }
  }
}
function announceQuit(t, at) {
  if (conHolds(t)) return;
  t.quit = { at, k: t.wish ? t.wish.k : 'up' };
  const msg = t.quit.k === 'run' ? `${dn(t)} (${postName(t)}) will leave for another run as a challenger on ${turnDate(at)}, unless you let them go sooner.`
    : t.quit.k === 'step' ? `Champion ${t.name} will step down on ${turnDate(at)}. ${champHeir()} would move up, unless you call a challenge for the seat first.`
    : t.role === 'champion' ? `Champion ${t.name} wants a bigger League's seat and will leave on ${turnDate(at)}, unless you give them a raise.`
    : `${dn(t)} (${postName(t)}) has waited ${AMB_WAIT_YEARS} years for ${ambWho(t)} and will leave on ${turnDate(at)} unless promoted.`;
  news(msg, 'move', t.id); noteChange(msg);
  if (playerLeague()) stopFor('ambition', msg);
}
// a member of staff leaves over their ambition: in the player's League the post opens with an acting holder (a gym
// trainer's place is refilled at once); elsewhere it is filled at once
function staffQuits(t) {
  const p = postOf(t); if (!p) return;
  if (p.post === 'champion') return champQuits(t);
  const k = t.quit ? t.quit.k : t.wish ? t.wish.k : 'up', was = postName(t), mine = playerLeague();
  t.quit = null;
  if (mine) vacate(t);
  else { closePost(t); if (p.post === 'leader') S.gyms[p.slot].leader = null; else if (p.post === 'e4') S.e4[p.slot] = null; else S.gyms[p.slot].trainers[p.k] = null; }
  const fate = k === 'run' ? comeback(t, was) : k === 'con' ? conLeave(t, was) : leaveUnhappy(t, was);
  const changes = [];
  if (p.post === 'gymtrainer') staffGym(p.slot);
  else if (!mine) { if (p.post === 'leader') { fillGym(p.slot, changes); staffGym(p.slot); } else rivalE4(p.slot); }
  const text = k === 'con' ? conText(t, was, fate) : k === 'pay' ? `${t.name} left ${was}, unpaid while the League was in the red.` : k === 'run' ? `${t.name} left ${was} for another run as a challenger.`
    : `${t.name} left ${was}, tired of waiting for ${p.post === 'gymtrainer' ? 'a gym of their own' : 'promotion'}${fate === 'retired' ? ', and retired' : fate === 'away' ? `, and took their grudge to the ${leagueName(lgOf(t))}` : ', and returns to the circuit holding a grudge'}.`;
  news(text, 'move', t.id); noteChange(text); changes.forEach(noteChange);
  if (mine && p.post !== 'gymtrainer') stopFor('vacancy', `${text} ${p.post === 'leader' ? `${dn(T(S.gyms[p.slot].leader))} is acting leader` : `${T(S.e4[p.slot]).name} stands in`} until you choose.`);
}
// off on another run as a challenger, sharper for it, and guaranteed COMEBACK_GUARD years on the circuit
function comeback(t, was) {
  for (const k of RK) t.r[k] = clamp(t.r[k] + ri(3, 6), 1, 99);
  t.pot = Math.max(t.pot, ovr(t));
  t.noRetireUntil = (S.season || 0) + 1 + COMEBACK_GUARD;
  t.comebacks = (t.comebacks || []).concat([{ season: S.season, post: was, seasons: t.wallStreak || 0, lg: S.lg || 0 }]);
  t.wallStreak = 0; t.wish = null; t.quit = null; t.letGoAt = S.turn;
  returnToCircuit(t, `left ${was} for another shot at the title`);
  return 'comeback';
}
// left over an ignored ambition: retired if over 45 with ten years behind them, otherwise back to the circuit with a
// grudge (with another League open, half the time to that League's circuit, where it may hire them)
function leaveUnhappy(t, was) {
  t.wish = null; t.letGoAt = S.turn;
  if (retiresOnLosingPost(t)) { retire(t, `after leaving ${was}`); return 'retired'; }
  returnToCircuit(t, `left ${was} unhappy`); t.grudge = S.season; t.grudgeLg = S.lg || 0;
  return grudgeAway(t);
}
// (0.34.0) the Champion leaves over their ambition. The seat is never empty: the strongest Elite Four member moves up
// at once (as when a Champion retires), and their seat waits for the player with a stand-in (rivals fill it). A
// Champion stepping down retires if they are CHAMP_STEP_AGE or older (or past the career rule), else takes that Elite
// Four seat themselves; one who wants a bigger League's seat goes to the circuit of the most prestigious other League;
// one who wants another run goes on it.
function champHeirSeat() { const ks = S.e4.map((id, i) => i).filter(i => T(S.e4[i]) && !T(S.e4[i]).acting), r = ks.length ? ruleHeirSeat(ks) : null; return r != null ? r : ks.sort((a, b) => ovr(T(S.e4[b])) - ovr(T(S.e4[a])))[0]; } // (0.43.0) Succession, Council
function champHeir() { const k = champHeirSeat(); return k != null ? `${T(S.e4[k]).name} (Elite Four #${k + 1})` : 'An Elite Four member'; }
function champQuits(t) {
  const k = t.quit ? t.quit.k : t.wish ? t.wish.k : 'step', was = postName(t), mine = playerLeague();
  t.quit = null;
  const seat = champHeirSeat(), at = seat != null ? seat : 0, m = T(S.e4[at]);
  const stays = k === 'step' && t.age < CHAMP_STEP_AGE && !retiresOnLosingPost(t);
  closePost(t); S.champion = null; t.role = 'exchamp';
  S.e4[at] = null; m.acting = false; installElite(m, 'champion');
  let fate, fill = '';
  if (stays) { installElite(t, 'e4', at); fate = `takes ${m.name}'s Elite Four seat (#${at + 1})`; }
  else {
    if (mine) { const a = actingE4(at); openVacancy('e4', at); fill = ` ${a.name} stands in at seat #${at + 1} until you choose a new member.`; }
    else { const nt = rivalE4(at); fill = ` ${nt.name} (${typeLabel(nt)}) fills Elite Four seat #${at + 1}.`; }
    if (k === 'run') { comeback(t, was); fate = 'is off on another run as a challenger'; }
    else if (k === 'con') fate = conLeave(t, was) === 'retired' ? 'retired' : 'returns to the badge circuit';
    else if (k === 'up') {
      t.wish = null; t.letGoAt = S.turn; returnToCircuit(t, `left ${was} for a bigger League`);
      const me = S.lg || 0, to = Array.from({ length: nLeagues() }, (_, i) => i).filter(i => i !== me && !(S.founding && i === ME())).sort((a, b) => prestOf(b) - prestOf(a))[0];
      if (to != null) { shiftLeague(t, to); fate = `heads for the ${leagueName(to)}'s circuit, after its seat`; } else fate = 'returns to the badge circuit';
    } else { t.wish = null; retire(t, `after stepping down as Champion of the ${S.lgName}`); fate = t.role === 'retired' ? 'retired' : 'returns to the badge circuit'; }
  }
  const text = `Champion ${t.name} ${k === 'step' ? 'stepped down' : k === 'con' ? 'left when their contract ran out' : 'left the seat'} and ${fate}. ${dn(m)} moves up from the Elite Four to become Champion.${fill}`;
  news(text, 'title', m.id); noteChange(text);
  if (mine) stopFor('vacancy', text);
  return text;
}
function grudgeAway(t) {
  if (nLeagues() < 2 || rand() >= GRUDGE_AWAY) return 'grudge';
  const from = homeLeague(t), to = pick(Array.from({ length: nLeagues() }, (_, i) => i).filter(i => i !== from));
  shiftLeague(t, to);
  return 'away';
}
// ---- refusing moves ----
// a poor record (two poor years in a row at a gym, or the Elite Four's worst record two years running): they would
// rather take a step down than be let go
function poorRecord(t) {
  const p = postOf(t); if (!p) return false;
  if (p.post === 'leader') { const g = S.gyms[p.slot]; return g.poorFor === t.id && (g.poor || 0) >= 2; }
  return p.post === 'e4' && (t.e4Poor || 0) >= 2;
}
// a move to a bigger kind of post, or to a later gym or higher seat, is up (it answers promotion); to a smaller kind of
// post (Elite Four to a gym, a gym to a gym trainer's place) is a step down; anything else is sideways
function moveKind(t, post, slot) {
  const p = postOf(t); if (!p) return null;
  const a = rankOf(p.post, p.slot), b = rankOf(post, slot);
  if (p.post === post) return b > a ? 'up' : 'side';
  return b > a ? 'up' : 'down';
}
// why member of staff t won't move to this post, or null: everyone takes a move up; a step down is refused unless
// their record is poor; a sideways move by someone who wants to stay put or wants another run
function refusal(t, post, slot) {
  if (!t || !STAFF_ROLES.includes(t.role) || t.acting) return null;
  const k = moveKind(t, post, slot);
  if (k === 'down' && promOn(t, 'nodemote', S.lg || 0)) return 'promised no step down'; // (0.53.0)
  if (!k || k === 'up' || poorRecord(t)) return null;
  if (k === 'down') return 'refuses a step down';
  const a = t.wish && t.wish.k;
  return a === 'stay' ? 'wants to stay put' : a === 'run' ? 'wants another run' : null;
}
// a swap needs both to agree: someone who wants to stay put (or another run) refuses any swap, and a step down is
// refused as above
function swapRefusal(A, B) {
  const pa = postOf(A), pb = postOf(B); if (!pa || !pb) return null;
  for (const [X, to] of [[A, pb], [B, pa]]) {
    if (poorRecord(X)) continue;
    const a = X.wish && X.wish.k;
    if (a === 'stay' || a === 'run') return `${X.name} ${a === 'stay' ? 'wants to stay put' : 'wants another run'}`;
    const r = refusal(X, to.post, to.slot); if (r) return `${X.name} ${r}`;
  }
  return null;
}
// ---- promotion from within ----
// the League's own staff who want promotion and would be moving up into this post, best first, at OVR min or better
function promoteWithin(post, slot, min) {
  if (playerLeague() || fixedStaff()) return null;
  return staffIds().map(T).filter(t => t && !t.acting && t.stepDown == null && t.wish && t.wish.k === 'up' && t.role !== 'champion' && moveKind(t, post, slot) === 'up' && ovr(t) >= min)
    .sort((a, b) => ovr(b) - ovr(a))[0] || null;
}
// a rival League moves its own member of staff up into a post, and fills the post they leave at once
function moveUpWithin(t, post, slot, changes) {
  const p = postOf(t), was = postName(t);
  closePost(t);
  if (p.post === 'gymtrainer') S.gyms[p.slot].trainers[p.k] = null;
  else if (p.post === 'leader') S.gyms[p.slot].leader = null;
  else if (p.post === 'e4') S.e4[p.slot] = null;
  installElite(t, post, slot);
  changes.push(`${dn(t)} was promoted from ${was} to ${post === 'leader' ? `${townName(slot)} Gym Leader (${typeLabel(t)})` : `Elite Four seat #${slot + 1}`}.`);
  news(changes[changes.length - 1], 'move', t.id);
  if (p.post === 'gymtrainer') staffGym(p.slot);
  else if (p.post === 'leader') { fillGym(p.slot, changes); staffGym(p.slot); }
  else rivalE4(p.slot);
  if (post === 'leader') staffGym(slot);
}
// the multi-year sim in the player's League: the best member of staff who wants promotion and would move up into
// vacancy v, if within PROMOTE_EDGE OVR of the best newcomer (and willing); the post they leave opens next
function promoteForVacancy(v) {
  if (v.incoming != null) return false;
  return inLeague(ME(), () => {
    const cs = vacancyCands(v);
    const ext = cs.find(c => ['circuit', 'retired', 'outsider'].includes(c.from) && !c.refuse);
    const own = cs.filter(c => ['gym', 'leader', 'e4'].includes(c.from) && !c.refuse && c.t.wish && c.t.wish.k === 'up' && moveKind(c.t, v.post, v.slot) === 'up' && c.t.stepDown == null)[0];
    if (!own || (ext && ovr(own.t) < ovr(ext.t) - PROMOTE_EDGE)) return false;
    return fillVacancy(v, own.t.id);
  });
}

