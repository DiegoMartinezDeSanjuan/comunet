# COMUNET — Estrategia de Testing

## Herramientas

| Herramienta | Uso |
|-------------|-----|
| Vitest | Unit tests |
| Playwright | E2E tests |
| k6 | Load / performance testing |
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

### Load Testing (k6)

```bash
# Instalar k6
choco install k6       # Windows
brew install k6        # macOS

# Ejecutar test de carga
k6 run tests/load/load-test.js

# Con URL custom
k6 run -e BASE_URL=https://staging.comunet.es tests/load/load-test.js
```

Ver `tests/load/README.md` para detalles de interpretación de resultados.

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

## Load Tests (k6 Scenarios)

| Scenario | VUs | Duración | Objetivo |
|----------|-----|----------|----------|
| Login Storm | 50 | 2 min | p95 < 500ms |
| Portal Dashboard | 200 | 5 min | p95 < 300ms |
| Backoffice CRUD | 100 | 5 min | p95 < 400ms, error < 0.1% |
| Document Upload/Download | 50 | 5 min | upload p95 < 2s |
| Export Under Load | 210 | 5 min | export < 5s |

Ver `docs/scalability-review.md` para SLOs detallados y plan de validación.
