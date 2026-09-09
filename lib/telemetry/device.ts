import type { DeviceMetadata } from "@/types";
import { getConsentPurpose } from "@/lib/consent/token";
import { huellaDispositivo } from "@/lib/telemetry/huella";

const DEVICE_ID_KEY = "gf_device_id";
const EFIMERO_KEY = "gf_device_efimero";

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type FuenteDeviceId = "almacenamiento" | "huella" | "efimero";

export interface DeviceIdResuelto {
  deviceId: string | null;
  fuente: FuenteDeviceId | null;
}

let efimeroMemoria: string | null = null;

function idEfimero(): string {
  if (efimeroMemoria) return efimeroMemoria;
  const creado = uuid();
  efimeroMemoria = creado;
  try {
    window.sessionStorage.setItem(EFIMERO_KEY, creado);
  } catch {
    // storage bloqueado: vive solo en memoria durante la sesión
  }
  return creado;
}

/**
 * Escalera de identidad del cliente (LPDP): almacenamiento local → huella
 * determinista solo con `deviceLinking` consentido → null (efímero: el cliente
 * omite el id y el servidor lo resuelve con cookie propia).
 */
export function resolverDeviceIdLocal(): DeviceIdResuelto {
  if (typeof window === "undefined") return { deviceId: null, fuente: null };
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return { deviceId: existing, fuente: "almacenamiento" };
    const creado = uuid();
    window.localStorage.setItem(DEVICE_ID_KEY, creado);
    return { deviceId: creado, fuente: "almacenamiento" };
  } catch {
    // localStorage bloqueado (modo privado/Brave): escalar
  }
  if (getConsentPurpose("deviceLinking")) {
    const partes = partesHuellaDesdeNavegador();
    return { deviceId: huellaDispositivo(partes), fuente: "huella" };
  }
  return { deviceId: null, fuente: null };
}

/**
 * Compatibilidad para quien exige un string (CMP, ads): resuelve la escalera y
 * cae a un id efímero de sesión si no hay identidad durable.
 */
export function getDeviceId(): string {
  const resuelto = resolverDeviceIdLocal();
  if (resuelto.deviceId) return resuelto.deviceId;
  return idEfimero();
}

function partesHuellaDesdeNavegador() {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return {
    userAgent: nav.userAgent ?? "",
    pantalla:
      typeof window !== "undefined"
        ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
        : "",
    idioma: nav.language ?? "",
    zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  };
}

export function getDeviceMetadata(): DeviceMetadata {
  if (typeof navigator === "undefined") {
    return {
      os: "unknown",
      browser: "unknown",
      screenResolution: "unknown",
      connectionType: "unknown",
    };
  }
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string };
    userAgentData?: { platform?: string };
  };
  return {
    os: detectOs(ua),
    browser: detectBrowser(ua),
    screenResolution:
      typeof window !== "undefined"
        ? `${window.screen.width}x${window.screen.height}`
        : "unknown",
    connectionType: nav.connection?.effectiveType ?? "unknown",
    manufacturer: nav.userAgentData?.platform,
  };
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

function detectOs(ua: string): string {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}
