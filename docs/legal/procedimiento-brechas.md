# Procedimiento de Notificación de Brechas de Seguridad

Proyecto: GardenFood v2 · Obligación: Ley 21.719 (notificación a la Agencia de Protección de Datos Personales y, cuando corresponda, a los titulares) · Ley 21.663 para operadores OIV (probablemente no aplica; revisar clasificación si crece)

## 1. Detección

- Monitoreo manual hoy (proyecto temprano): logs de Vercel (runtime errors), logs de Supabase (postgres/auth), advisors del MCP Supabase (revisar tras cada DDL).
- Alarmas automáticas **pendientes**: ver sección 5.

## 2. Evaluación (dentro de las primeras 24h)

Preguntas mínimas:
1. ¿Qué datos se vieron comprometidos? ¿Personales identificables (perfiles, consents) o agregados/eventos anónimos?
2. ¿Cuántos titulares aproximadamente?
3. ¿Riesgo para los titulares (fraude, suplantación, discriminación)?
4. ¿Origen: app propia, proveedor (Supabase/Vercel/MP), credenciales filtradas, dependencia vulnerable?

## 3. Notificación a la Agencia

- **Qué**: descripción de la brecha, categorías y volumen aprox. de datos/titulares, medidas de contención, contacto del responsable.
- **Cuándo**: lo antes posible desde la confirmación (sin demora injustificada; el estándar internacional es ≤72h — adoptar 72h como meta interna mientras la Agencia emita su procedimiento).
- **Dónde**: canal que habilite la APDP (a su constitución); en su defecto, documento formal enviado al contacto regulatorio disponible + registro interno en `docs/legal/incidencias/`.

## 4. Comunicación a los titulares

- Obligatoria si la brecha puede producir riesgo elevado para ellos (p. ej. email+contraseña filtrados).
- Canal: email a los afectados + aviso en la app. Contenido mínimo: qué pasó, qué datos, qué hacemos, qué les recomendamos (cambiar contraseña, revisar accesos), contacto.
- Los datos de contacto viven en `perfiles` (email) — usable solo para la notificación de la brecha, nunca para marketing.

## 5. Hardening pendiente (alarmas)

- [ ] Alerta automática en errores 5xx y tasas de error del webhook MP (Vercel).
- [ ] Alerta en intentos de acceso admin fallidos repetidos.
- [ ] Backup/restauración verificado (Supabase PITR) — probar una restauración completa antes de cobrar.
- [ ] Revisión semestral del inventario de accesos (service role, claves MP, secretos Vercel).

## 6. Registro interno

Toda incidencia, confirmada o descartada, se documenta en `docs/legal/incidencias/YYYY-MM-DD-titulo.md` con: hallazgo, evaluación, acciones, notificaciones y lecciones.
