# Contrato clean-room GardenFood — venta de publicidad B2B

> Material de referencia comercial y legal. Responsable de tratamiento: **Hugo Montenegro**
> (contacto: pichilemugardenfood@gmail.com). Marco legal: Ley 21.719 (LPDP, Chile).
> Trazabilidad: RAT §finalidades (publicidad), `docs/legal/dpas-checklist.md` (encargados).

## Qué compra la marca

La marca compra la **entrega de publicidad contra un segmento definido** (p. ej.
"personas interesadas en fertilizantes orgánicos" o "huertos de la Región de
O'Higgins"). El activo que se vende es espacio publicitario y delivery contra
criterios de segmento — no datos.

Tipos de activo disponibles:

| Activo | Descripción | Base |
|---|---|---|
| Patrocinio directo (ruta C) | Banner/ficha nativa en pantallas del producto, con o sin targeting | Contractual; genérico sin datos |
| Entrega por segmento (ruta B-lite) | La publicidad se muestra solo a titulares del segmento elegido | Consentimiento vigente de los titulares contados |
| Reporte de entrega | Impresiones, clics y CTR agregados de la campaña | Interés legítimo (métrica de la campaña) |

## Qué recibe la marca

- Reportes de entrega **agregados**, con **k-anonymity mínimo 50**: cualquier grupo
  reportado tiene al menos 50 usuarios. Métricas permitidas: impresiones, clics, CTR,
  por pantalla/período de campaña.
- El media kit comercial (export CSV/JSON del panel admin) contiene solo conteos
  agregados con k≥50, con cabecera que declara la base de consentimiento.

## Qué NUNCA recibe la marca

- Listas de usuarios, correos, teléfonos, direcciones IP o identificadores de
  dispositivo.
- Consultas directas contra la base de GardenFood o exportaciones por titular.
- Geolocalización precisa de usuarios individuales.
- Cruces con datos propios de la marca fuera de la entrega contratada.

## Reglas operativas

1. **k-anonymity ≥50**: el umbral mínimo para publicar cualquier grupo es 50 usuarios.
   Implementación: función SQL `admin_media_kit()` (migraciones 0023/0024) — las marcas
   nunca acceden a la base; los conteos salen por el panel admin y se entregan como
   archivo exportado.
2. **Gate de consentimiento**: los conteos del media kit incluyen únicamente titulares
   cuya última elección de consentimiento vigente tenga `consent_third_party_sharing =
   true`. Quien no aceptó "Compartir con socios comerciales" no existe en el material B2B.
3. **Entrega personalizada**: solo titulares con `consent_personalized_ads` vigente
   reciben inventario por segmento; los demás ven solo inventario genérico.
4. **Métricas de campaña** (impresiones/clics del propio anuncio): se reportan por
   interés legítimo (medición de la campaña contratada); los eventos individuales no se
   entregan, solo los agregados con k≥50.
5. **Renuncia de garantía de tamaño**: si un segmento cae bajo 50 usuarios durante la
   vigencia, el reporte deja de desagregar ese grupo; no se entrega ningún valor con k<50.

## Base legal por titular (Ley 21.719)

| Tratamiento | Base | Derechos |
|---|---|---|
| Conteo en segmentos para media kit / entrega B-lite | Consentimiento (`thirdPartySharing`), revocable | Oposición/revocación inmediata desde el perfil |
| Entrega de publicidad personalizada | Consentimiento (`personalizedAds`), revocable | Idem |
| Métricas internas de producto y de campaña | Interés legítimo, con oposición disponible | Oposición desde banner/perfil |
| Publicidad contextual (sin datos de comportamiento) | Contractual (navegación) | — |

## Procedimiento ante solicitudes de datos individuales

1. **Solicitud estándar**: "La entrega se hace contra el segmento; no entregamos listas
   ni datos de titulares. Los reportes son agregados (k≥50)."
2. Si la marca insiste: escalar a **Hugo Montenegro** (responsable de tratamiento), que
   rechaza formalmente por imposibilidad legal sin consentimiento individual
   (art. 15 LPDP) y deja constancia.
3. Cualquier excepción requiere consentimiento explícito e individual de cada titular
   invitado por GardenFood, nunca por la marca.

## Al firmar con una marca

- Adjuntar este documento al contrato comercial como cláusula de minimización.
- Verificar en el media kit que el segmento contratado cumple k≥50 al cierre.
- Registrar la relación en `docs/legal/dpas-checklist.md` (§ no-hay-DPA: la marca no
  procesa datos personales — clean-room, no encargo ni cesión).
