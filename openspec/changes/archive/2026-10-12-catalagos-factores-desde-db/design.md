# Design

## Context

Después de `import-base-maestra`, la base tiene los factores en `dim_suelos`, `dim_edad`, `dim_humedad`, `dim_zonas_riego`, `dim_zonas_agro` y `dim_especies.copa_ref_m`, y `gf_riego_*` quedó como vista sobre ellos. `lib/riego/actions.ts` ya los carga por `getRiegoTablas()` con caché de 7 días.

Lo que queda hardcodeado está en dos archivos. La medición previa al cambio dio esto:

| Export | Líneas | Consumidores | ¿Coincide con la tabla? |
|---|---|---|---|
| `EDADES_RIEGO` | ~15 | **0** | irrelevant, está muerta |
| `NIVELES_HUMEDAD` | ~15 | **0** | irrelevant, está muerta |
| `ZONAS_RIEGO` | ~14 | **0** | irrelevant, está muerta |
| `copaReferencia()` | ~18 | **0** | irrelevant, está muerta |
| `TIPOS_SUELO` | ~50 | 1 (`SueloForm`) | sí, en los factores |
| `zonaRiegoDeZonaId()` | ~14 | 2 | **16 de 20 zonas** |
| `ZONAS` (zonas.ts) | ~230 | 6 | sí, 1:1 |

## Goals / Non-Goals

**Goals**

- Que ningún factor agronómico esté escrito a mano en TypeScript.
- Que el motor no dependa de un mapa de zonas escrito a mano.
- Que el cambio no altere ningún número que el usuario vea, salvo en las comunas donde el `if` estimaba y la tabla sabe.

**Non-Goals**

- `lib/agronomy/comunas.ts` y sus 346 entradas: es la Fase 2, con su propia decisión de plumbing.
- `PASOS_CINTA`, `PASOS_BOLA`, `BALDE_L`: texto de quiz y constante de unidad, sin equivalente en la base.
- Los módulos de contenido.

## Decisions

### D1 · Se borra lo muerto sin más ceremonia

Cuatro exportaciones sin un solo consumidor. No necesitan migración ni adapting: se borran y el compilador confirma que nadie las usaba.

`copaReferencia()` es el caso interesante: calculaba la copa de referencia por especie con un `Record` de 13 entradas. `dim_especies.copa_ref_m` ya trae ese valor y `getRiegoEspecie()` lo lee, y `calc.ts` lo usa en la línea 65. Es decir, el motor **ya no usa** la función; la función era un segundo lugar donde vivía el mismo número.

### D2 · El motor exige la zona de riego, no la adivina

`calc.ts:51` hoy es:

```ts
const zonaId: ZonaRiegoId = input.zonaRiego ?? zonaRiegoDeZonaId(input.zonaId);
```

El fallback existe para los llamadores que solo saben el número de zona. Pero hay **un solo** call-site de producción que lo usa: `EditarArbolDialog` pasa `zonaId` y no `zonaRiego`. La ficha ya pasa `zonaRiego` explícito desde `unify-motor-en-app`.

**Elegido:** `zonaRiego` pasa a ser obligatorio en `RiegoInput`. El motor no puede elegir la zona: si no le la dan, devuelve `null` en vez de estimar. Eso convierte un default silencioso en un dato faltante declarado, que es el criterio del proyecto.

**Consecuencia:** `EditarArbolDialog` necesita la zona de riego de la comuna del usuario. La tiene: `dim_comunas` la guarda, y el diálogo ya recibe el perfil.

### D3 · El `if` y la tabla coinciden en 16 de 20 zonas, y no es casualidad

Comparé el `if` contra `dim_comunas.zona_riego_id` para las 20 zonas. Las 4 que difieren (1, 5, 9, 17) se explican porque el `if` decide por zona y la tabla decide por comuna:

| Zona | `if` | Tabla (modo) | Por qué |
|---|---|---|---|
| 1 Arica-Azapa | N1 | N2 (1 de 2 comunas) | la zona tiene 2 comunas y una es N2 |
| 5 Valparaíso-Quillota | C2 | C1 (8 de 13) | la mayoría es costa C1 |
| 9 Cordillera | C2 | C1 (3 de 3) | la tabla **no tiene** C2 en esa zona |
| 17 Osorno-Los Lagos | S2 | C2 (4 de 5) | la mayoría es centro-sur |

Donde discrepan, la tabla tiene el detalle por comuna y el `if` una regla gruesa. **Los dos usuarios reales quedan idénticos**: Maipú → C1 y Coihueco → S1 en ambos caminos.

Ese detalle queda en un test, no en un comentario: si alguien vuelve a escribir el `if`, el test falla y el motivo queda a la vista.

### D4 · `TIPOS_SUELO` llega por props, no por fetch del cliente

`SueloForm` es un componente cliente. Según la decisión de arquitectura, el servidor lee `gf_riego_suelos` y lo pasa como prop. Son 4 filas, no 346: el costo en el HTML es despreciable y evita un roundtrip.

`PASOS_CINTA` y `PASOS_BOLA` siguen viniendo del módulo, porque son texto de interfaz y no están en ninguna tabla.

## Risks / Trade-offs

**[R1] · `EditarArbolDialog` puede cambiar un número.** → Es el único call-site que dependía del `if`. Se verifica en preview con la comuna real del perfil de prueba y se anota el antes y el después.

**[R2] · `dim_comunas.zona_riego_id` es un dato de referencia nuevo.** → No estaba en el código: el `if` era la única fuente. Si esa columna tuviera una comuna mal cargada, la app mostraría una zona de riego equivocada sin avisar. Mitigación: el test de equivalencia lista las 4 zonas donde difieren, para que si el dato cambia se note en el diff y no en pantalla.

**[R3] · Romper un call-site que hoy compila.** → `tsc --noEmit` y los 6.787 tests.

**[R4] · La caché de 7 días.** → Si un cambio de `dim_comunas` no se ve en la app, es `unstable_cache` con `revalidate: 604800`, no un error. Queda anotado en `PENDING.md`.

## Migration Plan

Sin migración ni despliegue de base.

1. Borrar las cuatro exportaciones muertas y `zonaRiegoDeZonaId`.
2. `RiegoInput.zonaRiego` pasa a obligatorio; el motor deja de estimar.
3. `ZONAS` pasa a leerse de `dim_zonas_agro`.
4. `SueloForm` recibe los suelos por props.
5. Test de equivalencia `if` viejo contra tabla.
6. `tsc`, `eslint`, `build`, suite completa.
7. Deploy y verificación visual del diálogo de árbol y del perfil.