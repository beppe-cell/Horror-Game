import Phaser from 'phaser';
import { Dir4, Vec2, followOrigin, stickToDir4, touchSide, virtualStick } from '../rules/input';

/** Stick radius as a share of the shorter screen side. */
const RADIUS_SHARE = 0.11;

interface Stick {
  /** Browser touch identifier of the finger holding it, or null. */
  touchId: number | null;
  origin: Vec2;
  value: Vec2;
  base: Phaser.GameObjects.Arc;
  knob: Phaser.GameObjects.Arc;
}

/**
 * Two floating virtual sticks for touch screens. A finger on the left half
 * of the screen moves the player; a finger on the right half shoots in the
 * nearest of the 4 directions. The sticks appear where the finger lands and
 * stay hidden until the first touch, so desktop players never see them.
 * Lives in the HUD scene, so all coordinates are screen pixels.
 *
 * The sticks follow the browser's own touch events, finger by finger, not
 * the game's pointers: walking into a new room rebuilds the play scene, and
 * on phones the game's pointer state could lose a finger that was still on
 * the glass, leaving the astronaut frozen until the finger was lifted. A
 * finger the browser still reports down always keeps driving its stick.
 */
export class TouchControls {
  /** True once any touch was seen; the scene then shows the sticks. */
  used = false;
  private move: Stick;
  private shoot: Stick;
  private radius: number;

  constructor(private scene: Phaser.Scene) {
    this.radius = Math.min(scene.scale.width, scene.scale.height) * RADIUS_SHARE;
    this.move = this.makeStick(0x39d0ff);
    this.shoot = this.makeStick(0x7cf7d4);

    const onStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) this.press(t);
      this.forgetLost(e);
    };
    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) this.drag(t);
      this.forgetLost(e);
    };
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) this.lift(t.identifier);
      this.forgetLost(e);
    };
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener('touchstart', onStart, opts);
    window.addEventListener('touchmove', onMove, opts);
    window.addEventListener('touchend', onEnd, opts);
    window.addEventListener('touchcancel', onEnd, opts);
    // While the page is hidden no "up" can arrive: start clean on return.
    const releaseAll = () => this.releaseAll();
    scene.game.events.on(Phaser.Core.Events.HIDDEN, releaseAll);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('touchstart', onStart, opts);
      window.removeEventListener('touchmove', onMove, opts);
      window.removeEventListener('touchend', onEnd, opts);
      window.removeEventListener('touchcancel', onEnd, opts);
      scene.game.events.off(Phaser.Core.Events.HIDDEN, releaseAll);
    });
  }

  /** Kept for the HUD's frame loop; the browser's touch events do all the work. */
  update(): void {}

  /** Lets go of both sticks (a fresh run, the pause screen). */
  releaseAll(): void {
    this.release(this.move);
    this.release(this.shoot);
  }

  /** Movement vector, length 0 to 1. */
  moveVector(): Vec2 {
    return this.move.value;
  }

  /** Shooting direction, or null while the right stick is idle. */
  shootDirection(): Dir4 | null {
    return stickToDir4(this.shoot.value.x, this.shoot.value.y);
  }

  private release(stick: Stick): void {
    stick.touchId = null;
    stick.value = { x: 0, y: 0 };
    stick.base.setVisible(false);
    stick.knob.setVisible(false);
  }

  private makeStick(color: number): Stick {
    const base = this.scene.add.circle(0, 0, this.radius, color, 0.12).setStrokeStyle(3, color, 0.5);
    const knob = this.scene.add.circle(0, 0, this.radius * 0.42, color, 0.45);
    for (const o of [base, knob]) o.setDepth(200).setScrollFactor(0).setVisible(false);
    return { touchId: null, origin: { x: 0, y: 0 }, value: { x: 0, y: 0 }, base, knob };
  }

  /** A browser touch in game (screen) pixels. */
  private point(t: Touch): Vec2 {
    const scale = this.scene.scale;
    return { x: scale.transformX(t.pageX), y: scale.transformY(t.pageY) };
  }

  private stickOf(id: number): Stick | null {
    if (this.move.touchId === id) return this.move;
    if (this.shoot.touchId === id) return this.shoot;
    return null;
  }

  private press(t: Touch): void {
    this.used = true;
    this.radius = Math.min(this.scene.scale.width, this.scene.scale.height) * RADIUS_SHARE;
    for (const s of [this.move, this.shoot]) {
      s.base.setRadius(this.radius);
      s.knob.setRadius(this.radius * 0.42);
    }
    const p = this.point(t);
    const stick = touchSide(p.x, this.scene.scale.width) === 'move' ? this.move : this.shoot;
    // A new finger on a side always takes it over, so a side can never stay locked.
    stick.touchId = t.identifier;
    stick.origin = p;
    stick.value = { x: 0, y: 0 };
    stick.base.setPosition(p.x, p.y).setVisible(true);
    stick.knob.setPosition(p.x, p.y).setVisible(true);
  }

  private drag(t: Touch): void {
    let stick = this.stickOf(t.identifier);
    if (!stick) {
      // A finger that was already down before the controls existed: pick it up if its side is free.
      const side = touchSide(this.point(t).x, this.scene.scale.width) === 'move' ? this.move : this.shoot;
      if (side.touchId !== null) return;
      this.press(t);
      stick = side;
    }
    const finger = this.point(t);
    stick.origin = followOrigin(stick.origin, finger, this.radius);
    stick.base.setPosition(stick.origin.x, stick.origin.y);
    stick.value = virtualStick(stick.origin, finger, this.radius);
    stick.knob.setPosition(stick.origin.x + stick.value.x * this.radius, stick.origin.y + stick.value.y * this.radius);
  }

  private lift(id: number): void {
    const stick = this.stickOf(id);
    if (stick) this.release(stick);
  }

  /** Releases any stick whose finger the browser no longer lists as touching. */
  private forgetLost(e: TouchEvent): void {
    const down = new Set(Array.from(e.touches).map((t) => t.identifier));
    for (const stick of [this.move, this.shoot]) {
      if (stick.touchId !== null && !down.has(stick.touchId)) this.release(stick);
    }
  }
}
