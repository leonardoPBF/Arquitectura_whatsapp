# Controles de seguridad del chatbot y su API

Implementación: 26/10/2026. Complementa los hallazgos de `AUDITORIA_RASA.md`.

## Acceso y alcance

La API verifica un JWT HS256 y consulta el usuario activo en Mongo. El rol del token
no concede permisos: se utiliza el rol actual de la cuenta. `JWT_SECRET` debe tener
al menos 32 caracteres y la API falla al arrancar si falta o conserva el valor débil
anterior. `docker:setup` genera las credenciales necesarias sin imprimirlas.

| Identidad | Acceso |
| --- | --- |
| Visitante | Registro de cliente, login y catálogo público |
| Cliente autenticado | Sus órdenes/pagos; crear pedidos; editar dirección/notas de una orden propia pendiente y sin pagar; cancelar según las reglas de estado |
| Administrador activo | Dashboard y chatbot administrativo; gestión explícita de estados, sin borrado físico de órdenes |
| Servicio Rasa | GET de órdenes, clientes, productos y pagos; sin escrituras, registro ni acceso al chatbot administrativo |
| Servicio WhatsApp | Lecturas y operaciones concretas del flujo de venta: cliente, conversación/carrito, creación de orden y checkout; sin administración de usuarios ni modificación del estado de pago |

El middleware deniega rutas privadas nuevas para clientes/servicios hasta agregar
un permiso explícito. Las colecciones de órdenes/pagos de clientes se filtran en
servidor; los detalles y operaciones verifican la propiedad del recurso. Sheets y
conversaciones no son públicos. Las rutas de Culqi para consultar o pagar exigen
acceso al pago/orden correspondiente.

## Cambios visibles

- El chatbot del dashboard es de **solo consulta**. Cancelar o actualizar estados
  por lenguaje natural devuelve una indicación para usar la gestión autenticada.
  La credencial de Rasa tampoco puede escribir directamente en la API.
- Las órdenes se cancelan cambiando su estado, nunca eliminándolas. La API aplica
  una lista de transiciones y compara estado/pago al escribir para detectar cambios
  concurrentes. Repetir el mismo estado no duplica el efecto. Los pagos requieren
  gestión de reembolso antes de cancelar; no se implementan reembolsos automáticos.
- Un cliente solo puede editar dirección/notas cuando su orden está pendiente y
  sin pagar. Se rechazan cambios de importe, propietario o pago mediante PUT genérico.
- El importe del cargo proviene del pago guardado; se rechaza un importe diferente
  enviado por el navegador. Esto no sustituye una revisión completa de concurrencia
  e idempotencia de la integración de pagos.
- El registro público ya no permite `role: admin` ni vincularse a un cliente existente
  simplemente con su teléfono. Requiere teléfono y contraseña de 12–72 caracteres.
  Cuentas antiguas sin `customerId` requieren revisión/vinculación administrativa;
  no se asignan datos ajenos automáticamente.
- `create-admin` por HTTP requiere administrador. Para la primera cuenta se usa
  `apps/api/src/scripts/createAdmin.ts` con `ADMIN_EMAIL`, `ADMIN_PASSWORD` y
  opcionalmente `ADMIN_NAME` en el entorno del proceso. Se eliminaron las credenciales
  fijas y su impresión en consola. No se creó ni modificó ninguna cuenta real durante los tests.

## Sesiones y límites

El navegador ya no envía `admin_user`. El backend construye el sender con usuario,
huella HMAC del token y un identificador de conversación. Ignora sender, roles y
metadata enviados por el navegador. Los nuevos tokens tienen `jti` aleatorio;
limpiar el chat inicia una conversación nueva. Los slots de Rasa no se arrastran
entre sesiones.

El mensaje admite hasta 2000 caracteres; la API limita el JSON a 64 KB y el chatbot
a 30 solicitudes/minuto por usuario. Las rutas de autenticación tienen un límite
por IP de 40 solicitudes/15 minutos. No se confía en un `X-Forwarded-For` arbitrario:
tras Nginx ese límite es compartido por la IP del proxy. Ajustar una cadena de proxy
confiable y un almacén compartido antes de escalar a varias réplicas.

Los tokens de usuario expiran a los siete días. Cerrar sesión en el navegador elimina
su copia, pero no revoca una copia robada: la revocación individual de JWT y recuperación
de cuentas siguen siendo mejoras pendientes. Desactivar la cuenta en Mongo sí bloquea
sus siguientes solicitudes. Revisar administradores existentes, ya que antes podían
crearse públicamente; no se eliminan cuentas automáticamente.

Rasa utiliza un cliente HTTP de solo lectura con timeout de conexión/lectura de
2/5 segundos, sin redirecciones, URL/ruta permitida y respuesta máxima de 2 MB.
Las excepciones internas y mensajes completos del chatbot ya no se devuelven ni
se registran desde su controlador. Los listados grandes aún necesitan paginación
y agregaciones; alcanzar el límite produce un error controlado, no datos truncados.

## Credenciales de servicios

| Variable | Archivos que deben compartir el mismo valor |
| --- | --- |
| `RASA_ACTIONS_TOKEN` | `apps/api/.env.production`, `apps/rasa-chatbot/actions/.env.production` |
| `WA_SERVICE_TOKEN` | `apps/api/.env.production`, `apps/whatsapp-bot/.env.production` |

`npm run docker:setup` genera los valores que falten y conserva los existentes.
Falla si detecta pares diferentes o demasiado cortos. Se envían internamente mediante
`x-service-token`; nunca van al frontend ni se incluyen en las imágenes. Rotarlos
requiere actualizar ambos extremos y recrear los contenedores correspondientes.
Para desarrollo fuera de Docker, configurar también esos pares en el entorno local
de API/bot/actions; las variables Docker usan nombres de host internos.

Estas credenciales identifican procesos confiables, no usuarios finales. Rasa sirve
solo al dashboard administrativo autenticado. No conectar el endpoint de Rasa
directamente al público ni reutilizar sus permisos para atender clientes de WhatsApp.

## Webhook Culqi

**El webhook previo queda bloqueado con HTTP 503.** Aceptaba cambios de estado
financiero basándose únicamente en el cuerpo del evento. No se ha inventado un
esquema de firma ni se aceptan eventos sin verificar al proveedor.

Siguen disponibles las operaciones autenticadas de verificación/sincronización que
consultan a Culqi. Para restablecer notificaciones automáticas falta implementar y
probar la autenticidad del evento, reconciliación con datos del proveedor, control
de repetición e idempotencia. No se realizaron cobros ni pruebas de pago reales.

## Verificación y ejecución

```powershell
npm run docker:validate
npm test --workspace=api
npm run test:whatsapp
docker compose --env-file .env.production build
docker compose --env-file .env.production run --rm --no-deps -v "${PWD}/apps/rasa-chatbot/tests:/tests:ro" --entrypoint python rasa-actions -m unittest discover -s /tests -p '*_test.py'
docker compose --env-file .env.production up -d --no-build mongo api nginx rasa-actions rasa
node scripts/docker-smoke.cjs
```

El smoke público comprueba las SPA/API y que órdenes/clientes/pagos sin credenciales
devuelvan 401. `--rasa` requiere `SMOKE_ADMIN_TOKEN` con una sesión administrativa
válida, entregado por variable de entorno y no guardado en el repositorio.

CI ejecuta pruebas de autorización API y pruebas Python de acciones además del build.
Los tests de API usan Mongo y HTTP de proveedores simulados; no requieren credenciales
de clientes ni mutan la base real. El lint histórico del repositorio conserva deuda
anterior y no equivale a que todos los checks de CI estén verdes.
