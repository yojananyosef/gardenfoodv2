# Proposal

## Why

`lib/riego/datos.ts` y `lib/agronomy/zonas.ts` siguen declarando a mano los factores agronómicos que la base ya tiene. Es la última duplicación del camino del riego.

Medí los dos lados antes de tocar nada, y el resultado no fue el que esperaba:

**Cuatro exportaciones no las usa nadie.** `EDADES_RIEGO`, `NIVELES_HUMEDAD`, `ZONAS_RIEGO` y `copaReferencia()` están exportadas y no hay ni un call-site. Duplican `gf_riego_edad`, `gf_riego_humedad`, `gf_riego_zonas` y `dim_especies.copa_ref_m`, que ya se cargan en `getRiegoTablas()` y `getRiegoEspecie()`.

**El resto sí coincide.** `TIPOS_SUELO` y `ZONAS` tienen los mismos valores que `gf_riego_suelos` y `dim_zonas_agro`. Los factores que alimentan el motor —`factor`, `agua_min_mm`, `agua_max_mm`, `factor_clima`, `txMax`, `tnMin`, `pp`— son idénticos, así que moverlos no cambia un dígito que el usuario vea. La prosa tiene diferencias menores de redacción.

**Y el `if` hardcodeado se puede borrar.** `zonaRiegoDeZonaId()` son 14 líneas de `if` anidados que traducen zona agroclimática (1..20) a zona de riego. `dim_comunas.zona_riego_id` guarda exactamente esa relación, fila por comuna. Lo comparé:

| | Resultado |
|---|---|
| Zonas donde coinciden | **16 de 20** |
| Usuarios reales afectados | **ninguno**: Maipú da C1 en ambos caminos, Coihueco da S1 en ambos |

Las 4 zonas que difieren (1, 5, 9, 17) difieren porque **el `if` adivina a nivel de zona y la tabla sabe a nivel de comuna**: dentro de una misma zona hay comunas con distinta zona de riego. Donde no coincide, la tabla tiene la respuesta agronómicamente correcta.

Este es el defecto B6 que el propio plan marca como el más frágil del módulo.

## What Changes

- **Se borran cuatro exportaciones muertas** de `lib/riego/datos.ts`: `EDADES_RIEGO`, `NIVELES_HUMEDAD`, `ZONAS_RIEGO` y `copaReferencia()`. Sin cambios de comportamiento: no tenían consumidores.
- **`TIPOS_SUELO` pasa a leerse de `gf_riego_suelos`**, que es una vista sobre `dim_suelos`. Lo entrega el servidor por props, según la decisión de arquitectura tomada.
- **`zonaRiegoDeZonaId()` desaparece.** El motor `calc.ts` ya acepta `zonaRiego` explícito, así que el `if` era un fallback que solo usaba un call-site de producción. Ahora `EditarArbolDialog` y `FichaEspecieView` pasan la zona de riego que viene de `dim_comunas`, y el motor deja de depender de un mapa escrito a mano.
- **`ZONAS` pasa a leerse de `dim_zonas_agro`** (20 zonas, 1:1 con las del código).

### Lo que NO cambia

- `PASOS_CINTA`, `PASOS_BOLA` y `BALDE_L` se quedan: son texto de quiz y una constante de unidad, no están en la base ni corresponde tenerlos.
- `lib/agronomy/comunas.ts` sigue con sus 346 comunas hardcodeadas. Es la Fase 2: los datos son equivalentes, pero pasarlos exige resolver cómo llegan a los componentes cliente, y eso toca ~20 call-sites.
- Los módulos de contenido (`consejos`, `fenologia`, `viabilidad`, `fertilizacion`, `especies`, `fichas`) no se tocan.

## Capabilities

### Modified Capabilities

- `garden/agronomy-data`: los factores agronómicos de referencia dejan de estar escritos a mano en TypeScript. Una constante sin consumidores que duplica una tabla es el caso más fácil de la duplicación y el más fácil de resolver.

- `garden/especies`: la zona de riego de la ficha deja de estimarse con un `if` sobre el número de zona y pasa a leerse de la tabla de comunas, que la conoce a nivel de comuna y no de zona.

## Impact

- **Runtime**: `lib/riego/datos.ts` baja de 161 líneas a un archivo de tipos y texto de quiz. `lib/agronomy/zonas.ts` deja de ser un catálogo y pasa a consumir la tabla.
- **Tests**: los 6.787 siguen verdes. Se añaden pruebas de equivalencia entre el `if` viejo y la tabla, para dejar registrado que las 16 coincidencias eran coincidencias y no casualidad.
- **Sin migraciones.** Los datos ya están en la base desde `import-base-maestra`.
- **Riesgo**: `EditarArbolDialog` es el único call-site de producción que depende del `if`, así que es el único que puede cambiar un número. Se verifica con la comuna real del perfil de prueba.
- **Ojo con el caché**: `lib/riego/actions.ts` cachea 7 días con el tag `riego-base`. Si un cambio de datos no se ve, es eso, no un error.