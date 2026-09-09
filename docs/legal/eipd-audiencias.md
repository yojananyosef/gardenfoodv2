# EIPD — Motor de Audiencias Comerciales (borrador)

Proyecto: GardenFood v2 · Fecha: 2026-09-09 · Estado: borrador para validar con asesoría jurídica

## 1. Descripción del tratamiento

- **Qué**: construcción de perfiles comerciales por usuario (segmentos de interés como "busca_fertilizante_organico", tier de poder adquisitivo, cultivo de interés) a partir de telemetría de producto (vistas de fichas, dwell time, consultas de fertilizante, superficie declarada del huerto) y datos de perfil (comuna/region, superficie).
- **Cómo**: `lib/telemetry/audiences.ts` (reglas deterministas) → materializada en `gf_user_audiences` por job pg_cron cada 6h vía `/api/v1/admin/audiences/refresh`.
- **Consumos**: (a) matching de publicidad personalizada con consentimiento `personalizedAds`; (b) estadísticas **agregadas** para marcas (k-anonymity ≥50, nunca filas individuales).
- **Escala**: hoy <10 usuarios; diseñado para crecer a decenas de miles.

## 2. Por qué es tratamiento de alto riesgo

- Perfilamiento de comportamiento para fines comerciales (observación sistemática).
- Combina ubicación aproximada + intereses de consumo → posible inferencia de hábitos.
- Uso potencial B2B (compartición con terceros solo bajo consentimiento explícito de `thirdPartySharing`).

## 3. Necesidad y proporcionalidad

- Sin alternativas menos intrusivas equivalentes para el matching personalizado: la alternativa contextual (targeting por página/plan) está implementada como fallback y funciona sin perfil.
- Datos usados: mínimos para la finalidad (sin datos sensibles, sin precisión GPS, sin identidad documental).
- El titular puede: oponerse a la telemetría fuente (detiene la ingesta), revocar `personalizedAds` (el perfil deja de usarse en ads) y suprimir su cuenta (borra el perfil).

## 4. Riesgos identificados y mitigaciones

| Riesgo | Severidad | Mitigación implementada/planificada |
|---|---|---|
| Re-identificación de individuos en exportaciones B2B | Alta | Regla k≥50 en la API de audiencias (Fase ad-tech); sin export de filas individuales; contrato de uso que prohíbe intentos de re-identificación |
| Perfilado sin base legítima | Alta | Doble base: LI con oposición para la fuente (telemetría); consentimiento explícito para ads personalizadas y para compartición |
| Sesgo/daño por inferencia (p. ej. tier socioeconómico) | Media | Tier deriva de superficie declarada y comportamientos de uso, no de datos sensibles; sin decisiones automatizadas con efecto legal o similar |
| Fuga de eventos con IP/user_agent | Media | RLS 0018: solo service-role escribe eventos con user_id; consents world-writable cerrado |
| Retención excesiva | Baja | Purge de eventos a 24 meses (pendiente, PENDING.md); audiencias recalculadas |

## 5. Medidas (resumen)

- Consentimiento granular + oposición registrados con vigencia y evidencia (`gf_user_consents`).
- Minimización: sin datos sensibles; precisión de ubicación = comuna (declared) o IP aproximada (con transparencia).
- Seguridad: RLS por usuario, service-role solo en server, HMAC en webhooks, CSP/headers.
- Derechos: oposición efectiva inmediata; supresión borra eventos, audiencias y cuenta.
- Transparencia: Política de Privacidad + banner informan el perfilado y sus finalidades.

## 6. Próximos pasos

1. Validación jurídica del borrador.
2. Implementar k-anonymity ≥50 en la API de audiencias (Fase ad-tech).
3. Implementar purge de eventos a 24 meses.
4. Re-evaluar cuando: se agreguen terceros en ads, se venda exportación B2B, o el volumen supere 100k usuarios.
