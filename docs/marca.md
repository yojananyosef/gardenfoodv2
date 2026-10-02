# Marca

La marca de GardenFood es el hortelano (pala + chupalla + horcón sobre dos hojas).
Este documento explica de dónde salen los archivos y por qué el logo parece
centrado cuando no lo está.

## Archivos

| Archivo | Qué es | Se genera con |
| --- | --- | --- |
| `scripts/marca-source.png` | Raster original del diseñador, 512×441, tal cual. **No editar.** | a mano |
| `public/logo-mark.png` | Logo base que pinta `<BrandMark />` en la app | `generate-marca.mjs` |
| `app/icon.png`, `app/apple-icon.png` | Favicon e ícono de iOS | `generate-marca.mjs` |
| `app/favicon.ico` | Frames 16/32/48 | `generate-marca.mjs` |
| `public/icons/*` | Íconos PWA del manifest, incluido el maskable | `generate-marca.mjs` |
| `public/og.png` | Tarjeta para redes sociales, 1200×630 | `patch-og-marca.mjs` |

Para regenerar todo:

```bash
pnpm marca
```

Eso corre los tres scripts en orden. `pnpm marca:check` solo verifica.

## El bug que había

El logo se veía cargado a la derecha. La causa no era el CSS ni el layout: era
el encuadre del raster.

`marca-source.png` tiene la marca visible en **x = 87..469**, pero además trae un
**artefacto de 2×5 px con alpha 34/255 (~13% de opacidad)** en (41..45, 291..292),
separado del resto por 41 px de vacío. El commit `a4f78d3` ("aire interno en el
logo para que no se vea cortado") paddeó el canvas a 41/41 de márgenes porque midió
el *bounding box del canal alfa*, que incluye ese fantasma.

El resultado era un archivo que **parecía** centrado y no lo estaba:

| Medición | Antes | Ahora |
| --- | --- | --- |
| Márgenes reales L/R del logo base | 87 / 42 | 65 / 64 |
| Centro de masa, desvío en X | **+4.45 %** | +0.32 % |
| Centro de masa, desvío en Y | −7.07 % | −4.13 % |
| `app/icon.png`, desvío en X | **+19.4 px** | +1.1 px |
| `favicon.ico` 32px, desvío en X | +2 px | −0.5 px |

Los derivados heredaban el problema *y* su tamaño: el padding fantasma ocupaba
58.8 % del tile, así que la marca visible salía más chica de lo que debía y
descentrada.

## Por qué el CSS no lo arreglaba

`BrandMark` pinta el logo en una caja cuadrada `size-8` con `object-contain`. El
arte es 512×441, más ancho que alto, así que `object-contain` lo ajusta al
**ancho**: ocupa los 28 px completos del contenido y no queda holgura horizontal.
`object-position` no tiene nada que desplazar. La única corrección posible era un
`translate`, que a 32 px vale **1.25 px** y además hay que calibrar distinto para
cada tamaño (`size-7` en el footer, `size-8` en el header). Mover el arte dentro
del canvas escala solo y no depende del tamaño de la caja.

## Cómo se decide el corrimiento

`limpiarYDesplazar()` no usa números mágicos de margen:

1. **Arma una máscara** con los píxeles sobre alpha 24 y la etiqueta por
   componentes conexos. Se queda con los de área ≥ 200 px — el artefacto son ~6 px,
   la marca real miles. La máscara filtrada además **borra** el ruido.
2. **Mide el bbox** de lo que quedó, que es el de la marca real.
3. **dx** lleva ese bbox al centro del canvas. Se usa el extent y no el centro de
   masa porque el extent es lo que el ojo compara contra el borde de la tarjeta.
4. **dy** suma el nudge óptico de abajo.

### El nudge vertical es de gusto, no de medición

El extent vertical ya estaba bien: 36 px arriba, 38 abajo. Lo que se veía alto era
el **centro de masa** (−7 %), porque arriba pesa pala + sombrero + horcón y abajo
la figura converge en dos hojas finitas.

Corregir el centro de masa completo (mover +7 %) deja la punta del "V" pegada al
borde de la tarjeta. `NUDGE_Y = 0.027` en `scripts/marca.mjs` es el punto medio
que se ve balanceado. **Si hay que tocarlo, es ese número y no otro.**

## Composición de los derivados

Los tiles son crema `#eee8d3` con la marca centrada. El tamaño se fija como
*ancho de la marca real como fracción del tile*, medido sobre los archivos
anteriores, para que recentrar **no cambie el peso visual** del icono:

- `MARCA_EN_TILE = 0.588` — tiles normales
- `MARCA_EN_TILE_MASKABLE = 0.484` — respeta la safe zone circular de Android

### La tarjeta OG se parchea, no se regenera

`public/og.png` se compone de la marca más un lockup con wordmark y dos líneas de
texto. `scripts/og-source.svg` ya no describe lo que hay en el archivo, así que no
hay fuente de la que regenerarla, y rerenderizar el texto con librsvg cambiaría las
tipografías. Como el fondo es crema plano, `patch-og-marca.mjs` borra la caja de
la marca y la recompone, **sin tocar el texto**: la caja nueva es
`[116, 504]`, el mismo espacio horizontal que ya ocupaba.

## Los scripts viejos

`scripts/generate-icons.mjs`, `scripts/icon-source.svg` y `scripts/og-source.svg`
describen **otro logo** —un brote de dos hojas sobre gradiente verde— y no
generan ninguno de los archivos que hay en el repo. Quedaron desincronizados en el
commit `a2a2e39`, cuando la marca pasó a ser el hortelano. `pnpm marca` los
reemplaza. Se pueden borrar en un cambio aparte.
