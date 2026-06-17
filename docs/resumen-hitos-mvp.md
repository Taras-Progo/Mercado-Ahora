# Mercado Ahora - Resumen de trabajo MVP

Este documento resume el trabajo realizado durante los hitos del MVP de Mercado Ahora. El objetivo fue pasar de una plataforma prototipo a un marketplace funcional para compradores, productores y administradores, sin datos ficticios visibles en los flujos principales.

## Hito 1 y 2: Base de plataforma

- Configuración inicial del frontend y backend.
- Registro e inicio de sesión para compradores, productores y administradores.
- Validación de sesión optimizada para evitar pantallas largas de "Validando sesión".
- Flujo para que un comprador pueda solicitar convertirse en productor usando la misma cuenta.
- Panel administrador inicial para revisar productores y usuarios.
- Configuración de dominio, VPS, Cloudflare, Caddy y Resend.
- Recuperación de contraseña y verificación de email con plantillas en español y estilo Mercado Ahora.

## Hito 3: Productores, productos y catálogo

- Panel base del productor aprobado.
- Creación, edición, pausa/reactivación y eliminación segura de productos.
- Carga de imágenes de producto.
- Categorías y subcategorías.
- Catálogo público por categorías.
- Búsqueda real de productos por nombre, descripción, categoría, productor y ubicación.
- Filtro de provincia basado únicamente en provincias con productos publicados.
- Manejo básico de stock.
- Visibilidad de producto: borrador, pendiente, activo, pausado y rechazado.
- EcoScore informativo: comienza en 0 y explica cómo se validará.
- Limpieza de datos falsos en paneles y tarjetas.

## Hito 4: Compra, carrito, chat y flujo comercial

- Página de detalle de producto con acciones principales.
- Botón para contactar o iniciar chat con el productor.
- Botón para comprar ahora.
- Chat comprador-productor ligado a producto y/o pedido.
- Flujo de agregar al carrito.
- Página de carrito.
- Confirmación de pedido en español.
- Creación de pedidos desde carrito y desde "Comprar ahora".
- Validación de stock durante compra.
- Descuento automático de stock al crear el pedido.
- Corrección dentro del checkout cuando el stock cambió antes de confirmar.
- Favoritos reales por usuario.
- Navegación pública para productos y productores, con login solo cuando se quiere interactuar.

## Hito 5: Pedidos, devoluciones, administración y cierre MVP

- Gestión de pedidos para comprador, productor y administrador.
- Historial de estados del pedido.
- Actualización manual de estados por productor/admin.
- Chat desde el pedido para coordinar entrega o consulta.
- Flujo básico de devoluciones.
- Solicitud de devolución por comprador.
- Vista de devoluciones para comprador, productor y administrador.
- Al completar una devolución, el pedido queda marcado como devuelto.
- Panel administrador con gestión de usuarios, productores, productos, pedidos y devoluciones.
- Moderación administrativa de productos con notas, acciones y auditoría.
- Documentación inicial de funcionalidades y manual de usuario.

## Limitaciones actuales del MVP

- Los pagos son manuales. Mercado Pago no está integrado todavía.
- Los envíos se coordinan manualmente entre comprador y productor.
- No hay sistema avanzado de notificaciones en tiempo real.
- No hay reseñas públicas de productos o productores.
- No hay soporte/tickets avanzado.
- El "modo soporte" queda limitado a visualización y auditoría; no hay impersonación completa por seguridad.

## Próximas mejoras UX documentadas

- Panel desplegable de últimos mensajes desde el icono del header.
- Panel desplegable de resumen rápido del carrito.
- Mejoras SEO: metadata enriquecida, datos estructurados, canonical y previews sociales.
- Integración futura de Mercado Pago.
- Centro de notificaciones y soporte.
