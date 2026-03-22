# COMUNET — Módulos y Rutas

## Módulos

| Módulo | Descripción |
|--------|-------------|
| auth | Login, logout, sesión, permisos |
| offices | Gestión del despacho |
| communities | Comunidades, edificios |
| units | Unidades funcionales |
| contacts | Propietarios, inquilinos, titularidades, cargos |
| finance | Presupuestos, cuotas, recibos, pagos, deuda |
| incidents | Incidencias, comentarios |
| meetings | Reuniones, actas, votaciones |
| documents | Gestión documental |
| providers | Proveedores |
| notifications | Notificaciones in-app y adapters |
| reports | Reportes y KPIs |
| settings | Configuración, usuarios, roles |
| audit | Registro de auditoría |

## Rutas

### Público
| Ruta | Módulo | Descripción |
|------|--------|-------------|
| `/login` | auth | Página de login |

### Backoffice
| Ruta | Módulo | Descripción |
|------|--------|-------------|
| `/dashboard` | dashboard | Panel principal |
| `/communities` | communities | Listado de comunidades |
| `/communities/[id]` | communities | Detalle de comunidad |
| `/communities/[id]/units` | units | Unidades de la comunidad |
| `/owners` | contacts | Listado de propietarios |
| `/tenants` | contacts | Listado de inquilinos |
| `/finance/budgets` | finance | Presupuestos |
| `/finance/receipts` | finance | Recibos |
| `/finance/payments` | finance | Pagos |
| `/incidents` | incidents | Listado de incidencias |
| `/incidents/[id]` | incidents | Detalle de incidencia |
| `/meetings` | meetings | Listado de reuniones |
| `/meetings/[id]` | meetings | Detalle de reunión |
| `/documents` | documents | Documentos |
| `/providers` | providers | Proveedores |
| `/reports` | reports | Reportes |
| `/settings` | settings | Configuración general |
| `/settings/users` | settings | Usuarios |
| `/settings/audit` | audit | Auditoría |

### Portal
| Ruta | Módulo | Descripción |
|------|--------|-------------|
| `/portal` | portal | Dashboard del portal |
| `/portal/receipts` | finance | Recibos del propietario |
| `/portal/documents` | documents | Documentos publicados |
| `/portal/incidents` | incidents | Incidencias |
| `/portal/incidents/[id]` | incidents | Detalle de incidencia |
| `/portal/meetings` | meetings | Reuniones |

### API
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | GET | Healthcheck |
| `/api/exports/receipts` | GET | Export CSV recibos |
| `/api/documents/[id]/download` | GET | Descarga documento |
| `/api/mock/email` | POST | Mock de envío email |
