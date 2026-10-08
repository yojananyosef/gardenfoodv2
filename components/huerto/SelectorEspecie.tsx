import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ESPECIES } from "@/lib/agronomy";

/**
 * Selector de especie para plantar, fuera del mapa.
 *
 * Antes vivía dentro de la barra condicional «Agregando», con `w-32 min-h-9`
 * (~128×36 px): un control de 36 px de alto en una pantalla donde el usuario va
 * a tocar el mapa con el dedo. WCAG 2.2 pide 24 px como mínimo absoluto y la
 * propia guía del repo pide 48; el selector grande es de 48.
 *
 * Vive acá y no dentro del mapa por dos razones:
 *
 * - Aparece SIEMPRE, no solo mientras se está agregando. Elegir la especie es la
 *   decisión previa a plantar; pedirla en el momento de tocar el terreno obliga a
 *   volver atrás con la mano llena de tierra.
 * - Es el control que decide qué se planta. Ocultarlo detrás de un modo «Agregar
 *   árboles» lo convierte en algo que hay que descubrir.
 *
 * Recibe la especie activa y su setter como props en vez de leer estado propio:
 * el estado vive en `WorkbenchModular`, que es quien sabe si hay huertos y quién
 * puede plantar. Duplicarlo acá haría que los dos se desincronicen.
 */
export function SelectorEspecie({
  valor,
  onChange,
  deshabilitado = false,
  className = "",
}: {
  /** `dbKey` de la especie activa. */
  valor: string | null;
  onChange: (dbKey: string | null) => void;
  /** `true` mientras no hay huerto que plantar. */
  deshabilitado?: boolean;
  className?: string;
}) {
  const especies = ESPECIES;
  const nombreDe = (key: string | null) =>
    especies.find((e) => e.dbKey === key)?.nombre ?? "Elige especie…";

  return (
    <Select
      // Base UI decide en el primer render si el Select es controlado, y
      // cambiarlo después lanza el aviso de React. Con `valor ?? undefined`
      // arrancaba sin selección (no controlado) y al elegir una especie pasaba
      // a controlado. Se manda siempre string: controlado desde el inicio, y
      // `""` es el valor de «nada elegido», que es un estado real y visible.
      value={valor ?? ""}
      onValueChange={(v) => onChange(v === "" ? null : v)}
      disabled={deshabilitado || especies.length === 0}
    >
      <SelectTrigger
        // min-h-12 = 48 px: el target táctil del selector grande.
        className={`min-h-12 w-full ${className}`}
        aria-label="Especie para plantar"
      >
        <SelectValue>{(v: string | null) => nombreDe(v)}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {especies.map((e) => (
          <SelectItem key={e.dbKey} value={e.dbKey}>
            {e.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}