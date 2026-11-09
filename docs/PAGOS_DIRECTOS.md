# Pagos directos y reintentos

Para una compra nueva con tarjeta, el flujo es:

1. El carrito crea un pedido interno. Su `checkoutKey` se conserva en la sesión
   hasta obtener el enlace; repetir la solicitud con esa clave y esos productos
   devuelve el mismo pedido. Una compra nueva tiene otra clave.
2. `POST /api/culqi/create-order` con `method: card` prepara un único registro
   local de pago y devuelve `orderId` y `checkoutUrl`. El nombre de la ruta se
   conserva para los clientes existentes y WhatsApp; no crea una orden en Culqi.
3. El frontend abre el checkout con RSA, sin el parámetro de orden externa.
4. `POST /api/culqi/create-charge` recibe `orderId` y `tokenId`. El backend obtiene
   importe y cliente de la base, bloquea el pedido atómicamente y crea el cargo.
5. Solo una aprobación del proveedor que coincida en importe, moneda, pedido e
   intento marca el pago como completado. El frontend muestra la confirmación.

Seguirán existiendo el ID de tu pedido y el ID `chr_...` del cargo: identifican
objetos diferentes y necesarios. Lo eliminado es el `ord_...` adicional de Culqi
en las nuevas compras con tarjeta. Los registros históricos no se borran.

## Protección y conciliación

- Repetir la preparación reutiliza el registro local, incluso concurrentemente.
- Dos solicitudes de cargo para el mismo pedido no pueden adquirir el bloqueo.
- Un pago aprobado se devuelve como `alreadyPaid`, sin otro cargo.
- Un rechazo explícito de tarjeta reconocido permite otro token usando el mismo
  registro de pago. No se liberan bloqueos por tiempo transcurrido.
- Una respuesta incierta, timeout, 3DS no resuelto o error no reconocido queda en
  `review`. La aplicación indica que no se debe volver a pagar.
- Un proceso dentro del backend revisa cada minuto hasta 20 pagos elegibles.
  Busca el cargo por su ID o por `payment_attempt` en metadata, paginando hasta
  1000 cargos. No depende de que el navegador siga abierto y nunca crea cargos.
- Después de siete días, un caso aún incierto requiere revisión operativa.
  La ausencia de un cargo en una consulta no desbloquea el pedido automáticamente.
- Los webhooks siguen deshabilitados. No se implementó un flujo nuevo de 3DS.

PagoEfectivo y billeteras conservan sus órdenes Culqi y la consulta existente de
estado. No se permite abrir otro medio de pago mientras haya uno preparado para
el mismo pedido. Un error incierto al crear una orden externa exige revisar esa
operación antes de reintentarlo; no se crea otra orden a ciegas.

## Despliegue

Despliega API y frontend juntos; un frontend antiguo espera siempre `culqiOrder.id`.
Antes de desplegar, conserva una copia de seguridad de MongoDB.

```sh
docker compose --env-file .env.production up -d --build api nginx
```

El inicio del API reemplaza el antiguo índice único de `culqiOrderId` por uno
único parcial: los IDs externos siguen siendo únicos y los pagos directos pueden
omitirlos. No elimina documentos. También espera que esté listo el índice único
de `checkoutKey` antes de aceptar tráfico. La migración es repetible; no ejecutes
la versión antigua del API simultáneamente con esta versión durante el cambio.

## Pruebas

```sh
# MongoDB de pruebas; la suite crea y elimina una base con nombre aleatorio.
PAYMENT_TEST_MONGO_URI=mongodb://127.0.0.1:27017 npm test --workspace=api
npm test --workspace=frontend
npm run build --workspace=frontend
npm run lint
```

CI levanta MongoDB para ejecutar las pruebas de concurrencia, migración de índice,
reintentos, rechazo, importes, permisos y recuperación de resultados inciertos.
Sin `PAYMENT_TEST_MONGO_URI`, esas pruebas de integración se omiten explícitamente.

Se verificó además una compra sandbox de S/ 10 con tarjeta y el checkout real:
`venta_exitosa`, pedido `paid`, pago `completed`, sin `culqiOrderId`.
La petición de token incluyó el encabezado RSA y el payload cifrado.
Las evidencias y credenciales de prueba están en `secrets/`, excluidas de Git.
