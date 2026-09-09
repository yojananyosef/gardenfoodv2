## Purpose

Hacer visible y navegable el panel de administración desde la UI del producto (no por URL tecleada), con entrada condicionada al plan admin y navegación por pestañas dentro de la sección.

## ADDED Requirements

### Requirement: Entrada visible al panel admin

El sistema SHALL mostrar en TopBar un botón "Admin" y en BottomNav una entrada "Admin" únicamente cuando el usuario autenticado tenga `plan=admin` en `perfiles`. La sección admin SHALL tener un layout con navegación por pestañas (Overview · Usuarios · Finanzas · Audiencias · Patrocinios) con la pestaña activa resaltada, y el acceso SHALL seguir verificado tanto en el middleware como en cada página/layout.

#### Scenario: Admin navega desde cualquier página
- **WHEN** un usuario con plan admin está en el dashboard
- **THEN** TopBar y BottomNav muestran la entrada "Admin" que lo lleva a `/admin`

#### Scenario: Usuario no admin
- **WHEN** un usuario con plan gratuito/huertero/cosecha/full navega el dashboard
- **THEN** TopBar y BottomNav no muestran ninguna entrada admin y el intento directo a `/admin` es rechazado por el middleware y el layout

#### Scenario: Navegación por pestañas
- **WHEN** un admin está en `/admin/finanzas`
- **THEN** el layout admin resalta la pestaña "Finanzas" y ofrece las demás secciones con un clic
