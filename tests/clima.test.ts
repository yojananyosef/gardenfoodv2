import { describe, expect, it } from "vitest";

import { ZONAS } from "@/lib/agronomy/zonas";
import { centroideDe, centroideDeZona, puntoDeConsulta } from "@/lib/agronomy/centroides";
import {
  agruparAlertas,
  alertasDesdePronostico,
  alertasEstaticas,
  fechaCorta,
  fechaLargaChile,
  hoyLocal,
  mesEnChile,
  resolverClima,
  resumenAlertas,
  severidadCalor,
  severidadHelada,
  umbralHelada,
  UMBRAL_LLUVIA_PCT,
  type DiaPronostico,
  type Pronostico,
} from "@/lib/climate/alertas";
import { condicionDe, diasDeLluvia } from "@/lib/climate/condiciones";
import {
  deficitDelDia,
  diasDeRiego,
  fraseRiego,
  KC_HUERTO,
  riegoDeSemana,
} from "@/lib/climate/riego";

const zona = ZONAS[7]; // Santiago Norte

function dia(over: Partial<DiaPronostico> = {}): DiaPronostico {
  return { fecha: "2026-10-09", max: 18, min: 9, probLluvia: 0, ...over };
}

function pronostico(dias: DiaPronostico[]): Pronostico {
  return { dias, lugar: "-33.0,-70.6" };
}

/**
 * El módulo de clima se reescribió entero y antes no tenía un solo test. Estos
 * son todos pur functions: ningún fetch, así que corren en cualquier CI sin
 * depender de que Open-Meteo esté arriba.
 */
describe("umbral de helada derivado de la zona", () => {
  it("sale de la mínima promedio de la zona, no de comparaciones de texto", () => {
    expect(umbralHelada(zona)).toBe(zona.tnMin - 3);
  });

  it("no depende del string de días de helada", () => {
    // El bug anterior: `heladas.includes("15")` matcheaba "5–15 días" y daba
    // severidad alta a zonas con 5-15 días. El umbral sale de `tnMin`.
    expect(umbralHelada(ZONAS[2])).not.toBeNaN();
    expect(umbralHelada(ZONAS[2])).toBe(ZONAS[2].tnMin - 3);
  });
});

describe("severidad por valor previsto", () => {
  it("escala con los grados bajo el umbral", () => {
    const u = umbralHelada(zona);
    expect(severidadHelada(u, u)).toBe("baja");
    expect(severidadHelada(u - 1.9, u)).toBe("baja");
    expect(severidadHelada(u - 2, u)).toBe("media");
    expect(severidadHelada(u - 5, u)).toBe("alta");
    expect(severidadHelada(u - 12, u)).toBe("alta");
  });

  it("la calor escala igual", () => {
    expect(severidadCalor(31)).toBe("baja");
    expect(severidadCalor(33)).toBe("media");
    expect(severidadCalor(36)).toBe("alta");
  });
});

describe("alertas desde el pronóstico", () => {
  const u = umbralHelada(zona);

  it("avisa de helada con la fecha del día", () => {
    const a = alertasDesdePronostico(
      pronostico([dia({ fecha: "2026-10-11", min: u - 6, max: 12 })]),
      zona,
    );
    expect(a).toHaveLength(1);
    expect(a[0].tipo).toBe("helada");
    expect(a[0].fecha).toBe("2026-10-11");
    expect(a[0].severidad).toBe("alta");
    expect(a[0].detalle).toContain("Mínima prevista");
  });

  it("no avisa si la mínima queda sobre el umbral", () => {
    const a = alertasDesdePronostico(pronostico([dia({ min: u + 1 })]), zona);
    expect(a.filter((x) => x.tipo === "helada")).toHaveLength(0);
  });

  it("el umbral sale de un entero, no de un decimal", () => {
    // El umbral se compara contraZT_MIN, que en el catálogo es entero. Si algún
    // día dejara de serlo, el borde «mínima igual al umbral» quedaría a medias
    // entre dos severidades.
    expect(Number.isInteger(umbralHelada(zona))).toBe(true);
  });

  it("avisa de lluvia sobre el umbral de probabilidad", () => {
    const a = alertasDesdePronostico(pronostico([dia({ probLluvia: UMBRAL_LLUVIA_PCT })]), zona);
    expect(a.filter((x) => x.tipo === "lluvia")).toHaveLength(1);
    expect(a[0].fecha).toBe("2026-10-09");
  });

  it("no avisa de lluvia por debajo del umbral", () => {
    const a = alertasDesdePronostico(pronostico([dia({ probLluvia: UMBRAL_LLUVIA_PCT - 1 })]), zona);
    expect(a.filter((x) => x.tipo === "lluvia")).toHaveLength(0);
  });

  it("avisa de calor sobre 32 °C", () => {
    const a = alertasDesdePronostico(pronostico([dia({ max: 33 })]), zona);
    expect(a.filter((x) => x.tipo === "calor")).toHaveLength(1);
  });

  it("toda alerta que se emite trae fecha", () => {
    // La razón de ser del módulo: el socio pidió alertas predictivas en vez de
    // eventos ya ocurridos, y una alerta sin día es un evento ya ocurrido.
    const a = alertasDesdePronostico(
      pronostico([dia({ min: u - 7, max: 36, probLluvia: 90 })]),
      zona,
    );
    expect(a.length).toBeGreaterThan(0);
    for (const x of a) expect(x.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("devuelve vacío sin pronóstico, sin lanzar", () => {
    expect(alertasDesdePronostico(null, zona)).toEqual([]);
  });

  it("el pronóstico manda sobre el perfil: sin umbrales no inventa alertas", () => {
    const r = resolverClima(pronostico([dia({ min: 12, max: 20, probLluvia: 5 })]), zona, 7);
    expect(r.fuente).toBe("pronostico");
    expect(r.alertas).toEqual([]);
  });
});

describe("respaldo del perfil estático", () => {
  it("la sequia solo se dispara si la zona es seca", () => {
    // El bug anterior la disparaba por mes del calendario sin mirar
    // `zona.sequia`, así que a Temuco (1200 mm/año) le decía «precipitación
    // baja».
    const temuco = ZONAS[18];
    expect(temuco.pp).toBeGreaterThan(1000);
    const enero = alertasEstaticas(temuco, 1);
    expect(enero.filter((a) => a.tipo === "sequia")).toHaveLength(0);
  });

  it("la sequia sí se dispara en una zona seca", () => {
    const arica = ZONAS[1];
    expect(arica.sequia).toBe("Extremo");
    expect(alertasEstaticas(arica, 1).filter((a) => a.tipo === "sequia")).toHaveLength(1);
  });

  it("no marca alta a las zonas de 5 a 15 días de helada", () => {
    // Regresión del substring: estas cuatro zonas tienen "5–15 días" y salían
    // con severidad alta.
    const conCincoQuince = [2, 5, 11, 17].map((id) => ZONAS[id]).filter((z) => z.heladas.includes("15"));
    expect(conCincoQuince.length).toBeGreaterThan(0);
    for (const z of conCincoQuince) {
      const alerta = alertasEstaticas(z, 7).find((a) => a.tipo === "helada");
      expect(alerta?.severidad).toBe("media");
    }
  });

  it("no dispara heladas en la zona sin heladas", () => {
    expect(alertasEstaticas(ZONAS[1], 7).filter((a) => a.tipo === "helada")).toHaveLength(0);
  });

  it("las alertas de respaldo declaran que no tienen fecha", () => {
    for (const a of alertasEstaticas(ZONAS[7], 7)) expect(a.fecha).toBe("");
  });

  it("no pisa con dos alertas contradictorias en el sur", () => {
    // Antes el sur recibía «helada» y «exceso de humedad» a la vez.
    const sur = ZONAS[19];
    const alertas = alertasEstaticas(sur, 6);
    const tipos = new Set(alertas.map((a) => a.tipo));
    expect(tipos.has("helada") && tipos.has("lluvia")).toBe(false);
  });
});

describe("resolverClima elige la fuente", () => {
  it("usa el pronóstico cuando hay", () => {
    expect(resolverClima(pronostico([dia()]), zona, 7).fuente).toBe("pronostico");
  });

  it("cae al perfil cuando Open-Meteo no respondió", () => {
    const r = resolverClima(null, zona, 7);
    expect(r.fuente).toBe("perfil");
    expect(r.pronostico).toBeNull();
    expect(r.alertas.length).toBeGreaterThan(0);
  });

  it("cae al perfil también con un pronóstico vacío", () => {
    expect(resolverClima(pronostico([]), zona, 7).fuente).toBe("perfil");
  });

  it("dice «ninguna» cuando no hay nada que mostrar", () => {
    const r = resolverClima(null, ZONAS[1], 4);
    expect(r.fuente).toBe("ninguna");
    expect(r.alertas).toEqual([]);
  });
});

describe("el número del badge, en palabras", () => {
  const u = umbralHelada(zona);

  it("cuenta días distintos, no alertas", () => {
    // Una helada y lluvia el mismo día son dos avisos de un día. El badge decía
    // el total, así que «2» donde el usuario pensaba «1».
    const a = alertasDesdePronostico(
      pronostico([dia({ fecha: "2026-10-09", min: u - 6, probLluvia: 80 })]),
      zona,
    );
    expect(a).toHaveLength(2);
    expect(resumenAlertas(a)).toBe("1 día con aviso");
  });

  it("pluraliza", () => {
    const a = alertasDesdePronostico(
      pronostico([
        dia({ fecha: "2026-10-09", min: u - 6 }),
        dia({ fecha: "2026-10-10", min: u - 6 }),
        dia({ fecha: "2026-10-11", probLluvia: 80 }),
      ]),
      zona,
    );
    expect(resumenAlertas(a)).toBe("3 días con aviso");
  });

  it("el respaldo sin fechas cuenta avisos, no días", () => {
    // El perfil estático no tiene día al que atribuir nada: decir «2 días con
    // aviso» sería inventar precisión.
    const a = alertasEstaticas(zona, 7);
    expect(a.length).toBeGreaterThan(0);
    expect(resumenAlertas(a)).toMatch(/^\d+ aviso/);
  });

  it("sin alertas dice que no hay", () => {
    expect(resumenAlertas([])).toBe("sin avisos");
  });
});

describe("alertas agrupadas por tipo", () => {
  it("cinco días de lluvia son una línea, no cinco", () => {
    // El bug de screen: cinco filas idénticas de «Lluvia probable» ocupando
    // media pantalla para decir lo mismo cinco veces.
    const a = alertasDesdePronostico(
      pronostico([
        dia({ fecha: "2026-10-09", probLluvia: 100 }),
        dia({ fecha: "2026-10-10", probLluvia: 98 }),
        dia({ fecha: "2026-10-11", probLluvia: 82 }),
        dia({ fecha: "2026-10-12", probLluvia: 73 }),
        dia({ fecha: "2026-10-13", probLluvia: 90 }),
      ]),
      zona,
    );
    expect(a).toHaveLength(5);
    const g = agruparAlertas(a);
    expect(g).toHaveLength(1);
    expect(g[0].tipo).toBe("lluvia");
    expect(g[0].fechas).toEqual([
      "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13",
    ]);
  });

  it("mantiene los tipos distintos separados", () => {
    const u = umbralHelada(zona);
    const a = alertasDesdePronostico(
      pronostico([dia({ fecha: "2026-10-09", min: u - 6, probLluvia: 80 })]),
      zona,
    );
    expect(a).toHaveLength(2);
    expect(agruparAlertas(a).map((g) => g.tipo).sort()).toEqual(["helada", "lluvia"]);
  });

  it("el grupo toma la severidad más alta de sus días", () => {
    // Un día con helada leve y otro con helada fuerte: el bloque dice fuerte.
    // Si tomara el primero, el usuario no vería el día que importa.
    const u = umbralHelada(zona);
    const a = alertasDesdePronostico(
      pronostico([
        dia({ fecha: "2026-10-09", min: u - 1 }),
        dia({ fecha: "2026-10-10", min: u - 8 }),
      ]),
      zona,
    );
    const g = agruparAlertas(a);
    expect(g).toHaveLength(1);
    expect(g[0].severidad).toBe("alta");
  });

  it("ordena por severidad, no por fecha", () => {
    const u = umbralHelada(zona);
    const a = alertasDesdePronostico(
      pronostico([
        // Lluvia leve el día 1, helada fuerte el día 2: la helada va arriba.
        dia({ fecha: "2026-10-09", probLluvia: 61 }),
        dia({ fecha: "2026-10-10", min: u - 9 }),
      ]),
      zona,
    );
    expect(agruparAlertas(a)[0].tipo).toBe("helada");
  });

  it("la probabilidad del grupo no promete la de un solo día", () => {
    // Cinco días agrupados: si el texto dijera «100%», el martes que marca 73%
    // en la tira quedaría contradicho por su propia tarjeta de alerta.
    const a = alertasDesdePronostico(
      pronostico([
        dia({ fecha: "2026-10-09", probLluvia: 100 }),
        dia({ fecha: "2026-10-10", probLluvia: 73 }),
      ]),
      zona,
    );
    expect(a[0].detalle).toContain("100%");
    // `detalleEnPlural` es del componente; lo que se comprueba acá es que el
    // detalle por día sí trae su cifra, para que el pluralizador la encuentre.
    expect(a[1].detalle).toContain("73%");
  });

  it("el respaldo estático no inventa fechas", () => {
    const g = agruparAlertas(alertasEstaticas(zona, 7));
    expect(g.length).toBeGreaterThan(0);
    for (const x of g) expect(x.fechas).toEqual([]);
  });
});

describe("códigos WMO traducidos", () => {
  it("cubre los 28 códigos que devuelve el modelo", () => {
    // La tabla de WMO 4677. Si la API empieza a devolver otro, el código
    //Peligro es que aparezca "Sin dato" y haya que agregar la fila.
    const wmo = [
      0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67,
      71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 97, 99,
    ];
    for (const c of wmo) {
      expect(condicionDe(c).etiqueta, `código ${c}`).not.toBe("Sin dato");
    }
  });

  it("distingue los cuatro estados del cielo que el usuario ve distinto", () => {
    expect(condicionDe(0).icono).toBe("sol");
    expect(condicionDe(2).icono).toBe("parcial-nublado");
    expect(condicionDe(3).icono).toBe("nublado");
    expect(condicionDe(65).icono).toBe("lluvia");
  });

  it("marca el granizo, que es lo que destruye una temporada", () => {
    // 96 y 99 son tormenta con granizo. Para un frutal no es una alerta más:
    // un granizo a mitad de cuaja deja la cosecha perdida.
    expect(condicionDe(96).granizo).toBe(true);
    expect(condicionDe(99).granizo).toBe(true);
    // Una tormenta sin granizo no lleva la marca.
    expect(condicionDe(95).granizo).toBeUndefined();
  });

  it("marca la lluvia por debajo de cero", () => {
    expect(condicionDe(66).helada).toBe(true);
    expect(condicionDe(67).helada).toBe(true);
    expect(condicionDe(61).helada).toBeUndefined();
  });

  it("no explota con un código raro o ausente", () => {
    // El modelo puede devolver algo fuera de la tabla. Que caiga en "Sin
    // dato", no en una excepción que rompa /huerto.
    expect(condicionDe(999).etiqueta).toBe("Sin dato");
    expect(condicionDe(null).etiqueta).toBe("Sin dato");
    expect(condicionDe(undefined).etiqueta).toBe("Sin dato");
  });
});

describe("días de lluvia para el resumen", () => {
  it("ordena por probabilidad, no por fecha", () => {
    const d = diasDeLluvia([
      { fecha: "2026-10-07", probLluvia: 30 },
      { fecha: "2026-10-09", probLluvia: 90 },
      { fecha: "2026-10-08", probLluvia: 60 },
    ]);
    expect(d.map((x) => x.probLluvia)).toEqual([90, 60]);
  });

  it("filtra los que no llegan al umbral", () => {
    expect(diasDeLluvia([{ fecha: "2026-10-07", probLluvia: 20 }])).toEqual([]);
  });
});

describe("riego a partir de la evapotranspiración", () => {
  it("un día seco y caluroso pide agua", () => {
    // ET₀ de 3,5 mm en un día de verano: la demanda del huerto es 3,5 × 0,85.
    const d = deficitDelDia(3.5, 0);
    expect(d).toBeCloseTo(3.5 * KC_HUERTO, 1);
  });

  it("la lluvia descuenta, pero no toda", () => {
    // 2 mm de lluvia no cubren 3,5 × 0,85 = 2,975 mm de demanda: el 20% se
    // va, quedan 1,375 mm por reponer.
    expect(deficitDelDia(3.5, 2)).toBeCloseTo(1.375, 2);
  });

  it("no riega de más cuando la lluvia alcanza", () => {
    expect(deficitDelDia(1, 10)).toBe(0);
  });

  it("sin ET₀ no inventa riego", () => {
    // El respaldo estático no trae ET₀ y no se puede saber cuánto regar.
    const dias = riegoDeSemana([
      { fecha: "2026-10-07", max: 18, min: 9, probLluvia: 0, et0: null, mmLluvia: 0 },
    ]);
    expect(dias[0].riego).toBe(0);
    expect(fraseRiego(dias)).toBe("Sin dato de evapotranspiración");
  });

  it("resumen de la semana en mm", () => {
    const dias = riegoDeSemana([
      { fecha: "2026-10-07", max: 18, min: 9, probLluvia: 0, et0: 3, mmLluvia: 0 },
      { fecha: "2026-10-08", max: 18, min: 9, probLluvia: 0, et0: 3, mmLluvia: 0 },
    ]);
    const frase = fraseRiego(dias);
    expect(frase).toContain("mm de riego en 7 días");
    // Con coma decimal, que es como se escribe en Chile.
    expect(frase).toContain(",");
  });

  it("avisa que la lluvia cubre todo cuando es así", () => {
    const dias = riegoDeSemana([
      { fecha: "2026-10-07", max: 12, min: 8, probLluvia: 100, et0: 0.5, mmLluvia: 30 },
    ]);
    expect(fraseRiego(dias)).toBe("La lluvia cubre la demanda de la semana");
  });

  it("ordena los días de riego de más a menos", () => {
    const dias = riegoDeSemana([
      { fecha: "2026-10-07", max: 18, min: 9, probLluvia: 0, et0: 1, mmLluvia: 0 },
      { fecha: "2026-10-08", max: 34, min: 20, probLluvia: 0, et0: 6, mmLluvia: 0 },
      { fecha: "2026-10-09", max: 30, min: 18, probLluvia: 0, et0: 4, mmLluvia: 0 },
    ]);
    const top = diasDeRiego(dias);
    expect(top.map((d) => d.fecha)).toEqual(["2026-10-08", "2026-10-09"]);
  });
});

describe("fecha en hora de Chile, no del servidor", () => {
  /**
   * Este bloque existe por un bug que solo se veía en producción.
   *
   * `hoyLocal()` usaba `getMonth()`/`getDate()`, que dan la hora del proceso. En
   * local el TZ de la máquina es America/Santiago y funcionaba; en Vercel, que
   * corre en UTC, devolvía el día siguiente desde las 21:00 hora chilena. El
   * pronóstico marcaba «Hoy» en el día que venía y las tareas del «hoy» eran
   * las de mañana.
   *
   * Estos tests simulan el servidor en UTC con una fecha donde Chile y UTC están
   * en días distintos, que es exactamente la franja de 21:00 a 24:00.
   */

  // 01:40 UTC del jueves 8 → en Chile (UTC−3) todavía es miércoles 7.
  const UTC_JUEVES_8 = new Date("2026-10-08T01:40:00Z");

  it("el mismo instante da días distintos según quién pregunta", () => {
    // Documenta el bug: con el proceso en UTC (como Vercel), el método local
    // da 8. Hay que forzar el TZ para reproducirlo, porque en esta máquina el
    // TZ es America/Santiago y el método local da 7 — que es justamente por
    // lo que el bug nunca se vio en local.
    const original = process.env.TZ;
    try {
      process.env.TZ = "UTC";
      expect(UTC_JUEVES_8.getDate()).toBe(8);
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
    // Y la respuesta correcta para Chile es 7, sin importar el TZ.
    expect(hoyLocal(UTC_JUEVES_8)).toBe("2026-10-07");
  });

  it("no depende del TZ del proceso", () => {
    const original = process.env.TZ;
    try {
      for (const tz of ["UTC", "America/Santiago", "America/New_York", "Asia/Tokyo"]) {
        process.env.TZ = tz;
        expect(hoyLocal(UTC_JUEVES_8), `con TZ=${tz}`).toBe("2026-10-07");
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it("resuelve la frontera de medianoche en ambas direcciones", () => {
    // 00:30 UTC del jueves → miércoles 7 en Chile.
    expect(hoyLocal(new Date("2026-10-08T00:30:00Z"))).toBe("2026-10-07");
    // 23:30 UTC del miércoles → miércoles 7 todavía (23:30 − 3 = 20:30).
    expect(hoyLocal(new Date("2026-10-07T23:30:00Z"))).toBe("2026-10-07");
    // 04:00 UTC del jueves → 01:00 del jueves 8 ya en Chile.
    expect(hoyLocal(new Date("2026-10-08T04:00:00Z"))).toBe("2026-10-08");
  });

  it("cruza el cambio de año y de mes, con horario de verano incluido", () => {
    // Chile cambia el offset: CLST (UTC−3) en verano del hemisferio sur y CLT
    // (UTC−4) en invierno. Un número fijo de horas habría fallado en uno de los
    // dos; `Intl` con la zona lo resuelve.
    // 02:00 UTC del 1 de enero → 23:00 del 31 de diciembre en Chile.
    expect(hoyLocal(new Date("2027-01-01T02:00:00Z"))).toBe("2026-12-31");
    // 03:00 UTC del 1 de julio → 23:00 del 30 de junio (invierno, UTC−4).
    expect(hoyLocal(new Date("2026-07-01T03:00:00Z"))).toBe("2026-06-30");
  });

  it("el mes también es el de Chile", () => {
    // 01:40 UTC del 1 de marzo → 22:40 del 28 de febrero en Chile.
    expect(mesEnChile(new Date("2027-03-01T01:40:00Z"))).toBe(2);
    expect(mesEnChile(new Date("2026-10-08T01:40:00Z"))).toBe(10);
  });

  it("la fecha larga dice miércoles, no jueves", () => {
    // El síntoma que reportó el usuario.
    expect(fechaLargaChile(UTC_JUEVES_8)).toMatch(/miércoles/i);
    expect(fechaLargaChile(UTC_JUEVES_8)).toMatch(/7/);
  });
});

describe("formato de fecha", () => {
  it("usa el nombre corto del día", () => {
    // El día de la semana sale de la fecha real. La versión anterior armaba
    // `Date.UTC(2000, mes, día)` y devolvía siempre el de aquel año.
    expect(fechaCorta("2026-10-09")).toBe("vie 9");
    expect(fechaCorta("2026-10-01")).toBe("jue 1");
    expect(fechaCorta("2026-01-01")).toBe("jue 1");
  });

  it("no rompe con una fecha inválida", () => {
    expect(fechaCorta("")).toBe("");
    expect(fechaCorta("basura")).toBe("basura");
  });
});

describe("centroides de comuna", () => {
  it("devuelve el punto de una comuna del seed", () => {
    const p = centroideDe("La Florida");
    expect(p).not.toBeNull();
    expect(p!.lat).toBeLessThan(-17);
    expect(p!.lng).toBeLessThan(-66);
  });

  it("devuelve null para comuna ausente o desconocida", () => {
    expect(centroideDe(null)).toBeNull();
    expect(centroideDe("")).toBeNull();
    expect(centroideDe("Comuna Inventada")).toBeNull();
  });

  it("cae al centro de la zona cuando la comuna no tiene punto", () => {
    const r = puntoDeConsulta("Comuna Inventada", 18);
    expect(r).not.toBeNull();
    expect(r!.deZona).toBe(true);
    expect(r!.punto).toEqual(centroideDeZona(18));
  });

  it("no inventa punto sin comuna ni zona", () => {
    expect(puntoDeConsulta(null, null)).toBeNull();
    expect(puntoDeConsulta("Comuna Inventada", 999)).toBeNull();
  });

  it("todos los puntos caen dentro de Chile", () => {
    for (let id = 1; id <= 20; id++) {
      const p = centroideDeZona(id);
      expect(p, `zona ${id}`).not.toBeNull();
      expect(p!.lat, `zona ${id}`).toBeGreaterThan(-56);
      expect(p!.lat, `zona ${id}`).toBeLessThan(-17);
      expect(p!.lng, `zona ${id}`).toBeGreaterThan(-76.5);
      expect(p!.lng, `zona ${id}`).toBeLessThan(-66);
    }
  });
});