## 1. Modelo de datos

- [ ] 1.1 Migración: `alter table gf_sponsorships add column targeting jsonb` (nullable)
- [ ] 1.2 Extender tipo `Sponsorship` con `targeting` en `types/index.ts`
- [ ] 1.3 Extender `sponsorshipSchema` en `lib/ads/schemas.ts` (targeting opcional)

## 2. Filtrado por audiencia

- [ ] 2.1 `getActiveSponsorships(screen, userId?)` resuelve la audiencia del usuario (`gf_user_audiences`) y filtra por `targeting` (segments AND tier AND cultivo/región)
- [ ] 2.2 Fallback a patrocinios sin `targeting` cuando no hay coincidencia o no hay userId
- [ ] 2.3 Respetar `gf_user_consents`: solo targeting si hay consentimiento de personalización

## 3. Admin UI

- [ ] 3.1 Selector de targeting (segmentos, tier, cultivo) al crear/editar patrocinio
- [ ] 3.2 Mostrar el targeting asignado en la lista del admin

## 4. Validación

- [ ] 4.1 typecheck + lint + build
- [ ] 4.2 Prueba de filtrado con usuario de segmento conocido (targeted vs genérico)
- [ ] 4.3 Commit + push + `openspec archive data-targeted-ads`
