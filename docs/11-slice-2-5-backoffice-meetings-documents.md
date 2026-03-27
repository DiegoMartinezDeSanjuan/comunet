# COMUNET — Slice 2.5 Backoffice Meetings + Documents + Local Storage

## Objetivo
Completar el carril de backoffice para reuniones y documentos sin romper los slices ya cerrados de finanzas, incidencias, proveedores y portal.

## Alcance de este bloque
- `/meetings`
- `/meetings/[id]`
- `/documents`
- `/documents/[id]`
- `/api/documents/[id]/download`
- módulos `meetings` y `documents` con `schema.ts`, `server/repository.ts`, `server/queries.ts`, `server/services.ts`, `server/actions.ts`

## Decisiones técnicas
- Se reutiliza el modelo Prisma existente (`Meeting`, `AgendaItem`, `Minute`, `Document`), por lo que este bloque no requiere migración.
- Las reglas de negocio críticas se centralizan en servicios:
  - transiciones de estado de reunión
  - validación de despacho por comunidad
  - archivado lógico de documentos
  - validación de tamaño de fichero
- La descarga documental pasa por `/api/documents/[id]/download` y valida permisos servidor con `canReadDocument`.
- El almacenamiento sigue siendo local con `src/lib/storage/index.ts`.

## Pendientes razonables para el siguiente bloque de 2.5
- seed demo de documentos y más reuniones con actas reales
- tests unitarios de meetings/documents
- smoke e2e de reuniones + documentos
- posible carga de asistentes y votos desde backoffice
- posible botón de descarga también en portal documents si quieres cerrar ese carril más adelante
