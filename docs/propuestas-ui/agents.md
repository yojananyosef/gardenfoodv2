# Reglas de estilo — Prototipos wireframe (docs/propuestas-ui)

Estas reglas aplican SOLO a los prototipos/wireframes de esta carpeta (propuesta-a/b/c.html e index.html). No aplican al código real de la app Next.js.

- **Color:** estricto blanco y negro/escala de grises. Botones primarios: fondo #333 con texto blanco. Links secundarios: mismo color del texto, siempre subrayados.
- **Fuentes:** 'Patrick Hand' / 'Caveat' / 'Comic Neue' (Google Fonts). Escala tipográfica Third Mayor: xs 14 / sm 18 / base 22 / md 28 / lg 35 / xl 44. Nunca bajo 13px.
- **Bordes sketchy:** `border: 2px solid #333; border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px; background: white;` en contenedores.
- **Botones:** plain `<button>` con el borde sketchy (NO `<wired-button>` — no acepta relleno). `<button class="btn-primary">` oscuro, `.btn-secondary` blanco.
- **Componentes interactivos:** usar `wired-elements` (CDN `https://unpkg.com/wired-elements?module`): wired-input, wired-combo, wired-checkbox, wired-toggle, wired-card (con `style="background: white"`), wired-tabs, etc.
- **Iconos:** nunca emoji. SVG inline estilo doodle (react-doodle-icons en React; SVG inline en vanilla). Buscar oportunidad de icono en cada nav, CTA, stat, alerta y heading.
- **Fondo:** papel cuadriculado `radial-gradient(#d7d7d7 1px, transparent 1px)` 20px.
- **Arquitectura:** SPA vanilla — pantallas como `<div class="screen" id="...">` con JS de navegación (sin router).
- **Copy:** texto realista en español chileno, nada de lorem ipsum.
