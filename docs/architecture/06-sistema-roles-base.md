# Diseño del Sistema de Roles Base - Mercado Ahora

## 1. Objetivo

Este documento define el sistema base de roles y permisos para Mercado Ahora. El sistema debe cubrir Fase 1 y quedar preparado para reseñas, notificaciones, soporte, comunidad y wallet futura.

## 2. Roles base

Mercado Ahora inicia con tres roles principales:

- Administrador.
- Vendedor / productor.
- Comprador.

Un usuario puede tener más de un rol si el negocio lo requiere, aunque para el MVP se recomienda mantenerlo simple:

- Usuario comprador por defecto.
- Usuario vendedor cuando crea o solicita perfil de productor.
- Usuario admin asignado manualmente.

Un vendedor conserva los permisos básicos de comprador salvo que el negocio defina una restricción explícita. Esto permite que un productor también pueda comprar productos de otros vendedores sin crear una cuenta separada.

## 3. Rol comprador

### Descripción

Usuario que compra, consulta productos y participa en la comunidad.

### Permisos Fase 1

- Registrarse.
- Iniciar sesión.
- Ver productos.
- Ver categorías.
- Buscar productos.
- Ver perfil de productor.
- Contactar productor por chat.
- Agregar productos al carrito.
- Comprar con "Comprar ahora".
- Comprar desde carrito.
- Ver sus pedidos.
- Ver seguimiento de pedido.
- Solicitar devolución.

### Permisos Fase 2

- Crear reseñas después de pedido entregado.
- Subir imágenes en reseñas.
- Ver notificaciones.
- Marcar notificaciones como leídas.
- Crear tickets de soporte.
- Responder en sus tickets.

### Permisos Fase 3

- Seguir productores.
- Dejar de seguir productores.
- Comentar publicaciones.
- Reaccionar con Apoyar, Recomendar o Me interesa.

### Restricciones

- No puede publicar productos sin rol vendedor.
- No puede modificar productos de vendedores.
- No puede ver pedidos de otros usuarios.
- No puede moderar contenido.

## 4. Rol vendedor / productor

### Descripción

Usuario que publica productos, gestiona su perfil de productor y responde consultas.

### Permisos Fase 1

- Crear perfil de productor.
- Editar su perfil de productor.
- Crear productos.
- Editar sus productos.
- Subir imágenes de sus productos.
- Pausar sus productos.
- Ver sus productos publicados.
- Recibir consultas por chat.
- Responder mensajes.
- Ver pedidos relacionados con sus productos.
- Cambiar estados operativos de pedidos relacionados.
- Ver panel básico de productor.

### Permisos Fase 2

- Ver reseñas de sus productos.
- Ver promedio de calificación.
- Recibir notificaciones.
- Gestionar mensajes con compradores.
- Crear tickets de soporte como usuario.

### Permisos Fase 3

- Ver seguidores.
- Crear publicaciones.
- Editar publicaciones propias.
- Relacionar publicaciones con productos.
- Recibir comentarios y reacciones.

### Restricciones

- No puede editar productos de otros productores.
- No puede ver pedidos que no incluyan sus productos.
- No puede aprobarse a sí mismo si existe moderación.
- No puede administrar usuarios.
- No puede responder tickets de soporte como admin.

## 5. Rol administrador

### Descripción

Usuario interno encargado de controlar la plataforma.

### Permisos Fase 1

- Ver usuarios.
- Cambiar estado de usuarios.
- Ver vendedores.
- Aprobar, pausar o rechazar productores.
- Ver productos.
- Moderar productos.
- Ver pedidos.
- Ver devoluciones.
- Resolver o actualizar devoluciones.
- Acceder al panel administrativo.

### Permisos Fase 2

- Moderar reseñas.
- Ver notificaciones operativas.
- Ver tickets de soporte.
- Responder tickets.
- Cambiar estado de tickets.
- Administrar FAQ.

### Permisos Fase 3

- Moderar publicaciones.
- Moderar comentarios.
- Ocultar reacciones o contenido abusivo.
- Ver actividad comunitaria.

### Restricciones

- Las acciones administrativas deben quedar auditables.
- No debe usarse una cuenta admin para operaciones normales de compra/venta.

## 6. Modelo de permisos

El sistema puede iniciar con roles simples y policies Laravel.

### Middleware

Uso sugerido:

```text
auth
role:admin
role:seller
role:buyer
```

### Policies

Policies por recurso:

- ProductPolicy.
- OrderPolicy.
- ConversationPolicy.
- ReviewPolicy.
- ProducerPostPolicy.
- SupportTicketPolicy.

Las policies deben verificar:

- Rol.
- Ownership.
- Relación con el recurso.
- Estado del recurso.

## 7. Matriz de permisos

| Acción | Comprador | Vendedor | Admin |
|---|---:|---:|---:|
| Ver catálogo | Sí | Sí | Sí |
| Crear producto | No | Sí | Sí |
| Editar producto propio | No | Sí | Sí |
| Editar producto ajeno | No | No | Sí |
| Comprar producto | Sí | Sí | Sí |
| Ver pedido propio | Sí | Sí, si participa | Sí |
| Cambiar estado pedido | No | Sí, limitado | Sí |
| Crear reseña | Sí, si compró | Sí, si compró | No recomendado |
| Moderar reseña | No | No | Sí |
| Crear ticket soporte | Sí | Sí | Sí |
| Responder como soporte | No | No | Sí |
| Seguir productor | Sí | Sí | Sí |
| Crear publicación productor | No | Sí | Sí |
| Moderar publicación | No | No | Sí |
| Gestionar usuarios | No | No | Sí |

Nota: el rol vendedor hereda permisos de comprador en el flujo normal del MVP, excepto cuando una regla de negocio indique lo contrario.

## 8. Reglas de ownership

### Productos

Un vendedor solo puede modificar productos donde:

```text
product.producer_profile.user_id == current_user.id
```

### Pedidos

Un comprador puede ver pedidos donde:

```text
order.buyer_id == current_user.id
```

Un vendedor puede ver pedidos si alguno de los order_items pertenece a su producer_profile.

### Conversaciones

Un usuario puede ver una conversación si:

- Es el comprador de la conversación.
- O es el usuario dueño del perfil productor asociado.
- O es admin.

### Reseñas

Un usuario puede crear reseña si:

- La orden está entregada.
- La orden pertenece al usuario.
- El producto pertenece a la orden.
- No existe reseña previa para esa combinación.

## 9. Estados relevantes para permisos

### Product status

- draft.
- pending_review.
- active.
- paused.
- rejected.

### Producer status

- pending.
- active.
- paused.
- rejected.

### Order status

- pending.
- confirmed.
- preparing.
- shipped.
- delivered.
- cancelled.
- returned.

### Ticket status

- open.
- in_progress.
- resolved.

## 10. Implementación recomendada en Laravel

### Ejemplo middleware de ruta

```php
Route::middleware(['auth:sanctum', 'role:seller'])->group(function () {
    Route::post('/seller/products', [SellerProductController::class, 'store']);
});
```

### Ejemplo policy conceptual

```php
public function update(User $user, Product $product): bool
{
    return $user->hasRole('admin')
        || $product->producerProfile->user_id === $user->id;
}
```

## 11. Consideraciones futuras

Cuando el sistema crezca se puede evolucionar a permisos más granulares:

- product.create.
- product.update.
- order.manage.
- support.reply.
- community.moderate.
- wallet.withdraw.

Para el MVP no es obligatorio implementar permisos granulares, pero la estructura de roles no debe impedirlo.

## 12. Ajustes por flujo de confianza

- Un vendedor recién registrado queda como productor `pending`.
- Un productor `pending` puede completar su perfil y postulación.
- Un productor `pending` no debe publicar productos activos.
- El administrador puede aprobar o rechazar productores.
- El administrador puede validar o ajustar EcoScore de productos.
- El comprador ve historia, prácticas y señales de confianza del productor.
