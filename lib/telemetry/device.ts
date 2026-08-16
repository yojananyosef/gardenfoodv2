import type { DeviceMetadata } from "@/types";

const DEVICE_ID_KEY = "gf_device_id";

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = uuid();
  window.localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
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