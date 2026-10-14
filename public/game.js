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
const COST = { rig: 400, silo: 300, hauler: 250, scan: 60, glitch: 40 };
const SAVE_KEY = 'voidcrude_save_v1';
const PREF_KEY = 'voidcrude_prefs_v1';
const META_KEY = 'voidcrude_legacy_v1';

const P = {
  black: '#0b0b14', navy: '#1b2350', plum: '#5d275d', red: '#b13e53', orange: '#ef7d57',
  yellow: '#ffcd75', lime: '#a7f070', green: '#38b764', teal: '#257179', dblue: '#29366f',
  blue: '#3b5dc9', sky: '#41a6f6', cyan: '#73eff7', white: '#f4f4f4', lgray: '#94b0c2',
  gray: '#566c86', dgray: '#333c57',
  crude: '#9b30d9', crudeD: '#5a1a85', crudeL: '#d77bff', crudeG: '#f3c6ff',
};


// ---- permanent tech tree (bought with Research Data) ----
const BRANCHES = [
  { name: 'DRILLING', col: '#ef7d57' }, { name: 'EXTRACTION', col: '#d77bff' },
  { name: 'LOGISTICS', col: '#73eff7' }, { name: 'MARKETS', col: '#ffcd75' }, { name: 'FRONTIER', col: '#bfe7ff' },
];
// belt each upgrade unlocks in (the town grows as the campaign goes on)
const TECH_BELT = { bit1: 1, pipe1: 1, bit2: 2, coupler: 2, gas: 3, laser1: 2, laser2: 3, seismic: 4, pump1: 1, tank1: 1, pump2: 2, silo1: 2, inject: 3, core: 4, reson: 5,
  ion1: 1, cargo1: 1, ion2: 2, auto: 2, cargo2: 3, fleet: 3, warp: 5, intel: 1, survey: 1, broker1: 2, scan1: 2, negot: 3, broker2: 4, maker: 5,
  bio: 4, heat1: 5, heat2: 5, shield1: 6, shield2: 6 };
const TECH = [
  { id: 'bit1', b: 0, row: 0, name: 'PLASMA BIT', cost: 15, req: [], desc: '+35% DRILL SPEED' },
  { id: 'pipe1', b: 0, row: 1, name: 'NANOPIPE', cost: 30, req: ['bit1'], desc: '-30% PIPE COST' },
  { id: 'bit2', b: 0, row: 2, name: 'PLASMA BIT II', cost: 40, req: ['bit1'], desc: 'ANOTHER +35% DRILL SPEED' },
  { id: 'coupler', b: 0, row: 3, name: 'PIPE COUPLERS', cost: 55, req: ['pipe1'], desc: "DRILL INTO ANOTHER RIG'S PIPE TO JOIN THEM - THEY SHARE POCKETS" },
  { id: 'gas', b: 0, row: 4, name: 'GAS SIPHON', cost: 60, req: ['pipe1'], desc: 'GAS POCKETS PAY OUT INSTEAD OF BLOWING UP' },
  { id: 'laser1', b: 0, row: 5, name: 'LASER BORE', cost: 70, req: ['bit2'], desc: 'DRILL THROUGH ROCK AT 30% SPEED' },
  { id: 'laser2', b: 0, row: 6, name: 'LASER BORE II', cost: 120, req: ['laser1'], desc: 'DRILL THROUGH ROCK AT 75% SPEED' },
  { id: 'seismic', b: 0, row: 7, name: 'SEISMIC BIT', cost: 180, req: ['laser2', 'gas'], cap: true, desc: 'DRILLS REVEAL A WIDE AREA AROUND THEM AND RUN +50% FASTER' },
  { id: 'pump1', b: 1, row: 0, name: 'HYPER PUMPS', cost: 15, req: [], desc: '+30% PUMP RATE' },
  { id: 'tank1', b: 1, row: 1, name: 'RIG TANKS', cost: 30, req: ['pump1'], desc: '+25 RIG STORAGE' },
  { id: 'pump2', b: 1, row: 2, name: 'HYPER PUMPS II', cost: 40, req: ['pump1'], desc: 'ANOTHER +30% PUMP RATE' },
  { id: 'silo1', b: 1, row: 3, name: 'SILO NETWORK', cost: 55, req: ['tank1'], desc: '+100 SILO STORAGE AND DOUBLE SILO PIPE REACH' },
  { id: 'inject', b: 1, row: 4, name: 'PRESSURE INJECT', cost: 75, req: ['pump2'], desc: 'EVERY POCKET YIELDS +25% MORE CRUDE' },
  { id: 'core', b: 1, row: 5, name: 'DEEP CORE TAP', cost: 135, req: ['inject'], desc: 'POCKETS YIELD ANOTHER +25% MORE CRUDE' },
  { id: 'reson', b: 1, row: 6, name: 'VOID RESONATOR', cost: 180, req: ['core', 'silo1'], cap: true, desc: 'POCKETS YOU TAP SLOWLY REGENERATE CRUDE - EVEN DRY ONES' },
  { id: 'ion1', b: 2, row: 0, name: 'ION ENGINES', cost: 15, req: [], desc: '+20% HAULER SPEED' },
  { id: 'cargo1', b: 2, row: 1, name: 'CARGO PODS', cost: 30, req: ['ion1'], desc: '+10 HAULER CAPACITY' },
  { id: 'ion2', b: 2, row: 2, name: 'ION ENGINES II', cost: 40, req: ['ion1'], desc: 'ANOTHER +20% HAULER SPEED' },
  { id: 'auto', b: 2, row: 3, name: 'SMART ROUTING', cost: 70, req: ['cargo1'], desc: 'HAULERS DIVERT TO THE OTHER STATION WHEN IT PAYS 10%+ MORE' },
  { id: 'cargo2', b: 2, row: 4, name: 'CARGO PODS II', cost: 60, req: ['cargo1'], desc: 'ANOTHER +10 HAULER CAPACITY' },
  { id: 'fleet', b: 2, row: 5, name: 'FLEET CHARTER', cost: 105, req: ['auto'], desc: 'START EVERY SECTOR WITH 2 FREE HAULERS' },
  { id: 'warp', b: 2, row: 6, name: 'WARP HAULERS', cost: 180, req: ['fleet', 'ion2'], cap: true, desc: 'HAULERS FLY, LOAD AND UNLOAD TWICE AS FAST' },
  { id: 'intel', b: 3, row: 0, name: 'MARKET INTEL', cost: 15, req: [], desc: '10-DAY PRICE FORECAST ON STATION PANELS' },
  { id: 'survey', b: 3, row: 1, name: 'LAND SURVEYOR', cost: 30, req: ['intel'], desc: 'PLOTS 20% CHEAPER AND SIGNS RATE THEIR CRUDE' },
  { id: 'broker1', b: 3, row: 2, name: 'BROKER', cost: 40, req: ['intel'], desc: '+8% SELL PRICE EVERYWHERE' },
  { id: 'scan1', b: 3, row: 3, name: 'SCANNER ARRAY', cost: 45, req: ['survey'], desc: '+30% SCAN RANGE AND SCANS COST HALF' },
  { id: 'negot', b: 3, row: 4, name: 'NEGOTIATOR', cost: 60, req: ['broker1'], desc: 'CONTRACT REWARDS +50%' },
  { id: 'broker2', b: 3, row: 5, name: 'BROKER II', cost: 105, req: ['negot'], desc: 'ANOTHER +8% SELL PRICE' },
  { id: 'maker', b: 3, row: 6, name: 'MARKET MAKER', cost: 180, req: ['broker2', 'scan1'], cap: true, desc: 'YOUR SALES BARELY DENT STATION PRICES' },
  { id: 'bio', b: 4, row: 0, name: 'BIO-ANCHORS', cost: 60, req: [], desc: 'LIVING CRUDE YOU TAP STOPS CRAWLING AWAY' },
  { id: 'heat1', b: 4, row: 1, name: 'HEATED PIPES', cost: 70, req: [], desc: 'CRYO-CRUDE PUMPS AT 70% SPEED (FROM 30%)' },
  { id: 'heat2', b: 4, row: 2, name: 'THERMAL CORE', cost: 110, req: ['heat1'], desc: 'CRYO-CRUDE PUMPS AT FULL SPEED' },
  { id: 'shield1', b: 4, row: 3, name: 'STORM SHIELDS', cost: 90, req: [], desc: 'VOID STORMS CAN NO LONGER KNOCK OUT YOUR RIGS' },
  { id: 'shield2', b: 4, row: 4, name: 'STORM HANGARS', cost: 120, req: ['shield1'], cap: true, desc: 'HAULERS KEEP FLYING (AT HALF SPEED) THROUGH STORMS' },
];
// ---- rock blaster (separate upgrade track) ----
const BLAST_MIN = 3, BLAST_MAX = 10;
function blasterCost(lvl) { return (12 + (lvl - BLAST_MIN) * 6) * 100; } // cost to go from lvl -> lvl+1
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
  { id: 'landbroker', name: 'LAND BROKER', icon: 'L$', r: 1, desc: 'YOUR NEXT LAND AUCTION WIN IS HALF PRICE' },
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
  { id: 'capstone', name: 'VISIONARY', desc: 'BUY ANY CAPSTONE UPGRADE', rd: 20 },
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
  { id: 'gas', name: 'GAS-RICH', desc: 'EXTRA GAS. SIPHONED GAS PAYS 2X', rd: 0.1 },
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
  { id: 'rd', name: 'WORKSHOP CONTACTS', desc: '-5% PRICE ON EVERY WORKSHOP UPGRADE', max: 5, cost: l => 5 + l * 5 },
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
  { id: 'loan', name: 'QUICK LOAN', desc: 'CASH NOW. 20% INTEREST PER SECTOR - REPAY IN THE SHOP', base: 0 },
];

const HELP = [
  'THE BELT IS RICH WITH VOIDCRUDE. DRILL IT, HAUL IT, SELL IT.',
  '',
  '1. WIN PLOTS AT AUCTION - CLICK AN "AUCTION" SIGN. [B] BIDS.',
  '2. SCAN [4] FOR CRUDE. RELEASE A GLITCH [7] TO SNIFF OUT GAS.',
  '3. BUILD A RIG [1] ON YOUR PLOT.',
  '4. CLICK THE RIG, THEN CLICK UNDERGROUND - EACH CLICK ADDS A JOINT.',
  '   DRAG FROM ANY JOINT TO BRANCH. RIGHT-CLICK ENDS. PIPE COSTS $/METER.',
  '5. HIT A PURPLE POCKET AND THE RIG PUMPS IT INTO ITS TANK.',
  '6. BUY HAULERS [3]. ASSIGN THEM WITH < > ON EACH REFINERY PANEL.',
  '   THEY FETCH AND SELL CRUDE BY THEMSELVES. LOANS: BLACK MARKET/SHOP.',
  '7. SILOS [2] STORE OVERFLOW. SET A MIN SELL PRICE ON EACH REFINERY.',
  '8. ROCK IN THE WAY? ROCK BLASTER [5] CLEARS IT. LIMITED CHARGES.',
  '',
  'PRICES SWING. DUMPING LOTS AT ONE STATION DROPS ITS PRICE.',
  'RIVAL CORPS GRAB LAND, DRAIN SHARED POCKETS AND PLAY DIRTY.',
  "Q: YOUR TYCOON'S ABILITY.   6: BLACK MARKET DIRTY TRICKS.",
  'CAMPAIGN: 6 BELTS X 3 SECTORS. EACH BELT ADDS A NEW HAZARD.',
  'UPGRADES AND SHARES COST THE SAME CREDITS. SHARES SELL AT STOCK AUCTIONS.',
  'OWN 51 SHARES TO WIN. IF ANY RIVAL GETS 51, YOU LOSE.',
  'KEYS: 1-6 TOOLS  Q ABILITY  SPACE PAUSE  F SPEED  TAB HAULER  ESC',
];

// ---------------------------------------------------------------- canvas
const cv = document.getElementById('game');
const crt = document.getElementById('crt');
// The game is laid out on a 640x360 grid but rendered at 2x (1280x720) so sprites,
// terrain and text get 16/32-bit era detail. q() draws in those physical pixels.
const R = 2;
cv.width = W * R; cv.height = H * R;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  const use = s >= 2 && s - Math.floor(s) < 0.5 ? Math.floor(s) : s;
  cv.style.width = Math.floor(W * use) + 'px';
  cv.style.height = Math.floor(H * use) + 'px';
  crt.style.width = cv.style.width; crt.style.height = cv.style.height;
  crt.style.backgroundSize = `100% ${Math.max(2, use)}px`;
  // when the window is too small to show every 2x pixel, scale smoothly so text stays readable
  cv.style.imageRendering = W * use * (window.devicePixelRatio || 1) < W * R - 1 ? 'auto' : 'pixelated';
}
addEventListener('resize', resize);

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function q(X, Y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(X / R, Y / R, w / R, h / R); }

// colour helpers: shade('#hex', +0.3) lightens, shade('#hex', -0.3) darkens
const shadeCache = new Map();
function shade(hex, amt) {
  const key = hex + amt;
  let v = shadeCache.get(key);
  if (v) return v;
  const c = rgb(hex).map(x => Math.round(clamp(amt >= 0 ? x + (255 - x) * amt : x * (1 + amt), 0, 255)));
  v = '#' + c.map(x => x.toString(16).padStart(2, '0')).join('');
  shadeCache.set(key, v);
  return v;
}
function mixRGB(a, b, t) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }

// soft additive light, used for beacons, engines, crude, sparks and explosions
const glowCache = {};
function glowSprite(col) {
  let g = glowCache[col];
  if (g) return g;
  g = mk(64, 64);
  const x = g.getContext('2d'), [r, gg, b] = rgb(col);
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${gg},${b},0.9)`);
  gr.addColorStop(0.3, `rgba(${r},${gg},${b},0.35)`);
  gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (glowCache[col] = g);
}
function glow(x, y, r, col, a = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
// smooth value noise for terrain and planet textures
function hash2(x, y, s) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
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

// ---------------------------------------------------------------- bitmap font (5x7, stretched to 5x9 at 2x detail)
const GLYPHS = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [28, 18, 17, 17, 17, 18, 28],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 17, 10, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  '0': [14, 17, 19, 21, 25, 17, 14], '1': [4, 12, 4, 4, 4, 4, 14], '2': [14, 17, 1, 2, 4, 8, 31], '3': [31, 2, 4, 2, 1, 17, 14],
  '4': [2, 6, 10, 18, 31, 2, 2], '5': [31, 16, 30, 1, 1, 17, 14], '6': [6, 8, 16, 30, 17, 17, 14], '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14], '9': [14, 17, 17, 15, 1, 2, 12],
  '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], ':': [0, 12, 12, 0, 12, 12, 0], ';': [0, 12, 12, 0, 12, 4, 8],
  '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4], '-': [0, 0, 0, 31, 0, 0, 0], '+': [0, 4, 4, 31, 4, 4, 0],
  '/': [1, 1, 2, 4, 8, 16, 16], '$': [4, 15, 20, 14, 5, 30, 4], '%': [24, 25, 2, 4, 8, 19, 3], '(': [2, 4, 8, 8, 8, 4, 2],
  ')': [8, 4, 2, 2, 2, 4, 8], '<': [2, 4, 8, 16, 8, 4, 2], '>': [8, 4, 2, 1, 2, 4, 8], '=': [0, 0, 31, 0, 31, 0, 0],
  "'": [4, 4, 8, 0, 0, 0, 0], '"': [10, 10, 0, 0, 0, 0, 0], '#': [10, 10, 31, 10, 31, 10, 10], '*': [0, 4, 21, 14, 21, 4, 0],
  '[': [14, 8, 8, 8, 8, 8, 14], ']': [14, 2, 2, 2, 2, 2, 14], '^': [4, 10, 17, 0, 0, 0, 0], '_': [0, 0, 0, 0, 0, 0, 31],
  '|': [4, 4, 4, 4, 4, 4, 4], '&': [12, 18, 20, 8, 21, 18, 13], '@': [14, 17, 23, 21, 23, 16, 15],
};
const ROWMAP = [0, 1, 1, 2, 3, 4, 5, 5, 6]; // 7 source rows -> 9 drawn rows
const atlasCache = {};
function atlas(color) {
  let a = atlasCache[color];
  if (a) return a;
  a = mk(64 * 8, 10);
  const g = a.getContext('2d');
  g.fillStyle = color;
  for (let i = 0; i < 64; i++) {
    const gl = GLYPHS[String.fromCharCode(32 + i)];
    if (!gl) continue;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 5; c++) if (gl[ROWMAP[r]] & (16 >> c)) g.fillRect(i * 8 + c, r, 1, 1);
  }
  return (atlasCache[color] = a);
}
function tw(s, scale = 1) { return Math.max(0, String(s).length * 4 * scale - scale); }
function drawText(g, s, x, y, color, scale) {
  const a = atlas(color);
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i) - 32;
    if (code === 0) continue;
    if (code < 0 || code > 63) code = 31;
    g.drawImage(a, code * 8, 0, 6, 10, x + i * 4 * scale, y, 3 * scale, 5 * scale);
  }
}
function txt(s, x, y, color = P.white, scale = 1, align = 'l') {
  s = String(s).toUpperCase();
  const w = tw(s, scale);
  if (align === 'c') x -= w / 2; else if (align === 'r') x -= w;
  x = Math.round(x * R) / R; y = Math.round(y * R) / R;
  drawText(ctx, s, x, y, color, scale);
  return w;
}
function txtS(s, x, y, color, scale = 1, align = 'l') {
  txt(s, x + scale * 0.5, y + scale * 0.5, P.black, scale, align);
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
  yield: () => 1 + 0.25 * (has('inject') + has('core')),
  rigCap: () => 40 + 25 * has('tank1'),
  siloCap: () => 150 + 100 * has('silo1'),
  siloReach: () => has('silo1') ? 128 : 64,
  hSpeed: () => (stormActive() ? (has('shield2') ? 0.5 : 0) : 1) * 55 * (1 + 0.2 * (has('ion1') + has('ion2'))) * (1 + 0.35 * pk('burn')) * (has('warp') ? 2 : 1) * (S && S.flare > 0 ? 0.5 : 1)
    * (isChar('bolt') ? 1.25 : 1) * (abilOn('bolt') ? 3 : 1),
  hCap: () => 20 + 10 * (has('cargo1') + has('cargo2')) + 10 * pk('cargo'),
  hRate: () => has('warp') ? 2 : 1,
  scanRx: () => 32 * (has('scan1') ? 1.3 : 1) * (isChar('kade') ? 1.4 : 1),
  scanRy: () => 96 * (has('scan1') ? 1.3 : 1) * (isChar('kade') ? 1.4 : 1),
  scanCost: () => COST.scan * (has('scan1') ? 0.5 : 1) * (isChar('kade') ? 0.5 : 1),
  rigCost: () => pk('rig') > 0 ? 0 : COST.rig * (S && S.deal && S.deal.rigHalf ? 0.5 : 1),
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
  const pts = Math.round((5 + 3 * (G.sector - 1) + Math.floor(G.shares / 3) + (win ? 30 : 0)) * DF().legacy);
  G.legacyEarned = pts;
  META.legacy += pts; META.runs++; if (win) META.wins++;
  saveMeta(); clearSave(); clearSectorSave();
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
  return Math.round(item.base * (1 + 0.25 * (S.belt - 1)) * Math.pow(1.5, uses) * st.bmMul() / 10) * 10;
}
function bmBuy(item, target) {
  if (item.id === 'loan') { borrow(); return; }
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
  G = { seed: (Math.random() * 1e9) | 0, sector: 1, credits: 2000 + 750 * lv('cap'), tech: {}, ach: {}, blaster: BLAST_MIN,
    life: { contracts: 0 }, shares: 0, rshares: { syn: 0, kroll: 0, hex: 0 }, totalEarned: 0, report: null, char: charId || 'rusty', debt: 0,
    diff: TS.diff || 'normal', path: [], unsold: 0, history: [] };
  const rc = Math.round(3000 * DIFFS[G.diff].rival);
  G.rcash = { syn: rc, kroll: rc, hex: rc }; G.rtech = { syn: 0, kroll: 0, hex: 0 };
  genMap();
  clearSectorSave();
  mapSel = null;
  screen = 'map';
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
    G.ach = G.ach || {}; G.life = G.life || { contracts: 0 }; G.blaster = G.blaster || BLAST_MIN; G.char = G.char || 'rusty'; G.debt = G.debt || 0;
    if (G.couplers) { G.tech.coupler = true; delete G.couplers; } // couplers used to be a black market item
    if (!G.map) { // saves from before the campaign map: convert leftover research to credits and join the campaign
      G.credits += (G.rd || 0) * 60; delete G.rd;
      G.diff = 'normal'; G.path = []; G.unsold = 0; G.history = [];
      G.sector = Math.min(G.sector, TOTAL_SECTORS);
      G.rcash = { syn: 4000, kroll: 4000, hex: 4000 }; G.rtech = { syn: 0, kroll: 0, hex: 0 };
      genMap();
    }
    return true;
  } catch (e) { return false; }
}

// ---------------------------------------------------------------- progression
function unlock(id) {
  if (!G || G.ach[id]) return;
  const a = ACH.find(a => a.id === id);
  const cash = a.rd * 150;
  G.ach[id] = true; G.credits += cash;
  if (S && screen === 'play') msg('ACHIEVEMENT: ' + a.name + '  +$' + fmt(cash), P.yellow);
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
    case 'cash': { const v = 800 + 400 * S.belt; G.credits += v; msg('INVESTOR WIRED +$' + fmt(v), P.yellow); break; }
    case 'hauler': spawnHauler(); msg('A FREE HAULER JOINS THE FLEET', P.lime); break;
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
  G.credits += 1500; msg('NO ROOM FOR A MOTHERLODE - TOOK $1,500 INSTEAD', P.cyan);
}
function checkBaron() { if (S.plots.filter(p => p.owner === 'you').length >= 4) unlock('baron'); }
function techState(t) {
  if (has(t.id)) return 'owned';
  if ((TECH_BELT[t.id] || 1) > beltOf(G.sector)) return 'belt';
  if (!t.req.every(has)) return 'locked';
  return G.credits >= techCost(t) ? 'ready' : 'poor';
}
function buyTech(t) {
  if (techState(t) !== 'ready') { sfx('err'); return; }
  G.credits -= techCost(t); G.tech[t.id] = true;
  sfx('buy');
  if (t.cap) unlock('capstone');
  save();
}
function buyBlaster() {
  const lvl = G.blaster;
  if (lvl >= BLAST_MAX || G.credits < blasterCost(lvl)) { sfx('err'); return; }
  G.credits -= blasterCost(lvl); G.blaster++;
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
const LOAN_STEP = 1000, LOAN_RATE = 0.2, START_FLOOR = 2000;
function loanLimit() { return 3000 + 1500 * (G.sector - 1); }
function note(text, color) { if (S && screen === 'play') msg(text, color); }
function borrow() {
  if (G.debt + LOAN_STEP > loanLimit()) { note('LOAN LIMIT REACHED ($' + fmt(loanLimit()) + ')', P.red); sfx('err'); return; }
  G.debt += LOAN_STEP; G.credits += LOAN_STEP;
  note('BORROWED $' + fmt(LOAN_STEP) + ' - DEBT NOW $' + fmt(G.debt) + ' (20% INTEREST PER SECTOR)', P.yellow);
  sfx('cash');
  if (screen === 'shop') save();
}
function repay(all) {
  const n = Math.min(all ? G.debt : LOAN_STEP, G.debt, Math.floor(G.credits));
  if (n <= 0) { sfx('err'); return; }
  G.debt -= n; G.credits -= n;
  sfx('buy');
  if (screen === 'shop') save();
}

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
  const units = Math.round((60 + Math.random() * 90) * (1 + 0.2 * (S.belt - 1)) / 10) * 10;
  const boost = st.jobMul();
  s.job = { units, done: 0, deadline: Math.floor(S.day) + 18 + Math.floor(Math.random() * 12),
    cred: Math.round(units * s.base * 0.6 * boost / 10) * 10 };
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
  float(s.x, SURF - 58, '+$' + fmt(j.cred), P.yellow);
  msg('CONTRACT COMPLETE AT ' + s.name + '! +$' + fmt(j.cred), P.lime);
  sfx('fanfare');
  s.job = null; s.nextJob = S.day + 5 + Math.random() * 6;
  S.stats.jobs++; G.life.contracts++;
  unlock('job'); if (G.life.contracts >= 10) unlock('jobs');
  gainXP(40);
}

function genSector(opt) {
  const d = G.sector - 1;
  const rng = mulberry32((G.seed ^ Math.imul(G.sector * 3 + opt.k, 2654435761)) >>> 0);
  const belt = beltOf(G.sector);
  const mods = opt.mods;
  const N = COLS * ROWS;
  S = {
    d, rng, t: 0, day: 0, lastDay: 0, dayLen: 3, days: 120, speed: 1, paused: false, help: false, shake: 0,
    grid: new Uint8Array(N), pid: new Int16Array(N).fill(-1), rev: new Uint8Array(N),
    pockets: [], gases: [], plots: [], rigs: [], silos: [], haulers: [], scans: [], segs: [],
    parts: [], floats: [], msgs: [], sel: null, tool: null, drag: null, nid: 1,
    auction: null, auctionQueue: [], critters: [],
    stats: { revenue: 0, spent: 0, sold: 0, gas: 0, jobs: 0, helix: 0, nova: 0 }, pcell: new Int32Array(COLS * ROWS), joints: [],
    perks: {}, xp: 0, rank: 0, pending: 0, choice: null, blasts: 0, blasted: 0, belt,
    mods, rivals: opt.rivals, payMul: opt.payMul || 1, rv: {}, taunt: null, bm: false, bmUses: {}, bribe: 0,
    abil: { cd: 0, on: 0 }, jam: 0, nextQuake: 10 + rng() * 6,
    nextEvent: 16 + rng() * 10, flare: 0, name: opt.name, stations: [], twinkles: [],
  };
  for (const id of opt.rivals) S.rv[id] = { pumped: 0, nextBuy: (d === 0 ? 14 : 8) + rng() * 10, queue: [], nextTrick: 14 + rng() * 10 };
  if (mods.includes('long')) S.days += 20;
  // crude pockets
  const nP = Math.round((10 + Math.floor(rng() * 4) + Math.min(d, 3)) * (mods.includes('bonanza') ? 1.4 : 1));
  const minRow = Math.min(5 + (belt - 1) * 3, 20) + (mods.includes('deep') ? 10 : 0);
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
    const cap = Math.round(cells.length * UNITS_PER_CELL * (mods.includes('deep') ? 1.5 : 1) * DF().crude);
    S.pockets.push({ id, cells, n: cells.length, cap, amt: cap, cx: (sx / cells.length) * CELL + 2, cy: UG_TOP + (sy / cells.length) * CELL + 2, top });
  }
  assignHazards(rng);
  // rock caps over some pockets
  for (const p of S.pockets) {
    if (belt >= 2 && rng() < 0.35 + belt * 0.05) {
      const cells = blob(p.cx / CELL, p.top - 1.3, Math.sqrt(p.n) * 0.9 + 1, 1 + rng() * 1.3, rng);
      for (const i of cells) S.grid[i] = T_ROCK;
    }
  }
  // gas pockets
  const nG = belt < 3 ? 0 : 3 + Math.min(d - 6, 5) + (mods.includes('gas') ? 5 : 0);
  for (let tries = 0; tries < 120 && S.gases.length < nG; tries++) {
    const cells = blob(6 + rng() * (COLS - 12), 6 + rng() * (ROWS - 10), 2 + rng() * 2.5, 1.2 + rng() * 1.3, rng);
    if (cells.length < 5 || cells.some(i => nearType(i, T_OIL))) continue;
    const id = S.gases.length;
    for (const i of cells) { S.grid[i] = T_GAS; S.pid[i] = id; }
    S.gases.push({ id, cells, live: true });
  }
  // free rocks
  const nR = belt < 2 ? 0 : 8 + Math.min(d, 14) + (mods.includes('rocky') ? 12 : 0);
  for (let k = 0; k < nR; k++) {
    const cells = blob(rng() * COLS, 3 + rng() * (ROWS - 4), 2 + rng() * 8, 1 + rng() * 2.5, rng);
    for (const i of cells) S.grid[i] = T_ROCK;
  }
  // plots
  for (let k = 0; k < NPLOTS; k++) {
    const x0 = PLOT_X0 + k * PLOT_W, x1 = x0 + PLOT_W;
    let oil = 0;
    for (let r = 0; r < ROWS; r++) for (let c = x0 / CELL; c < x1 / CELL; c++) if (S.grid[r * COLS + c] === T_OIL) oil++;
    const price = Math.round((220 + oil * 0.9 + rng() * 220) * (1 + 0.2 * (belt - 1)) / 10) * 10;
    S.plots.push({ i: k, x0, x1, owner: null, price, oil });
  }
  if (d > 0) {
    for (const id of opt.rivals) {
      const free = S.plots.filter(p => !p.owner);
      const p = free[Math.floor(rng() * free.length)];
      p.owner = id;
      S.rv[id].queue.push({ day: 1, plot: p.i });
    }
  }
  const base = (11 + (belt - 1) * 1.6) * (mods.includes('boom') ? 1.25 : mods.includes('slump') ? 0.8 : 1);
  S.stations = [mkStation('HELIX', 28, base, rng), mkStation('NOVA', 612, base, rng)];
  S.stations.forEach((st2, i) => { st2.floor = (G.floors || [0, 0])[i]; });
  if (mods.includes('boom')) for (const s of S.stations) s.amp = 1.6;
  S.blasts = st.blastMax();
  applyDeals();
  buildDirt(); buildFog(); buildSky(); buildPipeLayer();
  if (has('fleet')) { spawnHauler(); spawnHauler(); }
  if (isChar('bolt')) spawnHauler();
  S.sel = null;
  for (let k = 0; k < 24; k++) S.twinkles.push({ x: (Math.random() * W) | 0, y: 14 + ((Math.random() * 60) | 0), f: 0.3 + Math.random(), p: Math.random() });
  msg('SECTOR ' + G.sector + '/' + TOTAL_SECTORS + ': ' + S.name + ' (BELT ' + belt + ') - ' + S.days + ' DAYS ON THE CLOCK', P.cyan);
  if (G.sector % SECTORS_PER_BELT === 1) msg('NEW BELT: ' + BELTS[belt - 1].name + ' - ' + BELTS[belt - 1].hazard, BELTS[belt - 1].col);
  const lots = S.plots.filter(p => !p.owner).sort(() => Math.random() - 0.5).slice(0, G.sector === 1 ? 2 : 3).sort((a, b) => a.i - b.i);
  for (const p of lots) startAuction(p, null);
  if (G.sector > 1 || opt.rivals.length) taunt(opt.rivals[0]);
}

// ---------------------------------------------------------------- textures (built at 2x detail)
const STRATA = [[132, 88, 66], [114, 76, 60], [98, 65, 56], [84, 56, 54], [70, 47, 52], [58, 40, 50], [47, 33, 46], [37, 27, 41]];
const TEX_W = COLS * CELL * R, TEX_H = ROWS * CELL * R;
function dirtRGB(X, Y) {
  const warp = Math.sin(X * 0.02 + G.sector) * 12 + Math.sin(X * 0.0065) * 20 + (S.tex[Y * TEX_W + X] - 0.5) * 10;
  const f = clamp((Y + warp) / TEX_H, 0, 0.999) * (STRATA.length - 1);
  const b = Math.floor(f), fr = f - b;
  const t = fr > 0.78 ? (fr - 0.78) / 0.22 : 0;
  const a = STRATA[b], c = STRATA[Math.min(b + 1, STRATA.length - 1)];
  const k = (0.78 + 0.44 * S.tex[Y * TEX_W + X]) * (1 - 0.18 * Y / TEX_H) * ((((Y + warp) | 0) % 29 === 0) ? 0.82 : 1);
  return [(a[0] + (c[0] - a[0]) * t) * k, (a[1] + (c[1] - a[1]) * t) * k, (a[2] + (c[2] - a[2]) * t) * k];
}
function buildDirt() {
  S.dirtC = mk(TEX_W, TEX_H); S.dirtX = S.dirtC.getContext('2d');
  S.dirtImg = S.dirtX.createImageData(TEX_W, TEX_H);
  const rng = mulberry32(G.seed + G.sector * 17), seed = (G.seed + G.sector * 101) | 0;
  S.noise = new Float32Array(TEX_W * TEX_H);
  S.tex = new Float32Array(TEX_W * TEX_H);
  for (let Y = 0; Y < TEX_H; Y++) for (let X = 0; X < TEX_W; X++) {
    const k = Y * TEX_W + X;
    S.noise[k] = rng();
    S.tex[k] = 0.55 * vnoise(X / 14, Y / 9, seed) + 0.3 * vnoise(X / 5, Y / 4, seed + 1) + 0.15 * S.noise[k];
  }
  for (let i = 0; i < COLS * ROWS; i++) paintCellRaw(i);
  S.dirtX.putImageData(S.dirtImg, 0, 0);
  // hidden ground: the same strata, very dark and without any features, shown under the fog
  S.darkC = mk(TEX_W, TEX_H);
  const dx = S.darkC.getContext('2d'), dimg = dx.createImageData(TEX_W, TEX_H);
  for (let Y = 0; Y < TEX_H; Y++) for (let X = 0; X < TEX_W; X++) {
    const o = (Y * TEX_W + X) * 4, c = dirtRGB(X, Y), sp = S.noise[Y * TEX_W + X] > 0.997 ? 30 : 0;
    dimg.data[o] = c[0] * 0.2 + 6 + sp; dimg.data[o + 1] = c[1] * 0.18 + 4 + sp; dimg.data[o + 2] = c[2] * 0.22 + 12 + sp; dimg.data[o + 3] = 255;
  }
  dx.putImageData(dimg, 0, 0);
}
function isT(c, r, t) { return c >= 0 && r >= 0 && c < COLS && r < ROWS && S.grid[r * COLS + c] === t; }
function paintCellRaw(i) {
  const c = i % COLS, r = (i / COLS) | 0, t = S.grid[i], img = S.dirtImg.data;
  const S8 = CELL * R;
  const up = isT(c, r - 1, t), dn = isT(c, r + 1, t), lf = isT(c - 1, r, t), rt = isT(c + 1, r, t);
  for (let py = 0; py < S8; py++) for (let px = 0; px < S8; px++) {
    const X = c * S8 + px, Y = r * S8 + py, k = Y * TEX_W + X, n = S.noise[k], tx = S.tex[k];
    let col;
    if (t === T_DIRT) {
      col = dirtRGB(X, Y);
      if (n > 0.993) col = col.map(v => v * 1.45 + 10); else if (n < 0.006) col = col.map(v => v * 0.55);
    } else if (t === T_ROCK) {
      const corner = (!up && !lf && px + py < 3) || (!up && !rt && (S8 - 1 - px) + py < 3) || (!dn && !lf && px + (S8 - 1 - py) < 3) || (!dn && !rt && (S8 - 1 - px) + (S8 - 1 - py) < 3);
      if (corner) col = dirtRGB(X, Y);
      else {
        const m = 0.78 + 0.45 * tx;
        col = [92 * m, 97 * m, 120 * m];
        if (!up && py === 0) col = [184, 190, 212];
        else if (!up && py === 1) col = [146, 152, 176];
        else if (!dn && py >= S8 - 2) col = [44, 46, 62];
        else if (!lf && px === 0) col = [150, 156, 178];
        else if (!rt && px === S8 - 1) col = [58, 60, 78];
        else if (n > 0.975) col = [40, 42, 58];
        else if (n < 0.02) col = [170, 176, 198];
        col = col.map(v => v * (1 - 0.15 * Y / TEX_H));
      }
    } else if (t === T_GAS) {
      const m = 0.8 + 0.4 * tx;
      col = [24 * m, 82 * m, 96 * m];
      if ((!up && py < 2) || (!dn && py >= S8 - 2) || (!lf && px < 2) || (!rt && px >= S8 - 2)) col = [70, 178, 190];
      if (n > 0.965) col = [168, 248, 255]; else if (n > 0.88) col = [80, 186, 200];
    } else {
      const m = 0.75 + 0.5 * tx;
      col = [22 * m, 11 * m, 30 * m];
      if ((!up && py < 1) || (!lf && px < 1) || (!rt && px >= S8 - 1) || (!dn && py >= S8 - 1)) col = [56, 32, 66];
    }
    const o = k * 4;
    img[o] = col[0]; img[o + 1] = col[1]; img[o + 2] = col[2]; img[o + 3] = 255;
  }
}
// repaint a cell (and its neighbours, whose edges depend on it) after the ground changes
function paintCell(i) {
  const c = i % COLS, r = (i / COLS) | 0;
  for (const [dc, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const cc = c + dc, rr = r + dr;
    if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) continue;
    paintCellRaw(rr * COLS + cc);
  }
  const S8 = CELL * R;
  S.dirtX.putImageData(S.dirtImg, 0, 0, Math.max(0, (c - 1) * S8), Math.max(0, (r - 1) * S8), S8 * 3, S8 * 3);
}
// fog of war: a 1-pixel-per-cell mask, smoothed when drawn so revealed ground has soft edges
function buildFog() {
  S.fogC = mk(COLS, ROWS); S.fogX = S.fogC.getContext('2d');
  S.fogX.fillStyle = '#000'; S.fogX.fillRect(0, 0, COLS, ROWS);
  S.fogLayer = mk(TEX_W, TEX_H); S.fogDirty = true;
}
function drawFog() {
  if (S.fogDirty) {
    const g = S.fogLayer.getContext('2d');
    g.globalCompositeOperation = 'copy';
    g.drawImage(S.darkC, 0, 0);
    g.globalCompositeOperation = 'destination-in';
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(S.fogC, 0, 0, TEX_W, TEX_H);
    g.globalCompositeOperation = 'source-over';
    S.fogDirty = false;
  }
  ctx.drawImage(S.fogLayer, 0, UG_TOP, W, ROWS * CELL);
}
function buildPipeLayer() {
  S.pipeC = mk(W * R, (UG_BOT - SURF) * R); S.pipeX = S.pipeC.getContext('2d');
  S.pipeReset = false;
}

// shaded gas giant with rings and an atmosphere halo; returns a 2x canvas
function makePlanet(r) {
  const pad = Math.round(r * 0.9), size = r * 2 + pad * 2, c = mk(size, size), g = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const halo = g.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.35);
  halo.addColorStop(0, 'rgba(255,170,120,0.35)'); halo.addColorStop(1, 'rgba(255,120,120,0)');
  g.fillStyle = halo; g.fillRect(0, 0, size, size);
  const ring = (front) => {
    for (let a = 0; a < Math.PI * 2; a += 0.004) {
      const sn = Math.sin(a), behind = sn < 0;
      if (behind === front) continue;
      for (let rr = r * 1.25; rr < r * 1.7; rr += 0.7) {
        const x = cx + Math.cos(a) * rr, y = cy + sn * rr * 0.28;
        const band = Math.sin(rr * 0.9) * 0.5 + 0.5;
        g.fillStyle = `rgba(${200 + band * 40},${170 + band * 30},${150 + band * 30},${(0.25 + band * 0.4) * (front ? 1 : 0.7)})`;
        g.fillRect(x | 0, y | 0, 1, 1);
      }
    }
  };
  ring(false);
  const img = g.getImageData(0, 0, size, size);
  const cols = [[255, 214, 140], [239, 125, 87], [190, 72, 92], [130, 44, 96]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = (x - cx) / r, ny = (y - cy) / r, d = nx * nx + ny * ny;
    if (d > 1) continue;
    const nz = Math.sqrt(1 - d);
    const turb = vnoise(nx * 4 + 10, ny * 9, 7) * 1.6 + vnoise(nx * 12, ny * 20, 9) * 0.5;
    const b = (Math.sin(ny * 11 + turb * 2.2) + 1) / 2;
    const bi = b * (cols.length - 1), i0 = Math.floor(bi), ft = bi - i0;
    const a = cols[i0], bb = cols[Math.min(i0 + 1, cols.length - 1)];
    let col = [a[0] + (bb[0] - a[0]) * ft, a[1] + (bb[1] - a[1]) * ft, a[2] + (bb[2] - a[2]) * ft];
    const light = clamp(-nx * 0.55 - ny * 0.45 + nz * 0.75, 0, 1);
    const k = 0.18 + 0.95 * light;
    col = col.map(v => v * k);
    const rim = Math.pow(1 - nz, 3) * clamp(-nx - ny * 0.5, 0, 1);
    col = [col[0] + rim * 120, col[1] + rim * 90, col[2] + rim * 70];
    const o = (y * size + x) * 4, al = clamp((1 - d) * r * 1.5, 0, 1);
    img.data[o] = img.data[o] * (1 - al) + col[0] * al; img.data[o + 1] = img.data[o + 1] * (1 - al) + col[1] * al;
    img.data[o + 2] = img.data[o + 2] * (1 - al) + col[2] * al; img.data[o + 3] = 255 * al + img.data[o + 3] * (1 - al);
  }
  g.putImageData(img, 0, 0);
  ring(true);
  c.pad = pad;
  return c;
}
let PLANET = null;
function drawPlanet(x, y) {
  if (!PLANET) PLANET = makePlanet(56);
  ctx.drawImage(PLANET, x - PLANET.pad / R, y - PLANET.pad / R, PLANET.width / R, PLANET.height / R);
}
// soft nebula clouds for the space backdrop
function paintNebula(g, w, h, rng, count) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const cols = [[93, 39, 93], [37, 113, 121], [41, 54, 111], [120, 40, 140], [60, 30, 110]];
  for (let k = 0; k < count; k++) {
    const x = rng() * w, y = rng() * h * 0.8, rr = 60 + rng() * 170, c = cols[Math.floor(rng() * cols.length)];
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.16 + rng() * 0.14})`);
    gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  g.restore();
}
function paintStars(g, w, h, rng, count) {
  const cols = ['#566c86', '#94b0c2', '#f4f4f4', '#73eff7', '#ffcd75', '#f3c6ff'];
  for (let k = 0; k < count; k++) {
    const x = (rng() * w) | 0, y = (rng() * h) | 0, c = cols[Math.floor(rng() * cols.length)], big = rng();
    g.fillStyle = c;
    if (big > 0.97) {
      g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
      g.globalAlpha = 0.45; g.fillRect(x - 3, y, 2, 1); g.fillRect(x + 2, y, 2, 1); g.fillRect(x, y - 3, 1, 2); g.fillRect(x, y + 2, 1, 2); g.globalAlpha = 1;
    } else if (big > 0.85) g.fillRect(x, y, 2, 2);
    else { g.globalAlpha = 0.5 + rng() * 0.5; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; }
  }
}
function buildSky() {
  const w = W * R, h = UG_TOP * R;
  S.skyC = mk(w, h);
  const g = S.skyC.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, SURF * R);
  sky.addColorStop(0, '#04030c'); sky.addColorStop(0.45, '#0c0a24'); sky.addColorStop(0.8, '#22143e'); sky.addColorStop(1, '#3a1d4c');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const rng = mulberry32(G.seed + G.sector * 31);
  paintNebula(g, w, SURF * R, rng, 7);
  paintStars(g, w, SURF * R - 20, rng, 260);
  if (!PLANET) PLANET = makePlanet(56);
  g.drawImage(PLANET, 790 + ((rng() * 140) | 0) - PLANET.pad, 30 - PLANET.pad);
  // small moon
  const mx = 300 + ((rng() * 120) | 0), my = 56;
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
    const d = x * x + y * y; if (d > 36) continue;
    const l = clamp(0.35 + (-x - y) * 0.06, 0.15, 1);
    g.fillStyle = mixRGB([20, 22, 40], [196, 204, 222], l); g.fillRect(mx + x, my + y, 1, 1);
  }
  // three ridge layers, far to near
  const seed = (G.seed + G.sector) | 0;
  const ridge = (base, amp, f, top, bot, rim, s2) => {
    for (let x = 0; x < w; x++) {
      const y = Math.round(base * R - (Math.abs(Math.sin(x * f + s2)) * amp + vnoise(x / 40, s2, seed) * amp * 0.8) * R);
      const gr = g.createLinearGradient(0, y, 0, SURF * R);
      gr.addColorStop(0, top); gr.addColorStop(1, bot);
      g.fillStyle = gr; g.fillRect(x, y, 1, SURF * R - y);
      g.fillStyle = rim; g.fillRect(x, y, 1, 1);
    }
  };
  ridge(90, 11, 0.008, '#2a1b42', '#1a1230', '#4a3366', 1);
  ridge(95, 7, 0.019, '#3a2340', '#241830', '#6a4458', 3);
  ridge(99, 3, 0.05, '#4d2e3c', '#2e1d2c', '#8a5a5a', 5);
  // regolith crust with pebbles
  for (let x = 0; x < w; x++) {
    const n = vnoise(x / 6, 0, seed);
    g.fillStyle = mixRGB([176, 122, 92], [140, 96, 74], n); g.fillRect(x, SURF * R, 1, 1);
    g.fillStyle = mixRGB([134, 92, 70], [108, 74, 60], n); g.fillRect(x, SURF * R + 1, 1, 2);
    for (let y = SURF * R + 3; y < h; y++) {
      const v = hash2(x, y, seed);
      g.fillStyle = v > 0.94 ? '#a87a62' : v < 0.05 ? '#3c2a2c' : mixRGB([110, 76, 62], [82, 56, 50], (y - SURF * R) / 5 + v * 0.2);
      g.fillRect(x, y, 1, 1);
    }
    if (hash2(x, 3, seed) > 0.985) { g.fillStyle = '#8a6a5a'; g.fillRect(x, SURF * R - 2, 3, 2); g.fillStyle = '#c09a82'; g.fillRect(x, SURF * R - 2, 2, 1); }
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
  S.fogX.clearRect(c, r, 1, 1);
  S.fogDirty = true;
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
function part(x, y, vx, vy, life, color, g = 0, size = 1, glow = false) { if (S.parts.length < 700) S.parts.push({ x, y, vx, vy, life, color, g, size, glow }); }
function explosion(x, y, n = 26) {
  for (let k = 0; k < n; k++) part(x, y, (Math.random() - 0.5) * 90, -Math.random() * 70 - 10, 0.5 + Math.random() * 0.7, pick([P.yellow, P.orange, P.red, P.white]), 70, Math.random() < 0.3 ? 1.5 : 1, true);
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
function jointsOf(r) {
  const out = [{ x: r.x, y: SURF + 1, seg: -1, t: 0 }];
  for (const id of r.segs) {
    const s = S.segs[id];
    if (s.status === 'gone') continue;
    const L = (s.status === 'queued' || s.status === 'drill') ? s.len : s.prog;
    out.push({ x: s.x1 + s.ux * L, y: s.y1 + s.uy * L, seg: id, t: L, planned: s.status === 'queued' || s.status === 'drill' });
  }
  return out;
}
function nearestJoint(r, px, py) {
  let best = null, bd = Infinity;
  for (const j of jointsOf(r)) { const d = Math.hypot(px - j.x, py - j.y); if (d < bd) { bd = d; best = j; } }
  best.d = bd;
  return best;
}
// lay a pipe run; returns the new joint at its far end so the next click can chain from it
function closestOnRig(r, px, py) {
  let best = { x: r.x, y: SURF + 1, d: Math.hypot(px - r.x, py - SURF - 1) };
  for (const id of r.segs) {
    const s = S.segs[id];
    if (s.status === 'gone' || s.prog <= 0) continue;
    const t = clamp((px - s.x1) * s.ux + (py - s.y1) * s.uy, 0, s.prog);
    const x = s.x1 + s.ux * t, y = s.y1 + s.uy * t, d = Math.hypot(px - x, py - y);
    if (d < best.d) best = { x, y, d };
  }
  return best;
}
// snap a target onto a nearby joint (10px) or drilled pipe (8px) of any of your rigs, ignoring the start joint
function snapPoint(px, py, start) {
  let best = null, bd = 10;
  for (const r of myRigs()) for (const j of jointsOf(r)) {
    if (j.seg < 0 || (start && Math.hypot(j.x - start.x, j.y - start.y) < 2)) continue;
    const d = Math.hypot(px - j.x, py - j.y);
    if (d < bd) { bd = d; best = { x: j.x, y: j.y, snap: 'joint' }; }
  }
  if (best) return best;
  bd = 8;
  for (const r of myRigs()) {
    const c = closestOnRig(r, px, py);
    if (c.d < bd && c.y > UG_TOP && (!start || Math.hypot(c.x - start.x, c.y - start.y) > 3)) { bd = c.d; best = { x: c.x, y: c.y, snap: 'pipe' }; }
  }
  return best || { x: px, y: py, snap: null };
}
function layPipe(r, start, tx, ty) {
  const sp = snapPoint(tx, ty, start);
  tx = sp.x; ty = sp.y;
  if (!orderDrill(r, start, tx, ty)) return null;
  const s = S.segs[S.segs.length - 1];
  return { x: s.x1 + s.ux * s.len, y: s.y1 + s.uy * s.len, seg: s.id, t: s.len };
}
function orderDrill(r, start, tx, ty) {
  tx = clamp(tx, 1, W - 2); ty = clamp(ty, UG_TOP + 2, UG_BOT - 2);
  const len = Math.hypot(tx - start.x, ty - start.y);
  if (len < 4) return false;
  if (r.owner === 'you' && G.credits <= 1) { afford(1e9); return false; }
  const s = { id: S.segs.length, rig: r.id, owner: r.owner, x1: start.x, y1: start.y,
    ux: (tx - start.x) / len, uy: (ty - start.y) / len, len, prog: 0, status: 'queued', parent: start.seg, tPar: start.t, tx, ty };
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
      if (p.status === 'done' && p.prog < s.tPar - 0.5) {
        // the previous run struck crude early: continue from where the pipe really ends toward this run's joint
        const ex = p.x1 + p.ux * p.prog, ey = p.y1 + p.uy * p.prog, len = Math.hypot(s.tx - ex, s.ty - ey);
        if (len < 2) { s.status = 'gone'; return; }
        s.x1 = ex; s.y1 = ey; s.ux = (s.tx - ex) / len; s.uy = (s.ty - ey) / len; s.len = len; s.tPar = p.prog;
      }
    }
    s.status = 'drill';
  }
  r.drilling = true;
  const mine = r.owner === 'you';
  let budget = (mine ? st.drill() : 14 + S.belt * 2.5) * dt;
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
        const tapped = r.pockets.has(p.id); // pipes pass through crude this rig already taps
        connect(r, p);
        if (p.amt > 0.5 && !tapped) {
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
    if (mine) {
      const tx = s.x1 + s.ux * s.prog, ty = s.y1 + s.uy * s.prog;
      revealAround(tx, ty, has('seismic') ? 4 : 1);
      // remember which of your rigs owns the pipe in each cell; with couplers, meeting another rig's pipe joins them
      const pc = cellIndexAt(tx, ty);
      if (pc >= 0) {
        const o = S.pcell[pc];
        if (!o) S.pcell[pc] = r.id;
        else if (o !== r.id && has('coupler')) {
          const other = S.rigs.find(x => x.id === o && x.owner === 'you');
          if (other && !netOf(r).has(other)) {
            const cp = closestOnRig(other, tx, ty), d = Math.hypot(cp.x - tx, cp.y - ty);
            s.len = s.prog; s.status = 'done'; s.capped = true;
            if (d > 0.5) {
              const c = { id: S.segs.length, rig: r.id, owner: 'you', x1: tx, y1: ty, ux: (cp.x - tx) / d, uy: (cp.y - ty) / d, len: d, prog: d,
                status: 'done', parent: s.id, tPar: s.prog, tx: cp.x, ty: cp.y, capped: true, bridge: true };
              S.segs.push(c); r.segs.push(c.id);
            }
            couple(r, other, cp.x, cp.y);
            break;
          }
        }
      }
    }
  }
  if (s.status === 'drill' && s.prog >= s.len - 1e-6) s.status = 'done';
  if (s.status === 'drill' && Math.random() < 0.35) {
    const x = s.x1 + s.ux * s.prog, y = s.y1 + s.uy * s.prog;
    part(x, y, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 0.25, pick([P.yellow, P.white, P.orange]), 0, 0.5, true);
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
    const r = { kind: 'rig', id: S.nid++, x, owner: 'you', tank: 0, pockets: new Set(), segs: [], offline: 0, dead: false, links: new Set() };
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
function buyHauler() {
  if (!afford(COST.hauler)) return;
  spend(COST.hauler);
  const h = spawnHauler();
  msg('HAULER LAUNCHED - SELLING AT ' + S.stations[h.side].name + '. ASSIGN SIDES WITH < > UP TOP', P.cyan);
}
function spawnHauler(side) {
  if (side == null) side = S.haulers.filter(h => h.side === 0).length <= S.haulers.filter(h => h.side === 1).length ? 0 : 1;
  const sx = S.stations[side].x;
  const h = { kind: 'hauler', id: S.nid++, side, x: sx + (side ? -40 : 40), y: -8, cargo: 0, state: 'idle', target: null,
    dir: side ? -1 : 1, wait: 0, sale: 0, think: 0.3, idleX: 0, idleY: 0, moving: false };
  park(h);
  S.haulers.push(h);
  sfx('buy');
  if (S.haulers.length >= 8) unlock('fleet');
  return h;
}
// every unit sold earns XP, and every 25 units earns 1 research data
function soldUnits(u, s) {
  jobDeliver(s, u);
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
  S.pipeReset = true;
  for (const o of r.links || []) o.links.delete(r);
  for (let i = 0; i < S.pcell.length; i++) if (S.pcell[i] === r.id) S.pcell[i] = 0;
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
// rigs joined by couplers form a network; every rig in it pumps from all of the network's pockets
function netOf(r) {
  const seen = new Set([r]), stack = [r];
  while (stack.length) for (const o of stack.pop().links || []) if (!o.dead && !seen.has(o)) { seen.add(o); stack.push(o); }
  return seen;
}
function netPockets(r) {
  if (!r.links || !r.links.size) return r.pockets;
  const out = new Set();
  for (const o of netOf(r)) for (const id of o.pockets) out.add(id);
  return out;
}
function couple(a, b, x, y) {
  (a.links ||= new Set()).add(b); (b.links ||= new Set()).add(a);
  S.joints.push({ x, y });
  msg('PIPES COUPLED: RIG #' + a.id + ' AND RIG #' + b.id + ' NOW SHARE THEIR POCKETS', P.crudeL);
  float(x, y - 6, 'COUPLED!', P.crudeG);
  sfx('strike');
}
function pumpAll(dt) {
  for (const r of S.rigs) {
    r.pumping = false;
    if (r.offline > 0) continue;
    const mine = r.owner === 'you';
    const space = mine ? st.rigCap() - r.tank : Infinity;
    const yl = mine ? st.yield() : 1;
    const want = Math.min((mine ? st.pump() : rivalPumpRate(r.owner)) * dt, space / yl);
    if (want <= 0) continue;
    const live = [];
    for (const id of (mine ? netPockets(r) : r.pockets)) { const p = S.pockets[id]; if (p.amt > 0) live.push(p); }
    if (!live.length) continue;
    let got = 0;
    const each = want / live.length;
    for (const p of live) {
      const g = Math.min(each * (p.cryo ? cryoFactor(r.owner) : 1), p.amt);
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
// haulers are automatic: each one is assigned a side (0 = HELIX, 1 = NOVA), fetches crude from
// whichever of your rigs/silos has the most unclaimed crude, and sells it at its side's station
function sellTarget(h) {
  const own = S.stations[h.side], other = S.stations[1 - h.side];
  if (has('auto') && other.closed <= 0 && (own.closed > 0 || price(other) > price(own) * 1.1)) return other;
  if (own.closed <= 0) return own;
  return other.closed <= 0 ? other : null;
}
function pickSource(h) {
  const room = st.hCap() - h.cargo;
  let best = null, bs = 0;
  for (const b of [...myRigs(), ...S.silos]) {
    let claimed = 0;
    for (const o of S.haulers) if (o !== h && o.target === b && (o.state === 'toLoad' || o.state === 'loading')) claimed += st.hCap() - o.cargo;
    const avail = b.tank - claimed;
    if (avail < Math.min(6, room)) continue;
    const sc = Math.min(avail, room) * 10 - Math.abs(b.x - h.x) * 0.05 + (b.kind === 'silo' ? 5 : 0);
    if (sc > bs) { bs = sc; best = b; }
  }
  return best;
}
function park(h) {
  const s = S.stations[h.side];
  h.idleX = s.x + (h.side ? -1 : 1) * (50 + (h.id % 4) * 7);
  h.idleY = CRUISE - 8 + (h.id % 3) * 5;
}
function goSell(h) {
  const s = sellTarget(h);
  if (!s) { h.state = 'idle'; h.target = null; park(h); return; }
  h.target = s; h.state = 'toSell';
}
// cheapest hauler to reassign: idle and empty first, mid-delivery last
function haulerCost(h) { return ({ idle: 0, toLoad: 1, loading: 2 }[h.state] ?? 3) * 100 + h.cargo; }
function sendHaulerTo(side) {
  const pool = S.haulers.filter(h => h.side !== side).sort((a, b) => haulerCost(a) - haulerCost(b));
  if (pool.length) { setSide(pool[0], side); return; }
  msg(S.haulers.length ? 'ALL YOUR HAULERS ALREADY SELL AT ' + S.stations[side].name : 'NO HAULERS YET - BUY ONE AT THE BOTTOM [3]', P.lgray);
  sfx('err');
}
function pullHaulerFrom(side) {
  const pool = S.haulers.filter(h => h.side === side).sort((a, b) => haulerCost(a) - haulerCost(b));
  if (!pool.length) { msg('NO HAULERS ARE SELLING AT ' + S.stations[side].name, P.lgray); sfx('err'); return; }
  setSide(pool[0], 1 - side);
}
function setSide(h, side) {
  if (h.side === side) return;
  h.side = side;
  park(h);
  if (h.state === 'toSell' || h.state === 'idle') { h.state = 'idle'; h.target = null; h.think = 0; }
  msg('HAULER NOW SELLS AT ' + S.stations[side].name, P.cyan);
  sfx('click');
}
function updateHauler(h, dt) {
  if (h.target && h.target.dead) { h.target = null; if (h.cargo > 0) goSell(h); else h.state = 'idle'; }
  h.moving = false;
  h.think -= dt;
  switch (h.state) {
    case 'idle': {
      flyTo(h, h.idleX, h.idleY, dt);
      if (h.think > 0) break;
      h.think = 0.5;
      if (h.cargo >= st.hCap() * 0.5 && sellTarget(h)) { goSell(h); break; }
      const src = pickSource(h);
      if (src) { h.target = src; h.state = 'toLoad'; }
      else if (h.cargo > 0) goSell(h);
      break;
    }
    case 'toLoad': { const [tx, ty] = dock(h.target); if (flyTo(h, tx, ty, dt)) { h.state = 'loading'; h.wait = 0; } break; }
    case 'loading': {
      const b = h.target; const [tx, ty] = dock(b); flyTo(h, tx, ty, dt);
      const cap = st.hCap(), room = cap - h.cargo;
      if (room <= 0.01) { h.cargo = cap; goSell(h); break; }
      const u = Math.min(18 * st.hRate() * dt, room, b.tank);
      if (u > 0.0001) { b.tank -= u; h.cargo += u; h.wait = 0; break; }
      h.wait += dt;
      if (h.wait < 1.2) break;
      if (h.cargo >= cap * 0.35) { goSell(h); break; }
      const src = pickSource(h);
      if (src && src !== b) { h.target = src; h.state = 'toLoad'; }
      else if (h.wait > 4 && h.cargo > 0) goSell(h);
      break;
    }
    case 'toSell': {
      if (h.target.closed > 0) { goSell(h); if (h.state !== 'toSell') break; }
      const [tx, ty] = dock(h.target);
      if (flyTo(h, tx, ty, dt)) h.state = 'selling';
      break;
    }
    case 'holding': {
      const s = h.target, [tx, ty] = dock(s);
      flyTo(h, tx, ty - 6 - (h.id % 3) * 5, dt);
      if (s.closed > 0) { goSell(h); break; }
      if (price(s) >= floorOf(s)) h.state = 'toSell';
      break;
    }
    case 'selling': {
      const s = h.target;
      if (s.closed > 0) { goSell(h); break; }
      if (floorOf(s) > 0 && price(s) < floorOf(s)) {
        h.state = 'holding';
        if (!s.holdMsg || GT - s.holdMsg > 20) { s.holdMsg = GT; msg('HAULERS HOLDING AT ' + s.name + ' - PRICE IS BELOW YOUR MINIMUM', P.orange); }
        break;
      }
      const u = Math.min(25 * st.hRate() * dt, h.cargo);
      const v = u * price(s);
      h.cargo -= u; h.sale += v;
      G.credits += v; G.totalEarned += v; S.stats.revenue += v; S.stats.sold += u;
      s.sat = Math.max(0.45, s.sat - u * 0.0025 * st.satMul());
      soldUnits(u, s);
      S.stats[s.name === 'HELIX' ? 'helix' : 'nova'] += u;
      if (h.cargo <= 1e-6) {
        h.cargo = 0;
        if (h.sale > 0.5) { float(h.x, h.y - 10, '+$' + fmt(h.sale), P.yellow); sfx('cash'); }
        h.sale = 0;
        h.state = 'idle'; h.target = null; h.think = 0; park(h);
      }
      break;
    }
  }
  if (h.moving && Math.random() < 0.35) part(h.x - h.dir * 6, h.y, -h.dir * 25, (Math.random() - 0.5) * 8, 0.3, pick([P.orange, P.yellow]), 0, 1, true);
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
      const mine = S.plots.filter(p => p.owner === id).length, allRival = S.plots.filter(p => isRival(p.owner)).length;
      if (free.length && S.bribe <= 0 && mine < (id === 'syn' ? 3 : 2) && allRival < 3) {
        free.sort((a, b) => b.oil - a.oil);
        const p = Math.random() < 0.6 ? free[0] : pick(free);
        msg(info.name + ' WANTS PLOT ' + (p.i + 1) + ' - AUCTION!', info.col);
        startAuction(p, id);
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
    if (dx > 90) continue;
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
  } else { const v = 300 + S.belt * 150; G.credits += v; msg('CONSORTIUM DEVELOPMENT GRANT +$' + v, P.lime); }
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
  hazardDaily(d);
  if (hasMod('quake') && d >= S.nextQuake) { quake(); S.nextQuake = d + 12 + Math.random() * 8; }
  if (S.abil.cd > 0) S.abil.cd--;
  if (S.abil.on > 0 && --S.abil.on === 0) msg(CHAR().active.name + ' WORE OFF', P.lgray);
  else if (S.abil.cd === 0 && d > 0 && S.abil.wasCd) msg(CHAR().active.name + ' IS READY [Q]', P.yellow);
  S.abil.wasCd = S.abil.cd > 0;
  for (const r of S.rigs) if (r.offline > 0) r.offline--;
  rivalDaily(d);
  if (d >= S.nextEvent) { randomEvent(); S.nextEvent = d + 14 + Math.random() * 14; }
  if (d === S.days - 10) { msg('10 DAYS LEFT IN THIS SECTOR', P.yellow); sfx('alert'); }
  if (d % 5 === 0) saveSector();
  if (d >= S.days) endSector();
}
function daysLeft() { return Math.max(0, S.days - Math.floor(S.day)); }
function myCrudeLeft() {
  const seen = new Set();
  let n = 0;
  for (const r of myRigs()) for (const id of netPockets(r)) if (!seen.has(id)) { seen.add(id); n += S.pockets[id].amt; }
  return n;
}
function allDry() { return myRigs().some(r => netPockets(r).size) && myCrudeLeft() <= 0.5; }
function finishEarly() {
  const left = daysLeft();
  // fast-forward rival pumping over the skipped days so ending early can't starve them
  for (let d = 0; d < left; d++) for (const r of S.rigs) {
    if (!isRival(r.owner) || r.offline > d) continue;
    const live = [...r.pockets].map(id => S.pockets[id]).filter(p => p.amt > 0);
    if (!live.length) continue;
    const each = rivalPumpRate(r.owner) * S.dayLen / live.length;
    for (const p of live) { const g = Math.min(each, p.amt); p.amt -= g; if (S.rv[r.owner]) S.rv[r.owner].pumped += g; }
  }
  S.early = { days: left };
  S.confirmEnd = false; S.paused = false;
  endSector();
}
function drawEndConfirm() {
  rect(0, 0, W, H, 'rgba(5,5,15,0.75)');
  const w = 280, h = 112, x = (W - w) / 2, y = 116;
  panel(x, y, w, h, P.navy, P.yellow);
  txtS('END SECTOR EARLY?', W / 2, y + 8, P.yellow, 2, 'c');
  const stock = myRigs().reduce((a, r) => a + r.tank, 0) + S.silos.reduce((a, s2) => a + s2.tank, 0) + S.haulers.reduce((a, h2) => a + h2.cargo, 0);
  const lines = [daysLeft() + ' DAYS LEFT - RIVALS STILL PUMP THROUGH THEM',
    stock > 1 ? fmt(stock) + 'U STILL IN TANKS SELLS AT 40%' : 'YOUR TANKS ARE EMPTY',
    'EARLY WITHDRAWAL BONUS GROWS WITH DAYS SAVED'];
  lines.forEach((l, i) => txt(l, W / 2, y + 30 + i * 10, i === 2 ? P.cyan : P.lgray, 1, 'c'));
  button(x + 16, y + h - 28, 120, 16, 'END SECTOR [ENTER]', finishEarly, { color: P.green, hc: P.lime, tc: P.navy });
  button(x + w - 136, y + h - 28, 120, 16, 'KEEP PLAYING [ESC]', () => { S.confirmEnd = false; }, { color: P.dgray });
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
  const rivalRep = rivalYear(avgBase);
  const bonuses = sectorBonuses(crude);
  if (S.deal && S.deal.bet) {
    const b = S.deal.bet, theirs = S.rv[b.rival] ? S.rv[b.rival].pumped : 0;
    if (S.stats.sold > theirs) bonuses.push(['SIDE BET WON VS ' + RIVALS[b.rival].short, b.stake * 2]);
    else bonuses.push(['SIDE BET LOST VS ' + RIVALS[b.rival].short, 0]);
  }
  for (const [, v] of bonuses) G.credits += v;
  const bonusTotal = bonuses.reduce((a, b) => a + b[1], 0);
  const interest = Math.round(G.debt * LOAN_RATE);
  G.debt += interest;
  let stipend = 0;
  if (G.credits < START_FLOOR) { stipend = Math.round(START_FLOOR - Math.max(0, G.credits)); G.credits = START_FLOOR; }
  G.report = { sector: G.sector, name: S.name, revenue: S.stats.revenue, spent: S.stats.spent, sold: S.stats.sold, gas: S.stats.gas,
    fire, crude, rivals: rivalRep, stipend, interest,
    rank: S.rank, jobs: S.stats.jobs, early: S.early || null, bonuses, bonusTotal, belt: S.belt };
  G.history.push({ s: G.sector, name: S.name, rev: Math.round(S.stats.revenue), sold: Math.round(S.stats.sold), helix: Math.round(S.stats.helix), nova: Math.round(S.stats.nova),
    profit: Math.round(S.stats.revenue + S.stats.gas + fire + bonusTotal - S.stats.spent), rivals: Object.fromEntries(rivalRep.map(r => [r.id, Math.round(r.pumped)])) });
  G.sector++;
  save();
  clearSectorSave();
  screen = 'summary';
  sfx('fanfare');
}

// ---------------------------------------------------------------- land auctions (Turmoil-style)
// Plots are won by bidding. Each bid resets the clock; rivals bid up to a hidden ceiling based on how rich the plot is.
function plotRank(p) { return [...S.plots].sort((a, b) => b.oil - a.oil).indexOf(p); }
function rivalCanBid(id) {
  const owned = S.plots.filter(p => p.owner === id).length, allRival = S.plots.filter(p => isRival(p.owner)).length;
  return S.bribe <= 0 && owned < (id === 'syn' ? 3 : 2) && allRival < 3;
}
function startAuction(plot, opener) {
  if (plot.owner) return;
  if (S.auction) { if (!S.auctionQueue.some(q => q.plot === plot)) S.auctionQueue.push({ plot, opener }); return; }
  const list = plotCost(plot), rich = 1 - plotRank(plot) / (NPLOTS - 1);
  const a = { plot, start: Math.max(50, Math.round(list * 0.6 / 10) * 10), inc: Math.max(20, Math.round(list * 0.08 / 10) * 10),
    bid: 0, leader: null, timer: 6, max: {}, next: {}, out: { you: false }, log: [], done: 0 };
  for (const id of S.rivals) {
    if (!rivalCanBid(id)) { a.out[id] = true; continue; }
    const greed = (id === 'syn' ? 1.15 + Math.random() * 0.55 : 0.85 + Math.random() * 0.5) * DF().rival * (S.deal && S.deal.muscle ? 0.8 : 1);
    a.max[id] = Math.round(list * greed * (0.75 + rich * 0.5) / 10) * 10;
    a.next[id] = 0.8 + Math.random() * 1.2;
  }
  S.auction = a;
  S.tool = null; S.drag = null; S.pen = null;
  if (opener === 'you') auctionBid('you');
  else if (opener) { auctionBid(opener); taunt(opener, pick(['THIS PLOT IS SPOKEN FOR.', 'BID AGAINST ME? CUTE.', 'GOING, GOING... MINE.'])); }
  sfx('alert');
}
function nextBid(a) { return a.leader ? a.bid + a.inc : a.start; }
function auctionBid(who) {
  const a = S.auction;
  if (!a || a.done) return;
  const amt = nextBid(a);
  if (who === 'you') {
    if (a.leader === 'you') return;
    if (G.credits < amt) { msg('NOT ENOUGH CREDITS TO BID $' + fmt(amt), P.red); sfx('err'); return; }
    a.out.you = false;
  }
  a.bid = amt; a.leader = who;
  a.timer = Math.max(a.timer, 3.2);
  a.log.unshift({ who, amt });
  if (a.log.length > 4) a.log.pop();
  sfx(who === 'you' ? 'buy' : 'click');
}
function auctionPass() {
  const a = S.auction;
  if (!a || a.done) return;
  a.out.you = true;
  a.timer = Math.min(a.timer, 1.5);
  sfx('click');
}
function updateAuction(dt) {
  const a = S.auction;
  if (a.done) {
    a.done -= dt;
    if (a.done <= 0) { S.auction = null; const q = S.auctionQueue.shift(); if (q) startAuction(q.plot, q.opener); }
    return;
  }
  for (const id of Object.keys(a.max)) {
    if (a.out[id] || a.leader === id) continue;
    a.next[id] -= dt;
    if (a.next[id] > 0) continue;
    if (nextBid(a) <= a.max[id]) { auctionBid(id); for (const o of Object.keys(a.next)) a.next[o] = 0.6 + Math.random() * 1.4; }
    else a.out[id] = true;
  }
  const rivalsLeft = Object.keys(a.max).some(id => !a.out[id] && a.leader !== id);
  if (!rivalsLeft && (a.out.you || a.leader === 'you')) a.timer = Math.min(a.timer, 1.6);
  a.timer -= dt;
  if (a.timer > 0) return;
  // hammer falls
  const p = a.plot;
  a.done = 1.4;
  if (!a.leader) { msg('NO BIDS - PLOT ' + (p.i + 1) + ' STAYS ON THE MARKET', P.lgray); return; }
  if (a.leader === 'you') {
    if (G.credits < a.bid) { msg('YOU COULD NOT PAY - THE SALE IS VOID', P.red); return; }
    if (pk('landbroker') > 0) { a.bid = Math.round(a.bid / 2); S.perks.landbroker--; msg('LAND BROKER HALVED THE PRICE', P.lime); }
    spend(a.bid); p.owner = 'you';
    msg('SOLD! PLOT ' + (p.i + 1) + ' IS YOURS FOR $' + fmt(a.bid), P.lime);
    sfx('fanfare'); gainXP(10); checkBaron();
  } else {
    p.owner = a.leader;
    msg('SOLD TO ' + RIVALS[a.leader].name + ' FOR $' + fmt(a.bid), rcol(a.leader));
    sfx('thud');
    S.rv[a.leader].queue.push({ day: S.lastDay + 2 + Math.random() * 3, plot: p.i });
  }
}
function drawAuction() {
  const a = S.auction, p = a.plot;
  // dim everything except the plot on the block
  const shade2 = 'rgba(5,5,15,0.62)';
  rect(0, 0, p.x0, H, shade2); rect(p.x1, 0, W - p.x1, H, shade2);
  rect(p.x0, 0, PLOT_W, SURF - 40, shade2); rect(p.x0, UG_BOT, PLOT_W, H - UG_BOT, shade2);
  brackets(p.x0, SURF - 40, PLOT_W, UG_BOT - SURF + 40, blink() ? P.yellow : P.orange);
  const w = 260, h = 150, x = p.x0 + PLOT_W / 2 < 320 ? 360 : 20, y = 112;
  panel(x, y, w, h, '#1b2350', P.yellow);
  txtS('LAND AUCTION', x + w / 2, y + 7, P.yellow, 2, 'c');
  const rank = plotRank(p), surveyed = has('survey');
  txt('PLOT ' + (p.i + 1) + (surveyed ? '  -  ' + (rank < 2 ? 'RICH' : rank < 4 ? 'FAIR' : 'POOR') + ' GROUND' : '  -  UNSURVEYED'), x + w / 2, y + 25, surveyed ? (rank < 2 ? P.lime : rank < 4 ? P.yellow : P.red) : P.lgray, 1, 'c');
  // current bid + leader
  if (a.leader) {
    const look = a.leader === 'you' ? CHAR().look : RIVALS[a.leader].look;
    drawPortrait(look, x + 12, y + 36, 2);
    txt(a.leader === 'you' ? 'YOU LEAD' : RIVALS[a.leader].name + ' LEADS', x + 50, y + 38, a.leader === 'you' ? P.cyan : rcol(a.leader));
    txtS('$' + fmt(a.bid), x + 50, y + 48, P.yellow, 2);
  } else {
    txt('OPENING BID', x + 50, y + 38, P.lgray);
    txtS('$' + fmt(a.start), x + 50, y + 48, P.white, 2);
  }
  // going once / twice / sold
  const call = a.done ? 'SOLD!' : a.timer < 1 ? 'GOING TWICE...' : a.timer < 2 ? 'GOING ONCE...' : '';
  if (call) txtS(call, x + w - 12, y + 52, a.done ? P.lime : P.orange, 1, 'r');
  meter(x + 12, y + 74, w - 24, 6, a.done ? 0 : a.timer / 6, a.timer < 2 ? P.orange : P.lime);
  // bidders
  let bx = x + 12;
  for (const id of Object.keys(a.out).filter(k => k !== 'you')) {
    const label = RIVALS[id].short + (a.out[id] ? ' OUT' : a.leader === id ? ' LEAD' : ' IN');
    txt(label, bx, y + 86, a.out[id] ? P.gray : rcol(id)); bx += tw(label) + 12;
  }
  a.log.slice(0, 3).forEach((l, i) => txt((l.who === 'you' ? 'YOU' : RIVALS[l.who].short) + ' BID $' + fmt(l.amt), x + w - 12, y + 86 + i * 8, i ? P.gray : P.lgray, 1, 'r'));
  if (!a.done) {
    const amt = nextBid(a), can = a.leader !== 'you' && G.credits >= amt;
    button(x + 12, y + h - 26, 140, 16, a.leader === 'you' ? 'YOU LEAD' : 'BID $' + fmt(amt) + ' [B]', () => auctionBid('you'), { disabled: !can, color: P.green, hc: P.lime, tc: P.navy });
    button(x + 160, y + h - 26, w - 172, 16, a.out.you ? 'PASSED' : 'PASS [ESC]', auctionPass, { disabled: a.out.you, color: P.dgray });
  }
  txt('YOU HAVE $' + fmt(G.credits), x + w / 2, y + h - 7, P.lgray, 1, 'c');
}

// ---------------------------------------------------------------- Glitch: burrowing alien that sniffs out gas
function releaseGlitch(x, y) {
  if (y < UG_TOP + 6 || y > UG_BOT - 4) { msg('DROP GLITCH UNDERGROUND', P.red); sfx('err'); return; }
  if (!afford(COST.glitch)) return;
  spend(COST.glitch);
  S.critters.push({ x, y, dir: Math.random() < 0.5 ? -1 : 1, vy: 0, t: 0, life: 16, sniffed: new Set() });
  for (let k = 0; k < 14; k++) part(x, y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 0.5, pick(['#73eff7', '#41a6f6', '#f4f4f4']), 0, 1, true);
  sfx('scan');
  S.tool = null;
}
function updateCritters(dt) {
  for (const c of S.critters) {
    c.t += dt;
    c.x += c.dir * 16 * dt;
    c.vy = clamp(c.vy + (Math.random() - 0.5) * 60 * dt, -10, 10);
    c.y += c.vy * dt;
    if (c.y < UG_TOP + 6) { c.y = UG_TOP + 6; c.vy = Math.abs(c.vy); }
    if (c.y > UG_BOT - 6) { c.y = UG_BOT - 6; c.vy = -Math.abs(c.vy); }
    if (c.x < 6 || c.x > W - 6) c.dir *= -1;
    if (Math.random() < 0.004) c.dir *= -1;
    revealAround(c.x, c.y, 2);
    if (Math.random() < 0.3) part(c.x - c.dir * 3, c.y + 2, -c.dir * 15, -Math.random() * 15, 0.4, pick(['#8a6352', '#b07a5c', '#5b4038']), 40);
    for (const g of S.gases) {
      if (!g.live || c.sniffed.has(g.id)) continue;
      const i = g.cells[0], gx = (i % COLS) * CELL + 2, gy = UG_TOP + ((i / COLS) | 0) * CELL + 2;
      if (Math.hypot(gx - c.x, gy - c.y) > 34) continue;
      c.sniffed.add(g.id);
      for (const ci of g.cells) reveal(ci % COLS, (ci / COLS) | 0);
      msg('GLITCH SNIFFED OUT A GAS POCKET! DRILL AROUND IT', P.cyan);
      float(c.x, c.y - 8, 'SNIFF!', P.cyan);
      if (Sound.sfx) { Sound.tone(1400, 0.08, 'square', 0.06); Sound.tone(1900, 0.1, 'square', 0.06, 0.08); }
    }
  }
  for (const c of S.critters) if (c.t >= c.life) {
    for (let k = 0; k < 16; k++) part(c.x, c.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 0.6, pick(['#73eff7', '#41a6f6', '#f4f4f4']), 0, 1, true);
    if (Sound.sfx) Sound.tone(900, 0.2, 'sine', 0.06, 0, 1800);
  }
  S.critters = S.critters.filter(c => c.t < c.life);
}
// a little blue alien with big ears, drawn in 2x pixels; d = facing
function drawGlitch(gx, gy, d, t) {
  const X = Math.round(gx * R), Y = Math.round(gy * R) + (Math.sin(t * 18) > 0 ? 0 : 1);
  const gq = (dx, dy, w, h, c) => q(d > 0 ? X + dx : X - dx - w + 1, Y + dy, w, h, c);
  const B = '#3b7dd8', BL = '#6aaef0', BD = '#24508f', E = '#0b0b14', IN = '#e39ad2';
  // ears (big and floppy)
  const flap = Math.sin(t * 10) > 0 ? 1 : 0;
  gq(-13, -11 + flap, 3, 2, B); gq(-12, -9 + flap, 6, 2, B); gq(-9, -7 + flap, 5, 2, B); gq(-11, -9 + flap, 4, 1, IN); gq(-8, -7 + flap, 3, 1, IN);
  gq(11, -11 - flap, 3, 2, B); gq(7, -9 - flap, 6, 2, B); gq(5, -7 - flap, 5, 2, B); gq(8, -9 - flap, 4, 1, IN); gq(6, -7 - flap, 3, 1, IN);
  // head
  gq(-5, -7, 11, 8, B); gq(-4, -8, 9, 1, BL); gq(-5, -7, 1, 7, BL); gq(5, -6, 1, 7, BD);
  // eyes
  gq(-3, -5, 3, 3, E); gq(2, -5, 3, 3, E); gq(-2, -5, 1, 1, '#f4f4f4'); gq(3, -5, 1, 1, '#f4f4f4');
  // nose + grin
  gq(0, -2, 2, 1, '#1b2350'); gq(-2, 0, 6, 1, BD);
  // body + digging arms
  gq(-3, 1, 7, 4, B); gq(-3, 1, 7, 1, BL);
  const dig = Math.sin(t * 22) > 0 ? 1 : -1;
  gq(4, 1 + dig, 3, 2, BL); gq(-5, 2 - dig, 2, 2, BD);
  gq(-2, 5, 2, 1, BD); gq(2, 5, 2, 1, BD);
}
function drawCritters() {
  for (const c of S.critters) {
    glow(c.x, c.y, 8, '#41a6f6', 0.3);
    drawGlitch(c.x, c.y, c.dir, c.t);
    if (c.life - c.t < 1.5 && blink()) txtS('BYE!', c.x, c.y - 14, P.cyan, 1, 'c');
  }
}

// ---------------------------------------------------------------- campaign: 6 belts x 3 sectors, Turmoil-style
const BELTS = [
  { name: 'FERTILE DRIFT', hazard: 'CRUDE ONLY - LEARN THE ROPES', col: '#a7f070' },
  { name: 'KESSLER ROCKS', hazard: 'SOLID ROCK BLOCKS YOUR DRILLS', col: '#94b0c2' },
  { name: 'VAPOR FIELDS', hazard: 'GAS POCKETS CAN BLOW OUT RIGS', col: '#73eff7' },
  { name: 'WRITHING DEEP', hazard: 'LIVING CRUDE CRAWLS AWAY FROM PIPES', col: '#ff5ca8' },
  { name: 'GLACIER BELT', hazard: 'CRYO-CRUDE PUMPS SLOWLY UNTIL HEATED', col: '#bfe7ff' },
  { name: 'THE VOID REACH', hazard: 'VOID STORMS GROUND HAULERS, FRY RIGS', col: '#c46cff' },
];
const BELT_SECTORS = [
  ['CERES DRIFT', 'GREENFALL', 'MEADOW ROCK', 'SEEDLING RIDGE', 'VERDANT GAP', 'LOAM HOLLOW'],
  ['KESSLER BELT', 'SHARD FIELD', 'GRAVEL REACH', 'IRONTOOTH', 'CRAG PASS', 'BOULDER SEA'],
  ['VESTA SHELF', 'FUME VALLEY', 'MIASMA RISE', 'GASLIGHT FLATS', 'VAPOR TRAIL', 'HISS CANYON'],
  ['PALLAS DEEP', 'WRITHE HOLLOW', 'SQUIRM FIELDS', 'PULSE CAVERN', 'CREEPING RIFT', 'ECHO MAW'],
  ['HYGIEA RIFT', 'RIME SHELF', 'FROSTBITE', 'PERMAFROST', 'ICE TEETH', 'WHITE SILENCE'],
  ['OORT VEIL', 'STORM EYE', 'THE MAW', 'NULL TIDE', 'STATIC SEA', 'LAST LIGHT'],
];
const SECTORS_PER_BELT = 3, TOTAL_SECTORS = 18;
const SHARE_LOTS = { 2: 15, 3: 15, 4: 20, 5: 20, 6: 30 }; // shares offered at the stock auction after each belt
const DIFFS = {
  easy: { name: 'EASY', desc: 'RICHER CRUDE, TAMER RIVALS, CHEAPER SHARES. -25% LEGACY', rival: 0.8, share: 0.85, crude: 1.2, legacy: 0.75 },
  normal: { name: 'NORMAL', desc: 'THE INTENDED TYCOON EXPERIENCE', rival: 1, share: 1, crude: 1, legacy: 1 },
  hard: { name: 'HARD', desc: 'LEAN POCKETS, RUTHLESS RIVALS, PRICIER SHARES. +50% LEGACY', rival: 1.25, share: 1.15, crude: 0.85, legacy: 1.5 },
};
function DF() { return DIFFS[(G && G.diff) || 'normal']; }
function beltOf(sector) { return clamp(Math.floor((sector - 1) / SECTORS_PER_BELT) + 1, 1, BELTS.length); }
function techCost(t) { return Math.round(t.cost * 100 * (1 - 0.05 * lv('rd')) / 50) * 50; }

function genMap() {
  const rng = mulberry32((G.seed * 13 + 7) >>> 0);
  G.map = [];
  for (let s = 1; s <= TOTAL_SECTORS; s++) {
    const belt = beltOf(s), step = [];
    for (let k = 0; k < 2; k++) {
      const nRiv = belt >= 4 && rng() < 0.4 ? 2 : 1;
      const pool = [...RIVAL_IDS], rivals = [];
      while (rivals.length < nRiv) rivals.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
      if (s === 1) rivals.splice(0, rivals.length, 'syn');
      const mp = MODS.filter(m => !(m.id === 'rocky' && belt < 2) && !(m.id === 'gas' && belt < 3) && !(m.id === 'quake' && belt < 2));
      const mods = [], nMod = s === 1 ? 0 : rng() < 0.5 ? 2 : 1;
      while (mods.length < nMod && mp.length) {
        const m = mp.splice(Math.floor(rng() * mp.length), 1)[0];
        if ((m.id === 'boom' && mods.includes('slump')) || (m.id === 'slump' && mods.includes('boom'))) continue;
        mods.push(m.id);
      }
      const payMul = Math.max(0.75, 1 + mods.reduce((a, id) => a + MODS.find(m => m.id === id).rd, 0) + 0.3 * (nRiv - 1));
      step.push({ k, name: BELT_SECTORS[belt - 1][((s - 1) % SECTORS_PER_BELT) * 2 + k], rivals, mods, payMul: Math.round(payMul * 100) / 100 });
    }
    G.map.push(step);
  }
}

// ---- rival finances: they hoard cash for stock auctions and spend some on upgrades
function rivalPumpRate(o) { return (2.8 + 0.3 * beltOf(G.sector)) * (1 + 0.12 * ((G.rtech && G.rtech[o]) || 0)) * DF().rival * (isChar('grane') ? 0.85 : 1); }
function rivalYear(avgBase) {
  const out = [];
  for (const id of RIVAL_IDS) {
    const active = S.rivals.includes(id), pumped = active ? S.rv[id].pumped : 0, belt = S.belt;
    const income = Math.round(((active ? pumped * avgBase * 0.55 : 0) + (active ? 600 : 350) * belt) * DF().rival * (1 - 0.08 * lv('hard')));
    const upgrade = Math.round(income * 0.25);
    G.rtech[id] += upgrade / (4000 * belt);
    G.rcash[id] += income - upgrade;
    out.push({ id, active, pumped, income, upgrade });
  }
  return out;
}

// ---- Turmoil-style end of sector bonuses
function sectorBonuses(crudeLeft) {
  const mine = S.plots.filter(p => p.owner === 'you');
  const onMine = cells => cells.some(i => { const x = (i % COLS) * CELL; return mine.some(p => x >= p.x0 && x < p.x1); });
  const base = Math.round((600 + 300 * S.belt) * (S.payMul || 1) / 10) * 10;
  const out = [];
  const myPockets = S.pockets.filter(p => onMine(p.cells));
  if (myPockets.length && myPockets.every(p => p.amt <= 0.5)) out.push(['ALL YOUR CRUDE DRAINED', base]);
  if (S.stats.sold > 0 && crudeLeft < 1) out.push(['EVERY DROP SOLD', base]);
  const myGas = S.gases.filter(g => onMine(g.cells));
  if (myGas.length && myGas.every(g => !g.live)) out.push(['ALL GAS CLEARED', base]);
  if (S.early && S.early.days > 0) out.push(['EARLY WITHDRAWAL (' + S.early.days + ' DAYS)', Math.round(base * Math.min(1.5, 0.5 + S.early.days / 60) / 10) * 10]);
  return out;
}

// ---- where the campaign goes after a sector summary
function afterSummary() {
  const done = G.report.sector;
  if (done % SECTORS_PER_BELT === 0 && beltOf(done) >= 2) { startStockAuction(beltOf(done), done >= TOTAL_SECTORS); return; }
  screen = 'shop';
}

// ---------------------------------------------------------------- consortium stock auction (Dutch: price falls until someone buys)
let SA = null;
function shareBase(belt) { return Math.round(1100 * (1 + 0.2 * (belt - 2)) * DF().share / 10) * 10; }
function startStockAuction(belt, final) {
  let n = (SHARE_LOTS[belt] || 0) + (G.unsold || 0);
  G.unsold = 0;
  SA = { belt, final, lots: [], i: 0, base: shareBase(belt), out: Object.fromEntries(RIVAL_IDS.map(id => [id, false])), log: [], round: 1, msg: '' };
  while (n > 0) { const k = Math.min(5, n); SA.lots.push(k); n -= k; }
  setupLot();
  screen = 'stock';
  sfx('alert');
}
function lotSize() { return SA.lots[SA.i] || 0; }
function setupLot() {
  SA.price = Math.round(SA.base * 1.8);
  SA.floor = Math.round(SA.base * (SA.round > 1 ? 0.25 : 0.45));
  SA.tick = 0; SA.sold = null; SA.hold = 0;
  SA.th = {};
  for (const id of RIVAL_IDS) {
    if (SA.out[id]) continue;
    const winning = G.rshares[id] + lotSize() >= 51;
    const greed = (winning ? 1.35 : 0.7 + Math.random() * 0.5) * DF().rival * (id === 'syn' ? 1.1 : 1);
    SA.th[id] = Math.round(SA.base * greed);
  }
}
function stockBuy(who) {
  if (!SA || SA.sold || SA.i >= SA.lots.length) return;
  const n = lotSize(), cost = SA.price * n;
  if (who === 'you') {
    if (G.credits < cost) { sfx('err'); return; }
    G.credits -= cost; G.shares += n;
    if (G.shares >= 25) unlock('shares');
    sfx('cash');
  } else { G.rcash[who] -= cost; G.rshares[who] += n; sfx('thud'); }
  SA.sold = { who, n, price: SA.price };
  SA.log.unshift(SA.sold); if (SA.log.length > 6) SA.log.pop();
  SA.hold = 1.3;
}
function updateStock(dt) {
  if (!SA) return;
  if (SA.hold > 0) {
    SA.hold -= dt;
    if (SA.hold > 0) return;
    if (G.shares >= 51) { endRun(true); return; }
    const top = topRival();
    if (G.rshares[top] >= 51) { endRun(false); return; }
    SA.i++;
    if (SA.i < SA.lots.length) { setupLot(); return; }
    finishStockRound();
    return;
  }
  if (SA.i >= SA.lots.length) return;
  SA.tick += dt;
  if (SA.tick < 0.12) return;
  SA.tick = 0;
  // rivals pounce once the price drops to what they'll pay and they can afford the lot
  const n = lotSize();
  for (const id of Object.keys(SA.th).sort(() => Math.random() - 0.5)) {
    if (SA.price <= SA.th[id] && G.rcash[id] >= SA.price * n) { stockBuy(id); return; }
  }
  SA.price = Math.max(SA.floor, Math.round(SA.price - SA.base * 0.027));
  if (SA.price <= SA.floor) {
    SA.floorT = (SA.floorT || 0) + 1;
    if (SA.floorT > 12) { // nobody bit: in the final rounds the richest bidder takes it, otherwise it rolls over
      SA.floorT = 0;
      if (SA.round > 1) {
        const rich = Object.keys(SA.th).filter(id => G.rcash[id] >= SA.price * n).sort((a, b) => G.rcash[b] - G.rcash[a])[0];
        if (rich) { stockBuy(rich); return; }
      }
      G.unsold = (G.unsold || 0) + n;
      SA.sold = { who: null, n, price: 0 };
      SA.hold = 1.0;
    }
  }
}
function finishStockRound() {
  if (!SA.final) { SA = null; screen = 'shop'; save(); return; }
  // final belt: lowest shareholder is eliminated and their stock is re-auctioned until someone holds 51
  const alive = ['you', ...RIVAL_IDS.filter(id => !SA.out[id])];
  if (alive.length === 1) { endRun(true); return; }
  const held = id => id === 'you' ? G.shares : G.rshares[id];
  const cash = id => id === 'you' ? G.credits : G.rcash[id];
  const lowest = alive.slice().sort((a, b) => held(a) - held(b) || cash(a) - cash(b))[0];
  if (lowest === 'you') { G.eliminated = true; endRun(false); return; }
  let n = G.rshares[lowest] + (G.unsold || 0);
  SA.msg = RIVALS[lowest].name + ' IS ELIMINATED - THEIR ' + G.rshares[lowest] + ' SHARES GO BACK ON THE BLOCK';
  G.rshares[lowest] = 0; G.unsold = 0; SA.out[lowest] = true;
  if (alive.length === 2) { endRun(true); return; }
  SA.lots = []; SA.i = 0; SA.round++;
  while (n > 0) { const k = Math.min(5, n); SA.lots.push(k); n -= k; }
  if (!SA.lots.length) { finishStockRound(); return; }
  setupLot();
  sfx('alert');
}
function drawShareGrid(gx, gy) {
  const owners = [];
  for (let k = 0; k < G.shares; k++) owners.push(P.cyan);
  while (owners.length < 100 - rivalTotal()) owners.push(P.dgray);
  for (const id of RIVAL_IDS) for (let k = 0; k < G.rshares[id]; k++) owners.push(rcol(id));
  for (let k = 0; k < 100; k++) rect(gx + (k % 10) * 10, gy + ((k / 10) | 0) * 10, 8, 8, owners[k] || P.dgray);
  rect(gx - 3, gy + 49, 105, 1, P.yellow);
  txt('51', gx - 6, gy + 47, P.yellow, 1, 'r');
}
function renderStock() {
  starfield(0.4);
  txtS('CONSORTIUM STOCK AUCTION', 320, 8, P.yellow, 2, 'c');
  txt('AFTER BELT ' + SA.belt + (SA.final ? ' - FINAL ROUND' + (SA.round > 1 ? ' ' + SA.round + ' (ELIMINATION)' : '') : '') + '.  PRICE FALLS UNTIL SOMEONE BUYS - WAIT TOO LONG AND A RIVAL SNAPS IT UP', 320, 26, P.lgray, 1, 'c');
  if (SA.msg) txt(SA.msg, 320, 36, P.orange, 1, 'c');
  // left: the lot on the block
  panel(10, 46, 300, 240, P.navy, P.yellow);
  const n = lotSize();
  if (SA.i < SA.lots.length) {
    txt('LOT ' + (SA.i + 1) + ' OF ' + SA.lots.length, 160, 54, P.lgray, 1, 'c');
    txtS(n + ' SHARES', 160, 64, P.white, 2, 'c');
    txt('PRICE PER SHARE', 160, 86, P.lgray, 1, 'c');
    txtS('$' + fmt(SA.price), 160, 96, SA.sold ? P.gray : P.yellow, 3, 'c');
    txt('LOT TOTAL $' + fmt(SA.price * n), 160, 118, P.white, 1, 'c');
    meter(30, 130, 260, 6, (SA.price - SA.floor) / (SA.base * 1.8 - SA.floor), P.yellow);
    txt('FAIR VALUE ~$' + fmt(SA.base) + ' / SHARE', 160, 140, P.gray, 1, 'c');
    if (SA.sold) {
      const who = SA.sold.who;
      txtS(who === 'you' ? 'YOURS!' : who ? 'SOLD TO ' + RIVALS[who].name : 'NO BUYERS - ROLLS OVER', 160, 160, who === 'you' ? P.lime : who ? rcol(who) : P.lgray, who === 'you' ? 2 : 1, 'c');
    } else {
      const can = G.credits >= SA.price * n;
      button(60, 160, 200, 22, can ? 'BUY NOW [SPACE]' : 'NOT ENOUGH CREDITS', () => stockBuy('you'), { disabled: !can, color: P.green, hc: P.lime, tc: P.navy, scale: 1 });
    }
  }
  txt('YOUR CASH $' + fmt(G.credits), 160, 196, P.yellow, 1, 'c');
  SA.log.forEach((l, i) => txt(l.who ? (l.who === 'you' ? 'YOU' : RIVALS[l.who].short) + ' BOUGHT ' + l.n + ' @ $' + fmt(l.price) : l.n + ' SHARES UNSOLD', 160, 212 + i * 9, i ? P.gray : P.lgray, 1, 'c'));
  // right: standings + rival war chests
  panel(320, 46, 310, 240, P.navy, P.gray);
  drawShareGrid(345, 58);
  let y = 60;
  txt('YOU', 460, y, P.cyan); txt(G.shares + ' SH', 620, y, P.cyan, 1, 'r'); y += 12;
  for (const id of RIVAL_IDS) {
    const out = SA.out[id];
    drawPortrait(RIVALS[id].look, 460, y - 1, 1);
    txt(RIVALS[id].short + (out ? ' (OUT)' : ''), 480, y + 1, out ? P.gray : rcol(id));
    txt(G.rshares[id] + ' SH', 620, y + 1, out ? P.gray : rcol(id), 1, 'r');
    txt('CASH $' + fmt(G.rcash[id]), 480, y + 10, P.gray);
    y += 24;
  }
  txt('UNSOLD ' + (100 - G.shares - rivalTotal()), 460, y + 2, P.lgray);
  txt('FIRST TO 51 SHARES RULES THE BELT', 475, 170, P.yellow, 1, 'c');
  if (SA.final) wrap('NO MAJORITY AFTER THIS ROUND? THE SMALLEST SHAREHOLDER IS ELIMINATED AND THEIR STOCK IS RE-AUCTIONED.', 46).forEach((l, i) => txt(l, 475, 184 + i * 8, P.orange, 1, 'c'));
  button(10, 296, 160, 16, 'BORROW $1,000 FIRST', borrow, { disabled: G.debt + LOAN_STEP > loanLimit(), color: P.plum, hc: P.crude });
  txt('DEBT $' + fmt(G.debt), 180, 301, G.debt ? P.orange : P.gray);
}

// ---------------------------------------------------------------- campaign map
let mapSel = null;
function mapNodeXY(s, k) { const b = beltOf(s) - 1, row = (s - 1) % SECTORS_PER_BELT; return [12 + b * 104 + 26 + k * 50, 82 + row * 52]; }
function renderMap() {
  starfield(0.3);
  txtS('CAMPAIGN MAP', 320, 6, P.crudeL, 2, 'c');
  txt('SECTOR ' + G.sector + ' OF ' + TOTAL_SECTORS + '  -  ' + DF().name + '  -  PICK A SECTOR, THEN LAUNCH', 320, 24, P.lgray, 1, 'c');
  const cur = G.sector;
  let hover = null;
  BELTS.forEach((b, i) => {
    const x = 12 + i * 104, here = beltOf(cur) === i + 1;
    panel(x, 34, 100, 196, here ? '#232b5c' : P.navy, here ? b.col : P.dgray);
    txt('BELT ' + (i + 1), x + 50, 39, b.col, 1, 'c');
    txt(b.name, x + 50, 47, P.white, 1, 'c');
    wrap(b.hazard, 23).forEach((l, k) => txt(l, x + 50, 56 + k * 7, P.gray, 1, 'c'));
    if (SHARE_LOTS[i + 1]) { txt('$ STOCK AUCTION', x + 50, 212, P.yellow, 1, 'c'); txt(SHARE_LOTS[i + 1] + ' SHARES', x + 50, 220, P.gray, 1, 'c'); }
  });
  // chosen path
  for (let s = 1; s < cur && s < TOTAL_SECTORS; s++) {
    const a = mapNodeXY(s, G.path[s - 1] || 0), b = mapNodeXY(s + 1, s + 1 < cur ? (G.path[s] || 0) : (mapSel != null ? mapSel : 0));
    ctx.strokeStyle = s + 1 < cur ? P.crudeL : 'rgba(215,123,255,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  for (let s = 1; s <= TOTAL_SECTORS; s++) for (let k = 0; k < 2; k++) {
    const node = G.map[s - 1][k], [x, y] = mapNodeXY(s, k);
    const past = s < cur, chosen = past && (G.path[s - 1] || 0) === k, now = s === cur;
    const hov = Math.hypot(mouse.x - x, mouse.y - y) < 10;
    if (hov) hover = { s, k, node };
    const col = chosen ? P.crudeL : now ? (mapSel === k ? P.yellow : P.white) : past ? P.dgray : P.gray;
    for (let a = 0; a < Math.PI * 2; a += 0.2) rect(Math.round(x + Math.cos(a) * 9), Math.round(y + Math.sin(a) * 9), 1, 1, col);
    if (now && (mapSel === k || blink())) glow(x, y, 10, mapSel === k ? '#ffcd75' : '#f4f4f4', 0.35);
    if (chosen) rect(x - 5, y - 5, 10, 10, '#5a1a85');
    txt('' + s, x, y - 2, chosen ? P.white : col, 1, 'c');
    node.rivals.forEach((id, j) => rect(x - 4 + j * 5, y + 11, 3, 3, rcol(id)));
    if (node.mods.length) txt(node.mods.length === 2 ? '**' : '*', x + 9, y - 10, P.orange);
    if (now) BTN.push({ x: x - 10, y: y - 10, w: 20, h: 20, fn: () => { mapSel = k; sfx('click'); } });
  }
  // detail of hovered / selected node
  const show = hover || (mapSel != null ? { s: cur, k: mapSel, node: G.map[cur - 1][mapSel] } : null);
  panel(12, 236, 410, 96, P.navy, P.gray);
  if (show) {
    const n = show.node, belt = beltOf(show.s);
    txt('SECTOR ' + show.s + ': ' + n.name, 20, 243, P.cyan);
    txt('BELT ' + belt + ' - ' + BELTS[belt - 1].hazard, 20, 252, BELTS[belt - 1].col);
    txt('RIVALS', 20, 264, P.red);
    n.rivals.forEach((id, j) => { drawPortrait(RIVALS[id].look, 20 + j * 120, 273, 1); txt(RIVALS[id].name, 40 + j * 120, 274, rcol(id)); txt(RIVALS[id].trait.split(':')[0], 40 + j * 120, 282, P.gray); });
    txt('CONDITIONS', 250, 264, P.yellow);
    if (!n.mods.length) txt('STANDARD', 250, 273, P.lgray);
    n.mods.forEach((id, j) => { const m = MODS.find(m => m.id === id); txt(m.name, 250, 273 + j * 16, P.white); txt(m.desc, 250, 281 + j * 16, P.gray); });
    txt('SECTOR BONUSES X' + n.payMul.toFixed(2), 20, 318, n.payMul > 1 ? P.lime : n.payMul < 1 ? P.orange : P.white);
  } else txt('HOVER A SECTOR FOR DETAILS. EACH STEP OFFERS TWO PATHS.', 217, 280, P.lgray, 1, 'c');
  // rival tracker
  panel(428, 236, 202, 96, P.navy, P.gray);
  txt('RIVAL WAR CHESTS', 529, 243, P.yellow, 1, 'c');
  RIVAL_IDS.forEach((id, j) => {
    const y = 254 + j * 22;
    drawPortrait(RIVALS[id].look, 436, y, 1);
    txt(RIVALS[id].short, 456, y + 1, rcol(id));
    txt(G.rshares[id] + ' SH', 622, y + 1, rcol(id), 1, 'r');
    txt('$' + fmt(G.rcash[id]) + '  TECH ' + G.rtech[id].toFixed(1), 456, y + 9, P.gray);
  });
  button(12, 338, 130, 16, '< WORKSHOP', () => { screen = 'shop'; sfx('click'); }, { color: P.dgray });
  button(150, 338, 90, 16, 'STATS', () => { TS.statsBack = 'map'; screen = 'stats'; sfx('click'); }, { color: P.dblue });
  const ok = mapSel != null;
  button(430, 338, 200, 16, ok ? 'LAUNCH SECTOR ' + cur + ' >>' : 'PICK A SECTOR FIRST', () => {
    G.path[cur - 1] = mapSel;
    const node = G.map[cur - 1][mapSel];
    mapSel = null;
    genSector(node); screen = 'play'; sfx('build');
  }, { disabled: !ok, color: P.green, hc: P.lime, tc: P.navy });
}

// ---------------------------------------------------------------- belt hazards: living crude, cryo-crude, void storms
const LIVING_RAMP = ['#ffe0ee', '#ff9ccc', '#ff5ca8', '#e03c8c', '#bc2c74', '#96205e', '#701648'];
const CRYO_RAMP = ['#ffffff', '#e4f6ff', '#bfe7ff', '#9cc9ee', '#7aa6d8', '#5a80b8', '#3e5c94'];
function assignHazards(rng) {
  for (const p of S.pockets) {
    if (S.belt >= 4 && rng() < 0.45) { p.living = true; p.crawlAt = 3 + rng() * 4; p.dir = rng() < 0.5 ? -1 : 1; }
    else if (S.belt >= 5 && rng() < 0.5) p.cryo = true;
  }
  if (S.belt >= 6) S.storm = { next: 10 + rng() * 6, active: 0, warned: false };
}
function cryoFactor(owner) { return owner === 'you' ? (has('heat2') ? 1 : has('heat1') ? 0.7 : 0.3) : 0.5; }

// ---- living crude: pockets crawl one cell at a time and can slip away from pipes
function pipeTouches(r, cellSet) {
  for (const id of r.segs) {
    const s = S.segs[id];
    if (s.status === 'gone' || s.prog <= 0) continue;
    for (let t = 0; t <= s.prog; t += 2) {
      const ci = cellIndexAt(s.x1 + s.ux * t, s.y1 + s.uy * t);
      if (ci < 0) continue;
      if (cellSet.has(ci) || cellSet.has(ci - 1) || cellSet.has(ci + 1) || cellSet.has(ci - COLS) || cellSet.has(ci + COLS)) return true;
    }
  }
  return false;
}
function crawl(p) {
  const anchored = has('bio') && S.rigs.some(r => r.owner === 'you' && r.pockets.has(p.id));
  if (anchored || p.amt <= 0) return;
  const tries = [[p.dir, 0], [0, 1], [0, -1], [-p.dir, 0]];
  for (const [dc, dr] of tries) {
    const own = new Set(p.cells);
    const moved = p.cells.map(i => { const c = i % COLS + dc, r = ((i / COLS) | 0) + dr; return (c < 1 || r < 1 || c >= COLS - 1 || r >= ROWS - 1) ? -1 : r * COLS + c; });
    if (moved.some(i => i < 0 || (!own.has(i) && S.grid[i] !== T_DIRT))) continue;
    for (const i of p.cells) { S.grid[i] = T_DIRT; S.pid[i] = -1; }
    for (const i of moved) { S.grid[i] = T_OIL; S.pid[i] = p.id; }
    const changed = new Set([...p.cells, ...moved]);
    p.cells = moved.sort((a, b) => b - a);
    let sx = 0, sy = 0, top = ROWS;
    for (const i of p.cells) { const r = (i / COLS) | 0; sx += i % COLS; sy += r; if (r < top) top = r; }
    p.cx = (sx / p.n) * CELL + 2; p.cy = UG_TOP + (sy / p.n) * CELL + 2; p.top = top;
    for (const i of changed) paintCell(i);
    if (dc) p.dir = dc;
    // pipes that no longer touch the pocket lose it
    const set = new Set(p.cells);
    for (const r of S.rigs) {
      if (!r.pockets.has(p.id) || pipeTouches(r, set)) continue;
      r.pockets.delete(p.id);
      if (r.owner === 'you') { msg('LIVING CRUDE CRAWLED AWAY FROM RIG #' + r.id + '! RE-DRILL TO CATCH IT', P.crudeL); float(p.cx, p.cy - 8, 'SLIPPED!', '#ff8ce0'); sfx('alert'); }
    }
    return;
  }
  p.dir = -p.dir;
}
function hazardDaily(d) {
  for (const p of S.pockets) if (p.living && d >= p.crawlAt) { crawl(p); p.crawlAt = d + 3 + Math.random() * 3; }
  const st2 = S.storm;
  if (!st2) return;
  if (st2.active > 0) {
    // lightning hits unshielded rigs (rivals too)
    for (const r of S.rigs) {
      if (r.offline > 0 || Math.random() > 0.22 || (r.owner === 'you' && has('shield1'))) continue;
      r.offline = 2; explosion(r.x, SURF - 26, 18);
      if (r.owner === 'you') { msg('LIGHTNING FRIED RIG #' + r.id + ' - OFFLINE 2 DAYS', P.red); sfx('boom'); S.shake = 6; }
    }
    if (--st2.active === 0) { msg('THE VOID STORM HAS PASSED', P.lgray); st2.next = d + 12 + Math.random() * 8; st2.warned = false; }
  } else if (d >= st2.next) {
    st2.active = 3;
    msg('VOID STORM! ' + (has('shield2') ? 'HAULERS SLOWED' : 'HAULERS GROUNDED') + (has('shield1') ? '' : ', RIGS AT RISK'), P.crudeL); sfx('boom'); S.shake = 8;
  } else if (!st2.warned && d >= st2.next - 2) { st2.warned = true; msg('VOID STORM INBOUND IN 2 DAYS', P.orange); sfx('alert'); }
}
function stormActive() { return !!(S && S.storm && S.storm.active > 0); }
function drawStorm() {
  if (!stormActive()) return;
  rect(0, 0, W, UG_TOP, 'rgba(60,20,90,0.35)');
  if (!S.bolt || GT > S.bolt.t + 0.25) { if (Math.random() < 0.04) S.bolt = { x: 20 + Math.random() * 600, t: GT, seed: Math.random() * 1000 }; }
  const b = S.bolt;
  if (b && GT - b.t < 0.25) {
    let x = b.x, y = 0;
    const rng = mulberry32(b.seed | 0);
    while (y < SURF) { const nx = x + (rng() - 0.5) * 14, ny = y + 6 + rng() * 6; for (let t = 0; t <= 1; t += 0.1) q(Math.round((x + (nx - x) * t) * R), Math.round((y + (ny - y) * t) * R), 2, 2, '#f3e6ff'); x = nx; y = ny; }
    glow(b.x, SURF / 2, 60, '#c46cff', 0.35);
    rect(0, 0, W, H, 'rgba(230,200,255,' + (0.18 * (1 - (GT - b.t) / 0.25)).toFixed(3) + ')');
  }
}

// ---------------------------------------------------------------- minimum sell price per refinery (Turmoil-style)
function setFloor(side, delta) {
  G.floors = G.floors || [0, 0];
  G.floors[side] = clamp((G.floors[side] || 0) + delta, 0, 60);
  S.stations[side].floor = G.floors[side];
  sfx('click');
}
function floorOf(s) { return s.floor || 0; }

// ---------------------------------------------------------------- mid-sector autosave
const SECTOR_KEY = 'voidcrude_sector_v1';
function hasSectorSave() { try { return !!localStorage.getItem(SECTOR_KEY); } catch (e) { return false; } }
function clearSectorSave() { try { localStorage.removeItem(SECTOR_KEY); } catch (e) { } }
function saveSector() {
  if (!S || screen !== 'play') return;
  const ref = o => o ? { kind: o.kind, id: o.kind === 'station' ? S.stations.indexOf(o) : o.id } : null;
  const data = {
    v: 1,
    s: {
      t: S.t, day: S.day, lastDay: S.lastDay, dayLen: S.dayLen, days: S.days, nid: S.nid, belt: S.belt, mods: S.mods, rivals: S.rivals, payMul: S.payMul,
      name: S.name, flare: S.flare, jam: S.jam, nextQuake: S.nextQuake, nextEvent: S.nextEvent, bribe: S.bribe, xp: S.xp, rank: S.rank, pending: S.pending,
      blasts: S.blasts, blasted: S.blasted, perks: S.perks, abil: S.abil, bmUses: S.bmUses, storm: S.storm || null, stats: S.stats, rv: S.rv, deal: S.deal || {},
      grid: Array.from(S.grid), pid: Array.from(S.pid), rev: Array.from(S.rev), pcell: Array.from(S.pcell), joints: S.joints,
      pockets: S.pockets, gases: S.gases, plots: S.plots, segs: S.segs.map(s => ({ ...s, drawn: 0, capped: false })),
      rigs: S.rigs.map(r => ({ id: r.id, kind: r.kind, x: r.x, owner: r.owner, tank: r.tank, pockets: [...r.pockets], segs: r.segs, offline: r.offline,
        tries: r.tries || 0, tried: r.tried ? [...r.tried] : [], nextTry: r.nextTry || 0, links: r.links ? [...r.links].map(o => o.id) : [] })),
      silos: S.silos.map(x => ({ kind: 'silo', id: x.id, x: x.x, tank: x.tank })),
      haulers: S.haulers.map(h => ({ ...h, target: ref(h.target) })),
      stations: S.stations, scans: S.scans.filter(sc => sc.done).map(sc => ({ x: sc.x, done: true, t: 1, dur: 1, rx: sc.rx, ry: sc.ry })),
    },
    g: G,
  };
  try { localStorage.setItem(SECTOR_KEY, JSON.stringify(data)); } catch (e) { }
}
function loadSector() {
  let data;
  try { data = JSON.parse(localStorage.getItem(SECTOR_KEY) || 'null'); } catch (e) { return false; }
  if (!data || !data.s) return false;
  G = data.g;
  const d = data.s;
  S = {
    ...d, rng: mulberry32((Math.random() * 1e9) | 0), speed: 1, paused: true, help: false, shake: 0,
    grid: Uint8Array.from(d.grid), pid: Int16Array.from(d.pid), rev: Uint8Array.from(d.rev), pcell: Int32Array.from(d.pcell),
    parts: [], floats: [], msgs: [], sel: null, tool: null, drag: null, auction: null, auctionQueue: [], critters: [],
    choice: null, taunt: null, bm: false, twinkles: [],
  };
  S.rigs = d.rigs.map(r => ({ ...r, pockets: new Set(r.pockets), tried: new Set(r.tried), links: new Set(), dead: false }));
  for (const r of S.rigs) r.links = new Set(d.rigs.find(x => x.id === r.id).links.map(id => S.rigs.find(o => o.id === id)).filter(Boolean));
  S.silos = d.silos.map(x => ({ ...x, dead: false }));
  const deref = t => !t ? null : t.kind === 'station' ? S.stations[t.id] : t.kind === 'silo' ? S.silos.find(x => x.id === t.id) : S.rigs.find(x => x.id === t.id);
  S.haulers = d.haulers.map(h => ({ ...h, target: deref(h.target) }));
  relink();
  buildDirt(); buildFog(); buildSky(); buildPipeLayer();
  for (let i = 0; i < S.rev.length; i++) if (S.rev[i]) S.fogX.clearRect(i % COLS, (i / COLS) | 0, 1, 1);
  S.fogDirty = true;
  for (let k = 0; k < 24; k++) S.twinkles.push({ x: (Math.random() * W) | 0, y: 14 + ((Math.random() * 60) | 0), f: 0.3 + Math.random(), p: Math.random() });
  msg('WELCOME BACK - SECTOR RESTORED. PRESS SPACE TO RESUME', P.cyan);
  if (S.pending > 0) offerCards();
  screen = 'play';
  return true;
}

// ---------------------------------------------------------------- the Cantina: shady deals between sectors
const CANTINA_FOLK = {
  moxie: { name: 'MOXIE', role: 'BARTENDER BOT', look: { bg: '#29366f', skin: '#94b0c2', hair: '#ef7d57', style: 'helmet', eye: '#ffcd75', acc: 'visor', suit: '#566c86' } },
  zeke: { name: 'OLD ZEKE', role: 'RETIRED PROSPECTOR', look: { bg: '#5b4038', skin: '#d39b6a', hair: '#f4f4f4', style: 'short', eye: '#1a1c2c', acc: 'beard', suit: '#7a3a20', hat: '#8a6352' } },
  sly: { name: 'SLY VEX', role: 'FIXER', look: { bg: '#1a1c2c', skin: '#a7f070', hair: '#5d275d', style: 'slick', eye: '#ffcd75', acc: 'monocle', suit: '#5d275d' } },
};
const DEALS = [
  { id: 'tip', who: 'zeke', name: 'A HOT TIP', desc: 'NEXT SECTOR, THE RICHEST PLOT IS FLAGGED "TIP" AND RATED', quip: 'I SMELL CRUDE THE WAY YOU SMELL COFFEE.', cost: b => 500 * b },
  { id: 'rigs', who: 'moxie', name: 'BULK RIG ORDER', desc: 'RIGS COST 50% LESS ALL NEXT SECTOR', quip: 'A CRATE FELL OFF A FREIGHTER. SEVERAL CRATES.', cost: b => 700 * b },
  { id: 'fix', who: 'sly', name: 'PRICE FIX', desc: 'ONE REFINERY PAYS +25% FOR THE FIRST 30 DAYS', quip: 'THE BUYER AT THE DOCK OWES ME. BIG.', cost: b => 900 * b },
  { id: 'muscle', who: 'sly', name: 'HIRED MUSCLE', desc: 'RIVALS BID 20% LESS AT LAND AUCTIONS NEXT SECTOR', quip: 'MY FRIENDS CAN BE VERY PERSUASIVE.', cost: b => 800 * b },
  { id: 'hauler', who: 'moxie', name: 'SMUGGLED HAULER', desc: 'A FREE HAULER WAITS FOR YOU NEXT SECTOR', quip: 'NO PAPERWORK. NO QUESTIONS.', cost: b => 150 * b },
  { id: 'bet', who: 'zeke', name: 'SIDE BET', desc: 'BET YOU SELL MORE CRUDE THAN YOUR NEXT RIVAL PUMPS. WIN = 2X', quip: 'A LITTLE WAGER KEEPS AN OLD MAN YOUNG.', cost: b => 1000 * b },
];
function cantinaOffers() {
  if (!G.cantina || G.cantina.sector !== G.sector) {
    const rng = mulberry32((G.seed * 31 + G.sector * 53) >>> 0), pool = [...DEALS], offers = [];
    while (offers.length < 3) offers.push(pool.splice(Math.floor(rng() * pool.length), 1)[0].id);
    G.cantina = { sector: G.sector, offers, bought: [], fixSide: rng() < 0.5 ? 0 : 1 };
  }
  return G.cantina;
}
function buyDeal(d) {
  const c = cantinaOffers(), cost = d.cost(beltOf(G.sector));
  if (c.bought.includes(d.id) || G.credits < cost) { sfx('err'); return; }
  G.credits -= cost; c.bought.push(d.id);
  G.deals = G.deals || [];
  G.deals.push(d.id === 'fix' ? 'fix' + c.fixSide : d.id);
  if (d.id === 'bet') G.bet = cost;
  sfx('cash'); save();
}
function applyDeals() {
  S.deal = {};
  for (const id of G.deals || []) {
    if (id === 'tip') { const best = [...S.plots].sort((a, b) => b.oil - a.oil)[0]; best.tip = true; S.deal.tip = true; }
    else if (id === 'rigs') S.deal.rigHalf = true;
    else if (id === 'fix0' || id === 'fix1') { const s = S.stations[+id[3]]; s.mult = 1.25; s.multT = 30; }
    else if (id === 'muscle') S.deal.muscle = true;
    else if (id === 'hauler') spawnHauler();
    else if (id === 'bet') S.deal.bet = { stake: G.bet || 0, rival: S.rivals[0] };
  }
  if ((G.deals || []).length) msg('CANTINA DEALS ACTIVE: ' + G.deals.length, P.orange);
  G.deals = [];
}
function renderCantina() {
  starfield(0.15);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(60,24,30,0.55)'); g.addColorStop(1, 'rgba(20,8,14,0.85)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  txtS('THE RUSTY NEBULA CANTINA', 320, 10, P.orange, 2, 'c');
  txt('DEALS LAST ONE SECTOR. NEW FACES EVERY SECTOR. CASH: $' + fmt(G.credits), 320, 30, P.lgray, 1, 'c');
  const c = cantinaOffers(), belt = beltOf(G.sector);
  c.offers.forEach((id, i) => {
    const d = DEALS.find(x => x.id === id), f = CANTINA_FOLK[d.who], x = 14 + i * 206, y = 48, w = 198, h = 250;
    const owned = c.bought.includes(id), cost = d.cost(belt);
    panel(x, y, w, h, '#2a1420', owned ? P.lime : P.orange);
    drawPortrait(f.look, x + w / 2 - 24, y + 10, 3);
    txt(f.name, x + w / 2, y + 64, P.yellow, 1, 'c');
    txt(f.role, x + w / 2, y + 73, P.gray, 1, 'c');
    wrap('"' + d.quip + '"', 44).forEach((l, k) => txt(l, x + w / 2, y + 88 + k * 9, P.lgray, 1, 'c'));
    txtS(d.name, x + w / 2, y + 122, P.white, 1, 'c');
    const desc = id === 'fix' ? d.desc.replace('ONE REFINERY', S && S.stations ? ['HELIX', 'NOVA'][c.fixSide] : ['HELIX', 'NOVA'][c.fixSide]) : d.desc;
    wrap(desc, 44).forEach((l, k) => txt(l, x + w / 2, y + 136 + k * 9, P.white, 1, 'c'));
    txtS('$' + fmt(cost), x + w / 2, y + 180, P.yellow, 2, 'c');
    if (owned) txtS('DEAL STRUCK', x + w / 2, y + 214, P.lime, 1, 'c');
    else button(x + 30, y + 208, w - 60, 18, 'SHAKE ON IT', () => buyDeal(d), { disabled: G.credits < cost, color: P.plum, hc: P.crude });
  });
  if (G.bet && (G.deals || []).includes('bet')) txt('BET STAKE: $' + fmt(G.bet), 320, 306, P.orange, 1, 'c');
  button(14, 330, 140, 16, '< WORKSHOP', () => { screen = 'shop'; sfx('click'); }, { color: P.dgray });
}

// ---------------------------------------------------------------- stats screen
function renderStats() {
  starfield(0.2);
  txtS('CAMPAIGN STATS', 320, 8, P.crudeL, 2, 'c');
  const hst = G.history || [];
  if (!hst.length) { txt('FINISH A SECTOR TO SEE YOUR NUMBERS.', 320, 160, P.lgray, 1, 'c'); }
  else {
    // profit per sector
    panel(10, 30, 400, 150, P.navy, P.gray);
    txt('PROFIT PER SECTOR', 20, 37, P.yellow);
    const mx = Math.max(1, ...hst.map(h => Math.abs(h.profit)));
    const bw = Math.min(20, Math.floor(370 / TOTAL_SECTORS)), base = 110;
    rect(20, base, 380, 1, P.gray);
    hst.forEach((h, i) => {
      const hgt = Math.round(Math.abs(h.profit) / mx * 60), x = 22 + i * (bw + 1);
      rect(x, h.profit >= 0 ? base - hgt : base + 1, bw - 1, hgt, h.profit >= 0 ? P.green : P.red);
      txt('' + h.s, x + bw / 2, 175 - 2, P.gray, 1, 'c');
      if (inRect(mouse, x, 40, bw, 135)) txtS(h.name + ': $' + fmt(h.profit), 210, 50, P.white, 1, 'c');
    });
    txt('BEST $' + fmt(Math.max(...hst.map(h => h.profit))), 400, 37, P.lime, 1, 'r');
    // crude: you vs rivals
    panel(10, 186, 400, 140, P.navy, P.gray);
    txt('CRUDE: YOU SOLD VS RIVALS PUMPED', 20, 193, P.yellow);
    const series = [['you', P.cyan, h => h.sold], ...RIVAL_IDS.map(id => [id, rcol(id), h => (h.rivals || {})[id] || 0])];
    const cm = Math.max(1, ...hst.flatMap(h => series.map(s2 => s2[2](h))));
    for (const [id, col, f] of series) {
      let prev = null;
      hst.forEach((h, i) => {
        const x = 30 + i * 21, y = 312 - Math.round(f(h) / cm * 100);
        if (prev) { const n = Math.max(Math.abs(x - prev[0]), Math.abs(y - prev[1])); for (let t = 0; t <= n; t++) rect(Math.round(prev[0] + (x - prev[0]) * t / n), Math.round(prev[1] + (y - prev[1]) * t / n), 1, 1, col); }
        rect(x - 1, y - 1, 3, 3, col);
        prev = [x, y];
      });
    }
    let lx = 30;
    for (const [id, col] of series) { const label = id === 'you' ? 'YOU' : RIVALS[id].short; rect(lx, 202, 6, 4, col); txt(label, lx + 9, 201, col); lx += tw(label) + 22; }
  }
  // totals
  panel(418, 30, 212, 296, P.navy, P.gray);
  txt('CAMPAIGN TOTALS', 524, 37, P.yellow, 1, 'c');
  const sum = f => hst.reduce((a, h) => a + (f(h) || 0), 0);
  const rows = [['SECTORS PLAYED', '' + hst.length], ['LIFETIME EARNINGS', '$' + fmt(G.totalEarned)], ['CRUDE SOLD', fmt(sum(h => h.sold)) + 'U'],
    ['SOLD AT HELIX', fmt(sum(h => h.helix)) + 'U'], ['SOLD AT NOVA', fmt(sum(h => h.nova)) + 'U'], ['YOUR SHARES', '' + G.shares],
    ['DIFFICULTY', DF().name], ['DEBT', '$' + fmt(G.debt)]];
  rows.forEach(([a, b], i) => { txt(a, 428, 52 + i * 12, P.lgray); txt(b, 620, 52 + i * 12, P.white, 1, 'r'); });
  const hx = sum(h => h.helix), nv = sum(h => h.nova), tot = Math.max(1, hx + nv);
  txt('STATION SPLIT', 524, 160, P.yellow, 1, 'c');
  meter(428, 172, 192, 10, hx / tot, P.cyan);
  txt('HELIX ' + Math.round(hx / tot * 100) + '%', 428, 186, P.cyan); txt(Math.round(nv / tot * 100) + '% NOVA', 620, 186, P.lgray, 1, 'r');
  txt('RIVAL WAR CHESTS', 524, 206, P.yellow, 1, 'c');
  RIVAL_IDS.forEach((id, i) => { txt(RIVALS[id].short, 428, 220 + i * 12, rcol(id)); txt('$' + fmt(G.rcash[id]) + '  ' + G.rshares[id] + 'SH', 620, 220 + i * 12, P.white, 1, 'r'); });
  button(10, 334, 140, 16, '< BACK', () => { screen = TS.statsBack || 'shop'; sfx('click'); }, { color: P.dgray });
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
  updateCritters(dt);
  for (const p of S.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
  S.parts = S.parts.filter(p => p.life > 0);
  for (const f of S.floats) { f.y -= 12 * dt; f.life -= dt; }
  S.floats = S.floats.filter(f => f.life > 0);
  for (const r of S.rigs) if (r.offline > 0 && Math.random() < 0.15) part(r.x + (Math.random() - 0.5) * 4, SURF - 24, (Math.random() - 0.5) * 6, -15, 1.2, pick([P.dgray, P.gray]));
}

// ---------------------------------------------------------------- UI primitives (16-bit style windows)
function panel(x, y, w, h, bg = P.navy, edge = P.gray) {
  const X = Math.round(x * R), Y = Math.round(y * R), Wd = Math.round(w * R), Ht = Math.round(h * R);
  q(X, Y, Wd, Ht, '#04050b');
  q(X + 1, Y + 1, Wd - 2, Ht - 2, edge);
  q(X + 1, Y + 1, Wd - 2, 1, shade(edge, 0.5));
  q(X + 2, Y + 2, Wd - 4, Ht - 4, '#04050b');
  const g = ctx.createLinearGradient(0, (Y + 3) / R, 0, (Y + Ht - 3) / R);
  g.addColorStop(0, shade(bg, 0.2)); g.addColorStop(1, shade(bg, -0.35));
  ctx.fillStyle = g; ctx.fillRect((X + 3) / R, (Y + 3) / R, (Wd - 6) / R, (Ht - 6) / R);
  q(X + 3, Y + 3, Wd - 6, 1, 'rgba(255,255,255,0.12)');
}
function button(x, y, w, h, label, fn, o = {}) {
  const dis = !!o.disabled, hov = !dis && inRect(mouse, x, y, w, h);
  const base = dis ? '#2b3047' : hov ? (o.hc || P.blue) : (o.color || P.dblue);
  const X = Math.round(x * R), Y = Math.round(y * R), Wd = Math.round(w * R), Ht = Math.round(h * R);
  q(X, Y, Wd, Ht, o.active ? P.yellow : '#04050b');
  const g = ctx.createLinearGradient(0, (Y + 1) / R, 0, (Y + Ht - 1) / R);
  g.addColorStop(0, shade(base, 0.28)); g.addColorStop(1, shade(base, -0.3));
  ctx.fillStyle = g; ctx.fillRect((X + 1) / R, (Y + 1) / R, (Wd - 2) / R, (Ht - 2) / R);
  q(X + 1, Y + 1, Wd - 2, 1, shade(base, dis ? 0.15 : 0.6));
  q(X + 1, Y + Ht - 2, Wd - 2, 1, shade(base, -0.55));
  if (o.active) q(X + 1, Y + 1, Wd - 2, 1, '#fff3c0');
  txtS(label, x + w / 2, y + ((h - 5) >> 1), dis ? P.gray : (o.tc || P.white), o.scale || 1, 'c');
  BTN.push({ x, y, w, h, fn: dis ? null : fn });
}
function hudBar(y, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#2c3672'); g.addColorStop(0.5, '#1b2350'); g.addColorStop(1, '#10152f');
  ctx.fillStyle = g; ctx.fillRect(0, y, W, h);
  q(0, y * R, W * R, 1, '#5a6cb0');
  q(0, (y + h) * R - 1, W * R, 1, '#05060c');
}
function meter(x, y, w, h, f, col) {
  const X = Math.round(x * R), Y = Math.round(y * R), Wd = Math.round(w * R), Ht = Math.round(h * R), fw = Math.round((Wd - 2) * clamp(f, 0, 1));
  q(X, Y, Wd, Ht, '#04050b');
  q(X + 1, Y + 1, Wd - 2, Ht - 2, '#161a2e');
  if (fw > 0) {
    q(X + 1, Y + 1, fw, Ht - 2, col);
    q(X + 1, Y + 1, fw, 1, shade(col, 0.5));
    q(X + 1, Y + Ht - 2, fw, 1, shade(col, -0.4));
  }
}
function brackets(x, y, w, h, c) {
  rect(x, y, 3, 1, c); rect(x, y, 1, 3, c); rect(x + w - 3, y, 3, 1, c); rect(x + w - 1, y, 1, 3, c);
  rect(x, y + h - 1, 3, 1, c); rect(x, y + h - 3, 1, 3, c); rect(x + w - 3, y + h - 1, 3, 1, c); rect(x + w - 1, y + h - 3, 1, 3, c);
}
const blink = () => ((GT * 3) | 0) % 2 === 0;

// ---------------------------------------------------------------- sprites (drawn in 2x pixels)
const STEEL_D = [52, 62, 88], STEEL_L = [184, 198, 222];
function drawRig(r, baseY = SURF) {
  const X = Math.round(r.x * R), Y = baseY * R;
  const rival = isRival(r.owner), mine = r.owner === 'you', off = r.offline > 0;
  const fr = off ? '#6b7080' : rival ? rcol(r.owner) : '#a9bbcf';
  const frL = shade(fr, 0.4), frD = shade(fr, -0.45), frM = shade(fr, -0.2);
  q(X - 17, Y - 1, 34, 2, 'rgba(0,0,0,0.4)');
  // skid with hazard stripes
  q(X - 14, Y - 8, 28, 7, '#3a4258'); q(X - 14, Y - 8, 28, 1, '#8b9bc0'); q(X - 14, Y - 2, 28, 1, '#1c2032');
  for (let row = 0; row < 3; row++) for (let i = 0; i < 24; i++) q(X - 12 + i, Y - 6 + row, 1, 1, ((i + row) >> 1) & 1 ? '#ffcd75' : '#1a1c2c');
  // lattice tower
  for (let k = 0; k < 40; k++) {
    const yy = Y - 9 - k, hw = Math.round(11 - k * 7 / 40);
    q(X - hw - 1, yy, 2, 1, frL); q(X + hw - 1, yy, 2, 1, frD);
    if (k % 10 === 0) q(X - hw + 1, yy, hw * 2 - 2, 1, frM);
    else {
      const t = (k % 10) / 10, span = hw * 2 - 3;
      q(X - hw + 1 + Math.round(t * span), yy, 1, 1, frM);
      q(X + hw - 2 - Math.round(t * span), yy, 1, 1, frD);
    }
  }
  // crown block + mast
  q(X - 7, Y - 54, 14, 5, fr); q(X - 7, Y - 54, 14, 1, frL); q(X - 7, Y - 50, 14, 1, frD); q(X + 5, Y - 53, 2, 3, frD);
  q(X - 1, Y - 61, 2, 7, frM); q(X - 1, Y - 61, 1, 7, frL);
  const on = ((GT * 2 + r.id * 0.37) % 2) < 1;
  const bc = off ? '#ff5a6a' : rival ? '#ef7d57' : '#a7f070';
  q(X - 1, Y - 63, 2, 2, on || off ? bc : '#333c57');
  if (on || off) glow((X) / R, (Y - 62) / R, 7, bc, 0.9);
  // pump jack (bobs while pumping)
  const po = r.pumping ? Math.round(Math.sin(GT * 8 + r.id) * 3) : 0;
  const pc = rival ? shade(rcol(r.owner), 0.3) : '#ffcd75';
  q(X - 1, Y - 38 + po, 2, 12, '#d6e0f0');
  q(X - 5, Y - 27 + po, 10, 9, pc); q(X - 5, Y - 27 + po, 10, 1, shade(pc, 0.6)); q(X + 3, Y - 26 + po, 2, 8, shade(pc, -0.4));
  q(X - 2, Y - 17, 4, 9, '#566c86'); q(X - 2, Y - 17, 1, 9, '#8b9bc0');
  if (mine) {
    const cap = st.rigCap(), f = clamp(r.tank / cap, 0, 1), fh = Math.round(29 * f);
    q(X + 14, Y - 39, 7, 33, '#04050b'); q(X + 15, Y - 38, 5, 31, '#1a1426');
    if (fh) { q(X + 15, Y - 7 - fh, 5, fh, '#9b30d9'); q(X + 15, Y - 7 - fh, 1, fh, '#c46cff'); q(X + 15, Y - 7 - fh, 5, 1, '#f3c6ff'); }
    q(X + 19, Y - 38, 1, 31, 'rgba(255,255,255,0.14)');
    if (f >= 0.999) { glow((X + 17) / R, (Y - 22) / R, 9, '#d77bff', 0.45 + 0.25 * Math.sin(GT * 6)); if (blink()) txtS('FULL', r.x + 1, baseY - 37, P.orange, 1, 'c'); }
  }
  if (off && blink()) txtS('OFFLINE', r.x, baseY - 37, P.red, 1, 'c');
}
function cylinder(X, Y, w, h, dark, light) {
  for (let i = 0; i < w; i++) {
    const l = clamp(Math.cos(((i + 0.5) / w - 0.35) * Math.PI) * 0.95, 0, 1);
    q(X + i, Y, 1, h, mixRGB(dark, light, l));
  }
}
function drawSilo(s) {
  const X = Math.round(s.x * R), Y = SURF * R;
  q(X - 17, Y - 1, 34, 2, 'rgba(0,0,0,0.4)');
  cylinder(X - 14, Y - 23, 28, 22, STEEL_D, STEEL_L);
  [26, 24, 21, 17, 12, 6].forEach((w2, k) => cylinder(X - (w2 >> 1), Y - 24 - k, w2, 1, STEEL_D, STEEL_L));
  q(X - 14, Y - 17, 28, 1, 'rgba(0,0,0,0.35)'); q(X - 14, Y - 9, 28, 1, 'rgba(0,0,0,0.35)');
  q(X - 14, Y - 16, 28, 1, 'rgba(255,255,255,0.12)'); q(X - 14, Y - 8, 28, 1, 'rgba(255,255,255,0.12)');
  const f = clamp(s.tank / st.siloCap(), 0, 1), fh = Math.round(17 * f);
  q(X - 3, Y - 22, 6, 19, '#04050b'); q(X - 2, Y - 21, 4, 17, '#1a1426');
  if (fh) { q(X - 2, Y - 4 - fh, 4, fh, '#9b30d9'); q(X - 2, Y - 4 - fh, 4, 1, '#f3c6ff'); }
  q(X + 1, Y - 21, 1, 17, 'rgba(255,255,255,0.15)');
  if (f >= 0.999) glow(s.x, SURF - 6, 8, '#d77bff', 0.35);
}
function drawStation(s) {
  const X = Math.round(s.x * R), Y = SURF * R, flip = s.x > 320 ? -1 : 1, closed = s.closed > 0;
  q(X - 50, Y - 1, 100, 2, 'rgba(0,0,0,0.4)');
  // storage tank
  cylinder(X + 26 * flip - 9, Y - 32, 18, 31, [24, 70, 78], [120, 210, 214]);
  q(X + 26 * flip - 9, Y - 33, 18, 1, '#9fe8ec');
  // main hall
  for (let row = 0; row < 44; row++) q(X - 40, Y - 44 + row, 80, 1, mixRGB([70, 82, 120], [30, 36, 56], row / 43));
  for (let i = 1; i < 8; i++) q(X - 40 + i * 10, Y - 44, 1, 44, 'rgba(0,0,0,0.25)');
  q(X - 40, Y - 44, 80, 1, '#9fb0d8'); q(X - 40, Y - 44, 1, 44, '#7584ad');
  for (let k = 0; k < 6; k++) {
    const lit = ((k * 7 + ((GT * 0.6) | 0)) % 5) !== 0;
    const wx = X - 34 + k * 12, wy = Y - 38;
    q(wx, wy, 7, 5, lit ? '#ffcd75' : '#151a2a'); if (lit) { q(wx, wy, 7, 1, '#fff3c0'); glow((wx + 3) / R, (wy + 2) / R, 4, '#ffcd75', 0.25); }
  }
  // hangar door with hazard trim
  q(X - 12, Y - 20, 24, 19, '#141828');
  for (let i = 0; i < 24; i++) q(X - 12 + i, Y - 22, 1, 2, (i >> 1) & 1 ? '#ffcd75' : '#1a1c2c');
  for (let k = 0; k < 5; k++) q(X - 12, Y - 18 + k * 4, 24, 1, '#232a42');
  // landing pad tower
  q(X - 12, Y - 64, 24, 20, '#56627e'); q(X - 12, Y - 64, 3, 20, '#8b9bc0'); q(X + 9, Y - 64, 3, 20, '#333c57');
  q(X - 26, Y - 68, 52, 4, closed ? '#b13e53' : '#c2cbe0'); q(X - 26, Y - 68, 52, 1, '#f4f4f4'); q(X - 26, Y - 64, 52, 1, '#333c57');
  const pl = blink();
  for (const ex of [-25, 23]) { q(X + ex, Y - 70, 2, 2, pl ? (closed ? '#ff5a6a' : '#a7f070') : '#333c57'); if (pl) glow((X + ex + 1) / R, (Y - 69) / R, 5, closed ? '#ff5a6a' : '#a7f070', 0.8); }
  // flare stack with flame
  const fx = X - 34 * flip;
  q(fx - 2, Y - 80, 4, 36, '#8b9bc0'); q(fx - 2, Y - 80, 1, 36, '#c7d2e2');
  const fl = 4 + Math.round(Math.sin(GT * 14 + s.x) * 2 + Math.sin(GT * 23) * 1.5);
  q(fx - 2, Y - 82 - fl, 4, fl, '#ef7d57'); q(fx - 1, Y - 81 - Math.round(fl * 0.7), 2, Math.round(fl * 0.7), '#ffcd75');
  glow(fx / R, (Y - 84) / R, 10, '#ef7d57', 0.55 + 0.15 * Math.sin(GT * 9));
  // neon sign
  txtS(s.name, s.x, SURF - 15, closed ? P.red : P.cyan, 1, 'c');
  glow(s.x, SURF - 13, 14, closed ? '#b13e53' : '#41a6f6', 0.2);
}
function drawHauler(h) {
  const bob = (h.state === 'idle' || h.state === 'loading') ? Math.round(Math.sin(GT * 3 + h.id) * 2) : 0;
  const X = Math.round(h.x * R), Yb = Math.round(h.y * R) + bob, d = h.dir || 1;
  const hq = (dx, dy, w, hh, c) => q(d > 0 ? X + dx : X - dx - w, Yb + dy, w, hh, c);
  const side = h.side === 1 ? '#ffcd75' : '#73eff7';
  hq(-12, -7, 4, 4, '#566c86'); hq(-12, -7, 4, 1, '#94b0c2');
  hq(-11, -3, 20, 6, '#8b9bc0'); hq(-11, -4, 18, 1, '#d6e0f0'); hq(-11, -3, 20, 1, '#b4c2dc'); hq(-11, 2, 20, 1, '#4a5672');
  hq(9, -2, 3, 4, '#8b9bc0'); hq(12, -1, 1, 2, '#d6e0f0');
  hq(3, -3, 6, 3, '#41a6f6'); hq(4, -3, 3, 1, '#c8ecff');
  hq(-9, 0, 11, 1, side);
  hq(-13, -2, 2, 4, '#333c57');
  const f = clamp(h.cargo / (G ? st.hCap() : 20), 0, 1), cw = Math.round(14 * f);
  hq(-7, 3, 14, 4, '#1a1426'); hq(-7, 3, 14, 1, '#3a2f4a');
  if (cw) { hq(-7, 3, cw, 4, '#9b30d9'); hq(-7, 3, cw, 1, '#e3a8ff'); }
  if (((GT * 2 + h.id) % 2) < 1) hq(-12, -8, 1, 1, '#ff5a6a');
  if (h.moving) {
    const L = 4 + ((GT * 30) | 0) % 3 * 2;
    hq(-13 - L, -1, L, 2, '#ef7d57'); hq(-13 - (L >> 1), -1, L >> 1, 2, '#fff3c0');
    glow((d > 0 ? X - 16 : X + 16) / R, Yb / R, 7, '#ef7d57', 0.7);
  }
  if (h.state === 'loading' && h.wait > 1 && blink()) txtS('...', h.x, h.y - 10, P.lgray, 1, 'c');
}
function drawScanner(sc) {
  const X = Math.round(sc.x * R), Y = SURF * R;
  q(X - 6, Y - 6, 2, 6, '#566c86'); q(X + 4, Y - 6, 2, 6, '#566c86');
  q(X - 1, Y - 10, 2, 6, '#94b0c2');
  q(X - 6, Y - 14, 12, 1, '#d6e0f0'); q(X - 5, Y - 13, 10, 1, '#94b0c2'); q(X - 4, Y - 12, 8, 1, '#566c86');
  q(X, Y - 18, 1, 4, '#d6e0f0');
  const live = !sc.done;
  q(X - 1, Y - 20, 2, 2, live ? (blink() ? '#73eff7' : '#f4f4f4') : '#333c57');
  if (live) glow(sc.x, SURF - 10, 6, '#73eff7', 0.7);
}

// ---------------------------------------------------------------- world render
const CRUDE_RAMP = ['#f8c8ff', '#d87cff', '#b04af0', '#9230d6', '#7824ba', '#601c9c', '#4c147e'];
function drawOil() {
  const S8 = CELL * R;
  for (const p of S.pockets) {
    if (p.amt <= 0) continue;
    const filled = Math.ceil((p.amt / p.cap) * p.n - 1e-6);
    if (filled <= 0) continue;
    const topRow = (p.cells[filled - 1] / COLS) | 0, botRow = (p.cells[0] / COLS) | 0, span = Math.max(1, botRow - topRow);
    let any = false;
    for (let k = 0; k < filled; k++) {
      const i = p.cells[k];
      if (!S.rev[i]) continue;
      any = true;
      const c = i % COLS, r = (i / COLS) | 0, X = c * S8, Y = UG_TOP * R + r * S8;
      const ramp = p.living ? LIVING_RAMP : p.cryo ? CRYO_RAMP : CRUDE_RAMP;
      q(X, Y, S8, S8, ramp[2 + Math.min(4, Math.floor((r - topRow) / span * 4.99))]);
      if (r === topRow) {
        const wv = Math.sin(GT * 2.5 + c * 0.9) > 0.3 ? 1 : 0;
        if (wv) q(X, Y, S8, 1, '#1c0c28');
        q(X, Y + wv, S8, 1, ramp[0]); q(X, Y + wv + 1, S8, 1, ramp[1]);
      } else if ((c * 13 + r * 7 + ((GT * 2) | 0)) % 37 === 0) q(X + 3, Y + 5 - (((GT * 8) | 0) % 5), 2, 2, ramp[1]);
      if (p.cryo && (c * 7 + r * 11 + ((GT * 3) | 0)) % 17 === 0) q(X + 2, Y + 2, 2, 2, '#ffffff');
      if (p.living && (c + r + ((GT * 4) | 0)) % 9 === 0) q(X + 3, Y + 3, 2, 2, '#ffe0ee');
    }
    if (any) glow(p.cx, UG_TOP + topRow * CELL + 3, Math.max(14, Math.sqrt(p.n) * 4.5), p.cryo ? '#bfe7ff' : p.living ? '#ff5ca8' : '#b04cff', (p.living ? 0.22 + 0.12 * Math.sin(GT * 4 + p.id) : 0.16 + 0.05 * Math.sin(GT * 2 + p.id)));
  }
}
function drawPlotLines() {
  for (let k = 0; k <= NPLOTS; k++) {
    const x = PLOT_X0 + k * PLOT_W;
    for (let y = UG_TOP; y < UG_BOT; y += 8) rect(x, y, 0.5, 3, 'rgba(180,150,230,0.18)');
    q(x * R - 1, (SURF - 4) * R, 3, 8, '#566c86'); q(x * R - 1, (SURF - 4) * R, 1, 8, '#94b0c2');
  }
}
function drawPlotFlags() {
  for (const p of S.plots) {
    if (!p.owner) continue;
    const col = p.owner === 'you' ? P.cyan : rcol(p.owner);
    q(p.x0 * R + 2, SURF * R, PLOT_W * R - 3, 1, col);
    const FX = (p.x0 + 4) * R, FY = (SURF - 15) * R;
    q(FX, FY, 2, 30, '#c7d2e2'); q(FX + 1, FY, 1, 30, '#566c86');
    for (let i = 0; i < 14; i++) {
      const wv = Math.round(Math.sin(GT * 5 - i * 0.6) * 1.2);
      q(FX + 2 + i, FY + 1 + wv, 1, 8, i % 4 === 0 ? shade(col, -0.25) : col);
      q(FX + 2 + i, FY + 1 + wv, 1, 1, shade(col, 0.5));
    }
  }
}
function segPt(s, t) { return [Math.round(s.x1 + s.ux * t), Math.round(s.y1 + s.uy * t)]; }
// finished pipe is cached on its own layer and only the newly drilled part is painted each frame
function paintJoint(g, X, Y) {
  g.fillStyle = '#05060c'; g.fillRect(X - 4, Y - 3, 9, 7); g.fillRect(X - 3, Y - 4, 7, 9);
  g.fillStyle = '#c8962e'; g.fillRect(X - 3, Y - 2, 7, 5); g.fillRect(X - 2, Y - 3, 5, 7);
  g.fillStyle = '#ffe08a'; g.fillRect(X - 2, Y - 2, 3, 1); g.fillRect(X - 2, Y - 2, 1, 2);
  g.fillStyle = '#7a5418'; g.fillRect(X + 1, Y + 2, 2, 1); g.fillRect(X + 3, Y, 1, 2);
  g.fillStyle = '#3a2808'; g.fillRect(X, Y, 1, 1);
}
function paintPipe(s, t0, t1) {
  const g = S.pipeX, mine = s.owner === 'you';
  const base = mine ? '#8b9bc0' : rcol(s.owner), hi = mine ? '#e0e8f6' : shade(base, 0.4), lo = mine ? '#3a4560' : shade(base, -0.45);
  const pt = t => [Math.round((s.x1 + s.ux * t) * R), Math.round((s.y1 + s.uy * t - SURF) * R)];
  if (!mine) {
    g.globalAlpha = 0.55;
    for (let t = t0; t <= t1; t += 0.5) { const [X, Y] = pt(t); g.fillStyle = base; g.fillRect(X - 1, Y - 1, 2, 2); }
    g.globalAlpha = 1;
    return;
  }
  for (let t = t0; t <= t1; t += 0.5) { const [X, Y] = pt(t); g.fillStyle = '#05060c'; g.fillRect(X - 2, Y - 2, 5, 5); }
  for (let t = Math.max(0, t0 - 3); t <= t1; t += 0.5) {
    const [X, Y] = pt(t);
    g.fillStyle = base; g.fillRect(X - 1, Y - 1, 3, 3);
    g.fillStyle = hi; g.fillRect(X - 1, Y - 1, 1, 1);
    g.fillStyle = lo; g.fillRect(X + 1, Y + 1, 1, 1);
  }
  if (t0 === 0 && !s.bridge) paintJoint(g, ...pt(0));
}
function drawPipes() {
  if (S.pipeReset) { S.pipeX.clearRect(0, 0, S.pipeC.width, S.pipeC.height); for (const s of S.segs) { s.drawn = 0; s.capped = false; } S.pipeReset = false; }
  // rival pipes first so yours always sit on top
  for (const pass of [false, true]) for (const s of S.segs) {
    if ((s.owner === 'you') !== pass || s.status === 'gone' || s.status === 'queued') continue;
    const d = s.drawn || 0;
    if (s.prog > d + 0.01) { paintPipe(s, d, s.prog); s.drawn = s.prog; }
    if (pass && !s.capped && (s.status === 'done' || s.status === 'stop') && s.prog > 0) {
      s.capped = true;
      paintJoint(S.pipeX, Math.round((s.x1 + s.ux * s.prog) * R), Math.round((s.y1 + s.uy * s.prog - SURF) * R));
    }
  }
  ctx.drawImage(S.pipeC, 0, SURF, W, UG_BOT - SURF);
  for (const j of S.joints) {
    const X = Math.round(j.x * R), Y = Math.round(j.y * R);
    q(X - 4, Y - 4, 9, 9, '#05060c'); q(X - 3, Y - 3, 7, 7, '#c46cff'); q(X - 3, Y - 3, 7, 1, '#f3c6ff'); q(X - 1, Y - 1, 3, 3, '#5a1a85');
    glow(j.x, j.y, 6, '#c46cff', 0.45 + 0.2 * Math.sin(GT * 3 + j.x));
  }
  // flowing crude inside your pipes
  const off = (GT * 24) % 8;
  for (const r of S.rigs) {
    if (!r.pumping || r.owner !== 'you') continue;
    for (const id of r.segs) {
      const s = S.segs[id];
      if (s.status !== 'done' && s.status !== 'stop') continue;
      for (let t = ((s.prog - off) % 8 + 8) % 8; t <= s.prog; t += 8) q(Math.round((s.x1 + s.ux * t) * R) - 1, Math.round((s.y1 + s.uy * t) * R) - 1, 2, 2, '#e9a8ff');
    }
  }
  // queued plans + drill heads
  for (const s of S.segs) {
    if (s.owner !== 'you') continue;
    if (s.status === 'queued' || s.status === 'drill') {
      const X = Math.round((s.x1 + s.ux * s.len) * R), Y = Math.round((s.y1 + s.uy * s.len) * R);
      q(X - 3, Y - 3, 7, 7, '#c8962e'); q(X - 2, Y - 2, 5, 5, '#05060c');
    }
    if (s.status === 'queued') {
      for (let t = 0; t <= s.len; t += 4) { const [x, y] = segPt(s, t); q(x * R, y * R, 2, 2, P.gray); }
    } else if (s.status === 'drill') {
      for (let t = s.prog + 4; t <= s.len; t += 4) { const [x, y] = segPt(s, t); q(x * R, y * R, 2, 2, P.gray); }
      const hx = s.x1 + s.ux * s.prog, hy = s.y1 + s.uy * s.prog;
      q(Math.round(hx * R) - 3, Math.round(hy * R) - 3, 6, 6, '#05060c');
      q(Math.round(hx * R) - 2, Math.round(hy * R) - 2, 4, 4, blink() ? '#ffcd75' : '#fff3c0');
      glow(hx, hy, 8, '#ffcd75', 0.6);
    }
  }
}
function drawScanWaves() {
  for (const sc of S.scans) {
    if (sc.done) continue;
    const k = Math.min(1, sc.t / sc.dur);
    for (const [kk, col, a] of [[k, '#73eff7', 1], [k * 0.92, '#41a6f6', 0.5]]) {
      ctx.globalAlpha = a * (1 - k * 0.5);
      for (let ang = 0; ang <= Math.PI; ang += 0.012) q(Math.round((sc.x + Math.cos(ang) * sc.rx * kk) * R), Math.round((UG_TOP + Math.sin(ang) * sc.ry * kk) * R), 2, 2, col);
    }
    ctx.globalAlpha = 1;
    glow(sc.x, UG_TOP + sc.ry * k * 0.5, sc.rx * k, '#41a6f6', 0.12);
  }
}
function drawLinks() {
  const off = (GT * 16) % 6;
  for (const r of myRigs()) {
    if (!r.silo) continue;
    const a = Math.min(r.x, r.silo.x), b = Math.max(r.x, r.silo.x);
    q(a * R, (SURF - 2) * R, (b - a) * R, 4, '#05060c');
    q(a * R, (SURF - 2) * R + 1, (b - a) * R, 2, '#8b9bc0');
    q(a * R, (SURF - 2) * R + 1, (b - a) * R, 1, '#d6e0f0');
    if (r.xfer) {
      const dir = Math.sign(r.silo.x - r.x);
      for (let t = off; t < b - a; t += 6) q(Math.round((r.x + dir * t) * R), (SURF - 2) * R + 1, 2, 2, '#e9a8ff');
    }
  }
}
function drawParticles() {
  for (const p of S.parts) q(Math.round(p.x * R), Math.round(p.y * R), p.size * R, p.size * R, p.color);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  for (const p of S.parts) {
    if (!p.glow) continue;
    ctx.globalAlpha = clamp(p.life * 1.5, 0, 0.8);
    const r = 3 + p.size * 2;
    ctx.drawImage(glowSprite(p.color), p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.restore();
}
function previewInfo() {
  if (S.tool || S.paused || S.help) return null;
  if (S.drag && S.drag.kind === 'pipe' && mouse.moved) return { r: S.drag.rig, start: S.drag.start };
  if (!S.drag && S.sel && S.sel.kind === 'rig' && mouse.y > UG_TOP && mouse.y < UG_BOT && !overUI())
    return { r: S.sel.ref, start: S.pen && S.pen.rig === S.sel.ref ? S.pen.start : nearestJoint(S.sel.ref, mouse.x, mouse.y) };
  return null;
}
function drawPen() {
  if (!S.pen || !S.sel || S.sel.ref !== S.pen.rig) return;
  const j = S.pen.start;
  glow(j.x, j.y, 6, '#ffe08a', 0.4 + 0.3 * Math.sin(GT * 6));
}
function drawPreview() {
  drawPen();
  const pv = previewInfo();
  if (!pv) return;
  const { start } = pv;
  const sp = snapPoint(clamp(mouse.x, 1, W - 2), clamp(mouse.y, UG_TOP + 2, UG_BOT - 2), start);
  const tx = sp.x, ty = sp.y;
  if (sp.snap) { const X = Math.round(tx * R), Y = Math.round(ty * R); q(X - 5, Y - 5, 11, 1, P.lime); q(X - 5, Y + 5, 11, 1, P.lime); q(X - 5, Y - 5, 1, 11, P.lime); q(X + 5, Y - 5, 1, 11, P.lime); glow(tx, ty, 6, '#a7f070', 0.5); }
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
  if (S.tool === 'glitch') { if (mouse.y > UG_TOP + 6) { ctx.globalAlpha = 0.7; drawGlitch(mouse.x, mouse.y, 1, GT); ctx.globalAlpha = 1; } return; }
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
  hudBar(0, 13);
  txt('S' + G.sector + ' ' + S.name, 4, 4, P.lgray);
  const lo = rankReq(S.rank), hi = rankReq(S.rank + 1);
  txt('RANK ' + S.rank, 104, 4, P.yellow);
  meter(136, 3.5, 50, 6, (S.xp - lo) / (hi - lo), P.yellow);
  const day = Math.min(S.days, Math.floor(S.day) + 1);
  if (S.day >= 5 && !S.confirmEnd && allDry())
    button(192, 1.5, 167, 10, 'POCKETS DRY - END SECTOR EARLY >>', () => { S.confirmEnd = true; }, { color: blink() ? P.green : '#257a3c', hc: P.lime, tc: P.navy });
  else {
    txt('DAY ' + day + '/' + S.days, 254, 4, P.white, 1, 'r');
    meter(258, 3.5, 100, 6, S.day / S.days, S.days - S.day < 10 ? P.orange : P.green);
  }
  [1, 2, 4].forEach((v, i) => button(362 + i * 17, 2, 16, 9, v + 'X', () => { S.speed = v; sfx('click'); }, { active: S.speed === v, color: P.dblue, hc: P.blue }));
  if (S.flare > 0) txt('FLARE', 415, 4, P.orange);
  if (stormActive()) txt('STORM', 415, 4, blink() ? P.crudeL : P.plum);
  txt('BELT ' + S.belt + '/6', 470, 4, BELTS[S.belt - 1].col, 1, 'r');
  txt('SHARES ' + G.shares + ':' + rivalTotal(), 548, 4, P.lgray, 1, 'r');
  txt('$' + fmt(G.credits), W - 4, 4, P.yellow, 1, 'r');
}
const SP_W = 70;
function stationPanelX(s) { return s.x < 320 ? 2 : W - SP_W - 2; }
function drawStationPanels() {
  S.stations.forEach((s, side) => {
    const x0 = stationPanelX(s), y0 = 14, w = SP_W, h = s.job ? 56 : 47;
    const hot = s.mult > 1, low = s.mult < 1, shut = s.closed > 0;
    panel(x0, y0, w, h, P.navy, shut ? P.red : (S.sel && S.sel.kind === 'hauler' && inRect(mouse, x0, y0, w, h) ? P.yellow : P.gray));
    txt(s.name, x0 + 4, y0 + 4, shut ? P.red : hot ? P.lime : low ? P.orange : P.cyan);
    // hauler count spinner
    const n = S.haulers.filter(hh => hh.side === side).length;
    button(x0 + 37, y0 + 3, 8, 8, '<', () => pullHaulerFrom(side), { color: P.dblue, hc: P.blue });
    const IX = (x0 + 47) * R, IY = (y0 + 5) * R;
    q(IX, IY, 7, 3, '#8b9bc0'); q(IX, IY, 6, 1, '#d6e0f0'); q(IX + 4, IY, 2, 1, '#41a6f6'); q(IX + 1, IY + 3, 4, 1, '#9b30d9');
    txt('' + n, x0 + 59, y0 + 4, n ? P.white : P.gray, 1, 'r');
    button(x0 + 61, y0 + 3, 8, 8, '>', () => sendHaulerTo(side), { color: P.dblue, hc: P.blue });
    // price, trend and status
    const pr = price(s);
    if (shut) txt('SHUT ' + s.closed + 'D', x0 + 4, y0 + 13, P.red, 2);
    else txt('$' + pr.toFixed(1), x0 + 4, y0 + 13, P.yellow, 2);
    const prev = s.hist[s.hist.length - 3] || pr, up = pr >= prev, ax = x0 + w - 7, ay = y0 + 14;
    if (!shut) for (let k = 0; k < 3; k++) rect(ax - k, up ? ay + k : ay + 4 - k, k * 2 + 1, 1, up ? P.lime : P.red);
    if (!shut && (hot || low)) txt(hot ? 'HOT' : 'LOW', ax - 5, ay + 1, hot ? P.lime : P.orange, 1, 'r');
    // price history (+ forecast with Market Intel)
    const vals = s.hist.slice(-24), fc = [];
    if (has('intel')) for (let k = 1; k <= 10; k++) fc.push(rawPrice(s, S.day + k) * (s.multT >= k ? s.mult : 1) * (s.sat + (1 - s.sat) * Math.min(1, k * 0.1)));
    vals.push(pr);
    const all = vals.concat(fc), mn = Math.min(...all), mx = Math.max(...all);
    const sx = x0 + 4, sy = y0 + 25, sw = w - 8, sh = 9;
    rect(sx, sy, sw, sh, '#0f1020');
    for (let i = 0; i < all.length; i++) {
      const px = sx + Math.round(i * (sw - 1) / (all.length - 1));
      const py = sy + sh - 1 - Math.round((all[i] - mn) / ((mx - mn) || 1) * (sh - 1));
      rect(px, py, 1, 1, i < vals.length ? P.lime : P.orange);
    }
    // minimum sell price: haulers hold their crude until the price beats it
    const fl = floorOf(s), holding = fl > 0 && pr < fl;
    if (fl > 0) { const fy = sy + sh - 1 - Math.round(clamp((fl - mn) / ((mx - mn) || 1), 0, 1) * (sh - 1)); for (let xx = sx; xx < sx + sw; xx += 3) rect(xx, fy, 1, 1, P.orange); }
    txt('MIN SELL', x0 + 4, y0 + 37, holding ? (blink() ? P.orange : P.yellow) : P.lgray);
    button(x0 + 37, y0 + 36, 8, 8, '-', () => setFloor(side, -1), { color: P.dblue, hc: P.blue });
    txt(fl ? '$' + fl : 'OFF', x0 + 59, y0 + 37, holding ? P.orange : fl ? P.white : P.gray, 1, 'r');
    button(x0 + 61, y0 + 36, 8, 8, '+', () => setFloor(side, 1), { color: P.dblue, hc: P.blue });
    if (s.job) {
      const j = s.job, left = j.deadline - Math.floor(S.day);
      meter(sx, sy + 21, sw, 8, j.done / j.units, P.teal);
      txt('JOB ' + Math.floor(j.done) + '/' + j.units + ' ' + left + 'D', x0 + w / 2, sy + 22.5, left <= 5 && blink() ? P.orange : P.white, 1, 'c');
    }
  });
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
  if (!S.plots.some(p => p.owner === 'you')) return 'WIN A PLOT AT AUCTION - CLICK AN "AUCTION" SIGN';
  if (!S.scans.length && !S.segs.some(s => s.owner === 'you')) return 'SCAN FOR VOIDCRUDE [4], THEN CLICK ON YOUR PLOT';
  if (!mine.length) return 'BUILD A RIG [1] ON YOUR PLOT ABOVE THE CRUDE';
  if (!S.segs.some(s => s.owner === 'you')) return 'CLICK YOUR RIG, THEN CLICK UNDERGROUND - EACH CLICK ADDS A PIPE JOINT';
  if (!mine.some(r => r.pockets.size)) return 'STEER YOUR PIPE INTO A PURPLE CRUDE POCKET';
  if (!S.haulers.length) return 'BUY A HAULER [3] - IT HAULS AND SELLS BY ITSELF';
  if (S.stats.sold === 0) return 'USE < > ON THE PRICE PANELS UP TOP TO SPLIT HAULERS BETWEEN SIDES';
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
    button(cx - 30, SURF - 17, 60, 11, 'AUCTION $' + fmt(Math.max(50, Math.round(plotCost(p) * 0.6 / 10) * 10)), () => startAuction(p, 'you'), { color: P.teal, hc: P.green });
    if (p.tip) txtS('TIP!', cx, SURF - 33, P.orange, 1, 'c');
    if (has('survey') || p.tip) {
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
function togglePause() { S.paused = !S.paused; S.help = false; if (S.paused) saveSector(); sfx('click'); }
function cycleSpeed() { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; sfx('click'); }
function toggleSfx() { Sound.sfx = !Sound.sfx; Sound.savePrefs(); sfx('click'); }
function toggleMusic() { Sound.music = !Sound.music; Sound.init(); if (Sound.music) Sound.startMusic(); else Sound.stopMusic(); Sound.savePrefs(); }
function toggleCrt() { crt.classList.toggle('off'); Sound.savePrefs(); sfx('click'); }
function drawBottomBar() {
  hudBar(341, 19);
  const by = 344, bh = 13;
  drawPortrait(CHAR().look, 3, 342, 1);
  rect(2, 341, 18, 1, abilReady() ? P.yellow : P.dgray);
  let x = 22;
  button(x, by, 58, bh, pk('rig') ? '1 RIG FREE' : '1 RIG $' + COST.rig, () => setTool('rig'), { active: S.tool === 'rig', tc: pk('rig') ? P.lime : P.white }); x += 60;
  button(x, by, 62, bh, '2 SILO $' + COST.silo, () => setTool('silo'), { active: S.tool === 'silo' }); x += 64;
  button(x, by, 74, bh, '3 HAULER $' + COST.hauler, buyHauler); x += 76;
  button(x, by, 58, bh, '4 SCAN $' + st.scanCost(), () => setTool('scan'), { active: S.tool === 'scan' }); x += 60;
  button(x, by, 66, bh, '5 BLAST ' + S.blasts + '/' + st.blastMax(), () => setTool('blast'), { active: S.tool === 'blast', color: S.blasts ? P.red : P.dgray, hc: P.orange }); x += 68;
  button(x, by, 56, bh, '7 GLITCH $' + COST.glitch, () => setTool('glitch'), { active: S.tool === 'glitch', color: '#1d3f6e', hc: P.blue, tc: P.cyan }); x += 58;
  drawAbilityButton(x, by, 74, bh); x += 76;
  button(x, by, 50, bh, '6 BLK MKT', () => { S.bm = true; S.tool = null; sfx('click'); }, { color: '#2a1420', hc: P.plum, tc: P.orange });
  button(W - 102, by, 26, bh, S.paused ? '>' : 'II', togglePause);
  button(W - 74, by, 34, bh, Sound.sfx ? 'SFX' : 'sfx', toggleSfx, { tc: Sound.sfx ? P.white : P.gray });
  button(W - 38, by, 34, bh, Sound.music ? 'MUS' : 'mus', toggleMusic, { tc: Sound.music ? P.white : P.gray });
  if (inRect(mouse, 2, 341, 484, 19) && (mouse.x < 20 || (mouse.x >= 408 && mouse.x < 484))) drawCharTip();
}
function haulerLabel(h) {
  switch (h.state) {
    case 'idle': return h.cargo > 0 ? 'HOLDING CARGO' : 'WAITING FOR CRUDE';
    case 'toLoad': return 'FLYING TO PICKUP';
    case 'loading': return h.wait > 1 ? 'TOPPING UP' : 'LOADING';
    case 'toSell': return 'FLYING TO ' + h.target.name;
    case 'selling': return 'SELLING AT ' + h.target.name;
    case 'holding': return 'HOLDING - ' + h.target.name + ' BELOW YOUR MINIMUM';
  }
  return '';
}
function drawSelPanel() {
  selPanelRect = null;
  let lines = null, btns = [];
  if (S.tool) {
    lines = [{ rig: 'BUILD RIG: CLICK ON LAND YOU OWN', silo: 'BUILD SILO: PLACE NEXT TO YOUR RIGS', scan: 'SCAN: CLICK ANYWHERE ON THE SURFACE', blast: 'ROCK BLASTER: CLICK UNDERGROUND (' + S.blasts + ' CHARGES LEFT)', glitch: 'GLITCH: CLICK UNDERGROUND - IT DIGS AROUND AND SNIFFS OUT GAS' }[S.tool], 'RIGHT-CLICK OR ESC TO CANCEL'];
  } else if (S.sel) {
    const o = S.sel.ref;
    if (S.sel.kind === 'rig') {
      let live = 0; for (const id of netPockets(o)) live += S.pockets[id].amt;
      const nl = netOf(o).size - 1;
      const state = o.offline > 0 ? 'OFFLINE ' + o.offline + ' DAYS' : o.drilling ? 'DRILLING' : o.pumping ? 'PUMPING' : o.tank >= st.rigCap() - 0.01 ? 'TANK FULL' : 'IDLE';
      lines = ['RIG #' + o.id + ' - ' + state + (nl ? '   COUPLED TO ' + nl + ' RIG' + (nl > 1 ? 'S' : '') : ''), 'TANK ' + fmt(o.tank) + '/' + st.rigCap() + '   CRUDE LEFT IN POCKETS ' + fmt(live) + 'U', has('coupler') ? 'DRILL INTO ANOTHER RIG\'S PIPE TO COUPLE THEM' : 'CLICK TO ADD PIPE JOINTS. DRAG FROM A JOINT TO BRANCH. RIGHT-CLICK ENDS'];
      btns = [['STOP DRILL', () => stopDrill(o), { disabled: !activeSeg(o) }], ['SCRAP +$' + Math.round(COST.rig * 0.4), () => scrapRig(o), { color: P.red }]];
    } else if (S.sel.kind === 'hauler') {
      lines = ['HAULER - ' + haulerLabel(o), 'CARGO ' + fmt(o.cargo) + '/' + st.hCap() + '   SELLS AT ' + S.stations[o.side].name + (has('auto') ? ' (SMART)' : ''), 'FULLY AUTOMATIC. PICK ITS SIDE ON THE RIGHT'];
      btns = [['< HELIX', () => setSide(o, 0), { active: o.side === 0 }], ['NOVA >', () => setSide(o, 1), { active: o.side === 1 }]];
    } else if (S.sel.kind === 'silo') {
      lines = ['SILO - ' + fmt(o.tank) + '/' + st.siloCap(), 'RIGS WITHIN 16M PIPE THEIR CRUDE IN HERE', 'SEND HAULERS HERE TO LOAD'];
    }
  }
  if (!lines) return;
  const x = 186, y = 312, w = 300, h = 27;
  selPanelRect = [x, y, w, h];
  panel(x, y, w, h, P.navy, P.gray);
  lines.forEach((l, i) => txt(l, x + 4, y + 3 + i * 8, i === 0 ? P.white : P.lgray));
  btns.forEach(([label, fn, opt], i) => button(x + w - 58, y + 2 + i * 12, 55, 11, label, fn, opt));
}
function drawTooltip() {
  if (S.tool || S.drag || overUI()) return;
  const lines = [];
  const m = mouse;
  if (m.y > UG_TOP && m.y < UG_BOT) {
    const ci = cellIndexAt(m.x, m.y);
    if (ci >= 0 && S.rev[ci]) {
      const t = S.grid[ci];
      if (t === T_OIL) {
        const p = S.pockets[S.pid[ci]];
        lines.push(p.amt <= 0 ? 'DRAINED POCKET' : p.living ? 'LIVING CRUDE' : p.cryo ? 'CRYO-CRUDE' : 'VOIDCRUDE POCKET', fmt(p.amt) + ' / ' + fmt(p.cap) + ' UNITS');
        if (p.living) lines.push(has('bio') ? 'BIO-ANCHORS HOLD IT ONCE TAPPED' : 'IT CRAWLS - PIPES CAN LOSE IT');
        if (p.cryo) lines.push('PUMPS AT ' + Math.round(cryoFactor('you') * 100) + '% SPEED' + (has('heat2') ? '' : ' - HEATED PIPES HELP'));
      }
      else if (t === T_ROCK) lines.push('SOLID ROCK', st.rock() ? 'LASER BORE CAN CUT IT' : 'BLOCKS DRILLS - BLAST IT [5]');
      else if (t === T_GAS) lines.push('GAS POCKET', has('gas') ? 'SIPHON READY - WORTH $$$' : 'DANGER: BLOWOUT!');
    }
  } else if (m.y > 13 && m.y < SURF + 4) {
    const s = S.stations.find(s => (Math.abs(m.x - s.x) <= 26 && m.y > SURF - 44) || (m.y < 71 && m.x >= stationPanelX(s) && m.x <= stationPanelX(s) + SP_W));
    if (s) {
      lines.push(s.name + ' REFINERY', s.closed > 0 ? 'CLOSED ' + s.closed + ' DAYS' : 'PAYS $' + price(s).toFixed(2) + ' / UNIT');
      lines.push('HAULERS SELLING HERE: ' + S.haulers.filter(h => h.side === S.stations.indexOf(s)).length, '> OR CLICK: MOVE ONE HERE.  <: MOVE ONE AWAY');
      if (s.job) lines.push('CONTRACT: ' + Math.floor(s.job.done) + '/' + s.job.units + 'U BY DAY ' + s.job.deadline, 'REWARD $' + fmt(s.job.cred));
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
  const w = 180, h = 130, x = (W - w) / 2, y = 104;
  panel(x, y, w, h, P.navy, P.crude);
  txtS('PAUSED', W / 2, y + 8, P.crudeL, 2, 'c');
  button(x + 20, y + 28, w - 40, 14, 'RESUME', togglePause);
  button(x + 20, y + 46, w - 40, 14, 'HOW TO PLAY', () => { S.help = true; S.paused = false; });
  button(x + 20, y + 64, w - 40, 14, 'CRT EFFECT: ' + (crt.classList.contains('off') ? 'OFF' : 'ON'), toggleCrt);
  button(x + 20, y + 82, w - 40, 14, 'END SECTOR EARLY', () => { S.paused = false; S.confirmEnd = true; }, { color: P.green, hc: P.lime, tc: P.navy });
  button(x + 20, y + 104, w - 40, 14, 'SAVE + QUIT TO TITLE', () => { saveSector(); screen = 'title'; S = null; }, { color: P.red, hc: P.orange });
}
function drawHelpPanel(onClose) {
  rect(0, 0, W, H, 'rgba(5,5,15,0.82)');
  const w = 400, h = 210, x = (W - w) / 2, y = 60;
  panel(x, y, w, h, P.navy, P.crude);
  txtS('HOW TO PLAY', W / 2, y + 7, P.crudeL, 2, 'c');
  HELP.forEach((l, i) => txt(l, x + 12, y + 24 + i * 8, l.startsWith('KEYS') ? P.cyan : P.white));
  button(W / 2 - 40, y + h - 18, 80, 13, 'CLOSE', onClose);
}
function drawShootingStar() {
  if (!S.shoot && Math.random() < 0.003) S.shoot = { x: 60 + Math.random() * 500, y: 8 + Math.random() * 30, vx: 140 + Math.random() * 80, vy: 40 + Math.random() * 30, life: 0.6 };
  const st2 = S.shoot;
  if (!st2) return;
  st2.life -= 1 / 60; st2.x += st2.vx / 60; st2.y += st2.vy / 60;
  for (let k = 0; k < 14; k++) { ctx.globalAlpha = (1 - k / 14) * clamp(st2.life * 3, 0, 1); q(Math.round((st2.x - st2.vx * k * 0.004) * R), Math.round((st2.y - st2.vy * k * 0.004) * R), 2, 1, '#f3f6ff'); }
  ctx.globalAlpha = 1;
  if (st2.life <= 0 || st2.y > SURF - 10) S.shoot = null;
}
function renderPlay() {
  ctx.save();
  if (S.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * S.shake), Math.round((Math.random() - 0.5) * S.shake));
  ctx.drawImage(S.skyC, 0, 0, W, UG_TOP);
  for (const s of S.twinkles) { const a = Math.sin(GT * s.f * 4 + s.p * 6.28); if (a > 0.4) { q(s.x * R, s.y * R, 1, 1, P.white); if (a > 0.9) glow(s.x, s.y, 2.5, '#c8ecff', 0.6); } }
  drawShootingStar();
  drawStorm();
  ctx.drawImage(S.dirtC, 0, UG_TOP, W, ROWS * CELL);
  drawOil();
  drawFog();
  drawPlotLines();
  drawScanWaves();
  drawPipes();
  drawCritters();
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
  drawParticles();
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
  if (S.auction) drawAuction();
  if (S.choice) drawCards();
  if (S.confirmEnd) drawEndConfirm();
  if (S.paused) drawPauseMenu();
  if (S.help) drawHelpPanel(() => { S.help = false; });
}

// ---------------------------------------------------------------- other screens
const TS = { stars: Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.15 + Math.random() * 0.85 })), hx: -20, help: false };
let NEBULA = null;
function starfield(speed = 1) {
  if (!NEBULA) {
    NEBULA = mk(W * R, H * R);
    const g = NEBULA.getContext('2d'), rng = mulberry32(1234);
    const bg = g.createLinearGradient(0, 0, 0, H * R);
    bg.addColorStop(0, '#04030c'); bg.addColorStop(0.6, '#0a0820'); bg.addColorStop(1, '#160d2c');
    g.fillStyle = bg; g.fillRect(0, 0, W * R, H * R);
    paintNebula(g, W * R, H * R, rng, 12);
    paintStars(g, W * R, H * R, rng, 320);
  }
  ctx.drawImage(NEBULA, 0, 0, W, H);
  for (const s of TS.stars) {
    s.x -= s.z * 0.4 * speed; if (s.x < 0) { s.x += W; s.y = Math.random() * H; }
    const sz = s.z > 0.75 ? 2 : 1;
    q(Math.round(s.x * R), Math.round(s.y * R), sz, sz, s.z > 0.75 ? P.white : s.z > 0.45 ? P.lgray : P.gray);
    if (s.z > 0.93) glow(s.x, s.y, 3, '#c8ecff', 0.5);
  }
}
const titleCache = {};
function bigTitle(text, y, scale) {
  const w = tw(text, scale), x = (W - w) / 2, key = text + scale;
  let c = titleCache[key];
  if (!c) {
    const pad = scale, ow = scale * 0.5;
    c = mk((w + pad * 2) * R, (5 * scale + pad * 2) * R);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.scale(R, R);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) drawText(g, text, pad + dx * ow, pad + dy * ow, '#12061c', scale);
    drawText(g, text, pad + ow, pad + ow * 2, '#2a0a3e', scale);
    const t = mk(c.width, c.height), tg = t.getContext('2d');
    tg.imageSmoothingEnabled = false; tg.scale(R, R);
    drawText(tg, text, pad, pad, '#ffffff', scale);
    tg.setTransform(1, 0, 0, 1, 0, 0);
    tg.globalCompositeOperation = 'source-in';
    const top = pad * R, hgt = 5 * scale * R, band = ['#ffffff', '#f8d8ff', '#e7a2ff', '#c868ff', '#a63ef0', '#7f24c8', '#5a1a85'];
    const grad = tg.createLinearGradient(0, top, 0, top + hgt); // hard colour steps for a banded 16-bit logo
    band.forEach((col, i) => { grad.addColorStop(i / band.length, col); grad.addColorStop((i + 1) / band.length - 0.0001, col); });
    tg.fillStyle = grad; tg.fillRect(0, 0, t.width, t.height);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(t, 0, 0);
    c.pad = pad;
    titleCache[key] = c;
  }
  glow(W / 2, y + scale * 2.5, w * 0.55, '#9b30d9', 0.35 + 0.08 * Math.sin(GT * 2));
  ctx.drawImage(c, x - c.pad, y - c.pad, c.width / R, c.height / R);
}
function renderTitle() {
  starfield();
  drawPlanet(470, 40);
  // ground scene
  const gnd = ctx.createLinearGradient(0, 300, 0, H);
  gnd.addColorStop(0, '#5b4038'); gnd.addColorStop(0.15, '#3a2a30'); gnd.addColorStop(1, '#140c18');
  ctx.fillStyle = gnd; ctx.fillRect(0, 300, W, 60);
  q(0, 600, W * R, 1, '#c09a82'); q(0, 601, W * R, 2, '#8a6352');
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
  if (hasSectorSave() || hasSave()) { button(250, y, 140, 16, hasSectorSave() ? 'CONTINUE SECTOR' : 'CONTINUE', () => { if ((hasSectorSave() && loadSector()) || (loadGame() && (screen = 'shop'))) sfx('buy'); }); y += 20; }
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
  txt(label, 176, y, P.lgray);
  for (let x = 176 + tw(label) + 4; x < 460 - tw(value) - 4; x += 4) rect(x, y + 4, 1, 1, P.dgray);
  txt(value, 464, y, col, 1, 'r');
}
function renderSummary() {
  starfield(0.3);
  const r = G.report;
  panel(160, 22, 320, 300, P.navy, P.crude);
  txtS('SECTOR ' + r.sector + ' COMPLETE', 320, 32, P.crudeL, 2, 'c');
  txt(r.name, 320, 50, P.cyan, 1, 'c');
  let y = 66;
  const profit = r.revenue + r.gas + r.fire + (r.bonusTotal || 0) - r.spent;
  row('CRUDE SOLD', fmt(r.sold) + ' U', y); y += 11;
  row('SALES + CONTRACTS', '$' + fmt(r.revenue), y, P.yellow); y += 11;
  row('GAS SIPHONED', '$' + fmt(r.gas), y, P.cyan); y += 11;
  row('LEFTOVER FIRE SALE (' + fmt(r.crude) + 'U AT 40%)', '$' + fmt(r.fire), y, P.yellow); y += 11;
  row('EXPENSES', '-$' + fmt(r.spent), y, P.red); y += 11;
  rect(200, y, 240, 1, P.gray); y += 5;
  row('NET PROFIT', (profit < 0 ? '-$' : '$') + fmt(Math.abs(profit)), y, profit >= 0 ? P.lime : P.red); y += 16;
  for (const [label, v] of (r.bonuses || [])) { row('BONUS: ' + label, '+$' + fmt(v), y, P.lime); y += 11; }
  if (!(r.bonuses || []).length) { row('NO SECTOR BONUSES (DRAIN, SELL OUT, CLEAR GAS, END EARLY)', '$0', y, P.gray); y += 11; }
  row('PEAK RANK / CONTRACTS', (r.rank || 0) + ' / ' + (r.jobs || 0), y, P.yellow); y += 13;
  for (const rr of (r.rivals || [])) {
    row(RIVALS[rr.id].short + (rr.active ? ' PUMPED ' + fmt(rr.pumped) + 'U' : ' (ELSEWHERE)'), 'CASH $' + fmt(G.rcash[rr.id]), y, rcol(rr.id)); y += 11;
  }
  if (G.debt > 0) { row('DEBT (INCL $' + fmt(r.interest || 0) + ' INTEREST)', '$' + fmt(G.debt), y, P.orange); y += 11; }
  y += 3;
  if (r.stipend) { txt('THE CONSORTIUM TOPPED YOU UP TO $' + fmt(START_FLOOR) + ' (+$' + fmt(r.stipend) + ')', 320, y, P.orange, 1, 'c'); y += 10; }
  txt('$' + fmt(G.credits), 320, y + 2, P.yellow, 2, 'c');
  const auction = r.sector % SECTORS_PER_BELT === 0 && beltOf(r.sector) >= 2;
  button(230, 300, 180, 16, auction ? 'TO THE STOCK AUCTION >>' : 'CONTINUE', () => { afterSummary(); sfx('click'); }, { color: auction ? P.green : P.dblue, tc: auction ? P.navy : P.white });
}
// tech tree layout: 4 branch columns, prerequisite lines routed in "lanes" left of each column
const TREE = { colX: b => 12 + b * 78, nodeX: b => 22 + b * 78, nodeY: r => 50 + r * 29, nw: 68, nh: 24, lanes: [] };
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
    const y1 = TREE.nodeY(e.from) + 12, y2 = TREE.nodeY(e.to) + 12;
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
    const dim = s === 'locked' || s === 'belt';
    const edge = s === 'owned' ? bc : s === 'ready' ? (blink() ? P.yellow : bc) : dim ? P.dgray : P.gray;
    const bg = s === 'owned' ? '#2b2d4a' : dim ? '#121322' : hov ? P.dblue : P.navy;
    rect(x, y, w, h, edge);
    rect(x + 1, y + 1, w - 2, h - 2, bg);
    if (s === 'owned') rect(x + 1, y + 1, 2, h - 2, bc);
    if (t.cap) brackets(x - 2, y - 2, w + 4, h + 4, s === 'owned' ? P.yellow : P.orange);
    txt(t.name, x + 4, y + 4, dim ? P.gray : P.white);
    const status = s === 'owned' ? 'OWNED' : s === 'belt' ? 'BELT ' + TECH_BELT[t.id] : '$' + fmt(techCost(t));
    txt(status, x + 4, y + 13.5, s === 'owned' ? P.lime : s === 'ready' ? P.yellow : s === 'poor' ? P.red : s === 'belt' ? BELTS[TECH_BELT[t.id] - 1].col : P.gray);
    if (t.cap) txt('CAP', x + w - 3, y + 13.5, P.orange, 1, 'r');
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
  else button(268, by + 2, 129, 13, '+1 CHARGE  $' + fmt(blasterCost(G.blaster)), buyBlaster, { disabled: G.credits < blasterCost(G.blaster), color: P.red, hc: P.orange });
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
    txt(s === 'owned' ? 'OWNED' : s === 'belt' ? 'UNLOCKS IN BELT ' + TECH_BELT[t.id] + ': ' + BELTS[TECH_BELT[t.id] - 1].name : req + '   COST $' + fmt(techCost(t)) + (s === 'ready' ? ' - CLICK TO BUY' : ''), 17, dy + 19, s === 'owned' ? P.lime : s === 'locked' || s === 'belt' ? P.red : P.yellow);
  } else {
    txt('UPGRADES COST THE SAME CREDITS AS SHARES - SPEND WISELY BEFORE STOCK AUCTIONS.', 17, dy + 5, P.lgray);
    txt('NEW UPGRADES UNLOCK AS YOU REACH EACH BELT.', 17, dy + 14, P.lgray);
  }
}
function drawAchievements() {
  ACH.forEach((a, i) => {
    const x = 12 + (i % 2) * 196, y = 38 + ((i / 2) | 0) * 32, got = !!G.ach[a.id];
    rect(x, y, 190, 28, got ? P.yellow : P.dgray);
    rect(x + 1, y + 1, 188, 26, got ? '#2b2a20' : '#121322');
    txt(a.name, x + 6, y + 6, got ? P.yellow : P.lgray);
    txt(a.desc, x + 6, y + 16, got ? P.white : P.gray);
    txt('+$' + fmt(a.rd * 150), x + 184, y + 6, got ? P.lime : P.yellow, 1, 'r');
    if (got) txt('DONE', x + 184, y + 16, P.lime, 1, 'r');
  });
}
function renderShop() {
  starfield(0.2);
  rect(0, 0, W, 14, P.navy);
  const bnow = beltOf(G.sector);
  txt('WORKSHOP - NEXT: SECTOR ' + G.sector + '/' + TOTAL_SECTORS + ', BELT ' + bnow + ' ' + BELTS[bnow - 1].name, 6, 5, P.cyan);
  txt('$' + fmt(G.credits), W - 6, 5, P.yellow, 1, 'r');
  panel(6, 20, 400, 312, P.navy, P.gray);
  const got = ACH.filter(a => G.ach[a.id]).length;
  button(10, 23, 86, 11, 'UPGRADES', () => { shopTab = 'tech'; sfx('click'); }, { active: shopTab === 'tech' });
  button(100, 23, 120, 11, 'ACHIEVEMENTS ' + got + '/' + ACH.length, () => { shopTab = 'ach'; sfx('click'); }, { active: shopTab === 'ach' });
  txt('CREDITS $' + fmt(G.credits), 400, 26, P.yellow, 1, 'r');
  if (shopTab === 'tech') drawTechTree(); else drawAchievements();
  // shares
  panel(414, 20, 220, 312, P.navy, P.gray);
  txt('COLONIAL CONSORTIUM', 524, 26, P.crudeL, 1, 'c');
  txt('OWN 51 SHARES TO RULE THE BELT', 524, 35, P.lgray, 1, 'c');
  drawShareGrid(474, 46);
  let y = 154;
  txt('YOU', 430, y, P.cyan); txt(G.shares + ' SH', 620, y, P.cyan, 1, 'r'); y += 10;
  for (const id of RIVAL_IDS) { txt(RIVALS[id].short, 430, y, rcol(id)); txt('$' + fmt(G.rcash[id]), 545, y, P.gray, 1, 'r'); txt(G.rshares[id] + ' SH', 620, y, rcol(id), 1, 'r'); y += 10; }
  y += 3;
  const nextA = Math.ceil(G.sector / SECTORS_PER_BELT) * SECTORS_PER_BELT, nb = beltOf(nextA);
  txt(nb >= 2 ? 'NEXT STOCK AUCTION: AFTER SECTOR ' + nextA : 'STOCK AUCTIONS START AFTER BELT 2', 430, y, P.yellow); y += 9;
  if (nb >= 2) { txt((SHARE_LOTS[nb] + (G.unsold || 0)) + ' SHARES, ~$' + fmt(shareBase(nb)) + ' EACH', 430, y, P.gray); y += 9; }
  txt('RIVALS HOARD CASH TO OUTBID YOU THERE', 430, y, P.gray); y += 14;
  if (G.report) {
    const r = G.report, profit = r.revenue + r.gas + r.fire + (r.bonusTotal || 0) - r.spent;
    txt('LAST SECTOR PROFIT', 430, y, P.lgray); txt((profit < 0 ? '-$' : '$') + fmt(Math.abs(profit)), 620, y, profit >= 0 ? P.lime : P.red, 1, 'r'); y += 9;
    txt('LIFETIME EARNINGS', 430, y, P.lgray); txt('$' + fmt(G.totalEarned), 620, y, P.yellow, 1, 'r'); y += 14;
  }
  txt('LOAN', 430, y, P.yellow); txt(G.debt ? 'DEBT $' + fmt(G.debt) : 'NO DEBT', 620, y, G.debt ? P.orange : P.lime, 1, 'r'); y += 9;
  txt('20% INTEREST PER SECTOR. LIMIT $' + fmt(loanLimit()), 430, y, P.gray); y += 10;
  button(430, y, 60, 14, 'BORROW 1K', borrow, { disabled: G.debt + LOAN_STEP > loanLimit(), color: P.plum, hc: P.crude });
  button(494, y, 60, 14, 'REPAY 1K', () => repay(false), { disabled: !G.debt || G.credits < 1 });
  button(558, y, 64, 14, 'REPAY ALL', () => repay(true), { disabled: !G.debt || G.credits < 1 });
  button(6, 338, 120, 16, 'SAVE & EXIT', () => { save(); screen = 'title'; sfx('click'); }, { color: P.dgray });
  button(134, 338, 130, 16, 'CANTINA', () => { screen = 'cantina'; sfx('click'); }, { color: '#5a2a1e', hc: P.orange, tc: P.yellow });
  button(272, 338, 134, 16, 'STATS', () => { TS.statsBack = 'shop'; screen = 'stats'; sfx('click'); }, { color: P.dblue });
  button(414, 338, 220, 16, 'CAMPAIGN MAP >>', () => { screen = 'map'; mapSel = null; sfx('click'); }, { color: P.green, hc: P.lime, tc: P.navy });
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
  const w = 400, h = 60 + BLACK_MARKET.length * 40, x = (W - w) / 2, y = Math.round((H - h) / 2) - 10;
  panel(x, y, w, h, '#160c14', P.orange);
  txtS('BLACK MARKET', W / 2, y + 7, P.orange, 2, 'c');
  txt('NO QUESTIONS ASKED. PRICES RISE EACH TIME YOU BUY.' + (isChar('grane') ? ' (SPY DISCOUNT -40%)' : ''), W / 2, y + 24, P.lgray, 1, 'c');
  BLACK_MARKET.forEach((item, i) => {
    const ry = y + 36 + i * 40;
    rect(x + 8, ry, w - 16, 36, '#22121c');
    txt(item.name, x + 14, ry + 5, P.yellow);
    txt(item.desc, x + 14, ry + 14, P.lgray);
    const isLoan = item.id === 'loan';
    const c = isLoan ? 0 : bmCost(item), can = isLoan ? G.debt + LOAN_STEP <= loanLimit() : G.credits >= c, used = item.id === 'short' && S.bmUses.short;
    if (isLoan) txt('DEBT $' + fmt(G.debt) + ' / LIMIT $' + fmt(loanLimit()), x + w - 14, ry + 5, G.debt ? P.orange : P.lgray, 1, 'r');
    else txt(used ? 'USED THIS SECTOR' : '$' + fmt(c), x + w - 14, ry + 5, used ? P.gray : can ? P.yellow : P.red, 1, 'r');
    let targets;
    if (item.target === 'rival') targets = S.rivals.map(id => [RIVALS[id].short, id, rcol(id)]);
    else if (item.target === 'owner') targets = RIVAL_IDS.filter(id => G.rshares[id] > 0).map(id => [RIVALS[id].short + ' (' + G.rshares[id] + ')', id, rcol(id)]);
    else if (item.target === 'station') targets = S.stations.map(st2 => [st2.name, st2, P.cyan]);
    else targets = [[item.id === 'loan' ? 'BORROW $' + fmt(LOAN_STEP) : 'BUY', null, P.white]];
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
  TS.diff = TS.diff || 'normal';
  ['easy', 'normal', 'hard'].forEach((id, i) => button(118 + i * 92, 334, 88, 16, DIFFS[id].name, () => { TS.diff = id; sfx('click'); }, { active: TS.diff === id, color: id === 'hard' ? P.red : id === 'easy' ? P.teal : P.dblue }));
  txt(DIFFS[TS.diff].desc, 256, 326, P.lgray, 1, 'c');
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
    const x0 = stationPanelX(s);
    if (Math.abs(x - s.x) <= 26 && y >= SURF - 46 && y <= SURF + 2) return s;
    if (x >= x0 && x <= x0 + SP_W && y >= 14 && y <= 70) return s;
  }
  return null;
}
function pipeGrab(x, y) {
  let best = null, bd = 6;
  for (const r of myRigs()) {
    const j = nearestJoint(r, x, y);
    if (j.seg >= 0 && j.d < bd) { bd = j.d; best = { rig: r, start: j }; }
  }
  return best;
}
function playDown(p) {
  if (S.paused || S.help || S.choice || S.bm || S.auction || S.confirmEnd || S.tool) return;
  S.drag = null;
  const r = rigAt(p.x, p.y);
  if (r && r.owner === 'you') { S.drag = { kind: 'pipe', rig: r, start: jointsOf(r)[0] }; return; }
  if (p.y > UG_TOP) { const g = pipeGrab(p.x, p.y); if (g) S.drag = { kind: 'pipe', rig: g.rig, start: g.start }; }
}
function playUp(p) {
  if (S.paused || S.help || S.choice || S.bm || S.auction || S.confirmEnd) return;
  if (S.tool === 'glitch') { releaseGlitch(p.x, p.y); return; }
  if (S.tool === 'blast') { if (p.y < 341) blast(p.x, p.y); return; }
  if (S.tool) { if (p.y > 13 && p.y < 341) placeAt(S.tool, Math.round(p.x / 4) * 4); return; }
  const d = S.drag; S.drag = null;
  if (d && mouse.moved) {
    if (d.kind === 'pipe' && p.y > UG_TOP) { const end = layPipe(d.rig, d.start, p.x, p.y); S.sel = { kind: 'rig', ref: d.rig }; S.pen = end ? { rig: d.rig, start: end } : null; return; }
  }
  clickWorld(p);
}
function clickWorld(p) {
  const stn = stationAt(p.x, p.y);
  if (stn) {
    if (S.sel && S.sel.kind === 'hauler') setSide(S.sel.ref, S.stations.indexOf(stn));
    else sendHaulerTo(S.stations.indexOf(stn));
    return;
  }
  const h = haulerAt(p.x, p.y);
  if (h) { S.sel = { kind: 'hauler', ref: h }; sfx('click'); return; }
  const r = rigAt(p.x, p.y);
  if (r) { if (r.owner === 'you') { S.sel = { kind: 'rig', ref: r }; S.pen = null; sfx('click'); } return; }
  const si = siloAt(p.x, p.y);
  if (si) { S.sel = { kind: 'silo', ref: si }; sfx('click'); return; }
  if (S.sel && S.sel.kind === 'rig' && p.y > UG_TOP) {
    const rr = S.sel.ref;
    const start = S.pen && S.pen.rig === rr ? S.pen.start : nearestJoint(rr, p.x, p.y);
    const end = layPipe(rr, start, p.x, p.y);
    if (end) S.pen = { rig: rr, start: end };
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
  if (e.button === 2) { if (screen === 'play' && S) { if (S.pen) S.pen = null; else { S.tool = null; S.sel = null; } S.drag = null; } return; }
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
  if (screen === 'stock' && e.key === ' ') { stockBuy('you'); e.preventDefault(); return; }
  if (screen !== 'play' || !S) return;
  const k = e.key.toLowerCase();
  if (S.choice) { const i = '123'.indexOf(k); if (i >= 0 && S.choice[i]) pickPerk(i); return; }
  if (S.confirmEnd) { if (k === 'enter') finishEarly(); else if (k === 'escape') S.confirmEnd = false; return; }
  if (S.auction && !S.paused) { if (k === 'b') auctionBid('you'); else if (k === 'escape') auctionPass(); return; }
  if (S.bm && k !== 'escape' && k !== '6') return;
  if (k === ' ' || k === 'p') { togglePause(); e.preventDefault(); return; }
  if (k === 'escape') { if (S.bm) S.bm = false; else if (S.help) S.help = false; else if (S.pen) S.pen = null; else if (S.tool || S.sel) { S.tool = null; S.sel = null; } else togglePause(); return; }
  if (S.paused) return;
  if (k === '1') setTool('rig');
  else if (k === '2') setTool('silo');
  else if (k === '3') buyHauler();
  else if (k === '5') setTool('blast');
  else if (k === '6') { S.bm = !S.bm; S.tool = null; }
  else if (k === '7') setTool('glitch');
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
document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play' && S) { if (!S.paused) S.paused = true; saveSector(); } });
addEventListener('beforeunload', () => { if (screen === 'play' && S) saveSector(); });

// ---------------------------------------------------------------- main loop
let last = performance.now(), acc = 0;
const STEP = 1 / 60;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now; GT += dt;
  if (screen === 'play' && S && S.auction && !S.paused && !S.help) updateAuction(dt);
  if (screen === 'stock') updateStock(dt);
  if (screen === 'play' && S && !S.paused && !S.help && !S.choice && !S.bm && !S.auction && !S.confirmEnd) {
    acc += dt * S.speed;
    let n = 0;
    while (acc >= STEP && n < 24) { update(STEP); acc -= STEP; n++; if (screen !== 'play') break; }
    if (n >= 24) acc = 0;
  }
  if (S) S.shake = Math.max(0, S.shake - dt * 20);
  BTN = [];
  ctx.setTransform(R, 0, 0, R, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (screen === 'title') renderTitle();
  else if (screen === 'play' && S) renderPlay();
  else if (screen === 'summary') renderSummary();
  else if (screen === 'shop') renderShop();
  else if (screen === 'victory') renderEnd(true);
  else if (screen === 'defeat') renderEnd(false);
  else if (screen === 'charselect') renderCharSelect();
  else if (screen === 'legacy') renderLegacy();
  else if (screen === 'map') renderMap();
  else if (screen === 'cantina') renderCantina();
  else if (screen === 'stats') renderStats();
  else if (screen === 'stock') renderStock();
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
