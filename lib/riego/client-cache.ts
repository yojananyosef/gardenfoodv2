"use client";

import { getRiegoBase, type RiegoBasePayload } from "./actions";

/**
 * Memo de sesión para la base de riego: la primera ficha/diálogo del día
 * hace el roundtrip al server action (que a su vez lee de unstable_cache),
 * el resto se sirve de memoria sin tocar la red. Dedup de peticiones en
 * vuelo: 3 componentes pidiendo la misma especie a la vez = 1 request.
 * El dato es de referencia casi estático; un deploy nuevo limpia la memoria.
 */
const porEspecie = new Map<string, Promise<RiegoBasePayload | null>>();

export function obtenerRiegoBase(dbKey: string): Promise<RiegoBasePayload | null> {
  const cached = porEspecie.get(dbKey);
  if (cached) return cached;
  const pedido = getRiegoBase(dbKey).catch(() => null);
  porEspecie.set(dbKey, pedido);
  // Si falla, no se deja el null cacheado para siempre: se reintenta next.
  pedido.then((b) => {
    if (!b) porEspecie.delete(dbKey);
  });
  return pedido;
}
