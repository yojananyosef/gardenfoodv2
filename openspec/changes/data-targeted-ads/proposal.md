## Why

GardenFood tiene tres modelos de negocio: (1) suscripción por uso, (2) patrocinios cobrados con
Flow (ya implementado en `flow-sponsorships`), y (3) **publicidad potenciada con datos de
usuario** — el sponsor usa los datos de los usuarios para dirigir sus patrocinios dentro de la
app, aumentando relevancia y valor del espacio. Este cambio ataca el **modelo 3**: una capa de
*targeting* sobre `gf_sponsorships` que usa las audiencias ya calculadas en `gf_user_audiences`
y respeta el consentimiento del CMP (`gf_user_consents`).

Hoy `gf_sponsorships` es inventario global sin segmentación; los sponsors pagan por aparecer,
pero no pueden apuntar a un segmento. Este cambio habilita patrocinios dirigidos (y, por
extensión, un sobreprecio del espacio segmentado — ver assumptions).

## What Changes

- `gf_sponsorships` gana `targeting` (jsonb nullable): filtros sobre `gf_user_audiences`
  (`commercial_segments`, `purchasing_power_tier`, `primary_interest_crop`, `region`/`comuna`).
- `getActiveSponsorships(screen, userId?)` pasa a considerar la audiencia del usuario y devolver
  solo los patrocinios cuyo `targeting` coincide (con fallback a patrocinios sin targeting).
- **Consentimiento**: el targeting solo aplica si el usuario consintió personalización en
  `gf_user_consents`; si no, se usan solo patrocinios sin targeting.
- Admin: selector de segmento/targeting al crear o editar un patrocinio.
- No es un flujo de pago nuevo: se apoya en `flow-sponsorships` (el sponsor paga el slot; el
  targeting es una propiedad del slot).

## Capabilities

### New Capabilities
- `adtech/targeting`: dirigir patrocinios de `gf_sponsorships` según la audiencia del usuario
  (`gf_user_audiences`) y su consentimiento (`gf_user_consents`), con fallback a inventario
  genérico cuando no hay coincidencia o no hay consentimiento.

### Modified Capabilities
- `adtech/ads`: `gf_sponsorships` añade `targeting`; el contrato de `getActiveSponsorships`
  cambia para recibir el `userId` y filtrar por audiencia.

## Impact

- **Datos**: columna `targeting` jsonb en `gf_sponsorships` + migración.
- **API/UX**: `getActiveSponsorships(screen, userId)` filtra; admin gana selector de targeting.
- **Privacidad**: respeta `gf_user_consents` (CMP ya implementado en `fix-core-regressions`).
- **Negocio**: habilita cobrar más por slots segmentados (combinable con `flow-sponsorships`).

## Assumptions (a confirmar)

- **Segmentación**: por `commercial_segments` (array), `purchasing_power_tier`, y opcionalmente
  cultivo/región. Combinable con AND.
- **Sobreprecio**: los patrocinios con targeting pueden tener `amount` mayor (lo define el admin;
  no se cambia la lógica de cobro, solo el precio del slot).
- **Consentimiento**: personalización requiere consentimiento explícito del CMP; si falta, solo
  inventario genérico.
- **Fallback**: si ningún patrocinio dirigido coincide, se muestran los genéricos activos.
