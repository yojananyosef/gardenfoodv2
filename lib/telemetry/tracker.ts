import type { DeviceMetadata, GeoContext, TelemetryEvent } from "@/types";
import { getDeviceMetadata, resolverDeviceIdLocal } from "@/lib/telemetry/device";
import { telemetriaPermitida } from "@/lib/consent/token";
import { withGeo } from "@/lib/telemetry/geo";

const ENDPOINT = "/api/v1/telemetry";
const FLUSH_INTERVAL_MS = 10_000;
const SESSION_KEY = "gf_session_id";

let buffer: TelemetryEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let sessionId: string | null = null;
let currentGeo: GeoContext | null = null;

function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof sessionStorage !== "undefined") {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      sessionId = existing;
      return existing;
    }
  }
  const created = createSessionId();
  sessionId = created;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(SESSION_KEY, created);
    } catch {
      // storage unavailable: id lives for this session only
    }
  }
  return created;
}

export function setTrackedGeo(geo: GeoContext | null): void {
  currentGeo = geo;
}

export type TrackEventInput = Omit<
  TelemetryEvent,
  "sessionId" | "deviceId" | "clientTimestamp" | "deviceMetadata"
>;

export function trackEvent(input: TrackEventInput): void {
  // Interés legítimo (LPDP art. 13): corre salvo oposición explícita del titular.
  if (!telemetriaPermitida()) return;
  const deviceMetadata: DeviceMetadata = getDeviceMetadata();
  // Escalera de identidad: sin id durable el cliente OMITE el deviceId y el
  // servidor lo resuelve (cookie first-party → nuevo). Evita ids desechables
  // contaminando las audiencias por dispositivo.
  const { deviceId } = resolverDeviceIdLocal();
  const event: TelemetryEvent = withGeo(
    {
      sessionId: getSessionId(),
      deviceId: deviceId ?? undefined,
      category: input.category,
      name: input.name,
      especieId: input.especieId ?? null,
      dwellTimeMs: input.dwellTimeMs ?? null,
      scrollDepthPercent: input.scrollDepthPercent ?? null,
      adUnitId: input.adUnitId ?? null,
      adPartnerId: input.adPartnerId ?? null,
      payload: input.payload,
      deviceMetadata,
      clientTimestamp: new Date().toISOString(),
    },
    input.geo ?? currentGeo,
  );
  buffer.push(event);
  ensureTimer();
}

export function trackCommerceIntent(
  payload: Record<string, unknown>,
  opts?: { name?: string; especieId?: string },
): void {
  trackEvent({
    category: "COMMERCE_INTENT",
    name: opts?.name ?? "INPUT_QUOTE",
    especieId: opts?.especieId,
    payload,
  });
}

function ensureTimer(): void {
  if (timer !== null) return;
  timer = setInterval(flush, FLUSH_INTERVAL_MS);
}

export function flush(): void {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  const body = JSON.stringify({ events: batch });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      ENDPOINT,
      new Blob([body], { type: "application/json" }),
    );
    if (!sent) {
      void sendKeepalive(body);
    }
    return;
  }
  void sendKeepalive(body);
}

async function sendKeepalive(body: string): Promise<void> {
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // fire-and-forget: never surface ingestion errors to the user
  }
}


if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}