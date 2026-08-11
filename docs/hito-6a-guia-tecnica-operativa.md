# Hito 6A - Guía técnica y operativa de Mercado Pago

## 1. Alcance

El Hito 6A incorpora Mercado Pago Checkout Pro como primer medio de pago online de Mercado Ahora. Incluye creación de preferencias, reserva de stock, webhooks firmados, sincronización de estados, actualización transaccional de pedidos e inventario, reintentos, notificaciones y consulta administrativa.

Quedan fuera de este hito: conciliación financiera completa, reembolsos automáticos, liquidaciones a productores, split payments, wallet, reportes financieros avanzados e integración contable/fiscal.

## 2. Arquitectura del flujo

1. El comprador confirma su carrito y solicita pagar con Mercado Pago.
2. Laravel valida productos, precios y stock dentro de una transacción.
3. Se crean los pedidos por productor, un `PaymentIntent` común y reservas de stock por 30 minutos.
4. El adaptador `PaymentGateway` crea una preferencia de Checkout Pro con referencia interna UUID.
5. El navegador abre Mercado Pago, pero nunca confirma el pago por sí solo.
6. Mercado Pago envía un webhook firmado al backend.
7. El worker consulta el pago directamente en la API de Mercado Pago.
8. El procesador valida referencia, importe, moneda y entorno.
9. Al aprobarse, consume las reservas, descuenta stock una sola vez y confirma los pedidos.
10. Al rechazarse, cancelarse o vencer, libera las reservas sin descontar inventario.
11. Las vistas de comprador, productor y administrador leen el mismo estado interno verificado.

## 3. Estados internos

| Estado | Significado operativo |
|---|---|
| `pending` | Pago iniciado o procesándose; stock reservado. |
| `approved` | Pago validado; pedidos confirmados y stock descontado. |
| `rejected` | Pago rechazado; pedidos cancelados y reservas liberadas. |
| `cancelled` | Pago cancelado; pedidos cancelados y reservas liberadas. |
| `expired` | Reserva vencida sin aprobación; stock liberado. |
| `requires_review` | Inconsistencia que requiere revisión administrativa. |
| `failed` | Error recuperable durante la creación o sincronización. |

`approved` es terminal dentro de 6A: un evento posterior o duplicado no puede revertirlo ni descontar stock otra vez.

## 4. Persistencia y trazabilidad

- `payment_intents`: sesión interna de pago, estado normalizado, referencias y fechas.
- `payment_intent_order`: relación entre una sesión de pago y uno o más pedidos.
- `stock_reservations`: unidades retenidas temporalmente por producto y pedido.
- `payment_transactions`: pagos informados por Mercado Pago con identificador único.
- `payment_webhook_events`: recepción, firma, intentos y procesamiento de webhooks.
- `payment_status_histories`: transiciones de estado y origen de cada cambio.
- `payment_review_notes`: observaciones internas de administración.
- `admin_audit_logs`: auditoría de notas y acciones administrativas sensibles.

Los endpoints administrativos no exponen payloads completos, tokens, firmas ni secretos.

## 5. Variables de entorno

```text
MERCADO_PAGO_MODE=sandbox
MERCADO_PAGO_PUBLIC_KEY=<secreto>
MERCADO_PAGO_ACCESS_TOKEN=<secreto>
MERCADO_PAGO_WEBHOOK_SECRET=<secreto>
MERCADO_PAGO_SUCCESS_URL=https://mercadoahora.com.ar/checkout/pago/aprobado
MERCADO_PAGO_PENDING_URL=https://mercadoahora.com.ar/checkout/pago/pendiente
MERCADO_PAGO_FAILURE_URL=https://mercadoahora.com.ar/checkout/pago/fallido
MERCADO_PAGO_WEBHOOK_URL=https://api.mercadoahora.com.ar/api/v1/payments/webhooks/mercado_pago
MERCADO_PAGO_RESERVATION_MINUTES=30
```

Los valores sensibles deben existir únicamente en GitHub Secrets y `.env.production` del VPS. No deben copiarse al repositorio, documentación, capturas ni logs.

## 6. Servicios de producción

- `backend`: API Laravel y migraciones al iniciar.
- `queue`: procesa webhooks y correos con reintentos y backoff.
- `scheduler`: ejecuta `payments:expire-reservations` cada minuto.
- `frontend`: páginas de checkout, resultado y paneles.
- `postgres`: persistencia transaccional.
- `caddy`: HTTPS y proxy para dominio principal y API.

Comprobaciones operativas:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 queue
docker compose -f docker-compose.prod.yml logs --tail=100 scheduler
docker compose -f docker-compose.prod.yml exec backend php artisan migrate:status
docker compose -f docker-compose.prod.yml exec backend php artisan schedule:list
docker compose -f docker-compose.prod.yml exec backend php artisan queue:failed
```

## 7. Diagnóstico de incidentes

### El pago quedó pendiente

1. Revisar que el worker esté activo.
2. Buscar el evento en `payment_webhook_events`.
3. Revisar `payment_transactions` y `payment_status_histories`.
4. Confirmar que el secreto del webhook corresponde a la aplicación y modo activos.
5. Consultar el pago en Mercado Pago usando su referencia, sin modificar manualmente el stock.

### Webhook rechazado

- `401`: firma inválida o secreto incorrecto.
- `503`: secreto no configurado.
- `422`: evento sin identificador de pago.

### Stock inconsistente

No corregir stock antes de revisar reservas, transacciones e historial. Los pagos aprobados consumen inventario una sola vez; los pagos no aprobados solo liberan reservas.

### Pago en revisión

Administración debe abrir **Panel administrador > Pagos**, consultar referencias, transacciones, webhooks y pedidos, y registrar una nota interna. El MVP no permite aprobar manualmente un pago sin validación del proveedor.

## 8. Paso de Sandbox a producción

1. Aprobar toda la matriz Sandbox.
2. Confirmar cuenta receptora, titularidad y decisiones fiscales.
3. Crear/configurar la aplicación productiva en Mercado Pago Developers.
4. Instalar credenciales y secreto productivos como secretos protegidos.
5. Cambiar `MERCADO_PAGO_MODE=production`.
6. Confirmar URLs HTTPS y webhook productivo.
7. Desplegar y verificar worker/scheduler.
8. Realizar una compra real controlada de monto bajo.
9. Validar comprador, productor, administración, email, pedido y stock.
10. Guardar evidencia y aprobar formalmente la activación.

Nunca mezclar credenciales Sandbox y producción.

## 9. Reversión operativa

Ante una falla durante la activación productiva:

1. Deshabilitar temporalmente Mercado Pago en la configuración de entorno o volver a Sandbox.
2. Mantener pedidos y registros existentes; no borrar pagos ni webhooks.
3. Reintentar workers fallidos solo después de corregir la causa.
4. Restaurar la versión anterior del código mediante el procedimiento de despliegue.
5. Verificar base de datos, stock, pedidos y trazabilidad antes de reabrir pagos.
