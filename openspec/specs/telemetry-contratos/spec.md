# telemetry-contratos Specification

## Purpose
Contrato de ingesta telemétrica y consentimiento multi-plataforma: la futura app React Native/Expo debe consumir exactamente los mismos endpoints y schemas que la web, con la estrategia de identidad nativa documentada, de modo que la app no duplique lógica ni diverja del schema compartido en `types/`.

## Requirements

### Requirement: Contrato documentado de ingestión móvil

El sistema SHALL documentar en `docs/api/contratos-movil.md` los endpoints que consume una app nativa: `POST /api/v1/telemetry` (batch de eventos con los campos del schema compartido, `deviceId` opcional), `POST /api/v1/cmp/consent` (elección granular con `deviceId`), y `POST /api/v1/payments/{subscribe,subscribe/status}` con auth. El documento SHALL especificar la estrategia de identidad nativa (identificador de instalación estable de la app, p. ej. `expo-install-id`, enviado como `deviceId`) y que la sesión nativa viaja como token (no cookies), con el mismo comportamiento de `user_id` server-side.

#### Scenario: Documento con contratos completos
- **WHEN** un equipo revisa `docs/api/contratos-movil.md`
- **THEN** encuentra endpoint por endpoint: método, auth, payload de ejemplo validado contra el schema y estrategia de deviceId nativa

#### Scenario: Schema compartido como fuente de verdad
- **WHEN** la app nativa serializa un evento
- **THEN** usa los mismos tipos y validaciones del schema de `lib/telemetry/schemas.ts` (fuente única, sin duplicar el contrato)

### Requirement: El nombre y la categoria de un evento son un vocabulario cerrado

El sistema SHALL aceptar solo nombres de evento y categorias que esten en el
vocabulario de `types/index.ts` (`TELEMETRY_EVENT_NAMES` y
`TELEMETRY_CATEGORIES`), y SHALL rechazarlos antes de escribir, en el borde de
la API, no despues en la base.

La categoria ya se validaba contra el vocabulario; el nombre no. Era
`z.string().min(1).max(100)`, que aceptaba cualquier texto, y por ahi pasaron
seis eventos con nombres de una taxonomia anterior (`ad_impression`,
`especie_view`, `crop_search`) que el dominio actual no contempla.

En la base, `gf_analytics_events.event_category` y `event_name` son enums
(`telem_event_category`, `telem_event_name`), igual que `gf_sponsorships.screen`
y `payment_status`. Un enum sin validacion del lado del cliente convierte un typo
en un error de Postgres en vez de un mensaje de validacion.

#### Scenario: Un evento con nombre fuera del vocabulario no se guarda

- **WHEN** el cliente envia un evento cuyo `name` no esta en `TELEMETRY_EVENT_NAMES`
- **THEN** la API responde con un error de validacion y no se inserta ninguna fila

#### Scenario: El mismo nombre mal escrito en la base tampoco entra

- **WHEN** una escritura llega a `gf_analytics_events` saltandose la API, con un
  `event_name` que no es una etiqueta del enum
- **THEN** Postgres la rechaza con `invalid input value for enum telem_event_name`
  y la fila no existe

#### Scenario: Los nombres que ya estan en el dominio se siguen aceptando

- **WHEN** el cliente emite `VIEW_FICHA`, `PAGE_VIEW`, `CALCULATOR_SUBMIT`,
  `AD_IMPRESSION`, `AD_CLICK`, `SEARCH_INP`, `INPUT_QUOTE`,
  `CMP_CONSENT_GRANTED`, `CMP_CONSENT_UPDATED` o cualquier otro nombre del
  vocabulario
- **THEN** el evento se guarda con su categoria correspondiente

#### Scenario: Un evento sin sesion sigue siendo valido

- **WHEN** un visitante sin cuenta emite un evento del vocabulario
- **THEN** se guarda con `user_id` en NULL, porque el enum no exige identidad

### Requirement: La edad de un arbol se guarda como el numero de dim_edad

El sistema SHALL guardar la edad de un arbol en `gf_arboles.edad_n` como el
`edad_n` de `dim_edad` (1 a 4), y no como un codigo corto propio.

Existian tres vocabularios para lo mismo: `dim_edad.edad_n` (1-4),
`dim_edad.edad` (el rotulo largo) y `gf_arboles.edad_clase`
("recien", "joven", "inicial", "adulto"). El tercero existia ademas como dos
mapas escritos a mano en el componente que edita el arbol, que traducian entre el
numero y el codigo. El selector de edad ya usaba 1..4 porque leia
`gf_riego_edad`; solo el almacenamiento pasaba por los codigos.

`edad_n` tiene clave foranea a `dim_edad.edad_n`, asi que la base garantiza que
el numero exista. El rango tambien se valida en la accion de actualizar, con
`z.number().int().min(1).max(4)`.

#### Scenario: Guardar una edad elige una de las cuatro etapas

- **WHEN** el usuario elige una edad en el dialogo de editar un arbol
- **THEN** se guarda el `edad_n` correspondiente (1 a 4) en `gf_arboles.edad_n`,
  y no un codigo corto

#### Scenario: Un arbol sin edad queda sin edad

- **WHEN** un arbol no tiene edad elegida
- **THEN** `edad_n` queda en NULL, y la FK lo permite porque NULL no es un valor

#### Scenario: La edad se conserva al reabrir el arbol

- **WHEN** se vuelve a abrir el dialogo de un arbol que ya tiene `edad_n` guardado
- **THEN** el selector aparece en esa etapa, sin traducir nada
