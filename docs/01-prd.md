# COMUNET — Product Requirements Document

## Visión General

COMUNET es una aplicación SaaS web multi-tenant para la administración de comunidades de propietarios en España. Está diseñada para despachos profesionales de administración de fincas que gestionan múltiples comunidades desde un único panel.

## Problema

Los despachos de administración de fincas necesitan una herramienta moderna, integrada y accesible que:

- Centralice la gestión administrativa, financiera y documental de múltiples comunidades.
- Ofrezca portales diferenciados para propietarios, presidentes y proveedores.
- Garantice aislamiento de datos entre despachos y comunidades.
- Permita trazabilidad y auditoría de todas las operaciones.
- Sea extensible para futuras integraciones (SEPA, AEAT, firma digital, etc.).

## Usuarios Objetivo

| Rol | Nombre en UI | Descripción |
|-----|---|-------------|
| **SUPERADMIN** | Superadmin | Acceso global al sistema |
| **OFFICE_ADMIN** | Administrador | Administración completa del despacho |
| **PRESIDENT** | Presidente | Owner con cargo activo, vista extendida de su comunidad |
| **OWNER** | Propietario | Acceso limitado a sus datos |
| **PROVIDER** | Industrial | Solo incidencias asignadas |

## Portales

1. **Backoffice**: Panel completo para el despacho/administrador.
2. **Portal Propietario**: Consulta de recibos, documentos, incidencias y reuniones.
3. **Portal Presidente**: Extensión del portal propietario con resumen financiero y global.
4. **Portal Industrial**: Gestión de incidencias asignadas.

## Alcance MVP

### Incluido
- Gestión multi-comunidad
- Comunidades, edificios, unidades, propietarios, inquilinos
- Cargos de junta
- Finanzas básicas: presupuestos, cuotas, recibos, pagos, deuda
- Incidencias y mantenimiento
- Reuniones, asistentes, votaciones, actas
- Gestión documental por comunidad
- Notificaciones in-app
- Reportes básicos
- Auditoría

### Preparado (interfaces/adapters)
- SEPA / remesas
- Conciliación bancaria
- AEAT / fiscalidad
- Firma digital
- Correo certificado
- Almacenamiento cloud (S3)
- Envío real de emails

## Localización

- UI en español
- Código y rutas en inglés
- Fechas: dd/MM/yyyy
- Moneda: EUR
- Timezone: Europe/Madrid
- Formato numérico: es-ES
