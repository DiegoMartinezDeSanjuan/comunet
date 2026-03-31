# COMUNET — Reglas de Negocio

## Multi-tenancy
- Un despacho (Office) gestiona múltiples comunidades.
- Toda query y mutación está limitada por `officeId`.
- No se permite acceso cruzado entre despachos.
- No se permite acceso cruzado entre comunidades (salvo a nivel despacho).

## Comunidades y Unidades
- Una comunidad tiene múltiples edificios (Buildings).
- Un edificio tiene múltiples unidades (Units).
- Una unidad puede existir sin edificio (comunidad sin portales).
- Cada unidad tiene coeficiente de participación y porcentaje de cuota.
- Las unidades pueden activarse/desactivarse.

## Propietarios y Titularidad
- Un propietario puede tener múltiples unidades.
- Una unidad puede tener múltiples propietarios.
- La titularidad (Ownership) tiene porcentaje, fechas y contacto principal.
- Solo un propietario por unidad puede ser contacto principal de facturación.

## Cargos de Junta
- Un presidente es un propietario con cargo activo (BoardPosition.role = 'PRESIDENT').
- Los cargos tienen fecha de inicio y fin.
- Un cargo activo es aquel con `startDate <= hoy` y (`endDate` es null o `endDate >= hoy`).

## Finanzas
- Los importes usan `Decimal`, nunca `Float`.
- Los presupuestos son anuales por comunidad.
- Las reglas de cuota definen frecuencia y base de cálculo.
- La generación de recibos parte de las reglas de cuota activas.
- Un recibo tiene estados: DRAFT → ISSUED → PAID/PARTIALLY_PAID/OVERDUE/RETURNED/CANCELLED.
- Un pago parcial actualiza el saldo pendiente.
- Un recibo vencido o devuelto impacta en la deuda.
- La deuda se calcula por propietario/unidad/comunidad.

## Incidencias
- Se pueden crear desde backoffice o desde el portal owner/president.
- Se asignan a un proveedor.
- Los comentarios internos (INTERNAL) no son visibles en portales.
- El proveedor solo puede cambiar a estados permitidos.
- Todo cambio de estado genera auditoría.

## Reuniones
- Tipos: ordinaria y extraordinaria.
- Flujo: DRAFT → SCHEDULED → HELD → CLOSED.
- Los votos se registran por punto del orden del día.
- Las actas tienen flujo: DRAFT → GENERATED → APPROVED.

## Documentos
- Se categorizan por tipo.
- Visibilidad: INTERNAL (solo backoffice), OWNERS (visible en portal), PUBLIC.
- Almacenamiento local en desarrollo, preparado para S3.

## Acceso por Rol
- **OWNER (Propietario)**: solo ve comunidades/unidades donde tiene titularidad activa.
- **PROVIDER (Industrial)**: solo ve incidencias donde `assignedProviderId = linkedProviderId`.
- **PRESIDENT (Presidente)**: owner con cargo activo, ve información global resumida de su comunidad.
- Todo listado y detalle comprueba alcance antes de devolver datos.

## Auditoría
- Toda operación de escritura importante genera un registro en AuditLog.
- Se registra: userId, entityType, entityId, action, metaJson, timestamp.

## Borrado
- Los borrados de entidades con dependencias son soft-delete (`archivedAt`).
- Las entidades archivadas no aparecen en listados por defecto.
