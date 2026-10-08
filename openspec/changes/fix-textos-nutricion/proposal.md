# Proposal

## Why

La tab Nutrición le pide al usuario que elija un fertilizante y le pone un nombre fenológico que no entiende. El selector dice «Con manguera» y «Por goteo», con la explicación «Le echas el agua al pie» y «Tienes mangueras con goteros», cuando lo que la persona va a buscar en la bodega es un fertilizante, no un modo de riego. Y cada bloque de dosis se titula «Cuando despierta», «Cuando engorda la fruta» o «Cuando se recupera»: jerga de injerto que el socio pidió quitar porque confunde y porque puede inducir a error al identificar el mes. La calendarización por meses ya está, y basta.

## What Changes

- **El selector se renombra sin cambiar su significado.** «Con manguera» pasa a «Fertilizantes granulados» y «Por goteo» a «Fertilizantes solubles». Los ids internos (`suelo`/`goteo`) no se tocan, así que la consulta al seed es idéntica. El label del grupo pasa de «Cómo le das el agua» a «Qué fertilizante usas».
- **Las descripciones largas salen de la vista.** Los `desc` de `METODOS_GUIA` («Le echas el agua al pie», «Tienes mangueras con goteros») dejan de renderizarse. Se conservan en el código como documentación del mapeo original.
- **Los títulos de momento desaparecen de la pantalla.** «Cuando despierta» / «Cuando engorda la fruta» / «Cuando se recupera» ya no se pintan. Cada bloque se titula con su rango de meses, que la cabecera a color ya muestra.
- **`proposito` sale del bloque de dosis.** El párrafo en lenguaje llano («Brota y arma hoja nueva…») también sale, según lo pedido: la calendarización por meses queda como única referencia.
- **El mismo tratamiento en la ficha espejo.** `app/(dashboard)/especie/especies/[especie]/page.tsx` tiene su propio render del programa con `{p.momento}` y las filas «Cuando despierta / engorda / recupera» (`:193-195`), y se actualiza igual.
- **`BotonLoEche` conserva el identificador interno.** El `momento` del seed se persiste en la tabla de aplicaciones y arma el `texto` del calendario agendado. Se sigue pasando `p.momento` como id; solo cambia lo que se muestra encima del botón.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `garden/especies`: la ficha SHALL identificar el tipo de fertilizante por el nombre del fertilizante («granulados» / «solubles») y no por el método de riego, y SHALL identificar cada bloque de dosis por sus meses y no por nombres de estado fenológico («cuando despierta», «cuando engorda»).

## Impact

- **Código**: `lib/agronomy/fertilizacion.ts` (`METODOS_GUIA` nombres y `desc`, `MomentoGuia.titulo`/`proposito`, `PROPOSITOS_MOMENTO`, `REPOSO_MOMENTO`), `components/especies/NutricionGuia.tsx` (`BloqueMomento`, `PanelAjuste`, el calendario que usa `m.titulo.toLowerCase()` en el `aria-label`), `app/(dashboard)/especie/especies/[especie]/page.tsx` (render espejo + filas de fenología).
- **Tests**: `tests/fertilizacion.test.ts` (extender) para los nombres nuevos, que `desc` no se renderea, y que los títulos de momento no se usan para pintar.
- **Sin migraciones de DB**: las filas ya registradas con el `momento` viejo siguen válidas porque ese string no cambia.
- **Ojo con `proposito`**: `MomentoGuia.proposito` se arma con `PROPOSITOS_MOMENTO[p.orden]`, indexado por `orden`. Si `orden` fuera a tener un valor fuera de 0-2, el `?? ""` actual ya lo cubre; quitar el campo entero lo hace innecesario.
- **Riesgo de accesibilidad**: el calendario construye el `aria-label` de cada mes con `m.titulo.toLowerCase()` (`NutricionGuia.tsx:115`). Al quitar los títulos hay que reescribir esa frase para que el lector de pantalla siga describiendo qué pasa ese mes. No puede quedar un `aria-label` mudo ni un `.join()` sobre un array vacío.