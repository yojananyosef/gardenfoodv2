import { describe, expect, it } from "vitest";
import {
  FREE_LIMITS,
  REGIONES_EXPLORACION_LIBRE,
  esRegionExploracionLibre,
  limitesDe,
  puedeAgregarArbol,
  puedeAgregarCultivo,
  puedeAgregarHuerto,
  puedeExplorarRegion,
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

describe("exploración libre por región (landing)", () => {
  it("libera exactamente Metropolitana, O'Higgins y Ñuble", () => {
    expect([...REGIONES_EXPLORACION_LIBRE].sort()).toEqual(
      ["Metropolitana", "O'Higgins", "Ñuble"].sort(),
    );
  });

  it("anónimo solo explora las 3 regiones libres", () => {
    expect(esRegionExploracionLibre("Metropolitana")).toBe(true);
    expect(esRegionExploracionLibre("O'Higgins")).toBe(true);
    expect(esRegionExploracionLibre("Ñuble")).toBe(true);
    expect(esRegionExploracionLibre("Maule")).toBe(false);
    expect(esRegionExploracionLibre("Valparaíso")).toBe(false);
    expect(esRegionExploracionLibre("Magallanes")).toBe(false);
    expect(esRegionExploracionLibre("")).toBe(false);
    expect(esRegionExploracionLibre(null)).toBe(false);
    expect(esRegionExploracionLibre(undefined)).toBe(false);
  });

  it("logueado desbloquea cualquier región", () => {
    for (const region of ["Metropolitana", "Maule", "Magallanes", "Arica y Parinacota"]) {
      expect(puedeExplorarRegion(region, { isAuthenticated: true })).toBe(true);
    }
  });

  it("anónimo bloquea el resto e invita a registrarse", () => {
    expect(puedeExplorarRegion("Metropolitana", { isAuthenticated: false })).toBe(true);
    expect(puedeExplorarRegion("Ñuble", { isAuthenticated: false })).toBe(true);
    expect(puedeExplorarRegion("O'Higgins", { isAuthenticated: false })).toBe(true);
    expect(puedeExplorarRegion("Maule", { isAuthenticated: false })).toBe(false);
    expect(puedeExplorarRegion("Biobío", { isAuthenticated: false })).toBe(false);
    expect(puedeExplorarRegion(null, { isAuthenticated: false })).toBe(false);
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
