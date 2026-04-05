# COMUNET — Limitaciones del MVP

## Autenticación
- Auth custom con JWT HS256 (firmado con `jose`), no OAuth/OpenID.
- No hay recuperación de contraseña (preparable post-MVP).
- ~~No hay 2FA~~ → ✅ **Implementado**: flujo TOTP en `login/mfa/setup` y `login/mfa/verify`.
- No hay registro público de usuarios, solo creación desde backoffice.

## Finanzas
- No es contabilidad completa (no hay plan general contable).
- No hay generación de remesas SEPA operativa (solo interfaz preparada).
- No hay conciliación bancaria automatizada.
- No hay facturación al despacho.
- Cálculo de cuotas simplificado (base × coeficiente).

## Documentos
- Storage local en dev, S3 preparado para producción.
- No hay preview in-app de documentos.
- No hay versionado de documentos.
- Límite de tamaño gestionado por Next.js config.

## Comunicaciones
- ~~Email mockeado~~ → ✅ **Implementado**: Resend como servicio transaccional cuando `RESEND_API_KEY` está configurada; mock fallback (logs + BD) sin API key.
- No hay notificaciones push.
- No hay SMS/WhatsApp.

## Legal
- No hay firma digital de actas.
- No hay integración AEAT.
- No hay certificados digitales.

## UI/UX
- Responsive básico, no optimizado para móvil.
- No hay PWA.
- No hay modo offline.
- No hay internacionalización (solo español).
- ~~Sin loading states~~ → ✅ **Implementado**: `loading.tsx` en todas las zonas.
- ~~Sin error boundaries~~ → ✅ **Implementado**: `error.tsx` + `global-error.tsx` + `not-found.tsx`.

## Infraestructura
- ~~Sin connection pooling~~ → ✅ **Implementado**: PgBouncer configurado.
- ~~Sin rate limiting~~ → ✅ **Implementado**: Valkey/Redis vía ioredis (ruta activa); Upstash driver legado disponible; in-memory fatal en prod.
- ~~Sin security headers~~ → ✅ **Implementado**: HSTS, CSP (estática, `unsafe-inline`), X-Frame-Options, etc.
- ~~Sin health endpoint~~ → ✅ **Implementado**: `/api/health` (liveness + readiness).
- CSP con nonces criptográficos planificada (PR aparte; requiere render dinámico global).
- Revocación de tokens opera en fail-open (ver `docs/06-security-and-permissions.md`).
- `CACHE_DRIVER=memory` es fatal en producción (escape: `ALLOW_INSECURE_MEMORY_CACHE=true`).
- Despliegue multi-instancia/HA con Redis pendiente de fase 2.
- No hay CI/CD configurado.
- No hay monitorización ni alertas (APM pendiente).

## Testing

- E2E: 3 specs implementados de 12 definidos en `docs/07-testing.md`.
- Load: 1 escenario k6 implementado de 5 definidos (login + dashboard + communities).
- Ver `docs/07-testing.md` para la cobertura deseada y los gaps actuales.

## Cómo completar cada limitación pendiente

Cada limitación tiene su interfaz/adapter preparado. Para completar:

1. **SEPA**: Implementar `SepaAdapter` en `src/lib/integrations/sepa/`.
2. **Firma digital**: Implementar `SignatureAdapter` en `src/lib/integrations/signature/`.
3. **AEAT**: Implementar `AeatAdapter` en `src/lib/integrations/fiscal/`.
4. **Recuperación de contraseña**: Añadir flujo en `src/modules/auth/`.
5. **CI/CD**: GitHub Actions con build → test → deploy.
6. **APM**: OpenTelemetry + structured logging.
7. **CSP nonces**: PR dedicado siguiendo patrón oficial de Next.js (proxy + x-nonce).
8. **Fail-closed**: Activar cuando hay Redis HA + observabilidad.
