# Definición de Módulos - Mercado Ahora

## 1. Objetivo

Este documento define los módulos funcionales del sistema, sus responsabilidades, dependencias y relación con las fases del proyecto.

La idea es que cada módulo tenga límites claros para evitar que el backend quede acoplado únicamente al marketplace. Esto permite agregar más adelante reseñas, notificaciones, soporte, comunidad, recomendaciones, logística y wallet.

## 2. Resumen de módulos

| Módulo | Fase | Prioridad | Descripción |
|---|---:|---:|---|
| Autenticación | 1 | Alta | Registro, login, verificación y sesión. |
| Roles y permisos | 1 | Alta | Control de acceso para admin, vendedor y comprador. |
| Usuarios | 1 | Alta | Cuenta base de cualquier usuario. |
| Perfil de productor | 1 | Alta | Datos públicos y operativos del vendedor/productor. |
| Catálogo | 1 | Alta | Categorías, subcategorías y navegación. |
| Productos | 1 | Alta | Alta, edición, imágenes, stock y visibilidad. |
| Búsqueda básica | 1 | Media | Búsqueda inicial y filtros simples. |
| Chat | 1 | Media | Contacto comprador-productor. |
| Carrito | 1 | Alta | Selección de productos antes de compra. |
| Pedidos | 1 | Alta | Creación y seguimiento de órdenes. |
| Devoluciones | 1 | Media | Flujo básico de retorno/reclamo. |
| Administración | 1 | Alta | Control interno de usuarios, productos y pedidos. |
| Reseñas | 2 | Media | Calificaciones de productos y productores. |
| Notificaciones | 2 | Media | Alertas internas por eventos. |
| Soporte | 2 | Media | FAQ, tickets y mensajes con soporte. |
| Búsqueda avanzada | 2 | Media | Filtros, ordenamiento y mejoras de búsqueda. |
| Seguidores | 3 | Media | Relación comprador-productor. |
| Publicaciones | 3 | Media | Novedades y contenido del productor. |
| Comunidad | 3 | Media | Comentarios y reacciones. |
| Pagos / wallet futura | Base + futuro | Alta | Preparación para Mercado Pago y wallet propia. |

## 3. Módulo de Autenticación

### Responsabilidad

Gestionar acceso seguro al sistema.

### Funciones

- Registro de comprador.
- Registro de vendedor.
- Login.
- Logout.
- Recuperación de contraseña.
- Verificación de email.
- Obtención del usuario autenticado.

### Relaciones

- Usa Users.
- Usa Roles.
- Activa navegación por tipo de usuario.

### Fase

Fase 1, Milestone 2.

## 4. Módulo de Roles y Permisos

### Responsabilidad

Definir qué puede hacer cada tipo de usuario.

### Roles base

- admin.
- seller.
- buyer.

### Funciones

- Middleware por rol.
- Policies por recurso.
- Control de ownership.
- Separación de rutas frontend por rol.

### Relaciones

- Users tiene roles.
- Products, Orders, Conversations y Admin dependen de permisos.

### Fase

Fase 1 desde Milestone 1 como diseño, implementación en Milestone 2.

## 5. Módulo de Usuarios

### Responsabilidad

Guardar la cuenta base del sistema.

### Funciones

- Datos personales mínimos.
- Email.
- Password.
- Estado de cuenta.
- Relación con roles.
- Relación con perfil de productor si aplica.

### Relaciones

- User hasOne ProducerProfile.
- User hasMany Orders.
- User hasMany Conversations.
- User hasMany Reviews.
- User hasMany Notifications.
- User hasMany SupportTickets.

## 6. Módulo de Perfil de Productor

### Responsabilidad

Representar la identidad pública y operativa del vendedor.

### Funciones

- Nombre de negocio/productor.
- Ciudad/provincia.
- Descripción.
- Historia.
- Prácticas de producción.
- Foto de perfil.
- Galería de proceso.
- Datos de entrega/contacto.
- Estado de verificación.

### Relaciones

- Pertenece a User.
- Tiene Products.
- Tiene Followers.
- Tiene ProducerPosts.
- Participa en Conversations.

### Observación

Este módulo es central para diferenciar Mercado Ahora de marketplaces tradicionales, porque el productor vende identidad y confianza, no solo productos.

## 7. Módulo de Catálogo

### Responsabilidad

Organizar productos para navegación y descubrimiento.

### Funciones

- Categorías principales.
- Subcategorías.
- Slugs.
- Imágenes.
- Orden de visualización.
- Estado activo/inactivo.

### Relaciones

- Category puede tener parent_id.
- Category hasMany Products.
- Product belongsTo Category.

### Categorías iniciales sugeridas

- Alimentos naturales.
- Huerta y productos frescos.
- Bebidas naturales.
- Cosmética natural.
- Bienestar y salud natural.
- Hogar sostenible.
- Artesanías y productos regionales.
- Mascotas naturales.

## 8. Módulo de Productos

### Responsabilidad

Gestionar los productos publicados por vendedores.

### Funciones

- Crear producto.
- Editar producto.
- Pausar producto.
- Eliminar o desactivar producto.
- Subir imágenes.
- Gestionar precio.
- Gestionar stock.
- Definir categoría.
- Definir tipo de producción.
- Definir forma de entrega.
- Estado de visibilidad.

### Relaciones

- Product belongsTo ProducerProfile.
- Product belongsTo Category.
- Product hasMany ProductImages.
- Product hasOne Inventory.
- Product hasMany Reviews.
- Product hasMany OrderItems.

## 9. Módulo de Búsqueda

### Responsabilidad

Permitir encontrar productos por texto, categoría y filtros.

### Fase 1

- Búsqueda básica por nombre.
- Filtros simples por categoría, precio y ubicación.
- Paginación.

### Fase 2

- Búsqueda por descripción.
- Filtros por disponibilidad, entrega, rating, EcoScore y productor verificado.
- Ordenamiento por relevancia, precio, newest y rating.

### Futuro

Preparar SearchService para usar motor dedicado si el catálogo crece.

## 10. Módulo de Chat

### Responsabilidad

Permitir conversación entre comprador y productor.

### Funciones

- Crear conversación.
- Enviar mensaje.
- Adjuntar imagen.
- Vincular conversación a producto.
- Consultar stock.
- Preparar estructura futura para ofertas.

### Relaciones

- Conversation belongsTo Buyer.
- Conversation belongsTo Producer.
- Conversation optionally belongsTo Product.
- Conversation hasMany Messages.
- Conversation puede tener Offers en una etapa posterior.

## 11. Módulo de Carrito

### Responsabilidad

Guardar productos antes de compra.

### Funciones

- Agregar producto.
- Cambiar cantidad.
- Quitar producto.
- Agrupar por productor.
- Calcular subtotal por productor.
- Calcular total general.
- Guardar nota para productor.
- Definir tipo de entrega.

### Relaciones

- Cart belongsTo User.
- Cart hasMany CartItems.
- CartItem belongsTo Product.

## 12. Módulo de Pedidos

### Responsabilidad

Crear y administrar órdenes de compra.

### Funciones

- Crear orden desde carrito.
- Crear orden desde comprar ahora.
- Guardar snapshot de producto y precio.
- Gestionar estado.
- Mostrar timeline.
- Permitir vista de comprador.
- Permitir vista de productor.

### Relaciones

- Order belongsTo Buyer.
- Order hasMany OrderItems.
- Order hasMany OrderStatusHistory.
- Order hasMany Payments.
- Order can have ReturnRequests.

## 13. Módulo de Devoluciones

### Responsabilidad

Gestionar reclamos o devoluciones básicas.

### Funciones

- Solicitar devolución.
- Revisar solicitud.
- Aprobar/rechazar.
- Registrar resolución.

### Relaciones

- ReturnRequest belongsTo Order.
- ReturnRequest belongsTo User.

## 14. Módulo de Administración

### Responsabilidad

Permitir control interno de la plataforma.

### Funciones

- Ver usuarios.
- Ver vendedores.
- Moderar productos.
- Ver pedidos.
- Revisar devoluciones.
- Responder soporte.
- Moderar futuras publicaciones.

### Relaciones

- Depende de Roles.
- Accede a Users, Products, Orders, Support y Community.

## 15. Módulo de Reseñas

### Responsabilidad

Generar confianza post-compra.

### Funciones

- Calificar producto.
- Calificar productor.
- Comentar.
- Subir fotos.
- Evitar duplicados.
- Mostrar promedio y distribución.

### Fase

Fase 2.

## 16. Módulo de Notificaciones

### Responsabilidad

Informar al usuario sobre eventos relevantes.

### Eventos

- Nuevo mensaje.
- Cambio de estado de pedido.
- Respuesta de soporte.
- Nueva publicación.
- Nuevo seguidor.
- Solicitud de reseña.

### Fase

Fase 2 y ampliación en Fase 3.

## 17. Módulo de Soporte

### Responsabilidad

Resolver dudas y problemas mediante FAQ y tickets.

### Funciones

- Buscar preguntas frecuentes.
- Crear ticket.
- Agregar mensajes.
- Cambiar estado.
- Notificar respuesta.

### Fase

Fase 2.

## 18. Módulo de Comunidad

### Responsabilidad

Construir relación entre compradores y productores.

### Funciones

- Seguir productor.
- Publicar novedades.
- Comentar publicaciones.
- Reaccionar con acciones propias.
- Notificar seguidores.

### Fase

Fase 3.

## 19. Módulo de Pagos y Wallet Futura

### Responsabilidad

Preparar la estructura de pagos sin cerrar la arquitectura.

### Funciones iniciales

- Registrar intención de pago.
- Registrar estado de pago.
- Preparar webhooks.
- Guardar proveedor.
- Mantener historial de transacciones.

### Futuro

- Mercado Pago.
- Wallet propia.
- Saldo interno.
- Movimientos.
- Retiros.

Alcance definido:

- En MVP se prepara la estructura de pagos.
- Mercado Pago no se implementa completo en MVP.
- La wallet propia queda para una fase futura.

## 20. Dependencias críticas

| Módulo origen | Depende de |
|---|---|
| Productos | Usuarios, Roles, Perfil de productor, Catálogo |
| Carrito | Usuarios, Productos |
| Pedidos | Usuarios, Productos, Carrito |
| Chat | Usuarios, Productos, Perfil de productor |
| Reseñas | Usuarios, Pedidos, Productos |
| Notificaciones | Usuarios, Eventos |
| Comunidad | Usuarios, Perfil de productor |
| Wallet futura | Usuarios, Pedidos, Pagos |

## 21. Ajustes de módulos por feedback del cliente

### Producto

- EcoScore queda como parte central del producto.
- Se agrega validación manual o autodeclarada para MVP.
- Administración puede revisar puntaje y registrar notas.

### Perfil de Productor

- El perfil incluye historia, trayectoria y prácticas de producción.
- El registro de productor se maneja como postulación con estado `pending`.
- Se preparan enlaces sociales dinámicos para presencia digital futura.

### Carrito y Pedidos

- El carrito es único desde la experiencia del comprador.
- Checkout agrupa internamente por productor y crea pedidos separados.

### Chat

- Fase 1 implementa texto.
- Adjuntos de imagen quedan preparados como estructura futura.
