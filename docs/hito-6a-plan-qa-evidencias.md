# Hito 6A - Plan de QA y registro de evidencias

## 1. Objetivo

Validar que Mercado Pago opera de punta a punta sin confiar en el navegador, sin duplicar pedidos ni descuentos de stock y con información consistente para comprador, productor y administración.

## 2. Controles automatizados obligatorios

```bash
cd backend
php -d memory_limit=-1 artisan test

cd ../frontend
npm run lint
npm run build
```

La suite debe cubrir:

- creación idempotente de preferencias;
- reserva de stock por 30 minutos;
- compra de la última unidad disponible;
- firma válida e inválida del webhook;
- eventos duplicados y fuera de orden;
- consulta server-to-server antes de modificar el estado;
- aprobación con descuento exacto una sola vez;
- rechazo, cancelación y vencimiento con liberación de reservas;
- aprobación tardía sin stock llevada a revisión;
- reintento sin duplicar pedidos;
- bloqueo del productor antes de la aprobación;
- notificaciones únicas por transición;
- filtros, detalle y notas del panel administrativo de pagos.

## 3. Matriz manual Sandbox

| Escenario | Resultado esperado | Evidencia |
|---|---|---|
| Pago aprobado | Resultado aprobado, pedido confirmado, stock descontado, emails enviados. | Capturas de comprador/productor/admin y registro Mercado Pago. |
| Pago pendiente real | Stock reservado, pedido pendiente, mensaje claro, sin habilitar preparación. | Capturas y estado interno. |
| Pago rechazado | Pedido cancelado/no confirmado, reserva liberada, opción de reintento. | Capturas y stock antes/después. |
| Pago cancelado/abandonado | Al vencer la reserva se consulta Mercado Pago y se libera stock. | Historial y ejecución del scheduler. |
| Webhook duplicado | Una transacción y un único descuento de stock. | Conteos en administración/base de datos. |
| Firma inválida | HTTP 401, sin cambio de pedido ni inventario. | Respuesta y ausencia de transición. |
| Importe o moneda inconsistente | Estado “En revisión”, sin descuento. | Panel Pagos y nota administrativa. |
| Reintento | Nueva preferencia, mismos pedidos, nueva reserva válida. | Referencias anterior/nueva. |
| Multi-productor | Todos los pedidos asociados se confirman de forma atómica. | Detalle administrativo. |

## 4. Flujo por rol

### Comprador

1. Agregar productos con stock al carrito.
2. Elegir **Pagar con Mercado Pago**.
3. Completar un caso Sandbox.
4. Confirmar que la página de resultado consulta el estado interno.
5. Abrir **Mis pedidos** y verificar método, estado, importe y fechas.
6. Probar reintento cuando corresponda.

### Productor

1. Abrir **Pedidos recibidos**.
2. Confirmar que un pago pendiente bloquea preparación/envío.
3. Confirmar que un pago aprobado habilita los controles.
4. Abrir **Pagos y cobros** y verificar estado y pedidos asociados.
5. Confirmar recepción del correo de nueva venta pagada.

### Administrador

1. Abrir **Panel administrador > Pagos**.
2. Buscar por comprador, email, pedido, referencia o ID de Mercado Pago.
3. Filtrar cada estado y “Solo revisión”.
4. Abrir detalle y revisar transacciones, webhooks e historial.
5. Abrir pedidos vinculados.
6. Guardar una nota interna y confirmar auditoría.

## 5. Verificación posterior al despliegue

```text
https://mercadoahora.com.ar/up
https://api.mercadoahora.com.ar/up
https://www.mercadoahora.com.ar
```

- Contenedores `backend`, `queue`, `scheduler`, `frontend`, `postgres` y `caddy` saludables.
- Migraciones aplicadas.
- Webhook firmado aceptado y procesado por el worker.
- Webhook sin firma rechazado.
- Scheduler visible y sin reservas vencidas bloqueadas.
- Logs sin credenciales ni payloads sensibles.

## 6. Prueba real controlada

Esta prueba se realiza únicamente después de aprobar Sandbox y configurar credenciales productivas:

1. Crear un producto de monto bajo y stock conocido.
2. Realizar una compra real.
3. Verificar débito/acreditación en Mercado Pago.
4. Verificar webhook productivo.
5. Verificar pedido confirmado y descuento exacto de stock.
6. Verificar vistas de comprador, productor y administrador.
7. Verificar emails.
8. Guardar fecha, referencia interna, ID externo y resultado, sin registrar secretos.

## 7. Estado de cierre

La implementación técnica puede declararse terminada cuando automatización, despliegue y matriz Sandbox estén aprobados. La activación productiva requiere además credenciales productivas, aprobación explícita y evidencia de la compra real controlada. Esta separación evita afirmar una validación con dinero real antes de ejecutarla.
