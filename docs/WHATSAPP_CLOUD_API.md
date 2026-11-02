# Compatibilidad con la API oficial de WhatsApp

La arquitectura puede adaptarse, pero la aplicación actual **no soporta Cloud API
directamente**. No basta reemplazar una URL o token. El conector usa
`whatsapp-web.js`, Chrome, `LocalAuth`, QR, objetos `Message` y `msg.reply()`.
Meta Cloud API recibe por webhooks y envía mediante HTTP con credenciales de una
cuenta de WhatsApp Business Platform.

## Qué se conserva y qué cambia

| Área | Compatibilidad |
| --- | --- |
| API Express, productos, clientes, pedidos, pagos y MongoDB | Reutilizables; no dependen de cómo llega el mensaje |
| Frontend y landing | Reutilizables; añadir UI de estado/configuración si se necesita |
| Rasa y acciones | Reutilizables: actualmente se conectan con la API, no con Puppeteer |
| Manejadores de menú, producto, cantidad, carrito y orden | Reutilizables tras separar entradas/salidas del transporte |
| `handlers/index.ts`, `Client`, `Message`, `MessageMedia`, `msg.reply()` | Adaptar a una interfaz de transporte |
| QR, Chrome, caché y carpeta de autenticación | Se sustituyen por alta del número, token y webhooks |
| Estado en memoria del bot | Debe persistirse y protegerse contra reintentos/duplicados |

Los mensajes de texto, imágenes del catálogo y enlaces de checkout tienen
equivalente en la [colección oficial de Meta](https://www.postman.com/meta/whatsapp-business-platform/folder/o48mro7/messages).
Los mensajes entrantes y estados de entrega se reciben mediante
[webhooks](https://www.postman.com/meta/whatsapp-business-platform/folder/lboq68h/webhooks).

## Cambio propuesto

1. Extraer un evento propio `{ id, phone, name, text, timestamp }` y un transporte
   `sendText/sendImage` de `handlers/index.ts`. Mantener primero el adaptador Web
   para probar que las ventas actuales no cambian.
2. Crear un adaptador Cloud API con número de prueba, `phone_number_id`, WABA y
   credenciales de Meta. Mantener esos secretos solo en el backend.
3. Añadir un webhook HTTPS público: verificación GET del challenge y validación
   de firma de POST sobre el cuerpo original. No confundir el token de verificación
   con el token de acceso para enviar mensajes.
4. Registrar el identificador del mensaje entrante con índice único para evitar
   procesar dos veces el mismo webhook. Confirmar recepción rápidamente tras
   persistir el evento; procesarlo con reintentos y orden por conversación.
5. Persistir sesiones y envíos pendientes en MongoDB; separar estados de entrega
   de mensajes entrantes. No tratar eventos de entrega como pedidos nuevos.
6. Mantener el flujo de compra y checkout; agregar plantillas para recordatorios
   o notificaciones fuera de la ventana de atención. Probar con el sandbox de
   Culqi y números de prueba, incluidos eventos repetidos y fallos de red.
7. Migrar el número real solo después de validar el alta y las condiciones de la
   cuenta. No asumir que el mismo número conservará automáticamente el uso en la
   app móvil; revisar elegibilidad y el flujo de coexistencia disponible en Meta.

La ventana de atención se abre durante 24 horas tras un mensaje del usuario.
Las condiciones y tarifas dependen de categoría/mercado; no conviene estimar un
costo fijo sin conocer volumen y tipo de mensajes. Consultar la
[página oficial de precios](https://whatsappbusiness.com/products/platform-pricing/?lang=en)
antes de elegir el flujo de notificaciones.

## Efecto en Docker

El servicio que use Cloud API ya no necesita Chrome, QR ni el volumen
`whatsapp-auth`. Nginx encaminaría el webhook hacia el nuevo adaptador/endpoint
de la API. MongoDB, frontend, landing y Rasa permanecen. Se necesitaría dominio
HTTPS público: los puertos locales de esta configuración no son un webhook
alcanzable por Meta.

Esta revisión no cambia el conector que ya funciona ni registra/migra tu número.
La migración debe ser un cambio separado, probado con el número de prueba de Meta.
Ejemplos oficiales: [fbsamples/whatsapp-api-examples](https://github.com/fbsamples/whatsapp-api-examples).
