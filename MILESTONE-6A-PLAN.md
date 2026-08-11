# Mercado Ahora - Plan de Implementacion del Hito 6A

## Mercado Pago basico operativo

**Version:** 1.0  
**Estado:** Alcance confirmado  
**Duracion estimada:** 2,5 semanas  
**Modalidad inicial:** Sandbox de Mercado Pago  

## 1. Proposito

El Hito 6A tiene como objetivo habilitar el primer flujo de pago online operativo de Mercado Ahora con Mercado Pago. El resultado esperado es que una persona compradora pueda confirmar su pedido, pagar mediante Mercado Pago y recibir una confirmacion confiable, mientras que el productor y la administracion puedan consultar el resultado de la operacion.

Este hito implementa el circuito minimo necesario para comenzar a validar ventas reales sin incorporar todavia procesos financieros avanzados. La prioridad es que el flujo critico de pago, pedido y stock sea seguro, consistente, trazable y verificable de punta a punta.

## 2. Alcance confirmado

El Hito 6A incluye:

- Integracion de Mercado Pago en modo Sandbox.
- Configuracion posterior de produccion para una prueba real controlada.
- Boton **Pagar con Mercado Pago** en el checkout existente.
- Creacion de la preferencia de pago exclusivamente desde el backend.
- Relacion trazable entre sesion de pago, pago y pedido o pedidos.
- Recepcion y validacion de webhooks.
- Consulta del pago en Mercado Pago antes de aceptar su estado como valido.
- Confirmacion automatica del pago.
- Estados basicos: pendiente, aprobado, rechazado, cancelado, vencido o abandonado.
- Actualizacion automatica de los pedidos relacionados.
- Reserva de stock durante 30 minutos.
- Confirmacion o liberacion automatica de la reserva segun el resultado del pago.
- Notificacion basica para comprador y productor.
- Panel administrativo basico de pagos.
- Historial basico de estados y transacciones.
- Pruebas automatizadas y pruebas funcionales en Sandbox.
- Prueba real controlada de bajo importe antes del lanzamiento.
- Documentacion tecnica y operativa basica.

## 3. Alcance expresamente excluido

Quedan fuera del Hito 6A:

- Conciliacion financiera completa.
- Reembolsos avanzados o parciales.
- Reportes financieros avanzados.
- Liquidaciones automaticas a productores.
- Compra Segura Mercado Ahora.
- Wallet o Mercado Ahora Pay.
- Split payments.
- Comisiones propias de Mercado Ahora.
- Auditoria financiera avanzada.
- Integracion contable, impositiva o fiscal.
- Automatizacion de facturacion.
- Disputas y chargebacks avanzados.
- Integraciones logisticas automaticas.
- Centro avanzado de notificaciones.

Estas capacidades deberan definirse y presupuestarse en hitos posteriores.

## 4. Reglas de negocio acordadas

1. El dinero ingresara inicialmente en la cuenta central de Mercado Pago de Mercado Ahora.
2. Mercado Ahora no cobrara una comision propia durante este hito.
3. El costo de Mercado Pago se tratara inicialmente como costo operativo de Mercado Ahora.
4. El stock se reservara durante 30 minutos mientras el pago permanezca pendiente.
5. Si el pago es aprobado, los pedidos relacionados se confirmaran y el stock reservado se consumira definitivamente.
6. Si el pago es rechazado, cancelado o vence, la reserva de stock se liberara.
7. Si el pago permanece pendiente, el pedido se mostrara como pendiente de confirmacion.
8. El retorno del navegador no sera considerado prueba suficiente del pago. El estado valido surgira de Mercado Pago y del procesamiento del webhook.
9. Un mismo evento o pago no podra confirmar pedidos ni descontar stock mas de una vez.
10. La prueba inicial se realizara con credenciales Sandbox. Las credenciales productivas se incorporaran solamente al final.

## 5. Decisiones tecnicas fundamentales

### 5.1 Una compra puede generar varios pedidos

El checkout actual puede separar el carrito en pedidos distintos segun el productor. Mercado Pago procesara una sola operacion de cobro para la compra completa, pero esa operacion debe poder relacionarse con varios pedidos.

Se implementara una entidad de sesion o intento de pago que agrupe todos los pedidos creados por un mismo checkout. La aprobacion del pago confirmara todos los pedidos asociados dentro de una operacion transaccional e idempotente.

### 5.2 El backend sera la fuente de verdad

El frontend enviara la intencion de compra, pero el backend volvera a consultar productos, precios, estados y stock. El importe enviado a Mercado Pago se calculara con datos actuales de la base de datos. No se confiaran importes, estados ni totales recibidos desde el navegador.

### 5.3 Reserva de stock separada del descuento definitivo

La reserva no debe provocar un doble descuento. Se registrara una reserva temporal por producto y cantidad. La disponibilidad publica se calculara considerando el stock fisico menos las reservas activas.

- Pago aprobado: se descuenta el stock fisico y la reserva queda consumida.
- Pago rechazado, cancelado o vencido: se libera la reserva sin descontar stock fisico.
- Reserva vencida: una tarea programada la libera de forma segura.

La implementacion debera migrar cuidadosamente el comportamiento actual, que descuenta stock al crear el pedido, para evitar descontarlo nuevamente al aprobar el pago.

### 5.4 Webhooks idempotentes y verificables

El webhook debe:

- aceptar eventos repetidos sin duplicar efectos;
- registrar el identificador del evento recibido;
- consultar el pago directamente en Mercado Pago;
- validar referencia externa, moneda e importe;
- procesar eventos fuera de orden sin retroceder estados validos;
- responder rapidamente y registrar errores para reintentos;
- ocultar tokens y datos sensibles en los registros.

## 6. Modelo de estados

### 6.1 Estados internos del pago

| Estado interno | Significado |
|---|---|
| `pending` | Pago iniciado o pendiente de confirmacion |
| `approved` | Pago confirmado por Mercado Pago |
| `rejected` | Pago rechazado |
| `cancelled` | Pago cancelado |
| `expired` | Preferencia o reserva vencida |
| `abandoned` | La persona no completo el flujo dentro del plazo |
| `error` | El pago requiere revision tecnica |

### 6.2 Efecto sobre el pedido y el stock

| Estado del pago | Pedido | Stock |
|---|---|---|
| Pendiente | Pendiente de pago | Reservado por hasta 30 minutos |
| Aprobado | Confirmado | Descuento definitivo |
| Rechazado | No confirmado | Reserva liberada |
| Cancelado | Cancelado o no confirmado | Reserva liberada |
| Vencido/abandonado | No confirmado | Reserva liberada |
| Error tecnico | Pendiente de revision | Mantener o liberar segun vencimiento |

## 7. Trabajo de backend

### 7.1 Persistencia

Crear o adaptar estructuras para almacenar:

- sesion o intento de checkout;
- preferencia de Mercado Pago;
- pago y su identificador externo;
- relacion entre un pago y uno o varios pedidos;
- estado interno y estado informado por Mercado Pago;
- importe, moneda y referencia externa;
- eventos de webhook procesados;
- historial de cambios de estado;
- reservas temporales de stock;
- fecha de vencimiento de la reserva;
- errores tecnicos relevantes.

### 7.2 Servicios de pago

Implementar servicios separados para:

- crear la preferencia;
- construir `back_urls` y `notification_url`;
- recuperar el estado oficial del pago;
- traducir estados de Mercado Pago a estados internos;
- confirmar pedidos;
- consumir o liberar reservas;
- registrar eventos e historial;
- disparar notificaciones basicas.

### 7.3 Endpoints previstos

- Crear una preferencia para el checkout autenticado.
- Consultar el estado de la sesion de pago.
- Recibir el webhook publico de Mercado Pago.
- Consultar pagos desde administracion.
- Consultar el detalle basico de un pago desde administracion.

Los nombres definitivos deben respetar la convencion actual de `/api/v1`.

### 7.4 Tarea de vencimiento

Agregar una tarea programada que identifique reservas vencidas, consulte el pago cuando corresponda y libere solamente aquellas que no tengan una aprobacion valida.

## 8. Trabajo de frontend

### 8.1 Checkout

- Mostrar **Pagar con Mercado Pago** como accion principal.
- Bloquear envios duplicados mientras se crea la preferencia.
- Mostrar un estado claro durante la redireccion.
- Conservar el resumen de productos, cantidades, entrega y total.
- Mostrar errores en espanol y permitir reintentar.
- Evitar crear multiples preferencias por doble clic.

### 8.2 Paginas de retorno

Implementar experiencias diferenciadas para:

- pago aprobado;
- pago pendiente;
- pago rechazado o fallido;
- pago cancelado o abandonado.

Estas pantallas consultaran al backend. No confirmaran el pago utilizando solamente parametros de la URL.

### 8.3 Vista del comprador

La persona compradora podra ver:

- metodo de pago;
- estado del pago en espanol;
- importe;
- pedidos relacionados;
- fecha de la operacion;
- indicacion de pago pendiente, aprobado o rechazado;
- opcion de reintentar cuando sea seguro hacerlo.

### 8.4 Vista del productor

El productor podra ver:

- pedido recibido;
- estado basico del pago;
- confirmacion de que puede preparar el pedido;
- historial basico del pedido;
- notificacion cuando el pago sea aprobado.

El productor no podra aprobar manualmente un pago procesado por Mercado Pago.

### 8.5 Panel administrativo basico

El panel permitira:

- listar pagos;
- filtrar por estado;
- consultar importe y fecha;
- ver comprador y pedidos asociados;
- ver identificadores internos y de Mercado Pago;
- consultar el historial basico de estados;
- identificar errores de webhook o pagos que requieran revision.

El panel sera principalmente informativo. La conciliacion y las acciones financieras avanzadas quedan fuera del Hito 6A.

## 9. Notificaciones basicas

Se implementaran notificaciones esenciales, reutilizando la infraestructura de correo existente:

- comprador: pago aprobado;
- comprador: pago pendiente;
- comprador: pago rechazado o cancelado;
- productor: nuevo pedido con pago aprobado;
- administrador: error critico al procesar un webhook, cuando sea viable dentro del alcance.

Las notificaciones deben incluir enlaces al pedido correspondiente y nunca exponer tokens, respuestas completas del proveedor ni datos tecnicos sensibles.

## 10. Configuracion y seguridad

Las credenciales se almacenaran solamente como secretos de entorno. No deben escribirse en el repositorio, documentacion, logs ni respuestas del frontend.

Variables previstas:

```text
MERCADO_PAGO_MODE=sandbox
MERCADO_PAGO_PUBLIC_KEY=<sandbox-public-key>
MERCADO_PAGO_ACCESS_TOKEN=<sandbox-access-token>
MERCADO_PAGO_WEBHOOK_SECRET=<sandbox-webhook-secret>
MERCADO_PAGO_SUCCESS_URL=https://mercadoahora.com.ar/checkout/pago/aprobado
MERCADO_PAGO_PENDING_URL=https://mercadoahora.com.ar/checkout/pago/pendiente
MERCADO_PAGO_FAILURE_URL=https://mercadoahora.com.ar/checkout/pago/fallido
MERCADO_PAGO_WEBHOOK_URL=https://api.mercadoahora.com.ar/api/v1/payments/webhooks/mercado_pago
```

Antes de comenzar la configuracion, se debe regenerar el Access Token Sandbox compartido mediante mensajeria y guardar el nuevo valor directamente como secreto. Aunque sea una credencial de prueba, no debe continuar utilizandose despues de haber sido expuesta fuera del gestor de secretos.

Controles adicionales:

- autorizacion por roles;
- validacion de firma del webhook;
- consulta server-to-server del pago;
- proteccion contra replay y duplicados;
- referencias externas no predecibles;
- importes calculados por backend;
- logs sanitizados;
- limitacion de frecuencia en endpoints sensibles.

## 11. Estrategia de pruebas

### 11.1 Pruebas automatizadas

- Creacion de preferencia con datos validos.
- Rechazo de productos inactivos o sin stock.
- Calculo del importe desde la base de datos.
- Reserva de la ultima unidad disponible.
- Rechazo cuando la cantidad supera la disponibilidad.
- Aprobacion que confirma pedidos y consume una sola vez la reserva.
- Rechazo/cancelacion/vencimiento que libera la reserva.
- Webhook duplicado sin efectos duplicados.
- Eventos fuera de orden.
- Importe, moneda o referencia inconsistentes.
- Acceso del comprador solamente a sus pagos.
- Acceso del productor solamente a sus pedidos.
- Acceso administrativo protegido.
- Carrito con varios productores y un solo pago asociado a varios pedidos.

### 11.2 Pruebas funcionales Sandbox

- Pago aprobado.
- Pago pendiente.
- Pago rechazado.
- Pago cancelado por la persona usuaria.
- Flujo abandonado y reserva vencida.
- Reintento de pago.
- Doble clic en pagar.
- Webhook repetido.
- Actualizacion visible para comprador, productor y administrador.
- Confirmacion del stock antes, durante y despues del pago.

### 11.3 Prueba real controlada

Despues de aprobar Sandbox y cargar credenciales productivas:

1. Crear un producto de prueba con stock conocido.
2. Realizar una compra real de bajo importe.
3. Confirmar el webhook productivo.
4. Verificar pago, pedidos y stock.
5. Verificar las vistas de comprador, productor y administrador.
6. Confirmar notificaciones.
7. Documentar el resultado y las evidencias.

La prueba real no comenzara hasta que dominio, SSL, URLs, secretos y configuracion de Mercado Pago esten validados.

## 12. Plan de implementacion por partes

El Hito 6A se ejecutara en seis partes consecutivas. Cada parte produce un resultado verificable y debe aprobar su propia puerta de calidad antes de comenzar la siguiente. Esto permite avanzar de forma controlada, detectar problemas temprano y evitar que una integracion incompleta llegue al entorno productivo.

### 12.1 Resumen de partes y estimacion

| Parte | Nombre | Duracion estimada | Depende de |
|---|---|---:|---|
| 6A.1 | Fundacion tecnica y configuracion Sandbox | 2 dias | Acceso Sandbox y entorno de desarrollo |
| 6A.2 | Checkout, preferencia y reserva de stock | 2,5 dias | 6A.1 aprobada |
| 6A.3 | Webhooks, estados y consistencia transaccional | 3 dias | 6A.2 aprobada |
| 6A.4 | Experiencia de comprador/productor y notificaciones | 1,5 dias | 6A.3 aprobada |
| 6A.5 | Administracion basica de pagos | 1,5 dias | 6A.3 aprobada |
| 6A.6 | QA integral, produccion controlada y documentacion | 2 dias | 6A.1 a 6A.5 aprobadas |

**Total estimado:** 12,5 dias laborables, equivalentes a 2,5 semanas.

Las estimaciones suponen que credenciales, dominios, certificados y accesos estan disponibles en el momento correspondiente. Un bloqueo externo pausa la parte afectada sin considerar aprobada su entrega.

### 12.2 Reglas para avanzar entre partes

- Cada parte se implementara, probara y documentara por separado.
- No se comenzara una parte dependiente hasta aprobar los criterios de salida de la anterior.
- Cada parte tendra cambios identificables en control de versiones y un resumen de pruebas.
- Las credenciales nunca se guardaran en el repositorio, documentos, capturas o logs.
- El estado confirmado por backend y Mercado Pago prevalecera sobre parametros del navegador.
- No se usaran datos ficticios para simular una integracion terminada.
- La configuracion productiva y la compra real se realizaran solamente en 6A.6.

### Parte 6A.1 - Fundacion tecnica y configuracion Sandbox

**Objetivo:** preparar una base segura y extensible para integrar Mercado Pago sin alterar todavia el flujo productivo de compra.

**Trabajo incluido:**

- Regenerar el Access Token Sandbox compartido por un canal no destinado a secretos.
- Configurar variables de Mercado Pago en los entornos local y de pruebas.
- Incorporar el cliente oficial o una capa HTTP validada para Mercado Pago.
- Diferenciar configuracion `sandbox` y `production`.
- Crear migraciones para sesiones de pago, pagos, pedidos asociados, eventos/webhooks, historial de estados y reservas temporales de stock.
- Crear modelos, relaciones, indices, restricciones y estados internos.
- Crear interfaces de servicio que aislen Mercado Pago del dominio del marketplace.
- Definir referencias internas e idempotency keys.
- Evitar secretos y datos sensibles en respuestas y logs.

**Entregables:** configuracion Sandbox, migraciones, modelos, esqueleto del servicio y pruebas de persistencia.

**Puerta de aprobacion 6A.1:**

- las migraciones se ejecutan y revierten correctamente;
- la aplicacion inicia en modo Sandbox;
- modelos y relaciones tienen pruebas automatizadas;
- ningun secreto esta versionado o expuesto;
- el flujo existente de pedidos no presenta regresiones.

### Parte 6A.2 - Checkout, preferencia y reserva de stock

**Objetivo:** permitir que el comprador inicie un pago Sandbox desde checkout, con importes calculados por backend y stock reservado de forma segura.

**Trabajo incluido:**

- Agregar Mercado Pago como metodo de pago.
- Crear el endpoint backend para iniciar el pago.
- Revalidar usuario, carrito, producto, precio y stock en el servidor.
- Crear pedidos en estado `pending_payment` o equivalente antes de redirigir.
- Soportar carritos multiproductor mediante una sesion vinculada a todos los pedidos.
- Reservar stock durante 30 minutos sin descontar dos veces el inventario fisico.
- Calcular el total exclusivamente desde datos persistidos.
- Crear la preferencia con referencias internas no ambiguas.
- Configurar URLs de exito, pendiente y fallo.
- Devolver identificador y URL segura para continuar el pago.
- Agregar el boton **Pagar con Mercado Pago** y estados de carga/error.
- Prevenir duplicados por doble clic, recarga o reintento de red.

**Entregables:** endpoint de inicio, servicio de preferencias, reserva temporal, checkout Sandbox y pruebas de totales, stock, permisos y duplicados.

**Puerta de aprobacion 6A.2:**

- el comprador abre Mercado Pago Sandbox desde checkout;
- el importe coincide con el calculado en backend;
- una compra multiproductor conserva todos sus pedidos asociados;
- el stock queda reservado por 30 minutos;
- una cantidad mayor al stock es rechazada en espanol;
- reintentos no crean pagos, pedidos ni reservas duplicados.

### Parte 6A.3 - Webhooks, estados y consistencia transaccional

**Objetivo:** usar la confirmacion verificada de Mercado Pago como fuente de verdad para pagos, pedidos y stock.

**Trabajo incluido:**

- Crear la URL publica de webhook.
- Validar firma, autenticidad y datos esenciales de cada notificacion.
- Registrar eventos sin almacenar secretos.
- Consultar el pago directamente en Mercado Pago antes de actualizar datos.
- Mapear estados externos a pendiente, aprobado, rechazado, cancelado y vencido.
- Procesar eventos repetidos o fuera de orden de forma idempotente.
- Actualizar atomicamente el pago y todos los pedidos asociados.
- Consumir la reserva y descontar stock una sola vez al aprobarse el pago.
- Liberar la reserva sin descontar stock al rechazarse, cancelarse o vencer.
- Crear una tarea programada para reservas vencidas.
- Registrar transiciones y errores procesables.
- Mantener separado el flujo manual existente.

**Entregables:** webhook seguro, maquina de estados basica, sincronizacion transaccional, tarea de vencimiento e historial tecnico.

**Puerta de aprobacion 6A.3:**

- un pago aprobado confirma pedidos y descuenta stock una sola vez;
- un pago rechazado, cancelado o vencido libera la reserva;
- webhooks duplicados no duplican movimientos;
- eventos antiguos no revierten un estado final valido;
- una falla parcial no deja datos inconsistentes;
- reservas vencidas se liberan automaticamente.

### Parte 6A.4 - Experiencia y notificaciones

**Objetivo:** ofrecer informacion clara y consistente al comprador y al productor.

**Trabajo incluido:**

- Crear pantallas de pago aprobado, pendiente, rechazado/fallido y cancelado/abandonado.
- No confirmar pagos solo por parametros de retorno del navegador.
- Mostrar metodo y estado de pago en pedidos del comprador.
- Permitir reintento cuando las reglas lo permitan.
- Mostrar al productor el pedido y estado confirmado.
- Notificar al comprador los cambios relevantes.
- Notificar a los productores afectados cuando corresponda.
- Mantener interfaz y mensajes en espanol.
- Verificar escritorio y movil.

**Entregables:** pantallas de resultado, estados en vistas de comprador/productor, reintento basico y notificaciones.

**Puerta de aprobacion 6A.4:**

- comprador y productor ven el mismo estado confirmado;
- ninguna URL de retorno puede falsificar una aprobacion;
- las notificaciones no se duplican;
- los mensajes son claros y responsive;
- un pago no aprobado ofrece una salida comprensible.

### Parte 6A.5 - Administracion basica de pagos

**Objetivo:** dar a administracion visibilidad operativa sin incorporar conciliacion financiera avanzada.

**Trabajo incluido:**

- Agregar una seccion de pagos al panel administrativo.
- Listar fecha, referencia, comprador, pedidos, importe, estado y metodo.
- Filtrar por estado, referencia, pedido o usuario.
- Mostrar detalle, historial basico y eventos recibidos.
- Mostrar identificadores externos necesarios para soporte sin exponer secretos.
- Enlazar los pedidos relacionados.
- Registrar acciones sensibles mediante la auditoria existente.
- Excluir conciliacion, liquidaciones, reembolsos avanzados y reportes financieros.

**Entregables:** listado, detalle, filtros, historial y pruebas de permisos.

**Puerta de aprobacion 6A.5:**

- solo administracion consulta todos los pagos;
- cada pago se rastrea hasta sus pedidos y comprador;
- estados e importes coinciden con backend;
- no se exponen secretos;
- filtros y enlaces funcionan correctamente.

### Parte 6A.6 - QA integral, produccion controlada y documentacion

**Objetivo:** validar el flujo completo, preparar produccion y cerrar el hito con evidencias reproducibles.

**Trabajo incluido:**

- Ejecutar las suites completas de backend y frontend.
- Probar en Sandbox: aprobado, pendiente, rechazado, cancelado, abandonado, vencido y reintento.
- Probar duplicados, concurrencia, ultima unidad, multiproductor y recuperacion ante fallos.
- Verificar las tres vistas en escritorio y movil.
- Confirmar dominio, SSL, retornos, webhook y tarea programada.
- Preparar variables productivas sin versionar secretos.
- Configurar credenciales productivas cuando esten disponibles.
- Realizar una compra real controlada de bajo importe.
- Verificar webhook productivo, pedidos, stock y notificaciones.
- Registrar evidencias, incidencias y correcciones.
- Completar guias de configuracion, operacion, prueba y recuperacion.

**Entregables:** informe QA, configuracion productiva validada, evidencia de prueba real, guia tecnica/operativa y lista de tareas diferidas a 6B.

**Puerta de aprobacion 6A.6:**

- todas las pruebas criticas estan aprobadas;
- la compra real controlada completa el recorrido esperado;
- los webhooks productivos son validos e idempotentes;
- no hay doble descuento ni reservas bloqueadas;
- las tres vistas muestran informacion consistente;
- existe documentacion para operar, diagnosticar y desplegar;
- los elementos diferidos quedan separados del alcance entregado.

### 12.3 Orden de ejecucion recomendado

El orden normal sera `6A.1 -> 6A.2 -> 6A.3 -> 6A.4 -> 6A.5 -> 6A.6`.

6A.4 y 6A.5 pueden desarrollarse en paralelo solamente despues de aprobar 6A.3. La Parte 6A.6 siempre sera la ultima y la prueba real no comenzara hasta cerrar todos los defectos criticos de Sandbox.

### 12.4 Resultado verificable de cada parte

| Parte terminada | Capacidad disponible |
|---|---|
| 6A.1 | Base de datos, configuracion y servicios preparados en Sandbox |
| 6A.2 | El comprador inicia un pago y el sistema reserva stock |
| 6A.3 | Mercado Pago confirma y sincroniza pedidos y stock |
| 6A.4 | Comprador y productor ven y reciben estados comprensibles |
| 6A.5 | Administracion consulta y rastrea pagos |
| 6A.6 | Flujo validado en Sandbox y mediante prueba real controlada |

## 13. Entregables

- Integracion Sandbox funcional.
- Migraciones y modelo de datos de pagos y reservas.
- Servicios backend de Mercado Pago.
- Endpoint de webhook seguro e idempotente.
- Checkout integrado.
- Pantallas de resultado del pago.
- Sincronizacion automatica de pedido y stock.
- Vistas basicas para comprador y productor.
- Panel administrativo basico de pagos.
- Notificaciones basicas.
- Suite de pruebas del flujo critico.
- Guia de configuracion de Sandbox y produccion.
- Documento del flujo tecnico implementado.
- Registro de la prueba real controlada al finalizar.

## 14. Criterios de aceptacion

El Hito 6A se considerara completo cuando:

- una persona pueda iniciar un pago desde el checkout;
- Mercado Pago pueda procesar la preferencia en Sandbox;
- el webhook actualice el pago de forma automatica e idempotente;
- un pago aprobado confirme todos los pedidos relacionados;
- el stock quede reservado, consumido o liberado correctamente;
- un pago rechazado o vencido no deje stock bloqueado;
- comprador y productor vean informacion consistente;
- administracion pueda consultar el pago y su historial basico;
- las notificaciones esenciales sean enviadas;
- no existan credenciales en el codigo o en los logs;
- las pruebas automatizadas y los escenarios Sandbox esten aprobados;
- la prueba real controlada haya sido documentada satisfactoriamente.

## 15. Comparacion con el Hito 6 completo

El Hito 6 original proponia completar Mercado Pago, checkout, webhooks, confirmacion automatica, estados de pedidos, stock, comprobantes y notificaciones basicas. El Hito 6A mantiene todo ese recorrido esencial y, por lo tanto, cubre el **100 % del flujo minimo necesario para aceptar y confirmar una venta online**.

Sin embargo, la interpretacion ampliada del Hito 6 tambien contemplaba una operacion financiera mas madura: conciliacion completa, reembolsos avanzados, reportes financieros, liquidaciones, auditoria profunda e integraciones administrativas. Considerando esa version ampliada, el Hito 6A representa aproximadamente **entre el 65 % y el 70 % del alcance funcional total**, concentrado en la parte que habilita ventas reales.

| Area del Hito 6 | Cobertura en 6A |
|---|---|
| Preferencia y checkout Mercado Pago | Completa |
| Webhooks y confirmacion automatica | Completa |
| Estados basicos de pago | Completa |
| Sincronizacion de pedidos | Completa |
| Reserva y actualizacion de stock | Completa |
| Informacion para comprador y productor | Completa en nivel basico |
| Panel administrativo | Basico |
| Historial de transacciones | Basico |
| Notificaciones | Basicas |
| Pruebas Sandbox y prueba real | Completa |
| Conciliacion financiera | Diferida |
| Reembolsos avanzados | Diferidos |
| Reportes financieros avanzados | Diferidos |
| Liquidaciones a productores | Diferidas |
| Compra Segura, wallet y split payments | Diferidos |
| Integracion contable/fiscal | Diferida |

## 16. Resultado esperado

Al finalizar el Hito 6A, Mercado Ahora dispondra de una primera version de pagos online segura y operativa. La plataforma podra validar el comportamiento de compradores y productores con operaciones reales, manteniendo control sobre pedidos y stock, sin asumir todavia la complejidad de una infraestructura financiera completa.

Esta base permitira ampliar el modulo posteriormente sin rehacer el flujo principal de pagos.


## 17. Estado de implementación: Partes 6A.1 a 6A.4

**Fecha de cierre técnico:** 7 de agosto de 2026.

### 17.1 Parte 6A.1 - Completada

Se implementó la fundación técnica necesaria para Mercado Pago Checkout Pro:

- configuración separada por entorno (`sandbox` y `production`);
- credenciales únicamente por variables de entorno y secretos de GitHub;
- contrato `PaymentGateway` para desacoplar el marketplace del proveedor;
- adaptador HTTP validado para crear preferencias mediante la API oficial;
- referencias internas UUID e idempotency keys;
- ampliación de `payment_intents` para sesiones multipedido;
- tabla de relación entre una sesión de pago y varios pedidos;
- persistencia de reservas temporales de stock;
- índices y restricciones para evitar duplicados;
- integración durable con `.env.production` y el flujo de despliegue al VPS;
- pruebas automáticas de persistencia e integración simulada con `Http::fake`.

No se versionó ninguna credencial real. El Access Token Sandbox compartido por mensajería debe regenerarse antes de configurar el entorno.

### 17.2 Parte 6A.2 - Completada

Se implementó el inicio de pago desde el checkout:

- endpoint autenticado `POST /api/v1/checkout/mercado-pago`;
- validación server-side de carrito, estado, precio y stock;
- cálculo de importes con el precio actual de la base de datos;
- creación de pedidos separados por productor bajo una sola sesión de pago;
- estado de pago pendiente antes de abandonar Mercado Ahora;
- reserva de stock durante 30 minutos sin descontar inventario físico;
- disponibilidad calculada restando reservas activas no vencidas;
- preferencia de Mercado Pago con referencia interna, retorno y webhook;
- URL Sandbox devuelta al frontend sin exponer el Access Token;
- botón principal **Pagar con Mercado Pago**;
- flujo manual conservado como alternativa secundaria;
- protección de doble clic mediante bloqueo en frontend e idempotencia en backend;
- carrito eliminado solamente después de crear correctamente la preferencia;
- conflictos de stock estructurados y mensajes en español.

### 17.3 Parte 6A.3 - Completada

Se implementó el ciclo transaccional verificado de Mercado Pago:

- firma oficial del webhook mediante `x-signature`, `x-request-id`, identificador del recurso y secreto protegido;
- persistencia idempotente de eventos y procesamiento asíncrono mediante cola de base de datos;
- consulta server-to-server del pago antes de modificar pedidos o inventario;
- validación de referencia, importe, moneda y entorno Sandbox/producción;
- normalización de estados externos y protección del estado aprobado como terminal;
- transacciones con bloqueos de fila para pagos, pedidos, reservas y productos;
- consumo de reservas y descuento de stock exactamente una vez al aprobar;
- liberación sin descuento para rechazo, cancelación o vencimiento;
- revisión administrativa cuando un pago tardío no puede consumir stock con seguridad;
- historial de estados, transacciones e identificadores externos únicos;
- tarea programada por minuto que consulta Mercado Pago antes de liberar reservas;
- contenedores independientes para `queue:work` y `schedule:work`;
- bloqueo de preparación y envío para pedidos Mercado Pago aún no aprobados;
- exclusión de medios diferidos para conservar solo métodos de acreditación inmediata.

### 17.4 Parte 6A.4 - Completada

Se implementó la experiencia operativa para comprador y productor:

- páginas `/checkout/pago/aprobado`, `/checkout/pago/pendiente` y `/checkout/pago/fallido`;
- consulta y sondeo del estado interno sin confiar en parámetros de estado del navegador;
- endpoint autenticado de resumen de pago por referencia;
- reintento seguro para pagos rechazados, cancelados, vencidos o recuperables;
- revalidación de productos y stock sin crear pedidos duplicados;
- estados, importes y explicaciones en español dentro de pedidos del comprador;
- estado de pago y habilitación de preparación dentro de pedidos del productor;
- resumen de pago también visible en el detalle administrativo de pedidos;
- etiquetas y colores de pago centralizados en frontend;
- correos en español para aprobación, pendiente, rechazo, cancelación y vencimiento;
- aviso al productor únicamente cuando el pedido queda pagado y habilitado;
- notificaciones en cola, posteriores al commit e idempotentes por transición.
### 17.5 Verificación ejecutada

- Suite Laravel completa: **62 pruebas, 61 aprobadas, 1 omitida, 420 aserciones**.
- Pruebas específicas de Mercado Pago: **14 aprobadas, 123 aserciones**.
- ESLint frontend: aprobado.
- Build productivo de Next.js: aprobado, 41 rutas generadas.
- Sintaxis PHP de servicios, controlador, migración y rutas: aprobada.

### 17.6 Límite actual

Las Partes 6A.1 a 6A.4 quedan cerradas técnicamente. La URL de retorno del navegador nunca confirma un pago: comprador, productor y administración consumen el estado verificado por backend. Quedan pendientes **6A.5 - Administración básica de pagos** como módulo dedicado y **6A.6 - QA integral, configuración del webhook secreto, pruebas Sandbox completas y prueba real controlada**.
