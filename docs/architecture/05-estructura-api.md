# Definición de Estructura de API - Mercado Ahora

## 1. Objetivo

Este documento define la estructura base de API para Mercado Ahora. La API será construida en Laravel y consumida inicialmente por el frontend Next.js. La misma arquitectura debe permitir una futura app móvil sin duplicar lógica de negocio.

## 2. Principios de API

- API REST organizada por dominios.
- Versionado desde el inicio.
- Respuestas JSON consistentes.
- Validación server-side.
- Autorización por rol y ownership.
- Autenticación SPA con Laravel Sanctum entre Next.js y Laravel.
- Paginación en listados.
- Filtros por query params.
- Separación entre rutas públicas, autenticadas, vendedor y admin.

## 3. Prefijo base

```text
/api/v1
```

Ejemplo:

```text
GET /api/v1/products
```

## 4. Formato estándar de respuesta

### Respuesta simple

```json
{
  "data": {
    "id": 1,
    "name": "Miel orgánica"
  }
}
```

### Respuesta paginada

```json
{
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 12,
    "total": 120,
    "last_page": 10
  }
}
```

### Error de validación

```json
{
  "message": "Los datos enviados no son válidos.",
  "errors": {
    "email": ["El email es obligatorio."]
  }
}
```

## 5. Autenticación

La autenticación recomendada para el MVP es Laravel Sanctum en modo SPA. Esto permite mantener sesiones seguras entre Next.js y Laravel, y deja una base compatible para evolucionar más adelante hacia clientes móviles o integraciones API sin duplicar la lógica de usuarios.

### Endpoints

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | /auth/register | Registro comprador | Público |
| POST | /auth/register-seller | Registro vendedor | Público |
| POST | /auth/login | Login | Público |
| POST | /auth/logout | Logout | Autenticado |
| GET | /auth/me | Usuario actual | Autenticado |
| POST | /auth/email/verify | Verificar email | Autenticado |
| POST | /auth/password/forgot | Solicitar recuperación | Público |
| POST | /auth/password/reset | Reset password | Público |

## 6. Usuarios

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /users/me | Perfil propio | Autenticado |
| PATCH | /users/me | Actualizar datos propios | Autenticado |
| GET | /admin/users | Listado de usuarios | Admin |
| GET | /admin/users/{id} | Detalle usuario | Admin |
| PATCH | /admin/users/{id}/status | Cambiar estado | Admin |

## 7. Productores / vendedores

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /producers | Listado público de productores | Público |
| GET | /producers/{id} | Perfil público del productor | Público |
| GET | /seller/profile | Perfil propio vendedor | Seller |
| POST | /seller/profile | Crear perfil vendedor | Seller |
| PATCH | /seller/profile | Actualizar perfil vendedor | Seller |
| GET | /seller/dashboard | Resumen dashboard | Seller |
| GET | /admin/producers | Listado admin de productores | Admin |
| PATCH | /admin/producers/{id}/status | Aprobar/pausar productor | Admin |

## 8. Categorías

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /categories | Categorías principales | Público |
| GET | /categories/{slug} | Detalle categoría | Público |
| GET | /categories/{slug}/products | Productos por categoría | Público |
| POST | /admin/categories | Crear categoría | Admin |
| PATCH | /admin/categories/{id} | Actualizar categoría | Admin |
| DELETE | /admin/categories/{id} | Desactivar categoría | Admin |

Query params sugeridos:

```text
?include_children=true
?active=true
```

## 9. Productos

### Rutas públicas

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /products | Listado público | Público |
| GET | /products/{slug} | Detalle producto | Público |
| GET | /products/{slug}/related | Productos relacionados | Público |
| GET | /products/{slug}/reviews | Reseñas de producto | Público |

Query params:

```text
?q=miel
?category=alimentos
?min_price=1000
?max_price=10000
?province=cordoba
?city=alta-gracia
?production_type=agroecologico
?delivery_type=home_delivery
?ecoscore=green
?sort=price_asc
?page=1
?per_page=12
```

### Rutas vendedor

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /seller/products | Mis productos | Seller |
| POST | /seller/products | Crear producto | Seller |
| GET | /seller/products/{id} | Detalle interno | Seller owner |
| PATCH | /seller/products/{id} | Actualizar producto | Seller owner |
| DELETE | /seller/products/{id} | Eliminar/desactivar | Seller owner |
| POST | /seller/products/{id}/images | Subir imágenes | Seller owner |
| DELETE | /seller/products/{id}/images/{imageId} | Quitar imagen | Seller owner |
| PATCH | /seller/products/{id}/pause | Pausar producto | Seller owner |
| PATCH | /seller/products/{id}/publish | Publicar producto | Seller owner |

### Rutas admin

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /admin/products | Listado admin | Admin |
| PATCH | /admin/products/{id}/approve | Aprobar producto | Admin |
| PATCH | /admin/products/{id}/reject | Rechazar producto | Admin |
| PATCH | /admin/products/{id}/status | Cambiar estado | Admin |

## 10. Búsqueda

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /search/products | Búsqueda de productos | Público |
| GET | /search/producers | Búsqueda de productores | Público |

Parámetros:

```text
q
category_id
subcategory_id
min_price
max_price
province
city
availability
delivery_type
production_type
verified_producer
ecoscore
sort
page
per_page
```

## 11. Carrito

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /cart | Ver carrito | Buyer |
| POST | /cart/items | Agregar producto | Buyer |
| PATCH | /cart/items/{id} | Cambiar cantidad/nota | Buyer |
| DELETE | /cart/items/{id} | Quitar producto | Buyer |
| PATCH | /cart/delivery | Definir tipo de entrega | Buyer |
| POST | /cart/coupon | Aplicar cupón futuro | Buyer |
| POST | /cart/checkout-preview | Calcular resumen | Buyer |

## 12. Checkout y pedidos

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | /checkout/buy-now | Crear compra directa | Buyer |
| POST | /checkout/cart | Crear orden desde carrito | Buyer |
| GET | /orders | Mis pedidos | Buyer |
| GET | /orders/{id} | Detalle pedido | Buyer owner |
| GET | /orders/{id}/tracking | Seguimiento pedido | Buyer owner |
| GET | /seller/orders | Pedidos del productor | Seller |
| GET | /seller/orders/{id} | Detalle pedido vendedor | Seller related |
| PATCH | /seller/orders/{id}/status | Cambiar estado | Seller related |
| GET | /admin/orders | Listado admin | Admin |
| GET | /admin/orders/{id} | Detalle admin | Admin |
| PATCH | /admin/orders/{id}/status | Cambiar estado admin | Admin |

## 13. Devoluciones

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | /orders/{id}/returns | Solicitar devolución | Buyer owner |
| GET | /returns | Mis devoluciones | Buyer |
| GET | /seller/returns | Devoluciones de vendedor | Seller |
| GET | /admin/returns | Listado admin | Admin |
| PATCH | /admin/returns/{id}/status | Resolver devolución | Admin |

## 14. Chat y ofertas

En Fase 1 el alcance recomendado es chat básico con polling o actualización ligera. La negociación por ofertas, aceptación, rechazo y contraofertas queda preparada como estructura futura, pero no debe considerarse parte obligatoria del MVP inicial.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /conversations | Mis conversaciones | Autenticado |
| POST | /conversations | Crear conversación | Buyer |
| GET | /conversations/{id} | Detalle conversación | Participante |
| GET | /conversations/{id}/messages | Mensajes | Participante |
| POST | /conversations/{id}/messages | Enviar mensaje | Participante |
| POST | /conversations/{id}/stock-question | Consultar stock | Buyer |

### Endpoints futuros para negociación

Estos endpoints quedan definidos como posible extensión posterior. No forman parte del alcance obligatorio de Fase 1 salvo confirmación específica.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | /conversations/{id}/offers | Hacer oferta futura | Buyer |
| PATCH | /offers/{id}/accept | Aceptar oferta futura | Seller |
| PATCH | /offers/{id}/reject | Rechazar oferta futura | Seller |
| PATCH | /offers/{id}/counter | Contraoferta futura | Seller |

## 15. Reseñas

Fase 2.

La visualización pública de reseñas de producto se mantiene en `GET /products/{slug}/reviews`, ya definido dentro de las rutas públicas de producto. En esta sección se listan las operaciones adicionales de creación, gestión propia y moderación.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | /orders/{id}/reviews | Crear reseña | Buyer owner |
| GET | /users/me/reviews | Mis reseñas | Buyer |
| POST | /reviews/{id}/images | Subir imagen | Review owner |
| PATCH | /admin/reviews/{id}/status | Moderar reseña | Admin |

## 16. Notificaciones

Fase 2.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /notifications | Mis notificaciones | Autenticado |
| GET | /notifications/unread-count | Contador | Autenticado |
| PATCH | /notifications/{id}/read | Marcar leída | Owner |
| PATCH | /notifications/read-all | Marcar todas | Autenticado |

## 17. Soporte

Fase 2.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /support/faqs | Preguntas frecuentes | Público |
| GET | /support/tickets | Mis tickets | Autenticado |
| POST | /support/tickets | Crear ticket | Autenticado |
| GET | /support/tickets/{id} | Detalle ticket | Owner |
| POST | /support/tickets/{id}/messages | Agregar mensaje | Owner/Admin |
| PATCH | /admin/support/tickets/{id}/status | Cambiar estado | Admin |
| GET | /admin/support/tickets | Listado admin | Admin |

## 18. Comunidad

Fase 3.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | /producers/{id}/follow | Seguir productor | Buyer |
| DELETE | /producers/{id}/follow | Dejar de seguir | Buyer |
| GET | /producers/{id}/followers | Seguidores | Producer/Admin |
| GET | /producers/{id}/posts | Posts públicos | Público |
| POST | /seller/posts | Crear post | Seller |
| PATCH | /seller/posts/{id} | Editar post | Seller owner |
| DELETE | /seller/posts/{id} | Ocultar post | Seller owner |
| POST | /posts/{id}/comments | Comentar | Autenticado |
| POST | /posts/{id}/reactions | Reaccionar | Autenticado |
| DELETE | /posts/{id}/reactions/{type} | Quitar reacción | Autenticado |

## 19. Pagos

En Fase 1 se prepara la estructura de pagos, pero no se implementa integración completa con Mercado Pago. Mercado Pago queda como integración futura y la wallet interna queda como sistema futuro separado del núcleo de pedidos.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | /orders/{id}/payment-intent | Crear intención de pago | Buyer owner |
| GET | /orders/{id}/payment | Estado de pago | Buyer owner |
| POST | /payments/webhooks/{provider} | Webhook proveedor | Público validado |

## 20. Wallet futura

Endpoints futuros. No forman parte de Fase 1 y no deben exponerse ni activarse en MVP salvo cambio explícito de alcance.

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | /wallet | Ver wallet | Autenticado |
| GET | /wallet/movements | Movimientos | Autenticado |
| POST | /wallet/withdrawals | Solicitar retiro | Seller |

## 21. Autorización por endpoint

Tipos de acceso:

- Público: no requiere login.
- Autenticado: requiere usuario logueado.
- Buyer: requiere rol comprador.
- Seller: requiere rol vendedor.
- Admin: requiere rol administrador.
- Owner: el recurso pertenece al usuario.
- Participante: usuario forma parte de la conversación.
- Seller related: el pedido contiene productos del productor.

## 22. Paginación y filtros

Todos los listados deben soportar:

```text
page
per_page
sort
```

El backend debe limitar `per_page` para evitar consultas pesadas.

Valor sugerido:

```text
default: 12
max: 50
```

## 23. Versionado

La primera versión será:

```text
/api/v1
```

Si en el futuro cambia el contrato de forma incompatible, se puede agregar:

```text
/api/v2
```

## 24. Ajustes API por feedback del cliente

### Productores

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| PATCH | /admin/producers/{id}/approve | Aprobar productor | Admin |
| PATCH | /admin/producers/{id}/reject | Rechazar productor | Admin |
| GET | /seller/social-links | Enlaces digitales propios | Seller |
| POST | /seller/social-links | Crear/actualizar enlace digital | Seller |

### EcoScore

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| PATCH | /admin/products/{id}/ecoscore | Validar o ajustar EcoScore | Admin |

### Checkout

`POST /checkout/cart` procesa un checkout único desde frontend, pero la respuesta puede contener múltiples órdenes si el carrito incluye productos de distintos productores.

### Chat

Los endpoints de imágenes no se implementan como obligación del MVP. La arquitectura queda preparada con `message_attachments` para una fase posterior.
