const DEFAULT_DESTINO = "/huerto";

/**
 * Valida un destino de redirección interno (`next`) para evitar open redirects.
 * Solo acepta rutas relativas internas: empiezan por "/" (no "//"), sin backslash
 * y sin controlar esquemas ("http:", "javascript:").
 */
export function nextSeguro(raw: string | null | undefined, fallback: string = DEFAULT_DESTINO): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (raw.startsWith("/\\") || raw.startsWith("/ ")) return fallback;
  return raw;
}
