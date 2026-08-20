## 1. Modelo de datos

- [x] 1.1 Migración `0016_sponsorship_targeting`: `alter table gf_sponsorships add column targeting jsonb` (aplicada en vivo) + comentario.
- [x] 1.2 Tipo `SponsorshipTargeting` en `types/index.ts` + campo `targeting` en `Sponsorship`.
- [x] 1.3 `sponsorshipSchema` (zod) acepta `targeting` opcional (segments/purchasingPowerTier/primaryInterestCrop/region/comuna).

## 2. Filtrado por audiencia

- [x] 2.1 `getActiveSponsorships(screen, userId?)` resuelve `gf_user_audiences` + `perfiles` (región/comuna) y filtra por `targeting` (AND entre campos, OR dentro de cada campo).
- [x] 2.2 Fallback a patrocinios sin `targeting` cuando no hay coincidencia, no hay userId, o no hay consentimiento.
- [x] 2.3 `gf_user_consents.consent_personalized_ads` (no expirado) como gate; sin consentimiento → solo genéricos.
- [x] 2.4 `lib/ads/targeting.ts`: `audienceMatchesTargeting` + `SEGMENT_OPTIONS`/`POWER_TIER_OPTIONS`.

## 3. Admin UI

- [x] 3.1 Selector de targeting (segmentos + poder adquisitivo en checkboxes; cultivo/región/comuna en texto separado por comas) en el formulario de nuevo patrocinio.
- [x] 3.2 Resumen de targeting en la lista del admin; la API admin (POST/PATCH) guarda `targeting`.

## 4. Validación

- [x] 4.1 typecheck + lint + build (Next 16) — OK.
- [ ] 4.2 Prueba funcional de filtrado con usuario de segmento conocido (requiere sesión + audiencia calculada + consentimiento; se hace en navegador con el usuario admin de prueba).
- [ ] 4.3 Commit + push + `openspec archive data-targeted-ads` (pendiente a decisión del usuario).

## Notas

- El filtrado ocurre siempre en el servidor (privacidad): el cliente nunca recibe la audiencia.
- Inventario genérico (sin `targeting`) siempre se muestra como fallback.
- Vocabulario de segmentos tomado de `lib/telemetry/audiences.ts` (SEGMENTS).
