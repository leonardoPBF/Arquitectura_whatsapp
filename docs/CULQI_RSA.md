# Culqi RSA

El flujo de tarjeta ahora usa cargos directos, sin una orden externa adicional.
Consulta [Pagos directos y reintentos](PAGOS_DIRECTOS.md) para desplegar API y
frontend juntos y conocer la conciliación en segundo plano.

El checkout utiliza `VITE_CULQI_RSA_ID` (el ID/hash de CulqiPanel) y
`VITE_CULQI_RSA_PUBLIC_KEY` (el PEM público completo). Reemplazan los nombres
`RSA_hash` y `RSA_kEY`, que Vite no expone al navegador.

Configura ambos en `apps/frontend/.env` para desarrollo y en
`apps/frontend/.env.production` para Docker. La clave PEM debe ir entre comillas,
con `\n` entre sus líneas. Nunca coloques una clave privada en variables `VITE_*`.
No regeneres RSA localmente: la clave pública y su ID deben corresponder a la
misma pareja registrada en CulqiPanel y al entorno de las llaves API.

El SDK recibe los parámetros oficiales `xculqirsaid` y `rsapublickey` al abrir
el checkout. Si falta la pareja o el formato es incorrecto, no se abre.
Los enlaces de checkout alojados por Culqi solo aceptan HTTPS y dominios Culqi;
su cifrado lo administra el proveedor, no estas opciones del SDK embebido.

Después de cambiar variables públicas reconstruye Nginx:

```sh
docker compose --env-file .env.production up -d --build nginx
```

Pruebas locales:

```sh
npm test --workspace=frontend
npm test --workspace=api
npm run build --workspace=frontend
npm run lint
node scripts/docker-env-check.cjs
```

Las pruebas unitarias no realizan cobros. Una prueba contra Culqi debe utilizar
llaves `pk_test_`/`sk_test_` y las tarjetas publicadas por Culqi. RSA no sustituye
HTTPS, autenticación, validación de importes ni el flujo 3DS que pueda exigir el
emisor. Culqi anuncia la retirada futura de Checkout v4; migrar a Checkout Custom
requiere una tarea adicional.

Referencias:
- https://docs.culqi.com/es/documentacion/checkout/v4
- https://docs.culqi.com/es/documentacion/pagos-online/llaves_rsa
- https://docs.culqi.com/es/documentacion/pagos-online/tarjetas-de-prueba

## Verificación realizada (2026-11-08)

Se creó una cuenta cliente `review@culqi.com` en una base local aislada
`culqi_rsa_test`, se comprobó el inicio de sesión y se creó un pedido de S/ 10.
Se introdujo la tarjeta Visa de prueba oficial en el iframe real de Culqi,
desde el checkout de la aplicación con las variables RSA configuradas.
El proveedor confirmó `venta_exitosa` (verificado también consultando el cargo);
el pago quedó `completed` y el pedido `confirmed` / `paid`.
Al volver al checkout, la aplicación redirigió a `/success` y mostró S/ 10 pagados.
No se efectuó un cobro real ni se creó una cuenta en Lightsail.

Las credenciales y evidencias locales están en `secrets/culqi-test-account.json`,
`secrets/culqi-test-result.json` y `secrets/culqi-success-test.png`, excluidos de Git.
El observador inicial del navegador falló al intentar leer el cuerpo de una
respuesta CORS OPTIONS; se corrigió para observar únicamente POST y se verificó
el cargo existente sin repetirlo.

También pasaron 3 pruebas de configuración/URL, 22 pruebas del backend,
la compilación del frontend y la validación de entornos Docker.
Lint conserva las 150 advertencias existentes y no presenta errores.
La prueba comprueba el flujo positivo con tarjeta sandbox; no certifica 3DS,
reembolsos, concurrencia de cobros ni habilitación de la cuenta para producción.
