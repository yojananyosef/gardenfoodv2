## 1. Protección de rutas por proxy (más urgente) — YA RESUELTO

Nota: En Next.js 16 `middleware` está obsoleto y se renombró a `proxy`. El
`proxy.ts` existente en la raíz ya es el mecanismo correcto y está cableado.
Verificado empíricamente: `GET /huerto` sin sesión → `307` a `/login?next=%2Fhuerto`.
No se crea `middleware.ts` ni se elimina `proxy.ts`.

- [x] 1.1 Verificar que `proxy.ts` protege rutas del dashboard y redirige a `/login` (y a `/huerto` desde `/login`/`/registro` si hay sesión). Confirmado con `curl` (307).
- [x] 1.2 Confirmar que el `matcher` excluye rutas públicas y auth (evita loops). Ya correcto en `proxy.ts`.
- [x] 1.3 Mantener `proxy.ts` (no eliminar): es el mecanismo vigente de Next 16; defensa en profundidad en páginas vía `redirect("/login")` se añade donde aplique.

## 2. Registro con ubicación válida

- [x] 2.1 Usar `lib/agronomy/comunas.ts` (nuevo `buscarComuna` normalizado) para validar `comuna` contra las 245 comunas en el registro.
- [x] 2.2 Derivar `region` y `zona_agroclimatica` desde la comuna validada y eliminar el hardcode `"central"` en `app/(auth)/registro/page.tsx`.
- [x] 2.3 Mostrar error de validación ("No encontramos tu comuna…") si la comuna no existe en el catálogo.

## 3. Refresh de audiencias operativo

- [x] 3.1 Migración `0011_audience_refresh_cron_fix.sql`: el `pg_cron` resuelve la app URL y el secreto en runtime vía GUCs (`app.gf_app_url`, `app.gf_cron_secret`) y apunta a `/api/v1/admin/audiences/refresh` (ya no a la Edge Function localhost inexistente).
- [x] 3.2 Botón "Refrescar audiencias" (`components/admin/RefreshAudienciasButton.tsx`) en `app/(dashboard)/admin/audiencias` que dispara el refresh manual y recarga los cohortes.
- [x] 3.3 Verificado: el Route Handler `/api/v1/admin/audiences/refresh` ya valida `isAdmin()` y `CRON_SECRET` y retorna `{ processed, errors }`.

## 4. Módulo `gf_arboles` conectado

- [x] 4.1 Server Actions `agregarArbol`, `actualizarArbol`, `eliminarArbol` en `lib/huerto/actions.ts` (y `getArboles` en `lib/huerto/data.ts`) con RLS por usuario (`user_id`).
- [x] 4.2 Componentes `AgregarArbol`/`ListaArboles` y sección "Tu inventario de árboles" en `/huerto`.
- [x] 4.3 Aislamiento por usuario garantizado: todas las consultas filtran por `user.id` y la tabla tiene RLS `auth.uid() = user_id`.

## 5. `/perfil` edita ubicación

- [x] 5.1 Acción `actualizarUbicacion` en `lib/auth/actions.ts` que valida la comuna y actualiza `region`/`comuna`/`zona_agroclimatica`.
- [x] 5.2 Formulario `UbicacionForm` en `app/(dashboard)/perfil` que valida la comuna vía `buscarComuna` y persiste en `perfiles`.
- [x] 5.3 `actualizarUbicacion` hace `revalidatePath("/huerto")` para recalcular alertas.

## 6. CMP con "Rechazar todo" (menos urgente)

- [x] 6.1 `ConsentModal` descartable (`showCloseButton`, `onOpenChange` cableado) y botón "Rechazar todo" que guarda todas las finalidades en `false`.
- [x] 6.2 Cerrar/dismiss dispara `rejectAll` (sin otorgar consentimiento por defecto); el flujo de registro procede sin consentimiento.
- [x] 6.3 Telemetría ya se bloquea sin consentimiento válido (gate en `lib/telemetry`/`lib/consent`); el modal ahora permite rechazo explícito.
