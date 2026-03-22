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
- Almacenamiento local en filesystem, no cloud.
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

## Infraestructura
- Solo ejecución local con Docker Compose.
- No hay CI/CD configurado.
- No hay despliegue a producción.
- No hay monitorización ni alertas.

## Cómo completar cada limitación

Cada limitación tiene su interfaz/adapter preparado. Para completar:

1. **Email real**: Implementar `EmailAdapter` con SMTP/SendGrid en `src/lib/notifications/`.
2. **SEPA**: Implementar `SepaAdapter` en `src/lib/integrations/sepa/`.
3. **S3 Storage**: Implementar `S3StorageAdapter` en `src/lib/storage/`.
4. **Firma digital**: Implementar `SignatureAdapter` en `src/lib/integrations/signature/`.
5. **AEAT**: Implementar `AeatAdapter` en `src/lib/integrations/fiscal/`.
6. **Recuperación de contraseña**: Añadir flujo en `src/modules/auth/`.
