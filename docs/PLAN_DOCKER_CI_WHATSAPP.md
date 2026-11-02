# Plan de Docker, CI y recuperación de WhatsApp

> Informe de la primera revisión. Actualización posterior del 24/10/2026: el
> usuario confirmó `authenticated` y `ready` con su teléfono. Ya se implementó
> Compose/Nginx y se corrigieron los bloqueos de build. Para el estado actual,
> comandos y alcance ver [DOCKER.md](DOCKER.md) y
> [WHATSAPP_CLOUD_API.md](WHATSAPP_CLOUD_API.md). Los pendientes y resultados que
> siguen describen el punto de partida, no el resultado de la segunda revisión.

Revisión: 24 de octubre de 2026. Monorepo npm con `api`, `frontend`, `docs` y
`whatsapp-bot`; Rasa es una aplicación Python separada. Este documento distingue
los cambios implementados de la infraestructura propuesta.

## 1. Diagnóstico del problema de vinculación

Síntoma confirmado por el usuario: aparece el QR, se escanea y el bot nunca llega
a estar conectado. Sin una nueva prueba con el teléfono no se puede confirmar
una causa única ni dar por resuelta la vinculación.

Hallazgos comprobados en el código original:

- Estaba instalada `whatsapp-web.js` 1.34.1, que cargaba Puppeteer 18.2.1. Agregar
  `puppeteer-core` 25 al workspace no reemplazaba ese Puppeteer interno.
- Los errores globales de protocolo y sesión se silenciaban, incluso durante el
  inicio; `initialize()` tampoco tenía manejo explícito del rechazo.
- `authTimeoutMs: 0` eliminaba el límite para esperar el selector de autenticación.
  Ese parámetro no garantiza que se emita `ready` después de escanear.
- La desconexión ponía `isRestarting = true` para cualquier motivo, pero solo
  reiniciaba en `LOGOUT`. El borrado manual de la sesión podía competir con
  `LocalAuth`, que ya gestiona su propia limpieza al cerrar sesión.
- La ruta relativa de autenticación cambiaba con el directorio de ejecución.
- La URL de catálogo/pedidos era fija; el `.env` del bot usaba `BACKEND_URL`, pero
  el servicio de autenticación solo consultaba `API_URL`.
- El entrypoint creaba una sesión vacía antes del manejador, impidiendo recuperar
  el carrito guardado para remitentes con la misma clave. Además se mezclaba el
  teléfono del contacto con `msg.from`, que puede ser un identificador `@lid`.

Implementado en esta revisión:

- `whatsapp-web.js` fijado en 1.34.7, con Puppeteer 24.38.0 resuelto en el lockfile;
  eliminada la dependencia directa de `puppeteer-core` que no usaba el cliente.
- Chrome compatible instalado en `.cache/puppeteer`; el doctor comprueba la ruta
  y puede verificar su arranque sin abrir WhatsApp.
- Configuración cargada antes de los servicios, rutas absolutas estables y caché
  de HTML desactivada. Se conserva la ruta de la sesión local existente.
- Registros de `qr`, `loading_screen`, `authenticated`, `ready`, fallo y desconexión.
- Límite de inicio de 5 minutos y de 2 minutos tras `authenticated`, configurables.
  Los eventos duplicados no prolongan indefinidamente los límites.
- Un solo cliente por proceso, cierre acotado y salida con código 1 ante fallos.
  En ejecución local se debe volver a arrancar; el supervisor Docker propuesto
  se encargará del reinicio con límite. No hay reconexión automática interna.
- Modo diagnóstico sin manejador de mensajes; resolución explícita de LID a
  teléfono y recuperación del carrito antes de actualizar la sesión en memoria.
- Pruebas con clientes simulados, sin QR, credenciales, pagos ni mensajes reales.

La versión 1.34.7 incluye una corrección de bloqueo al iniciar/autenticar según
las [notas oficiales](https://github.com/wwebjs/whatsapp-web.js/releases/tag/v1.34.7).
Esto justifica la actualización, pero no demuestra que fuera la única causa.

### Prueba manual de aceptación

Desde la raíz del repositorio, detener primero otras ejecuciones del bot que
usen la misma sesión. No ejecutar simultáneamente `run:all` y el diagnóstico.

```powershell
npm run doctor:whatsapp
npm run diagnose:whatsapp
```

Escanear el QR con WhatsApp → Dispositivos vinculados. Si una sesión válida ya
existe, puede conectar sin mostrar QR. El éxito es observar `authenticated` y
`ready`; escanear el QR no basta. El modo diagnóstico no responde mensajes.

Si se queda en `authenticated`, conservar el último estado y el mensaje del
timeout. Si nunca llega a `authenticated`, comprobar que el teléfono confirma
la vinculación y que WhatsApp Web puede vincularse en un navegador normal en
la misma red. Para ver el navegador, configurar `WA_HEADLESS=false` en el `.env`
del bot. No compartir QR, carpetas de sesión ni credenciales.

No borrar la sesión como primer intento. Si una prueba posterior demuestra que
el perfil está dañado, detener el bot y respaldar/renombrar su carpeta antes de
volver a vincular. Desvincular desde el teléfono cuando corresponda.

Después de observar `ready`, cerrar el diagnóstico con Ctrl+C y ejecutar:

```powershell
npm run prod:whatsapp
```

Prueba de negocio: desde **otro número**, enviar `menu`, consultar productos y
recuperar un carrito. Reiniciar el bot y verificar conexión sin nuevo QR y
persistencia del carrito. El bot usa el evento `message`, no responde a mensajes
enviados por el propio número vinculado ni atiende grupos/estados.

## 2. CI implementado y política de ramas propuesta

Archivo: `.github/workflows/ci.yml`.

| Evento | Validaciones | Publicación/despliegue |
| --- | --- | --- |
| PR con destino `dev` o `main` | `npm ci`, lint, build de las 4 apps Node y pruebas del bot | Ninguno |
| Push a `dev` o `main` | Las mismas validaciones | Ninguno |
| Ejecución manual | Las mismas validaciones | Ninguno |

Usa Node 22, caché npm, permisos de lectura y cancelación de ejecuciones antiguas
de la misma rama. La matriz mantiene visibles los resultados de cada app aunque
otra falle. No se descarga Chrome ni se vincula un teléfono en CI.
No se usa `pull_request_target` ni se necesitan secretos para estas pruebas.

Flujo propuesto: `codex/*` o `feature/*` → PR a `dev` → validación funcional en
staging → PR de `dev` a `main`. Hotfix: PR directo a `main` y posterior integración
en `dev`. No se han creado ramas ni modificado reglas del repositorio remoto.

Cuando los checks estén verdes, configurar reglas para `main` y `dev`: exigir PR,
al menos una revisión, conversaciones resueltas y los checks `Lint`, los cuatro
`Build (...)` y `WhatsApp lifecycle tests`. Bloquear force-push y borrado de ramas.
El YAML ejecuta validaciones; por sí solo no impide que alguien haga merge.

### Bloqueos actuales antes de exigir CI verde

El workflow registra fallos reales: **todavía no es una línea base verde del
monorepo**. No se agregaron `continue-on-error` ni exclusiones para esconderlos.

| Área | Evidencia local previa a los cambios funcionales del bot | Trabajo pendiente |
| --- | --- | --- |
| API | `culqi.controller.ts`: `amount` numérico incompatible con tipos del SDK y `phone_number` no reconocido; `orders.controller.ts`: `_id` de tipo `unknown` | Revisar contratos del SDK/modelo; corregir con pruebas de pagos simulados |
| Frontend | Campos `phone` y `alreadyPaid` ausentes en interfaces; categorías `unknown`; `percent` opcional; imports/variables sin usar | Alinear contratos con API y corregir errores de TypeScript |
| Landing `docs` | Import `Sparkles` sin usar en `Navbar.tsx` | Ajustar el import sin alterar cambios visuales existentes |
| Lint | Reglas de comillas/tipos/variables incumplidas; antes recorría también `venv` | Ya excluidos venv, cachés y compilados; queda sanear el código fuente |
| Rasa | Sin manifiesto reproducible de dependencias Python | Fijar versiones y añadir validación de datos/acciones |

Los scripts raíz que apuntaban al workspace inexistente `backend` ahora usan
`api`; se añadieron accesos a build, pruebas, doctor y diagnóstico del bot.
Los comandos antiguos `preview:*` no forman parte de este CI.

## 3. Docker propuesto: servicios y comunicaciones

**Dockerfiles y Compose quedan como siguiente fase de implementación**, después
de resolver los builds. El CLI de Docker está instalado en este equipo, pero
el motor Linux de Docker Desktop no estaba disponible durante la revisión.
No se construyeron ni iniciaron contenedores.

| Servicio | Imagen/proceso propuesto | Persistencia | Exposición |
| --- | --- | --- | --- |
| `mongo` | MongoDB con versión fijada y healthcheck | Volumen `mongo-data` | Solo red interna; puerto local opcional para desarrollo |
| `api` | Node 22, build multietapa, `node dist/server.js` | Datos en MongoDB | 3000 interno, detrás de proxy en producción |
| `whatsapp-bot` | Node 22 + Chrome compatible con el Puppeteer del lockfile | Volumen exclusivo `whatsapp-auth` | Sin puerto público; QR en terminal de operador |
| `frontend` | Build Vite y servidor estático Nginx | Ninguna | HTTP local; HTTPS en producción |
| `docs` | Build Vite y Nginx, perfil opcional `marketing` | Ninguna | HTTP/HTTPS |
| `rasa` | Python/Rasa con versiones verificadas y fijadas | Modelo entrenado versionado como artefacto | 5005 interno |
| `rasa-actions` | Rasa SDK + requests, imagen separada | Ninguna | 5055 interno |

Separar `rasa` y `rasa-actions`; las acciones actuales llaman a la API por HTTP,
no acceden directamente a MongoDB. No usar la descripción del README como sustituto
de este comportamiento observado en `actions.py`.

Variables/conexiones necesarias:

- API: `MONGO_URI=mongodb://mongo:27017/lumina`, `PORT=3000`, secretos JWT/Culqi y
  `RASA_URL=http://rasa:5005`. La URL de Rasa sigue fija en el controlador: parametrizarla.
- Bot: `API_URL=http://api:3000`, `WA_AUTH_PATH=/data/whatsapp`, ejecutable Chrome
  explícito y volumen montado en `/data/whatsapp` con permisos del usuario del bot.
- Actions: sustituir `API_BASE_URL` fijo por configuración `http://api:3000/api`.
- Rasa: sustituir `localhost:5055` de endpoints por `http://rasa-actions:5055/webhook`.
- Frontend: `VITE_API_URL` debe ser accesible desde el navegador del usuario
  (por ejemplo `http://localhost:3000` en local), no `http://api:3000`.
  Las variables Vite son de build; solo incluir valores públicos.
- `LOCAL_LINK`: URL pública del checkout, alcanzable desde el teléfono; `localhost`
  en un enlace de WhatsApp apunta al teléfono del cliente.
- CORS: parametrizar orígenes de frontend/landing; hoy solo admite puertos locales
  concretos. Culqi webhooks requieren URL pública HTTPS y prueba en sandbox.

### Orden de implementación y criterios de aceptación

1. **Sanear builds y configuración.** Corregir la tabla de bloqueos, agregar
   `.env.example` a API/frontend, fijar dependencias Python y definir la versión
   de MongoDB compatible. Salida: `npm ci`, lint, builds y pruebas en verde.
2. **API + MongoDB.** Dockerfile multietapa con lockfile raíz y manifests de los
   workspaces; runtime con dependencias de producción y usuario no root. Agregar
   `/health/live` y `/health/ready` (esta última comprueba MongoDB). Compose usa
   `depends_on: condition: service_healthy`. No arrancar con `npm run dev` ni
   recompilar al iniciar. Salida: endpoint listo y datos preservados al recrear.
3. **Bot.** Imagen con bibliotecas del sistema y el Chrome correspondiente a
   Puppeteer, `init: true`, `shm_size: 1gb`, cierre SIGTERM y período de gracia
   mayor que los 10 segundos de cierre. Una réplica por número/volumen, sin
   compartir sesión con Windows ni entre staging y producción. Empezar con
   `restart: "on-failure:5"`; alertar al agotar reintentos. Mantener sandbox de
   Chrome si el host lo permite; `WA_NO_SANDBOX` es una excepción explícita.
   Salida: QR → ready; recreación del contenedor sin otro QR; fallo visible al
   desconectar y ausencia de navegadores/procesos duplicados.
4. **Frontend y landing.** Nginx con fallback SPA (`try_files ... /index.html`),
   variables públicas al compilar y proxy/orígenes correctos. Salida: rutas al
   recargar, login, catálogo y acceso al backend desde un navegador externo.
5. **Rasa opcional.** Perfil `ai`, modelo entrenado fuera del arranque y montado
   en modo lectura; validar datos y tests de acciones sin servicios reales.
   Salida: consulta desde frontend → API → Rasa → actions → API.
6. **Extender CI a imágenes.** En PR: `docker compose config --quiet`, build de
   imágenes y smoke API/Mongo con datos de prueba. No arrancar el bot real ni
   conectar Culqi/WhatsApp. Añadir escaneo de imágenes/dependencias y política
   explícita para vulnerabilidades; luego publicar imágenes etiquetadas por SHA
   únicamente tras push confiable. Fijar imágenes base por digest al estabilizarlas.
7. **CD separado.** `dev` a staging; `main` a producción con environment protegido,
   aprobación y rollback al SHA anterior. Sesiones, DB y credenciales separadas.
   Copias de seguridad de Mongo y prueba de restauración antes del despliegue.

`.dockerignore` deberá excluir `.git`, `.env*` (salvo ejemplos), node_modules,
dist locales, venv, cachés, sesiones WhatsApp, modelos locales y exportaciones CSV.
Construir desde la raíz del monorepo usando el lockfile raíz; revisar los lockfiles
anidados y retirar los redundantes en una tarea independiente.

Un contenedor en ejecución no implica que WhatsApp esté listo. Si se agrega un
healthcheck del bot, distinguir espera de QR, `authenticated`, `ready` y fallo;
no reiniciar continuamente un bot que aún espera el escaneo humano. Los healthchecks
de Compose por sí solos no reinician un contenedor marcado como unhealthy.

## 4. Resultado de validación local

- Build TypeScript del bot: correcto.
- Pruebas: 14 aprobadas (ciclo de conexión, LID y recuperación del carrito).
- Lint de los nuevos módulos TypeScript de configuración, arranque, ciclo de
  conexión y resolución del teléfono: correcto.
- Doctor: encuentra el Chrome esperado; prueba headless en perfil temporal
  inicia y cierra Chrome 146.0.7680.31 correctamente, sin abrir la sesión WhatsApp.
- YAML del workflow parseado; dependencias de los manifests raíz/bot coinciden
  con el lockfile. No se ha ejecutado todavía un `npm ci` limpio ni CI en GitHub.
- Builds de API/frontend/docs y lint global: bloqueos descritos en la sección 2.
- Vinculación del teléfono: pendiente de prueba manual; no confirmada.
- Docker: plan preparado, sin imágenes construidas ni despliegue.

## Referencias

- [Autenticación y persistencia de LocalAuth](https://wwebjs.dev/guide/creating-your-bot/authentication.html)
- [Opciones y eventos del cliente](https://docs.wwebjs.dev/Client.html)
- [Filtros y sintaxis de GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Orden de arranque y healthchecks de Compose](https://docs.docker.com/compose/how-tos/startup-order/)
