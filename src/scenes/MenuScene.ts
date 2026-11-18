import Phaser from 'phaser';
import { BIOMES, preloadBiome } from '../render/biome';
import { preloadEnemies } from './Enemies';
import { preloadItemArt } from '../render/itemIcons';
import { createPlayerAnims, preloadPlayer } from '../render/playerSprites';
import { newSeedString } from '../rules/rng';
import { Quality } from '../rules/view';

/** What main.ts hands the menu: settings from the URL and the device. */
export interface MenuData {
  quality: Quality;
  shake: number;
  /** Seed from the URL (`?seed=`), kept for the first run. */
  seed?: string;
  /** Floor from the URL (`?floor=`), for testing deeper floors. */
  floor?: number;
  /** Skip the menu and start a run at once (URL with a seed or a floor). */
  autostart?: boolean;
  /** The run just ended at the bottom of the last floor. */
  won?: boolean;
}

interface Settings {
  quality: Quality;
  /** Screen shake, 0 to 1. */
  shake: number;
}

const SETTINGS_KEY = 'deepcore-settings';
const SHAKE_STEPS = [1, 0.5, 0];

function loadSettings(fallback: Settings): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const s = JSON.parse(raw) as Partial<Settings>;
    return {
      quality: s.quality === 'high' || s.quality === 'low' ? s.quality : fallback.quality,
      shake: typeof s.shake === 'number' && s.shake >= 0 && s.shake <= 1 ? s.shake : fallback.shake,
    };
  } catch {
    return fallback;
  }
}

function saveSettings(s: Settings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // Private windows may refuse storage: settings then last for this visit only.
  }
}

interface Entry {
  label: () => string;
  run: () => void;
  text?: Phaser.GameObjects.Text;
}

/**
 * Title screen. Loads every sprite of the game first, with a progress bar,
 * so a run never waits for art once it starts. Then shows the menu: start a
 * run, pick a new seed, music, screen shake and effects quality. Works with
 * mouse, touch, keyboard and gamepad.
 */
export default class MenuScene extends Phaser.Scene {
  private data0!: MenuData;
  private settings!: Settings;
  private seed = '';
  private entries: Entry[] = [];
  private selected = 0;
  private starting = false;
  private layer!: Phaser.GameObjects.Container;
  private astronaut?: Phaser.GameObjects.Sprite;
  private astronautY = 0;
  private glow?: Phaser.GameObjects.Image;

  constructor() {
    super('menu');
  }

  init(data: MenuData): void {
    this.data0 = data;
    this.settings = loadSettings({ quality: data.quality, shake: data.shake });
    // A URL seed is used once; afterwards each run gets a fresh one.
    this.seed = data.seed ?? newSeedString();
    this.entries = [];
    this.selected = 0;
    this.starting = false;
  }

  preload(): void {
    const { width, height } = this.scale;
    const barW = Math.min(360, width * 0.7);
    const x = (width - barW) / 2;
    const y = height / 2;
    const title = this.add
      .text(width / 2, y - 48, 'DEEPCORE', { fontFamily: 'monospace', fontSize: '32px', color: '#7fe3ff', fontStyle: 'bold' })
      .setOrigin(0.5);
    const frame = this.add.graphics();
    frame.lineStyle(2, 0x2a3a4a, 1).strokeRect(x - 3, y - 3, barW + 6, 16);
    const bar = this.add.graphics();
    const label = this.add
      .text(width / 2, y + 30, 'Caricamento 0%', { fontFamily: 'monospace', fontSize: '14px', color: '#8a9ab0' })
      .setOrigin(0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      bar.clear().fillStyle(0x4dffb0, 1).fillRect(x, y, barW * p, 10);
      label.setText(`Caricamento ${Math.round(p * 100)}%`);
    });
    this.load.once(Phaser.Loader.Events.COMPLETE, () => [title, frame, bar, label].forEach((o) => o.destroy()));
    preloadPlayer(this);
    for (const b of BIOMES) preloadBiome(this, b);
    preloadEnemies(this);
    preloadItemArt(this);
  }

  create(): void {
    this.registry.set('assetsLoaded', true);
    createPlayerAnims(this);
    if (this.data0.autostart) {
      this.data0.autostart = false;
      this.startRun();
      return;
    }
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.buildBackdrop();
    this.layer = this.add.container(0, 0).setDepth(10);
    this.buildMenu();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this));
    this.bindInput();
    this.layout();
  }

  /** Dark cave floor, drifting dust and the astronaut standing in a pool of light. */
  private buildBackdrop(): void {
    makeTextures(this);
    const { width, height } = this.scale;
    const floor = this.add.tileSprite(0, 0, width, height, '1-crash-tile-0').setOrigin(0).setScale(3).setTint(0x3a4250).setDepth(0);
    floor.setName('floor');
    this.add.image(0, 0, 'menu-vignette').setOrigin(0).setName('vignette').setDepth(2);
    this.add
      .particles(0, 0, 'menu-dot', {
        x: { min: 0, max: 2000 },
        y: { min: 0, max: 1200 },
        lifespan: { min: 4000, max: 8000 },
        speedY: { min: -12, max: -4 },
        speedX: { min: -6, max: 6 },
        alpha: { start: 0.6, end: 0 },
        scale: { min: 0.5, max: 1.5 },
        tint: [0x7fe3ff, 0x4dffb0, 0xc8ccc4],
        frequency: 120,
      })
      .setDepth(3);
    // A soft pool of helmet light around the astronaut.
    this.glow = this.add.image(0, 0, 'menu-glow').setDepth(3).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
    this.tweens.add({ targets: this.glow, alpha: 0.35, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.astronaut = this.add.sprite(0, 0, 'player-idle', 0).setScale(4).setDepth(4);
    this.astronaut.play('player-idle-down');
  }

  update(time: number): void {
    // The astronaut floats gently above its spot.
    if (this.astronaut) this.astronaut.y = this.astronautY + Math.sin(time / 600) * 3;
  }

  private buildMenu(): void {
    const style = { fontFamily: 'monospace', fontSize: '22px', color: '#c8ccc4' };
    const music = this.registry.get('music') as { start(): void; toggle(): boolean; isMuted: boolean } | undefined;
    this.entries = [
      { label: () => 'Nuova partita', run: () => this.startRun() },
      {
        label: () => `Seme: ${this.seed}`,
        run: () => {
          this.seed = newSeedString();
        },
      },
      {
        label: () => `Musica: ${music?.isMuted ? 'no' : 'sì'}`,
        run: () => {
          music?.start();
          music?.toggle();
          this.game.events.emit('music-toggled');
        },
      },
      {
        label: () => `Scossa dello schermo: ${Math.round(this.settings.shake * 100)}%`,
        run: () => {
          const i = SHAKE_STEPS.indexOf(this.settings.shake);
          this.settings.shake = SHAKE_STEPS[(i + 1) % SHAKE_STEPS.length];
          saveSettings(this.settings);
          this.cameras.main.shake(150, 0.006 * this.settings.shake);
        },
      },
      {
        label: () => `Effetti: ${this.settings.quality === 'high' ? 'alti' : 'leggeri'}`,
        run: () => {
          this.settings.quality = this.settings.quality === 'high' ? 'low' : 'high';
          saveSettings(this.settings);
        },
      },
    ];
    const title = this.add
      .text(0, 0, 'DEEPCORE', { fontFamily: 'monospace', fontSize: '64px', color: '#7fe3ff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setName('title');
    title.setShadow(0, 0, '#39d0ff', 18, true, true);
    this.tweens.add({ targets: title, alpha: 0.82, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const subtitle = this.add
      .text(0, 0, 'Sopravvivi alle profondità aliene', { fontFamily: 'monospace', fontSize: '16px', color: '#8a9ab0' })
      .setOrigin(0.5)
      .setName('subtitle');
    this.layer.add([title, subtitle]);
    if (this.data0.won) {
      const won = this.add
        .text(0, 0, 'Run completata: hai raggiunto il fondo!', { fontFamily: 'monospace', fontSize: '18px', color: '#ffd34d' })
        .setOrigin(0.5)
        .setName('won');
      this.layer.add(won);
    }
    this.entries.forEach((e, i) => {
      const t = this.add.text(0, 0, '', style).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on(Phaser.Input.Events.POINTER_OVER, () => this.select(i));
      t.on(Phaser.Input.Events.POINTER_UP, () => {
        this.select(i);
        this.activate();
      });
      e.text = t;
      this.layer.add(t);
    });
    const hint = this.add
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '13px', color: '#5a6a80', align: 'center' })
      .setOrigin(0.5)
      .setName('hint');
    this.layer.add(hint);
    this.refresh();
  }

  private bindInput(): void {
    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.move(-1));
    kb?.on('keydown-W', () => this.move(-1));
    kb?.on('keydown-DOWN', () => this.move(1));
    kb?.on('keydown-S', () => this.move(1));
    kb?.on('keydown-ENTER', () => this.activate());
    kb?.on('keydown-SPACE', () => this.activate());
    this.input.gamepad?.on('down', (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
      if (button.index === 12) this.move(-1);
      else if (button.index === 13) this.move(1);
      else if (button.index === 0 || button.index === 9) this.activate();
    });
  }

  private move(step: number): void {
    this.select((this.selected + step + this.entries.length) % this.entries.length);
  }

  private select(i: number): void {
    if (this.selected === i) return;
    this.selected = i;
    this.refresh();
  }

  private activate(): void {
    if (this.starting) return;
    this.entries[this.selected].run();
    this.refresh();
  }

  private refresh(): void {
    this.entries.forEach((e, i) => {
      const on = i === this.selected;
      e.text?.setText(on ? `▸ ${e.label()} ◂` : e.label()).setColor(on ? '#4dffb0' : '#c8ccc4');
    });
    const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const hint = this.layer.getByName('hint') as Phaser.GameObjects.Text | null;
    hint?.setText(
      touch
        ? 'Stick sinistro: muoviti  ·  stick destro: spara'
        : 'WASD: muoviti  ·  frecce: spara  ·  P: pausa  ·  M: musica',
    );
  }

  /** Places everything for the current screen size, portrait or landscape. */
  private layout(): void {
    const { width, height } = this.scale;
    const portrait = height > width;
    // Phones held upright are narrow: size to the width there.
    const s = Math.max(0.6, Math.min(1.4, portrait ? Math.min(width / 480, height / 800) : Math.min(width / 900, height / 640)));
    const floor = this.children.getByName('floor') as Phaser.GameObjects.TileSprite | null;
    floor?.setSize(width / 3 + 2, height / 3 + 2);
    const vignette = this.children.getByName('vignette') as Phaser.GameObjects.Image | null;
    vignette?.setDisplaySize(width, height);
    const cx = width / 2;
    const get = (n: string) => this.layer.getByName(n) as Phaser.GameObjects.Text | null;
    get('title')?.setPosition(cx, height * (portrait ? 0.14 : 0.16)).setScale(s);
    get('subtitle')?.setPosition(cx, height * (portrait ? 0.14 : 0.16) + 48 * s).setScale(s);
    get('won')?.setPosition(cx, height * (portrait ? 0.14 : 0.16) + 78 * s).setScale(s);
    // The astronaut stands beside the menu on wide screens, above it on tall ones.
    if (this.astronaut) {
      this.astronaut.setScale(4 * s);
      if (portrait) this.astronaut.setPosition(cx, height * 0.38);
      else this.astronaut.setPosition(width * 0.24, height * 0.58);
      this.astronautY = this.astronaut.y;
      this.glow?.setPosition(this.astronaut.x, this.astronaut.y + 40 * s).setScale(1.6 * s);
    }
    const menuX = portrait ? cx : width * 0.6;
    const top = portrait ? height * 0.54 : height * 0.42;
    this.entries.forEach((e, i) => e.text?.setPosition(menuX, top + i * 44 * s).setScale(s));
    get('hint')?.setPosition(cx, height - 28 * s).setScale(s);
  }

  private startRun(): void {
    if (this.starting) return;
    this.starting = true;
    const music = this.registry.get('music') as { start(): void } | undefined;
    music?.start();
    const data = {
      seed: this.seed.toUpperCase(),
      quality: this.settings.quality,
      shake: this.settings.shake,
      floor: this.data0.floor,
    };
    // The URL floor applies to the first run only.
    this.data0.floor = undefined;
    this.seed = newSeedString();
    const go = () => {
      this.scene.start('play', data);
    };
    if (!this.layer) {
      go();
      return;
    }
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, go);
  }
}

/** Small textures the menu draws itself: a dust mote and a dark vignette. */
function makeTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('menu-dot')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2);
    g.generateTexture('menu-dot', 2, 2).destroy();
  }
  if (!scene.textures.exists('menu-glow')) {
    const size = 256;
    const tex = scene.textures.createCanvas('menu-glow', size, size);
    if (tex) {
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(127,227,255,0.5)');
      grad.addColorStop(0.5, 'rgba(77,255,176,0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      tex.refresh();
    }
  }
  if (!scene.textures.exists('menu-vignette')) {
    const size = 256;
    const tex = scene.textures.createCanvas('menu-vignette', size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size * 0.55, size * 0.1, size / 2, size / 2, size * 0.72);
    grad.addColorStop(0, 'rgba(7,7,12,0)');
    grad.addColorStop(0.6, 'rgba(7,7,12,0.55)');
    grad.addColorStop(1, 'rgba(7,7,12,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }
}
