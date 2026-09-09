## 1. Bases de licitud (token v2 + telemetría)

- [x] 1.1 En `lib/consent/token.ts`: subir `CONSENT_VERSION` a 2 con lectura defensiva de tokens v1 válidos (conservar elección explícita; descartar corruptos) y exportar `telemetriaPermitida()` (true si no hay elección válida o la oposición está OFF; false si hay elección válida con oposición) — verificar con tests en `tests/consent-token.test.ts` extendidos
- [x] 1.2 Cambiar el gate de `lib/telemetry/tracker.ts` y `TelemetryProvider.tsx` de `hasValidLocalConsent()` a `telemetriaPermitida()` — verificar `pnpm test` y revisión del flujo anónimo/logueado
- [x] 1.3 Ajustar `ConsentModal` (onboarding registro) para que "Rechazar todo" registre oposición explícita y el copy informe el tratamiento bajo interés legítimo (sin tono persuasivo engañoso) — verificar revisión visual

## 2. Banner CMP anónimo

- [x] 2.1 Crear `components/cmp/ConsentBanner.tsx` (cliente): visible sin token local válido; Aceptar todo / Rechazar todo / Gestionar (reusa `ConsentPreferences`); igual prominencia; guardar v2 + POST `/api/v1/cmp/consent` vía `useConsentSave`; montarlo en `app/layout.tsx` — verificar con visita anónima que aparece y desaparece al elegir
- [x] 2.2 Test unitario de la lógica de visibilidad del banner (elegido/no elegido/expirado) si es extraíble a helper puro — verificar `pnpm test`

## 3. Revocación total

- [x] 3.1 En `app/(dashboard)/perfil/page.tsx`: agregar botón "Restablecer elección" que borra token local + cookie `gf_consent` (usar `clearLocalConsent()` existente) y cierra el panel — verificar que el banner reaparece en la siguiente navegación

## 4. ARSOP (portabilidad + supresión)

- [x] 4.1 Crear `app/api/v1/privacy/export/route.ts`: auth con cliente SSR (401 sin sesión), consulta perfiles/gf_huertos/gf_cultivos/gf_tareas/gf_arboles/gf_subscriptions/gf_user_consents/gf_registro propias vía RLS + eventos vía admin client, responde JSON attachment (`Content-Disposition`) — verificar descarga con cuenta de prueba
- [x] 4.2 Crear `lib/privacy/supresion.ts` (server): verifica suscripción activa (bloquea con mensaje), borra filas propias (service-role: tareas, cultivos, árboles, huertos, registro, consents, eventos, audiencias) y llama `admin.auth.deleteUser`; action en `lib/privacy/actions.ts` con confirmación explícita — verificar con cuenta desechable
- [x] 4.3 En `perfil/page.tsx`: sección "Tus derechos" con botones "Descargar mis datos" y "Eliminar mi cuenta" (confirmación explícita en dos pasos, mensaje de éxito/error, cierre de sesión y redirect a `/` tras supresión) — verificar revisión visual

## 5. Legales + edad

- [x] 5.1 Crear `app/legal/layout.tsx` + `/legal/terminos`, `/legal/privacidad`, `/legal/cookies` con contenidos completos (bases de licitud, finalidades, encargados, plazos, derechos y canal ARSOP, cookies/storage usados, menores de 16, placeholders [RAZÓN SOCIAL]/[RUT]/[EMAIL]) y `robots: noindex` en metadata — verificar render y noindex
- [x] 5.2 Reemplazar los `href="#"` de términos/privacidad en `registro/page.tsx` por links reales y agregar el checkbox obligatorio "Tengo al menos 14 años" con descripción legal — verificar `pnpm lint` y envío bloqueado sin checkbox

## 6. Seguridad (headers + CSP)

- [x] 6.1 En `next.config.ts`: `poweredByHeader: false` + `headers()` con HSTS (≥1 año), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy` restrictiva — verificar con `curl -I` en dev
- [x] 6.2 En `proxy.ts`: generar nonce por request, setear CSP con `script-src 'nonce-…' 'strict-dynamic'` (+ `'unsafe-eval' ws:` solo en dev), `style-src 'self' 'unsafe-inline'`, `img-src self data: blob: https:`, `connect-src self https://*.supabase.co`, `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`; exponer nonce vía header `x-nonce` — verificar con `curl -I` que la CSP viaja por respuesta
- [x] 6.3 En `app/layout.tsx`: leer nonce de `headers()` y aplicarlo al `<script>` JSON-LD; el resto de scripts de Next heredan el nonce automáticamente — verificar que la página carga sin violaciones CSP (consola limpia)

## 7. Documentos de cumplimiento

- [x] 7.1 Crear `docs/legal/rat.md` (inventario de tratamientos: perfiles, telemetría, consents, pagos, audiencias — finalidad/base/plazos/encargados por tabla), `docs/legal/eipd-audiencias.md` (borrador), `docs/legal/procedimiento-brechas.md` y `docs/legal/dpas-checklist.md` (Supabase/Vercel/MP/IPGeolocation con estado y pendientes) — verificar que los 4 archivos existen y son coherentes con la implementación
- [x] 7.2 Actualizar `PENDING.md`: cerrar los ítems CMP/Auth-legales completados y registrar la advertencia de validación jurídica de los textos + placeholders por completar — verificar diff

## 8. Verificación integral

- [x] 8.1 `pnpm lint && pnpm typecheck && pnpm test` en verde — verificar salida limpia
- [x] 8.2 Smoke manual: visita anónima con banner → elegir → banner no reaparece; revocar en perfil → reaparece; export JSON descargable; cabeceras de seguridad presentes — verificar en dev (verificado con curl: cabeceras + CSP nonce + JSON-LD nonceado + legales 200/noindex + gating intacto + export 401 anónimo; interacción real del banner/revocación/export con navegador queda para el usuario)
