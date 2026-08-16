import type { GeoContext, TelemetryEvent } from "@/types";
import { getConsentPurpose } from "@/lib/consent/token";

const GPS_CACHE_KEY = "gf_gps_cache";
const GPS_MAX_AGE_MS = 5 * 60 * 1000;

interface CachedPosition {
  lat: number;
  lng: number;
  accuracy: number;
  at: number;
}

export interface DeclaredLocation {
  comuna?: string | null;
  region?: string | null;
  zonaAgroclimatica?: string | null;
}

export async function getGeoContext(
  declared?: DeclaredLocation | null,
): Promise<GeoContext> {
  const context: GeoContext = {
    comuna: declared?.comuna ?? null,
    region: declared?.region ?? null,
    zonaAgroclimatica: declared?.zonaAgroclimatica ?? null,
    gpsLat: null,
    gpsLng: null,
    gpsAccuracyMeters: null,
  };

  if (!getConsentPurpose("preciseGeo")) {
    return context;
  }

  const position = getCachedPosition() ?? (await requestPosition());
  if (position) {
    context.gpsLat = position.lat;
    context.gpsLng = position.lng;
    context.gpsAccuracyMeters = position.accuracy;
  }
  return context;
}

function getCachedPosition(): CachedPosition | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(GPS_CACHE_KEY);
  if (!raw) return null;
  try {
    const cached = JSON.parse(raw) as CachedPosition;
    if (Date.now() - cached.at < GPS_MAX_AGE_MS) return cached;
  } catch {
    // corrupted cache: ignore
  }
  return null;
}

function cachePosition(position: CachedPosition): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GPS_CACHE_KEY, JSON.stringify(position));
  } catch {
    // storage unavailable: GPS still returned for this session
  }
}

function requestPosition(): Promise<CachedPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const cached: CachedPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          at: Date.now(),
        };
        cachePosition(cached);
        resolve(cached);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  });
}

export function withGeo(base: TelemetryEvent, geo: GeoContext | null | undefined): TelemetryEvent {
  if (!geo) return base;
  return {
    ...base,
    geo: {
      comuna: geo.comuna ?? null,
      region: geo.region ?? null,
      zonaAgroclimatica: geo.zonaAgroclimatica ?? null,
      gpsLat: geo.gpsLat ?? null,
      gpsLng: geo.gpsLng ?? null,
      gpsAccuracyMeters: geo.gpsAccuracyMeters ?? null,
    },
  };
}