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

/**
 * Wall margin shown around the room interior in landscape, in tiles. With a
 * 13×7 room this makes the interior about 70% of the screen width and two
 * thirds of its height on 16:9, the classic proportions of room-based
 * twin-stick games, with the character about an eighth of the screen tall.
 */
export const VIEW_MARGIN_TILES = 1.75;

/**
 * @param interiorW room interior width in world pixels (no walls)
 * @param interiorH room interior height in world pixels
 */
export function frameView(
  screenW: number,
  screenH: number,
  interiorW: number,
  interiorH: number,
  tile: number,
): ViewFrame {
  const viewW = interiorW + 2 * VIEW_MARGIN_TILES * tile;
  const viewH = interiorH + 2 * VIEW_MARGIN_TILES * tile;
  if (screenH > screenW) {
    const zoom = Math.min(screenW / (PORTRAIT_TILES_ACROSS * tile), screenH / viewH);
    return { orientation: 'portrait', zoom, follow: true };
  }
  return { orientation: 'landscape', zoom: Math.min(screenW / viewW, screenH / viewH), follow: false };
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
