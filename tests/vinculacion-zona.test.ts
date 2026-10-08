import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { regionVisible } from "@/components/especies/NutricionGuia";
import { sueloDesdeValor } from "@/hooks/usePerfilZona";
import { getZonaIdDeComuna, resolverZonaDeComuna } from "@/lib/agronomy";
import { regionDelPerfil, guiaRegional } from "@/lib/agronomy/fertilizacion";

/**
 * La zona del perfil tiene que poder distinguir «la comuna del usuario» de
 * «la zona neutra por si acaso». Antes el fallback estaba escondido en un
 * `?? 7` dentro de getZonaDeComuna, y la ficha no podía avisarle a nadie.
 */
describe("resolverZonaDeComuna", () => {
  it("marca esDefault en false cuando la comuna está en el catálogo", () => {
    const r = resolverZonaDeComuna("La Florida");
    expect(r.esDefault).toBe(false);
    expect(r.comuna).toBe("La Florida");
    expect(r.zonaId).toBe(getZonaIdDeComuna("La Florida"));
  });

  it("marca esDefault en true sin comuna configurada", () => {
    for (const entrada of [undefined, null, ""]) {
      const r = resolverZonaDeComuna(entrada);
      expect(r.esDefault).toBe(true);
      expect(r.comuna).toBeNull();
      // La zona neutra para que la app no se rompa, como antes.
      expect(r.zonaId).toBe(7);
    }
  });

  it("marca esDefault en true con una comuna que no existe en el catálogo", () => {
    const r = resolverZonaDeComuna("Comuna Inventada de Prueba");
    expect(r.esDefault).toBe(true);
    // El string se conserva para poder mostrarlo o corregirlo.
    expect(r.comuna).toBe("Comuna Inventada de Prueba");
    expect(r.zonaId).toBe(7);
  });

  it("no lanza con ninguna entrada", () => {
    expect(() => resolverZonaDeComuna()).not.toThrow();
  });
});

/**
 * El tipo de suelo viene como string suelto desde la columna de la DB, sin
 * restricción. Cualquier valor fuera de los cuatro del catálogo tiene que
 * devenirse en `null` y no colarse hasta el cálculo de riego.
 */
/**
 * La ficha tenía TRES lecturas de `perfiles.comuna`: una en el componente raíz,
 * otra en `TabFenologia`, y el `useState` inicializado de `NutricionGuia`. La
 * segunda sobrevive como regresión si alguien vuelve a meter una query acá.
 *
 * Se lee el archivo en vez de la AST porque lo que importa es que la tab no
 * consulte el perfil por su cuenta, y ese es un invariante de estructura.
 */
/**
 * `regionDelPerfil` es el corazón del fix: antes devolvía siempre una región,
 * saltando a la primera que tuviera programa cuando la del perfil no la tenía.
 * El calendario se repintaba con los meses de otra zona y el pie decía que
 * venía del perfil.
 */
describe("regionDelPerfil", () => {
  it("devuelve la región de la guía que cubre la comuna", () => {
    // zona 7 = Santiago Norte, región Metropolitana.
    expect(regionDelPerfil("Duraznero", 7)).toBe("Santiago-RM");
    // zona 16 = Los Ángeles Interior, Biobío.
    expect(regionDelPerfil("Duraznero", 16)).toBe("Transición (Ñuble-Biobío)");
  });

  it("devuelve null cuando la guía no cubre esa combinación", () => {
    // Duraznero no tiene programa en el Sur (Araucanía-Los Lagos): zona 18.
    expect(regionDelPerfil("Duraznero", 18)).toBeNull();
    // Arándano no tiene programa en el Norte: zona 2 (Copiapó Valle).
    expect(regionDelPerfil("Arándano", 2)).toBeNull();
  });

  it("no se salta a otra región para tapar el vacío", () => {
    // El fallo era exactamente este: con el Duraznero en el Sur, la función
    // devolvía la primera región con programa y la ficha la hacía pasar por la
    // del usuario. Ahora devuelve null y lo que se muestra al usuario es el
    // vacío, no el programa de Santiago.
    expect(regionDelPerfil("Duraznero", 18)).toBeNull();
    // Y la guía confirma que en el Sur efectivamente no hay programa para
    // duraznero, o sea que el null es un hecho y no un fallo de la resolución.
    expect(guiaRegional("Duraznero", "Sur (Araucanía-Los Lagos)", "suelo")).toBeNull();
    expect(guiaRegional("Duraznero", "Santiago-RM", "suelo")).not.toBeNull();
  });

  it("no lanza con una especie que no existe en el catálogo de la guía", () => {
    expect(() => regionDelPerfil("Frutilla de cana", 7)).not.toThrow();
    expect(regionDelPerfil("Frutilla de cana", 7)).toBeNull();
  });
});

/**
 * La región sale de la comuna del perfil y se cambia en `/perfil`. No hay
 * override: ofrecer la región también en la ficha daba dos lugares para
 * cambiar lo mismo, y el de la ficha no persistía, así que el cambio se perdía
 * al recargar.
 */
describe("la región visible viene siempre del perfil", () => {
  const REGION_POR_DEFECTO = "Santiago-RM";

  it("usa la región del perfil cuando la hay", () => {
    const r = regionVisible("Transición (Ñuble-Biobío)", REGION_POR_DEFECTO, false);
    expect(r.region).toBe("Transición (Ñuble-Biobío)");
    expect(r.desdeElPerfil).toBe(true);
  });

  it("sin comuna cae en la región central, que se declara como supuesto", () => {
    const r = regionVisible(null, REGION_POR_DEFECTO, true);
    expect(r.region).toBe(REGION_POR_DEFECTO);
    expect(r.desdeElPerfil).toBe(false);
  });

  it("con comuna y sin guía NO cae en la región central", () => {
    // Este es el caso que el recorrido con sesión real destapó: con comuna
    // Temuco (región Sur, sin guía para duraznero) el calendario seguía
    // pintando el programa de Santiago mientras el pie decía que la comuna no
    // estaba en la guía. Caer a la región central aquí es justamente la
    // contradicción que este change elimina.
    const r = regionVisible(null, REGION_POR_DEFECTO, false);
    expect(r.region).toBeNull();
    expect(r.desdeElPerfil).toBe(false);
  });

  it("cambia de región al cambiar de comuna", () => {
    // Dos renderes con zonas distintas, como pasar por /perfil entre medio.
    const antes = regionVisible(regionDelPerfil("Duraznero", 7), REGION_POR_DEFECTO, false);
    const despues = regionVisible(regionDelPerfil("Duraznero", 16), REGION_POR_DEFECTO, false);
    expect(antes.region).toBe("Santiago-RM");
    expect(despues.region).toBe("Transición (Ñuble-Biobío)");

    // Y si la nueva comuna no tiene guía, no inventa una región.
    const sinGuia = regionVisible(regionDelPerfil("Duraznero", 18), REGION_POR_DEFECTO, false);
    expect(sinGuia.region).toBeNull();
  });
});

describe("TabFenologia recibe la zona resuelta", () => {
  const fuente = readFileSync(
    new URL("../components/especies/FichaEspecieView.tsx", import.meta.url),
    "utf8",
  );

  it("la ficha no crea un cliente de Supabase", () => {
    expect(fuente).not.toMatch(/createClient/);
    expect(fuente).not.toMatch(/from\("perfiles"\)/);
  });

  it("TabFenologia declara zonaId como prop y no como estado propio", () => {
    const cuerpo = fuente.slice(fuente.indexOf("function TabFenologia"));
    expect(cuerpo.slice(0, cuerpo.indexOf("return ("))).toMatch(/zonaId: number/);
    // La consulta al perfil es lo que se eliminó; no debe reaparecer.
    expect(cuerpo.slice(0, cuerpo.indexOf("return ("))).not.toMatch(/useEffect/);
  });
});

describe("sueloDesdeValor", () => {
  it("acepta los cuatro tipos del catálogo", () => {
    expect(sueloDesdeValor("G")).toBe("G");
    expect(sueloDesdeValor("MG")).toBe("MG");
    expect(sueloDesdeValor("M")).toBe("M");
    expect(sueloDesdeValor("F")).toBe("F");
  });

  it("devuelve null con valores ausentes", () => {
    expect(sueloDesdeValor(null)).toBeNull();
    expect(sueloDesdeValor(undefined)).toBeNull();
    expect(sueloDesdeValor("")).toBeNull();
  });

  it("devuelve null con un valor fuera del catálogo", () => {
    for (const raro of ["g", "ARC", "GRANDE", "GG", "1"]) {
      expect(sueloDesdeValor(raro)).toBeNull();
    }
  });
});