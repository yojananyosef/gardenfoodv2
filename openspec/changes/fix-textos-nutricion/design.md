# Design

## Context

Dos superficies renderizan el programa de fertilización y ambas usan `p.momento` del seed como título visible:

- `components/especies/NutricionGuia.tsx` — la tab visual con calendario de 12 meses.
- `app/(dashboard)/especie/especies/[especie]/page.tsx` — el render servidor del módulo de huerto, con su propia copia del recorrido por momentos (`:118-176`) y las filas de fenología de la guía (`:193-195`).

Los nombres vienen de `supabase/fertilizacion_seed.json`, campo `momento`, con tres valores: «Cuando despierta», «Cuando engorda la fruta», «Cuando se recupera». Son la transcripción literal de las hojas del XLSX.

El campo cumple dos papeles distintos que este change separa:

1. **Identificador de agrupación.** `orden` (0/1/2) decide qué color tiene cada mes del calendario, qué token `--momento-N` se usa, y qué `PROPOSITOS_MOMENTO[orden]` se muestra. Eso no se toca.
2. **Texto visible.** Lo que sale en pantalla. Eso se elimina.

Restricciones que moldean el enfoque:

- `momento` se persiste. `BotonLoEche` lo manda a `registrarAplicacion` (`lib/huerto/actions.ts:406`), que lo guarda en la tabla de aplicaciones y lo concatena al `texto` de la entrada de calendario agendada (`:472`). Hay filas ya escritas con esos strings.
- El calendario construye el `aria-label` de cada mes con `m.titulo.toLowerCase()` (`NutricionGuia.tsx:115`), encadenando los títulos de los momentos que tocan ese mes. Si se quita `titulo`, esa frase se cae entera.
- `MomentoGuia.titulo` se arma en `momentosVisibles` (`lib/agronomy/fertilizacion.ts:272`) con `titulo: p.momento`. Los tests de `tests/fertilizacion.test.ts` no lo lápidean hoy.

## Goals / Non-Goals

**Goals:**
- Que el nombre visible del selector sea el del fertilizante, conservando el significado interno del selector.
- Que ningún texto de estado fenológico del XLSX quede en pantalla.
- Que el calendario siga siendo accesible por lector de pantalla después de quitar los títulos.
- Que las filas ya registradas en la tabla de aplicaciones sigan renderizando bien.

**Non-Goals:**
- No se cambia el seed ni el XLSX. `momento` sigue siendo el identificador de agrupación y el valor persistido.
- No se toca la vinculación perfil→zona (`fix-vincular-perfil-zona`), ni el orden de `/huerto` (`fix-huerto-ir-al-grano`), ni el clima (`add-clima-pronostico`).
- No se renombra el campo del seed. Renombrar `momento` a algo más neutro (por ejemplo `etapa`) sería más limpio a futuro, pero obliga a tocar el script de generación, la tabla de aplicaciones y las filas históricas. Queda para cuando llegue el Excel unificado, donde el seed se regenera de todos modos.

## Decisions

### 1. `METODOS_GUIA` conserva los ids, cambia los nombres

```ts
export const METODOS_GUIA = [
  { id: "suelo", nombre: "Fertilizantes granulados", desc: "…" },
  { id: "goteo", nombre: "Fertilizantes solubles", desc: "…" },
] as const;
```

`id` sigue siendo `suelo`/`goteo` porque es la clave con la que se consulta `programaDeEspecie`, y `desc` sigueviviendo en el tipo mantiene la trazabilidad de que el programa del XLSX está etiquetado por método de riego aunque la interfaz no lo muestre.

**Alternativa descartada:** cambiar `id` a `granulado`/`soluble`. Se descartó porque `metodo` se pasa a `guiaRegional(dbKey, region, metodo)` que lo compara contra `p.metodo` del seed (`"suelo"`/`"goteo"`), y cambiar el id obligaría a un mapeo en el límite sin ganar nada: el nombre visible es lo único que pidió el socio.

### 2. `desc` se queda en los datos, sale del render

`desc` no se borra de `METODOS_GUIA`. Sale de `PanelAjuste` (`NutricionGuia.tsx:445`), que es donde hoy se pinta el `<span className="text-[11px]">`. Es el texto que pidió quitar («Le echas el agua al pie», «Tienes mangueras con goteros»).

Mantenlo en los datos sirve para dos cosas: si algún día hace falta un tooltip o un texto de ayuda, no hay que reconstruirlo; y deja escrito quéSignifica cada programa del XLSX, que es el único lugar donde esa equivalencia queda documentada.

### 3. `MomentoGuia.titulo` y `.proposito` se eliminan del tipo

No quedan como campos opcionales: si se dejaran, el próximo que escriba un componente volvería a usarlos y la jerga fenológica reaparecería. Se borran del tipo, de `momentosVisibles`, y con ellos `PROPOSITOS_MOMENTO` y `REPOSO_MOMENTO`.

`REPOSO_MOMENTO` es el caso raro: es el texto del bloque sin productos (`NutricionGuia.tsx:336`), que es el único lugar donde se explica qué pasa en los meses sin abono. Se reemplaza por una frase de una línea que use meses en vez de estados («En estos meses no se abona»). No es el mismo problema de la jerga —no dice «cuando despierta»— pero el texto original («el árbol descansa y la tierra guarda lo que le diste») es el mismo tono poético que el socio pidió recortar.

### 4. El título del bloque pasa a ser `mesesTexto`, y el calendario se reescribe

`momentosVisibles` deja de exponer `titulo`. `BloqueMomento` (`NutricionGuia.tsx:305-341`) titula con `mesesTexto` en la cabecera a color, y el `<p>` de `mesesTexto` que ya estaba debajo se va, porque quedaría duplicado.

El `aria-label` de cada mes (`:110-118`) no puede seguir composing con títulos. Pasa a describir el mes por sus meses: «Julio: Jul y Ago» cuando hay un momento, «Julio: no se abona» cuando no. La función `nombreDe(mes)` sigue siendo pura y testeable.

**Alternativa descartada:** derivar del color un nombre («momento 1»). Se descartó porque el calendario ya numera los bloques del 1 al 3 en la cabecera a color, y el `aria-label` tiene que describir el mes, no repetir el índice del bloque.

### 5. La ficha espejo se actualiza en el mismo commit

`app/(dashboard)/especie/especies/[especie]/page.tsx:128` y `:193-195` muestran lo mismo que la tab visual. Si solo se arregla `NutricionGuia`, la jerga sigue visible en la otra ruta, que es la que abre el módulo de huerto. Se cambian en el mismo change.

`BotonLoEche` sigue recibiendo `p.momento` como id persistido (`:159-160`). Lo que se cambia es el texto del `producto` por defecto cuando el momento no tiene productos: hoy es `Programa casero ${p.momento}`, que metería la jerga en la base de datos. Pasa a componerse con los meses del momento en vez de con `p.momento`.

## Risks / Trade-offs

- **[Las filas de aplicaciones ya registradas muestran la jerga]** → Se quedan como están. Son texto histórico que el usuario escribió indirectamente al usar la app, y los casos de uso reales («cuando engorda la fruta · Urea (Duraznero)») se leen bien. Cambiar el historial exigiría una migración de datos sobre texto libre, con más riesgo que beneficio.

- **[`desc` sin render se vuelve código muerto]** → Se mitiga con el comentario en `METODOS_GUIA` que dice explícitamente que se conserva a propósito como documentación del mapeo del XLSX. Si el linter lo marca, se documenta la excepción en `PENDING.md`.

- **[El `aria-label` reescrito puede sonar peor que el viejo]** → «Julio: Jul y Ago» es menos claro que «Julio: cuando engorda la fruta y ago». Se mitiga porque el calendario es visual y el bloque de dosis ya da los meses con nombre largo; el `aria-label` es el resumen, no la única fuente. Hay que probarlo con un lector de pantalla en el grupo 5.

- **[Quitar `proposito` deja `PROPOSITOS_MOMENTO` huerfano en `momentosVisibles`]** → Se borra en el mismo commit; si no, `pnpm lint` lo reclama por el campo que ya no existe en el tipo.

- **[Dos superficies que se pueden desincronizar]** → Se agrega una tarea de verificación que recorra las dos rutas en el grupo 5, porque el repo ya tiene historial de que estas copias quedan distintas (`grep 'momento'` sobre ambas en el mismo commit).