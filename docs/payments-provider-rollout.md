# Cobros directos por negocio

## Variables de entorno

```text
# Sólo para membresías, facturas y servicios propios de Tlaco.
TLACO_MP_ACCESS_TOKEN=

# Aplicación OAuth de Tlaco, registrada en Mercado Pago.
MP_OAUTH_CLIENT_ID=
MP_OAUTH_CLIENT_SECRET=
MP_OAUTH_REDIRECT_URI=https://tlaco.app/api/payment-providers/mercadopago/callback

# Secreto de al menos 32 caracteres. Cifra los tokens OAuth antes de guardarlos.
MERCHANT_TOKEN_ENCRYPTION_KEY=

# Secreto de Webhooks de la aplicación Mercado Pago.
MERCADOPAGO_WEBHOOK_SECRET=
```

`MERCADOPAGO_ACCESS_TOKEN` queda como compatibilidad temporal para cobros
históricos. No se debe usar en ningún flujo nuevo de venta del negocio.

## Orden de despliegue

1. Aplicar `20260913000001_payment_provider_foundation.sql` y regenerar tipos:
   `npx supabase gen types typescript --linked > src/types/database.types.ts`.
2. Configurar las variables anteriores y registrar la URL de callback HTTPS en
   Mercado Pago.
3. Desplegar la rama con `merchant_payments_v2_enabled = false` por defecto.
4. Conectar una cuenta de prueba desde Configuración > Finanzas. La aceptación
   del anexo se registra junto con la conexión.
5. Probar checkout web y el webhook. Confirmar que `payments.funds_owner` es
   `tenant` y que no aparece en `settlements`.
6. Sincronizar una Point de la misma cuenta y hacer una venta presencial de
   prueba. La comisión de Point debe crear un `tenant_billing_item`, nunca un
   Split ni una liquidación Tlaco.
7. Activar Split sólo después de que Mercado Pago habilite Marketplace para la
   cuenta de Tlaco; cambiar `capabilities.split_fee` mediante un proceso de
   plataforma auditado.

## Reglas operativas

- El owner es el único que conecta, refresca o desconecta la cuenta.
- Todo webhook se valida, consulta el recurso con el token OAuth del negocio y
  comprueba importe, intento y `merchant_account_id` antes de actualizar una
  orden.
- `marketplace_fee` sólo se envía cuando la política está aceptada y la
  capacidad `split_fee` está habilitada. Point convierte una comisión aplicable
  en una línea de facturación mensual.
- Si OAuth vence o se revoca, los cobros digitales nuevos se bloquean; efectivo
  y transferencia continúan.
