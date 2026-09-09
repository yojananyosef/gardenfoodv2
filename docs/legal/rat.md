# Registro de Actividades de Tratamiento (RAT)

Proyecto: GardenFood v2 · Responsable: [RAZÓN SOCIAL] · RUT: [RUT] · Actualizado: 2026-09-09

Inventario de tratamientos según la Ley 21.719. Se actualiza en cada change que agregue o modifique tratamientos.

## 1. Gestión de cuentas

| Campo | Valor |
|---|---|
| Tabla | `perfiles` (id, email, nombre, region, comuna, zona_agroclimatica, terreno, plan) |
| Finalidad | Registro, acceso al servicio y personalización agroclimática |
| Base de licitud | Ejecución de contrato (art. 13) |
| Titulares | Usuarios registrados |
| Conservación | Mientras exista la cuenta; supresión a pedido (ARSOP) |
| Encargados | Supabase (auth.users + Postgres), Vercel (hosting) |

## 2. Huerto del titular

| Campo | Valor |
|---|---|
| Tablas | `gf_huertos`, `gf_cultivos`, `gf_arboles`, `gf_tareas`, `gf_registro`, `perfiles.terreno` (deprecado) / `gf_huertos` geo |
| Finalidad | Funcionalidad principal del servicio (planificador, calendario, cosechas) |
| Base de licitud | Ejecución de contrato |
| Conservación | Mientras exista la cuenta; borrado con la cuenta (cascade) |
| Nota | Los datos de terreno pueden revelar ubicación precisa del domicilio → RLS estricta por usuario, sin acceso admin salvo soporte documentado |

## 3. Telemetría de producto

| Campo | Valor |
|---|---|
| Tabla | `gf_analytics_events` (deviceId, sessionId, categoría/evento, dwell, scroll, payload, deviceMetadata, geo) |
| Finalidad | Medición y mejora del producto, contenidos por zona |
| Base de licitud | **Interés legítimo** (art. 13 letra d) con oposición disponible (banner + Ajustes de privacidad). `legitimateInterestOpposed` detiene la captura |
| Identificación | Anónimos: `user_id null` + deviceId; logueados: `user_id` |
| Conservación | Máximo 24 meses → **pendiente implementar purge job** (ver PENDING.md) |
| Encargados | Supabase |

## 4. Consentimiento (CMP)

| Campo | Valor |
|---|---|
| Tabla | `gf_user_consents` (5 propósitos + oposición, granted/expira, consentString, IP, user_agent) |
| Finalidad | Evidencia de la elección del titular (accountability) |
| Base de licitud | Obligación legal (acreditar licitud) |
| Conservación | 390 días por registro (vigencia del consentimiento) |
| Acceso | Solo service-role (escritura vía `/api/v1/cmp/consent`), admin lectura |

## 5. Pagos y suscripciones

| Campo | Valor |
|---|---|
| Tablas | `gf_subscriptions`, `gf_subscription_plans` (vestigial), referencia `perfiles.plan/status` |
| Finalidad | Gestionar suscripciones Mercado Pago, estados, webhook |
| Base de licitud | Ejecución de contrato + obligación legal (boletas) |
| Nota | Datos de tarjeta NO tocan nuestra infraestructura (hosted `init_point`) |
| Encargados | Mercado Pago |

## 6. Audiencias comerciales (ad-tech)

| Campo | Valor |
|---|---|
| Tabla | `gf_user_audiences` (segmentos, tier, cultivo de interés) |
| Finalidad | Selección de publicidad personalizada y estadísticas agregadas B2B |
| Base de licitud | Consentimiento `personalizedAds` para publicidad; **cesión/exportación** solo si aplica `thirdPartySharing` y siempre **agregada** (k≥50) |
| Conservación | Recalculada cada 6h (pg_cron); se borra al suprimir cuenta |
| EIPD | Ver `eipd-audiencias.md` |

## 7. Publicidad (sponsorships)

| Campo | Valor |
|---|---|
| Tabla | `gf_sponsorships` (+ eventos AD_VIEW/AD_CLICK en telemetría) |
| Finalidad | Inventario publicitario propio, sin terceros en el camino crítico |
| Base de licitud | Ejecución de contrato; mediciones de ads corren bajo la base de la telemetría (LI/oposición o consentimiento) |

## Checklist de tratamientos nuevos

- [ ] ¿Qué datos exactos? ¿Incluye identificación o solo agregados?
- [ ] ¿Base de licitud? ¿Consentimiento requiere banner?
- [ ] ¿Plazo de conservación definido y automatizable?
- [ ] ¿Encargado nuevo → DPA firmado (ver dpas-checklist.md)?
- [ ] ¿Impacta ARSOP (export y supresión actualizados)?
- [ ] ¿Se actualizó la Política de Privacidad pública?
