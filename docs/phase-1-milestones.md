# Mercado Ahora — Plan de Hitos (Milestones)

## Stack Tecnologico
- **Backend:** Laravel 13 (PHP 8.3) — REST API
- **Frontend:** Next.js 16 (TypeScript, Tailwind CSS v4)
- **Base de Datos:** PostgreSQL 16
- **Autenticacion:** Laravel Sanctum (SPA)
- **Idioma:** Espanol
- **Moneda:** ARS (Pesos Argentinos)
- **Pais:** Argentina

---

# FASE 1 — MVP (10 semanas)

**Objetivo:** Construir la base funcional del marketplace para validar si los productores publican productos y si los compradores pueden descubrir, consultar y comprar.

---

## Milestone 1 — Arquitectura y Fundacion del Proyecto

**Timeline:** 2 semanas

**NOTA:** Este milestone es sobre estructura, entorno, arquitectura y documentacion. **No debe incluir implementacion completa de registro/login.**

### Entregables

- Documentacion basica: HLD, LLD (diseno de modulos, relaciones, base de datos, API)
- Arquitectura general del sistema
- Configuracion del repositorio en GitHub
- Configuracion inicial de Laravel + Next.js
- Configuracion de PostgreSQL
- Estructura base del backend (API) y frontend
- Diseno inicial del modelo de usuarios
- Diseno del sistema de roles base (admin / seller / buyer)
- Fundacion preparada para extensiones futuras

### Estado de Implementacion

- [x] Repositorio GitHub creado
- [x] Estructura Laravel + Next.js configurada
- [x] Docker Compose con PostgreSQL 16
- [x] Variables de entorno (.env)
- [x] Documentacion de arquitectura (HLD, LLD, modulos, DB, API, roles, extensiones)
- [x] Migraciones de base de datos (30+ tablas)
- [x] Modelos Eloquent con relaciones
- [x] Sistema de roles base implementado (role en users)
- [x] Laravel Sanctum configurado para autenticacion SPA
- [x] Estructura de API REST v1 definida
- [x] Middleware de autenticacion y roles
- [x] Estructura de pagos preparada (PaymentIntent, PaymentTransaction, WebhookEvents)
- [x] Documentacion de setup y deployment (docs/setup.md, DEPLOYMENT.md)

---

## Milestone 2 — Sistema de Registro y Acceso de Usuarios / Vendedores

**Timeline:** 2 semanas

**Este milestone convierte la arquitectura en acceso de usuarios funcional.**

### Entregables

- Registro de usuario (comprador)
- Registro de vendedor
- Sistema de login
- Flujo de autenticacion
- Control de acceso basado en roles
- Base de verificacion de email
- Creacion de perfil basico de vendedor
- Ruteo por rol (comprador / vendedor / admin)
- Entrada basica al dashboard segun rol

### Estado de Implementacion

#### Backend — API Endpoints
- [x] `POST /api/v1/auth/register` — Registro de comprador
- [x] `POST /api/v1/auth/register-seller` — Registro de vendedor
- [x] `POST /api/v1/auth/login` — Inicio de sesion
- [x] `GET /api/v1/auth/me` — Datos del usuario autenticado
- [x] `POST /api/v1/auth/logout` — Cierre de sesion
- [x] Rutas preparadas: forgot-password, reset-password, email-verify

#### Perfil de Vendedor — API Endpoints
- [x] `GET /api/v1/seller/profile` — Obtener perfil
- [x] `POST/PATCH /api/v1/seller/profile` — Guardar/Actualizar perfil
- [x] `GET /api/v1/seller/social-links` — Listar enlaces sociales
- [x] `POST /api/v1/seller/social-links` — Agregar enlace social
- [x] `GET /api/v1/seller/dashboard` — Dashboard con estado y contadores
- [x] Sistema de postulacion: perfil nuevo → status `pending` hasta aprobacion

#### Middleware y Control de Acceso
- [x] `auth:sanctum` para rutas protegidas
- [x] `role:buyer,seller` para rutas compartidas
- [x] `role:seller` exclusivo para panel de vendedor
- [x] `role:admin` exclusivo para panel de administracion
- [x] Verificacion de cuenta activa en login

#### Frontend
- [x] `AuthProvider` — Contexto global de autenticacion
- [x] `AuthPanel` — Panel de login/registro
- [x] `RoleGuard` — Proteccion de rutas por rol
- [x] `EmailVerificationBanner`
- [x] Pagina `/seller` — ProducerDashboard completo
- [x] Paginas preparadas: login, register, recuperar, verificar-email, cuenta

---

## Milestone 3 — Registro de Productos por Vendedor y Estructura del Catalogo

**Timeline:** 1 semana

### Entregables

- Creacion de productos por vendedor
- Editar / eliminar / pausar productos
- Subida de imagenes de productos
- Categorias y subcategorias
- Catalogo de productos con categorias
- Inventario basico y stock
- Estado de visibilidad del producto

### Estado de Implementacion

#### Categorias
- [x] Modelo `Category` con jerarquia (parent_id para subcategorias)
- [x] 8 categorias iniciales definidas
- [x] `GET /api/v1/categories` — Listar categorias activas
- [x] `GET /api/v1/categories/{slug}` — Ver categoria

#### Productos — Modelo
- [x] Modelo `Product` con campos completos (name, slug, description, price_cents, currency=ARS, stock, unit, production_type, province, city, delivery_type, ecoscore_points/notes/status/validated_by/validated_at)
- [x] Modelo `ProductImage` (multiples imagenes, is_primary, sort_order)
- [x] Relaciones: Product → ProducerProfile, Product → Category, Product → ProductImage

#### Panel de Vendedor — API de Productos
- [x] `GET /api/v1/seller/products` — Listar productos
- [x] `POST /api/v1/seller/products` — Crear producto
- [x] `GET /api/v1/seller/products/{id}` — Ver producto
- [x] `PATCH /api/v1/seller/products/{id}` — Actualizar producto
- [x] `DELETE /api/v1/seller/products/{id}` — Eliminar (soft, cambia a paused)
- [x] `PATCH /api/v1/seller/products/{id}/pause` — Pausar
- [x] `PATCH /api/v1/seller/products/{id}/publish` — Publicar

#### Inventario y EcoScore
- [x] Campo stock con validacion minima 0
- [x] Unidad de medida personalizable (kg, unidad, frasco, bolsa)
- [x] Sistema EcoScore 0-100 (natural 25, local 20, empaque 20, entrega 15, perfil 20)
- [x] Rangos: Alto (80-100), Medio (50-79), Basico (0-49)
- [x] Validacion: self_declared → manual_reviewed

---

## Milestone 4 — Pagina de Producto, Chat y Flujo de Compra

**Timeline:** 3 semanas

### Entregables

- Pagina de producto con UI/UX definida
- Boton "Chat" en la pagina de producto
- Chat basico entre usuario y productor
- Flujo de "Comprar ahora"
- Carrito de compras
- Preparacion de checkout
- Creacion de pedidos

### Estado de Implementacion

#### Catalogo Publico — API Endpoints
- [x] `GET /api/v1/products` — Listado publico (status=active, paginacion, filtros: q, category, province, production_type)
- [x] `GET /api/v1/products/{slug}` — Detalle de producto
- [x] `GET /api/v1/products/{slug}/related` — Relacionados (4)
- [x] `GET /api/v1/categories/{slug}/products` — Productos por categoria
- [x] `GET /api/v1/producers` — Listado de productores activos
- [x] `GET /api/v1/producers/{id}` — Detalle de productor
- [x] `GET /api/v1/search/products` y `/search/producers` — Busqueda

#### Chat — API Endpoints
- [x] `GET /api/v1/conversations` — Listar conversaciones
- [x] `POST /api/v1/conversations` — Crear conversacion
- [x] `GET /api/v1/conversations/{id}` — Ver conversacion
- [x] `GET /api/v1/conversations/{id}/messages` — Listar mensajes
- [x] `POST /api/v1/conversations/{id}/messages` — Enviar mensaje
- [x] `POST /api/v1/conversations/{id}/stock-question` — Consultar stock
- [x] Modelos: Conversation, Message, MessageAttachment

#### Carrito de Compras — API Endpoints
- [x] `GET /api/v1/cart` — Ver carrito
- [x] `POST /api/v1/cart/items` — Agregar item
- [x] `PATCH /api/v1/cart/items/{id}` — Actualizar item
- [x] `DELETE /api/v1/cart/items/{id}` — Eliminar item
- [x] `PATCH /api/v1/cart/delivery` — Tipo de entrega
- [x] `POST /api/v1/cart/checkout-preview` — Vista previa
- [x] Modelos Cart + CartItem con snapshots de precio/nombre

#### Flujo de Compra — API Endpoints
- [x] `POST /api/v1/checkout/buy-now` — Compra directa
- [x] `POST /api/v1/checkout/cart` — Checkout desde carrito (una orden por productor)
- [x] Numero de orden: `MA-YYYYMMDD-XXXXXX`
- [x] Snapshots en order_items
- [x] Transacciones atomicas con DB::transaction()

#### Frontend
- [x] Home (`/`) — Hero, categorias, productos/productores destacados
- [x] Componentes: HeroSection, CategoriesGrid, FeaturedProducts, FeaturedProducers, ValueBanner, SiteHeader, SiteFooter
- [x] Paginas preparadas: categorias, buscar, products, productores, cart, checkout, orders, chat, favoritos
- [x] Demo data y funciones helper (money, ecoLabel)
- [ ] Implementacion de polling para chat en frontend

---

## Milestone 5 — Pedidos, Devoluciones, Admin y Entrega del MVP

**Timeline:** 2 semanas

### Entregables

- Gestion de pedidos
- Flujo basico de devoluciones
- Vista basica de pedidos del productor
- Panel de administracion basico
- Testing y correccion de errores
- Preparacion de despliegue en VPS
- Documentacion final del MVP

### Estado de Implementacion

#### Pedidos (Comprador)
- [x] `GET /api/v1/orders` — Mis pedidos
- [x] `GET /api/v1/orders/{id}` — Ver pedido
- [x] `GET /api/v1/orders/{id}/tracking` — Seguimiento
- [x] `POST /api/v1/orders/{id}/returns` — Solicitar devolucion
- [x] `GET /api/v1/returns` — Mis devoluciones

#### Pedidos (Vendedor)
- [x] `GET /api/v1/seller/orders` — Pedidos del productor
- [x] `GET /api/v1/seller/orders/{id}` — Ver pedido
- [x] `PATCH /api/v1/seller/orders/{id}/status` — Actualizar estado
- [x] Modelo OrderStatusHistory

#### Pagos (Estructura Preparada)
- [x] `POST /api/v1/orders/{id}/payment-intent` — Intencion de pago
- [x] `GET /api/v1/orders/{id}/payment` — Estado de pago
- [x] `POST /api/v1/payments/webhooks/{provider}` — Webhook
- [x] Modelos: PaymentIntent, PaymentTransaction, PaymentWebhookEvents

#### Panel Admin — API
- [x] Usuarios: list, show, updateStatus
- [x] Productores: list, updateStatus, approve (registra approved_by/at/notes), reject (requiere razon)
- [x] Productos: list, updateStatus, approve, reject, validateEcoScore
- [x] Pedidos: list, show, updateStatus
- [x] Devoluciones: list, updateStatus

#### Deployment e Infraestructura
- [x] Dockerfiles (backend + frontend)
- [x] docker-compose.prod.yml (postgres, backend, frontend, caddy)
- [x] Caddyfile (reverse proxy SSL)
- [x] Scripts: deploy.sh, provision-ubuntu.sh
- [x] DEPLOYMENT.md
- [ ] Testing general
- [ ] Documentacion final / manual de usuario

#### Frontend Pendiente
- [ ] UI completa del panel de administracion
- [ ] UI de chat funcional (polling)

---

## Resumen de Estado — Fase 1

| Milestone | Estado | Completado |
|-----------|--------|------------|
| Milestone 1 — Arquitectura y Fundacion | Completado | 100% |
| Milestone 2 — Registro y Acceso | Completado | 100% |
| Milestone 3 — Productos y Catalogo | Completado | 100% |
| Milestone 4 — Pagina Producto, Chat y Compra | Avanzado | ~90% |
| Milestone 5 — Pedidos, Admin y Entrega | Avanzado | ~85% |

### Pendientes clave para completar Fase 1:
1. Implementar polling/actualizacion ligera del chat en frontend
2. Completar UI del panel de administracion
3. Testing general del sistema
4. Documentacion final / manual de usuario basico
5. Implementar flujo completo de verificacion de email
6. Crear seeders con datos de prueba realistas
7. Definir e implementar storage de imagenes

---

# FASE 2 — Mejora de Experiencia (4 semanas)

## Milestone 6 — Resenas y Calificaciones (Semana 1)
- Resenas solo despues de pedido completado
- Calificacion 1-5 estrellas (producto + productor)
- Una resena por pedido
- Imagenes opcionales
- Tablas: reviews, review_images

## Milestone 7 — Notificaciones (Semana 1)
- Centro de notificaciones in-app
- Leido/no leido, redireccion al origen
- Tipos: pedidos, chat, sistema
- Basado en eventos con polling ligero
- Tablas: notifications, notification_events

## Milestone 8 — Soporte (Semana 1)
- FAQ + tickets de soporte
- Conversacion asincrona dentro del ticket
- Estados: open, in progress, resolved
- Tablas: support_tickets, support_messages

## Milestone 9 — Busqueda Avanzada (Semana 1)
- Busqueda por nombre + descripcion
- Filtros: precio, categoria, ubicacion, disponibilidad, entrega
- Ordenamiento: precio, nuevos, calificacion

---

# FASE 3 — Comunidad / Diferenciacion (4 semanas)

## Milestone 10 — Seguidores (Semana 1)
- Seguir/dejar de seguir productor
- Boton en perfil, conteo visible
- Tabla: followers

## Milestone 11 — Publicaciones (Semana 1)
- Publicaciones del productor (texto + imagenes + producto opcional)
- Visibles en perfil del productor
- Tablas: producer_posts, post_images

## Milestone 12 — Red Social (Semana 1)
- Comentarios en publicaciones
- Reacciones: "Apoyar", "Recomendar", "Me interesa"
- Tablas: post_comments, post_reactions

## Milestone 13 — Integracion de Comunidad (Semana 1)
- Publicacion → notificacion a seguidores
- Perfil muestra publicaciones + seguidores
- Notificaciones incluyen nueva publicacion, nuevo seguidor

---

## Arquitectura para el Futuro

Tablas ya disenadas en la base de datos actual:

| Funcionalidad | Tablas | Fase |
|---------------|--------|------|
| Resenas | reviews, review_images | Fase 2 |
| Notificaciones | notifications, notification_events | Fase 2 |
| Soporte | support_tickets, support_messages | Fase 2 |
| Seguidores | followers | Fase 3 |
| Publicaciones | producer_posts, post_images | Fase 3 |
| Comentarios | post_comments | Fase 3 |
| Reacciones | post_reactions | Fase 3 |
| Pagos (Mercado Pago) | payment_intents, payment_transactions, payment_webhook_events | Fase 2 |
| Wallet interna | wallets, wallet_movements, wallet_withdrawals | Futuro |
| Chat con adjuntos | message_attachments | Fase 2 |