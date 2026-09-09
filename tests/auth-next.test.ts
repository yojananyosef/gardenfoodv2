import { describe, expect, it } from "vitest";
import { nextSeguro } from "@/lib/auth/next";

describe("nextSeguro", () => {
  it("acepta rutas internas válidas", () => {
    expect(nextSeguro("/huerto")).toBe("/huerto");
    expect(nextSeguro("/calendario?semana=3")).toBe("/calendario?semana=3");
    expect(nextSeguro("/especies/duraznero")).toBe("/especies/duraznero");
  });

  it("rechaza URLs absolutas externas", () => {
    expect(nextSeguro("https://malicioso.cl")).toBe("/huerto");
    expect(nextSeguro("http://malicioso.cl/ruta")).toBe("/huerto");
    expect(nextSeguro("javascript:alert(1)")).toBe("/huerto");
  });

  it("rechaza protocol-relative que mantiene el esquema del origen", () => {
    expect(nextSeguro("//malicioso.cl")).toBe("/huerto");
    expect(nextSeguro("//malicioso.cl/ruta")).toBe("/huerto");
  });

  it("rechaza backslash y variantes con barra invertida", () => {
    expect(nextSeguro("\\\\malicioso.cl")).toBe("/huerto");
    expect(nextSeguro("/\\malicioso.cl")).toBe("/huerto");
    expect(nextSeguro("/huerto\\..")).toBe("/huerto");
  });

  it("cae al fallback con entrada vacía o null", () => {
    expect(nextSeguro(null)).toBe("/huerto");
    expect(nextSeguro("")).toBe("/huerto");
    expect(nextSeguro(undefined, "/calendario")).toBe("/calendario");
  });

  it("respeta el fallback personalizado", () => {
    expect(nextSeguro("https://malicioso.cl", "/recuperar")).toBe("/recuperar");
  });
});
