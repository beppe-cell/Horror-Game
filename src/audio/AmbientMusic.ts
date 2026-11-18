/**
 * Endless dark ambient soundtrack, synthesised live with the Web Audio API:
 * no files to download and no loop seam. Layers, all at a steady level:
 *
 * - drones: detuned low saw waves through a dark filter that opens and
 *   closes very slowly;
 * - a sub pulse: a deep sine that swells gently, like a distant machine;
 * - hums: band-passed noise, a low mechanical hum and a faint airy hiss;
 * - resonances: now and then, metal groaning (noise through a narrow,
 *   sliding filter);
 * - alien sounds: rare soft bell tones from a minor scale, through a long
 *   echo and a big reverb;
 * - ticks: very quiet clicks every couple of seconds, a subtle rhythm.
 *
 * If `public/audio/soundtrack.mp3` exists (a track made elsewhere, for
 * example with Suno), it plays instead, looped without a gap.
 *
 * Browsers only allow sound after a user gesture, so `start()` is called on
 * the first tap or key press.
 */
const VOLUME = 0.55;
/** Recorded soundtrack, used when present; relative to the page. */
const TRACK_URL = 'audio/soundtrack.mp3';

/** Notes for the alien tones (A minor, high register), in Hz. */
const BELL_NOTES = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];

export class AmbientMusic {
  private ctx?: AudioContext;
  private master?: GainNode;
  private muted = false;
  private timers: number[] = [];

  constructor() {
    try {
      this.muted = localStorage.getItem('deepcore-music') === 'off';
    } catch {
      // Storage may be blocked: music stays on.
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Starts the soundtrack (safe to call more than once). */
  start(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;
    // Fade in over a few seconds, never a sudden start.
    master.gain.linearRampToValueAtTime(this.muted ? 0 : VOLUME, ctx.currentTime + 5);

    // Use the recorded track if there is one; otherwise synthesise.
    void this.loadTrack(ctx, master).then((ok) => {
      if (!ok) this.synth(ctx, master);
    });

    // Pause with the page, resume when it comes back.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });
  }

  /** Plays the recorded soundtrack in a gapless loop; false if there is none. */
  private async loadTrack(ctx: AudioContext, out: AudioNode): Promise<boolean> {
    try {
      const res = await fetch(TRACK_URL);
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('audio')) return false;
      const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = 1.4;
      src.connect(g).connect(out);
      src.start();
      return true;
    } catch {
      return false;
    }
  }

  private synth(ctx: AudioContext, master: AudioNode): void {
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 5, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverb.connect(wet).connect(master);

    this.drones(ctx, master, reverb);
    this.subPulse(ctx, master);
    this.hums(ctx, master, reverb);
    this.scheduleBells(ctx, reverb, master);
    this.scheduleGroans(ctx, reverb);
    this.scheduleTicks(ctx, master, reverb);
  }

  /** Turns the music on or off, with a short fade; remembered for next time. */
  toggle(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('deepcore-music', this.muted ? 'off' : 'on');
    } catch {
      // Not remembered, still toggled.
    }
    if (this.ctx && this.master) {
      const g = this.master.gain;
      g.cancelScheduledValues(this.ctx.currentTime);
      g.setValueAtTime(g.value, this.ctx.currentTime);
      g.linearRampToValueAtTime(this.muted ? 0 : VOLUME, this.ctx.currentTime + 0.8);
    }
    return this.muted;
  }

  private drones(ctx: AudioContext, out: AudioNode, reverb: AudioNode): void {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.value = 0.07;
    filter.connect(gain);
    gain.connect(out);
    gain.connect(reverb);
    // A1 and E2, each as two detuned saws that beat slowly against each other.
    for (const [freq, detune] of [[55, -7], [55, 6], [82.41, -4], [82.41, 9], [110, 3]]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start();
    }
    // The filter breathes over about half a minute.
    lfo(ctx, 0.033, 180, filter.frequency);
    lfo(ctx, 0.011, 90, filter.frequency);
  }

  private subPulse(ctx: AudioContext, out: AudioNode): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 41.2;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    osc.connect(gain).connect(out);
    osc.start();
    // A slow swell, roughly every four seconds.
    lfo(ctx, 0.24, 0.07, gain.gain);
  }

  private hums(ctx: AudioContext, out: AudioNode, reverb: AudioNode): void {
    const noise = noiseSource(ctx);
    // Low mechanical hum.
    const hum = ctx.createBiquadFilter();
    hum.type = 'bandpass';
    hum.frequency.value = 118;
    hum.Q.value = 9;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.22;
    noise.connect(hum).connect(humGain).connect(out);
    // Faint air in the vents, drifting in and out.
    const air = ctx.createBiquadFilter();
    air.type = 'bandpass';
    air.frequency.value = 2600;
    air.Q.value = 0.8;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.012;
    noise.connect(air).connect(airGain);
    airGain.connect(out);
    airGain.connect(reverb);
    lfo(ctx, 0.05, 0.008, airGain.gain);
    lfo(ctx, 0.02, 900, air.frequency);
  }

  /** Rare soft bell tones with a long echo: the facility's alien voices. */
  private scheduleBells(ctx: AudioContext, reverb: AudioNode, out: AudioNode): void {
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.72;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.45;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1800;
    delay.connect(feedback).connect(tone).connect(delay);
    delay.connect(reverb);
    const ring = () => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = Math.random() < 0.5 ? 'sine' : 'triangle';
      osc.frequency.value = BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)];
      // A tiny pitch drift makes them sound less like an instrument.
      osc.detune.setValueAtTime(0, t);
      osc.detune.linearRampToValueAtTime((Math.random() - 0.5) * 60, t + 3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
      osc.connect(g);
      g.connect(delay);
      g.connect(reverb);
      g.connect(out);
      osc.start(t);
      osc.stop(t + 3.6);
      this.later(ring, 6 + Math.random() * 9);
    };
    this.later(ring, 4);
  }

  /** Now and then, metal groaning somewhere in the structure. */
  private scheduleGroans(ctx: AudioContext, reverb: AudioNode): void {
    const groan = () => {
      const t = ctx.currentTime;
      const dur = 2.5 + Math.random() * 2;
      const src = noiseSource(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 28;
      const from = 180 + Math.random() * 300;
      bp.frequency.setValueAtTime(from, t);
      bp.frequency.exponentialRampToValueAtTime(from * (0.6 + Math.random() * 0.8), t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0, t + dur);
      src.connect(bp).connect(g).connect(reverb);
      src.stop(t + dur + 0.1);
      this.later(groan, 14 + Math.random() * 18);
    };
    this.later(groan, 10);
  }

  /** Very quiet clicks every couple of seconds: a subtle, steady rhythm. */
  private scheduleTicks(ctx: AudioContext, out: AudioNode, reverb: AudioNode): void {
    const click = ctx.createBiquadFilter();
    click.type = 'highpass';
    click.frequency.value = 3000;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    click.connect(g);
    g.connect(out);
    g.connect(reverb);
    const tick = () => {
      const t = ctx.currentTime;
      const src = noiseSource(ctx, 0.03);
      const env = ctx.createGain();
      env.gain.setValueAtTime(Math.random() < 0.25 ? 0.5 : 1, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      src.connect(env).connect(click);
      src.stop(t + 0.05);
      this.later(tick, 2.1);
    };
    this.later(tick, 2);
  }

  private later(fn: () => void, seconds: number): void {
    this.timers.push(window.setTimeout(fn, seconds * 1000));
  }
}

/** A slow sine that moves `param` by ±depth around its value. */
function lfo(ctx: AudioContext, rate: number, depth: number, param: AudioParam): void {
  const osc = ctx.createOscillator();
  osc.frequency.value = rate;
  const g = ctx.createGain();
  g.gain.value = depth;
  osc.connect(g).connect(param);
  osc.start();
}

/** White noise, looping (or a short burst of `seconds`). */
function noiseSource(ctx: AudioContext, seconds = 4): AudioBufferSourceNode {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = seconds >= 1;
  src.start();
  return src;
}

/** Stereo reverb tail: decaying noise, `seconds` long. */
function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}
