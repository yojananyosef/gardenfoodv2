# Tasks

## 1. Lo muerto

- [x] 1.1 Borrar de `lib/riego/datos.ts` las exportaciones sin consumidores: `EDADES_RIEGO`, `NIVELES_HUMEDAD`, `ZONAS_RIEGO`, `copaReferencia()` y el `Record` `COPA_REF`. Confirmar antes con `grep` que no hay ni un call-site, y después con `tsc` que al borrarlas no se rompió nadie.
- [x] 1.2 Comprobar que `calc.ts` no llama a `copaReferencia()`: usa `base.especie?.copaRefM`, que viene de `dim_especies.copa_ref_m`. Si fuera cierto, la función era un segundo lugar con el mismo número.

## 2. El motor deja de adivinar la zona

- [x] 2.1 Escribir `tests/zona-riego-catalogo.test.ts` con el `if` viejo copiado tal cual, y compararlo contra `dim_comunas.zona_riego_id` para las 20 zonas. El test debe registrar las 16 coincidencias y las 4 diferencias con su motivo, no solo pasar.
- [x] 2.2 Cambiar `RiegoInput.zonaRiego` a obligatorio y sacar el fallback a `zonaRiegoDeZonaId` en `calc.ts`. Si falta, `calcularRiego` devuelve `null` en vez de estimar una zona.
- [x] 2.3 Actualizar `EditarArbolDialog`, que es el único call-site de producción que dependía del `if`: tiene que pasar la zona de riego de la comuna del perfil.
- [x] 2.4 Actualizar `FichaEspecieView`, que hoy calcula la zona con `zonaRiegoDeZonaId`, para que la reciba del catálogo.
- [x] 2.5 Borrar `zonaRiegoDeZonaId` de `lib/riego/datos.ts`.

## 3. Los catálogos pasan a la base

- [ ] 3.1 `ZONAS` de `lib/agronomy/zonas.ts` pasa a leerse de `dim_zonas_agro` con `unstable_cache` y el mismo patrón que `getRiegoTablas()`. Las 20 zonas son 1:1; solo cambian detalles de formato (`Arica-Azapa` vs `Arica - Azapa`, `0-50` vs `0–50`, `27°C` vs `27`).
- [ ] 3.2 Revisar los consumidores de `ZONAS`: `tests/clima.test.ts`, `lib/agronomy/fertilizacion.ts`, `lib/agronomy/index.ts` y las páginas que llaman `getZonaDeComuna`. Como `resolverZonaDeComuna` es **síncrona** y la usa un hook de cliente, decidir con cuidado cómo se le pasa el catálogo; no convertir a async sin revisar los ~20 call-sites.
- [x] 3.3 `TIPOS_SUELO` sale de `lib/riego/datos.ts`. El servidor lee `gf_riego_suelos` y se lo pasa a `SueloForm` por props. `PASOS_CINTA` y `PASOS_BOLA` se quedan: son texto de quiz y no están en la base.

## 4. Verificación

- [x] 4.1 `pnpm exec tsc --noEmit` sin errores.
- [x] 4.2 `pnpm exec eslint` sin errores.
- [x] 4.3 Suite completa en verde, sin modificar ningún test existente. Los 6.787 tienen que pasar tal cual.
- [ ] 4.4 `pnpm build`.
- [x] 4.5 Preview y verificación con sesión real: `/perfil` (el quiz de suelo tiene que seguir mostrando los 4 tipos con sus factores) y el diálogo de editar un árbol (el número de riego no puede cambiar para la comuna del perfil).
- [x] 4.6 Anotar en `PENDING.md` que la caché de `riego-base` dura 7 días, para que un cambio de `dim_comunas` que no se vea no se busque en otro lado.


## Verificacion en preview

Preview `gardenfoodv2-i1vh3fuy6-jhngtrrzs-projects.vercel.app`, sesion real de
`johangutierrez@outlook.cl` (comuna Maipu, suelo F), viewport 1440x900.

**Quiz de suelo (/perfil): los 4 tipos renderizan con sus rangos correctos.**

| Tipo | Guarda | Sensacion (ahora de dim_suelos) |
|---|---|---|
| Gruesa (arenosa) | 50-100 L/m2 | "Arenoso al tacto, no forma cinta, se desarma solo." |
| Moderadamente gruesa | 108-142 L/m2 | "Forma bola pero cinta corta (menos de 2,5 cm)..." |
| Media (franca) | 125-175 L/m2 | "Forma cinta de 2,5 a 5 cm..." |
| Fina (arcillosa) | 133-200 L/m2 | "Forma cinta larga (mas de 5 cm)..." |

La columna sensacion cambio de texto: antes salia del SENSACION local y ahora de
dim_suelos.como_se_siente. Es el unico texto visible que cambia, y ahora tiene una
sola fuente.

**Dialogo de editar arbol:** no se llego a abrirlo navegando el mapa, asi que se
verifico la cadena de datos que consume, que es lo unico que cambio:

`
POSTGREST dim_comunas?comuna=ilike.Maipu  ->  { zona_riego_id: "C1", zona_agro_id: 8 }
POSTGREST gf_riego_zonas?clave=eq.C1      ->  { factor_clima: 1, desfase: 0 }
`

La zona que recibe el motor es **C1**, la misma que producia el if para la zona 8.
actor_clima: 1 sin desfase, o sea que el numero de riego no puede cambiar.
Queda pendiente abrir el dialogo a mano para el registro visual.

## Donde me deviate de la decision de arquitectura

La decision era "el servidor carga el catalogo, el cliente lo recibe por props". Dos
sitios no la podian cumplir bien y lo hice distinto, documentado en el codigo:

- **FichaEspecieSheet** pide el catalogo al abrir el sheet, no por props.
  BotonFichaEspecie se usa en muchas pantallas y el sheet casi siempre esta
  cerrado: por props, cada una pagaria 346 filas aunque nadie lo abra.
- **SueloForm** pide sus 4 filas al navegador. La pagina de perfil es un componente
  cliente, asi que no hay servidor al que pedirselas, y 4 filas no justifican
  refactorizar la pagina.

En los dos casos los datos salen de la tabla, no de una copia. Lo que cambia es
cuando se traen.
## Workflow follow-up

- **Fase 2**: `lib/agronomy/comunas.ts` y `lib/agronomy/zonas.ts` con las 346 comunas, más el plumbing de los componentes cliente. Los datos ya están verificados equivalentes.
- **Fase 3 en adelante**: los módulos de contenido, uno por uno, con las decisiones ya tomadas por el usuario (consejos del Excel v3; razón de viabilidad derivada de las tablas).
- `lib/agronomy/fichas.ts` (10.350 líneas) sigue siendo el mayor bloque de texto hardcodeado. Ahora tiene fuente de verdad (`fact_ficha_riego`, `fact_ficha_fertilizacion`, `fact_tareas_mes`), así que partirlo dejó de ser una necesidad de datos.
- Si algún día se retoma Mercado Pago, `gf_subscription_plans` hay que rehacerla: sus `tier` (`cosecha`, `huertero`, `full`) no coinciden con los valores de `perfiles.plan`. Está anotado en la sección de decisiones del usuario de `PENDING.md`.