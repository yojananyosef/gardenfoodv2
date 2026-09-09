# auth Specification

## Purpose
Gobernar el flujo de autenticación por email del producto: confirmación de cuenta vía link con intercambio de código por sesión, recuperación y restablecimiento de contraseña, y validación de destinos de redirección para impedir open redirects. Es la puerta de entrada del funnel freemium, debe funcionar idéntico en desarrollo y producción.

## Requirements

### Requirement: Confirmación de registro vía callback

El sistema SHALL completar la creación de sesión al confirmar el email: el registro (`signUp`) debe enviar un destino `emailRedirectTo` hacia la ruta de confirmación de la propia aplicación (`/auth/confirm`), construido a partir del origin actual de la ventana (no hardcodeado), de modo que el link del correo funcione en el entorno desde donde se registró el usuario (desarrollo o producción).

#### Scenario: Usuario confirma su email con código válido
- **WHEN** el usuario abre el link de confirmación y llega a `/auth/confirm?code=<código>&next=<destino>`
- **THEN** la aplicación intercambia el código por una sesión (cookie SSR httpOnly) y redirige al usuario al destino validado, por defecto `/huerto`

#### Scenario: El registro envía destino de confirmación correcto
- **WHEN** un usuario envía el formulario de registro en `https://<dominio-produccion>`
- **THEN** el `signUp` incluye `emailRedirectTo: https://<dominio-produccion>/auth/confirm?next=/huerto` (o el `next` original de la query)

#### Scenario: El usuario ya confirmó (link re-usado o sesión previa)
- **WHEN** llega a `/auth/confirm` con un código inválido/expirado pero existe una sesión activa en cookies
- **THEN** la aplicación redirige al destino validado sin mostrar error (idempotente)

### Requirement: Validación anti open-redirect del parámetro next

El sistema SHALL aceptar como destino de redirección únicamente rutas internas relativas: `next` debe empezar por `/` y no por `//`; cualquier otro valor (absoluto, protocol-relative, con esquema) cae al default `/huerto`.

#### Scenario: next con URL absoluta externa
- **WHEN** el callback recibe `next=https://malicioso.cl` o `next=//malicioso.cl`
- **THEN** la redirección final va a `/huerto` y nunca al dominio externo

#### Scenario: next con ruta interna válida
- **WHEN** el callback recibe `next=/calendario`
- **THEN** la redirección final va a `/calendario`

### Requirement: Página de error de confirmación

El sistema SHALL mostrar una página de error accesible cuando la confirmación falla sin sesión previa (código expirado, inválido o faltante), explicando la causa probable y ofreciendo re-envío de confirmación desde la pantalla de registro y acceso a recuperación de contraseña. El acceso a `/auth/confirm/error` no debe quedar bloqueado por el middleware de rutas protegidas.

#### Scenario: Código expirado sin sesión
- **WHEN** el intercambio falla y no hay sesión activa
- **THEN** la aplicación redirige a la página de error de confirmación con mensaje orientado a re-enviar confirmación o iniciar sesión

### Requirement: Recuperación de contraseña

El sistema SHALL permitir solicitar el restablecimiento de contraseña desde `/recuperar` llamando al flujo nativo de reset con el mismo destino de confirmación (`/auth/confirm?next=/restablecer`). La pantalla de login SHALL enlazar a `/recuperar` en lugar del `href="#"` actual. La respuesta del formulario no SHALL revelar si el email existe en la plataforma (evitar enumeración de cuentas).

#### Scenario: Solicitud de recuperación con email existente
- **WHEN** el usuario envía su email en `/recuperar` y el correo existe
- **THEN** Supabase envía el email de reset con link a `/auth/confirm?next=/restablecer` y la UI muestra confirmación genérica de envío

#### Scenario: Solicitud de recuperación con email inexistente
- **WHEN** el usuario envía un email que no está registrado
- **THEN** la UI muestra el mismo mensaje genérico de envío (sin revelar existencia de la cuenta)

### Requirement: Restablecimiento de contraseña

El sistema SHALL ofrecer `/restablecer` para fijar una nueva contraseña usando la sesión de recuperación: exige mínimo 8 caracteres, confirma la clave (los dos campos deben coincidir) y al éxito redirige a `/huerto` con la sesión activa. El acceso sin sesión de recuperación o con sesión caducada redirige a `/recuperar`.

#### Scenario: Restablecimiento exitoso
- **WHEN** el usuario con sesión de recuperación envía nueva contraseña válida (≥8 chars, coincidentes)
- **THEN** la contraseña se actualiza y la aplicación redirige a `/huerto` autenticado

#### Scenario: Acceso a /restablecer sin sesión de recuperación
- **WHEN** un visitante abre `/restablecer` sin sesión activa
- **THEN** la aplicación lo redirige a `/recuperar`

### Requirement: Rutas de auth exentas de gating

El middleware de rutas protegidas (`proxy.ts`) SHALL permitir el acceso anónimo a `/auth/confirm` y su página de error, además de las rutas `(auth)` existentes, para que los links de email funcionen sin sesión previa. Adicionalmente, un usuario ya autenticado que abre `/recuperar` o `/restablecer` no SHALL ser redirigido automáticamente a `/huerto` si llegó desde un link de reset (el flujo de cambio de clave es válido también con sesión activa).

#### Scenario: Anónimo accede al callback
- **WHEN** un usuario sin sesión abre `/auth/confirm?code=...`
- **THEN** el middleware deja pasar la petición (no redirige a `/registro`)
