export const DEVICE_COOKIE_NAME = "gf_did";
export const DEVICE_COOKIE_MAX_AGE_S = 390 * 24 * 60 * 60; // 390 días

export interface ResolucionDeviceId {
  deviceId: string;
  setCookie: string | null;
}

export interface EntradasResolucion {
  deviceIdEvento?: string | null;
  cookieDid?: string | null;
  nuevoId: string;
  secure: boolean;
}

/**
 * Escalera server-side de identidad: deviceId del evento → cookie first-party
 * `gf_did` → generar nuevo (y devolverlo como Set-Cookie para continuidad).
 */
export function resolverDeviceIdServidor(entradas: EntradasResolucion): ResolucionDeviceId {
  if (entradas.deviceIdEvento) {
    return { deviceId: entradas.deviceIdEvento, setCookie: null };
  }
  if (entradas.cookieDid) {
    return { deviceId: entradas.cookieDid, setCookie: null };
  }
  const cookie = [
    `${DEVICE_COOKIE_NAME}=${entradas.nuevoId}`,
    `Max-Age=${DEVICE_COOKIE_MAX_AGE_S}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (entradas.secure) cookie.push("Secure");
  return { deviceId: entradas.nuevoId, setCookie: `${cookie.join("; ")}; HttpOnly` };
}

export function extraerCookieDeviceId(headerCookie: string | null): string | null {
  if (!headerCookie) return null;
  const match = headerCookie.match(/(?:^|;\s*)gf_did=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
