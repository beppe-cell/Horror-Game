/**
 * The 50 items of the second wave (docs/art/prompt-oggetti-50.md). Three
 * kinds: pacts (a strong bonus with a price), plain bonuses, and cursed
 * items that only hurt and look harmless until picked up. They unlock ten
 * at a time, one batch per run completed (`tier` 1 to 5, see unlocks.ts).
 * Icons come from the `icons-01-10` … `icons-41-50` sheets, 5x2, reading order.
 */
import type { ItemDef } from './items';
import type { Modifier } from './stats';

export type NewItemId =
  | 'misaligned-cannon'
  | 'lead-boots'
  | 'adrenaline-injector'
  | 'cracked-lens'
  | 'leaking-battery'
  | 'bone-horn'
  | 'stitched-heart'
  | 'cursed-coin'
  | 'skeletal-glove'
  | 'night-visor'
  | 'unstable-core'
  | 'crystal-rounds'
  | 'shadow-cloak'
  | 'release-valve'
  | 'pulse-coil'
  | 'split-prism'
  | 'spore-vial'
  | 'gravity-anchor'
  | 'alien-eye'
  | 'red-serum'
  | 'resin-shell'
  | 'steam-turbine'
  | 'pirate-chip'
  | 'hydraulic-piston'
  | 'pulsing-egg'
  | 'jetpack'
  | 'broken-coolant'
  | 'first-aid-kit'
  | 'laser-sight'
  | 'quartz-crystal'
  | 'compression-spring'
  | 'cooling-fan'
  | 'alien-clover'
  | 'titanium-plate'
  | 'elastic-rounds'
  | 'focus-lens'
  | 'plasma-cell'
  | 'radar-antenna'
  | 'emergency-charge'
  | 'ship-medal'
  | 'stabilizer'
  | 'star-fragment'
  | 'flesh-doll'
  | 'black-mirror'
  | 'rusty-chain'
  | 'blind-eye'
  | 'whispering-skull'
  | 'thorn'
  | 'black-dust'
  | 'abyss-idol';

const all = (k: number): Modifier[] => [
  { stat: 'damage', add: 0.5 * k },
  { stat: 'fireRate', add: 0.3 * k },
  { stat: 'range', add: 1 * k },
  { stat: 'shotSpeed', add: 1 * k },
  { stat: 'moveSpeed', add: 0.3 * k },
  { stat: 'luck', add: 1 * k },
];

type Def = Omit<ItemDef, 'id' | 'sheet' | 'frame' | 'tier'>;

/** In sheet order: index i is icon i of the five sheets and unlocks with batch i / 10 + 1. */
const LIST: [NewItemId, Def][] = [
  // Pacts
  ['misaligned-cannon', { name: 'Cannone sfasato', hint: 'Danno ++, cadenza --', color: 0xff9a3c, quality: 3, aura: { kind: 'sparks', color: 0xff9a3c }, modifiers: [{ stat: 'damage', add: 1 }, { stat: 'damage', mul: 1.4 }, { stat: 'fireRate', mul: 0.7 }] }],
  ['lead-boots', { name: 'Scarponi di piombo', hint: 'Danno +, +1 cella, velocità -', color: 0x8a96a8, quality: 2, aura: { kind: 'trail', color: 0x8a96a8 }, maxHealth: 2, modifiers: [{ stat: 'damage', add: 0.6 }, { stat: 'moveSpeed', add: -0.5 }] }],
  ['adrenaline-injector', { name: 'Iniettore di adrenalina', hint: 'Velocità ++, cadenza +, -1 cella', color: 0xff4a5a, quality: 2, aura: { kind: 'trail', color: 0xff4a5a }, maxHealth: -2, modifiers: [{ stat: 'moveSpeed', add: 1 }, { stat: 'fireRate', add: 0.4 }] }],
  ['cracked-lens', { name: 'Lente incrinata', hint: 'Gittata ++, velocità dei colpi -', color: 0xb8f1ff, quality: 2, aura: { kind: 'glow', color: 0xb8f1ff }, modifiers: [{ stat: 'range', add: 3 }, { stat: 'shotSpeed', add: -2 }] }],
  ['leaking-battery', { name: 'Batteria a perdere', hint: 'Cadenza +++, gittata --', color: 0x39d0ff, quality: 3, aura: { kind: 'drip', color: 0x4dffb0 }, modifiers: [{ stat: 'fireRate', add: 1.5 }, { stat: 'range', add: -2 }] }],
  ['bone-horn', { name: "Corno d'osso", hint: 'Colpi perforanti, danno +, cadenza -', color: 0xe8dcc8, quality: 3, aura: { kind: 'shimmer', color: 0x4dffb0 }, pierce: true, modifiers: [{ stat: 'damage', add: 0.5 }, { stat: 'fireRate', add: -0.4 }] }],
  ['stitched-heart', { name: 'Cuore ricucito', hint: '+2 celle, velocità -', color: 0x8a2a3a, quality: 2, aura: { kind: 'drip', color: 0x8a2a3a }, maxHealth: 4, modifiers: [{ stat: 'moveSpeed', add: -0.4 }] }],
  ['cursed-coin', { name: 'Moneta maledetta', hint: '+15 monete, fortuna --', color: 0xff4a5a, quality: 1, aura: { kind: 'halo', color: 0xff4a5a }, coins: 15, modifiers: [{ stat: 'luck', add: -2 }] }],
  ['skeletal-glove', { name: 'Guanto scheletrico', hint: 'Cadenza +, danno -', color: 0xc8ccc4, quality: 2, aura: { kind: 'sparks', color: 0xc8ccc4 }, modifiers: [{ stat: 'fireRate', add: 0.6 }, { stat: 'damage', mul: 0.85 }] }],
  ['night-visor', { name: 'Visore notturno rotto', hint: 'Gittata +, colpi cercatori, danno -', color: 0x4dffb0, quality: 3, aura: { kind: 'glow', color: 0x4dffb0 }, homing: true, modifiers: [{ stat: 'range', add: 1 }, { stat: 'damage', mul: 0.85 }] }],
  ['unstable-core', { name: 'Nucleo instabile', hint: 'Danno +++, -2 celle', color: 0xfff0b0, quality: 3, aura: { kind: 'glow', color: 0xfff0b0 }, maxHealth: -4, modifiers: [{ stat: 'damage', mul: 1.8 }] }],
  ['crystal-rounds', { name: 'Proiettili di cristallo', hint: 'Danno ++, gittata -', color: 0x5af0ff, quality: 2, aura: { kind: 'sparks', color: 0x5af0ff }, modifiers: [{ stat: 'damage', add: 1.2 }, { stat: 'range', add: -1.5 }] }],
  ['shadow-cloak', { name: "Mantello d'ombra", hint: 'Velocità ++, gittata -', color: 0xa070ff, quality: 2, aura: { kind: 'shimmer', color: 0x2a2440 }, modifiers: [{ stat: 'moveSpeed', add: 1 }, { stat: 'range', add: -1.2 }] }],
  ['release-valve', { name: 'Valvola di sfogo', hint: 'Velocità dei colpi ++, danno -', color: 0xff4a5a, quality: 2, aura: { kind: 'drip', color: 0xe0e0e0 }, modifiers: [{ stat: 'shotSpeed', add: 3 }, { stat: 'damage', mul: 0.85 }] }],
  ['pulse-coil', { name: 'Bobina a impulsi', hint: 'Due colpi alla volta, cadenza --', color: 0xc8864a, quality: 3, aura: { kind: 'sparks', color: 0x39d0ff }, double: true, modifiers: [{ stat: 'fireRate', mul: 0.7 }] }],
  ['split-prism', { name: 'Prisma diviso', hint: 'Tre colpi a ventaglio, danno --', color: 0x7cf7d4, quality: 3, aura: { kind: 'orbit', color: 0xff4a5a }, spread: true, modifiers: [{ stat: 'damage', mul: 0.65 }] }],
  ['spore-vial', { name: 'Fiala di spore', hint: 'Fortuna ++, velocità -', color: 0xd8e04a, quality: 2, aura: { kind: 'drip', color: 0xd8e04a }, modifiers: [{ stat: 'luck', add: 2 }, { stat: 'moveSpeed', add: -0.4 }] }],
  ['gravity-anchor', { name: 'Ancora gravitazionale', hint: 'Danno ++, colpi che rimbalzano, velocità dei colpi --', color: 0xa070ff, quality: 3, aura: { kind: 'orbit', color: 0xa070ff }, bounce: true, modifiers: [{ stat: 'damage', add: 1 }, { stat: 'shotSpeed', add: -2.5 }] }],
  ['alien-eye', { name: 'Occhio alieno', hint: 'Colpi cercatori, gittata -', color: 0xffd34d, quality: 3, aura: { kind: 'glow', color: 0xffd34d }, homing: true, modifiers: [{ stat: 'range', add: -1.2 }] }],
  ['red-serum', { name: 'Siero rosso', hint: 'Danno +, cadenza +, -1 cella', color: 0x8a1a28, quality: 2, aura: { kind: 'drip', color: 0x8a1a28 }, maxHealth: -2, modifiers: [{ stat: 'damage', add: 0.6 }, { stat: 'fireRate', add: 0.4 }] }],
  ['resin-shell', { name: 'Guscio di resina', hint: '+2 celle di scudo, velocità -', color: 0xc8a050, quality: 2, aura: { kind: 'bubble', color: 0xc8a050 }, shield: 4, modifiers: [{ stat: 'moveSpeed', add: -0.4 }] }],
  ['steam-turbine', { name: 'Turbina a vapore', hint: 'Velocità +, cadenza +, fortuna -', color: 0xd8a040, quality: 2, aura: { kind: 'trail', color: 0xe0e0e0 }, modifiers: [{ stat: 'moveSpeed', add: 0.6 }, { stat: 'fireRate', add: 0.4 }, { stat: 'luck', add: -1 }] }],
  ['pirate-chip', { name: 'Chip pirata', hint: 'Fortuna +++, danno -', color: 0xc8ccc4, quality: 2, aura: { kind: 'halo', color: 0xc8ccc4 }, modifiers: [{ stat: 'luck', add: 3 }, { stat: 'damage', mul: 0.85 }] }],
  ['hydraulic-piston', { name: 'Pistone idraulico', hint: 'Velocità dei colpi +, danno +, cadenza -', color: 0xffd34d, quality: 2, aura: { kind: 'sparks', color: 0xffd34d }, modifiers: [{ stat: 'shotSpeed', add: 1.5 }, { stat: 'damage', add: 0.6 }, { stat: 'fireRate', add: -0.4 }] }],
  ['pulsing-egg', { name: 'Uovo pulsante', hint: 'Quando sei colpito esplode una raffica, -1 cella', color: 0xff9a3c, quality: 3, aura: { kind: 'shimmer', color: 0xff9a3c }, retaliate: true, maxHealth: -2 }],
  ['jetpack', { name: 'Zaino a reazione', hint: 'Velocità +++, danno -', color: 0x39d0ff, quality: 3, aura: { kind: 'trail', color: 0x39d0ff }, modifiers: [{ stat: 'moveSpeed', add: 1.5 }, { stat: 'damage', mul: 0.85 }] }],
  ['broken-coolant', { name: 'Tubo di raffreddamento rotto', hint: 'Cadenza ++, velocità dei colpi -', color: 0xb8f1ff, quality: 2, aura: { kind: 'drip', color: 0xb8f1ff }, modifiers: [{ stat: 'fireRate', add: 1 }, { stat: 'shotSpeed', add: -2 }] }],
  // Bonuses
  ['first-aid-kit', { name: 'Kit di pronto soccorso', hint: '+1 cella, tuta riparata', color: 0xff4a5a, quality: 3, aura: { kind: 'glow', color: 0xff8a8a }, maxHealth: 2, fullHeal: true }],
  ['laser-sight', { name: 'Mirino laser', hint: 'Gittata +, velocità dei colpi +', color: 0xff4a5a, quality: 2, aura: { kind: 'sparks', color: 0xff4a5a }, modifiers: [{ stat: 'range', add: 1.5 }, { stat: 'shotSpeed', add: 1.5 }] }],
  ['quartz-crystal', { name: 'Cristallo di quarzo', hint: 'Danno +', color: 0xff7ad0, quality: 2, aura: { kind: 'glow', color: 0xff7ad0 }, modifiers: [{ stat: 'damage', add: 0.7 }] }],
  ['compression-spring', { name: 'Molla a compressione', hint: 'Velocità +', color: 0x4dffb0, quality: 1, aura: { kind: 'trail', color: 0x4dffb0 }, modifiers: [{ stat: 'moveSpeed', add: 0.6 }] }],
  ['cooling-fan', { name: 'Ventola di raffreddamento', hint: 'Cadenza +', color: 0xb8f1ff, quality: 1, aura: { kind: 'sparks', color: 0xb8f1ff }, modifiers: [{ stat: 'fireRate', add: 0.5 }] }],
  ['alien-clover', { name: 'Trifoglio alieno', hint: 'Fortuna ++', color: 0x4dffb0, quality: 2, aura: { kind: 'halo', color: 0x4dffb0 }, modifiers: [{ stat: 'luck', add: 2 }] }],
  ['titanium-plate', { name: 'Piastra di titanio', hint: '+1 cella, +1 cella di scudo', color: 0x39d0ff, quality: 3, aura: { kind: 'bubble', color: 0x39d0ff }, maxHealth: 2, shield: 2 }],
  ['elastic-rounds', { name: 'Munizioni elastiche', hint: 'Colpi che rimbalzano, gittata +', color: 0xff9a3c, quality: 2, aura: { kind: 'orbit', color: 0xff9a3c }, bounce: true, modifiers: [{ stat: 'range', add: 1 }] }],
  ['focus-lens', { name: 'Lente a fuoco', hint: 'Danno +, gittata +', color: 0xffd34d, quality: 2, aura: { kind: 'glow', color: 0xffd34d }, modifiers: [{ stat: 'damage', add: 0.5 }, { stat: 'range', add: 1 }] }],
  ['plasma-cell', { name: 'Cella al plasma', hint: 'Velocità dei colpi ++', color: 0x39d0ff, quality: 1, aura: { kind: 'orbit', color: 0x39d0ff }, modifiers: [{ stat: 'shotSpeed', add: 3 }] }],
  ['radar-antenna', { name: 'Antenna radar', hint: 'Colpi cercatori', color: 0xff4a5a, quality: 3, aura: { kind: 'halo', color: 0xff4a5a }, homing: true }],
  ['emergency-charge', { name: "Ricarica d'emergenza", hint: '+3 celle di scudo', color: 0x39d0ff, quality: 2, aura: { kind: 'bubble', color: 0xb8f1ff }, shield: 6 }],
  ['ship-medal', { name: 'Medaglione di bordo', hint: 'Fortuna +, danno +', color: 0xffd34d, quality: 2, aura: { kind: 'halo', color: 0xffd34d }, modifiers: [{ stat: 'luck', add: 1 }, { stat: 'damage', add: 0.4 }] }],
  ['stabilizer', { name: 'Stabilizzatore', hint: 'Cadenza +, velocità +', color: 0x4dffb0, quality: 2, aura: { kind: 'glow', color: 0x4dffb0 }, modifiers: [{ stat: 'fireRate', add: 0.4 }, { stat: 'moveSpeed', add: 0.4 }] }],
  ['star-fragment', { name: 'Frammento di stella', hint: 'Tutte le statistiche +', color: 0xfff0b0, quality: 4, aura: { kind: 'shimmer', color: 0xfff0b0 }, modifiers: all(1) }],
  // Cursed: harmless-looking, only bad.
  ['flesh-doll', { name: 'Bambola di carne', hint: 'Velocità --', color: 0x8a96a8, quality: 1, cursed: true, aura: { kind: 'drip', color: 0x8a2a3a }, modifiers: [{ stat: 'moveSpeed', add: -0.8 }] }],
  ['black-mirror', { name: 'Specchio nero', hint: 'Fortuna ---', color: 0x2a2440, quality: 1, cursed: true, aura: { kind: 'shimmer', color: 0x2a2440 }, modifiers: [{ stat: 'luck', add: -3 }] }],
  ['rusty-chain', { name: 'Catena arrugginita', hint: 'Cadenza --', color: 0x8a5a3a, quality: 1, cursed: true, aura: { kind: 'trail', color: 0x8a5a3a }, modifiers: [{ stat: 'fireRate', mul: 0.75 }] }],
  ['blind-eye', { name: 'Occhio cieco', hint: 'Gittata --', color: 0xe8dcc8, quality: 1, cursed: true, aura: { kind: 'orbit', color: 0xe8dcc8 }, modifiers: [{ stat: 'range', add: -2 }] }],
  ['whispering-skull', { name: 'Cranio sussurrante', hint: 'Danno -', color: 0xa070ff, quality: 1, cursed: true, aura: { kind: 'halo', color: 0xa070ff }, modifiers: [{ stat: 'damage', mul: 0.85 }] }],
  ['thorn', { name: 'Spina nel fianco', hint: '-1 cella', color: 0x8a1a28, quality: 1, cursed: true, aura: { kind: 'drip', color: 0x8a1a28 }, maxHealth: -2 }],
  ['black-dust', { name: 'Polvere nera', hint: 'Velocità dei colpi --', color: 0x3a3a48, quality: 1, cursed: true, aura: { kind: 'trail', color: 0x3a3a48 }, modifiers: [{ stat: 'shotSpeed', add: -3 }] }],
  ['abyss-idol', { name: "Idolo dell'abisso", hint: 'Tutte le statistiche -', color: 0xff4a5a, quality: 1, cursed: true, aura: { kind: 'glow', color: 0xff2a3a }, modifiers: all(-1) }],
];

export const NEW_ITEMS = Object.fromEntries(
  LIST.map(([id, def], i) => [
    id,
    { ...def, id, sheet: `icons${Math.floor(i / 10) + 1}` as ItemDef['sheet'], frame: i % 10, tier: Math.floor(i / 10) + 1 } as ItemDef,
  ]),
) as Record<NewItemId, ItemDef>;
