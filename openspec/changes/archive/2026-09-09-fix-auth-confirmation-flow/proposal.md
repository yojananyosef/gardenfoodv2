## Why

El funnel de registro está roto en producción: el usuario se registra, recibe el email de confirmación de Supabase y el link lo devuelve a `http://localhost:3000` (Site URL de desarrollo), y además el proyecto no tiene ninguna ruta de callback (`app/auth/confirm`) para intercambiar el código por sesión. Resultado: nadie puede completar el registro → el funnel freemium completo queda bloqueado. El mismo hueco deja sin flujo la recuperación de contraseña (el link "¿Olvidaste tu clave?" es un `href="#"` muerto).

## What Changes

- `signUp` y `resetPasswordForEmail` envían `emailRedirectTo` apuntando a `/auth/confirm` con origin dinámico (funciona en dev y producción sin hardcodear dominios).
- Nueva route handler `app/auth/confirm/route.ts`: valida params, intercambia el código con `exchangeCodeForSession` usando el cliente SSR y redirige a `next` (validado) o `/huerto`.
- Página de error `/auth/confirm/error` para links expirados/inválidos, con acciones de recuperación.
- Flujo completo de recuperación de contraseña: página `/recuperar` (pide email, llama `resetPasswordForEmail`) y página `/restablecer` (formula nueva clave + `updateUser`), reemplazando el `href="#"` del login.
- Limpieza de warnings de lint en `app/(auth)/login/page.tsx` (imports sin usar).
- Documentación operacional en README/PENDING.md: pasos de Supabase Dashboard (Auth → URL Configuration: Site URL de producción + Redirect URLs allowlist) — sin esto el fix de código no surte efecto.

## Capabilities

### New Capabilities

- `auth`: flujo de autenticación por email — confirmación de registro vía callback con intercambio de código (PKCE), recuperación y restablecimiento de contraseña, validación del parámetro `next` contra open redirects.

### Modified Capabilities

- (ninguna — la capability `auth` no existía; los demás flujos auth existentes no cambian de comportamiento observado)

## Impact

- **Archivos nuevos**: `app/auth/confirm/route.ts`, `app/auth/confirm/error/page.tsx` (o inline), `app/(auth)/recuperar/page.tsx`, `app/(auth)/restablecer/page.tsx`.
- **Archivos modificados**: `app/(auth)/registro/page.tsx` (`emailRedirectTo`), `app/(auth)/login/page.tsx` (link real a `/recuperar`, imports), `app/(auth)/restablecer` (nuevo, dentro del grupo `(auth)`).
- **Configuración externa** (operacional, no código): Supabase Auth Site URL + Redirect URLs.
- **Riesgos**: el route handler de confirmación debe correr con el cliente SSR cookie-based (`lib/supabase/server.ts`) para que la sesión quede en cookies httpOnly; el flujo debe distinguir error de código expirado vs sesión ya activa (idempotencia si el usuario re-abre el email).
- **Tests**: unit tests de validación de params (`next` open-redirect) del route handler.
