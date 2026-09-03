import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  WEBHOOK_TS_WINDOW_SECONDS,
  verifyMercadoPagoSignature,
} from "@/lib/payments/signature";
import { mapPreapprovalStatus } from "@/lib/payments/preapproval";

const SECRET = "test-secret-mp";

function firmar(dataId: string, requestId: string, ts: number): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("verifyMercadoPagoSignature", () => {
  const now = 1_700_000_000;

  it("acepta firma válida", () => {
    const sig = firmar("12345", "req-1", now);
    expect(verifyMercadoPagoSignature(sig, "req-1", ["12345"], SECRET, now)).toBe(
      true,
    );
  });

  it("acepta cualquier candidato de data.id", () => {
    const sig = firmar("abc", "req-2", now);
    expect(
      verifyMercadoPagoSignature(sig, "req-2", ["xxx", "abc"], SECRET, now),
    ).toBe(true);
  });

  it("rechaza firma tamperada", () => {
    const sig = firmar("12345", "req-3", now);
    expect(
      verifyMercadoPagoSignature(sig, "req-3", ["otro-id"], SECRET, now),
    ).toBe(false);
  });

  it("rechaza secret distinto", () => {
    const sig = firmar("12345", "req-4", now);
    expect(
      verifyMercadoPagoSignature(sig, "req-4", ["12345"], "otro-secret", now),
    ).toBe(false);
  });

  it("rechaza sin ts o sin v1", () => {
    expect(
      verifyMercadoPagoSignature("v1=abc", "req-5", ["12345"], SECRET, now),
    ).toBe(false);
    expect(
      verifyMercadoPagoSignature(`ts=${now}`, "req-5", ["12345"], SECRET, now),
    ).toBe(false);
  });

  it("rechaza ts fuera de la ventana anti-replay", () => {
    const fresco = firmar("12345", "req-6", now);
    expect(
      verifyMercadoPagoSignature(
        fresco,
        "req-6",
        ["12345"],
        SECRET,
        now + WEBHOOK_TS_WINDOW_SECONDS + 1,
      ),
    ).toBe(false);
  });

  it("acepta ts dentro de la ventana", () => {
    const sig = firmar("12345", "req-7", now - 60);
    expect(
      verifyMercadoPagoSignature(sig, "req-7", ["12345"], SECRET, now),
    ).toBe(true);
  });

  it("rechaza ts no numérico", () => {
    const sig = "ts=abc,v1=deadbeef";
    expect(
      verifyMercadoPagoSignature(sig, "req-8", ["12345"], SECRET, now),
    ).toBe(false);
  });
});

describe("mapPreapprovalStatus", () => {
  it("solo authorized concede acceso", () => {
    expect(mapPreapprovalStatus("authorized")).toEqual({
      sub: "active",
      grantsAccess: true,
    });
  });

  it("pending nunca concede el plan pago", () => {
    expect(mapPreapprovalStatus("pending")).toEqual({
      sub: "trialing",
      grantsAccess: false,
    });
  });

  it("mapea cancelación y pausa sin acceso", () => {
    expect(mapPreapprovalStatus("cancelled")).toEqual({
      sub: "canceled",
      grantsAccess: false,
    });
    expect(mapPreapprovalStatus("paused")).toEqual({
      sub: "inactive",
      grantsAccess: false,
    });
  });

  it("estados desconocidos no conceden acceso", () => {
    expect(mapPreapprovalStatus("algo-raro").grantsAccess).toBe(false);
    expect(mapPreapprovalStatus("").grantsAccess).toBe(false);
  });
});
