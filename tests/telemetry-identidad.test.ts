import { describe, expect, it } from "vitest";
import { huellaDispositivo, HUELLA_SAL } from "@/lib/telemetry/huella";
import {
  extraerCookieDeviceId,
  resolverDeviceIdServidor,
} from "@/lib/telemetry/resolucion";

describe("huellaDispositivo", () => {
  const base = {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
    pantalla: "390x844x2",
    idioma: "es-CL",
    zonaHoraria: "America/Santiago",
  };

  it("es determinista para las mismas partes", () => {
    expect(huellaDispositivo(base)).toBe(huellaDispositivo({ ...base }));
  });

  it("cambia si cambia cualquier parte", () => {
    expect(huellaDispositivo({ ...base, userAgent: base.userAgent + "x" })).not.toBe(
      huellaDispositivo(base),
    );
    expect(huellaDispositivo({ ...base, pantalla: "393x852x3" })).not.toBe(huellaDispositivo(base));
    expect(huellaDispositivo({ ...base, idioma: "en" })).not.toBe(huellaDispositivo(base));
    expect(huellaDispositivo({ ...base, zonaHoraria: "UTC" })).not.toBe(huellaDispositivo(base));
  });

  it("devuelve hex de 16 caracteres", () => {
    const huella = huellaDispositivo(base);
    expect(huella).toMatch(/^[0-9a-f]{16}$/);
  });

  it("la sal forma parte de la base", () => {
    expect(HUELLA_SAL).toBe("gf-v1");
  });
});

describe("resolverDeviceIdServidor", () => {
  it("prioriza el deviceId del evento sin emitir cookie", () => {
    const r = resolverDeviceIdServidor({
      deviceIdEvento: "abc-local",
      cookieDid: "did_cookie",
      nuevoId: "did_nuevo",
      secure: true,
    });
    expect(r).toEqual({ deviceId: "abc-local", setCookie: null });
  });

  it("usa la cookie cuando el evento no trae deviceId", () => {
    const r = resolverDeviceIdServidor({
      deviceIdEvento: null,
      cookieDid: "did_cookie",
      nuevoId: "did_nuevo",
      secure: false,
    });
    expect(r.deviceId).toBe("did_cookie");
    expect(r.setCookie).toBeNull();
  });

  it("genera y devuelve Set-Cookie cuando no hay nada", () => {
    const r = resolverDeviceIdServidor({
      nuevoId: "did_nuevo",
      secure: true,
    });
    expect(r.deviceId).toBe("did_nuevo");
    expect(r.setCookie).toContain("gf_did=did_nuevo");
    expect(r.setCookie).toContain("HttpOnly");
    expect(r.setCookie).toContain("SameSite=Lax");
    expect(r.setCookie).toContain("Secure");
    expect(r.setCookie).toContain("Max-Age=");
  });

  it("no agrega Secure en http", () => {
    const r = resolverDeviceIdServidor({ nuevoId: "x", secure: false });
    expect(r.setCookie).not.toContain("Secure;");
    expect(r.setCookie?.endsWith("; HttpOnly")).toBe(true);
  });
});

describe("extraerCookieDeviceId", () => {
  it("extrae gf_did de un header de cookies", () => {
    expect(extraerCookieDeviceId("sb-auth=xyz; gf_did=did_123; other=1")).toBe("did_123");
    expect(extraerCookieDeviceId("gf_did=primero; sb=2")).toBe("primero");
  });

  it("devuelve null sin cookie o header vacío", () => {
    expect(extraerCookieDeviceId(null)).toBeNull();
    expect(extraerCookieDeviceId("sb-auth=xyz")).toBeNull();
  });
});
