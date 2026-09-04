import type { BboxPlano } from "@/lib/huerto/plano";

export const ESRI_IMAGERY_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";
export const SAT_ZOOM = 18;
export const SAT_MAX_TILES_LADO = 4;

export type TileXYZ = { x: number; y: number; z: number };

export function lngLatATile(lng: number, lat: number, z: number): TileXYZ {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
    z,
  };
}

export function tileNorteOeste(x: number, y: number, z: number) {
  const n = 2 ** z;
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return { lng, lat: (latRad * 180) / Math.PI };
}

export function tilesParaBbox(bbox: BboxPlano, z = SAT_ZOOM): {
  tiles: TileXYZ[];
  cols: number;
  rows: number;
} {
  const nw = lngLatATile(bbox.minX, bbox.maxY, z);
  const se = lngLatATile(bbox.maxX, bbox.minY, z);
  let minX = Math.min(nw.x, se.x);
  let maxX = Math.max(nw.x, se.x);
  let minY = Math.min(nw.y, se.y);
  let maxY = Math.max(nw.y, se.y);
  // Cap para no descargar media comuna: recorta al centro si excede.
  if (maxX - minX + 1 > SAT_MAX_TILES_LADO) {
    const cx = Math.floor((minX + maxX) / 2);
    minX = cx - 1;
    maxX = cx + 1;
  }
  if (maxY - minY + 1 > SAT_MAX_TILES_LADO) {
    const cy = Math.floor((minY + maxY) / 2);
    minY = cy - 1;
    maxY = cy + 1;
  }
  const tiles: TileXYZ[] = [];
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) tiles.push({ x, y, z });
  return { tiles, cols: maxX - minX + 1, rows: maxY - minY + 1 };
}

export function urlTileEsri(t: TileXYZ): string {
  return `${ESRI_IMAGERY_URL}/${t.z}/${t.y}/${t.x}`;
}

export function uvDeLngLat(
  lng: number,
  lat: number,
  bbox: BboxPlano,
  mosaico: { oeste: number; norte: number; este: number; sur: number },
): { u: number; v: number } {
  const u = (lng - mosaico.oeste) / Math.max(mosaico.este - mosaico.oeste, 1e-12);
  const v = 1 - (mosaico.norte - lat) / Math.max(mosaico.norte - mosaico.sur, 1e-12);
  void bbox;
  return {
    u: Math.max(0, Math.min(1, u)),
    v: Math.max(0, Math.min(1, v)),
  };
}

export function mosaicoDeTiles(tiles: TileXYZ[]): {
  oeste: number;
  norte: number;
  este: number;
  sur: number;
} {
  const xs = tiles.map((t) => t.x);
  const ys = tiles.map((t) => t.y);
  const z = tiles[0]?.z ?? SAT_ZOOM;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const nw = tileNorteOeste(minX, minY, z);
  // esquina sur-este = borde este del último tile + borde sur
  const n = 2 ** z;
  const este = ((maxX + 1) / n) * 360 - 180;
  const surRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (maxY + 1)) / n)));
  const sur = (surRad * 180) / Math.PI;
  return { oeste: nw.lng, norte: nw.lat, este, sur };
}
