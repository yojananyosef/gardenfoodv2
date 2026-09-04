import {
  CENTRO_DEFAULT,
  type PuntoMapa,
  type TerrenoPolygonCoordinates,
  type TerrenoPosition,
} from "@/lib/huerto/terreno";

export const PLANO_MAX_ARBOLES = 200;
const ANCHO_VISTA = 100;
const ALTO_VISTA = 100;
const MARGEN_VISTA = 6;

export type PosicionPlano = { x: number; y: number };

function bboxDe(
  coordinates: TerrenoPolygonCoordinates,
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const anillo of coordinates) {
    for (const [lng, lat] of anillo) {
      if (lng < minX) minX = lng;
      if (lng > maxX) maxX = lng;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, maxX, minY, maxY };
}

function aRadianes(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function puntoEnPoligono(
  punto: PuntoMapa,
  anillo: TerrenoPosition[],
): boolean {
  let dentro = false;
  const { lng: x, lat: y } = punto;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    const cruza =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

export function proyectarADentro(
  punto: PuntoMapa,
  anillo: TerrenoPosition[],
): PuntoMapa {
  if (anillo.length < 2) return punto;
  const { lng: px, lat: py } = punto;
  let mejor: PuntoMapa = punto;
  let mejorD2 = Infinity;
  let mejorDx = 0;
  let mejorDy = 0;
  for (let i = 0; i < anillo.length; i++) {
    const [ax, ay] = anillo[i];
    const [bx, by] = anillo[(i + 1) % anillo.length];
    const dx = bx - ax;
    const dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / largo2));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    if (d2 < mejorD2) {
      mejorD2 = d2;
      mejor = { lng: cx, lat: cy };
      mejorDx = dx;
      mejorDy = dy;
    }
  }

  // Un punto exactamente sobre el borde es ambiguo para ray-casting:
  // se empuja una epsilon hacia el interior del lado más cercano.
  const EPS = 1e-10;
  const largo = Math.hypot(mejorDx, mejorDy);
  if (largo === 0) return mejor;
  const nx = mejorDy / largo;
  const ny = -mejorDx / largo;
  for (const s of [1, -1]) {
    const candidato: PuntoMapa = {
      lng: mejor.lng + s * nx * EPS,
      lat: mejor.lat + s * ny * EPS,
    };
    if (puntoEnPoligono(candidato, anillo)) return candidato;
  }
  return mejor;
}

export function disponerEnMatriz(
  cantidad: number,
  coordinates: TerrenoPolygonCoordinates,
  opciones: { ocupadas?: PosicionPlano[]; separacion?: number } = {},
): PosicionPlano[] {
  const { ocupadas = [], separacion = 0.04 } = opciones;
  const n = Math.max(0, Math.floor(cantidad) || 0);
  if (n === 0) return [];
  const bbox = bboxDe(coordinates);
  const centroFallback = { x: 0.5, y: 0.5 };
  if (!bbox) return Array.from({ length: n }, () => ({ ...centroFallback }));

  const dLng = bbox.maxX - bbox.minX;
  const dLat = bbox.maxY - bbox.minY;
  if (dLng <= 0 || dLat <= 0) {
    return Array.from({ length: n }, () => ({ ...centroFallback }));
  }

  const anillo = coordinates[0] ?? [];
  const latMedia = (bbox.minY + bbox.maxY) / 2;
  const cosLat = Math.max(Math.cos(aRadianes(latMedia)), 0.01);
  const aspecto = Math.max((dLng * cosLat) / dLat, 0.01);
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * aspecto))));
  const rows = Math.ceil(n / cols);

  const celdas: PosicionPlano[] = [];
  for (let fila = 0; fila < rows; fila++) {
    for (let col = 0; col < cols; col++) {
      let x = (col + 0.5) / cols;
      let y = (fila + 0.5) / rows;
      if (anillo.length >= 3) {
        const punto: PuntoMapa = {
          lng: bbox.minX + x * dLng,
          lat: bbox.minY + y * dLat,
        };
        if (!puntoEnPoligono(punto, anillo)) {
          const ajustado = proyectarADentro(punto, anillo);
          x = (ajustado.lng - bbox.minX) / dLng;
          y = (ajustado.lat - bbox.minY) / dLat;
        }
      }
      celdas.push({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      });
    }
  }

  const sep2 = separacion * separacion;
  const evitadas = ocupadas.map((o) => ({ x: o.x, y: o.y }));
  const colocadas: PosicionPlano[] = [];
  let cursor = 0;
  for (let i = 0; i < n; i++) {
    let elegida: PosicionPlano | null = null;
    for (let k = 0; k < celdas.length; k++) {
      const idx = (cursor + k) % celdas.length;
      const celda = celdas[idx];
      if (evitadas.every((o) => (celda.x - o.x) ** 2 + (celda.y - o.y) ** 2 >= sep2)) {
        elegida = celda;
        cursor = (idx + 1) % celdas.length;
        break;
      }
    }
    if (!elegida) {
      elegida = celdas[cursor % celdas.length];
      cursor = (cursor + 1) % celdas.length;
    }
    colocadas.push(elegida);
    evitadas.push(elegida);
  }
  return colocadas;
}

export function posDesdeLatLng(
  punto: PuntoMapa,
  coordinates: TerrenoPolygonCoordinates,
): PosicionPlano {
  const bbox = bboxDe(coordinates);
  if (!bbox) return { x: 0.5, y: 0.5 };
  const dLng = bbox.maxX - bbox.minX;
  const dLat = bbox.maxY - bbox.minY;
  if (dLng <= 0 || dLat <= 0) return { x: 0.5, y: 0.5 };
  return {
    x: Math.max(0, Math.min(1, (punto.lng - bbox.minX) / dLng)),
    y: Math.max(0, Math.min(1, (punto.lat - bbox.minY) / dLat)),
  };
}

export function latLngDesdePos(
  pos: PosicionPlano,
  coordinates: TerrenoPolygonCoordinates,
): PuntoMapa {
  const bbox = bboxDe(coordinates);
  if (!bbox) return { ...CENTRO_DEFAULT };
  const dLng = bbox.maxX - bbox.minX;
  const dLat = bbox.maxY - bbox.minY;
  return {
    lng: dLng <= 0 ? bbox.minX : bbox.minX + pos.x * dLng,
    lat: dLat <= 0 ? bbox.minY : bbox.minY + pos.y * dLat,
  };
}

export type VistaPlano = {
  path: string;
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
};

function crearProyeccion(
  bbox: { minX: number; maxX: number; minY: number; maxY: number },
  w: number,
  h: number,
  padding: number,
) {
  const dLng = bbox.maxX - bbox.minX;
  const dLat = bbox.maxY - bbox.minY;
  return {
    px: (lng: number) =>
      dLng <= 0 ? w / 2 : padding + ((lng - bbox.minX) / dLng) * (w - 2 * padding),
    py: (lat: number) =>
      dLat <= 0 ? h / 2 : h - padding - ((lat - bbox.minY) / dLat) * (h - 2 * padding),
  };
}

export function crearVistaPlano(
  coordinates: TerrenoPolygonCoordinates,
  w = ANCHO_VISTA,
  h = ALTO_VISTA,
  padding = MARGEN_VISTA,
): VistaPlano {
  const bbox = bboxDe(coordinates) ?? {
    minX: CENTRO_DEFAULT.lng,
    maxX: CENTRO_DEFAULT.lng,
    minY: CENTRO_DEFAULT.lat,
    maxY: CENTRO_DEFAULT.lat,
  };
  const { px, py } = crearProyeccion(bbox, w, h, padding);
  const path = coordinates
    .map((anillo) =>
      anillo.length === 0
        ? ""
        : `M${anillo
            .map(([lng, lat]) => `${px(lng).toFixed(2)} ${py(lat).toFixed(2)}`)
            .join(" L")} Z`,
    )
    .filter(Boolean)
    .join(" ");
  return { path, bbox };
}

export function posAVista(
  pos: PosicionPlano,
  vista: VistaPlano,
  w = ANCHO_VISTA,
  h = ALTO_VISTA,
  padding = MARGEN_VISTA,
): { x: number; y: number } {
  const { px, py } = crearProyeccion(vista.bbox, w, h, padding);
  const dLng = vista.bbox.maxX - vista.bbox.minX;
  const dLat = vista.bbox.maxY - vista.bbox.minY;
  const lng = dLng <= 0 ? vista.bbox.minX : vista.bbox.minX + pos.x * dLng;
  const lat = dLat <= 0 ? vista.bbox.minY : vista.bbox.minY + pos.y * dLat;
  return { x: px(lng), y: py(lat) };
}

export function colorDeEspecie(especie: string): string {
  let hash = 0;
  for (const ch of especie) {
    hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  }
  return `hsl(${hash % 360} 55% 42%)`;
}

export type FilaArbol = {
  especie: string;
  cantidad: number;
  fecha_plantacion?: string | null;
  observaciones?: string | null;
};

export type UnidadArbol = {
  especie: string;
  fecha_plantacion: string | null;
  observaciones: string | null;
};

export function expandirUnidades(filas: FilaArbol[]): UnidadArbol[] {
  return filas.flatMap((fila) => {
    const n = Math.max(1, Math.floor(fila.cantidad) || 1);
    return Array.from({ length: n }, () => ({
      especie: fila.especie,
      fecha_plantacion: fila.fecha_plantacion ?? null,
      observaciones: fila.observaciones ?? null,
    }));
  });
}
