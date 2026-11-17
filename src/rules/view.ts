/**
 * Camera framing for any screen shape. Landscape shows the whole room and
 * fills the spare space with cave rock; portrait zooms in on the player and
 * follows them, showing the full room height.
 */
export interface ViewFrame {
  orientation: 'landscape' | 'portrait';
  zoom: number;
  follow: boolean;
}

/** Tiles visible across the screen in portrait. */
export const PORTRAIT_TILES_ACROSS = 8.5;

export function frameView(screenW: number, screenH: number, roomW: number, roomH: number, tile: number): ViewFrame {
  if (screenH > screenW) {
    const zoom = Math.min(screenW / (PORTRAIT_TILES_ACROSS * tile), screenH / roomH);
    return { orientation: 'portrait', zoom, follow: true };
  }
  return { orientation: 'landscape', zoom: Math.min(screenW / roomW, screenH / roomH), follow: false };
}

export type Quality = 'high' | 'low';

/**
 * Effects level. Desktops get everything; phones and tablets start on low.
 * `?quality=high` or `?quality=low` in the URL always wins.
 */
export function pickQuality(opts: { desktop: boolean; override?: string | null }): Quality {
  if (opts.override === 'high' || opts.override === 'low') return opts.override;
  return opts.desktop ? 'high' : 'low';
}
