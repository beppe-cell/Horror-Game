/**
 * Camera shake from decaying trauma, plus short directional kicks.
 * Shake = trauma², so light events barely move the view and heavy ones punch.
 * Offsets come from summed sines at unrelated rates, never per-frame random
 * noise, so the camera sways instead of buzzing. Pure: the scene applies
 * the returned offset to the camera (visual only, never to bodies).
 */
export interface ShakeOptions {
  /** Trauma lost per second. */
  decay: number;
  /** Largest offset at full trauma, in world pixels. */
  maxOffset: number;
  /** Player setting, 0 (off) to 1 (full). */
  strength: number;
}

export class CameraShake {
  private trauma = 0;
  private t = 0;
  private kickX = 0;
  private kickY = 0;

  constructor(private opts: ShakeOptions) {}

  /** Adds trauma (0..1); hits stack up to 1, they never reset it. */
  add(amount: number): void {
    this.trauma = Math.min(1, Math.max(0, this.trauma + amount));
  }

  /** A short shove of the view, e.g. recoil opposite to a shot. In pixels. */
  kick(x: number, y: number): void {
    this.kickX += x;
    this.kickY += y;
  }

  get level(): number {
    return this.trauma;
  }

  /** Advances by `dt` seconds and returns the offset to apply this frame. */
  update(dt: number): { x: number; y: number } {
    this.trauma = Math.max(0, this.trauma - this.opts.decay * dt);
    this.t += dt * 30;
    // Kicks spring back fast (about 80 ms to near zero).
    const k = Math.exp(-dt * 40);
    this.kickX *= k;
    this.kickY *= k;
    if (Math.abs(this.kickX) < 0.01) this.kickX = 0;
    if (Math.abs(this.kickY) < 0.01) this.kickY = 0;
    const s = this.trauma * this.trauma * this.opts.strength * this.opts.maxOffset;
    return {
      x: s * Math.sin(this.t * 1.7) + this.kickX * this.opts.strength,
      y: s * Math.sin(this.t * 2.3) + this.kickY * this.opts.strength,
    };
  }
}
