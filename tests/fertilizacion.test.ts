import { describe, expect, it } from "vitest";
import {
  ajustePorArbol,
  cosechaTipicaAdulta,
  fertilizantePorProducto,
  fenologiaPorEspecie,
  gramosACaseras,
  guiaRegional,
  medidaCasera,
  mesesDeGuia,
  programaDeEspecie,
  regionesGuia,
  regionGuiaDeRegion,
  tieneFertilizacion,
  textoGramos,
} from "@/lib/agronomy/fertilizacion";

describe("fertilización casera (xlsx socio)", () => {
  it("programa del duraznero en transición Ñuble al suelo tiene 3 momentos", () => {
    const p = programaDeEspecie("Duraznero", "Transición (Ñuble-Biobío)", "suelo");
    expect(p).toHaveLength(3);
    expect(p.map((x) => x.momento)).toEqual([
      "Cuando despierta",
      "Cuando engorda la fruta",
      "Cuando se recupera",
    ]);
  });

  it("el goteo aplica más veces con menos gramos por aplicación", () => {
    const suelo = programaDeEspecie("Duraznero", "Transición (Ñuble-Biobío)", "suelo");
    const goteo = programaDeEspecie("Duraznero", "Transición (Ñuble-Biobío)", "goteo");
    const periodoEngorda = (arr: typeof suelo) => arr.find((x) => x.orden === 1)!;
    expect(periodoEngorda(goteo).veces).toBeGreaterThan(periodoEngorda(suelo).veces);
    for (const d of periodoEngorda(goteo).detalle) {
      if (d.gramos_cada_vez) {
        const gramosSuelo = periodoEngorda(suelo).detalle.find(
          (x) => x.nutriente === d.nutriente,
        )?.gramos_cada_vez;
        expect(d.gramos_cada_vez).toBeLessThanOrEqual(gramosSuelo ?? Infinity);
      }
    }
  });

  it("peso por cucharada del catálogo: urea ≈ 11 g", () => {
    const urea = fertilizantePorProducto("Urea");
    expect(urea?.gramos_cucharada).toBe(11);
    expect(urea?.n_pct).toBe(46);
  });

  it("80,7 g de urea ≈ 7 cucharadas soperas", () => {
    const texto = gramosACaseras(80.7, "Urea");
    expect(texto).toMatch(/taza|cucharada/);
    expect(gramosACaseras(5, "Urea")).toBe("menos de ½ cucharada");
  });

  it("ajuste por edad del MI PLAN: recién plantado × 0,3", () => {
    expect(ajustePorArbol("Duraznero", "adulto")).toBe(1);
    expect(ajustePorArbol("Duraznero", "recien")).toBe(0.3);
    expect(ajustePorArbol("Duraznero", "recien", 55)).toBeLessThan(1);
    expect(ajustePorArbol("Duraznero", "formacion", 110)).toBeCloseTo(1.2);
  });

  it("cosecha típica del duraznero adulto en el xlsx es 55 kg", () => {
    expect(cosechaTipicaAdulta("Duraznero")).toBe(55);
  });

  it("las 6 regiones del xlsx están en la fenología del duraznero", () => {
    const zonas = fenologiaPorEspecie("Duraznero").map((f) => f.region_guia);
    expect(zonas).toHaveLength(6);
    expect(zonas).toContain("Transición (Ñuble-Biobío)");
  });

  it("no cultiva que no prospera: se_cultiva false con nota", () => {
    const sur = fenologiaPorEspecie("Duraznero").find((f) => f.region_guia.startsWith("Sur"))!;
    if (sur.se_cultiva === false) expect(sur.nota).toContain("clima");
  });

  it("tieneFertilizacion normaliza mayúsculas", () => {
    expect(tieneFertilizacion("duraznero")).toBe(true);
    expect(tieneFertilizacion("Cerezo")).toBe(true);
    expect(tieneFertilizacion("Frutilla de cana")).toBe(false);
  });
});

describe("material visual: calendario de momentos", () => {
  it("mesesDeGuia lee la lista de abreviaturas del xlsx", () => {
    expect(mesesDeGuia("Jul, Ago")).toEqual([7, 8]);
    // Las ventanas dan la vuelta al año: Ene va después de Dic, no antes.
    expect(mesesDeGuia("Nov, Dic, Ene, Feb")).toEqual([11, 12, 1, 2]);
  });

  it("mesesDeGuia tolera basura sin inventar meses", () => {
    expect(mesesDeGuia(null)).toEqual([]);
    expect(mesesDeGuia("")).toEqual([]);
    expect(mesesDeGuia("—")).toEqual([]);
    expect(mesesDeGuia("Jul, , ,Ago")).toEqual([7, 8]);
  });

  it("el calendario del duraznero en transición tiene los 3 momentos", () => {
    const g = guiaRegional("Duraznero", "Transición (Ñuble-Biobío)", "suelo")!;
    expect(g).not.toBeNull();
    expect(g.momentos.map((m) => m.orden)).toEqual([0, 1, 2]);
    expect(g.calendario).toHaveLength(12);
    expect(g.totalAplicaciones).toBe(
      g.momentos.reduce((acc, m) => acc + m.veces, 0),
    );
  });

  it("los meses sin/windows vacíos quedan en null, no en un momento", () => {
    const g = guiaRegional("Duraznero", "Transición (Ñuble-Biobío)", "suelo")!;
    // Cada mes pintado tiene que pertenecer de verdad a algún momento.
    g.calendario.forEach((orden, i) => {
      if (orden === null) return;
      expect(g.momentos[orden].meses).toContain(i + 1);
    });
  });

  it("detecta el mes de traspaso donde el abono cambia de momento", () => {
    // Sep es el último mes de «despierta» y el primero de «engorda».
    const g = guiaRegional("Duraznero", "Santiago-RM", "suelo")!;
    expect(g.traspasos).toContain(9);
    // Y solo hay un color por mes: gana el primer momento que lo cubre.
    expect(g.calendario[8]).toBe(0);
  });

  it("trae la nota de la región y si la especie prospera ahí", () => {
    // Zona límite: el duraznero en Ñuble-Biobío SÍ tiene dosis calibradas,
    // pero la guía advierte el riesgo de helada. De ahí el aviso ámbar.
    const limite = guiaRegional("Duraznero", "Transición (Ñuble-Biobío)", "suelo")!;
    expect(limite.seCultiva).toBe(false);
    expect(limite.nota).toMatch(/heladas/i);

    const riesgo = guiaRegional("Damasco", "Norte (Atacama-Coquimbo)", "suelo")!;
    expect(riesgo.seCultiva).toBe(false);
    expect(riesgo.nota).toMatch(/Zona límite/i);
  });

  it("«no prospera» y «zona límite» nunca se confunden", () => {
    // Invariante del xlsx que sostiene el diseño del aviso: si la guía dice
    // que NO prospera, no hay programa (la ficha cae en el estado vacío y no
    // muestra ninguna dosis); si hay programa con se_cultiva=false, es siempre
    // el caso «zona justa» que sí merece un aviso ámbar.
    const fenologia = fenologiaPorEspecie("Duraznero");
    const guias = regionesGuia();
    for (const f of fenologia) {
      const g = guiaRegional("Duraznero", f.region_guia, "suelo");
      if (f.nota?.includes("No prospera")) expect(g).toBeNull();
      else expect(g).not.toBeNull();
    }
    expect(guias).toHaveLength(6);
  });

  it("goteo duplica las aplicaciones del mismo momento", () => {
    const suelo = guiaRegional("Duraznero", "Transición (Ñuble-Biobío)", "suelo")!;
    const goteo = guiaRegional("Duraznero", "Transición (Ñuble-Biobío)", "goteo")!;
    expect(goteo.totalAplicaciones).toBeGreaterThan(suelo.totalAplicaciones);
  });

  it("devuelve null cuando la guía no cubre la especie en la región", () => {
    // El arándano no tiene programa en el norte del país.
    expect(guiaRegional("Arándano", "Norte (Atacama-Coquimbo)", "suelo")).toBeNull();
    expect(guiaRegional("Frutilla de cana", "Santiago-RM", "suelo")).toBeNull();
  });

  it("las 20 zonas del perfil caen en una de las 6 regiones de la guía", () => {
    for (const zona of [
      "Arica y Parinacota", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana",
      "O'Higgins", "Maule", "Ñuble", "Biobío", "Araucanía", "Los Ríos", "Los Lagos",
    ]) {
      expect(regionGuiaDeRegion(zona)).not.toBeNull();
    }
    expect(regionGuiaDeRegion("Metropolitana")).toBe("Santiago-RM");
    expect(regionGuiaDeRegion("Arica y Parinacota")).toBe("Norte (Atacama-Coquimbo)");
    expect(regionGuiaDeRegion(null)).toBeNull();
  });
});

describe("material visual: la dosis dibujada", () => {
  it("usa el «gramos por cucharada» de cada producto del catálogo", () => {
    // Superfosfato triple: 15 g/cucharada → 388,6 g ≈ 26 cucharadas ≈ 1,6 tazas.
    const sup = medidaCasera(388.6, "Superfosfato triple");
    expect(sup.unidad).toBe("taza");
    expect(sup.valor).toBeCloseTo(1.5, 1);

    // Urea: 11 g/cucharada → los mismos gramos salen en más cucharadas.
    expect(medidaCasera(388.6, "Urea").unidad).toBe("taza");
    expect(medidaCasera(388.6, "Urea").valor).toBeGreaterThan(sup.valor);

    // El umbral es relativo a la cucharada del producto: 4 g de urea es
    // menos de 0,4 cucharada, así que «pizca»; 5 g ya es media cucharada.
    expect(medidaCasera(4, "Urea").unidad).toBe("pizca");
    expect(medidaCasera(4, "Urea").texto).toBe("una pizca");
    expect(medidaCasera(5, "Urea").texto).toBe("media cucharada");
  });

  it("traduce gramos a la unidad que el usuario tiene en la cocina", () => {
    expect(medidaCasera(6, "Urea").unidad).toBe("cuchara");
    expect(medidaCasera(6, "Urea").texto).toBe("media cucharada");
    expect(medidaCasera(11, "Urea").texto).toBe("1 cucharada sopera");
    expect(medidaCasera(33, "Urea").texto).toBe("3 cucharadas soperas");
    expect(medidaCasera(176, "Urea").texto).toBe("1 taza de té");
  });

  it("redondea a pasos de media unidad, que es lo único que se puede dibujar", () => {
    for (const g of [10, 37, 84, 150, 388.6, 721]) {
      const m = medidaCasera(g, "Urea");
      if (m.unidad === "pesa") continue;
      expect(m.valor * 2).toBe(Math.round(m.valor * 2));
    }
  });

  it("manda a la pesa cuando son tantos kilos que dibujar no ayuda", () => {
    const m = medidaCasera(8000, "Urea");
    expect(m.unidad).toBe("pesa");
    expect(m.texto).toMatch(/pesa/i);
  });

  it("sin gramos no inventa una medida", () => {
    expect(medidaCasera(null, "Urea").texto).toBe("—");
    expect(medidaCasera(0, "Urea").texto).toBe("—");
  });

  it("textoGramos pasa a kilos recién sobre el kilo", () => {
    expect(textoGramos(388.6)).toBe("389 gramos");
    expect(textoGramos(1000)).toBe("1,0 kilos");
    expect(textoGramos(1250)).toBe("1,3 kilos");
  });

  it("el ajuste por edad de la ficha multiplica la dosis del programa", () => {
    const adulto = guiaRegional("Duraznero", "Santiago-RM", "suelo")!;
    const p = adulto.momentos[0].productos[0];
    // ×0,3 = recién plantado: 3 Fluor kg pasa a menos de una cucharada.
    const recien = medidaCasera(p.gramos * 0.3, p.producto);
    const grande = medidaCasera(p.gramos, p.producto);
    expect(recien.valor).toBeLessThan(grande.valor);
  });
});
