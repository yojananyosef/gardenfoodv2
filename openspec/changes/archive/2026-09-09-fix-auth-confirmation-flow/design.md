## Context

El registro usa `supabase.auth.signUp` desde el cliente (lib/supabase/client) en `app/(auth)/registro/page.tsx` sin `emailRedirectTo`; no existe `app/auth/` ni ningún `exchangeCodeForSession` en el repo. El middleware vive en `proxy.ts` con whitelist exacta de rutas públicas — todo lo demás (`esRutaProtegida`) redirige anónimos a `/registro?next=`. Las sesiones SSR van en cookies via `lib/supabase/server.ts` (cliente cookie-based con `next/headers`). El login tiene imports sin usar y un link de recuperación `href="#"`. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Confirmación de registro operativa en dev y producción sin hardcodear dominios.
- Reset de contraseña completo (solicitar → confirmar por email → fijar nueva clave).
- Superficie de redirección cerrada (anti open-redirect).
- Lint limpio en las páginas tocadas.

**Non-Goals:**
- OAuth (Google/Apple), 2FA, gestión de sesiones multi-dispositivo (deuda existente, otro change).
- Cambiar el gating del funnel (anónimo → `/registro?next=`) más allá de la whitelist necesaria.
- Migración a server actions para auth (los formularios client-side con el browser client son el patrón actual del grupo `(auth)`).
- Endurecimiento de contraseñas (leaked-password-protection) — es config de Auth, se cubre en Fase 1 legal.

## Decisions

1. **PKCE + route handler server** (`app/auth/confirm/route.ts`) con el cliente SSR cookie-based: el código se intercambia en el servidor y la sesión queda en cookies httpOnly. Alternativa descartada: flujo implícito con tokens en hash del client — expone tokens en URL y duplica lógica en cliente.
2. **`emailRedirectTo` desde `window.location.origin`** en runtime: mismo código sirve a dev (localhost:3000) y prod. Alternativa descartada: `NEXT_PUBLIC_SITE_URL` — rompería el registro probado desde localhost y acopla auth a un env que hoy solo alimenta SEO/payments.
3. **Un solo callback `/auth/confirm`** para confirmación de registro y reset de contraseña, distinguido por `next` (`/huerto` default vs `/restablecer`). Simplifica la whitelist y la UX de error.
4. **Helper `lib/auth/next.ts` con `nextSeguro()`**: única función de validación `next` (empieza por `/`, no por `//`, sin backslash), testada unitariamente; la usan callback, registro y recuperar. Alternativa descartada: validar inline en cada página — duplicación y riesgo de divergencia.
5. **Whitelist de `proxy.ts` se amplía** con prefijo `/auth` (callback + error page) y rutas exactas `/recuperar` y `/restablecer`: los links de email deben abrirse sin sesión, y un usuario logueado que pide reset también debe poder restablecer (cambio de clave es válido con sesión activa). Se preserva el redirect `/login`/`/registro` → `/huerto` para autenticados (no aplica a las nuevas rutas).
6. **Páginas `(auth)` client-side** con el browser client (patrón existente): `signUp`/`resetPasswordForEmail`/`updateUser` se llaman desde el cliente; el intercambio de código es lo único que corre en servidor.
7. **Idempotencia por sesión previa**: si el intercambio falla, se consulta `getUser()`; con sesión activa se redirige al `next` validado (cubre link re-abierto tras confirmar manualmente).

## Risks / Trade-offs

- [Supabase solo honra `redirect_to` si el origin está en la allowlist del dashboard; si no, cae al Site URL (hoy localhost)] → checklist operacional en README + PENDING.md con pasos exactos y smoke test con email real tras aplicar; el fix de código sin config de dashboard es insuficiente y se documenta como paso bloqueante.
- [Rate limits de emails de Supabase] → la página de error no re-envía automáticamente; ofrece volver a registro/login manualmente.
- [Enumeración de cuentas en `/recuperar`] → respuesta genérica idéntica exista o no el email.
- [Cookie de sesión expira entre email y clic] → el error page orienta a login/recuperar; no se auto-reintenta.

## Migration Plan

1. Merge del código (no rompe nada existente: solo agrega rutas y parámetros al signUp).
2. Config de Supabase Dashboard: Site URL = dominio de producción; Redirect URLs = `https://<prod>/auth/confirm/**`, `http://localhost:3000/auth/confirm/**`.
3. Smoke tests: registro + confirmar email en prod; reset de contraseña end-to-end; `pnpm lint && pnpm typecheck && pnpm test` en verde (typecheck requiere `next typegen` previo en CI).
4. Rollback: revert del commit + revert de config de dashboard (sin migraciones de DB).

## Open Questions

- Ninguna que cambie specs o tareas. (El dominio final de producción, si deja de ser `gardenfoodv2.vercel.app`, es config de dashboard — no de código.)
