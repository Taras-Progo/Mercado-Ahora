# Diseño de Bajo Nivel (LLD) - Mercado Ahora

## 1. Objetivo del documento

Este documento describe cómo se implementarán los módulos principales de Mercado Ahora en backend, frontend y base de datos. El objetivo es convertir la arquitectura general en una guía técnica más cercana al desarrollo.

El LLD está organizado por capas y módulos. Los detalles exactos de tablas y endpoints se amplían en los documentos de base de datos y API.

## 2. Estructura general del repositorio

```text
backend/
  app/
    Http/
      Controllers/
      Requests/
      Resources/
      Middleware/
    Models/
    Policies/
    Services/
    Actions/
    Events/
    Listeners/
  database/
    migrations/
    seeders/
  routes/
    api.php
    web.php

frontend/
  src/
    app/
    components/
    features/
    lib/
    types/
    services/
```

## 3. Backend - Laravel

### 3.1 Capas backend

```text
Routes -> Controllers -> Form Requests -> Services/Actions -> Models -> Database
```

Responsabilidades:

- Routes: definir URLs y middleware.
- Controllers: recibir la solicitud y devolver respuesta.
- Form Requests: validar payloads.
- Services: lógica de negocio reutilizable.
- Actions: operaciones puntuales y transaccionales.
- Models: relaciones y scopes Eloquent.
- Policies: reglas de autorización por recurso.
- Resources: formato de salida JSON.

### 3.2 Convención de módulos backend

Cada módulo debe mantener una estructura clara:

```text
app/
  Http/
    Controllers/
      ProductController.php
    Requests/
      StoreProductRequest.php
      UpdateProductRequest.php
    Resources/
      ProductResource.php
  Models/
    Product.php
  Policies/
    ProductPolicy.php
  Services/
    ProductService.php
```

Para operaciones complejas se recomienda usar Actions:

```text
app/Actions/Products/CreateProductAction.php
app/Actions/Orders/CreateOrderFromCartAction.php
app/Actions/Notifications/CreateNotificationAction.php
```

## 4. Frontend - Next.js

### 4.1 Estructura de rutas

```text
src/app/
  page.tsx
  categories/
  products/[slug]/
  producers/[id]/
  search/
  cart/
  checkout/
  orders/
  support/
  seller/
  admin/
```

### 4.2 Organización por features

```text
src/features/
  auth/
  catalog/
  products/
  producers/
  cart/
  orders/
  chat/
  reviews/
  notifications/
  support/
  community/
  admin/
```

Cada feature puede contener:

```text
components/
api.ts
types.ts
utils.ts
hooks.ts
```

### 4.3 Consumo de API

La aplicación web debe consumir el backend desde un cliente central:

```text
src/lib/api-client.ts
```

Este cliente debe manejar:

- Base URL.
- Headers.
- Errores.
- Autenticación.
- Respuestas JSON.

## 5. Diseño por módulos

## 5.1 Autenticación

### Backend

Componentes:

- AuthController.
- RegisterRequest.
- LoginRequest.
- User model.
- Role model.
- Email verification.

Responsabilidades:

- Registrar comprador.
- Registrar vendedor.
- Iniciar sesión.
- Cerrar sesión.
- Verificar email.
- Obtener usuario autenticado.

Decisión técnica: la autenticación entre Next.js y Laravel se implementará con Laravel Sanctum en modo SPA.

### Frontend

Pantallas:

- Login.
- Registro comprador.
- Registro vendedor.
- Verificación de email.

Validaciones:

- Nombre requerido.
- Email válido.
- Password con longitud mínima.
- Tipo de usuario válido.

## 5.2 Roles y permisos

Roles base:

- admin.
- seller.
- buyer.

Reglas:

- Buyer: puede comprar, consultar, revisar y seguir productores.
- Seller: puede gestionar su perfil, productos, pedidos y mensajes.
- Admin: puede gestionar usuarios, vendedores, productos, pedidos y soporte.

Implementación:

- Middleware por rol para rutas generales.
- Policies para recursos concretos.
- Validación de ownership en backend.

## 5.3 Perfil de productor

### Backend

Modelo principal:

- ProducerProfile.

Relaciones:

- User hasOne ProducerProfile.
- ProducerProfile hasMany Products.
- ProducerProfile hasMany ProducerPosts.
- ProducerProfile hasMany Followers.

Campos principales:

- business_name.
- city.
- province.
- description.
- story.
- production_practices.
- profile_image_path.
- is_verified.

### Frontend

Pantallas:

- Perfil público del productor.
- Edición de perfil en panel vendedor.

## 5.4 Productos y catálogo

### Backend

Modelos:

- Product.
- ProductImage.
- Category.
- Inventory.

Servicios:

- ProductService.
- CatalogService.
- ProductImageService.

Reglas:

- Producto pertenece a un productor.
- Producto debe tener categoría.
- Producto puede estar en estado draft, pending_review, active, paused, rejected.
- Producto activo aparece en catálogo.

### Frontend

Pantallas:

- Crear producto.
- Editar producto.
- Catálogo público.
- Categorías.
- Subcategorías.
- Página de producto.

## 5.5 Búsqueda y filtros

### MVP

PostgreSQL resolverá:

- Búsqueda por nombre.
- Búsqueda por descripción.
- Filtro por categoría.
- Filtro por precio.
- Filtro por ubicación.
- Filtro por disponibilidad.
- Ordenamiento.
- Paginación.

### Crecimiento futuro

El módulo debe estar preparado para migrar a un motor de búsqueda dedicado sin cambiar toda la API.

Servicio sugerido:

```text
SearchService
  -> DatabaseProductSearchDriver
  -> FutureOpenSearchDriver
```

## 5.6 Chat comprador-productor

### Backend

Modelos:

- Conversation.
- Message.
- Offer, solo como estructura preparada para una etapa posterior.

Reglas:

- Una conversación puede estar asociada a un producto.
- Un comprador puede iniciar conversación con un productor.
- Mensajes pueden ser texto o imagen.
- En Fase 1 el alcance es chat básico entre comprador y productor.
- La lógica de ofertas, aceptación, rechazo y contraoferta queda preparada en estructura, pero no debe considerarse entrega obligatoria del MVP salvo confirmación posterior.

### MVP

Debe iniciar con polling o actualización ligera.

### Futuro

Puede evolucionar a WebSocket o Laravel Reverb.

## 5.7 Carrito

### Backend

Modelos:

- Cart.
- CartItem.

Reglas:

- Carrito pertenece a un usuario.
- Items se agrupan por productor.
- Cantidad no puede superar stock disponible.
- Total se recalcula desde precios actuales o snapshot según decisión final.

### Frontend

Funciones:

- Agregar producto.
- Quitar producto.
- Cambiar cantidad.
- Ver subtotal por productor.
- Seleccionar tipo de entrega.
- Continuar a checkout.

## 5.8 Pedidos

### Backend

Modelos:

- Order.
- OrderItem.
- OrderStatusHistory.

Reglas:

- Pedido se crea desde carrito o comprar ahora.
- Pedido contiene snapshot de producto y precio.
- Pedido tiene estado.
- Productor puede ver pedidos relacionados con sus productos.
- Comprador puede ver sus pedidos.

Estados sugeridos:

- pending.
- confirmed.
- preparing.
- shipped.
- delivered.
- cancelled.
- returned.

## 5.9 Devoluciones

### Backend

Modelos:

- ReturnRequest.

Reglas:

- Devolución pertenece a un pedido.
- Comprador puede solicitar devolución.
- Admin o vendedor puede revisar.
- Estado puede ser requested, approved, rejected, completed.

## 5.10 Administración

### Backend

Rutas protegidas por rol admin.

Funciones:

- Gestión de usuarios.
- Gestión de vendedores.
- Moderación de productos.
- Gestión de pedidos.
- Gestión de devoluciones.
- Gestión de soporte.

### Frontend

Pantallas:

- Dashboard admin.
- Usuarios.
- Vendedores.
- Productos.
- Pedidos.
- Soporte.

## 5.11 Reseñas

Se implementa en Fase 2.

Reglas:

- Solo usuarios con pedido entregado pueden reseñar.
- Una reseña por producto dentro de una orden.
- Puede incluir rating, comentario e imágenes.
- Debe actualizar promedio de producto y productor.

## 5.12 Notificaciones

Se implementa en Fase 2.

Eventos:

- Nuevo mensaje.
- Cambio de estado de pedido.
- Respuesta de soporte.
- Reseña solicitada.
- Nueva publicación de productor.
- Nuevo seguidor.

## 5.13 Soporte

Se implementa en Fase 2.

Módulos:

- FAQ.
- Ticket.
- Mensajes de soporte.
- Estado de ticket.

## 5.14 Comunidad

Se implementa en Fase 3.

Módulos:

- Seguidores.
- Publicaciones.
- Comentarios.
- Reacciones.
- Notificaciones de comunidad.

## 5.15 Pagos y wallet futura

En MVP se debe preparar la estructura, no acoplar el sistema a un proveedor único.

Componentes:

- PaymentIntent.
- PaymentTransaction.
- PaymentProviderInterface.
- MercadoPagoProvider futuro.
- InternalWalletProvider futuro.

Alcance definido:

- MVP: preparar estructura de pagos.
- Mercado Pago: integración futura.
- Wallet interna: sistema futuro.
- El núcleo de pedidos no debe depender directamente de Mercado Pago ni de la wallet.

Flujo:

```text
Order -> PaymentIntent -> Provider -> PaymentTransaction -> Order payment status
```

## 6. Manejo de errores

La API debe responder con estructura consistente:

```json
{
  "message": "Validation error",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

Tipos:

- 400: solicitud inválida.
- 401: no autenticado.
- 403: sin permiso.
- 404: recurso no encontrado.
- 422: error de validación.
- 500: error interno.

## 7. Seguridad

Controles mínimos:

- Validación con Form Requests.
- Policies por recurso.
- Middleware de autenticación.
- Middleware de rol.
- Sanitización de entradas.
- Validación de archivos.
- Rate limiting para login, registro y chat.
- Logs de errores.

## 8. Pruebas

Pruebas mínimas por módulo:

- Feature tests para endpoints principales.
- Unit tests para services/actions críticos.
- Tests de permisos por rol.
- Tests de validación.
- Tests de creación de pedido.
- Tests de reglas de reseñas.

## 9. Observaciones de implementación

- Mantener el MVP simple, pero no cerrado.
- No mezclar lógica de comunidad dentro del módulo de catálogo.
- No mezclar pagos directamente dentro de órdenes.
- Mantener tablas y servicios preparados para agregar Phase 2 y Phase 3.
- Priorizar claridad de datos y permisos antes que optimizaciones prematuras.

## 10. Ajustes LLD por validación de cliente

El EcoScore se gestiona dentro del dominio de producto. La versión MVP contempla puntaje declarado o calculado por reglas simples, estado de validación, usuario administrador que valida, fecha de validación y notas de revisión.

El registro de vendedor crea un perfil de productor en estado `pending`. Antes de publicar productos activos, el productor debe completar una postulación básica con origen de producción, tipos de producto, método de producción, trayectoria, historia y presencia digital opcional.

El perfil del productor debe exponer información de confianza: historia del emprendimiento, prácticas de producción, ubicación, trayectoria y señales de presencia digital externa.

La presencia digital se modela con enlaces dinámicos asociados al productor, evitando campos fijos por red social.

El usuario mantiene un único carrito. Durante checkout, el backend agrupa items por productor y genera pedidos separados por productor.

El chat de Fase 1 es texto. La base técnica queda preparada con adjuntos de mensaje para soportar imágenes después.
