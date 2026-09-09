# Checklist de DPAs — Encargados del Tratamiento

Ley 21.719 exige contratos de tratamiento con todo proveedor que acceda a datos personales. Estado al 2026-09-09.

## 1. Supabase (base de datos, auth, storage)

- [x] Los ToS de Supabase incluyen DPA con cláusulas estándar (Standard Contractual Clauses para transferencias).
- [x] Datos alojados en región sa-east-1 (São Paulo) — minimiza transferencia.
- [ ] **Pendiente**: firmar/activar el DPA explícito desde el dashboard si se exige forma contractual separada para Chile.
- Datos tratados: perfiles, huerto, telemetría, consents (todo el schema public) + auth.users.

## 2. Vercel (hosting web, edge)

- [x] ToS incluyen DPA (misma estructura SCC).
- [ ] **Pendiente**: confirmar que los logs no retengan PII sensible más de lo declarado; revisar configuración de log drain si se activa.
- Datos tratados: HTML/RSC de páginas (incluye nombres en dashboard), headers/IP en logs de acceso.

## 3. Mercado Pago (pagos)

- [x] MP actúa como responsable/encargado según su propio régimen PCI-DSS; los datos de tarjeta nunca pasan por nuestra infraestructura (hosted init_point).
- [ ] **Pendiente**: documentar el flujo de datos compartido (email del comprador ↔ collector) y su base (ejecución de contrato).

## 4. Servicio de geolocalización por IP (IPGEO_URL)

- [x] **Resuelto 2026-09-09**: `IPGEO_URL` está vacío — no se usa ningún proveedor de terceros de geo por IP. La ubicación de los eventos viene de la comuna declarada por el usuario (ejecución de contrato) y del GPS del navegador solo con consentimiento `preciseGeo`. Sin terceros → sin DPA requerido.
- [ ] Si se configura `IPGEO_URL` en el futuro: identificar proveedor, firmar DPA (o elegir uno con DPA estándar tipo ipapi/ipwho) y actualizar el RAT + Política de Privacidad.
- Código listo para la función: `lib/telemetry/ipgeo.ts` (inactivo sin la var).

## 5. Google Fonts (via next/font)

- [x] `next/font` auto-hospeda las fuentes en el propio dominio en build — sin requests a Google en runtime. Verificado: no hay `<link>` a fonts.googleapis.com en runtime.

## 6. Revisión periódica

- Cada proveedor nuevo que toque datos personales → entrada en el RAT (`rat.md`) + DPA antes de producción.
- Revisar este checklist cada 6 meses o ante cambios de proveedor.
