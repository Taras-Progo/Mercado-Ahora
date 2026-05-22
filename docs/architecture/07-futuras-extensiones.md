# Preparación para Futuras Extensiones - Mercado Ahora

## 1. Objetivo

Este documento define cómo debe quedar preparada la base técnica de Mercado Ahora para incorporar funcionalidades futuras sin rediseñar el sistema.

Las extensiones consideradas son:

- Reseñas.
- Notificaciones.
- Soporte.
- Comunidad.
- Wallet futura.
- Pagos.
- Recomendaciones.
- Logística.
- App móvil.

## 2. Principio general

El MVP debe resolver lo necesario para operar el marketplace, pero no debe cerrar la arquitectura.

La regla principal es:

```text
Implementar simple en MVP, pero dejar puntos de extensión claros.
```

Esto significa:

- No construir todo desde el inicio.
- No acoplar todo a una sola tabla o controlador.
- No mezclar lógica de comunidad dentro de productos.
- No mezclar pagos directamente dentro de órdenes.
- Usar servicios y eventos para funcionalidades que crecerán.

### Decisiones técnicas ya definidas

- Autenticación: Laravel Sanctum para autenticación SPA entre Next.js y Laravel.
- Chat MVP: chat básico con polling o actualización ligera; WebSocket queda como mejora futura si el volumen de mensajes lo justifica.
- Pagos MVP: estructura preparada, sin integración completa de Mercado Pago en Fase 1.
- Mercado Pago: integración futura sobre una capa de proveedor de pagos.
- Wallet: sistema interno futuro, separado del núcleo de pedidos.
- Imágenes: decisión pendiente; en MVP puede usarse almacenamiento en servidor/VPS o storage configurado en Laravel, con posible migración futura a S3 compatible.

## 3. Preparación para reseñas

### Objetivo futuro

Permitir que compradores califiquen productos y productores después de recibir una compra.

### Preparación desde MVP

La orden debe guardar:

- buyer_id.
- order_items.
- product_id.
- producer_profile_id.
- estado delivered.

Esto permite validar más adelante si el usuario realmente compró el producto antes de reseñar.

### Tablas futuras

- reviews.
- review_images.

### Reglas preparadas

- Reseña solo si la orden está entregada.
- Una reseña por usuario, producto y orden.
- Rating separado para producto y productor.
- Moderación admin.

### Punto de extensión

Cuando una orden pase a delivered:

```text
OrderDelivered -> create notification "Calificá tu compra"
```

## 4. Preparación para notificaciones

### Objetivo futuro

Centralizar avisos importantes para compradores, vendedores y admins.

### Preparación desde MVP

Las acciones importantes deben disparar eventos internos aunque todavía no exista interfaz completa de notificaciones.

Eventos recomendados:

- OrderCreated.
- OrderStatusChanged.
- MessageSent.
- ReturnRequested.
- ProductApproved.
- SupportReplied.
- ProducerPostPublished.
- ProducerFollowed.

### Tablas futuras

- notifications.
- notification_events.

### MVP recomendado

En Fase 1 se puede dejar preparado el patrón de eventos.

En Fase 2 se implementa:

- Centro de notificaciones.
- Read/unread.
- Redirección según tipo.
- Polling básico.

### Escalabilidad

Cuando crezca el volumen:

- Usar queue workers.
- Procesar notificaciones en background.
- Agregar push notifications para app móvil.

## 5. Preparación para soporte

### Objetivo futuro

Permitir que usuarios pidan ayuda mediante tickets y mensajes asincrónicos.

### Preparación desde MVP

Debe existir separación clara entre:

- Usuario normal.
- Admin/soporte.
- Notificaciones.

### Tablas futuras

- support_tickets.
- support_messages.

### Reglas

- Usuario crea ticket.
- Soporte/admin responde.
- Ticket cambia estado.
- Usuario recibe notificación.
- No se debe mostrar chatbot automático al usuario en MVP.

### Posible extensión

Más adelante puede agregarse IA interna para:

- Sugerir respuestas al equipo.
- Clasificar urgencia.
- Detectar temas frecuentes.

La IA no debe reemplazar la conversación humana en la experiencia inicial.

## 6. Preparación para comunidad

### Objetivo futuro

Convertir el marketplace en un espacio donde los compradores puedan seguir productores, ver publicaciones, comentar y reaccionar.

### Preparación desde MVP

El perfil de productor debe existir desde Fase 1 y no debe ser solo un dato administrativo. Debe tener estructura suficiente para crecer:

- Historia.
- Ubicación.
- Descripción.
- Prácticas de producción.
- Imágenes.
- Productos.

### Tablas futuras

- followers.
- producer_posts.
- post_images.
- post_comments.
- post_reactions.

### Reglas

- Un usuario puede seguir a un productor.
- El productor puede publicar novedades.
- Las publicaciones pueden relacionarse con productos.
- Los seguidores reciben notificación.
- Las reacciones no deben ser solo "likes"; se usarán acciones alineadas a la marca:
  - Apoyar.
  - Recomendar.
  - Me interesa.

## 7. Preparación para wallet futura

### Objetivo futuro

Agregar una wallet propia sin rehacer pedidos, pagos y movimientos.

### Decisión importante

En MVP no se debe comprometer la arquitectura a una wallet específica. Las tablas y endpoints de wallet son reserva de arquitectura futura: no deben crearse, exponerse ni activarse en Fase 1 salvo cambio explícito de alcance.

La orden no debe depender directamente de Mercado Pago ni de una wallet interna. Debe depender de una capa de pagos.

### Modelo recomendado

```text
Order
  -> PaymentIntent
      -> PaymentProvider
          -> PaymentTransaction
```

### Tablas preparadas

- payment_intents.
- payment_transactions.
- payment_webhook_events.

### Tablas futuras wallet

- wallets.
- wallet_movements.
- wallet_withdrawals.

Estas tablas se documentan únicamente para evitar rediseños posteriores. No forman parte de la entrega activa del MVP.

### Ventaja

Con esta separación se puede iniciar con:

- Pago manual.
- Mercado Pago.
- Transferencia.

Y luego agregar:

- Wallet interna.
- Saldo de vendedor.
- Retiros.
- Reembolsos internos.

## 8. Preparación para Mercado Pago

### Objetivo

Permitir integración futura con Mercado Pago sin bloquear wallet propia. En Fase 1 solo se prepara la estructura de pagos; la integración completa con Mercado Pago queda fuera del MVP inicial.

### Capa sugerida

```text
PaymentProviderInterface
  - createPaymentIntent()
  - getPaymentStatus()
  - refund()
  - handleWebhook()
```

Implementaciones futuras:

```text
MercadoPagoProvider
ManualPaymentProvider
InternalWalletProvider
```

### Webhooks

Todo webhook debe guardarse en `payment_webhook_events` antes de procesarse.

Esto permite:

- Auditoría.
- Reintentos.
- Depuración.
- Seguridad.

## 9. Preparación para búsqueda avanzada

### MVP

PostgreSQL puede manejar búsqueda inicial con:

- Índices.
- `ILIKE`.
- Filtros por columnas.
- Paginación.

### Futuro

Si el catálogo crece mucho, se puede agregar:

- OpenSearch.
- Elasticsearch.
- Meilisearch.

### Punto de extensión

Crear un SearchService con driver:

```text
SearchService
  -> DatabaseSearchDriver
  -> FutureSearchEngineDriver
```

Así el frontend mantiene los mismos endpoints aunque cambie el motor interno.

## 10. Preparación para recomendaciones

### Objetivo futuro

Mostrar productos o productores recomendados.

### Datos útiles desde MVP

- Productos vistos.
- Productos comprados.
- Categorías visitadas.
- Productores contactados.
- Productores seguidos.
- Reseñas.

### En MVP

No es obligatorio implementar tracking avanzado, pero el diseño debe permitir agregar eventos de actividad en el futuro.

Tabla futura posible:

- user_activity_events.

## 11. Preparación para logística

### Objetivo futuro

Agregar envíos, puntos de entrega o integraciones logísticas.

### Preparación desde MVP

Productos y pedidos deben guardar:

- Tipo de entrega.
- Dirección.
- Ciudad.
- Provincia.
- Estado de envío.
- Tiempo estimado.

### Tablas futuras

- shipments.
- shipment_events.
- delivery_methods.

### Integración futura

La logística debe manejarse como módulo separado de pedidos.

```text
Order -> Shipment -> ShipmentEvents
```

## 12. Preparación para app móvil

### Objetivo futuro

Crear una app móvil conectada al mismo backend.

### Reglas desde MVP

- Backend API-first.
- No poner lógica de negocio solo en Next.js.
- Mantener endpoints limpios y versionados.
- Respuestas JSON consistentes.
- Autenticación compatible con web y mobile.

### Beneficio

La app móvil puede usar:

- Los mismos usuarios.
- Los mismos productos.
- El mismo carrito.
- Los mismos pedidos.
- El mismo chat.
- Las mismas notificaciones.

## 13. Preparación para administración avanzada

### MVP

Panel básico:

- Usuarios.
- Productores.
- Productos.
- Pedidos.
- Devoluciones.

### Futuro

Panel avanzado:

- Moderación de reseñas.
- Moderación de publicaciones.
- Reportes.
- Métricas.
- EcoScore.
- Soporte.
- Configuración de categorías.
- Configuración de pagos.

## 14. Preparación para EcoScore

### Objetivo

Mostrar impacto ambiental y producción local.

### MVP

Guardar un puntaje simple de 0 a 100 y una nota de evaluación cuando corresponda. En MVP no se requiere automatización con IA; el cálculo puede gestionarse por reglas simples o revisión manual.

Fórmula inicial:

| Criterio | Puntos |
|---|---:|
| Producción natural o agroecológica | 25 |
| Producción local / regional | 20 |
| Uso de empaque reciclable o reutilizable | 20 |
| Entrega de bajo impacto o entrega local | 15 |
| Perfil del productor completo y transparente | 20 |

Visualización:

- 80-100: EcoScore Alto.
- 50-79: EcoScore Medio.
- 0-49: EcoScore Básico.

### Futuro

Crear tabla dedicada:

- ecoscore_rules.
- product_ecoscore_evaluations.

Esto permitiría evolucionar el EcoScore por reglas más avanzadas:

- Producción local.
- Materiales.
- Certificación.
- Tipo de producción.
- Distancia.
- Packaging.

## 15. Categorías iniciales del catálogo MVP

Las categorías iniciales se definen como base operativa del catálogo y pueden ajustarse según el comportamiento real de los usuarios después del lanzamiento.

| Categoría | Ejemplos |
|---|---|
| Alimentos naturales | Miel, mermeladas, conservas, frutos secos, granos |
| Huerta y productos frescos | Frutas, verduras, huevos, plantas aromáticas |
| Bebidas naturales | Tés, infusiones, jugos naturales |
| Cosmética natural | Jabones, cremas, aceites esenciales |
| Bienestar y salud natural | Productos herbales, suplementos naturales |
| Hogar sostenible | Productos reutilizables, limpieza ecológica |
| Artesanías y productos regionales | Productos hechos a mano, madera, cerámica, textiles |
| Mascotas naturales | Alimentos y accesorios naturales para mascotas |

## 16. Eventos recomendados

Los siguientes eventos deben considerarse como base:

| Evento | Fase | Uso |
|---|---:|---|
| UserRegistered | 1 | Email/verificación |
| SellerRegistered | 1 | Admin/moderación |
| ProductCreated | 1 | Moderación |
| ProductPublished | 1 | Catálogo |
| ConversationCreated | 1 | Chat |
| MessageSent | 1 | Notificación |
| OrderCreated | 1 | Pedido/notificación |
| OrderStatusChanged | 1 | Timeline/notificación |
| ReturnRequested | 1 | Admin/notificación |
| ReviewCreated | 2 | Rating/moderación |
| SupportTicketCreated | 2 | Soporte |
| SupportReplied | 2 | Notificación |
| ProducerFollowed | 3 | Comunidad |
| ProducerPostPublished | 3 | Notificar seguidores |
| PostCommentCreated | 3 | Comunidad |
| PostReactionCreated | 3 | Comunidad |

## 17. Recomendación final

Para mantener el proyecto escalable, cada extensión debe agregarse como módulo propio y conectarse mediante:

- Eventos.
- Servicios.
- Policies.
- Tablas dedicadas.
- Endpoints versionados.

Esto permite que el MVP sea simple, pero que Mercado Ahora pueda evolucionar a un ecosistema completo de marketplace, confianza, soporte, comunidad y pagos propios.

## 18. Ajustes futuros por confianza del productor

### Presencia digital externa

La arquitectura queda preparada para enlaces externos del productor como Instagram, WhatsApp Business, sitio web, YouTube, Facebook, TikTok u otros enlaces personalizados.

Estos enlaces deben complementar la confianza dentro del marketplace, no reemplazar la interacción principal de Mercado Ahora.

### Validación EcoScore avanzada

Después del MVP se puede evolucionar desde autodeclaración y revisión manual hacia reglas más estrictas, evidencias fotográficas, documentación, historial de cumplimiento o validación asistida.

### Chat con imágenes

La base de adjuntos permite incorporar imágenes en conversaciones cuando el uso real lo justifique.
