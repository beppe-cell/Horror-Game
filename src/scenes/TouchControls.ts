import Phaser from 'phaser';
import { Dir4, Vec2, stickToDir4, touchSide, virtualStick } from '../rules/input';

/** Stick radius as a share of the shorter screen side. */
const RADIUS_SHARE = 0.11;

interface Stick {
  pointerId: number | null;
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
 */
export class TouchControls {
  /** True once any touch was seen; the scene then shows the sticks. */
  used = false;
  private move: Stick;
  private shoot: Stick;
  private radius: number;

  constructor(private scene: Phaser.Scene) {
    // Pointer 1 exists by default; one more allows moving and shooting at once.
    scene.input.addPointer(1);
    this.radius = Math.min(scene.scale.width, scene.scale.height) * RADIUS_SHARE;
    this.move = this.makeStick(0x39d0ff);
    this.shoot = this.makeStick(0x7cf7d4);

    const input = scene.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
      input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
      input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
      input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    });
  }

  /** Movement vector, length 0 to 1. */
  moveVector(): Vec2 {
    return this.move.value;
  }

  /** Shooting direction, or null while the right stick is idle. */
  shootDirection(): Dir4 | null {
    return stickToDir4(this.shoot.value.x, this.shoot.value.y);
  }

  private makeStick(color: number): Stick {
    const base = this.scene.add.circle(0, 0, this.radius, color, 0.12).setStrokeStyle(3, color, 0.5);
    const knob = this.scene.add.circle(0, 0, this.radius * 0.42, color, 0.45);
    for (const o of [base, knob]) o.setDepth(200).setScrollFactor(0).setVisible(false);
    return { pointerId: null, origin: { x: 0, y: 0 }, value: { x: 0, y: 0 }, base, knob };
  }

  private stickFor(pointer: Phaser.Input.Pointer): Stick | null {
    if (this.move.pointerId === pointer.id) return this.move;
    if (this.shoot.pointerId === pointer.id) return this.shoot;
    return null;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) return;
    this.used = true;
    this.radius = Math.min(this.scene.scale.width, this.scene.scale.height) * RADIUS_SHARE;
    for (const s of [this.move, this.shoot]) {
      s.base.setRadius(this.radius);
      s.knob.setRadius(this.radius * 0.42);
    }
    const stick = touchSide(pointer.x, this.scene.scale.width) === 'move' ? this.move : this.shoot;
    if (stick.pointerId !== null) return; // that side already has a finger
    stick.pointerId = pointer.id;
    stick.origin = { x: pointer.x, y: pointer.y };
    stick.value = { x: 0, y: 0 };
    stick.base.setPosition(pointer.x, pointer.y).setVisible(true);
    stick.knob.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    const stick = this.stickFor(pointer);
    if (!stick) return;
    stick.value = virtualStick(stick.origin, { x: pointer.x, y: pointer.y }, this.radius);
    stick.knob.setPosition(stick.origin.x + stick.value.x * this.radius, stick.origin.y + stick.value.y * this.radius);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    const stick = this.stickFor(pointer);
    if (!stick) return;
    stick.pointerId = null;
    stick.value = { x: 0, y: 0 };
    stick.base.setVisible(false);
    stick.knob.setVisible(false);
  }
}
