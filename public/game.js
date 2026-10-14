'use strict';
/* =====================================================================
   VOIDCRUDE — a retro asteroid drilling tycoon
   Drill the belt, pump the glowing crude, haul it, sell it, own the belt.
   ===================================================================== */

// ---------------------------------------------------------------- constants
const W = 640, H = 360;
const SURF = 100, UG_TOP = 104, CELL = 4, COLS = 160, ROWS = 59;
const UG_BOT = UG_TOP + ROWS * CELL; // 340
const PLOT_X0 = 56, PLOT_W = 88, NPLOTS = 6;
const CRUISE = 52;
const T_DIRT = 0, T_OIL = 1, T_GAS = 2, T_ROCK = 3, T_EMPTY = 4;
const UNITS_PER_CELL = 5;
const COST = { rig: 400, silo: 300, hauler: 250, scan: 60 };
const SAVE_KEY = 'voidcrude_save_v1';
const PREF_KEY = 'voidcrude_prefs_v1';
const META_KEY = 'voidcrude_legacy_v1';

const P = {
  black: '#0b0b14', navy: '#1a1c2c', plum: '#5d275d', red: '#b13e53', orange: '#ef7d57',
  yellow: '#ffcd75', lime: '#a7f070', green: '#38b764', teal: '#257179', dblue: '#29366f',
  blue: '#3b5dc9', sky: '#41a6f6', cyan: '#73eff7', white: '#f4f4f4', lgray: '#94b0c2',
  gray: '#566c86', dgray: '#333c57',
  crude: '#9b30d9', crudeD: '#5a1a85', crudeL: '#d77bff', crudeG: '#f3c6ff',
};

const SECTOR_NAMES = ['CERES DRIFT', 'KESSLER BELT', 'VESTA SHELF', 'PALLAS DEEP', 'HYGIEA RIFT',
  'PSYCHE FIELD', 'ERIS REACH', 'OORT VEIL', 'THE MAW'];
function sectorName(n) {
  const k = Math.floor((n - 1) / SECTOR_NAMES.length);
  return SECTOR_NAMES[(n - 1) % SECTOR_NAMES.length] + (k > 0 ? ' ' + (k + 1) : '');
}

// ---- permanent tech tree (bought with Research Data) ----
const BRANCHES = [
  { name: 'DRILLING', col: '#ef7d57' }, { name: 'EXTRACTION', col: '#d77bff' },
  { name: 'LOGISTICS', col: '#73eff7' }, { name: 'MARKETS', col: '#ffcd75' },
];
const TECH = [
  { id: 'bit1', b: 0, row: 0, name: 'PLASMA BIT', cost: 10, req: [], desc: '+35% DRILL SPEED' },
  { id: 'pipe1', b: 0, row: 1, name: 'NANOPIPE', cost: 20, req: ['bit1'], desc: '-30% PIPE COST' },
  { id: 'bit2', b: 0, row: 2, name: 'PLASMA BIT II', cost: 25, req: ['bit1'], desc: 'ANOTHER +35% DRILL SPEED' },
  { id: 'gas', b: 0, row: 3, name: 'GAS SIPHON', cost: 40, req: ['pipe1'], desc: 'GAS POCKETS PAY OUT INSTEAD OF BLOWING UP' },
  { id: 'laser1', b: 0, row: 4, name: 'LASER BORE', cost: 45, req: ['bit2'], desc: 'DRILL THROUGH ROCK AT 30% SPEED' },
  { id: 'laser2', b: 0, row: 5, name: 'LASER BORE II', cost: 80, req: ['laser1'], desc: 'DRILL THROUGH ROCK AT 75% SPEED' },
  { id: 'seismic', b: 0, row: 6, name: 'SEISMIC BIT', cost: 120, req: ['laser2', 'gas'], cap: true, desc: 'DRILLS REVEAL A WIDE AREA AROUND THEM AND RUN +50% FASTER' },
  { id: 'pump1', b: 1, row: 0, name: 'HYPER PUMPS', cost: 10, req: [], desc: '+30% PUMP RATE' },
  { id: 'tank1', b: 1, row: 1, name: 'RIG TANKS', cost: 20, req: ['pump1'], desc: '+25 RIG STORAGE' },
  { id: 'pump2', b: 1, row: 2, name: 'HYPER PUMPS II', cost: 25, req: ['pump1'], desc: 'ANOTHER +30% PUMP RATE' },
  { id: 'silo1', b: 1, row: 3, name: 'SILO NETWORK', cost: 35, req: ['tank1'], desc: '+100 SILO STORAGE AND DOUBLE SILO PIPE REACH' },
  { id: 'inject', b: 1, row: 4, name: 'PRESSURE INJECT', cost: 50, req: ['pump2'], desc: 'EVERY POCKET YIELDS +25% MORE CRUDE' },
  { id: 'core', b: 1, row: 5, name: 'DEEP CORE TAP', cost: 90, req: ['inject'], desc: 'POCKETS YIELD ANOTHER +25% MORE CRUDE' },
  { id: 'reson', b: 1, row: 6, name: 'VOID RESONATOR', cost: 120, req: ['core', 'silo1'], cap: true, desc: 'POCKETS YOU TAP SLOWLY REGENERATE CRUDE - EVEN DRY ONES' },
  { id: 'ion1', b: 2, row: 0, name: 'ION ENGINES', cost: 10, req: [], desc: '+20% HAULER SPEED' },
  { id: 'cargo1', b: 2, row: 1, name: 'CARGO PODS', cost: 20, req: ['ion1'], desc: '+10 HAULER CAPACITY' },
  { id: 'ion2', b: 2, row: 2, name: 'ION ENGINES II', cost: 25, req: ['ion1'], desc: 'ANOTHER +20% HAULER SPEED' },
  { id: 'auto', b: 2, row: 3, name: 'AUTOPILOT', cost: 45, req: ['cargo1'], desc: 'HAULERS LOOP: THEIR RIG -> BEST PRICED STATION -> BACK' },
  { id: 'cargo2', b: 2, row: 4, name: 'CARGO PODS II', cost: 40, req: ['cargo1'], desc: 'ANOTHER +10 HAULER CAPACITY' },
  { id: 'fleet', b: 2, row: 5, name: 'FLEET CHARTER', cost: 70, req: ['auto'], desc: 'START EVERY SECTOR WITH 2 FREE HAULERS' },
  { id: 'warp', b: 2, row: 6, name: 'WARP HAULERS', cost: 120, req: ['fleet', 'ion2'], cap: true, desc: 'HAULERS FLY, LOAD AND UNLOAD TWICE AS FAST' },
  { id: 'intel', b: 3, row: 0, name: 'MARKET INTEL', cost: 10, req: [], desc: '10-DAY PRICE FORECAST ON STATION PANELS' },
  { id: 'survey', b: 3, row: 1, name: 'LAND SURVEYOR', cost: 20, req: ['intel'], desc: 'PLOTS 20% CHEAPER AND SIGNS RATE THEIR CRUDE' },
  { id: 'broker1', b: 3, row: 2, name: 'BROKER', cost: 25, req: ['intel'], desc: '+8% SELL PRICE EVERYWHERE' },
  { id: 'scan1', b: 3, row: 3, name: 'SCANNER ARRAY', cost: 30, req: ['survey'], desc: '+30% SCAN RANGE AND SCANS COST HALF' },
  { id: 'negot', b: 3, row: 4, name: 'NEGOTIATOR', cost: 40, req: ['broker1'], desc: 'CONTRACT REWARDS +50%' },
  { id: 'broker2', b: 3, row: 5, name: 'BROKER II', cost: 70, req: ['negot'], desc: 'ANOTHER +8% SELL PRICE' },
  { id: 'maker', b: 3, row: 6, name: 'MARKET MAKER', cost: 120, req: ['broker2', 'scan1'], cap: true, desc: 'YOUR SALES BARELY DENT STATION PRICES' },
];
// ---- rock blaster (separate upgrade track) ----
const BLAST_MIN = 3, BLAST_MAX = 10;
function blasterCost(lvl) { return 8 + (lvl - BLAST_MIN) * 4; } // cost to go from lvl -> lvl+1
function blastRadius(lvl) { return lvl >= 9 ? 5 : lvl >= 6 ? 4 : 3; }

// ---- per-sector perk cards (offered on rank up) ----
const RARITY = [{ name: 'COMMON', col: '#94b0c2', w: 60 }, { name: 'RARE', col: '#41a6f6', w: 30 }, { name: 'EPIC', col: '#ffcd75', w: 10 }];
const PERKS = [
  { id: 'pump', name: 'OVERCLOCK', icon: '+', r: 0, desc: '+40% PUMP RATE THIS SECTOR' },
  { id: 'drill', name: 'TURBO BITS', icon: '>', r: 0, desc: '+60% DRILL SPEED THIS SECTOR' },
  { id: 'burn', name: 'AFTERBURNERS', icon: '>>', r: 0, desc: '+35% HAULER SPEED THIS SECTOR' },
  { id: 'cargo', name: 'BULK PODS', icon: '#', r: 0, desc: '+10 HAULER CAPACITY THIS SECTOR' },
  { id: 'pipe', name: 'PIPE SUBSIDY', icon: '/', r: 0, desc: 'PIPE COSTS HALVED THIS SECTOR' },
  { id: 'cash', name: 'INVESTOR', icon: '$', r: 0, instant: true, desc: 'A BACKER WIRES YOU CREDITS RIGHT NOW' },
  { id: 'hauler', name: 'SPARE HAULER', icon: 'H', r: 0, instant: true, desc: 'A FREE HAULER JOINS YOUR FLEET' },
  { id: 'blast', name: 'DEMOLITION CREW', icon: '*', r: 0, desc: '+2 ROCK BLASTER CHARGES THIS SECTOR' },
  { id: 'price', name: 'HYPE MACHINE', icon: '%', r: 1, desc: '+15% SELL PRICE THIS SECTOR' },
  { id: 'rig', name: 'PREFAB RIG', icon: 'R', r: 1, desc: 'YOUR NEXT RIG COSTS NOTHING' },
  { id: 'prospect', name: 'PROSPECTOR', icon: '?', r: 1, instant: true, desc: 'REVEALS THE 2 RICHEST HIDDEN POCKETS' },
  { id: 'sabotage', name: 'SABOTAGE', icon: 'X', r: 1, instant: true, desc: 'ALL RIVAL RIGS GO OFFLINE FOR 10 DAYS', ok: () => S.rigs.some(r => isRival(r.owner)) },
  { id: 'insure', name: 'INSURANCE', icon: '!', r: 1, once: true, desc: 'BLOWOUTS NO LONGER KNOCK RIGS OFFLINE' },
  { id: 'rd', name: 'GRANT PROPOSAL', icon: 'RD', r: 1, instant: true, desc: '+12 RESEARCH DATA' },
  { id: 'plot', name: 'LAND GRANT', icon: 'L', r: 2, instant: true, desc: 'CLAIM THE CHEAPEST FREE PLOT FOR NOTHING', ok: () => S.plots.some(p => !p.owner) },
  { id: 'time', name: 'OVERTIME', icon: 'T', r: 2, instant: true, desc: '+10 DAYS ON THE SECTOR CLOCK' },
  { id: 'jackpot', name: 'MOTHERLODE', icon: '!!', r: 2, instant: true, desc: 'A HUGE NEW POCKET FORMS UNDER YOUR LAND', ok: () => S.plots.some(p => p.owner === 'you') },
];

// ---- achievements (one-time RD rewards) ----
const ACH = [
  { id: 'strike', name: 'FIRST STRIKE', desc: 'TAP YOUR FIRST CRUDE POCKET', rd: 5 },
  { id: 'gusher', name: 'GUSHER', desc: 'SELL 500 UNITS IN ONE SECTOR', rd: 10 },
  { id: 'kingpin', name: 'KINGPIN', desc: 'SELL 1500 UNITS IN ONE SECTOR', rd: 25 },
  { id: 'fleet', name: 'FLEET ADMIRAL', desc: 'COMMAND 8 HAULERS AT ONCE', rd: 10 },
  { id: 'baron', name: 'LAND BARON', desc: 'OWN 4 PLOTS IN ONE SECTOR', rd: 15 },
  { id: 'job', name: 'CONTRACTOR', desc: 'COMPLETE A CONTRACT', rd: 5 },
  { id: 'jobs', name: 'RELIABLE SUPPLIER', desc: 'COMPLETE 10 CONTRACTS', rd: 20 },
  { id: 'rank5', name: 'RISING STAR', desc: 'REACH RANK 5 IN ONE SECTOR', rd: 10 },
  { id: 'rank10', name: 'TYCOON', desc: 'REACH RANK 10 IN ONE SECTOR', rd: 25 },
  { id: 'thief', name: 'CLAIM JUMPER', desc: 'DRAIN A POCKET A RIVAL WAS TAPPING', rd: 10 },
  { id: 'deep', name: 'DEEP DIVER', desc: 'TAP A POCKET IN THE DEEPEST LAYER', rd: 10 },
  { id: 'boom', name: 'FIREWORKS', desc: 'SURVIVE A BLOWOUT', rd: 5 },
  { id: 'demo', name: 'DEMOLITION EXPERT', desc: 'BLAST 100 ROCK CELLS IN ONE SECTOR', rd: 10 },
  { id: 'rich', name: 'HIGH ROLLER', desc: 'EARN $100,000 LIFETIME', rd: 20 },
  { id: 'shares', name: 'BOARD SEAT', desc: 'OWN 25 CONSORTIUM SHARES', rd: 15 },
  { id: 'capstone', name: 'VISIONARY', desc: 'RESEARCH ANY CAPSTONE TECH', rd: 20 },
];

// ---- playable tycoons: passive bonus + active ability on Q ----
const CHARACTERS = [
  { id: 'rusty', name: 'RUSTY VANCE', title: 'WILDCATTER', unlock: 0,
    look: { bg: '#5d275d', skin: '#c28569', hair: '#ef7d57', style: 'short', eye: '#1a1c2c', acc: 'beard', suit: '#b13e53', hat: '#ffcd75' },
    passive: '+25% DRILL SPEED AND PIPE COSTS 15% LESS',
    active: { name: 'GUSHER', desc: 'ALL YOUR RIGS PUMP 3X FASTER FOR 8 DAYS', cd: 40, dur: 8 } },
  { id: 'kade', name: 'DR. LENA KADE', title: 'GEOLOGIST', unlock: 0,
    look: { bg: '#257179', skin: '#e8b796', hair: '#333c57', style: 'long', eye: '#3b5dc9', acc: 'glasses', suit: '#f4f4f4' },
    passive: 'SCANS COST HALF AND REACH 40% FURTHER',
    active: { name: 'DEEP SONAR', desc: 'MAPS EVERYTHING UNDER ALL THE LAND YOU OWN', cd: 45, dur: 0 } },
  { id: 'mara', name: 'MARA OKONJO', title: 'COMMODITY TRADER', unlock: 0,
    look: { bg: '#29366f', skin: '#7a4a32', hair: '#1a1c2c', style: 'bun', eye: '#1a1c2c', acc: 'earring', suit: '#ffcd75' },
    passive: '+10% SELL PRICE AND CONTRACTS PAY 25% MORE',
    active: { name: 'CORNER MARKET', desc: 'BOTH STATIONS PAY +50% FOR 6 DAYS', cd: 50, dur: 6 } },
  { id: 'bolt', name: '"BOLT" REYES', title: 'ACE PILOT', unlock: 12,
    look: { bg: '#3b5dc9', skin: '#d39b6a', hair: '#566c86', style: 'mohawk', eye: '#1a1c2c', acc: 'goggles', suit: '#566c86' },
    passive: 'HAULERS 25% FASTER. A FREE HAULER EVERY SECTOR',
    active: { name: 'AFTERBURN', desc: 'HAULERS FLY 3X FASTER FOR 6 DAYS', cd: 35, dur: 6 } },
  { id: 'grane', name: 'VIKTOR GRANE', title: 'CORPORATE SPY', unlock: 18,
    look: { bg: '#1a1c2c', skin: '#e0c0a8', hair: '#94b0c2', style: 'slick', eye: '#73eff7', acc: 'patch', suit: '#333c57' },
    passive: 'BLACK MARKET 40% CHEAPER. RIVALS PUMP 15% SLOWER',
    active: { name: 'BLACKOUT', desc: 'EVERY RIVAL RIG GOES DARK FOR 8 DAYS', cd: 55, dur: 0 } },
  { id: 'iris', name: 'IRIS-9', title: 'ANDROID ENGINEER', unlock: 25,
    look: { bg: '#38b764', skin: '#94b0c2', hair: '#f4f4f4', style: 'helmet', eye: '#73eff7', acc: 'cyber', suit: '#566c86' },
    passive: '+3 BLASTER CHARGES. RIGS IMMUNE TO METEORS AND SABOTAGE',
    active: { name: 'OVERDRIVE', desc: 'REPAIRS ALL RIGS AND DRILLS 5X FASTER FOR 5 DAYS', cd: 40, dur: 5 } },
];

// ---- named rival corporations ----
const RIVALS = {
  syn: { name: 'THE SYNDICATE', short: 'SYNDICATE', boss: 'DON CASSIUS', trait: 'LAND GRABBER: BUYS PLOTS FAST', col: '#b13e53', dark: '#5d275d',
    look: { bg: '#5d275d', skin: '#c9a48a', hair: '#1a1c2c', style: 'slick', eye: '#b13e53', acc: 'monocle', suit: '#1a1c2c' },
    taunts: ['THIS ROCK BELONGS TO THE FAMILY.', 'NICE PLOT. SHAME ABOUT THE NEIGHBOURS.', 'YOUR CRUDE LOOKS BETTER IN MY TANKS.', 'GO HOME, PROSPECTOR.'] },
  kroll: { name: 'KROLL MINING', short: 'KROLL', boss: 'GRETA KROLL', trait: 'PRICE DUMPER: FLOODS STATIONS', col: '#ef7d57', dark: '#7a3a20',
    look: { bg: '#7a3a20', skin: '#e8b796', hair: '#ffcd75', style: 'short', eye: '#1a1c2c', acc: 'hardhat', suit: '#ef7d57' },
    taunts: ['VOLUME BEATS VALUE, DARLING.', 'I JUST FLOODED THE MARKET. ENJOY THE DISCOUNT.', 'KROLL MOVES MORE CRUDE BEFORE BREAKFAST.', 'PRICES ARE MERELY A SUGGESTION.'] },
  hex: { name: 'HEX CORP', short: 'HEX', boss: 'THE HEXAGON', trait: 'SABOTEUR: HITS YOUR RIGS', col: '#38b764', dark: '#1d4a32',
    look: { bg: '#a7f070', skin: '#1a1c2c', hair: '#333c57', style: 'helmet', eye: '#a7f070', acc: 'visor', suit: '#1d4a32' },
    taunts: ['OOPS. YOUR RIG HAD AN ACCIDENT.', 'WE ARE IN YOUR PIPES.', 'EFFICIENCY REQUIRES YOUR FAILURE.', 'HEX SEES ALL. HEX DRILLS ALL.'] },
};
const RIVAL_IDS = ['syn', 'kroll', 'hex'];

// ---- sector modifiers (picked between sectors) ----
const MODS = [
  { id: 'gas', name: 'GAS-RICH', desc: 'LOTS OF GAS. SIPHONED GAS PAYS 2X', rd: 0.1 },
  { id: 'rocky', name: 'ROCKY', desc: 'DENSE ROCK. +2 BLASTER CHARGES', rd: 0.15 },
  { id: 'bonanza', name: 'BONANZA', desc: '40% MORE CRUDE POCKETS', rd: -0.15 },
  { id: 'deep', name: 'DEEP FIELD', desc: 'POCKETS DEEPER BUT 50% RICHER', rd: 0.1 },
  { id: 'boom', name: 'BOOM MARKET', desc: 'PRICES +25% BUT SWING WILDLY', rd: 0 },
  { id: 'slump', name: 'SLUMP', desc: 'PRICES -20%. CONTRACTS PAY DOUBLE', rd: 0.2 },
  { id: 'quake', name: 'UNSTABLE', desc: 'QUAKES REVEAL GROUND BUT JAM DRILLS', rd: 0.15 },
  { id: 'storm', name: 'SOLAR STORMS', desc: 'FREQUENT FLARES SLOW HAULERS', rd: 0.25 },
  { id: 'cheap', name: 'LAND RUSH', desc: 'PLOTS 40% CHEAPER', rd: -0.1 },
  { id: 'long', name: 'LONG HAUL', desc: '+20 DAYS ON THE CLOCK', rd: -0.1 },
];

// ---- legacy (prestige) upgrades, persist across runs ----
const LEGACY = [
  { id: 'cap', name: 'TRUST FUND', desc: '+$750 STARTING CREDITS', max: 5, cost: l => 5 + l * 5 },
  { id: 'rd', name: 'OLD NOTEBOOKS', desc: '+8 STARTING RESEARCH DATA', max: 5, cost: l => 5 + l * 5 },
  { id: 'crew', name: 'VETERAN CREWS', desc: '+6% PUMP AND DRILL SPEED', max: 5, cost: l => 8 + l * 6 },
  { id: 'savvy', name: 'MARKET SAVVY', desc: '+3% SELL PRICE', max: 5, cost: l => 8 + l * 6 },
  { id: 'hard', name: 'POISON PILL', desc: 'RIVALS BUY 8% FEWER SHARES', max: 3, cost: l => 12 + l * 8 },
  { id: 'luck', name: 'LUCKY STAR', desc: 'BETTER ODDS OF RARE AND EPIC PERK CARDS', max: 3, cost: l => 10 + l * 8 },
];

// ---- black market (in-sector dirty tricks) ----
const BLACK_MARKET = [
  { id: 'sab', name: 'SABOTAGE CREW', desc: "KNOCK A RIVAL'S RIGS OFFLINE FOR 7 DAYS", base: 1200, target: 'rival' },
  { id: 'bribe', name: 'BRIBE THE REGISTRY', desc: 'RIVALS CANNOT BUY LAND FOR 25 DAYS', base: 900 },
  { id: 'rumor', name: 'PLANT A RUMOR', desc: 'A STATION PAYS +35% FOR 6 DAYS', base: 800, target: 'station' },
  { id: 'short', name: 'SHORT THEIR STOCK', desc: 'A RIVAL LOSES 2 CONSORTIUM SHARES (ONCE PER SECTOR)', base: 2500, target: 'owner' },
];

const HELP = [
  'THE BELT IS RICH WITH VOIDCRUDE. DRILL IT, HAUL IT, SELL IT.',
  '',
  '1. BUY A PLOT - CLICK A "BUY" SIGN ON THE SURFACE.',
  '2. SCAN [4] - REVEALS CRUDE, ROCK AND GAS BELOW THE SCANNER.',
  '3. BUILD A RIG [1] ON YOUR PLOT.',
  '4. CLICK THE RIG, THEN CLICK UNDERGROUND TO DRILL A PIPE.',
  '   DRAG FROM ANY PIPE TO BRANCH IT. PIPE COSTS CREDITS PER METER.',
  '5. HIT A PURPLE POCKET AND THE RIG PUMPS IT INTO ITS TANK.',
  '6. BUY HAULERS [3]. CLICK A HAULER, THEN A RIG TO LOAD,',
  '   THEN A STATION (HELIX OR NOVA) TO SELL. YOU CAN ALSO DRAG.',
  '7. SILOS [2] NEXT TO RIGS STORE THE OVERFLOW.',
  '8. ROCK IN THE WAY? ROCK BLASTER [5] CLEARS IT. LIMITED CHARGES.',
  '',
  'PRICES SWING. DUMPING LOTS AT ONE STATION DROPS ITS PRICE.',
  'RIVAL CORPS GRAB LAND, DRAIN SHARED POCKETS AND PLAY DIRTY.',
  "Q: YOUR TYCOON'S ABILITY.   6: BLACK MARKET DIRTY TRICKS.",
  'RANK UPS DEAL PERK CARDS. STATIONS POST CONTRACTS FOR CASH + RD.',
  'BETWEEN SECTORS: RD BUYS TECH, CREDITS BUY SHARES, THEN PICK A SECTOR.',
  'OWN 51 SHARES TO WIN. IF ANY RIVAL GETS 51, YOU LOSE.',
  'KEYS: 1-6 TOOLS  Q ABILITY  SPACE PAUSE  F SPEED  TAB HAULER  ESC',
];

// ---------------------------------------------------------------- canvas
const cv = document.getElementById('game');
const crt = document.getElementById('crt');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  const use = s >= 2 && s - Math.floor(s) < 0.5 ? Math.floor(s) : s;
  cv.style.width = Math.floor(W * use) + 'px';
  cv.style.height = Math.floor(H * use) + 'px';
  crt.style.width = cv.style.width; crt.style.height = cv.style.height;
  crt.style.backgroundSize = `100% ${Math.max(2, use)}px`;
}
addEventListener('resize', resize);

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
function inRect(p, x, y, w, h) { return p.x >= x && p.x < x + w && p.y >= y && p.y < y + h; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// ---------------------------------------------------------------- bitmap font (3x5)
const GLYPHS = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7],
  F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2],
  K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2],
  P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2],
  U: [5, 5, 5, 5, 7], V: [5, 5, 5, 2, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2],
  Z: [7, 1, 2, 4, 7],
  '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [6, 1, 2, 4, 7], '3': [6, 1, 2, 1, 6], '4': [5, 5, 7, 1, 1],
  '5': [7, 4, 6, 1, 6], '6': [3, 4, 7, 5, 7], '7': [7, 1, 2, 2, 2], '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 6],
  '.': [0, 0, 0, 0, 2], ',': [0, 0, 0, 2, 4], ':': [0, 2, 0, 2, 0], '!': [2, 2, 2, 0, 2], '?': [6, 1, 2, 0, 2],
  '-': [0, 0, 7, 0, 0], '+': [0, 2, 7, 2, 0], '/': [1, 1, 2, 4, 4], '$': [3, 6, 2, 3, 6], '%': [5, 1, 2, 4, 5],
  '(': [1, 2, 2, 2, 1], ')': [4, 2, 2, 2, 4], '<': [1, 2, 4, 2, 1], '>': [4, 2, 1, 2, 4], '=': [0, 7, 0, 7, 0],
  "'": [2, 2, 0, 0, 0], '"': [5, 5, 0, 0, 0], '#': [5, 7, 5, 7, 5], '*': [5, 2, 7, 2, 5], '[': [3, 2, 2, 2, 3],
  ']': [6, 2, 2, 2, 6], '&': [2, 5, 2, 5, 3], '^': [2, 5, 0, 0, 0], '_': [0, 0, 0, 0, 7], '|': [2, 2, 2, 2, 2], ';': [0, 2, 0, 2, 4],
};
const atlasCache = {};
function atlas(color) {
  let a = atlasCache[color];
  if (a) return a;
  a = mk(64 * 4, 5);
  const g = a.getContext('2d');
  g.fillStyle = color;
  for (let i = 0; i < 64; i++) {
    const gl = GLYPHS[String.fromCharCode(32 + i)];
    if (!gl) continue;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (gl[r] & (4 >> c)) g.fillRect(i * 4 + c, r, 1, 1);
  }
  return (atlasCache[color] = a);
}
function tw(s, scale = 1) { return Math.max(0, String(s).length * 4 * scale - scale); }
function txt(s, x, y, color = P.white, scale = 1, align = 'l') {
  s = String(s).toUpperCase();
  const w = tw(s, scale);
  if (align === 'c') x -= (w / 2) | 0; else if (align === 'r') x -= w;
  x |= 0; y |= 0;
  const a = atlas(color);
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i) - 32;
    if (code === 0) continue;
    if (code < 0 || code > 63) code = 31;
    ctx.drawImage(a, code * 4, 0, 3, 5, x + i * 4 * scale, y, 3 * scale, 5 * scale);
  }
  return w;
}
function txtS(s, x, y, color, scale = 1, align = 'l') {
  txt(s, x + scale, y + scale, P.black, scale, align);
  return txt(s, x, y, color, scale, align);
}

// ---------------------------------------------------------------- sound
const Sound = {
  ac: null, master: null, mg: null, nb: null, sfx: true, music: true, step: 0, next: 0, timer: null,
  loadPrefs() {
    try { const p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); if (p.sfx != null) this.sfx = p.sfx; if (p.music != null) this.music = p.music; if (p.crt === false) crt.classList.add('off'); } catch (e) { }
  },
  savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify({ sfx: this.sfx, music: this.music, crt: !crt.classList.contains('off') })); } catch (e) { } },
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain(); this.master.gain.value = 0.45; this.master.connect(this.ac.destination);
    this.mg = this.ac.createGain(); this.mg.gain.value = 0.3; this.mg.connect(this.master);
    const len = this.ac.sampleRate * 0.8;
    this.nb = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const d = this.nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.music) this.startMusic();
  },
  tone(f, dur, type = 'square', vol = 0.12, when = 0, slide = 0, dest = null) {
    if (!this.ac) return;
    const t = this.ac.currentTime + when;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.3, when = 0, freq = 900, dest = null) {
    if (!this.ac) return;
    const t = this.ac.currentTime + when;
    const s = this.ac.createBufferSource(); s.buffer = this.nb;
    const f = this.ac.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(50, t + dur);
    const g = this.ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.master);
    s.start(t); s.stop(t + dur);
  },
  play(n) {
    if (!this.sfx || !this.ac) return;
    switch (n) {
      case 'click': this.tone(880, 0.04, 'square', 0.06); break;
      case 'build': this.tone(220, 0.08, 'square', 0.1); this.tone(330, 0.1, 'square', 0.1, 0.07); this.noise(0.15, 0.1, 0, 2000); break;
      case 'buy': this.tone(523, 0.07, 'square', 0.1); this.tone(784, 0.1, 'square', 0.1, 0.06); break;
      case 'err': this.tone(160, 0.18, 'sawtooth', 0.08, 0, 90); break;
      case 'cash': this.tone(1046, 0.05, 'square', 0.07); this.tone(1568, 0.12, 'square', 0.07, 0.05); break;
      case 'strike': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'square', 0.09, i * 0.06)); break;
      case 'boom': this.noise(0.7, 0.5, 0, 1200); this.tone(110, 0.5, 'sawtooth', 0.15, 0, 30); break;
      case 'thud': this.noise(0.15, 0.25, 0, 400); this.tone(90, 0.15, 'square', 0.1, 0, 50); break;
      case 'alert': this.tone(660, 0.08, 'square', 0.07); this.tone(660, 0.08, 'square', 0.07, 0.14); break;
      case 'scan': this.tone(1200, 0.5, 'sine', 0.08, 0, 300); break;
      case 'fanfare': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'square', 0.08, i * 0.12)); break;
    }
  },
  startMusic() {
    if (!this.ac || this.timer) return;
    this.next = this.ac.currentTime + 0.1;
    this.timer = setInterval(() => {
      while (this.next < this.ac.currentTime + 0.3) { this.musicStep(this.step, this.next - this.ac.currentTime); this.step = (this.step + 1) % 128; this.next += 0.15; }
    }, 60);
  },
  stopMusic() { clearInterval(this.timer); this.timer = null; },
  musicStep(s, when) {
    const bar = (s >> 4) & 7, i = s & 15;
    const roots = [45, 45, 41, 41, 48, 48, 43, 44];
    const chords = [[0, 3, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 8]];
    const r = roots[bar], ch = chords[bar];
    const f = m => 440 * Math.pow(2, (m - 69) / 12);
    if (i % 4 === 0) this.tone(f(r - 12), 0.28, 'triangle', 0.22, when, 0, this.mg);
    if (i % 4 === 2) this.tone(f(r), 0.12, 'triangle', 0.12, when, 0, this.mg);
    const arp = ch[(i >> 0) % 3] + 12 + (i >= 8 ? 12 : 0);
    if (i % 2 === 0) this.tone(f(r + arp), 0.1, 'square', 0.035, when, 0, this.mg);
    if (i % 4 === 2) this.noise(0.04, 0.05, when, 6000, this.mg);
    if (bar % 2 === 1 && (i === 6 || i === 14)) this.tone(f(r + ch[2] + 24), 0.25, 'square', 0.03, when, 0, this.mg);
  },
};
function sfx(n) { Sound.play(n); }

// ---------------------------------------------------------------- state
let G = null;        // campaign (persisted)
let S = null;        // current sector
let screen = 'title';
let GT = 0;          // real time (s)
let BTN = [];
const mouse = { x: -99, y: -99, down: false, sx: 0, sy: 0, moved: false, consumed: false };

const has = id => !!(G && G.tech && G.tech[id]);
const pk = id => (S && S.perks && S.perks[id]) || 0;
const st = {
  drill: () => 16 * (1 + 0.35 * (has('bit1') + has('bit2'))) * (has('seismic') ? 1.5 : 1) * (1 + 0.6 * pk('drill'))
    * (isChar('rusty') ? 1.25 : 1) * (abilOn('iris') ? 5 : 1) * (1 + 0.06 * lv('crew')),
  rock: () => has('laser2') ? 0.75 : has('laser1') ? 0.3 : 0,
  pump: () => 3 * (1 + 0.3 * (has('pump1') + has('pump2'))) * (1 + 0.4 * pk('pump')) * (abilOn('rusty') ? 3 : 1) * (1 + 0.06 * lv('crew')),
  rivalPump: () => (2.2 + 0.3 * S.d) * (isChar('grane') ? 0.85 : 1),
  yield: () => 1 + 0.25 * (has('inject') + has('core')),
  rigCap: () => 40 + 25 * has('tank1'),
  siloCap: () => 150 + 100 * has('silo1'),
  siloReach: () => has('silo1') ? 128 : 64,
  hSpeed: () => 55 * (1 + 0.2 * (has('ion1') + has('ion2'))) * (1 + 0.35 * pk('burn')) * (has('warp') ? 2 : 1) * (S && S.flare > 0 ? 0.5 : 1)
    * (isChar('bolt') ? 1.25 : 1) * (abilOn('bolt') ? 3 : 1),
  hCap: () => 20 + 10 * (has('cargo1') + has('cargo2')) + 10 * pk('cargo'),
  hRate: () => has('warp') ? 2 : 1,
  scanRx: () => 32 * (has('scan1') ? 1.3 : 1) * (isChar('kade') ? 1.4 : 1),
  scanRy: () => 96 * (has('scan1') ? 1.3 : 1) * (isChar('kade') ? 1.4 : 1),
  scanCost: () => COST.scan * (has('scan1') ? 0.5 : 1) * (isChar('kade') ? 0.5 : 1),
  rigCost: () => pk('rig') > 0 ? 0 : COST.rig,
  pipe: () => (has('pipe1') ? 0.7 : 1) * Math.pow(0.5, pk('pipe')) * (isChar('rusty') ? 0.85 : 1),
  sellMul: () => 1 + 0.08 * (has('broker1') + has('broker2')) + 0.15 * pk('price') + (isChar('mara') ? 0.1 : 0) + 0.03 * lv('savvy'),
  satMul: () => has('maker') ? 0.25 : 1,
  jobMul: () => (has('negot') ? 1.5 : 1) * (isChar('mara') ? 1.25 : 1) * (hasMod('slump') ? 2 : 1),
  blastMax: () => (G.blaster || BLAST_MIN) + 2 * pk('blast') + (isChar('iris') ? 3 : 0) + (hasMod('rocky') ? 2 : 0),
  blastR: () => blastRadius(G.blaster || BLAST_MIN),
  bmMul: () => isChar('grane') ? 0.6 : 1,
};
function plotCost(p) { return Math.round(p.price * (has('survey') ? 0.8 : 1) * (hasMod('cheap') ? 0.6 : 1) / 10) * 10; }

// ---------------------------------------------------------------- characters, rivals, legacy
let META = loadMeta();
function loadMeta() {
  let m = null;
  try { m = JSON.parse(localStorage.getItem(META_KEY) || 'null'); } catch (e) { }
  m = m || {};
  m.legacy = m.legacy || 0; m.runs = m.runs || 0; m.wins = m.wins || 0; m.lv = m.lv || {}; m.chars = m.chars || {};
  for (const l of LEGACY) m.lv[l.id] = m.lv[l.id] || 0;
  for (const c of CHARACTERS) if (!c.unlock) m.chars[c.id] = true;
  return m;
}
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) { } }
function lv(id) { return META.lv[id] || 0; }
function isChar(id) { return !!G && G.char === id; }
function CHAR() { return CHARACTERS.find(c => c.id === (G && G.char)) || CHARACTERS[0]; }
function abilOn(id) { return isChar(id) && !!S && !!S.abil && S.abil.on > 0; }
function hasMod(id) { return !!(S && S.mods && S.mods.includes(id)); }
function isRival(o) { return !!RIVALS[o]; }
function rcol(o) { return RIVALS[o] ? RIVALS[o].col : P.red; }
function rivalTotal() { return RIVAL_IDS.reduce((a, id) => a + (G.rshares[id] || 0), 0); }
function topRival() { return RIVAL_IDS.reduce((a, b) => (G.rshares[b] || 0) > (G.rshares[a] || 0) ? b : a); }
function taunt(rid, text) { if (S) S.taunt = { rid, text: text || pick(RIVALS[rid].taunts), t: GT }; }

// legacy points for a finished run: sectors survived, shares held, and a big bonus for winning
function endRun(win) {
  if (G.legacyEarned != null) return;
  const pts = 5 + 3 * (G.sector - 1) + Math.floor(G.shares / 3) + (win ? 30 : 0);
  G.legacyEarned = pts;
  META.legacy += pts; META.runs++; if (win) META.wins++;
  saveMeta(); clearSave();
  screen = win ? 'victory' : 'defeat';
}
function buyLegacy(l) {
  const v = lv(l.id);
  if (v >= l.max || META.legacy < l.cost(v)) { sfx('err'); return; }
  META.legacy -= l.cost(v); META.lv[l.id]++;
  saveMeta(); sfx('buy');
}
function unlockChar(c) {
  if (META.chars[c.id] || META.legacy < c.unlock) { sfx('err'); return; }
  META.legacy -= c.unlock; META.chars[c.id] = true;
  saveMeta(); sfx('fanfare');
}

// ---- active ability ----
function useAbility() {
  const c = CHAR(), a = c.active;
  if (S.abil.cd > 0) { msg(a.name + ' RECHARGING - ' + Math.ceil(S.abil.cd) + ' DAYS', P.red); sfx('err'); return; }
  if (c.id === 'kade' && !S.plots.some(p => p.owner === 'you')) { msg('DEEP SONAR NEEDS LAND - BUY A PLOT FIRST', P.red); sfx('err'); return; }
  if (c.id === 'grane' && !S.rigs.some(r => isRival(r.owner))) { msg('NO RIVAL RIGS TO BLACK OUT YET', P.red); sfx('err'); return; }
  S.abil.cd = a.cd; S.abil.on = a.dur;
  S.shake = 5;
  sfx('strike');
  msg(c.name + ': ' + a.name + '!', P.yellow);
  switch (c.id) {
    case 'kade':
      for (const p of S.plots) if (p.owner === 'you') for (let r = 0; r < ROWS; r++) for (let cc = p.x0 / CELL; cc < p.x1 / CELL; cc++) reveal(cc, r);
      break;
    case 'mara': for (const s of S.stations) { s.mult = 1.5; s.multT = 6; } break;
    case 'grane': for (const r of S.rigs) if (isRival(r.owner)) r.offline = Math.max(r.offline, 8); break;
    case 'iris': for (const r of myRigs()) r.offline = 0; break;
  }
}

// ---- black market ----
function bmCost(item) {
  const uses = (S.bmUses[item.id] || 0);
  return Math.round(item.base * (1 + 0.2 * S.d) * Math.pow(1.5, uses) * st.bmMul() / 10) * 10;
}
function bmBuy(item, target) {
  if (item.id === 'short' && S.bmUses.short) { msg('ALREADY SHORTED A STOCK THIS SECTOR', P.red); sfx('err'); return; }
  const c = bmCost(item);
  if (!afford(c)) return;
  spend(c);
  S.bmUses[item.id] = (S.bmUses[item.id] || 0) + 1;
  sfx('boom');
  switch (item.id) {
    case 'sab': {
      let n = 0;
      for (const r of S.rigs) if (r.owner === target) { r.offline = Math.max(r.offline, 7); n++; explosion(r.x, SURF - 14, 14); }
      msg(n ? RIVALS[target].short + ' RIGS SABOTAGED (' + n + ')' : RIVALS[target].short + ' HAS NO RIGS - MONEY WASTED', n ? P.lime : P.orange);
      if (n) taunt(target, 'YOU WILL PAY FOR THAT.');
      break;
    }
    case 'bribe': S.bribe = 25; msg('THE LAND REGISTRY IS CLOSED TO RIVALS FOR 25 DAYS', P.lime); break;
    case 'rumor': target.mult = Math.max(target.mult, 1.35); target.multT = Math.max(target.multT, 6); msg('RUMORS SPREAD: ' + target.name + ' PAYS +35%', P.lime); break;
    case 'short': G.rshares[target] = Math.max(0, (G.rshares[target] || 0) - 2); msg(RIVALS[target].short + ' STOCK SHORTED: -2 SHARES', P.lime); taunt(target, 'WHO LEAKED OUR BOOKS?!'); break;
  }
  S.bm = false;
}

// ---- sector options (3 choices between sectors) ----
function sectorOptions() {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const rng = mulberry32((G.seed * 7 + G.sector * 977 + k * 131) >>> 0);
    const nRiv = G.sector >= 5 && rng() < 0.25 ? 3 : rng() < 0.45 + k * 0.1 ? 2 : 1;
    const pool = [...RIVAL_IDS];
    const rivals = [];
    while (rivals.length < nRiv) rivals.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    const mpool = [...MODS], mods = [];
    const nMod = rng() < 0.55 ? 2 : 1;
    while (mods.length < nMod) {
      const m = mpool.splice(Math.floor(rng() * mpool.length), 1)[0];
      if ((m.id === 'boom' && mods.includes('slump')) || (m.id === 'slump' && mods.includes('boom'))) continue;
      mods.push(m.id);
    }
    const rdMul = Math.max(0.75, 1 + mods.reduce((a, id) => a + MODS.find(m => m.id === id).rd, 0) + 0.3 * (nRiv - 1));
    out.push({ k, name: SECTOR_NAMES[(G.sector - 1 + k * 3) % SECTOR_NAMES.length], rivals, mods, rdMul: Math.round(rdMul * 100) / 100 });
  }
  return out;
}

// ---------------------------------------------------------------- portraits (16x16 pixel faces)
function drawPortrait(L, x, y, s = 1) {
  const px = (cx, cy, w, h, c) => rect(x + cx * s, y + cy * s, w * s, h * s, c);
  px(0, 0, 16, 16, L.bg);
  px(1, 14, 14, 2, L.suit); px(3, 13, 10, 1, L.suit);
  px(6, 11, 4, 2, L.skin);
  px(4, 3, 8, 9, L.skin); px(5, 12, 6, 1, L.skin);
  px(3, 6, 1, 2, L.skin); px(12, 6, 1, 2, L.skin);
  const H = L.hair;
  switch (L.style) {
    case 'short': px(4, 2, 8, 2, H); px(3, 3, 1, 3, H); px(12, 3, 1, 3, H); px(4, 4, 2, 1, H); break;
    case 'long': px(4, 2, 8, 2, H); px(3, 3, 1, 10, H); px(12, 3, 1, 10, H); px(2, 5, 1, 8, H); px(13, 5, 1, 8, H); break;
    case 'bun': px(4, 2, 8, 2, H); px(3, 3, 1, 3, H); px(12, 3, 1, 3, H); px(6, 0, 4, 2, H); break;
    case 'mohawk': px(7, 0, 2, 4, H); px(6, 2, 4, 1, H); break;
    case 'slick': px(4, 2, 8, 2, H); px(3, 3, 1, 2, H); px(12, 3, 1, 3, H); px(9, 4, 3, 1, H); break;
    case 'helmet': px(3, 1, 10, 4, H); px(2, 3, 1, 6, H); px(13, 3, 1, 6, H); px(4, 1, 8, 1, P.white); break;
  }
  if (L.hat) { px(4, 0, 8, 2, L.hat); px(2, 2, 12, 1, L.hat); px(4, 1, 8, 1, '#b07a3a'); }
  if (L.style !== 'helmet') { px(5, 6, 2, 1, '#1a1c2c'); px(9, 6, 2, 1, '#1a1c2c'); }
  px(6, 7, 1, 1, L.eye); px(9, 7, 1, 1, L.eye);
  px(7, 10, 2, 1, '#5d275d');
  switch (L.acc) {
    case 'beard': px(4, 9, 8, 3, H); px(5, 12, 6, 1, H); px(7, 10, 2, 1, '#5d275d'); break;
    case 'glasses': px(5, 6, 3, 3, P.lgray); px(8, 6, 3, 3, P.lgray); px(6, 7, 1, 1, L.eye); px(9, 7, 1, 1, L.eye); break;
    case 'earring': px(12, 8, 1, 2, P.yellow); break;
    case 'goggles': px(4, 4, 8, 2, '#333c57'); px(5, 4, 2, 2, P.sky); px(9, 4, 2, 2, P.sky); break;
    case 'patch': px(5, 6, 3, 3, '#1a1c2c'); px(3, 5, 10, 1, '#1a1c2c'); break;
    case 'cyber': px(9, 6, 3, 3, P.gray); px(9, 7, 1, 1, L.eye); px(4, 9, 1, 2, P.gray); break;
    case 'monocle': px(8, 6, 3, 3, P.yellow); px(9, 7, 1, 1, L.eye); px(11, 8, 1, 4, P.yellow); break;
    case 'hardhat': px(3, 1, 10, 3, P.yellow); px(2, 3, 12, 1, P.yellow); px(7, 1, 2, 1, P.orange); break;
    case 'visor': px(4, 6, 8, 2, L.eye); px(4, 6, 8, 1, P.white); break;
  }
}

function newGame(charId) {
  G = { seed: (Math.random() * 1e9) | 0, sector: 1, credits: 2000 + 750 * lv('cap'), tech: {}, rd: 8 * lv('rd'), ach: {}, blaster: BLAST_MIN,
    life: { contracts: 0 }, shares: 0, rshares: { syn: 0, kroll: 0, hex: 0 }, totalEarned: 0, report: null, char: charId || 'rusty' };
  genSector({ k: 0, name: SECTOR_NAMES[0], rivals: ['syn'], mods: [], rdMul: 1 });
  screen = 'play';
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { } }
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function loadGame() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (!s) return false;
    G = JSON.parse(s);
    if (!G.tech) { // migrate the old flat upgrade list into research data
      G.tech = {};
      G.rd = (G.rd || 0) + Object.values(G.upg || {}).reduce((a, b) => a + b, 0) * 15;
      delete G.upg;
    }
    if (!G.rshares) { G.rshares = { syn: G.rivalShares || 0, kroll: 0, hex: 0 }; delete G.rivalShares; }
    G.rd = G.rd || 0; G.ach = G.ach || {}; G.life = G.life || { contracts: 0 }; G.blaster = G.blaster || BLAST_MIN; G.char = G.char || 'rusty';
    return true;
  } catch (e) { return false; }
}

// ---------------------------------------------------------------- progression
function gainRD(n, x, y) {
  if (S && screen === 'play') { // sector research multiplier, keeping fractions so small gains still count
    const v = n * (S.rdMul || 1) + (S.rdFrac || 0);
    n = Math.floor(v); S.rdFrac = v - n;
    if (n <= 0) return;
  }
  G.rd += n;
  if (S && screen === 'play') { S.stats.rd += n; if (x != null) float(x, y, '+' + n + ' RD', P.cyan); }
}
function unlock(id) {
  if (!G || G.ach[id]) return;
  const a = ACH.find(a => a.id === id);
  G.ach[id] = true; G.rd += a.rd;
  if (S && screen === 'play') { S.stats.rd += a.rd; msg('ACHIEVEMENT: ' + a.name + '  +' + a.rd + ' RD', P.yellow); }
  sfx('fanfare');
}
function rankReq(n) { return 30 * n + 10 * n * n; }
function gainXP(n) {
  S.xp += n;
  while (S.xp >= rankReq(S.rank + 1)) {
    S.rank++; S.pending++;
    if (S.rank >= 5) unlock('rank5');
    if (S.rank >= 10) unlock('rank10');
  }
  if (S.pending > 0 && !S.choice) offerCards();
}
function offerCards() {
  const pool = PERKS.filter(p => (!p.ok || p.ok()) && !(p.once && pk(p.id)));
  const out = [];
  while (out.length < 3 && pool.length) {
    const wt = p => RARITY[p.r].w * (p.r === 1 ? 1 + 0.3 * lv('luck') : p.r === 2 ? 1 + 0.6 * lv('luck') : 1);
    const tot = pool.reduce((a, p) => a + wt(p), 0);
    let roll = Math.random() * tot, k = 0;
    while (roll >= wt(pool[k])) { roll -= wt(pool[k]); k++; }
    out.push(pool.splice(k, 1)[0]);
  }
  S.choice = out;
  S.tool = null; S.drag = null;
  sfx('strike');
}
function pickPerk(i) {
  const p = S.choice[i];
  S.choice = null; S.pending--;
  applyPerk(p);
  sfx('buy');
  if (S.pending > 0) offerCards();
}
function applyPerk(p) {
  if (!p.instant) S.perks[p.id] = (S.perks[p.id] || 0) + 1;
  switch (p.id) {
    case 'blast': S.blasts += 2; break;
    case 'cash': { const v = 800 + 300 * S.d; G.credits += v; msg('INVESTOR WIRED +$' + fmt(v), P.yellow); break; }
    case 'hauler': spawnHauler(); break;
    case 'rd': gainRD(12); break;
    case 'time': S.days += 10; msg('OVERTIME APPROVED: +10 DAYS', P.lime); break;
    case 'sabotage': for (const r of S.rigs) if (isRival(r.owner)) r.offline = Math.max(r.offline, 10); msg('ALL RIVAL RIGS SABOTAGED!', P.lime); break;
    case 'prospect': {
      const hidden = S.pockets.filter(p => p.amt > 0 && p.cells.some(i => !S.rev[i])).sort((a, b) => b.amt - a.amt).slice(0, 2);
      for (const q of hidden) { revealPocket(q); float(q.cx, q.cy - 8, 'FOUND!', P.crudeG); }
      msg(hidden.length ? 'PROSPECTOR MARKED ' + hidden.length + ' RICH POCKETS' : 'NOTHING LEFT TO FIND', P.crudeL);
      break;
    }
    case 'plot': {
      const p2 = S.plots.filter(p => !p.owner).sort((a, b) => a.price - b.price)[0];
      if (p2) { p2.owner = 'you'; msg('LAND GRANT: PLOT ' + (p2.i + 1) + ' IS YOURS', P.lime); checkBaron(); }
      break;
    }
    case 'jackpot': motherlode(); break;
  }
}
function motherlode() {
  const mine = S.plots.filter(p => p.owner === 'you');
  const plot = pick(mine);
  for (let tries = 0; tries < 40; tries++) {
    const cx = (plot.x0 + 10 + Math.random() * (PLOT_W - 20)) / CELL, cy = 22 + Math.random() * (ROWS - 30);
    const cells = blob(cx, cy, 8 + Math.random() * 3, 3.5 + Math.random(), Math.random);
    if (cells.length < 40) continue;
    const id = S.pockets.length;
    for (const i of cells) { S.grid[i] = T_OIL; S.pid[i] = id; paintCell(i); }
    cells.sort((a, b) => b - a);
    let sx = 0, sy = 0, top = ROWS;
    for (const i of cells) { const r = (i / COLS) | 0; sx += i % COLS; sy += r; if (r < top) top = r; }
    const cap = cells.length * UNITS_PER_CELL;
    const p = { id, cells, n: cells.length, cap, amt: cap, cx: (sx / cells.length) * CELL + 2, cy: UG_TOP + (sy / cells.length) * CELL + 2, top };
    S.pockets.push(p);
    revealPocket(p);
    float(p.cx, p.cy - 10, 'MOTHERLODE!', P.crudeG);
    msg('MOTHERLODE! ~' + cap + ' UNITS FORMED UNDER PLOT ' + (plot.i + 1), P.crudeG);
    S.shake = 6;
    return;
  }
  gainRD(15); msg('NO ROOM FOR A MOTHERLODE - TOOK 15 RD INSTEAD', P.cyan);
}
function checkBaron() { if (S.plots.filter(p => p.owner === 'you').length >= 4) unlock('baron'); }
function techState(t) {
  if (has(t.id)) return 'owned';
  if (!t.req.every(has)) return 'locked';
  return G.rd >= t.cost ? 'ready' : 'poor';
}
function buyTech(t) {
  if (techState(t) !== 'ready') { sfx('err'); return; }
  G.rd -= t.cost; G.tech[t.id] = true;
  sfx('buy');
  if (t.cap) unlock('capstone');
  save();
}
function buyBlaster() {
  const lvl = G.blaster;
  if (lvl >= BLAST_MAX || G.rd < blasterCost(lvl)) { sfx('err'); return; }
  G.rd -= blasterCost(lvl); G.blaster++;
  sfx('buy'); save();
}
function blast(x, y) {
  if (S.blasts <= 0) { msg('NO BLASTER CHARGES LEFT THIS SECTOR', P.red); sfx('err'); return; }
  if (y < UG_TOP + 2 || y >= UG_BOT) { msg('AIM THE BLASTER UNDERGROUND', P.red); sfx('err'); return; }
  S.blasts--;
  const R = st.blastR(), c0 = Math.floor(x / CELL), r0 = Math.floor((y - UG_TOP) / CELL);
  let rock = 0;
  const gases = new Set();
  for (let dr = -R - 1; dr <= R + 1; dr++) for (let dc = -R - 1; dc <= R + 1; dc++) {
    const c = c0 + dc, r = r0 + dr;
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
    const d = Math.hypot(dc, dr);
    if (d > R + 1.5) continue;
    reveal(c, r);
    if (d > R + 0.3) continue;
    const i = r * COLS + c;
    if (S.grid[i] === T_ROCK) { S.grid[i] = T_DIRT; paintCell(i); rock++; }
    else if (S.grid[i] === T_GAS) gases.add(S.pid[i]);
  }
  for (const g of gases) if (S.gases[g].live) releaseGas(S.gases[g]);
  explosion(x, y, 40);
  for (let k = 0; k < 16; k++) part(x, y, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 0.8, pick(['#626574', '#8b90a0', '#4a3530']), 40, 2);
  S.shake = 7;
  S.blasted += rock;
  if (S.blasted >= 100) unlock('demo');
  sfx('boom');
  msg(rock ? 'BOOM! ' + rock + ' ROCK CLEARED' + (gases.size ? ', GAS IGNITED' : '') : gases.size ? 'GAS POCKET IGNITED SAFELY' : 'BOOM! NO ROCK THERE', P.orange);
  if (S.blasts <= 0) S.tool = null;
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
function sharePrice() { return Math.round(400 * Math.pow(1.05, G.shares + rivalTotal()) / 10) * 10; }

// ---------------------------------------------------------------- sector generation
function blob(cx, cy, rx, ry, rng) {
  const p1 = rng() * 6.28, p2 = rng() * 6.28, a1 = 0.12 + rng() * 0.2, a2 = 0.06 + rng() * 0.1;
  const cells = [];
  for (let r = Math.floor(cy - ry - 2); r <= cy + ry + 2; r++) {
    for (let c = Math.floor(cx - rx - 2); c <= cx + rx + 2; c++) {
      if (r < 1 || r >= ROWS - 1 || c < 1 || c >= COLS - 1) continue;
      const dx = (c + 0.5 - cx) / rx, dy = (r + 0.5 - cy) / ry;
      const ang = Math.atan2(dy, dx);
      const lim = 1 + a1 * Math.sin(ang * 3 + p1) + a2 * Math.sin(ang * 5 + p2);
      if (dx * dx + dy * dy <= lim * lim) {
        const i = r * COLS + c;
        if (S.grid[i] === T_DIRT) cells.push(i);
      }
    }
  }
  return cells;
}
function nearType(i, t) {
  const c = i % COLS, r = (i / COLS) | 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const cc = c + dc, rr = r + dr;
    if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) continue;
    if (S.grid[rr * COLS + cc] === t) return true;
  }
  return false;
}
function mkStation(name, x, base, rng) {
  const s = { kind: 'station', name, x, base: base * (0.9 + rng() * 0.25), p1: 28 + rng() * 24, p2: 8 + rng() * 6,
    f1: rng() * 6.28, f2: rng() * 6.28, sat: 1, mult: 1, multT: 0, closed: 0, hist: [], job: null, nextJob: 5 + rng() * 8 };
  for (let k = -24; k <= 0; k++) s.hist.push(rawPrice(s, k));
  return s;
}
function rawPrice(s, day) { const a = s.amp || 1; return s.base * (1 + 0.3 * a * Math.sin(day / s.p1 * 6.283 + s.f1) + 0.12 * a * Math.sin(day / s.p2 * 6.283 + s.f2)); }
function price(s) { return Math.max(1, rawPrice(s, S.day) * s.sat * s.mult * st.sellMul()); }

// ---------------------------------------------------------------- contracts
function postJob(s) {
  const units = Math.round((60 + Math.random() * 90) * (1 + 0.2 * S.d) / 10) * 10;
  const boost = st.jobMul();
  s.job = { units, done: 0, deadline: Math.floor(S.day) + 18 + Math.floor(Math.random() * 12),
    cred: Math.round(units * s.base * 0.5 * boost / 10) * 10, rd: Math.round((5 + units / 25) * boost) };
  msg(s.name + ' POSTED A CONTRACT: ' + units + 'U IN ' + (s.job.deadline - Math.floor(S.day)) + ' DAYS', P.cyan);
  sfx('alert');
}
function jobDaily(s, d) {
  if (s.job && d > s.job.deadline) { msg(s.name + ' CONTRACT EXPIRED', P.red); s.job = null; s.nextJob = d + 6 + Math.random() * 6; }
  if (!s.job && d >= s.nextJob && d < S.days - 12) postJob(s);
}
function jobDeliver(s, u) {
  const j = s.job;
  if (!j) return;
  j.done += u;
  if (j.done < j.units) return;
  G.credits += j.cred; G.totalEarned += j.cred; S.stats.revenue += j.cred;
  gainRD(j.rd, s.x, SURF - 50);
  float(s.x, SURF - 58, '+$' + fmt(j.cred), P.yellow);
  msg('CONTRACT COMPLETE AT ' + s.name + '! +$' + fmt(j.cred) + ' +' + j.rd + ' RD', P.lime);
  sfx('fanfare');
  s.job = null; s.nextJob = S.day + 5 + Math.random() * 6;
  S.stats.jobs++; G.life.contracts++;
  unlock('job'); if (G.life.contracts >= 10) unlock('jobs');
  gainXP(40);
}

function genSector(opt) {
  const d = G.sector - 1;
  const rng = mulberry32((G.seed ^ Math.imul(G.sector * 3 + opt.k, 2654435761)) >>> 0);
  const mods = opt.mods;
  const N = COLS * ROWS;
  S = {
    d, rng, t: 0, day: 0, lastDay: 0, dayLen: 1.5, days: 120, speed: 1, paused: false, help: false, shake: 0,
    grid: new Uint8Array(N), pid: new Int16Array(N).fill(-1), rev: new Uint8Array(N),
    pockets: [], gases: [], plots: [], rigs: [], silos: [], haulers: [], scans: [], segs: [],
    parts: [], floats: [], msgs: [], sel: null, tool: null, drag: null, nid: 1,
    stats: { revenue: 0, spent: 0, sold: 0, gas: 0, rd: 0, jobs: 0 },
    perks: {}, xp: 0, rank: 0, pending: 0, choice: null, rdAcc: 0, blasts: 0, blasted: 0,
    mods, rivals: opt.rivals, rdMul: opt.rdMul, rdFrac: 0, rv: {}, taunt: null, bm: false, bmUses: {}, bribe: 0,
    abil: { cd: 0, on: 0 }, jam: 0, nextQuake: 10 + rng() * 6,
    nextEvent: 16 + rng() * 10, flare: 0, name: opt.name + (G.sector > SECTOR_NAMES.length ? ' ' + (Math.floor((G.sector - 1) / SECTOR_NAMES.length) + 1) : ''), stations: [], twinkles: [],
  };
  for (const id of opt.rivals) S.rv[id] = { pumped: 0, nextBuy: (d === 0 ? 14 : 8) + rng() * 10, queue: [], nextTrick: 14 + rng() * 10 };
  if (mods.includes('long')) S.days += 20;
  // crude pockets
  const nP = Math.round((10 + Math.floor(rng() * 4) + Math.min(d, 3)) * (mods.includes('bonanza') ? 1.4 : 1));
  const minRow = Math.min(5 + d * 2, 20) + (mods.includes('deep') ? 10 : 0);
  for (let tries = 0; tries < 300 && S.pockets.length < nP; tries++) {
    const rx = 3 + rng() * 6 + (rng() < 0.25 ? 3 : 0), ry = 1.8 + rng() * 3;
    const cx = 6 + rng() * (COLS - 12);
    const cy = minRow + ry + rng() * Math.max(1, ROWS - minRow - ry * 2 - 2);
    const cells = blob(cx, cy, rx, ry, rng);
    if (cells.length < 10) continue;
    if (cells.some(i => nearType(i, T_OIL))) continue;
    const id = S.pockets.length;
    for (const i of cells) { S.grid[i] = T_OIL; S.pid[i] = id; }
    cells.sort((a, b) => b - a); // bottom rows first
    let sx = 0, sy = 0, top = ROWS;
    for (const i of cells) { const r = (i / COLS) | 0; sx += i % COLS; sy += r; if (r < top) top = r; }
    const cap = Math.round(cells.length * UNITS_PER_CELL * (mods.includes('deep') ? 1.5 : 1));
    S.pockets.push({ id, cells, n: cells.length, cap, amt: cap, cx: (sx / cells.length) * CELL + 2, cy: UG_TOP + (sy / cells.length) * CELL + 2, top });
  }
  // rock caps over some pockets
  for (const p of S.pockets) {
    if (rng() < 0.4 + d * 0.05) {
      const cells = blob(p.cx / CELL, p.top - 1.3, Math.sqrt(p.n) * 0.9 + 1, 1 + rng() * 1.3, rng);
      for (const i of cells) S.grid[i] = T_ROCK;
    }
  }
  // gas pockets
  const nG = 3 + Math.min(d, 5) + (mods.includes('gas') ? 5 : 0);
  for (let tries = 0; tries < 120 && S.gases.length < nG; tries++) {
    const cells = blob(6 + rng() * (COLS - 12), 6 + rng() * (ROWS - 10), 2 + rng() * 2.5, 1.2 + rng() * 1.3, rng);
    if (cells.length < 5 || cells.some(i => nearType(i, T_OIL))) continue;
    const id = S.gases.length;
    for (const i of cells) { S.grid[i] = T_GAS; S.pid[i] = id; }
    S.gases.push({ id, cells, live: true });
  }
  // free rocks
  const nR = 10 + Math.min(d * 2, 14) + (mods.includes('rocky') ? 12 : 0);
  for (let k = 0; k < nR; k++) {
    const cells = blob(rng() * COLS, 3 + rng() * (ROWS - 4), 2 + rng() * 8, 1 + rng() * 2.5, rng);
    for (const i of cells) S.grid[i] = T_ROCK;
  }
  // plots
  for (let k = 0; k < NPLOTS; k++) {
    const x0 = PLOT_X0 + k * PLOT_W, x1 = x0 + PLOT_W;
    let oil = 0;
    for (let r = 0; r < ROWS; r++) for (let c = x0 / CELL; c < x1 / CELL; c++) if (S.grid[r * COLS + c] === T_OIL) oil++;
    const price = Math.round((220 + oil * 0.9 + rng() * 220) * (1 + 0.15 * d) / 10) * 10;
    S.plots.push({ i: k, x0, x1, owner: null, price, oil });
  }
  if (d > 0) {
    for (const id of opt.rivals) {
      const free = S.plots.filter(p => !p.owner);
      const p = free[Math.floor(rng() * free.length)];
      p.owner = id;
      S.rv[id].queue.push({ day: 1, plot: p.i }, { day: 9, plot: p.i });
    }
  }
  const base = (11 + d * 0.9) * (mods.includes('boom') ? 1.25 : mods.includes('slump') ? 0.8 : 1);
  S.stations = [mkStation('HELIX', 28, base, rng), mkStation('NOVA', 612, base, rng)];
  if (mods.includes('boom')) for (const s of S.stations) s.amp = 1.6;
  S.blasts = st.blastMax();
  buildDirt(); buildFog(); buildSky();
  if (has('fleet')) { spawnHauler(); spawnHauler(); }
  if (isChar('bolt')) spawnHauler();
  S.sel = null;
  for (let k = 0; k < 24; k++) S.twinkles.push({ x: (Math.random() * W) | 0, y: 14 + ((Math.random() * 60) | 0), f: 0.3 + Math.random(), p: Math.random() });
  msg('SECTOR ' + G.sector + ': ' + S.name + ' - ' + S.days + ' DAYS ON THE CLOCK', P.cyan);
  if (G.sector > 1 || opt.rivals.length) taunt(opt.rivals[0]);
}

// ---------------------------------------------------------------- textures
const STRATA = [[86, 60, 52], [74, 53, 48], [64, 45, 44], [54, 38, 41], [44, 31, 37], [36, 26, 33]];
function buildDirt() {
  const w = COLS * CELL, h = ROWS * CELL;
  S.dirtC = mk(w, h); S.dirtX = S.dirtC.getContext('2d');
  S.dirtImg = S.dirtX.createImageData(w, h);
  const rng = mulberry32(G.seed + G.sector * 17);
  S.noise = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) S.noise[k] = rng();
  for (let i = 0; i < COLS * ROWS; i++) paintCell(i, false);
  S.dirtX.putImageData(S.dirtImg, 0, 0);
}
function paintCell(i, flush = true) {
  const c = i % COLS, r = (i / COLS) | 0, t = S.grid[i];
  const img = S.dirtImg.data, w = COLS * CELL;
  for (let py = 0; py < 4; py++) for (let px = 0; px < 4; px++) {
    const X = c * 4 + px, Y = r * 4 + py, k = Y * w + X, n = S.noise[k];
    let col;
    if (t === T_DIRT) {
      const f = (Y + Math.sin(X * 0.04 + G.sector) * 6 + Math.sin(X * 0.013) * 10) / (ROWS * 4) * STRATA.length;
      const band = clamp(Math.floor(f + (BAYER[(Y & 3) * 4 + (X & 3)] / 16 - 0.5) * 0.6), 0, STRATA.length - 1);
      const b = STRATA[band], v = n < 0.07 ? -14 : n > 0.95 ? 16 : 0;
      col = [b[0] + v, b[1] + v, b[2] + v];
    } else if (t === T_ROCK) {
      const above = r > 0 && S.grid[i - COLS] !== T_ROCK;
      col = (above && py === 0) ? [150, 156, 172] : n < 0.15 ? [70, 72, 86] : n > 0.9 ? [128, 132, 148] : [98, 101, 118];
    } else if (t === T_GAS) {
      col = n > 0.88 ? [115, 239, 247] : n > 0.6 ? [60, 150, 165] : [37, 113, 121];
    } else {
      col = n > 0.94 ? [42, 22, 56] : [18, 10, 24];
    }
    const o = k * 4;
    img[o] = col[0]; img[o + 1] = col[1]; img[o + 2] = col[2]; img[o + 3] = 255;
  }
  if (flush) S.dirtX.putImageData(S.dirtImg, 0, 0, c * 4, r * 4, 4, 4);
}
function buildFog() {
  const w = COLS * CELL, h = ROWS * CELL;
  S.fogC = mk(w, h); S.fogX = S.fogC.getContext('2d');
  const img = S.fogX.createImageData(w, h);
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
    const o = (Y * w + X) * 4;
    let v = ((X + Y) & 1) ? 16 : 11;
    if (S.noise[Y * w + X] > 0.985) v = 30;
    img.data[o] = v + 2; img.data[o + 1] = v - 2; img.data[o + 2] = v + 10; img.data[o + 3] = 255;
  }
  S.fogX.putImageData(img, 0, 0);
}
function makePlanet(r) {
  const c = mk(r * 2 + 1, r * 2 + 1), g = c.getContext('2d'), img = g.createImageData(c.width, c.height);
  const cols = [[239, 125, 87], [177, 62, 83], [255, 205, 117], [60, 30, 70]];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const nx = (x - r) / r, ny = (y - r) / r, d = nx * nx + ny * ny;
    if (d > 1) continue;
    const nz = Math.sqrt(1 - d);
    const b = Math.sin(ny * 14 + Math.sin(nx * 4) * 0.7);
    let col = b > 0.5 ? cols[2] : b > -0.2 ? cols[0] : cols[1];
    const l = -nx * 0.5 - ny * 0.4 + nz * 0.7 + (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.25;
    if (l < 0.15) col = cols[3]; else if (l < 0.35) col = col.map(v => (v * 0.65) | 0); else if (l > 0.95) col = col.map(v => Math.min(255, v + 30));
    const o = (y * c.width + x) * 4;
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
let PLANET = null;
function buildSky() {
  const h = UG_TOP;
  S.skyC = mk(W, h);
  const g = S.skyC.getContext('2d');
  const img = g.createImageData(W, h);
  const sky = ['#04040c', '#0a0818', '#120c24', '#1d1232'].map(rgb);
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
    const lv = clamp(Math.floor((y / SURF) * 3 + BAYER[(y & 3) * 4 + (x & 3)] / 16), 0, 3);
    const c = sky[lv], o = (y * W + x) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const rng = mulberry32(G.seed + G.sector * 31);
  for (let k = 0; k < 170; k++) {
    g.fillStyle = pick2(rng, ['#566c86', '#94b0c2', '#f4f4f4', '#73eff7', '#ffcd75']);
    g.fillRect((rng() * W) | 0, (rng() * 86) | 0, 1, 1);
  }
  if (!PLANET) PLANET = makePlanet(26);
  g.drawImage(PLANET, 400 + ((rng() * 80) | 0), 18);
  g.fillStyle = '#94b0c2'; g.fillRect(150 + ((rng() * 60) | 0), 30, 3, 3);
  // ridges
  const ridge = (base, amp, col, f) => {
    g.fillStyle = col;
    for (let x = 0; x < W; x++) {
      const y = base - Math.abs(Math.sin(x * f + G.sector) * amp + Math.sin(x * f * 3.1) * amp * 0.4);
      g.fillRect(x, y | 0, 1, SURF - (y | 0));
    }
  };
  ridge(92, 10, '#1d1430', 0.021);
  ridge(97, 6, '#2a1d38', 0.05);
  // ground crust
  for (let x = 0; x < W; x++) {
    g.fillStyle = '#8a6352'; g.fillRect(x, SURF, 1, 1);
    g.fillStyle = '#6b4a3f'; g.fillRect(x, SURF + 1, 1, 1);
    g.fillStyle = ((x * 7) % 5 === 0) ? '#4a3530' : '#5b4038'; g.fillRect(x, SURF + 2, 1, 2);
  }
}
function pick2(rng, a) { return a[Math.floor(rng() * a.length)]; }

// ---------------------------------------------------------------- world helpers
function cellIndexAt(x, y) {
  const c = Math.floor(x / CELL), r = Math.floor((y - UG_TOP) / CELL);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return -1;
  return r * COLS + c;
}
function reveal(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
  const i = r * COLS + c;
  if (S.rev[i]) return;
  S.rev[i] = 1;
  S.fogX.clearRect(c * 4, r * 4, 4, 4);
}
function revealAround(x, y, rad) {
  const c0 = Math.floor(x / CELL), r0 = Math.floor((y - UG_TOP) / CELL);
  for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) reveal(c0 + dc, r0 + dr);
}
function revealPocket(p) { for (const i of p.cells) reveal(i % COLS, (i / COLS) | 0); }
function plotAt(x) { return S.plots.find(p => x >= p.x0 && x < p.x1); }
function myRigs() { return S.rigs.filter(r => r.owner === 'you'); }
function msg(text, color = P.white) { S.msgs.unshift({ text, color, t: GT }); if (S.msgs.length > 4) S.msgs.pop(); }
function float(x, y, text, color) { S.floats.push({ x, y, text, color, life: 1.8 }); }
function part(x, y, vx, vy, life, color, g = 0, size = 1) { if (S.parts.length < 700) S.parts.push({ x, y, vx, vy, life, color, g, size }); }
function explosion(x, y, n = 26) {
  for (let k = 0; k < n; k++) part(x, y, (Math.random() - 0.5) * 90, -Math.random() * 70 - 10, 0.5 + Math.random() * 0.7, pick([P.yellow, P.orange, P.red, P.white]), 70, Math.random() < 0.3 ? 2 : 1);
}
function dust(x, y) { for (let k = 0; k < 12; k++) part(x, y, (Math.random() - 0.5) * 40, -Math.random() * 20, 0.6, pick(['#8a6352', '#6b4a3f', P.lgray]), 30); }
function spend(v) { G.credits -= v; S.stats.spent += v; }
function afford(v) { if (G.credits >= v) return true; msg('NOT ENOUGH CREDITS', P.red); sfx('err'); return false; }

// ---------------------------------------------------------------- pipes
function activeSeg(r) {
  for (const id of r.segs) { const s = S.segs[id]; if (s.status === 'queued' || s.status === 'drill') return s; }
  return null;
}
function nearestPoint(r, px, py) {
  let best = { x: r.x, y: SURF + 1, seg: -1, t: 0, d: Math.hypot(px - r.x, py - SURF - 1) };
  for (const id of r.segs) {
    const s = S.segs[id];
    if (s.status === 'gone') continue;
    const L = (s.status === 'queued' || s.status === 'drill') ? s.len : s.prog;
    const t = clamp((px - s.x1) * s.ux + (py - s.y1) * s.uy, 0, L);
    const x = s.x1 + s.ux * t, y = s.y1 + s.uy * t, d = Math.hypot(px - x, py - y);
    if (d < best.d) best = { x, y, seg: id, t, d };
  }
  return best;
}
function orderDrill(r, start, tx, ty) {
  tx = clamp(tx, 1, W - 2); ty = clamp(ty, UG_TOP + 2, UG_BOT - 2);
  const len = Math.hypot(tx - start.x, ty - start.y);
  if (len < 4) return false;
  if (r.owner === 'you' && G.credits <= 1) { afford(1e9); return false; }
  const s = { id: S.segs.length, rig: r.id, owner: r.owner, x1: start.x, y1: start.y,
    ux: (tx - start.x) / len, uy: (ty - start.y) / len, len, prog: 0, status: 'queued', parent: start.seg, tPar: start.t };
  S.segs.push(s); r.segs.push(s.id);
  if (r.owner === 'you') sfx('click');
  return true;
}
function stopSeg(s, r, why) {
  s.status = 'stop'; s.len = s.prog;
  if (r.owner === 'you') {
    if (why === 'ROCK') { msg(S.blasts > 0 ? 'DRILL HIT SOLID ROCK! BLAST IT [5] OR STEER AROUND' : 'DRILL HIT SOLID ROCK! (LASER BORE TECH CUTS ROCK)', P.orange); sfx('thud'); }
    else msg('DRILL REACHED THE LIMIT', P.lgray);
  }
}
function connect(r, p) {
  if (r.pockets.has(p.id)) return;
  r.pockets.add(p.id);
  const mine = r.owner === 'you';
  const shared = S.rigs.some(o => o !== r && o.owner !== r.owner && o.pockets.has(p.id));
  if (mine) {
    revealPocket(p);
    if (p.amt > 0) {
      msg('STRUCK VOIDCRUDE! ~' + Math.round(p.amt) + ' UNITS' + (shared ? ' - A RIVAL IS TAPPING IT TOO!' : ''), shared ? P.orange : P.crudeL);
      float(p.cx, p.cy - 10, 'STRIKE!', P.crudeG);
      sfx('strike');
      if (!p.mineTapped) {
        p.mineTapped = true;
        gainRD(3, p.cx, p.cy - 2);
        unlock('strike');
        if (p.top >= ROWS - 16) unlock('deep');
        gainXP(15);
      }
    } else msg('THIS POCKET IS DRY', P.lgray);
  } else if (shared && p.amt > 0) { msg(RIVALS[r.owner].short + ' IS DRAINING ONE OF YOUR POCKETS!', rcol(r.owner)); sfx('alert'); taunt(r.owner, 'THANKS FOR FINDING THIS ONE FOR US.'); }
}
function releaseGas(g) {
  g.live = false;
  for (const i of g.cells) { S.grid[i] = T_EMPTY; reveal(i % COLS, (i / COLS) | 0); paintCell(i); }
}
function hitGas(s, r, ci, x, y) {
  const g = S.gases[S.pid[ci]];
  if (!g || !g.live) return;
  releaseGas(g);
  const mine = r.owner === 'you';
  for (let k = 0; k < 20; k++) part(r.x + (Math.random() - 0.5) * 6, SURF - 2, (Math.random() - 0.5) * 20, -30 - Math.random() * 40, 1.2, pick([P.cyan, '#3c96a5', P.white]), -5);
  if (mine && has('gas')) {
    const v = g.cells.length * 14 * (hasMod('gas') ? 2 : 1);
    G.credits += v; G.totalEarned += v; S.stats.gas += v;
    float(x, y - 6, '+$' + v + ' GAS', P.cyan);
    msg('GAS POCKET SIPHONED +$' + v, P.cyan);
    sfx('cash');
  } else {
    s.status = 'stop'; s.len = s.prog;
    if (!(mine && pk('insure'))) r.offline = 5;
    explosion(x, y); explosion(r.x, SURF - 12, 18);
    if (mine) { msg(pk('insure') ? 'BLOWOUT! INSURANCE KEPT THE RIG RUNNING' : 'BLOWOUT! GAS POCKET RUPTURED - RIG OFFLINE 5 DAYS', P.red); sfx('boom'); S.shake = 8; unlock('boom'); }
  }
}
function updateDrill(r, dt) {
  if (r.offline > 0 || (S.jam > 0 && r.owner === 'you')) { r.drilling = false; return; }
  const s = activeSeg(r);
  if (!s) { r.drilling = false; return; }
  if (s.status === 'queued') {
    if (s.parent >= 0) {
      const p = S.segs[s.parent];
      if ((p.status === 'stop' || p.status === 'gone') && p.prog < s.tPar - 0.5) { s.status = 'gone'; return; }
    }
    s.status = 'drill';
  }
  r.drilling = true;
  const mine = r.owner === 'you';
  let budget = (mine ? st.drill() : 14 + S.d * 1.5) * dt;
  let guard = 0;
  while (budget > 1e-6 && s.status === 'drill' && guard++ < 50) {
    if (s.prog >= s.len - 1e-6) { s.status = 'done'; break; }
    const nx = s.x1 + s.ux * (s.prog + 1), ny = s.y1 + s.uy * (s.prog + 1);
    const ci = cellIndexAt(nx, ny);
    let mul = 1;
    if (ci < 0) {
      if (ny >= UG_BOT || nx < 0 || nx >= W) { stopSeg(s, r, 'EDGE'); break; }
    } else {
      const t = S.grid[ci];
      if (t === T_ROCK) {
        const rm = mine ? st.rock() : 0;
        if (rm <= 0) { revealAround(nx, ny, 1); stopSeg(s, r, 'ROCK'); break; }
        mul = 1 / rm;
      } else if (t === T_GAS) {
        hitGas(s, r, ci, nx, ny);
        if (s.status !== 'drill') break;
      } else if (t === T_OIL) {
        const p = S.pockets[S.pid[ci]];
        connect(r, p);
        if (p.amt > 0.5) {
          s.prog = Math.min(s.len, s.prog + 1); s.len = s.prog; s.status = 'done';
          if (mine) revealAround(nx, ny, 1);
          break;
        }
      }
    }
    const step = Math.min(1, budget / mul, s.len - s.prog);
    if (step <= 0) break;
    if (mine) {
      const cost = step * st.pipe();
      if (G.credits < cost) { if (!r.broke) { msg('OUT OF CREDITS - DRILLING PAUSED', P.red); sfx('err'); r.broke = true; } break; }
      r.broke = false;
      spend(cost);
    }
    s.prog += step; budget -= step * mul;
    if (mine) revealAround(s.x1 + s.ux * s.prog, s.y1 + s.uy * s.prog, has('seismic') ? 4 : 1);
  }
  if (s.status === 'drill' && s.prog >= s.len - 1e-6) s.status = 'done';
  if (s.status === 'drill' && Math.random() < 0.35) {
    const x = s.x1 + s.ux * s.prog, y = s.y1 + s.uy * s.prog;
    part(x, y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 0.25, pick([P.yellow, P.white, P.orange]));
  }
}

// ---------------------------------------------------------------- economy / buildings
function relink() {
  for (const r of myRigs()) {
    r.silo = null; let best = st.siloReach();
    for (const s of S.silos) { const d = Math.abs(s.x - r.x); if (d < best) { best = d; r.silo = s; } }
  }
}
function canPlace(kind, x) {
  if (kind === 'scan') return x > 6 && x < W - 6;
  const p = plotAt(x);
  if (!p || p.owner !== 'you') return false;
  if (x < p.x0 + 6 || x > p.x1 - 6) return false;
  for (const b of S.rigs) if (Math.abs(b.x - x) < 15) return false;
  for (const b of S.silos) if (Math.abs(b.x - x) < 15) return false;
  return true;
}
function toolCost(kind) { return kind === 'rig' ? st.rigCost() : kind === 'scan' ? st.scanCost() : COST[kind]; }
function placeAt(kind, x) {
  if (!canPlace(kind, x)) {
    const p = plotAt(x);
    msg(kind === 'scan' ? 'CANNOT SCAN THERE' : (!p || p.owner !== 'you') ? 'YOU MUST OWN THIS PLOT - BUY IT FIRST' : 'NO ROOM HERE', P.red);
    sfx('err'); return;
  }
  if (!afford(toolCost(kind))) return;
  spend(toolCost(kind));
  if (kind === 'rig') {
    if (pk('rig') > 0) S.perks.rig--;
    const r = { kind: 'rig', id: S.nid++, x, owner: 'you', tank: 0, pockets: new Set(), segs: [], offline: 0, dead: false };
    S.rigs.push(r); relink();
    S.sel = { kind: 'rig', ref: r }; S.tool = null;
    dust(x, SURF); sfx('build');
  } else if (kind === 'silo') {
    S.silos.push({ kind: 'silo', id: S.nid++, x, tank: 0, dead: false });
    relink(); S.tool = null; dust(x, SURF); sfx('build');
  } else if (kind === 'scan') {
    S.scans.push({ x, t: 0, dur: 1.4, rx: st.scanRx(), ry: st.scanRy(), done: false });
    sfx('scan');
    if (!S.keepTool) S.tool = null;
  }
}
function buyPlot(p) {
  if (p.owner) return;
  if (!afford(plotCost(p))) return;
  spend(plotCost(p)); p.owner = 'you';
  msg('PLOT ' + (p.i + 1) + ' ACQUIRED', P.lime); sfx('buy');
  gainXP(10); checkBaron();
}
function buyHauler() {
  if (!afford(COST.hauler)) return;
  spend(COST.hauler);
  spawnHauler();
}
function spawnHauler() {
  const h = { kind: 'hauler', id: S.nid++, x: 320 + (Math.random() * 40 - 20), y: -8, cargo: 0, state: 'idle', target: null, home: null,
    dir: 1, wait: 0, sale: 0, idleX: 260 + Math.random() * 120, idleY: 40 + Math.random() * 14, moving: false };
  S.haulers.push(h);
  S.sel = { kind: 'hauler', ref: h };
  sfx('buy');
  if (S.haulers.length >= 8) unlock('fleet');
}
// every unit sold earns XP, and every 25 units earns 1 research data
function soldUnits(u, s) {
  jobDeliver(s, u);
  S.rdAcc += u;
  while (S.rdAcc >= 25) { S.rdAcc -= 25; gainRD(1); }
  if (S.stats.sold >= 500) unlock('gusher');
  if (S.stats.sold >= 1500) unlock('kingpin');
  if (G.totalEarned >= 100000) unlock('rich');
  gainXP(u);
}
function scrapRig(r) {
  const refund = Math.round(COST.rig * 0.4);
  r.dead = true;
  S.rigs = S.rigs.filter(x => x !== r);
  for (const id of r.segs) S.segs[id].status = 'gone';
  G.credits += refund; S.stats.spent -= refund;
  relink();
  S.sel = null;
  dust(r.x, SURF); sfx('thud');
  msg('RIG SCRAPPED +$' + refund, P.lgray);
}
function stopDrill(r) {
  for (const id of r.segs) { const s = S.segs[id]; if (s.status === 'queued') s.status = 'gone'; else if (s.status === 'drill') { s.status = 'stop'; s.len = s.prog; } }
  sfx('click');
}
function pumpAll(dt) {
  for (const r of S.rigs) {
    r.pumping = false;
    if (r.offline > 0) continue;
    const mine = r.owner === 'you';
    const space = mine ? st.rigCap() - r.tank : Infinity;
    const yl = mine ? st.yield() : 1;
    const want = Math.min((mine ? st.pump() : st.rivalPump()) * dt, space / yl);
    if (want <= 0) continue;
    const live = [];
    for (const id of r.pockets) { const p = S.pockets[id]; if (p.amt > 0) live.push(p); }
    if (!live.length) continue;
    let got = 0;
    const each = want / live.length;
    for (const p of live) {
      const g = Math.min(each, p.amt);
      p.amt -= g; got += g;
      if (p.amt <= 1e-6) {
        p.amt = 0;
        if (S.rigs.some(o => o.owner === 'you' && o.pockets.has(p.id))) {
          msg('A CRUDE POCKET RAN DRY', P.lgray);
          if (mine && S.rigs.some(o => isRival(o.owner) && o.pockets.has(p.id))) unlock('thief');
        }
      }
    }
    if (got > 0) { r.pumping = true; if (mine) r.tank += got * yl; else if (S.rv[r.owner]) S.rv[r.owner].pumped += got; }
  }
  for (const r of myRigs()) {
    r.xfer = false;
    if (!r.silo || r.tank <= 0) continue;
    const u = Math.min(6 * dt, r.tank, st.siloCap() - r.silo.tank);
    if (u > 0) { r.tank -= u; r.silo.tank += u; r.xfer = true; }
  }
}
function dock(b) {
  if (b.kind === 'rig') return [b.x, SURF - 34];
  if (b.kind === 'silo') return [b.x, SURF - 21];
  return [b.x, SURF - 38];
}
function flyTo(h, tx, ty, dt) {
  const sp = st.hSpeed();
  const dx = tx - h.x;
  const gy = Math.abs(dx) > 3 ? Math.min(ty, CRUISE) : ty;
  const vx = Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
  const vy = Math.sign(gy - h.y) * Math.min(Math.abs(gy - h.y), sp * 0.8 * dt);
  h.x += vx; h.y += vy;
  if (Math.abs(vx) > 0.01) h.dir = Math.sign(vx);
  h.moving = Math.abs(vx) + Math.abs(vy) > 0.01;
  return Math.abs(tx - h.x) < 0.5 && Math.abs(ty - h.y) < 0.5;
}
function bestStation() {
  const open = S.stations.filter(s => s.closed <= 0);
  if (!open.length) return null;
  return open.reduce((a, b) => price(a) >= price(b) ? a : b);
}
function autoSell(h) { const s = bestStation(); if (!s) { h.state = 'full'; return; } h.target = s; h.state = 'toSell'; }
function cmdLoad(h, b) { h.target = b; h.home = b; h.state = 'toLoad'; h.wait = 0; sfx('click'); }
function cmdSell(h, s) {
  if (s.closed > 0) { msg(s.name + ' IS CLOSED (' + s.closed + ' DAYS)', P.red); sfx('err'); return; }
  if (h.cargo <= 0) msg('THAT HAULER IS EMPTY', P.lgray);
  h.target = s; h.state = 'toSell'; sfx('click');
}
function updateHauler(h, dt) {
  if (h.target && h.target.dead) { h.target = null; h.state = 'idle'; }
  if (h.home && h.home.dead) h.home = null;
  h.moving = false;
  switch (h.state) {
    case 'idle': flyTo(h, h.idleX, h.idleY, dt); break;
    case 'toLoad': { const [tx, ty] = dock(h.target); if (flyTo(h, tx, ty, dt)) { h.state = 'loading'; h.wait = 0; } break; }
    case 'loading': case 'full': {
      const b = h.target; const [tx, ty] = dock(b); flyTo(h, tx, ty, dt);
      const cap = st.hCap(), room = cap - h.cargo;
      if (room <= 0.01) { h.cargo = cap; if (has('auto')) autoSell(h); else h.state = 'full'; break; }
      h.state = 'loading';
      const u = Math.min(18 * st.hRate() * dt, room, b.tank);
      if (u > 0.0001) { b.tank -= u; h.cargo += u; h.wait = 0; }
      else { h.wait += dt; if (has('auto') && h.cargo > 0 && h.wait > 2.5) autoSell(h); }
      break;
    }
    case 'toSell': { const [tx, ty] = dock(h.target); if (flyTo(h, tx, ty, dt)) h.state = 'selling'; break; }
    case 'selling': {
      const s = h.target;
      if (s.closed > 0) {
        msg(s.name + ' IS CLOSED!', P.red);
        h.state = 'idle'; h.idleX = s.x + (s.x < 320 ? 34 : -34); h.idleY = CRUISE - 6; break;
      }
      const u = Math.min(25 * st.hRate() * dt, h.cargo);
      const v = u * price(s);
      h.cargo -= u; h.sale += v;
      G.credits += v; G.totalEarned += v; S.stats.revenue += v; S.stats.sold += u;
      s.sat = Math.max(0.45, s.sat - u * 0.0025 * st.satMul());
      soldUnits(u, s);
      if (h.cargo <= 1e-6) {
        h.cargo = 0;
        if (h.sale > 0.5) { float(h.x, h.y - 10, '+$' + fmt(h.sale), P.yellow); sfx('cash'); }
        h.sale = 0;
        if (has('auto') && h.home && !h.home.dead) { h.target = h.home; h.state = 'toLoad'; }
        else { h.state = 'idle'; h.target = null; h.idleX = s.x + (s.x < 320 ? 30 : -30) + Math.random() * 16 - 8; h.idleY = CRUISE - 4 + Math.random() * 8; }
      }
      break;
    }
  }
  if (h.moving && Math.random() < 0.35) part(h.x - h.dir * 6, h.y, -h.dir * 25, (Math.random() - 0.5) * 8, 0.3, pick([P.orange, P.yellow]));
}
function updateScans(dt) {
  for (const sc of S.scans) {
    if (sc.done) continue;
    sc.t += dt;
    const k = Math.min(1, sc.t / sc.dur);
    const c0 = Math.floor((sc.x - sc.rx) / CELL), c1 = Math.ceil((sc.x + sc.rx) / CELL), r1 = Math.ceil(sc.ry / CELL);
    for (let r = 0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const px = (c * CELL + 2 - sc.x) / sc.rx, py = (r * CELL + 2) / sc.ry;
      if (px * px + py * py <= k * k) reveal(c, r);
    }
    if (k >= 1) {
      sc.done = true;
      const found = new Set();
      for (let r = 0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (c < 0 || c >= COLS || r >= ROWS) continue;
        const i = r * COLS + c;
        if (S.rev[i] && S.grid[i] === T_OIL && S.pockets[S.pid[i]].amt > 0) found.add(S.pid[i]);
      }
      msg(found.size ? 'SCAN: ' + found.size + ' CRUDE POCKET' + (found.size > 1 ? 'S' : '') + ' DETECTED' : 'SCAN: NO CRUDE HERE', found.size ? P.crudeL : P.lgray);
    }
  }
}

// ---------------------------------------------------------------- rival corporations
function rivalDaily(d) {
  if (S.bribe > 0) S.bribe--;
  for (const id of S.rivals) {
    const R = S.rv[id], info = RIVALS[id];
    if (d >= R.nextBuy) {
      const free = S.plots.filter(p => !p.owner);
      if (free.length && S.bribe <= 0) {
        free.sort((a, b) => b.oil - a.oil);
        const p = Math.random() < 0.6 ? free[0] : pick(free);
        p.owner = id;
        msg(info.name + ' BOUGHT PLOT ' + (p.i + 1), info.col); sfx('alert');
        if (Math.random() < 0.6) taunt(id);
        R.queue.push({ day: d + 2 + Math.random() * 3, plot: p.i }, { day: d + 12 + Math.random() * 6, plot: p.i });
      }
      const gap = id === 'syn' ? 12 : 22;
      R.nextBuy = d + (G.sector === 1 ? gap + 8 : gap) + Math.random() * 10;
    }
    for (const q of R.queue) if (!q.done && d >= q.day) { q.done = true; if (S.plots[q.plot].owner === id) rivalBuild(S.plots[q.plot]); }
    if (d >= R.nextTrick) {
      R.nextTrick = d + 18 + Math.random() * 12;
      if (id === 'kroll') {
        const s = pick(S.stations);
        s.sat = Math.min(s.sat, 0.6);
        msg('KROLL DUMPED CRUDE AT ' + s.name + ' - PRICES TANK!', info.col); sfx('alert');
        taunt(id);
      } else if (id === 'hex') {
        const targets = myRigs().filter(r => r.offline <= 0);
        if (targets.length) {
          const r = pick(targets);
          if (isChar('iris')) { msg('HEX TRIED TO SABOTAGE A RIG - IRIS-9 BLOCKED IT', P.lime); taunt(id, 'ERROR. ERROR. UNEXPECTED FIREWALL.'); }
          else {
            r.offline = 4; explosion(r.x, SURF - 14, 16); S.shake = 4;
            const a = activeSeg(r); if (a && a.status === 'drill') { a.status = 'stop'; a.len = a.prog; }
            msg('HEX CORP SABOTAGED A RIG! OFFLINE 4 DAYS', info.col); sfx('boom');
            taunt(id);
          }
        }
      }
    }
  }
  for (const r of S.rigs) {
    if (!isRival(r.owner) || activeSeg(r) || d < (r.nextTry || 0)) continue;
    const live = [...r.pockets].some(id => S.pockets[id].amt > 0);
    if (!live && r.tries < 5) { rivalDrill(r); r.nextTry = d + 6; }
  }
}
function rivalBuild(plot) {
  let best = null, bs = -1;
  for (let x = plot.x0 + 8; x <= plot.x1 - 8; x += 4) {
    if (S.rigs.some(r => Math.abs(r.x - x) < 16)) continue;
    let sc = Math.random() * 5;
    for (const p of S.pockets) if (p.amt > 0) sc += p.amt / (1 + Math.abs(p.cx - x) * 0.05 + (p.cy - SURF) * 0.02);
    if (sc > bs) { bs = sc; best = x; }
  }
  if (best == null) return;
  const r = { kind: 'rig', id: S.nid++, x: best, owner: plot.owner, tank: 0, pockets: new Set(), segs: [], offline: 0, tries: 0, tried: new Set(), dead: false };
  S.rigs.push(r);
  rivalDrill(r);
}
function rivalDrill(r) {
  r.tries++;
  let best = null, bs = 1e9;
  for (const p of S.pockets) {
    if (p.amt <= 1 || r.tried.has(p.id)) continue;
    const dx = Math.abs(p.cx - r.x);
    if (dx > 150) continue;
    const sc = dx + (p.cy - SURF) * 0.7 + Math.random() * 20;
    if (sc < bs) { bs = sc; best = p; }
  }
  if (!best) return;
  r.tried.add(best.id);
  const tops = best.cells.filter(i => ((i / COLS) | 0) <= best.top + 1);
  const ci = pick(tops);
  const tx = (ci % COLS) * CELL + 2, ty = UG_TOP + ((ci / COLS) | 0) * CELL + 2;
  orderDrill(r, nearestPoint(r, tx, ty), tx, ty);
}

// ---------------------------------------------------------------- events & days
function randomEvent() {
  const roll = Math.random(), s = pick(S.stations);
  if (roll < 0.25) { s.mult = 1.5; s.multT = 8; msg('FUEL SHORTAGE AT ' + s.name + '! PRICES SOAR FOR 8 DAYS', P.lime); }
  else if (roll < 0.4) { for (const x of S.stations) { x.mult = 0.7; x.multT = 7; } msg('MARKET CRASH! ALL PRICES DOWN FOR 7 DAYS', P.red); }
  else if (roll < 0.55) { s.closed = 6; msg('DOCK STRIKE: ' + s.name + ' CLOSED FOR 6 DAYS', P.orange); }
  else if (roll < 0.7) { S.flare = 6; msg('SOLAR FLARE! HAULERS AT HALF SPEED FOR 6 DAYS', P.orange); }
  else if (roll < 0.85 && myRigs().length && !isChar('iris')) {
    const r = pick(myRigs()); r.offline = 4; explosion(r.x, SURF - 14); S.shake = 6;
    msg('MICROMETEOR STRIKE! A RIG IS OFFLINE FOR 4 DAYS', P.red); sfx('boom'); return;
  } else { const v = 300 + S.d * 100; G.credits += v; msg('CONSORTIUM DEVELOPMENT GRANT +$' + v, P.lime); }
  sfx('alert');
}
function quake() {
  S.shake = 10; S.jam = 1;
  sfx('boom');
  for (let k = 0; k < 3; k++) {
    const c0 = Math.floor(Math.random() * COLS), r0 = 8 + Math.floor(Math.random() * (ROWS - 10));
    for (let dr = -5; dr <= 5; dr++) for (let dc = -6; dc <= 6; dc++) if (dc * dc / 36 + dr * dr / 25 <= 1) reveal(c0 + dc, r0 + dr);
  }
  msg('QUAKE! NEW GROUND EXPOSED - DRILLS JAMMED FOR A DAY', P.orange);
}
function daily() {
  const d = S.lastDay;
  for (const s of S.stations) {
    s.hist.push(price(s)); if (s.hist.length > 40) s.hist.shift();
    s.sat += (1 - s.sat) * 0.1;
    if (s.multT > 0 && --s.multT === 0) s.mult = 1;
    if (s.closed > 0) s.closed--;
  }
  for (const s of S.stations) jobDaily(s, d);
  if (has('reson')) for (const p of S.pockets) if (S.rigs.some(r => r.owner === 'you' && r.pockets.has(p.id))) p.amt = Math.min(p.cap, p.amt + p.cap * 0.015);
  if (S.flare > 0) S.flare--;
  else if (hasMod('storm') && Math.random() < 0.08) { S.flare = 4; msg('SOLAR STORM! HAULERS SLOWED FOR 4 DAYS', P.orange); }
  if (S.jam > 0) S.jam--;
  if (hasMod('quake') && d >= S.nextQuake) { quake(); S.nextQuake = d + 12 + Math.random() * 8; }
  if (S.abil.cd > 0) S.abil.cd--;
  if (S.abil.on > 0 && --S.abil.on === 0) msg(CHAR().active.name + ' WORE OFF', P.lgray);
  else if (S.abil.cd === 0 && d > 0 && S.abil.wasCd) msg(CHAR().active.name + ' IS READY [Q]', P.yellow);
  S.abil.wasCd = S.abil.cd > 0;
  for (const r of S.rigs) if (r.offline > 0) r.offline--;
  rivalDaily(d);
  if (d >= S.nextEvent) { randomEvent(); S.nextEvent = d + 14 + Math.random() * 14; }
  if (d === S.days - 10) { msg('10 DAYS LEFT IN THIS SECTOR', P.yellow); sfx('alert'); }
  if (d >= S.days) endSector();
}
function endSector() {
  let crude = 0;
  for (const r of myRigs()) crude += r.tank;
  for (const s of S.silos) crude += s.tank;
  for (const h of S.haulers) crude += h.cargo;
  const avg = (price(S.stations[0]) + price(S.stations[1])) / 2;
  const fire = Math.round(crude * avg * 0.4);
  G.credits += fire;
  const avgBase = (S.stations[0].base + S.stations[1].base) / 2;
  const rivalRep = [];
  for (const id of RIVAL_IDS) {
    const active = S.rivals.includes(id), pumped = active ? S.rv[id].pumped : 0;
    let rcash = (active ? pumped * avgBase * 0.45 + 300 * G.sector : 150 * G.sector) * (1 - 0.08 * lv('hard'));
    let bought = 0;
    while (G.rshares[id] < 51 && G.shares + rivalTotal() < 100 && rcash >= sharePrice()) { rcash -= sharePrice(); G.rshares[id]++; bought++; }
    rivalRep.push({ id, active, pumped, bought });
  }
  const rdBonus = 5 + G.sector;
  G.rd += rdBonus; S.stats.rd += rdBonus;
  let stipend = 0;
  if (G.credits < 1500) { stipend = Math.round(1500 - Math.max(0, G.credits)); G.credits = 1500; }
  G.report = { sector: G.sector, name: S.name, revenue: S.stats.revenue, spent: S.stats.spent, sold: S.stats.sold, gas: S.stats.gas,
    fire, crude, rivals: rivalRep, stipend,
    rd: S.stats.rd, rank: S.rank, jobs: S.stats.jobs, rdBonus };
  G.sector++;
  save();
  screen = 'summary';
  sfx('fanfare');
}

// ---------------------------------------------------------------- update
function update(dt) {
  S.t += dt;
  const day = S.t / S.dayLen;
  while (S.lastDay < Math.floor(day)) { S.lastDay++; daily(); if (screen !== 'play') return; }
  S.day = day;
  for (const r of S.rigs) updateDrill(r, dt);
  pumpAll(dt);
  for (const h of S.haulers) updateHauler(h, dt);
  updateScans(dt);
  for (const p of S.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
  S.parts = S.parts.filter(p => p.life > 0);
  for (const f of S.floats) { f.y -= 12 * dt; f.life -= dt; }
  S.floats = S.floats.filter(f => f.life > 0);
  for (const r of S.rigs) if (r.offline > 0 && Math.random() < 0.15) part(r.x + (Math.random() - 0.5) * 4, SURF - 24, (Math.random() - 0.5) * 6, -15, 1.2, pick([P.dgray, P.gray]));
}

// ---------------------------------------------------------------- UI primitives
function panel(x, y, w, h, bg = P.navy, edge = P.gray) { rect(x, y, w, h, edge); rect(x + 1, y + 1, w - 2, h - 2, bg); }
function button(x, y, w, h, label, fn, o = {}) {
  const dis = !!o.disabled, hov = !dis && inRect(mouse, x, y, w, h);
  rect(x, y, w, h, P.black);
  rect(x + 1, y + 1, w - 2, h - 2, dis ? P.dgray : hov ? (o.hc || P.blue) : (o.color || P.dblue));
  rect(x + 1, y + 1, w - 2, 1, dis ? P.gray : P.lgray);
  rect(x + 1, y + h - 2, w - 2, 1, P.navy);
  if (o.active) { rect(x, y, w, 1, P.yellow); rect(x, y + h - 1, w, 1, P.yellow); rect(x, y, 1, h, P.yellow); rect(x + w - 1, y, 1, h, P.yellow); }
  txt(label, x + w / 2, y + ((h - 5) >> 1), dis ? P.gray : (o.tc || P.white), o.scale || 1, 'c');
  BTN.push({ x, y, w, h, fn: dis ? null : fn });
}
function brackets(x, y, w, h, c) {
  rect(x, y, 3, 1, c); rect(x, y, 1, 3, c); rect(x + w - 3, y, 3, 1, c); rect(x + w - 1, y, 1, 3, c);
  rect(x, y + h - 1, 3, 1, c); rect(x, y + h - 3, 1, 3, c); rect(x + w - 3, y + h - 1, 3, 1, c); rect(x + w - 1, y + h - 3, 1, 3, c);
}
const blink = () => ((GT * 3) | 0) % 2 === 0;

// ---------------------------------------------------------------- sprites
function drawRig(r, baseY = SURF) {
  const x = Math.round(r.x), y = baseY;
  const mine = r.owner === 'you', rival = isRival(r.owner);
  const fr = r.offline > 0 ? P.gray : rival ? rcol(r.owner) : P.lgray;
  const sd = rival ? RIVALS[r.owner].dark : P.gray;
  rect(x - 6, y - 3, 13, 3, P.dgray); rect(x - 6, y - 3, 13, 1, sd);
  for (let k = 0; k < 18; k++) {
    const hw = Math.round(5 - k * 3.2 / 18);
    rect(x - hw, y - 4 - k, 1, 1, fr); rect(x + hw, y - 4 - k, 1, 1, fr);
    if (k % 5 === 2) rect(x - hw + 1, y - 4 - k, hw * 2 - 1, 1, sd);
    else if (k % 5 === 4) rect(x - hw + 1 + ((k * 3) % (hw * 2 - 1 || 1)), y - 4 - k, 1, 1, sd);
  }
  rect(x - 3, y - 23, 7, 2, fr); rect(x, y - 26, 1, 3, fr);
  const on = ((GT * 2 + r.id * 0.37) % 2) < 1;
  rect(x, y - 27, 1, 1, r.offline > 0 ? P.red : on ? (rival ? P.orange : P.lime) : P.dgray);
  const off = r.pumping ? Math.round(Math.sin(GT * 8 + r.id) * 2) : 0;
  rect(x - 1, y - 12 + off, 3, 5, rival ? P.orange : P.yellow);
  rect(x, y - 16 + off, 1, 4, P.lgray);
  if (mine) {
    const cap = st.rigCap(), f = clamp(r.tank / cap, 0, 1);
    rect(x + 7, y - 18, 3, 16, P.black);
    const fh = Math.round(14 * f);
    rect(x + 8, y - 3 - fh, 1, fh, f >= 0.999 ? P.crudeG : P.crude);
    if (f >= 0.999 && blink()) txtS('FULL', x + 1, y - 35, P.orange, 1, 'c');
  }
  if (r.offline > 0 && blink()) txtS('OFFLINE', x, y - 35, P.red, 1, 'c');
}
function drawSilo(s) {
  const x = s.x | 0, y = SURF;
  rect(x - 7, y - 11, 14, 11, P.gray); rect(x - 6, y - 13, 12, 2, P.gray); rect(x - 4, y - 14, 8, 1, P.gray);
  rect(x - 6, y - 11, 1, 10, P.lgray); rect(x - 5, y - 13, 4, 1, P.lgray);
  rect(x - 7, y - 6, 14, 1, P.dgray);
  rect(x - 1, y - 11, 3, 10, P.black);
  const f = clamp(s.tank / st.siloCap(), 0, 1), fh = Math.round(9 * f);
  rect(x, y - 2 - fh + 1, 1, fh, f >= 0.999 ? P.crudeG : P.crude);
}
function drawStation(s) {
  const x = s.x | 0, y = SURF, flip = s.x > 320 ? -1 : 1;
  rect(x - 22, y - 22, 44, 22, P.dgray); rect(x - 22, y - 22, 44, 1, P.gray);
  for (let k = 0; k < 6; k++) rect(x - 18 + k * 7, y - 18, 3, 2, ((k + ((GT * 0.7) | 0)) % 4) ? P.yellow : P.navy);
  rect(x - 7, y - 31, 14, 9, P.gray); rect(x - 7, y - 31, 14, 1, P.lgray);
  rect(x - 13, y - 33, 26, 2, s.closed > 0 ? P.red : P.lgray);
  if (blink()) { rect(x - 13, y - 34, 1, 1, P.lime); rect(x + 12, y - 34, 1, 1, P.lime); }
  rect(x + 14 * flip - 3, y - 30, 7, 8, P.teal); rect(x + 14 * flip - 2, y - 31, 5, 1, P.teal);
  rect(x - 16 * flip, y - 42, 1, 20, P.lgray); rect(x - 16 * flip, y - 43, 1, 1, ((GT * 1.5) | 0) % 2 ? P.red : P.dgray);
  txt(s.name, x, y - 10, s.closed > 0 ? P.red : P.cyan, 1, 'c');
}
function drawHauler(h) {
  const bob = (h.state === 'idle' || h.state === 'full' || h.state === 'loading') ? Math.round(Math.sin(GT * 3 + h.id)) : 0;
  const x = Math.round(h.x), y = Math.round(h.y) + bob, d = h.dir;
  rect(x - 5, y - 2, 10, 4, P.lgray); rect(x - 5, y + 1, 10, 1, P.gray); rect(x - 6, y - 1, 1, 2, P.gray);
  rect(x + (d > 0 ? 2 : -5), y - 2, 3, 2, P.sky);
  const f = clamp(h.cargo / (G ? st.hCap() : 20), 0, 1);
  rect(x - 4, y + 2, 8, 2, P.black); rect(x - 4, y + 2, Math.round(8 * f), 2, f >= 0.999 ? P.crudeG : P.crude);
  if (h.moving) rect(x + (d > 0 ? -7 : 5), y - 1, 2, 2, ((GT * 20) | 0) % 2 ? P.orange : P.yellow);
  if (h.state === 'full' && blink()) txtS('FULL', x, y - 10, P.orange, 1, 'c');
  if (h.state === 'loading' && h.wait > 1 && blink()) txtS('...', x, y - 10, P.lgray, 1, 'c');
}
function drawScanner(sc) {
  const x = sc.x | 0, y = SURF;
  rect(x - 2, y - 3, 1, 3, P.gray); rect(x + 2, y - 3, 1, 3, P.gray); rect(x, y - 5, 1, 3, P.lgray);
  rect(x - 2, y - 7, 5, 2, P.lgray); rect(x - 1, y - 8, 3, 1, P.lgray);
  rect(x, y - 9, 1, 1, sc.done ? P.dgray : (blink() ? P.cyan : P.white));
}

// ---------------------------------------------------------------- world render
function drawOil() {
  const tick = (GT * 6) | 0;
  for (const p of S.pockets) {
    if (p.amt <= 0) continue;
    const filled = Math.ceil((p.amt / p.cap) * p.n - 1e-6);
    if (filled <= 0) continue;
    const topRow = (p.cells[filled - 1] / COLS) | 0;
    for (let k = 0; k < filled; k++) {
      const i = p.cells[k];
      if (!S.rev[i]) continue;
      const c = i % COLS, r = (i / COLS) | 0, x = c * 4, y = UG_TOP + r * 4;
      if (r === topRow) {
        rect(x, y, 4, 4, P.crude);
        rect(x, y, 4, 1, ((c + tick) % 5 === 0) ? P.crudeG : P.crudeL);
      } else {
        rect(x, y, 4, 4, ((c * 7 + r * 3) % 9 === 0) ? P.crudeD : P.crude);
        if ((c + r * 5 + tick) % 23 === 0) rect(x + 1, y + 1, 1, 1, P.crudeL);
      }
    }
  }
}
function drawPlotLines() {
  for (let k = 0; k <= NPLOTS; k++) {
    const x = PLOT_X0 + k * PLOT_W;
    for (let y = UG_TOP; y < UG_BOT; y += 8) rect(x, y, 1, 3, 'rgba(160,130,210,0.16)');
    rect(x, SURF - 3, 1, 4, P.gray);
  }
}
function drawPlotFlags() {
  for (const p of S.plots) {
    if (!p.owner) continue;
    const col = p.owner === 'you' ? P.cyan : rcol(p.owner);
    rect(p.x0 + 1, SURF, PLOT_W - 1, 1, col);
    const fx = p.x0 + 4;
    rect(fx, SURF - 14, 1, 14, P.lgray);
    rect(fx + 1, SURF - 14, 6, 4, col);
    if (((GT * 3) | 0) % 2) rect(fx + 6, SURF - 11, 1, 1, col); else rect(fx + 6, SURF - 14, 1, 1, P.black);
  }
}
function segPt(s, t) { return [Math.round(s.x1 + s.ux * t), Math.round(s.y1 + s.uy * t)]; }
function drawPipes() {
  const vis = S.segs.filter(s => s.status !== 'gone' && s.status !== 'queued' && s.prog > 0);
  for (const s of vis) for (let t = 0; t <= s.prog; t += 1) { const [x, y] = segPt(s, t); rect(x - 1, y - 1, 3, 3, P.black); }
  for (const s of vis) {
    const col = s.owner === 'you' ? P.lgray : rcol(s.owner);
    for (let t = 0; t <= s.prog; t += 1) { const [x, y] = segPt(s, t); rect(x, y, 1, 1, col); }
  }
  // flowing crude
  const off = (GT * 24) % 8;
  for (const r of S.rigs) {
    if (!r.pumping) continue;
    for (const id of r.segs) {
      const s = S.segs[id];
      if (s.status !== 'done' && s.status !== 'stop') continue;
      for (let t = ((s.prog - off) % 8 + 8) % 8; t <= s.prog; t += 8) { const [x, y] = segPt(s, t); rect(x, y, 1, 1, r.owner === 'you' ? P.crudeL : P.orange); }
    }
  }
  // queued plans + drill heads
  for (const s of S.segs) {
    if (s.owner !== 'you') continue;
    if (s.status === 'queued') {
      for (let t = 0; t <= s.len; t += 4) { const [x, y] = segPt(s, t); rect(x, y, 1, 1, P.gray); }
    } else if (s.status === 'drill') {
      for (let t = s.prog + 4; t <= s.len; t += 4) { const [x, y] = segPt(s, t); rect(x, y, 1, 1, P.gray); }
      const [x, y] = segPt(s, s.prog);
      rect(x - 1, y - 1, 3, 3, blink() ? P.yellow : P.white);
    }
  }
}
function drawScanWaves() {
  for (const sc of S.scans) {
    if (sc.done) continue;
    const k = Math.min(1, sc.t / sc.dur);
    for (let a = 0; a <= Math.PI; a += 0.03) {
      const x = sc.x + Math.cos(a) * sc.rx * k, y = UG_TOP + Math.sin(a) * sc.ry * k;
      rect(x | 0, y | 0, 1, 1, P.cyan);
    }
  }
}
function drawLinks() {
  const off = (GT * 16) % 6;
  for (const r of myRigs()) {
    if (!r.silo) continue;
    const a = Math.min(r.x, r.silo.x), b = Math.max(r.x, r.silo.x);
    rect(a, SURF - 2, b - a, 2, P.dgray); rect(a, SURF - 2, b - a, 1, P.gray);
    if (r.xfer) {
      const dir = Math.sign(r.silo.x - r.x);
      for (let t = off; t < b - a; t += 6) rect(Math.round(r.x + dir * t), SURF - 2, 1, 1, P.crudeL);
    }
  }
}
function previewInfo() {
  if (S.tool || S.paused || S.help) return null;
  if (S.drag && S.drag.kind === 'pipe' && mouse.moved) return { r: S.drag.rig, start: S.drag.start };
  if (!S.drag && S.sel && S.sel.kind === 'rig' && mouse.y > UG_TOP && mouse.y < UG_BOT && !overUI())
    return { r: S.sel.ref, start: nearestPoint(S.sel.ref, mouse.x, mouse.y) };
  return null;
}
function drawPreview() {
  const pv = previewInfo();
  if (!pv) return;
  const { start } = pv;
  const tx = clamp(mouse.x, 1, W - 2), ty = clamp(mouse.y, UG_TOP + 2, UG_BOT - 2);
  const len = Math.hypot(tx - start.x, ty - start.y);
  if (len < 4) return;
  const ux = (tx - start.x) / len, uy = (ty - start.y) / len, rk = st.rock();
  let bad = false;
  for (let t = 0; t <= len; t += 2) {
    const x = start.x + ux * t, y = start.y + uy * t, ci = cellIndexAt(x, y);
    if (ci >= 0 && S.rev[ci]) { const g = S.grid[ci]; if ((g === T_ROCK && rk <= 0) || (g === T_GAS && !has('gas'))) bad = true; }
    if (((t / 2) | 0) % 2 === 0) rect(x | 0, y | 0, 1, 1, bad ? P.red : P.lime);
  }
  rect((start.x | 0) - 1, (start.y | 0) - 1, 3, 3, P.white);
  const cost = Math.ceil(len * st.pipe());
  txtS('$' + cost, tx + 6, ty - 8, G.credits >= cost ? P.yellow : P.red);
}
function drawGhost() {
  if (!S.tool || overUI()) return;
  if (S.tool === 'blast') {
    const R = (st.blastR() + 0.5) * CELL, ok = mouse.y > UG_TOP + 2 && S.blasts > 0;
    const col = ok ? (blink() ? P.orange : P.yellow) : P.red;
    for (let a = 0; a < Math.PI * 2; a += 0.12) rect((mouse.x + Math.cos(a) * R) | 0, (mouse.y + Math.sin(a) * R) | 0, 1, 1, col);
    rect((mouse.x - 3) | 0, mouse.y | 0, 7, 1, col); rect(mouse.x | 0, (mouse.y - 3) | 0, 1, 7, col);
    return;
  }
  const x = Math.round(mouse.x / 4) * 4, ok = canPlace(S.tool, x);
  ctx.globalAlpha = 0.55;
  if (S.tool === 'rig') drawRig({ x, owner: 'you', tank: 0, id: 0, offline: 0 });
  else if (S.tool === 'silo') drawSilo({ x, tank: 0 });
  else drawScanner({ x, done: false });
  ctx.globalAlpha = 1;
  rect(x - 7, SURF + 1, 15, 1, ok ? P.lime : P.red);
  if (S.tool === 'scan') {
    const rx = st.scanRx(), ry = st.scanRy();
    for (let a = 0; a <= Math.PI; a += 0.06) rect((x + Math.cos(a) * rx) | 0, (UG_TOP + Math.sin(a) * ry) | 0, 1, 1, P.teal);
  }
}
function drawSelection() {
  if (!S.sel) return;
  const c = blink() ? P.yellow : P.orange, o = S.sel.ref;
  if (o.dead) { S.sel = null; return; }
  if (S.sel.kind === 'rig') brackets(o.x - 8, SURF - 30, 20, 31, c);
  else if (S.sel.kind === 'silo') brackets(o.x - 9, SURF - 17, 18, 18, c);
  else if (S.sel.kind === 'hauler') brackets(Math.round(o.x) - 8, Math.round(o.y) - 5, 16, 11, c);
}

// ---------------------------------------------------------------- HUD
function overUI() {
  if (mouse.y >= 341 || mouse.y < 13) return true;
  if (selPanelRect && inRect(mouse, ...selPanelRect)) return true;
  return false;
}
let selPanelRect = null;
function drawTopBar() {
  rect(0, 0, W, 12, P.navy); rect(0, 12, W, 1, P.dgray);
  txt('S' + G.sector + ' ' + S.name, 4, 4, P.lgray);
  const lo = rankReq(S.rank), hi = rankReq(S.rank + 1);
  txt('RANK ' + S.rank, 104, 4, P.yellow);
  rect(136, 4, 50, 5, P.black);
  rect(136, 4, Math.round(50 * clamp((S.xp - lo) / (hi - lo), 0, 1)), 5, P.yellow);
  const day = Math.min(S.days, Math.floor(S.day) + 1);
  txt('DAY ' + day + '/' + S.days, 254, 4, P.white, 1, 'r');
  rect(258, 4, 100, 5, P.black);
  rect(258, 4, Math.round(100 * Math.min(1, S.day / S.days)), 5, S.days - S.day < 10 ? P.orange : P.green);
  if (S.flare > 0) txt('FLARE', 364, 4, P.orange);
  txt(G.rd + ' RD', 470, 4, P.cyan, 1, 'r');
  txt('SHARES ' + G.shares + ':' + rivalTotal(), 548, 4, P.lgray, 1, 'r');
  txt('$' + fmt(G.credits), W - 4, 4, P.yellow, 1, 'r');
}
function drawStationPanels() {
  for (const s of S.stations) {
    const x0 = s.x < 320 ? 2 : W - 60, y0 = 14, w = 58, h = s.job ? 43 : 35;
    panel(x0, y0, w, h, P.navy, s.closed > 0 ? P.red : (S.sel && S.sel.kind === 'hauler' && inRect(mouse, x0, y0, w, h) ? P.yellow : P.gray));
    txt(s.name + (s.closed > 0 ? ' CLOSED' : s.mult > 1 ? ' HOT!' : s.mult < 1 ? ' CRASH' : ''), x0 + 3, y0 + 3, s.closed > 0 ? P.red : s.mult > 1 ? P.lime : P.cyan);
    const pr = price(s);
    txt('$' + pr.toFixed(1), x0 + 3, y0 + 11, P.yellow, 2);
    const prev = s.hist[s.hist.length - 3] || pr, up = pr >= prev, ax = x0 + w - 7, ay = y0 + 12;
    for (let k = 0; k < 3; k++) rect(ax - k, up ? ay + k : ay + 4 - k, k * 2 + 1, 1, up ? P.lime : P.red);
    const vals = s.hist.slice(-24), fc = [];
    if (has('intel')) for (let k = 1; k <= 10; k++) fc.push(rawPrice(s, S.day + k) * (s.multT >= k ? s.mult : 1) * (s.sat + (1 - s.sat) * Math.min(1, k * 0.1)));
    vals.push(pr);
    const all = vals.concat(fc), mn = Math.min(...all), mx = Math.max(...all);
    const sx = x0 + 3, sy = y0 + 23, sw = w - 6, sh = 9;
    rect(sx, sy, sw, sh, '#0f1020');
    for (let i = 0; i < all.length; i++) {
      const px = sx + Math.round(i * (sw - 1) / (all.length - 1));
      const py = sy + sh - 1 - Math.round((all[i] - mn) / ((mx - mn) || 1) * (sh - 1));
      rect(px, py, 1, 1, i < vals.length ? P.lime : P.orange);
    }
    if (s.job) {
      const j = s.job, left = j.deadline - Math.floor(S.day);
      rect(sx, sy + 11, sw, 7, P.black);
      rect(sx, sy + 11, Math.round(sw * Math.min(1, j.done / j.units)), 7, P.teal);
      txt('JOB ' + Math.floor(j.done) + '/' + j.units + ' ' + left + 'D', x0 + w / 2, sy + 12, left <= 5 && blink() ? P.orange : P.white, 1, 'c');
    }
  }
}
function drawMessages() {
  let y = 16;
  for (const m of S.msgs) {
    const age = GT - m.t;
    if (age > 6) continue;
    ctx.globalAlpha = clamp(6 - age, 0, 1);
    txtS(m.text, 320, y, m.color, 1, 'c');
    y += 8;
  }
  ctx.globalAlpha = 1;
}
function tutorialHint() {
  if (G.sector > 1) return null;
  const mine = myRigs();
  if (!S.plots.some(p => p.owner === 'you')) return 'BUY A PLOT OF LAND - CLICK A "BUY" SIGN';
  if (!S.scans.length && !S.segs.some(s => s.owner === 'you')) return 'SCAN FOR VOIDCRUDE [4], THEN CLICK ON YOUR PLOT';
  if (!mine.length) return 'BUILD A RIG [1] ON YOUR PLOT ABOVE THE CRUDE';
  if (!S.segs.some(s => s.owner === 'you')) return 'CLICK YOUR RIG, THEN CLICK UNDERGROUND TO DRILL';
  if (!mine.some(r => r.pockets.size)) return 'STEER YOUR PIPE INTO A PURPLE CRUDE POCKET';
  if (!S.haulers.length) return 'BUY A HAULER [3] TO MOVE YOUR CRUDE';
  if (S.stats.sold === 0) return 'CLICK HAULER > CLICK RIG TO LOAD > CLICK HELIX OR NOVA TO SELL';
  return null;
}
function drawHint() {
  const h = tutorialHint();
  if (!h) return;
  const w = tw(h) + 10;
  panel(320 - w / 2 | 0, 54, w, 11, P.black, P.yellow);
  txt(h, 320, 57, blink() ? P.yellow : P.white, 1, 'c');
}
function drawPlotButtons() {
  for (const p of S.plots) {
    if (p.owner) continue;
    const cx = p.x0 + PLOT_W / 2;
    rect(cx, SURF - 6, 1, 6, P.gray);
    button(cx - 27, SURF - 17, 54, 11, 'BUY $' + fmt(plotCost(p)), () => buyPlot(p), { color: P.teal, hc: P.green });
    if (has('survey')) {
      const rank = [...S.plots].sort((a, b) => b.oil - a.oil).indexOf(p);
      const [label, col] = rank < 2 ? ['RICH', P.lime] : rank < 4 ? ['FAIR', P.yellow] : ['POOR', P.red];
      txtS(label, cx, SURF - 25, col, 1, 'c');
    }
  }
}
function setTool(t) {
  if (t === 'blast' && S.blasts <= 0 && S.tool !== 'blast') { msg('NO BLASTER CHARGES LEFT - UPGRADE IT BETWEEN SECTORS', P.red); sfx('err'); return; }
  S.tool = S.tool === t ? null : t; S.sel = null; sfx('click');
}
function togglePause() { S.paused = !S.paused; S.help = false; sfx('click'); }
function cycleSpeed() { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; sfx('click'); }
function toggleSfx() { Sound.sfx = !Sound.sfx; Sound.savePrefs(); sfx('click'); }
function toggleMusic() { Sound.music = !Sound.music; Sound.init(); if (Sound.music) Sound.startMusic(); else Sound.stopMusic(); Sound.savePrefs(); }
function toggleCrt() { crt.classList.toggle('off'); Sound.savePrefs(); sfx('click'); }
function drawBottomBar() {
  rect(0, 341, W, 19, P.navy); rect(0, 341, W, 1, P.dgray);
  const by = 344, bh = 13;
  drawPortrait(CHAR().look, 3, 342, 1);
  rect(2, 341, 18, 1, abilReady() ? P.yellow : P.dgray);
  let x = 22;
  button(x, by, 58, bh, pk('rig') ? '1 RIG FREE' : '1 RIG $' + COST.rig, () => setTool('rig'), { active: S.tool === 'rig', tc: pk('rig') ? P.lime : P.white }); x += 60;
  button(x, by, 62, bh, '2 SILO $' + COST.silo, () => setTool('silo'), { active: S.tool === 'silo' }); x += 64;
  button(x, by, 74, bh, '3 HAULER $' + COST.hauler, buyHauler); x += 76;
  button(x, by, 58, bh, '4 SCAN $' + st.scanCost(), () => setTool('scan'), { active: S.tool === 'scan' }); x += 60;
  button(x, by, 66, bh, '5 BLAST ' + S.blasts + '/' + st.blastMax(), () => setTool('blast'), { active: S.tool === 'blast', color: S.blasts ? P.red : P.dgray, hc: P.orange }); x += 68;
  drawAbilityButton(x, by, 92, bh); x += 94;
  button(x, by, 62, bh, '6 BLACK MKT', () => { S.bm = true; S.tool = null; sfx('click'); }, { color: '#2a1420', hc: P.plum, tc: P.orange });
  button(W - 130, by, 26, bh, S.paused ? '>' : 'II', togglePause);
  button(W - 102, by, 26, bh, 'X' + S.speed, cycleSpeed, { active: S.speed > 1 });
  button(W - 74, by, 34, bh, Sound.sfx ? 'SFX' : 'sfx', toggleSfx, { tc: Sound.sfx ? P.white : P.gray });
  button(W - 38, by, 34, bh, Sound.music ? 'MUS' : 'mus', toggleMusic, { tc: Sound.music ? P.white : P.gray });
  if (inRect(mouse, 2, 341, 438, 19) && (mouse.x < 20 || mouse.x >= 350)) drawCharTip();
}
function haulerLabel(h) {
  switch (h.state) {
    case 'idle': return h.cargo > 0 ? 'IDLE (HAS CARGO)' : 'IDLE';
    case 'toLoad': return 'FLYING TO PICKUP';
    case 'loading': return h.wait > 1 ? 'WAITING FOR CRUDE' : 'LOADING';
    case 'full': return 'FULL - SEND IT TO A STATION';
    case 'toSell': return 'FLYING TO ' + h.target.name;
    case 'selling': return 'SELLING AT ' + h.target.name;
  }
  return '';
}
function drawSelPanel() {
  selPanelRect = null;
  let lines = null, btns = [];
  if (S.tool) {
    lines = [{ rig: 'BUILD RIG: CLICK ON LAND YOU OWN', silo: 'BUILD SILO: PLACE NEXT TO YOUR RIGS', scan: 'SCAN: CLICK ANYWHERE ON THE SURFACE', blast: 'ROCK BLASTER: CLICK UNDERGROUND (' + S.blasts + ' CHARGES LEFT)' }[S.tool], 'RIGHT-CLICK OR ESC TO CANCEL'];
  } else if (S.sel) {
    const o = S.sel.ref;
    if (S.sel.kind === 'rig') {
      let live = 0; for (const id of o.pockets) live += S.pockets[id].amt;
      const state = o.offline > 0 ? 'OFFLINE ' + o.offline + ' DAYS' : o.drilling ? 'DRILLING' : o.pumping ? 'PUMPING' : o.tank >= st.rigCap() - 0.01 ? 'TANK FULL' : 'IDLE';
      lines = ['RIG #' + o.id + ' - ' + state, 'TANK ' + fmt(o.tank) + '/' + st.rigCap() + '   CRUDE LEFT IN POCKETS ' + fmt(live) + 'U', 'CLICK UNDERGROUND TO DRILL. DRAG FROM A PIPE TO BRANCH'];
      btns = [['STOP DRILL', () => stopDrill(o), !activeSeg(o)], ['SCRAP +$' + Math.round(COST.rig * 0.4), () => scrapRig(o), false]];
    } else if (S.sel.kind === 'hauler') {
      lines = ['HAULER - ' + haulerLabel(o), 'CARGO ' + fmt(o.cargo) + '/' + st.hCap() + (has('auto') && o.home ? '   AUTOPILOT ROUTE SET' : ''), 'CLICK A RIG OR SILO TO LOAD, A STATION TO SELL'];
    } else if (S.sel.kind === 'silo') {
      lines = ['SILO - ' + fmt(o.tank) + '/' + st.siloCap(), 'RIGS WITHIN 16M PIPE THEIR CRUDE IN HERE', 'SEND HAULERS HERE TO LOAD'];
    }
  }
  if (!lines) return;
  const x = 186, y = 312, w = 300, h = 27;
  selPanelRect = [x, y, w, h];
  panel(x, y, w, h, P.navy, P.gray);
  lines.forEach((l, i) => txt(l, x + 4, y + 3 + i * 8, i === 0 ? P.white : P.lgray));
  btns.forEach(([label, fn, dis], i) => button(x + w - 58, y + 2 + i * 12, 55, 11, label, fn, { disabled: dis, color: i ? P.red : P.dblue }));
}
function drawTooltip() {
  if (S.tool || S.drag || overUI()) return;
  const lines = [];
  const m = mouse;
  if (m.y > UG_TOP && m.y < UG_BOT) {
    const ci = cellIndexAt(m.x, m.y);
    if (ci >= 0 && S.rev[ci]) {
      const t = S.grid[ci];
      if (t === T_OIL) { const p = S.pockets[S.pid[ci]]; lines.push(p.amt > 0 ? 'VOIDCRUDE POCKET' : 'DRAINED POCKET', fmt(p.amt) + ' / ' + fmt(p.cap) + ' UNITS'); }
      else if (t === T_ROCK) lines.push('SOLID ROCK', st.rock() ? 'LASER BORE CAN CUT IT' : 'BLOCKS DRILLS - BLAST IT [5]');
      else if (t === T_GAS) lines.push('GAS POCKET', has('gas') ? 'SIPHON READY - WORTH $$$' : 'DANGER: BLOWOUT!');
    }
  } else if (m.y > 13 && m.y < SURF + 4) {
    const s = S.stations.find(s => (Math.abs(m.x - s.x) <= 26 && m.y > SURF - 44) || (m.y < 58 && Math.abs(m.x - (s.x < 320 ? 31 : W - 31)) <= 29));
    if (s) {
      lines.push(s.name + ' REFINERY', s.closed > 0 ? 'CLOSED ' + s.closed + ' DAYS' : 'PAYS $' + price(s).toFixed(2) + ' / UNIT');
      if (s.job) lines.push('CONTRACT: ' + Math.floor(s.job.done) + '/' + s.job.units + 'U BY DAY ' + s.job.deadline, 'REWARD $' + fmt(s.job.cred) + ' + ' + s.job.rd + ' RD');
    }
    else if (m.y > SURF - 30) {
      const p = plotAt(m.x);
      if (p && p.owner) lines.push('PLOT ' + (p.i + 1) + (p.owner === 'you' ? ' - YOURS' : ' - ' + RIVALS[p.owner].name));
    }
  }
  if (!lines.length) return;
  const w = Math.max(...lines.map(l => tw(l))) + 8, h = lines.length * 8 + 4;
  const x = clamp(m.x + 10, 0, W - w), y = clamp(m.y + 10, 14, 340 - h);
  panel(x | 0, y | 0, w, h, P.black, P.gray);
  lines.forEach((l, i) => txt(l, x + 4, y + 3 + i * 8, i ? P.lgray : P.white));
}
function wrap(str, n) {
  const out = [];
  let line = '';
  for (const w of str.split(' ')) {
    if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}
function drawPerkChips() {
  let x = 4;
  const y = 331;
  for (const p of PERKS) {
    const n = S.perks[p.id];
    if (!n) continue;
    const label = p.name + (n > 1 ? ' X' + n : '');
    const w = tw(label) + 6;
    if (x + w > 182) break;
    rect(x, y, w, 9, P.black); rect(x, y, 1, 9, RARITY[p.r].col);
    txt(label, x + 4, y + 2, RARITY[p.r].col);
    x += w + 2;
  }
}
function drawCards() {
  rect(0, 0, W, H, 'rgba(5,5,15,0.8)');
  txtS('RANK UP!', 320, 52, P.yellow, 3, 'c');
  txt('YOU REACHED RANK ' + (S.rank - S.pending + 1) + ' - PICK ONE PERK (KEYS 1-3)', 320, 74, P.lgray, 1, 'c');
  S.choice.forEach((p, i) => {
    const w = 124, h = 170, x = 320 - (S.choice.length * (w + 12) - 12) / 2 + i * (w + 12);
    const hov = inRect(mouse, x, 92, w, h), y = hov ? 88 : 92;
    const rc = RARITY[p.r].col;
    rect(x - 1, y - 1, w + 2, h + 2, P.black);
    rect(x, y, w, h, rc);
    rect(x + 2, y + 2, w - 4, h - 4, hov ? P.dblue : P.navy);
    txt(RARITY[p.r].name, x + w / 2, y + 7, rc, 1, 'c');
    rect(x + 22, y + 18, w - 44, 44, P.black);
    rect(x + 23, y + 19, w - 46, 1, rc);
    txtS(p.icon, x + w / 2, y + 28, rc, 5, 'c');
    wrap(p.name, 22).forEach((l, k) => txtS(l, x + w / 2, y + 72 + k * 10, P.white, 1, 'c'));
    wrap(p.desc, 28).forEach((l, k) => txt(l, x + w / 2, y + 94 + k * 8, P.lgray, 1, 'c'));
    if (p.instant) txt('INSTANT', x + w / 2, y + h - 26, P.lime, 1, 'c');
    txt('[' + (i + 1) + ']', x + w / 2, y + h - 14, hov ? P.yellow : P.gray, 1, 'c');
    BTN.push({ x, y: 92, w, h, fn: () => pickPerk(i) });
  });
}
function drawPauseMenu() {
  rect(0, 0, W, H, 'rgba(5,5,15,0.72)');
  const w = 180, h = 112, x = (W - w) / 2, y = 110;
  panel(x, y, w, h, P.navy, P.crude);
  txtS('PAUSED', W / 2, y + 8, P.crudeL, 2, 'c');
  button(x + 20, y + 28, w - 40, 14, 'RESUME', togglePause);
  button(x + 20, y + 46, w - 40, 14, 'HOW TO PLAY', () => { S.help = true; S.paused = false; });
  button(x + 20, y + 64, w - 40, 14, 'CRT EFFECT: ' + (crt.classList.contains('off') ? 'OFF' : 'ON'), toggleCrt);
  button(x + 20, y + 86, w - 40, 14, 'QUIT TO TITLE (LOSE SECTOR)', () => { screen = 'title'; S = null; }, { color: P.red, hc: P.orange });
}
function drawHelpPanel(onClose) {
  rect(0, 0, W, H, 'rgba(5,5,15,0.82)');
  const w = 400, h = 210, x = (W - w) / 2, y = 60;
  panel(x, y, w, h, P.navy, P.crude);
  txtS('HOW TO PLAY', W / 2, y + 7, P.crudeL, 2, 'c');
  HELP.forEach((l, i) => txt(l, x + 12, y + 24 + i * 8, l.startsWith('KEYS') ? P.cyan : P.white));
  button(W / 2 - 40, y + h - 18, 80, 13, 'CLOSE', onClose);
}
function renderPlay() {
  ctx.save();
  if (S.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * S.shake), Math.round((Math.random() - 0.5) * S.shake));
  ctx.drawImage(S.skyC, 0, 0);
  for (const s of S.twinkles) if (((GT * s.f + s.p) % 1) < 0.5) rect(s.x, s.y, 1, 1, P.white);
  ctx.drawImage(S.dirtC, 0, UG_TOP);
  drawOil();
  ctx.drawImage(S.fogC, 0, UG_TOP);
  drawPlotLines();
  drawScanWaves();
  drawPipes();
  drawPreview();
  for (const s of S.stations) drawStation(s);
  drawPlotFlags();
  drawLinks();
  for (const s of S.silos) drawSilo(s);
  for (const sc of S.scans) drawScanner(sc);
  for (const r of S.rigs) drawRig(r);
  drawSelection();
  for (const h of S.haulers) drawHauler(h);
  drawGhost();
  for (const p of S.parts) rect(p.x | 0, p.y | 0, p.size, p.size, p.color);
  for (const f of S.floats) { ctx.globalAlpha = Math.min(1, f.life); txtS(f.text, f.x, f.y | 0, f.color, 1, 'c'); }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawStationPanels();
  drawTopBar();
  drawMessages();
  drawHint();
  drawPlotButtons();
  drawBottomBar();
  drawPerkChips();
  drawSelPanel();
  drawTooltip();
  drawTaunt();
  if (S.abil.on > 0) txtS(CHAR().active.name + ' ACTIVE - ' + S.abil.on + ' DAYS', 320, 304, blink() ? P.yellow : P.orange, 1, 'c');
  if (S.bm) drawBlackMarket();
  if (S.choice) drawCards();
  if (S.paused) drawPauseMenu();
  if (S.help) drawHelpPanel(() => { S.help = false; });
}

// ---------------------------------------------------------------- other screens
const TS = { stars: Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.15 + Math.random() * 0.85 })), hx: -20, help: false };
function starfield(speed = 1) {
  rect(0, 0, W, H, '#05050f');
  for (const s of TS.stars) {
    s.x -= s.z * 0.4 * speed; if (s.x < 0) { s.x += W; s.y = Math.random() * H; }
    rect(s.x | 0, s.y | 0, 1, 1, s.z > 0.75 ? P.white : s.z > 0.45 ? P.lgray : P.gray);
  }
}
function bigTitle(text, y, scale) {
  const w = tw(text, scale), x = (W - w) / 2;
  txt(text, x + scale, y + scale, P.plum, scale);
  txt(text, x, y, P.crude, scale);
  ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, scale * 2); ctx.clip();
  txt(text, x, y, P.crudeG, scale);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, y + scale * 2, W, scale); ctx.clip();
  txt(text, x, y, P.crudeL, scale);
  ctx.restore();
}
function renderTitle() {
  starfield();
  if (!PLANET) PLANET = makePlanet(26);
  ctx.drawImage(PLANET, 470, 40);
  // ground scene
  rect(0, 300, W, 60, '#2c2026');
  for (let x = 0; x < W; x++) { rect(x, 300, 1, 1, '#8a6352'); rect(x, 301, 1, 2, '#5b4038'); }
  for (let k = 0; k < 5; k++) drawRig({ x: 80 + k * 120, owner: k === 3 ? 'syn' : k === 1 ? 'hex' : 'deco', id: k, offline: 0, pumping: true, tank: 0 }, 300);
  for (let k = 0; k < 7; k++) {
    const x = 60 + k * 85, y = 320 + (k % 3) * 9, w = 14 + (k % 4) * 5;
    rect(x, y, w, 5, P.crude); rect(x, y, w, 1, ((GT * 4 + k) | 0) % 4 ? P.crudeL : P.crudeG);
  }
  TS.hx += 0.7; if (TS.hx > W + 20) TS.hx = -20;
  drawHauler({ x: TS.hx, y: 262, dir: 1, cargo: 10, state: 'toSell', moving: true, id: 1, wait: 0 });
  bigTitle('VOIDCRUDE', 52, 6);
  txt('AN ASTEROID DRILLING TYCOON', 320, 96, P.cyan, 1, 'c');
  let y = 122;
  button(250, y, 140, 16, 'NEW GAME', () => { screen = 'charselect'; TS.pickChar = TS.pickChar || 'rusty'; sfx('buy'); }); y += 20;
  if (hasSave()) { button(250, y, 140, 16, 'CONTINUE', () => { if (loadGame()) { screen = 'shop'; sfx('buy'); } }); y += 20; }
  button(250, y, 140, 16, 'LEGACY  (' + META.legacy + ' PTS)', () => { screen = 'legacy'; sfx('click'); }, { color: P.plum, hc: P.crude }); y += 20;
  button(250, y, 140, 16, 'HOW TO PLAY', () => { TS.help = true; sfx('click'); }); y += 20;
  button(250, y, 68, 13, 'SFX ' + (Sound.sfx ? 'ON' : 'OFF'), toggleSfx);
  button(322, y, 68, 13, 'MUSIC ' + (Sound.music ? 'ON' : 'OFF'), toggleMusic);
  y += 17;
  button(250, y, 140, 13, 'CRT ' + (crt.classList.contains('off') ? 'OFF' : 'ON'), toggleCrt);
  txt('PROGRESS SAVES IN THIS BROWSER BETWEEN SECTORS   RUNS ' + META.runs + '   WINS ' + META.wins, 320, 344, P.gray, 1, 'c');
  if (TS.help) drawHelpPanel(() => { TS.help = false; });
}
function row(label, value, y, col = P.white) {
  txt(label, 200, y, P.lgray);
  for (let x = 200 + tw(label) + 4; x < 430 - tw(value) - 4; x += 4) rect(x, y + 4, 1, 1, P.dgray);
  txt(value, 440, y, col, 1, 'r');
}
function renderSummary() {
  starfield(0.3);
  const r = G.report;
  panel(180, 22, 280, 300, P.navy, P.crude);
  txtS('SECTOR ' + r.sector + ' COMPLETE', 320, 32, P.crudeL, 2, 'c');
  txt(r.name, 320, 50, P.cyan, 1, 'c');
  let y = 66;
  const profit = r.revenue + r.gas + r.fire - r.spent;
  row('CRUDE SOLD', fmt(r.sold) + ' U', y); y += 11;
  row('SALES + CONTRACTS', '$' + fmt(r.revenue), y, P.yellow); y += 11;
  row('GAS SIPHONED', '$' + fmt(r.gas), y, P.cyan); y += 11;
  row('LEFTOVER FIRE SALE (' + fmt(r.crude) + 'U AT 40%)', '$' + fmt(r.fire), y, P.yellow); y += 11;
  row('EXPENSES', '-$' + fmt(r.spent), y, P.red); y += 11;
  rect(200, y, 240, 1, P.gray); y += 5;
  row('NET PROFIT', (profit < 0 ? '-$' : '$') + fmt(Math.abs(profit)), y, profit >= 0 ? P.lime : P.red); y += 16;
  row('PEAK RANK', '' + (r.rank || 0), y, P.yellow); y += 11;
  row('CONTRACTS COMPLETED', '' + (r.jobs || 0), y, P.lime); y += 11;
  row('RESEARCH EARNED (INCL +' + (r.rdBonus || 0) + ' BONUS)', (r.rd || 0) + ' RD', y, P.cyan); y += 16;
  for (const rr of (r.rivals || [])) {
    if (!rr.active && !rr.bought) continue;
    row(RIVALS[rr.id].short + (rr.active ? ' PUMPED ' + fmt(rr.pumped) + 'U' : ' (ELSEWHERE)'), '+' + rr.bought + ' SH = ' + G.rshares[rr.id], y, rcol(rr.id)); y += 11;
  }
  row('YOUR SHARES', '' + G.shares, y, P.cyan); y += 14;
  if (r.stipend) { txt('THE CONSORTIUM SENT AN EMERGENCY STIPEND: $' + fmt(r.stipend), 320, y, P.orange, 1, 'c'); y += 10; }
  txt('$' + fmt(G.credits) + '   ' + G.rd + ' RD', 320, y + 2, P.yellow, 2, 'c');
  button(250, 300, 140, 16, 'CONTINUE', () => { if (G.rshares[topRival()] >= 51) endRun(false); else screen = 'shop'; sfx('click'); });
}
function buyShares(n) {
  let k = 0;
  while (k < n && G.shares + rivalTotal() < 100 && G.credits >= sharePrice()) { G.credits -= sharePrice(); G.shares++; k++; if (G.shares >= 51) break; }
  if (!k) { sfx('err'); return; }
  sfx('cash');
  if (G.shares >= 25) unlock('shares');
  save();
  if (G.shares >= 51) { endRun(true); sfx('fanfare'); }
}

// tech tree layout: 4 branch columns, prerequisite lines routed in "lanes" left of each column
const TREE = { colX: b => 14 + b * 98, nodeX: b => 24 + b * 98, nodeY: r => 50 + r * 33, nw: 84, nh: 28, lanes: [] };
(function routeLanes() {
  const edges = [];
  for (const t of TECH) for (const q of t.req) {
    const p = TECH.find(x => x.id === q);
    edges.push({ b: t.b, from: p.row, to: t.row, src: q, dst: t.id });
  }
  edges.sort((a, b) => (a.to - a.from) - (b.to - b.from));
  const used = {};
  for (const e of edges) {
    for (let lane = 0; ; lane++) {
      const key = e.b + ':' + lane;
      const occ = used[key] || [];
      if (occ.every(o => e.to <= o.from || e.from >= o.to)) { occ.push(e); used[key] = occ; e.lane = lane; break; }
    }
  }
  TREE.lanes = edges;
})();
let shopTab = 'tech';
function drawTechTree() {
  let hover = null;
  BRANCHES.forEach((br, b) => txt(br.name, TREE.nodeX(b) + TREE.nw / 2, 40, br.col, 1, 'c'));
  // prerequisite lines
  for (const e of TREE.lanes) {
    const lit = has(e.src);
    const col = lit ? BRANCHES[e.b].col : P.dgray;
    const lx = TREE.nodeX(e.b) - 3 - e.lane * 3;
    const y1 = TREE.nodeY(e.from) + 14, y2 = TREE.nodeY(e.to) + 14;
    rect(lx, y1, 1, y2 - y1 + 1, col);
    rect(lx, y1, TREE.nodeX(e.b) - lx, 1, col);
    rect(lx, y2, TREE.nodeX(e.b) - lx, 1, col);
    rect(TREE.nodeX(e.b) - 2, y2 - 1, 1, 3, col);
  }
  for (const t of TECH) {
    const x = TREE.nodeX(t.b), y = TREE.nodeY(t.row), w = TREE.nw, h = TREE.nh;
    const s = techState(t), bc = BRANCHES[t.b].col;
    const hov = inRect(mouse, x, y, w, h);
    if (hov) hover = t;
    const edge = s === 'owned' ? bc : s === 'ready' ? (blink() ? P.yellow : bc) : s === 'locked' ? P.dgray : P.gray;
    const bg = s === 'owned' ? '#2b2d4a' : s === 'locked' ? '#121322' : hov ? P.dblue : P.navy;
    rect(x, y, w, h, edge);
    rect(x + 1, y + 1, w - 2, h - 2, bg);
    if (s === 'owned') rect(x + 1, y + 1, 2, h - 2, bc);
    if (t.cap) brackets(x - 2, y - 2, w + 4, h + 4, s === 'owned' ? P.yellow : P.orange);
    txt(t.name, x + 5, y + 5, s === 'locked' ? P.gray : P.white);
    const status = s === 'owned' ? 'RESEARCHED' : s === 'locked' ? 'LOCKED  ' + t.cost + ' RD' : t.cost + ' RD';
    txt(status, x + 5, y + 16, s === 'owned' ? P.lime : s === 'ready' ? P.cyan : s === 'poor' ? P.red : P.gray);
    if (t.cap) txt('CAP', x + w - 4, y + 16, P.orange, 1, 'r');
    BTN.push({ x, y, w, h, fn: () => buyTech(t) });
  }
  // rock blaster track
  const by = 282;
  panel(12, by, 388, 17, '#2a1420', P.red);
  txt('ROCK BLASTER', 17, by + 6, P.orange);
  for (let k = 0; k < BLAST_MAX; k++) rect(70 + k * 8, by + 5, 6, 7, k < G.blaster ? P.orange : k < BLAST_MIN ? P.red : P.dgray);
  txt('RADIUS ' + blastRadius(G.blaster), 154, by + 6, P.lgray);
  const bmax = G.blaster >= BLAST_MAX;
  if (inRect(mouse, 12, by, 388, 17)) hover = 'blaster';
  if (bmax) txt('FULLY UPGRADED', 394, by + 6, P.lime, 1, 'r');
  else button(268, by + 2, 129, 13, '+1 CHARGE  ' + blasterCost(G.blaster) + ' RD', buyBlaster, { disabled: G.rd < blasterCost(G.blaster), color: P.red, hc: P.orange });
  // detail
  const dy = 303;
  rect(12, dy, 388, 26, '#10111e');
  if (hover === 'blaster') {
    txt('ROCK BLASTER - ' + G.blaster + ' CHARGES PER SECTOR (MAX ' + BLAST_MAX + ')', 17, dy + 4, P.orange);
    txt('PRESS [5] IN A SECTOR AND CLICK UNDERGROUND TO SHATTER ROCK AND IGNITE GAS.', 17, dy + 12, P.lgray);
    txt('BLAST RADIUS GROWS AT 6 AND 9 CHARGES.', 17, dy + 19, P.lgray);
  } else if (hover) {
    const t = hover, s = techState(t);
    txt(t.name + (t.cap ? '  (CAPSTONE)' : ''), 17, dy + 4, BRANCHES[t.b].col);
    txt(t.desc, 17, dy + 12, P.white);
    const req = t.req.length ? 'REQUIRES: ' + t.req.map(id => TECH.find(x => x.id === id).name).join(' + ') : 'NO REQUIREMENTS';
    txt(s === 'owned' ? 'RESEARCHED' : req + '   COST ' + t.cost + ' RD' + (s === 'ready' ? ' - CLICK TO RESEARCH' : ''), 17, dy + 19, s === 'owned' ? P.lime : s === 'locked' ? P.red : P.cyan);
  } else {
    txt('EARN RESEARCH DATA (RD) BY STRIKING CRUDE, SELLING (1 PER 25U),', 17, dy + 5, P.lgray);
    txt('COMPLETING CONTRACTS, FINISHING SECTORS AND ACHIEVEMENTS.', 17, dy + 14, P.lgray);
  }
}
function drawAchievements() {
  ACH.forEach((a, i) => {
    const x = 12 + (i % 2) * 196, y = 38 + ((i / 2) | 0) * 32, got = !!G.ach[a.id];
    rect(x, y, 190, 28, got ? P.yellow : P.dgray);
    rect(x + 1, y + 1, 188, 26, got ? '#2b2a20' : '#121322');
    txt(a.name, x + 6, y + 6, got ? P.yellow : P.lgray);
    txt(a.desc, x + 6, y + 16, got ? P.white : P.gray);
    txt('+' + a.rd + ' RD', x + 184, y + 6, got ? P.lime : P.cyan, 1, 'r');
    if (got) txt('DONE', x + 184, y + 16, P.lime, 1, 'r');
  });
}
function renderShop() {
  starfield(0.2);
  rect(0, 0, W, 14, P.navy);
  txt('ORBITAL EXCHANGE - PREPARING FOR SECTOR ' + G.sector + ': ' + sectorName(G.sector), 6, 5, P.cyan);
  txt('$' + fmt(G.credits), W - 6, 5, P.yellow, 1, 'r');
  txt(G.rd + ' RD', W - 70, 5, P.cyan, 1, 'r');
  panel(6, 20, 400, 312, P.navy, P.gray);
  const got = ACH.filter(a => G.ach[a.id]).length;
  button(10, 23, 86, 11, 'TECH TREE', () => { shopTab = 'tech'; sfx('click'); }, { active: shopTab === 'tech' });
  button(100, 23, 120, 11, 'ACHIEVEMENTS ' + got + '/' + ACH.length, () => { shopTab = 'ach'; sfx('click'); }, { active: shopTab === 'ach' });
  txt('RESEARCH: ' + G.rd + ' RD', 400, 26, P.cyan, 1, 'r');
  if (shopTab === 'tech') drawTechTree(); else drawAchievements();
  // shares
  panel(414, 20, 220, 312, P.navy, P.gray);
  txt('COLONIAL CONSORTIUM', 524, 26, P.crudeL, 1, 'c');
  txt('OWN 51 SHARES TO RULE THE BELT', 524, 35, P.lgray, 1, 'c');
  const gx = 474, gy = 46;
  const owners = [];
  for (let k = 0; k < G.shares; k++) owners.push(P.cyan);
  while (owners.length < 100 - rivalTotal()) owners.push(P.dgray);
  for (const id of RIVAL_IDS) for (let k = 0; k < G.rshares[id]; k++) owners.push(rcol(id));
  for (let k = 0; k < 100; k++) rect(gx + (k % 10) * 10, gy + ((k / 10) | 0) * 10, 8, 8, owners[k] || P.dgray);
  rect(gx - 3, gy + 50 - 1, 105, 1, P.yellow);
  txt('51', gx - 6, gy + 47, P.yellow, 1, 'r');
  let y = 154;
  txt('YOU', 430, y, P.cyan); txt(G.shares + ' SHARES', 620, y, P.cyan, 1, 'r'); y += 9;
  for (const id of RIVAL_IDS) { txt(RIVALS[id].name, 430, y, rcol(id)); txt(G.rshares[id] + ' SHARES', 620, y, rcol(id), 1, 'r'); y += 9; }
  txt('UNOWNED', 430, y, P.lgray); txt((100 - G.shares - rivalTotal()) + ' SHARES', 620, y, P.lgray, 1, 'r'); y += 12;
  txt('PRICE PER SHARE', 430, y, P.white); txt('$' + fmt(sharePrice()), 620, y, P.yellow, 1, 'r'); y += 9;
  txt('PRICE RISES 5% PER SHARE SOLD', 430, y, P.gray); y += 14;
  const can = G.credits >= sharePrice();
  button(430, y, 60, 15, 'BUY 1', () => buyShares(1), { disabled: !can }); button(494, y, 60, 15, 'BUY 5', () => buyShares(5), { disabled: !can }); button(558, y, 64, 15, 'BUY MAX', () => buyShares(100), { disabled: !can });
  y += 22;
  if (G.report) {
    const r = G.report, profit = r.revenue + r.gas + r.fire - r.spent;
    txt('LAST SECTOR PROFIT', 430, y, P.lgray); txt((profit < 0 ? '-$' : '$') + fmt(Math.abs(profit)), 620, y, profit >= 0 ? P.lime : P.red, 1, 'r'); y += 9;
    txt('LIFETIME EARNINGS', 430, y, P.lgray); txt('$' + fmt(G.totalEarned), 620, y, P.yellow, 1, 'r'); y += 14;
  }
  txt('RIVALS BUY SHARES WITH WHAT THEY', 430, y, P.gray); y += 8;
  txt('PUMP. ANY RIVAL AT 51 = GAME OVER.', 430, y, P.gray);
  button(6, 338, 120, 16, 'SAVE & EXIT', () => { save(); screen = 'title'; sfx('click'); }, { color: P.dgray });
  button(414, 338, 220, 16, 'CHOOSE SECTOR ' + G.sector + ' >>', () => { screen = 'sectorpick'; sfx('click'); }, { color: P.green, hc: P.lime, tc: P.navy });
}
function renderEnd(win) {
  starfield(win ? 1.5 : 0.2);
  if (win && Math.random() < 0.15) {
    const x = 80 + Math.random() * 480, y = 60 + Math.random() * 120, c = pick([P.crudeL, P.yellow, P.cyan, P.lime]);
    TS.fw = TS.fw || []; for (let k = 0; k < 30; k++) { const a = Math.random() * 6.28, v = 20 + Math.random() * 40; TS.fw.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2, c }); }
  }
  if (TS.fw) { for (const p of TS.fw) { p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 0.5; p.life -= 1 / 60; rect(p.x | 0, p.y | 0, 1, 1, p.c); } TS.fw = TS.fw.filter(p => p.life > 0); }
  bigTitle(win ? 'VICTORY' : 'DEFEAT', 90, 6);
  if (win) {
    txt('YOU CONTROL ' + G.shares + ' SHARES OF THE COLONIAL CONSORTIUM.', 320, 150, P.white, 1, 'c');
    txt('THE BELT IS YOURS, TYCOON. EVERY DROP OF VOIDCRUDE FLOWS THROUGH YOU.', 320, 162, P.cyan, 1, 'c');
    txt('SECTORS DRILLED: ' + (G.sector - 1) + '   LIFETIME EARNINGS: $' + fmt(G.totalEarned), 320, 182, P.yellow, 1, 'c');
  } else {
    const tr = topRival();
    drawPortrait(RIVALS[tr].look, 304, 196, 2);
    txt(RIVALS[tr].name + ' NOW HOLDS ' + G.rshares[tr] + ' SHARES OF THE CONSORTIUM.', 320, 150, rcol(tr), 1, 'c');
    txt('YOUR LICENSES ARE REVOKED. YOUR RIGS ARE SCRAP.', 320, 162, P.red, 1, 'c');
    txt('SECTORS DRILLED: ' + (G.sector - 1) + '   LIFETIME EARNINGS: $' + fmt(G.totalEarned), 320, 182, P.yellow, 1, 'c');
  }
  txtS('+' + (G.legacyEarned || 0) + ' LEGACY POINTS', 320, 238, P.crudeL, 2, 'c');
  txt('SPEND THEM ON THE TITLE SCREEN TO START YOUR NEXT RUN STRONGER', 320, 258, P.lgray, 1, 'c');
  button(250, 276, 140, 16, 'TITLE SCREEN', () => { screen = 'title'; TS.fw = null; sfx('click'); });
}

// ---------------------------------------------------------------- tycoon HUD, taunts, black market
function abilReady() { return S.abil.cd <= 0; }
function drawAbilityButton(x, y, w, h) {
  const a = CHAR().active, on = S.abil.on > 0, ready = abilReady();
  const label = on ? a.name + ' ' + S.abil.on + 'D' : ready ? 'Q ' + a.name : a.name + ' ' + Math.ceil(S.abil.cd) + 'D';
  button(x, y, w, h, label, useAbility, { color: on ? P.green : ready ? P.plum : P.dgray, hc: ready ? P.crude : P.gray, tc: ready || on ? P.white : P.gray, active: ready && blink() });
  if (!ready && !on) rect(x + 1, y + h - 3, Math.round((w - 2) * (1 - S.abil.cd / a.cd)), 2, P.crudeL);
}
function drawCharTip() {
  const c = CHAR(), a = c.active;
  const lines = [[c.name + ' - ' + c.title, P.yellow], ['PASSIVE: ' + c.passive, P.white], ['[Q] ' + a.name + ': ' + a.desc, P.crudeL], ['COOLDOWN ' + a.cd + ' DAYS', P.lgray]];
  const w = Math.max(...lines.map(l => tw(l[0]))) + 10, h = lines.length * 8 + 6;
  panel(4, 338 - h, w, h, P.black, P.crude);
  lines.forEach((l, i) => txt(l[0], 9, 338 - h + 4 + i * 8, l[1]));
}
function drawTaunt() {
  const t = S.taunt;
  if (!t || GT - t.t > 5.5) return;
  const R = RIVALS[t.rid], age = GT - t.t;
  const slide = Math.min(1, age * 4, (5.5 - age) * 4);
  const x = Math.round(-200 + 204 * slide), y = 288;
  panel(x, y, 196, 40, P.black, R.col);
  drawPortrait(R.look, x + 4, y + 4, 2);
  txt(R.boss, x + 42, y + 5, R.col);
  txt(R.name, x + 42 + tw(R.boss) + 6, y + 5, P.gray);
  wrap('"' + t.text + '"', 36).forEach((l, i) => txt(l, x + 42, y + 15 + i * 8, P.white));
}
function drawBlackMarket() {
  rect(0, 0, W, H, 'rgba(5,5,15,0.78)');
  const w = 400, h = 214, x = (W - w) / 2, y = 64;
  panel(x, y, w, h, '#160c14', P.orange);
  txtS('BLACK MARKET', W / 2, y + 7, P.orange, 2, 'c');
  txt('NO QUESTIONS ASKED. PRICES RISE EACH TIME YOU BUY.' + (isChar('grane') ? ' (SPY DISCOUNT -40%)' : ''), W / 2, y + 24, P.lgray, 1, 'c');
  BLACK_MARKET.forEach((item, i) => {
    const ry = y + 36 + i * 40;
    rect(x + 8, ry, w - 16, 36, '#22121c');
    txt(item.name, x + 14, ry + 5, P.yellow);
    txt(item.desc, x + 14, ry + 14, P.lgray);
    const c = bmCost(item), can = G.credits >= c, used = item.id === 'short' && S.bmUses.short;
    txt(used ? 'USED THIS SECTOR' : '$' + fmt(c), x + w - 14, ry + 5, used ? P.gray : can ? P.yellow : P.red, 1, 'r');
    let targets;
    if (item.target === 'rival') targets = S.rivals.map(id => [RIVALS[id].short, id, rcol(id)]);
    else if (item.target === 'owner') targets = RIVAL_IDS.filter(id => G.rshares[id] > 0).map(id => [RIVALS[id].short + ' (' + G.rshares[id] + ')', id, rcol(id)]);
    else if (item.target === 'station') targets = S.stations.map(st2 => [st2.name, st2, P.cyan]);
    else targets = [['BUY', null, P.white]];
    let bx = x + 14;
    for (const [label, tgt, col] of targets) {
      const bw = tw(label) + 12;
      button(bx, ry + 22, bw, 11, label, () => bmBuy(item, tgt), { disabled: !can || used, color: '#3a1a2a', hc: P.plum, tc: col });
      bx += bw + 4;
    }
    if (!targets.length) txt('NO TARGETS', bx, ry + 25, P.gray);
  });
  button(W / 2 - 40, y + h - 17, 80, 13, 'CLOSE [6]', () => { S.bm = false; });
}

// ---------------------------------------------------------------- character select
function renderCharSelect() {
  starfield(0.4);
  txtS('CHOOSE YOUR TYCOON', 320, 8, P.crudeL, 2, 'c');
  txt('LEGACY POINTS: ' + META.legacy, W - 8, 10, P.yellow, 1, 'r');
  CHARACTERS.forEach((c, i) => {
    const x = 10 + (i % 3) * 210, y = 28 + ((i / 3) | 0) * 148, w = 200, h = 142;
    const owned = !!META.chars[c.id], sel = TS.pickChar === c.id, hov = inRect(mouse, x, y, w, h);
    panel(x, y, w, h, sel ? '#2b2d4a' : hov ? P.dblue : P.navy, sel ? P.yellow : owned ? P.gray : P.dgray);
    if (sel) brackets(x - 2, y - 2, w + 4, h + 4, blink() ? P.yellow : P.orange);
    drawPortrait(c.look, x + 6, y + 6, 3);
    txt(c.name, x + 60, y + 9, P.white);
    txt(c.title, x + 60, y + 18, P.cyan);
    txt('PASSIVE', x + 60, y + 32, P.yellow);
    wrap(c.passive, 33).forEach((l, k) => txt(l, x + 60, y + 40 + k * 8, P.lgray));
    txt('ACTIVE [Q]: ' + c.active.name, x + 6, y + 62, P.crudeL);
    wrap(c.active.desc, 46).forEach((l, k) => txt(l, x + 6, y + 71 + k * 8, P.white));
    txt('COOLDOWN ' + c.active.cd + ' DAYS', x + 6, y + 90, P.gray);
    if (owned) {
      BTN.push({ x, y, w, h, fn: () => { TS.pickChar = c.id; sfx('click'); } });
    } else {
      rect(x + 1, y + 100, w - 2, h - 101, 'rgba(10,10,20,0.6)');
      txt('LOCKED', x + w / 2, y + 108, P.red, 1, 'c');
      button(x + 40, y + 120, w - 80, 14, 'UNLOCK - ' + c.unlock + ' LEGACY', () => unlockChar(c), { disabled: META.legacy < c.unlock, color: P.plum, hc: P.crude });
    }
  });
  button(10, 334, 100, 16, '< BACK', () => { screen = 'title'; sfx('click'); }, { color: P.dgray });
  const c = CHARACTERS.find(x => x.id === TS.pickChar) || CHARACTERS[0];
  button(400, 334, 230, 16, 'START AS ' + c.name + ' >>', () => { newGame(c.id); sfx('fanfare'); }, { color: P.green, hc: P.lime, tc: P.navy });
}

// ---------------------------------------------------------------- legacy (prestige) shop
function renderLegacy() {
  starfield(0.3);
  txtS('LEGACY', 320, 10, P.crudeL, 3, 'c');
  txt('EVERY RUN - WIN OR LOSE - EARNS LEGACY POINTS. THESE BONUSES ARE PERMANENT.', 320, 32, P.lgray, 1, 'c');
  txtS(META.legacy + ' LEGACY POINTS', 320, 44, P.yellow, 2, 'c');
  LEGACY.forEach((l, i) => {
    const x = 20 + (i % 2) * 304, y = 66 + ((i / 2) | 0) * 52, w = 296, h = 46, v = lv(l.id), maxed = v >= l.max;
    panel(x, y, w, h, P.navy, maxed ? P.lime : P.gray);
    txt(l.name, x + 8, y + 7, P.white);
    for (let k = 0; k < l.max; k++) rect(x + 100 + k * 9, y + 7, 7, 6, k < v ? P.crudeL : P.dgray);
    txt(l.desc + (v ? '  (NOW X' + v + ')' : ''), x + 8, y + 18, P.lgray);
    if (maxed) txt('MAXED', x + w - 8, y + 30, P.lime, 1, 'r');
    else button(x + w - 108, y + 27, 100, 14, 'BUY - ' + l.cost(v) + ' PTS', () => buyLegacy(l), { disabled: META.legacy < l.cost(v), color: P.plum, hc: P.crude });
  });
  txt('LOCKED TYCOONS CAN BE UNLOCKED ON THE CHARACTER SCREEN.', 320, 230, P.cyan, 1, 'c');
  txt('POINTS: 5 PER RUN + 3 PER SECTOR SURVIVED + 1 PER 3 SHARES + 30 FOR A WIN', 320, 242, P.gray, 1, 'c');
  txt('RUNS ' + META.runs + '   WINS ' + META.wins, 320, 256, P.lgray, 1, 'c');
  button(270, 300, 100, 16, '< BACK', () => { screen = 'title'; sfx('click'); }, { color: P.dgray });
}

// ---------------------------------------------------------------- sector picker
function renderSectorPick() {
  starfield(0.6);
  txtS('CHOOSE YOUR NEXT SECTOR', 320, 8, P.crudeL, 2, 'c');
  txt('SECTOR ' + G.sector + ' - HARDER SECTORS PAY MORE RESEARCH', 320, 26, P.lgray, 1, 'c');
  const opts = sectorOptions();
  opts.forEach((o, i) => {
    const x = 10 + i * 210, y = 38, w = 200, h = 286, hov = inRect(mouse, x, y, w, h);
    panel(x, y, w, h, hov ? '#20223a' : P.navy, hov ? P.yellow : P.gray);
    txtS(o.name, x + w / 2, y + 8, P.cyan, 1, 'c');
    txt('RIVALS', x + 8, y + 24, P.red);
    o.rivals.forEach((id, k) => {
      const R = RIVALS[id], ry = y + 33 + k * 38;
      drawPortrait(R.look, x + 8, ry, 2);
      txt(R.name, x + 46, ry + 3, R.col);
      txt(R.boss, x + 46, ry + 12, P.lgray);
      wrap(R.trait, 36).forEach((l, j) => txt(l, x + 46, ry + 21 + j * 7, P.gray));
    });
    let my = y + 40 + o.rivals.length * 38;
    txt('CONDITIONS', x + 8, my, P.yellow); my += 10;
    if (!o.mods.length) { txt('STANDARD SECTOR', x + 8, my, P.lgray); my += 10; }
    for (const id of o.mods) {
      const m = MODS.find(m => m.id === id);
      txt(m.name, x + 8, my, P.white); my += 8;
      wrap(m.desc, 46).forEach(l => { txt(l, x + 8, my, P.lgray); my += 8; });
      my += 4;
    }
    txt('RESEARCH X' + o.rdMul.toFixed(2), x + w / 2, y + h - 36, o.rdMul > 1 ? P.lime : o.rdMul < 1 ? P.orange : P.white, 1, 'c');
    button(x + 30, y + h - 24, w - 60, 16, 'LAUNCH >>', () => { genSector(o); screen = 'play'; sfx('build'); }, { color: P.green, hc: P.lime, tc: P.navy });
  });
  button(10, 336, 100, 16, '< BACK', () => { screen = 'shop'; sfx('click'); }, { color: P.dgray });
}

// ---------------------------------------------------------------- input
function toLogical(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function rigAt(x, y) { return S.rigs.find(r => x >= r.x - 7 && x <= r.x + 10 && y >= SURF - 29 && y <= SURF + 2); }
function siloAt(x, y) { return S.silos.find(s => x >= s.x - 8 && x <= s.x + 8 && y >= SURF - 16 && y <= SURF + 2); }
function haulerAt(x, y) {
  let best = null, bd = 8;
  for (const h of S.haulers) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
  return best;
}
function stationAt(x, y) {
  for (const s of S.stations) {
    const x0 = s.x < 320 ? 2 : W - 60;
    if (Math.abs(x - s.x) <= 26 && y >= SURF - 46 && y <= SURF + 2) return s;
    if (x >= x0 && x <= x0 + 58 && y >= 15 && y <= 50) return s;
  }
  return null;
}
function pipeGrab(x, y) {
  let best = null, bd = 5;
  for (const r of myRigs()) {
    const n = nearestPoint(r, x, y);
    if (n.seg >= 0 && n.d < bd) { bd = n.d; best = { rig: r, start: n }; }
  }
  return best;
}
function playDown(p) {
  if (S.paused || S.help || S.choice || S.bm || S.tool) return;
  S.drag = null;
  if (!(S.sel && S.sel.kind === 'hauler')) {
    const h = haulerAt(p.x, p.y);
    if (h) { S.drag = { kind: 'hauler', h }; return; }
  }
  const r = rigAt(p.x, p.y);
  if (r && r.owner === 'you') { S.drag = { kind: 'pipe', rig: r, start: nearestPoint(r, r.x, SURF + 1) }; return; }
  if (p.y > UG_TOP) { const g = pipeGrab(p.x, p.y); if (g) S.drag = { kind: 'pipe', rig: g.rig, start: g.start }; }
}
function playUp(p) {
  if (S.paused || S.help || S.choice || S.bm) return;
  if (S.tool === 'blast') { if (p.y < 341) blast(p.x, p.y); return; }
  if (S.tool) { if (p.y > 13 && p.y < 341) placeAt(S.tool, Math.round(p.x / 4) * 4); return; }
  const d = S.drag; S.drag = null;
  if (d && mouse.moved) {
    if (d.kind === 'pipe' && p.y > UG_TOP) { orderDrill(d.rig, d.start, p.x, p.y); S.sel = { kind: 'rig', ref: d.rig }; return; }
    if (d.kind === 'hauler') { S.sel = { kind: 'hauler', ref: d.h }; clickWorld(p); return; }
  }
  clickWorld(p);
}
function clickWorld(p) {
  if (S.sel && S.sel.kind === 'hauler') {
    const h = S.sel.ref;
    const r = rigAt(p.x, p.y), si = siloAt(p.x, p.y), stn = stationAt(p.x, p.y);
    if (r) { if (r.owner !== 'you') { msg("THAT'S A " + RIVALS[r.owner].short + ' RIG', P.red); sfx('err'); } else { cmdLoad(h, r); S.sel = null; } return; }
    if (si) { cmdLoad(h, si); S.sel = null; return; }
    if (stn) { cmdSell(h, stn); S.sel = null; return; }
  }
  const h = haulerAt(p.x, p.y);
  if (h) { S.sel = { kind: 'hauler', ref: h }; sfx('click'); return; }
  if (S.sel && S.sel.kind === 'hauler' && p.y < SURF - 4 && p.y > 13) {
    const hh = S.sel.ref; hh.state = 'idle'; hh.target = null; hh.idleX = p.x; hh.idleY = Math.max(20, p.y); return;
  }
  const r = rigAt(p.x, p.y);
  if (r) { if (r.owner === 'you') { S.sel = { kind: 'rig', ref: r }; sfx('click'); } return; }
  const si = siloAt(p.x, p.y);
  if (si) { S.sel = { kind: 'silo', ref: si }; sfx('click'); return; }
  if (S.sel && S.sel.kind === 'rig' && p.y > UG_TOP) {
    const rr = S.sel.ref;
    orderDrill(rr, nearestPoint(rr, p.x, p.y), p.x, p.y);
    return;
  }
  if (p.y > UG_TOP && myRigs().length && !S.sel) msg('SELECT A RIG FIRST, THEN CLICK WHERE TO DRILL', P.lgray);
  S.sel = null;
}
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointermove', e => {
  const p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
  if (mouse.down && Math.hypot(p.x - mouse.sx, p.y - mouse.sy) > 5) mouse.moved = true;
});
cv.addEventListener('pointerleave', () => { mouse.x = -99; mouse.y = -99; });
cv.addEventListener('pointerdown', e => {
  Sound.init();
  const p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
  if (e.button === 2) { if (screen === 'play' && S) { S.tool = null; S.sel = null; S.drag = null; } return; }
  try { cv.setPointerCapture(e.pointerId); } catch (_) { }
  mouse.down = true; mouse.sx = p.x; mouse.sy = p.y; mouse.moved = false; mouse.consumed = false;
  for (let i = BTN.length - 1; i >= 0; i--) {
    const b = BTN[i];
    if (inRect(p, b.x, b.y, b.w, b.h)) { mouse.consumed = true; if (b.fn) b.fn(); return; }
  }
  if (screen === 'play' && S) playDown(p);
});
cv.addEventListener('pointerup', e => {
  if (e.button === 2) return;
  const p = toLogical(e);
  mouse.down = false;
  if (mouse.consumed) { mouse.consumed = false; return; }
  if (screen === 'play' && S) playUp(p);
});
addEventListener('keydown', e => {
  if (screen !== 'play' || !S) return;
  const k = e.key.toLowerCase();
  if (S.choice) { const i = '123'.indexOf(k); if (i >= 0 && S.choice[i]) pickPerk(i); return; }
  if (S.bm && k !== 'escape' && k !== '6') return;
  if (k === ' ' || k === 'p') { togglePause(); e.preventDefault(); return; }
  if (k === 'escape') { if (S.bm) S.bm = false; else if (S.help) S.help = false; else if (S.tool || S.sel) { S.tool = null; S.sel = null; } else togglePause(); return; }
  if (S.paused) return;
  if (k === '1') setTool('rig');
  else if (k === '2') setTool('silo');
  else if (k === '3') buyHauler();
  else if (k === '5') setTool('blast');
  else if (k === '6') { S.bm = !S.bm; S.tool = null; }
  else if (k === 'q') useAbility();
  else if (k === '4') setTool('scan');
  else if (k === 'f') cycleSpeed();
  else if (k === 'm') toggleMusic();
  else if (k === 'h' || k === '?') S.help = !S.help;
  else if (k === 'tab') {
    e.preventDefault();
    if (!S.haulers.length) return;
    const order = [...S.haulers].sort((a, b) => (b.state === 'full' || b.state === 'idle') - (a.state === 'full' || a.state === 'idle'));
    const cur = S.sel && S.sel.kind === 'hauler' ? order.indexOf(S.sel.ref) : -1;
    S.sel = { kind: 'hauler', ref: order[(cur + 1) % order.length] }; S.tool = null; sfx('click');
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play' && S && !S.paused) S.paused = true; });

// ---------------------------------------------------------------- main loop
let last = performance.now(), acc = 0;
const STEP = 1 / 60;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now; GT += dt;
  if (screen === 'play' && S && !S.paused && !S.help && !S.choice && !S.bm) {
    acc += dt * S.speed;
    let n = 0;
    while (acc >= STEP && n < 24) { update(STEP); acc -= STEP; n++; if (screen !== 'play') break; }
    if (n >= 24) acc = 0;
  }
  if (S) S.shake = Math.max(0, S.shake - dt * 20);
  BTN = [];
  if (screen === 'title') renderTitle();
  else if (screen === 'play' && S) renderPlay();
  else if (screen === 'summary') renderSummary();
  else if (screen === 'shop') renderShop();
  else if (screen === 'victory') renderEnd(true);
  else if (screen === 'defeat') renderEnd(false);
  else if (screen === 'charselect') renderCharSelect();
  else if (screen === 'legacy') renderLegacy();
  else if (screen === 'sectorpick') renderSectorPick();
  requestAnimationFrame(frame);
}
Sound.loadPrefs();
resize();
requestAnimationFrame(frame);

// tiny debug hook for testing in the console
window.VOIDCRUDE = {
  get G() { return G; }, get S() { return S; },
  sim(seconds) { for (let i = 0; i < seconds * 60 && screen === 'play' && !S.choice; i++) update(STEP); },
  xp(n) { gainXP(n); },
};
