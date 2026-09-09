## Purpose

Garantizar los derechos del titular de datos y el cumplimiento base de la Ley 21.719: transparencia (páginas legales + banner), bases de licitud diferenciadas (interés legítimo para analítica de producto, consentimiento para lo monetizable-invasivo), ejercicio de derechos ARSOP (portabilidad y supresión) y revocación simple de la elección de privacidad.

## ADDED Requirements

### Requirement: Transparencia legal publicada

El sistema SHALL publicar páginas accesibles de Términos (`/legal/terminos`), Política de Privacidad (`/legal/privacidad`) y Política de Cookies (`/legal/cookies`), enlazadas desde el flujo de registro (reemplazando los enlaces muertos `href="#"`). La política de privacidad SHALL declarar: responsable (con placeholder para RUT/razón social), categorías de datos tratadas, finalidades, bases de licitud de cada tratamiento, destinatarios y encargados (Supabase, Vercel, Mercado Pago, servicio de geo por IP), plazos de conservación (consentimiento 390 días; eventos de telemetría sin identificador personal), derechos del titular y el canal para ejercerlos (Ajustes de privacidad en `/perfil`).

#### Scenario: Visitante accede a la política desde el registro
- **WHEN** el usuario hace clic en "privacidad" o "términos" en el pie del formulario de registro
- **THEN** navega a las páginas `/legal/privacidad` o `/legal/terminos` con contenido completo (no `#`)

#### Scenario: La política declara bases y canal de derechos
- **WHEN** se revisa el contenido de `/legal/privacidad`
- **THEN** distingue qué tratamientos corren bajo interés legítimo (analítica de producto, con oposición) y cuáles bajo consentimiento (publicidad personalizada, geo precisa, terceros, vinculación de dispositivos), e indica cómo ejercer portabilidad y supresión desde `/perfil`

### Requirement: Telemetría de producto bajo interés legítimo con oposición

La telemetría de producto de primer partido (page views, dwell time, scroll depth, interacciones con fichas) SHALL registrarse por defecto sin requerimiento de consentimiento, dejando de registrar eventos cuando exista una elección de privacidad válida del titular con la oposición al interés legítimo activada. Los eventos SHALL seguir enviándose con `user_id null` cuando el visitante sea anónimo y con el `user_id` del titular cuando la sesión esté activa.

#### Scenario: Visitante anónimo sin elección registrada
- **WHEN** un visitante navega sin haber expresado oposición
- **THEN** la telemetría de producto se registra (eventos con deviceId, `user_id null`) y el banner informa el tratamiento con su opción de rechazo

#### Scenario: Titular opuesto al interés legítimo
- **WHEN** existe una elección válida con `legitimateInterestOpposed: true`
- **THEN** no se registran eventos de telemetría de producto y los buffers pendientes se descartan

#### Scenario: Visitante con elección sin oposición
- **WHEN** existe una elección válida con oposición desactivada (aunque los consentimientos estén todos OFF)
- **THEN** la telemetría de producto se registra normalmente

### Requirement: Banner de consentimiento en primera visita

El sistema SHALL mostrar un banner/modal de privacidad en la primera visita cuando no exista una elección de privacidad válida local, con acciones de igual prominencia: "Aceptar todo", "Rechazar todo" y "Gestionar opciones" (granular, reutilizando las preferencias existentes). Al elegir cualquier opción SHALL persistir la elección localmente (token v2, 390 días) y SHALL enviarla al registro CMP del servidor. Cerrar sin elegir SHALL equivale a rechazar todo (defaults conservadores). El banner SHALL informar explícitamente que la analítica de producto corre bajo interés legítimo y puede oponerse.

#### Scenario: Primera visita anónima
- **WHEN** un visitante llega a cualquier página pública sin token local válido
- **THEN** se muestra el banner con las tres acciones y ninguna opción preseleccionada

#### Scenario: Elección registrada
- **WHEN** el visitante elige una opción y la API responde OK
- **THEN** se guarda el token local v2 con expiración a 390 días y el banner no vuelve a aparecer en visitas posteriores

#### Scenario: API de consentimiento no disponible
- **WHEN** el POST al registro CMP falla
- **THEN** la elección se persiste localmente igualmente (degradación con pérdida de respaldo server-side) y el banner no reaparece

### Requirement: Revocación total de la elección

El sistema SHALL ofrecer en "Ajustes de privacidad" (perfil) la acción "Restablecer elección" que borra el token local y la cookie de consentimiento, haciendo reaparecer el banner en la siguiente navegación. La acción SHALL estar disponible sin importar el plan del usuario.

#### Scenario: Revocación desde el perfil
- **WHEN** el usuario pulsa "Restablecer elección" en Ajustes de privacidad
- **THEN** el token local y la cookie `gf_consent` se eliminan y en la siguiente navegación el banner reaparece

### Requirement: Personalización publicitaria gated por consentimiento

La selección de sponsorships SHALL distinguir inventario contextual (coincidencia por página/plan/ubicación declarada, sin datos de comportamiento) de inventario personalizado por audiencia (segmentos comerciales, tier de poder adquisitivo, cultivo de interés). El matching por audiencia SHALL aplicarse únicamente si existe elección válida con `personalizedAds: true`; en caso contrario SHALL degradarse a inventario contextual o genérico.

#### Scenario: Usuario sin consentimiento de ads personalizadas
- **WHEN** se solicita inventario publicitario y la elección del usuario no incluye `personalizedAds`
- **THEN** los sponsorships con targeting por segmentos/tier/interés se excluyen y solo se consideran los de targeting vacío o contextual

#### Scenario: Usuario con consentimiento
- **WHEN** la elección incluye `personalizedAds: true`
- **THEN** se aplica el matching completo por audiencia existente

### Requirement: Portabilidad de datos (ARSOP)

El sistema SHALL permitir al titular autenticado descargar todos sus datos personales en formato JSON legible (perfil, huertos, cultivos, árboles, tareas, registro, suscripciones, consentimientos y eventos de telemetría propios) desde `/perfil`, vía endpoint autenticado que responde como attachment.

#### Scenario: Exportación exitosa
- **WHEN** el titular autenticado solicita la exportación en `/perfil`
- **THEN** recibe un archivo JSON con las secciones de datos propias y ninguna fila de otros usuarios

#### Scenario: Anónimo no puede exportar
- **WHEN** un visitante sin sesión llama al endpoint de exportación
- **THEN** recibe 401 sin datos

### Requirement: Supresión de cuenta (ARSOP)

El sistema SHALL permitir al titular autenticado eliminar su cuenta y datos personales desde `/perfil` con confirmación explícita. La supresión SHALL: (a) bloquearse mientras exista suscripción activa o en trial (orientando a cancelarla primero), (b) eliminar las filas propias de huertos, cultivos, árboles, tareas, registro, consentimientos, eventos de telemetría y audiencias, (c) eliminar el usuario de auth (cascada al perfil), y (d) cerrar la sesión local.

#### Scenario: Supresión con suscripción activa
- **WHEN** el titular con suscripción activa solicita supresión
- **THEN** la operación se rechaza con un mensaje que indica cancelar primero la suscripción en Mercado Pago

#### Scenario: Supresión exitosa
- **WHEN** el titular sin suscripción activa confirma la supresión
- **THEN** sus filas de datos y su usuario de auth se eliminan, la sesión se cierra y es redirigido a la landing

### Requirement: Gate de edad en el registro

El formulario de registro SHALL exigir un checkbox obligatorio declarando tener al menos 14 años; sin él el registro no procede. Los términos SHALL declarar que usuarios menores de 16 requieren autorización de sus representantes legales.

#### Scenario: Registro sin declarar edad
- **WHEN** se envía el formulario sin marcar el checkbox de edad
- **THEN** el navegador bloquea el envío (atributo required) y el texto legal explica el requisito

### Requirement: Cabeceras de seguridad

El sistema SHALL enviar en todas las respuestas HTML: `Strict-Transport-Security` (max-age ≥ 1 año), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y una `Permissions-Policy` restrictiva, con `poweredByHeader` deshabilitado. Adicionalmente SHALL enviar una `Content-Security-Policy` con nonce por respuesta para scripts (con `strict-dynamic`) que no dependa de `unsafe-inline` para scripts propios.

#### Scenario: Respuesta con cabeceras de seguridad
- **WHEN** se solicita cualquier página HTML en producción
- **THEN** la respuesta incluye las cabeceras listadas y una CSP con nonce único

#### Scenario: Script inline legítimo funciona bajo CSP
- **WHEN** la landing renderiza el JSON-LD de Organization y los scripts de Next
- **THEN** todos los scripts inline llevan el nonce de la respuesta y no son bloqueados por la CSP
