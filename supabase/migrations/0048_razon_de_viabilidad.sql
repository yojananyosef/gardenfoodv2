-- 0048_razon_de_viabilidad: la explicacion vive al lado del veredicto
--
-- `lib/agronomy/viabilidad.ts` guarda, para cada (especie, zona), un veredicto
-- Y una razon: `4: { v: "si", razon: "Viable" }`. La tabla
-- `fact_viabilidad_zona` trae el veredicto y no la razon.
--
-- Que se agrega acá es SOLO la columna, vacia. Ningun cambio de comportamiento:
-- el codigo sigue leyendo el array de siempre, asi que esto no toca produccion
-- ni se nota.
--
-- POR QUE
-- -------
--
-- Al comparar los dos lados (`scripts/comparar_viabilidad_consejos.mjs`):
--
--   600 filas en la base, 551 entradas en el codigo.
--   1 cambio real de veredicto: `olivo` en la zona 20, codigo `no`, base `SI`.
--   87 combinaciones que el codigo no tiene, casi todas de la zona 1. Y
--   `lib/agronomy/index.ts:99` hace `if (!viab) continue`, o sea que una
--   entrada ausente no da error: la especie simplemente no aparece. Por eso
--   esas 87 estan ocultas hoy y nadie lo vio.
--
-- Las razones son 90 textos distintos para 600 entradas, y 280 son
-- literalmente "Viable". No son 600 textos que haya que mantener: son 90.
--
-- Con la razon en la tabla, el veredicto y su explicacion viajan juntos, y
-- queda disponible para el motor sin depender de un array de 668 lineas.
--
-- LO QUE NO SE HACE ACA
-- ---------------------
--
-- No se migra el consumo. Las diferencias que quedaron documentadas y que
-- decides tu:
--
--   1. Las 87 combinaciones ausentes. Poblarlas cambia que especies se
--      recomiendan por zona. No es higiene, es una decision de producto.
--   2. El veredicto de `olivo` en la zona 20.
--   3. `fact_consejos` tiene 211 consejos de "Base 20 especies" y el codigo
--      tiene otros 154, con 1 solo en comun. Cual fuente manda es tuyo.
--
-- Hasta que se decida, el codigo sigue leyendose a si mismo y esta columna es
-- un deposito: no cambia lo que ve el usuario.

begin;

alter table fact_viabilidad_zona add column if not exists razon text;

comment on column fact_viabilidad_zona.razon is
  'Por que la especie es viable, de riesgo o no en esta zona. Poblada desde '
  'lib/agronomy/viabilidad.ts (0048). Queda en null en las combinaciones que el '
  'array no cubria, que son casi todas las de la zona 1.';

commit;