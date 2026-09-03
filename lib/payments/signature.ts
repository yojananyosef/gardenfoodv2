import { createHmac, timingSafeEqual } from "crypto";

export const WEBHOOK_TS_WINDOW_SECONDS = 600;

// Valida x-signature de Mercado Pago: `ts=<ts>,v1=<hmac>` con
// HMAC-SHA256 sobre `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`.
// Rechaza firmas con ts fuera de la ventana anti-replay.
export function verifyMercadoPagoSignature(
  xSignature: string,
  xRequestId: string,
  dataIdCandidates: string[],
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  let ts: string | null = null;
  let v1: string | null = null;
  for (const part of xSignature.split(/[,&]/)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  if (Math.abs(nowSeconds - tsNum) > WEBHOOK_TS_WINDOW_SECONDS) return false;

  const expected = Buffer.from(v1, "utf8");
  for (const candidate of dataIdCandidates) {
    const manifest = `id:${candidate};request-id:${xRequestId};ts:${ts};`;
    const hash = Buffer.from(
      createHmac("sha256", secret).update(manifest).digest("hex"),
      "utf8",
    );
    if (hash.length === expected.length && timingSafeEqual(hash, expected)) {
      return true;
    }
  }
  return false;
}
