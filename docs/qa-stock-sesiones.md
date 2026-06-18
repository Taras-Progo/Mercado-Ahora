# QA: stock, carrito y sesiones simultáneas

## Sincronización esperada

- El carrito vuelve a consultar el stock al cargar la página, al volver a enfocar la pestaña, al regresar desde otra aplicación y después de modificar o eliminar productos.
- Si el productor cambia el stock, el comprador ve el nuevo valor al refrescar el carrito o al volver a la pestaña.
- Si la cantidad solicitada supera el stock actual, el sistema muestra un mensaje en español y permite actualizar el carrito sin abandonar la pantalla.

## Prueba recomendada

1. Abrir una cuenta de productor en un navegador o perfil.
2. Abrir una cuenta de comprador en otro navegador, perfil de Chrome, ventana incógnita o dispositivo.
3. Agregar el producto al carrito desde la cuenta compradora.
4. Cambiar el stock del producto desde la cuenta productora.
5. Volver al carrito del comprador o refrescar la página.
6. Confirmar que el carrito muestra el stock actualizado y permite comprar hasta la cantidad disponible.

## Sesiones simultáneas

Mercado Ahora soporta sesiones simultáneas con cuentas distintas cuando se usan contextos de navegador separados, por ejemplo Chrome + Firefox, perfiles diferentes de Chrome, incógnito o dispositivos distintos.

Dos cuentas distintas en dos pestañas del mismo perfil de navegador no pueden mantenerse independientes porque el navegador comparte `localStorage` y `sessionStorage` por dominio. Si se necesita operar dos cuentas en el mismo perfil al mismo tiempo, eso requiere una mejora futura de selector de cuenta o aislamiento de sesión.
