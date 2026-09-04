import { describe, expect, it } from "vitest";
import {
  FREE_LIMITS,
  limitesDe,
  puedeAgregarArbol,
  puedeAgregarCultivo,
  puedeAgregarHuerto,
} from "@/lib/payments/plans";
import { esMuestraGratuis } from "@/lib/agronomy";
import { esRutaProtegida } from "@/proxy";

describe("límites del tier gratuito", () => {
  it("define 3 cultivos, 1 árbol y 1 huerto", () => {
    expect(FREE_LIMITS).toEqual({ cultivos: 3, arboles: 1, huertos: 1 });
  });

  it("gratuito puede agregar hasta el límite de cultivos", () => {
    expect(puedeAgregarCultivo(0, "gratuito")).toBe(true);
    expect(puedeAgregarCultivo(1, "gratuito")).toBe(true);
    expect(puedeAgregarCultivo(2, "gratuito")).toBe(true);
    expect(puedeAgregarCultivo(3, "gratuito")).toBe(false);
    expect(puedeAgregarCultivo(10, "gratuito")).toBe(false);
  });

  it("gratuito puede agregar hasta el límite de árboles", () => {
    expect(puedeAgregarArbol(0, "gratuito")).toBe(true);
    expect(puedeAgregarArbol(1, "gratuito")).toBe(false);
    expect(puedeAgregarArbol(5, "gratuito")).toBe(false);
  });

  it("gratuito puede agregar hasta el límite de huertos", () => {
    expect(puedeAgregarHuerto(0, "gratuito")).toBe(true);
    expect(puedeAgregarHuerto(1, "gratuito")).toBe(false);
    expect(puedeAgregarHuerto(5, "gratuito")).toBe(false);
  });

  it("tiers pagos y admin son ilimitados", () => {
    for (const plan of ["huertero", "cosecha", "full", "admin"] as const) {
      expect(puedeAgregarCultivo(500, plan)).toBe(true);
      expect(puedeAgregarArbol(500, plan)).toBe(true);
      expect(puedeAgregarHuerto(500, plan)).toBe(true);
    }
  });

  it("limitesDe expone null para ilimitados y números para gratuito", () => {
    expect(limitesDe("gratuito")).toEqual({ cultivos: 3, arboles: 1, huertos: 1 });
    expect(limitesDe("huertero")).toEqual({ cultivos: null, arboles: null, huertos: null });
    expect(limitesDe("admin")).toEqual({ cultivos: null, arboles: null, huertos: null });
  });
});

describe("muestra gratuita del catálogo", () => {
  it("solo duraznero es muestra", () => {
    expect(esMuestraGratuis("duraznero")).toBe(true);
    expect(esMuestraGratuis("cerezo")).toBe(false);
    expect(esMuestraGratuis("")).toBe(false);
  });
});

describe("gating de rutas anónimo", () => {
  it("calculadoras y core son rutas protegidas para anónimo", () => {
    expect(esRutaProtegida("/calculadoras")).toBe(true);
    expect(esRutaProtegida("/huerto")).toBe(true);
    expect(esRutaProtegida("/perfil")).toBe(true);
    expect(esRutaProtegida("/admin")).toBe(true);
  });

  it("públicas quedan abiertas", () => {
    expect(esRutaProtegida("/")).toBe(false);
    expect(esRutaProtegida("/explorar")).toBe(false);
    expect(esRutaProtegida("/especies/duraznero")).toBe(false);
    expect(esRutaProtegida("/pricing")).toBe(false);
    expect(esRutaProtegida("/registro")).toBe(false);
    expect(esRutaProtegida("/login")).toBe(false);
  });
});
