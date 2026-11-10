# Pagos con autenticación 3DS

El HTTP 200 de `/api/culqi/verify-payment` indica que se consultó el estado,
no que se haya cobrado. El pago solo termina cuando el backend valida el cargo
de Culqi y actualiza `Payment.status=completed` y `Order.paymentStatus=paid`.

## Flujo implementado

1. Checkout tokeniza la tarjeta; los datos de tarjeta no pasan por nuestra API.
2. Culqi3DS genera el dispositivo. El backend crea el intento con importe de BD.
3. Si Culqi responde `action_code=REVIEW` sin cargo o rechaza el intento con
   `decline_code=authentication_required` (`DNGE0116`), el pago pasa a
   `requires_action`, manteniendo bloqueado el pedido.
4. El navegador abre `Culqi3DS.initAuthentication` y recibe `parameters3DS`
   exclusivamente desde el origen de la tienda.
5. El backend permite una sola continuación atómica con el mismo token
   (verificado por hash), dispositivo e intento. Envía `authentication_3DS` a Culqi.
6. Solo evidencia de venta exitosa, importe, moneda y metadata coincidentes
   permite completar el pago. Un timeout conserva el bloqueo para conciliación.

La verificación ejecuta como máximo 24 consultas consecutivas, separadas por
cinco segundos después de cada respuesta, sin consultas simultáneas. Un Challenge
no inicia polling. Si se recarga la página, el botón de reinicio cancela únicamente
un `requires_action` no enviado; nunca desbloquea `processing` ni `review`.

## Registros anteriores

La versión anterior convertía también el requerimiento 3DS en `review` y no
persistía la respuesta original. Un registro antiguo `review` sin `transactionId`
no prueba por sí solo que no hubo cargo: debe conciliarse con Culqi antes de
habilitar otro intento. No cambiar manualmente el estado a pagado ni liberar
`paymentLock` basándose solamente en el tiempo transcurrido.

La conciliación puede liberar un intento antiguo sin fingerprint cuando Culqi
confirma una operación denegada, con importe, moneda y metadata coincidentes.
La denegación inicial por 3DS nunca libera una continuación autenticada incierta: puede
existir otro cargo del mismo intento. Se prioriza siempre evidencia de venta exitosa. Para validar
el flujo nuevo, utilizar un pedido nuevo y llaves de prueba correspondientes.

## Verificación y publicación

Las pruebas de cargos usan un proveedor simulado y una BD Mongo aislada. Nunca
usar tarjetas reales en pruebas automatizadas. La ejecución completa requiere
`PAYMENT_TEST_MONGO_URI` apuntando a una instancia de pruebas; el archivo de test
crea y elimina únicamente su propia base con nombre aleatorio.

```sh
npm test --workspace=api
npm test --workspace=frontend
npm run build:frontend
docker compose --env-file .env.production up -d --build --no-deps api nginx
```

El contenedor del checkout usa fondo transparente y `color-scheme: light` para
aislar el documento externo del tema oscuro del comercio. El formulario de Culqi
conserva sus colores propios; no se intenta modificar su DOM entre orígenes.

## Fuentes oficiales

- [Configuración Culqi3DS](https://docs.culqi.com/es/documentacion/culqi-3ds/v1/configuracion/)
- [Continuación del cargo con autenticación](https://docs.culqi.com/es/documentacion/culqi-3ds/v1/uso-libreria/)
- [Demo oficial: REVIEW y continuación con el mismo token](https://github.com/culqi/culqi-php-demo-checkoutv4-culqi3ds/blob/master/js/main.js)
- [Checkout v4](https://docs.culqi.com/es/documentacion/checkout/v4/): Culqi anuncia
  su retiro próximo y recomienda migrar a Checkout Custom. Esta corrección mantiene
  el tokenizador actual y completa su flujo 3DS; la migración es un cambio separado.
