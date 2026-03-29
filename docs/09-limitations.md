# COMUNET — Limitaciones del MVP

## Autenticación
- Auth custom con cookies firmadas, no OAuth/OpenID.
- No hay recuperación de contraseña (preparable post-MVP).
- No hay 2FA.
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
- Email mockeado (registrado en logs/tabla, no enviado).
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
- ~~Sin rate limiting~~ → ✅ **Implementado**: Upstash Redis / in-memory.
- ~~Sin security headers~~ → ✅ **Implementado**: HSTS, CSP, etc.
- ~~Sin health endpoint~~ → ✅ **Implementado**: `/api/health` (liveness + readiness).
- No hay CI/CD configurado.
- No hay monitorización ni alertas (APM pendiente).

## Cómo completar cada limitación pendiente

Cada limitación tiene su interfaz/adapter preparado. Para completar:

1. **Email real**: Implementar `EmailAdapter` con SMTP/SendGrid en `src/lib/notifications/`.
2. **SEPA**: Implementar `SepaAdapter` en `src/lib/integrations/sepa/`.
3. **Firma digital**: Implementar `SignatureAdapter` en `src/lib/integrations/signature/`.
4. **AEAT**: Implementar `AeatAdapter` en `src/lib/integrations/fiscal/`.
5. **Recuperación de contraseña**: Añadir flujo en `src/modules/auth/`.
6. **CI/CD**: GitHub Actions con build → test → deploy.
7. **APM**: OpenTelemetry + structured logging.
