"use client";

/**
 * Marcador de los 167 consejos que solo estan en la base.
 *
 * Es un componente de React y no una pagina estatica con JavaScript propio
 * porque la CSP de produccion es
 *
 *   script-src 'self' 'nonce-...' 'strict-dynamic'
 *
 * y con `strict-dynamic` no corre ni un script inline sin ESE nonce ni un
 * archivo externo: el 'self' se ignora. O sea que un HTML suelto en `public/`
 * con su `<script>` no puede ejecutarse en produccion, aunque funcione en local
 * y en desarrollo, donde la CSP es permisiva. Como ruta de Next, el nonce ya
 * viene resuelto.
 *
 * Las marcas quedan en el localStorage del navegador. El boton de descarga es
 * lo que las saca de ahí.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

export type ConsejoNuevo = {
  i: number;
  especie: string;
  consejo: string;
  fuente: string;
  pct: number;
  legacy: string | null;
};

const CLAVE = "consejos-nuevos-v1";

/**
 * El localStorage se lee con `useSyncExternalStore` y no con un `useState` +
 * `useEffect`.
 *
 * Con el segundo patron el linter se queja de las dos formas: setState dentro
 * de un useMemo puede entrar en loop, y setState sincrono dentro de un
 * useEffect provoca renders en cascada. `useSyncExternalStore` es la API que
 * existe justamente para esto: leer de un store externo que cambia fuera de
 * React.
 *
 * `getSnapshot` tiene que devolver SIEMPRE la misma referencia mientras el
 * store no cambie, o React renderiza en loop. Por eso se guarda el objeto
 * parseado y se reutiliza.
 */
type Marcas = Record<number, "si" | "no">;

let cache: Marcas | null = null;
let cacheBruto: string | null = null;
const oyentes = new Set<() => void>();

function leerBruto(): string {
  if (typeof window === "undefined") return "{}";
  try {
    return localStorage.getItem(CLAVE) ?? "{}";
  } catch {
    return "{}";
  }
}

function getSnapshot(): Marcas {
  const bruto = leerBruto();
  if (bruto !== cacheBruto) {
    cacheBruto = bruto;
    try {
      cache = JSON.parse(bruto) as Marcas;
    } catch {
      cache = {};
    }
  }
  return cache ?? {};
}

function getServerSnapshot(): Marcas {
  return MARCAS_VACIAS;
}
const MARCAS_VACIAS: Marcas = {};

function subscribe(fn: () => void) {
  oyentes.add(fn);
  // Another tab pudo marcar algo: el evento `storage` llega solo entre pestañas.
  const enStorage = (e: StorageEvent) => {
    if (e.key === CLAVE) fn();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", enStorage);
  return () => {
    oyentes.delete(fn);
    if (typeof window !== "undefined") window.removeEventListener("storage", enStorage);
  };
}

function guardar(marcas: Marcas) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(marcas));
  } catch {
    /* si el navegador bloquea, igual se ve en pantalla */
  }
  cacheBruto = null;
  for (const fn of oyentes) fn();
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function MarcadorConsejos({ datos }: { datos: ConsejoNuevo[] }) {
  const marcas = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [q, setQ] = useState("");
  const [fEsp, setFEsp] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [aviso, setAviso] = useState("");

  const set = useCallback((next: Marcas) => {
    guardar(next);
  }, []);

  const marcar = (i: number, v: "si" | "no") => {
    const next = { ...marcas };
    if (next[i] === v) delete next[i];
    else next[i] = v;
    set(next);
  };

  const flick = (txt: string) => {
    setAviso(txt);
    setTimeout(() => setAviso(""), 2400);
  };

  const visibles = useMemo(() => {
    const n = norm(q);
    return datos.filter((c) => {
      const est = marcas[c.i];
      if (fEsp && c.especie !== fEsp) return false;
      if (fEstado === "si" && est !== "si") return false;
      if (fEstado === "no" && est !== "no") return false;
      if (fEstado === "pend" && est) return false;
      if (n && !norm(c.consejo + " " + c.especie).includes(n)) return false;
      return true;
    });
  }, [datos, marcas, q, fEsp, fEstado]);

  const si = datos.filter((c) => marcas[c.i] === "si").length;
  const no = datos.filter((c) => marcas[c.i] === "no").length;
  const especies = useMemo(() => [...new Set(datos.map((c) => c.especie))].sort(), [datos]);

  const descargar = () => {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const linea = (dec: string, c: ConsejoNuevo) =>
      [dec, c.especie, c.consejo, c.fuente, (c.pct / 100).toFixed(2), c.legacy ?? ""]
        .map(esc)
        .join(",");
    const txt = [
      `# Decisiones sobre los ${datos.length} consejos que solo estan en la base.`,
      "# GUARDAR: pasan a la app. DESCARTAR: no pasan. PENDIENTE: sin decidir.",
      "decision,especie,consejo,fuente,parecido_pct,consejo_legacy_mas_proximo",
      ...datos.filter((c) => marcas[c.i] === "si").map((c) => linea("GUARDAR", c)),
      ...datos.filter((c) => marcas[c.i] === "no").map((c) => linea("DESCARTAR", c)),
      ...datos.filter((c) => !marcas[c.i]).map((c) => linea("PENDIENTE", c)),
      "",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "consejos_decisiones.csv";
    a.click();
    URL.revokeObjectURL(url);
    flick(`Descargado: ${si} guardar, ${no} descartar, ${datos.length - si - no} pendientes`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Consejos que solo están en la base — marcar
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {datos.length} consejos · {especies.length} especies ·{" "}
            <b>no se borra nada</b> hasta que descargues las decisiones
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar texto…"
              className="min-w-36 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
            />
            <select
              value={fEsp}
              onChange={(e) => setFEsp(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">Todas las especies</option>
              {especies.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <select
              value={fEstado}
              onChange={(e) => setFEstado(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">Todos los estados</option>
              <option value="si">Solo GUARDAR</option>
              <option value="no">Solo DESCARTAR</option>
              <option value="pend">Solo pendientes</option>
            </select>
            <button
              onClick={() => {
                const next = { ...marcas };
                let n = 0;
                for (const c of datos)
                  if (!next[c.i]) {
                    next[c.i] = "si";
                    n++;
                  }
                set(next);
                localStorage.setItem(CLAVE, JSON.stringify(next));
                flick(`${n} marcados como GUARDAR`);
              }}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:border-neutral-500 dark:border-neutral-700"
            >
              Marcar pendientes = GUARDAR
            </button>
            <button
              onClick={() => {
                guardar({});
                flick("Todo limpiado");
              }}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:border-neutral-500 dark:border-neutral-700"
            >
              Limpiar
            </button>
            <button
              onClick={descargar}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Descargar decisiones (CSV)
            </button>
            <div className="ml-auto flex gap-1.5 text-xs font-semibold">
              <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-white">{si}</span>
              <span className="rounded-full bg-red-800 px-2.5 py-1 text-white">{no}</span>
              <span
                className={`rounded-full border px-2.5 py-1 ${
                  si + no === datos.length
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                    : "border-neutral-300 dark:border-neutral-700"
                }`}
              >
                {datos.length - si - no}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-5">
        {visibles.length === 0 && (
          <p className="mt-10 text-sm text-neutral-500">Ningún consejo coincide con el filtro.</p>
        )}
        {especies.map((e) => {
          const filas = visibles.filter((c) => c.especie === e);
          if (!filas.length) return null;
          return (
            <section key={e}>
              <h2 className="mt-6 mb-2 text-sm font-bold">
                {e}{" "}
                <span className="text-xs font-normal text-neutral-500">
                  {filas.length} de {datos.filter((c) => c.especie === e).length}
                </span>
              </h2>
              {filas.map((c) => {
                const est = marcas[c.i] ?? "";
                return (
                  <div
                    key={c.i}
                    className={`mb-1.5 grid grid-cols-[auto_1fr] gap-3 rounded-lg border bg-white p-3 dark:bg-neutral-800 ${
                      est === "si"
                        ? "border-l-4 border-l-emerald-700"
                        : est === "no"
                          ? "border-l-4 border-l-red-800 opacity-55"
                          : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex gap-1 pt-0.5">
                      <button
                        onClick={() => marcar(c.i, "si")}
                        className={`h-7 w-8 rounded-md border text-xs font-semibold ${
                          est === "si"
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-neutral-300 dark:border-neutral-600"
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => marcar(c.i, "no")}
                        className={`h-7 w-8 rounded-md border text-xs font-semibold ${
                          est === "no"
                            ? "border-red-800 bg-red-800 text-white"
                            : "border-neutral-300 dark:border-neutral-600"
                        }`}
                      >
                        No
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{c.consejo}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        #{c.i} · fuente: {c.fuente}
                      </p>
                      {c.legacy ? (
                        <p className="mt-1.5 rounded-md border-l-[3px] border-neutral-300 bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                          <b>Parecido {c.pct}% en el legacy:</b> {c.legacy}
                        </p>
                      ) : (
                        <p className="mt-1.5 rounded-md border-l-[3px] border-neutral-300 bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                          Sin nada parecido en el legacy.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </main>

      {aviso && (
        <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2 text-xs text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900">
          {aviso}
        </div>
      )}
    </div>
  );
}