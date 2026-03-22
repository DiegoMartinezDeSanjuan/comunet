# COMUNET — Estrategia de Testing

## Herramientas

| Herramienta | Uso |
|-------------|-----|
| Vitest | Unit tests |
| Playwright | E2E tests |
| ESLint | Linting |
| TypeScript | Type checking |

## Comandos

```bash
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest run
pnpm test:watch    # vitest (watch mode)
pnpm test:e2e      # playwright test
```

## Unit Tests Mínimos

1. **Cálculo de deuda** — dado un conjunto de recibos y pagos, calcular deuda correcta.
2. **Transición de estados de recibo** — solo transiciones válidas permitidas.
3. **Generación de recibos** — a partir de reglas de cuota y período.
4. **Permisos por rol y alcance** — cada helper de permiso devuelve correcto para cada rol.
5. **Visibilidad de incidencias** — owner solo ve las suyas, provider solo las asignadas.
6. **Lógica de presidente activo** — cargo con fechas correctas.

## E2E Tests Mínimos

1. Login como admin
2. Crear comunidad
3. Crear propietario
4. Crear unidad y asociar propietario
5. Crear presupuesto
6. Generar recibos
7. Registrar pago
8. Crear incidencia
9. Asignar incidencia a proveedor
10. Crear reunión y borrador de acta
11. Login como owner → ver recibos y documentos
12. Login como provider → ver incidencia asignada
