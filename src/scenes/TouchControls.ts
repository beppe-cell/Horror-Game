import Phaser from 'phaser';
import { Dir4, Vec2, stickToDir4, touchSide, virtualStick } from '../rules/input';

/** Stick radius in game pixels (the game is 1920×1080, scaled to the screen). */
const RADIUS = 130;

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
 */
export class TouchControls {
  /** True once any touch was seen; the scene then shows the sticks. */
  used = false;
  private move: Stick;
  private shoot: Stick;

  constructor(private scene: Phaser.Scene) {
    // Pointer 1 exists by default; one more allows moving and shooting at once.
    scene.input.addPointer(1);
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
    const base = this.scene.add.circle(0, 0, RADIUS, color, 0.12).setStrokeStyle(4, color, 0.5);
    const knob = this.scene.add.circle(0, 0, RADIUS * 0.42, color, 0.45);
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
    stick.value = virtualStick(stick.origin, { x: pointer.x, y: pointer.y }, RADIUS);
    stick.knob.setPosition(stick.origin.x + stick.value.x * RADIUS, stick.origin.y + stick.value.y * RADIUS);
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
