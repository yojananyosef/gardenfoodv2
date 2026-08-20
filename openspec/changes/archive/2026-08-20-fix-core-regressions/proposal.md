## Why

GardenFood V2 reconstruyó el producto core (mobile-first-ux) y la capa ad-tech, pero quedaron 6 regresiones/bugs que degradan la experiencia y la integridad del producto: un middleware de auth nunca fue cableado (las páginas del dashboard se muestran en blanco en vez de redirigir), el registro guarda una zona hardcodeada y comunas no validadas (rompiendo las alertas del huerto), el refresh automático de audiencias apunta a una Edge Function inexistente, la tabla `gf_arboles` quedó huérfana, `/perfil` no edita la ubicación del usuario, y el modal CMP no permite rechazar todo. Se corrigen en orden de urgencia.

## What Changes

- **1. Middleware de auth cableado** — se registra un `middleware.ts` que protege las rutas del dashboard y redirige a `/login` (o a `/registro` desde `/login` si ya hay sesión) en vez de renderizar páginas en blanco.
- **2. Registro con ubicación válida** — el registro deja de hardcodear `zona_agroclimatica: "central"` y valida `region`/`comuna` contra el catálogo de 245 comunas, derivando la zona agroclimática correcta.
- **3. Refresh de audiencias operativo** — el `pg_cron` (0007) apunta a un endpoint real y existente; se añade un botón en el admin para disparar el refresh manual.
- **4. Módulo `gf_arboles` conectado** — se añaden Server Actions y UI para el inventario de árboles individuales del legacy.
- **5. `/perfil` edita ubicación** — el perfil permite actualizar región/comuna/zona y persiste en `perfiles`.
- **6. CMP con "Rechazar todo"** — el modal de consentimiento es descartable y ofrece rechazo total sin otorgar consentimiento.

## Capabilities

### New Capabilities
- `garden/auth`: Protección de rutas por middleware, validación de ubicación en el registro y edición de perfil/ubicación del usuario.
- `garden/agronomy-data`: Validación de región/comuna contra el catálogo de 245 comunas y derivación de zona agroclimática.
- `garden/huerto`: Gestión del inventario de árboles individuales (`gf_arboles`) con Server Actions y UI.

### Modified Capabilities
- `adtech/audiences`: El refresh periódico de audiencias debe resolverse contra un endpoint real y operativo del proyecto (no una Edge Function localhost inexistente).
- `adtech/consent`: El flujo de onboarding debe permitir rechazar todas las finalidades sin otorgar consentimiento.

## Impact

- **Auth/rutas**: nuevo `middleware.ts` en la raíz; posible ajuste de `proxy.ts` (hoy código muerto) o reemplazo.
- **Registro**: `app/(auth)/registro/page.tsx` deja de hardcodear zona; usa `lib/agronomy/comunas.ts`.
- **Audiencias**: migración 0007 (`gf_cron_config`) repuntaada al endpoint `/api/v1/admin/audiences/refresh` real; nuevo botón en `app/(dashboard)/admin/audiencias`.
- **Huerto/árboles**: nuevas Server Actions en `lib/huerto/actions.ts`, componentes y ruta bajo `/huerto`.
- **Perfil**: `lib/auth` gana acción de update de ubicación; `app/(dashboard)/perfil` gana formulario.
- **CMP**: `components/cmp/ConsentModal.tsx` gana cierre/rechazo total.
- Sin nuevas dependencias.
