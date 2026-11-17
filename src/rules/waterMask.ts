/**
 * Smooth water mask for the shader: the room cells upsampled `scale` times
 * and blurred, so shorelines are organic curves instead of tile steps.
 * Values: 1 deep inside water, 0 on dry floor, about 0.5 on the shore.
 */
export function waterMask(water: boolean[][], scale: number, radius: number): { data: Float32Array; width: number; height: number } {
  const rows = water.length;
  const cols = water[0]?.length ?? 0;
  const width = cols * scale;
  const height = rows * scale;
  let a: Float32Array = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) a[y * width + x] = water[Math.floor(y / scale)][Math.floor(x / scale)] ? 1 : 0;
  }
  // Two passes of a separable box blur approximate a gaussian.
  for (let pass = 0; pass < 2; pass++) {
    a = boxBlur(a, width, height, radius, true);
    a = boxBlur(a, width, height, radius, false);
  }
  return { data: a, width, height };
}

function boxBlur(src: Float32Array, w: number, h: number, r: number, horizontal: boolean): Float32Array {
  const out = new Float32Array(src.length);
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  for (let line = 0; line < lines; line++) {
    for (let i = 0; i < len; i++) {
      let sum = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const j = Math.min(len - 1, Math.max(0, i + k)); // clamp: water at the wall stays water
        sum += horizontal ? src[line * w + j] : src[j * w + line];
        n++;
      }
      if (horizontal) out[line * w + i] = sum / n;
      else out[i * w + line] = sum / n;
    }
  }
  return out;
}
