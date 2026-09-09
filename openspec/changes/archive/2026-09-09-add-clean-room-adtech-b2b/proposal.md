# Change: Ad-tech B-lite clean-room (k-anonymity + gate de compartición + contrato documentado)

## Why
Las rutas A (contextual) y C (patrocinios) ya operan, pero la ruta B-lite está a medio construir: el media kit (Fase 4) cuenta **todos** los perfiles con audiencia, incluidos titulares que rechazaron explícitamente "compartir con socios comerciales" (`thirdPartySharing`), y no existe el contrato clean-room que define qué recibe una marca. Sin esto, vender estadísticas B2B sería una cesión encubierta prohibida sin consentimiento (art. 15 Ley 21.719) o un incumplimiento del propio CMP.

## What Changes
- **Gate de compartición en el media kit** (migración 0024): los segmentos de `admin_media_kit()` cuentan solo titulares cuya última elección de consentimiento vigente tenga `consent_third_party_sharing = true`. Quien no aceptó compartición con terceros no es contabilizado en ningún material comercial.
- **Contrato clean-room documentado** (`docs/ads/clean-room.md`): qué compra la marca (entrega de publicidad contra un segmento), qué recibe (reporte de entrega agregado, k≥50, sin identificadores), qué nunca recibe (listas de usuarios, identidades, consultas directas), base legal por titular y reglas operativas.
- **Copy CMP preciso**: la preferencia "Compartir con socios comerciales" describe el modelo real — conteo en segmentos agregados y entrega contra segmentos, nunca venta ni entrega de datos.
- **Política de privacidad**: párrafo de publicidad actualizado con la definición clean-room (la marca paga por entrega contra segmento y recibe reportes agregados k≥50; los datos nunca salen de GardenFood).
- **Media kit**: nota explícita de que los conteos excluyen a titulares sin consentimiento de compartición; cabecera del export actualizada.

## Impact
- **Affected specs**: `admin/media-kit` (MODIFIED: gate de consentimiento en segmentos y export), `adtech/clean-room` (nueva: contrato documentado), `adtech/consent` (ADDED: copy clean-room), `privacy` (ADDED: publicación del modelo clean-room).
- **Affected code**: `supabase/migrations/0024_*`, `lib/admin/mediakit.ts` (sin cambio de lógica, sólo doc), `components/admin/MediaKitExport.tsx` (cabecera), `app/(dashboard)/admin/media-kit/page.tsx` (nota), `components/cmp/ConsentPreferences.tsx` (copy), `app/legal/privacidad/page.tsx` (párrafo), `docs/ads/clean-room.md` (nuevo).
- No breaking: la entrega de publicidad (contextual/personalizada) no cambia; solo el material B2B se ajusta al consentimiento real y se documenta el contrato.
