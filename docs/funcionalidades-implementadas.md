# Mercado Ahora - Funcionalidades implementadas

## Compradores

- Crear cuenta e iniciar sesión.
- Recuperar contraseña por email.
- Verificar email.
- Navegar productos y productores sin iniciar sesión.
- Buscar productos por texto, categoría y provincia.
- Ver detalle de producto.
- Guardar productos favoritos.
- Contactar al productor mediante chat.
- Agregar productos al carrito.
- Comprar ahora desde la ficha del producto.
- Confirmar pedido desde el carrito.
- Corregir cantidades desde la pantalla de confirmación si el stock cambió.
- Ver pedidos realizados.
- Consultar historial de estados.
- Solicitar devolución cuando el pedido es elegible.
- Ver devoluciones solicitadas.

## Productores

- Solicitar perfil productor desde una cuenta existente.
- Esperar aprobación administrativa.
- Acceder al panel del productor una vez aprobado.
- Crear productos como borrador.
- Completar información básica, precio, stock, ubicación, categoría y clasificación.
- Subir imágenes.
- Publicar, editar, pausar y eliminar productos según corresponda.
- Ver listado de productos propios.
- Ver pedidos recibidos.
- Actualizar estado de pedidos.
- Iniciar chat con el comprador desde un pedido.
- Ver devoluciones relacionadas con sus productos.
- Consultar información de EcoScore y estado inicial.
- Ver observaciones de moderación cuando administración solicita correcciones.

## Administradores

- Ver y buscar usuarios.
- Cambiar estado de usuarios.
- Restablecer contraseña temporalmente como herramienta de respaldo.
- Revisar solicitudes de productor.
- Aprobar o rechazar productores.
- Ver productos con nombre comercial del productor, usuario y email.
- Buscar productos por nombre de producto, productor, usuario o email.
- Filtrar publicaciones por productor.
- Ver todas las publicaciones de un productor.
- Editar campos clave de productos.
- Pausar, reactivar, rechazar o eliminar productos.
- Agregar notas de moderación y notificar al productor.
- Ver pedidos y cambiar estados.
- Ver devoluciones y actualizar su estado.
- Registrar acciones sensibles en auditoría administrativa.

## Infraestructura

- Dominio principal configurado.
- Soporte para `www.mercadoahora.com.ar` desde aplicación/Caddy.
- Envío de emails por Resend SMTP.
- Imágenes servidas desde storage público.
- Deploy por GitHub Actions al VPS.

## Funciones previstas para etapas posteriores

- Mercado Pago.
- Automatización completa de envíos.
- Reseñas y calificaciones.
- Notificaciones avanzadas.
- Panel desplegable de mensajes en header.
- Panel desplegable de carrito en header.
- Modo soporte con impersonación completa.
- Moderación avanzada con reglas automáticas.
