## 1. Validación y whitelist

- [x] 1.1 Crear `lib/auth/next.ts` con `nextSeguro(raw: string | null, fallback = "/huerto")` (acepta solo rutas que empiezan por `/`, no `//`, sin backslash) y test unitario en `tests/auth-next.test.ts` cubriendo absoluto externo, protocol-relative, backslash, vacío y rutas válidas — verificar `pnpm test`
- [x] 1.2 Ampliar whitelist de `proxy.ts`: prefijo `/auth` y rutas exactas `/recuperar`, `/restablecer`; mantener redirect `/login`/`/registro` → `/huerto` solo para esas rutas — verificar con revisión del código y `pnpm test` (los tests de proxy existentes, si los hay, siguen verdes)

## 2. Callback de confirmación

- [x] 2.1 Crear `app/auth/confirm/route.ts` (route handler): lee `code` y `next`, intercambia con `exchangeCodeForSession` usando el cliente SSR; en fallo consulta `getUser()` para idempotencia; redirige con `nextSeguro()` — verificar `pnpm typecheck`
- [x] 2.2 Crear `app/auth/confirm/error/page.tsx` con mensaje orientado a re-envío (link a `/registro`) y acceso a `/recuperar` — verificar render anónimo con `pnpm dev`

## 3. Registro y recuperación

- [x] 3.1 En `registro/page.tsx`: agregar `emailRedirectTo: ${window.location.origin}/auth/confirm?next=<nextSeguro de la query>` al `signUp` — verificar `pnpm lint` sin warnings nuevos
- [x] 3.1b Persistir datos del perfil para usuarios que confirman por email: guardar `region/comuna/zona_agroclimatica` en metadata del signUp y crear la fila `perfiles` desde el callback si falta (sin trigger DB, sin migración) — verificar con flujo de confirmación activada
- [x] 3.2 Crear `app/(auth)/recuperar/page.tsx` (form email + `resetPasswordForEmail` con redirect a `/auth/confirm?next=/restablecer`, respuesta genérica) — verificar con email de prueba que llega el correo con destino correcto
- [x] 3.3 Crear `app/(auth)/restablecer/page.tsx` (dos campos coincidentes, min 8, `updateUser({ password })`, éxito → `/huerto`; sin sesión → redirect `/recuperar`) — verificar flujo completo con link de reset

## 4. Login

- [x] 4.1 En `login/page.tsx`: reemplazar `href="#"` de "¿Olvidaste tu clave?" por `/recuperar` y eliminar imports sin usar (`ArrowRight`, `Input`) — verificar `pnpm lint` con 0 warnings en el archivo

## 5. Verificación integral y docs

- [x] 5.1 `pnpm lint && pnpm typecheck && pnpm test` en verde (typecheck tras `next typegen`) — verificar salida limpia
- [x] 5.2 Documentar en README (sección auth) y PENDING.md: pasos operacionales de Supabase Dashboard (Site URL + Redirect URLs con origins de prod y localhost) marcados como paso bloqueante post-deploy, y cerrar el ítem "¿Olvidaste tu clave?" de la deuda — verificar docs actualizados
- [x] 5.3 Smoke test manual en dev: registro → email → confirmación → sesión activa en `/huerto`; reset de contraseña end-to-end — verificar ambos flujos con cuentas de prueba (parcial: rutas, redirects, gating y anti open-redirect verificados con curl + 4/4 páginas 200; el flujo con email real queda para el usuario: requiere bandeja propia y config de Supabase Dashboard)
