# Amazon Linux 2023 ARM64: preparación y despliegue

Esta es la guía para la instancia indicada por el usuario: **Amazon Linux 2023,
ARM64, 4 GB RAM**. No usar los comandos `apt` de la guía de Ubuntu. El usuario SSH
habitual de esta AMI es `ec2-user`. ARM es la arquitectura del procesador, no una
distribución de Linux. El host ejecuta Amazon Linux y cada contenedor conserva
sus propias dependencias; no necesitas instalar Ubuntu en el servidor.

## Preparar desde la consola

Desde tu PC, reemplaza clave e IP:

```powershell
ssh -i "C:\ruta\clave.pem" ec2-user@IP_PUBLICA
```

En Bash dentro de AWS:

```bash
cat /etc/os-release
uname -m
free -h
df -h /
sudo dnf install -y git
mkdir -p "$HOME/apps"
cd "$HOME/apps"
git clone https://github.com/leonardoPBF/Arquitectura_whatsapp.git
cd Arquitectura_whatsapp
bash scripts/al2023-setup.sh
```

Si ya clonaste, entra al repositorio y ejecuta `git pull --ff-only` antes del
script. Si es privado, usa autenticación GitHub o una deploy key; no guardes un
token en la URL. El script valida AL2023/aarch64, instala Docker, Compose y Buildx
ARM64 y comprueba SHA256 de los plugins antes de instalarlos. Usa `sudo docker`,
sin modificar grupos del usuario, iniciar el bot ni generar cuentas.

Las instrucciones de Docker se basan en [AWS para AL2023](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-container-image.html)
y la [instalación manual de plugins de Docker](https://docs.docker.com/compose/install/linux/).
Los plugins están fijados a versiones concretas; no se actualizan con `dnf`.

## Memoria y disco

Cuatro GB es ajustado para el conjunto. Reserva espacio para imágenes, builds,
datos y swap (40 GB de disco es un punto de partida, no una medición de tu carga).
Puedes añadir 4 GB de swap si no existe ya; evita entrenar con los servicios
atendiendo usuarios. Swap no sustituye RAM y puede hacer muy lento el proceso.

```bash
if [ "$(swapon --show --noheadings | wc -l)" -eq 0 ] && [ ! -e /swapfile ]; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress &&
  sudo chmod 600 /swapfile &&
  sudo mkswap /swapfile &&
  sudo swapon /swapfile &&
  { grep -qE '^/swapfile[[:space:]]' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab; }
fi
swapon --show
free -h
```

## Generar y revisar entornos

Desde la raíz del repositorio:

```bash
sudo docker run --rm --user "$(id -u):$(id -g)" \
  -v "$PWD:/work" -w /work node:22-bookworm-slim node scripts/docker-setup.cjs
dc() { sudo docker compose --parallel 1 --env-file .env.production "$@"; }
dc config --quiet
nano apps/api/.env.production
nano apps/whatsapp-bot/.env.production
nano apps/frontend/.env.production
```

Se crean nueve `.env.production`, incluyendo secretos nuevos emparejados entre
servicios. No necesitas Node/npm en el host. Conserva `HTTP_BIND=127.0.0.1` en el
archivo raíz y las URLs internas `http://api:3000`, `http://rasa:5005` y
`mongodb://mongo:27017/lumina`.

Antes de publicar, configura `LOCAL_LINK=https://TU_DOMINIO/checkout` en API/bot,
`CORS_ORIGINS` en API y las credenciales reales de Culqi si usarás pagos.
`VITE_API_URL` queda vacío para usar `/api`; únicamente la clave pública de Culqi
va en `VITE_CULQI_PUBLIC_KEY`. Conserva `WA_DIAGNOSTIC=true` hasta vincular.
Si aún no hay dominio, prueba con el túnel SSH descrito abajo y los valores
localhost iniciales. Esos enlaces no sirven para checkout desde un teléfono externo.

## Construir sin emular x86

Docker selecciona imágenes ARM64 nativas. No agregar `platform: linux/amd64`.
Las imágenes base de Node, Mongo, Nginx y Rasa 3.6.21 publican ARM64.
Las acciones instalan el mismo SDK 3.6.2 sobre Python 3.10 multiarch, porque la
imagen upstream del SDK era solo amd64. El bot usa Chromium de Debian en ARM64;
en amd64 conserva Chrome de Puppeteer. No instala un escritorio en Amazon Linux.

Ejecuta cada comando y continúa solo si termina correctamente:

```bash
dc build api
dc build nginx
dc build whatsapp-bot
dc build rasa-actions
dc build rasa-train
dc run --rm --no-deps whatsapp-bot node scripts/doctor.cjs --launch
dc run --rm --no-deps -v "$PWD/apps/rasa-chatbot/tests:/tests:ro" \
  --entrypoint python rasa-actions -m unittest discover -s /tests -p '*_test.py'
dc run --rm --no-deps rasa-train
```

El doctor inicia y cierra el navegador sin vincular ni enviar mensajes. El trainer
valida datos y persiste el modelo. `--parallel 1` limita Compose, pero BuildKit
puede paralelizar etapas internas. Si un proceso termina con 137 o hay OOM,
construye/entrena en otra máquina compatible o aumenta memoria; no repitas el
mismo despliegue bajo presión de memoria. El arranque reutiliza un modelo vigente.

## Arrancar y probar

```bash
dc up -d --no-build --wait --wait-timeout 300 mongo api nginx
dc up -d --no-build --wait --wait-timeout 300 rasa-actions
dc up -d --no-build --wait --wait-timeout 900 rasa
dc ps -a
sudo docker stats --no-stream
sudo docker run --rm --network host --user "$(id -u):$(id -g)" \
  -v "$PWD:/work:ro" -w /work node:22-bookworm-slim node scripts/docker-smoke.cjs
```

Los servicios deben quedar saludables; `rasa-train` terminado con 0 es normal.
El smoke verifica web/API y rechazo de acceso anónimo a datos privados; no cobra
pagos ni valida una sesión WhatsApp real. El catálogo empieza vacío en una base
nueva: el clone no trae datos ni sesiones locales.

En el Security Group permite SSH 22 solo desde tu IP. No abras Mongo, API, Rasa
ni los puertos 8080/8081. Desde tu PC, mantén este túnel activo:

```powershell
ssh -i "C:\ruta\clave.pem" -N -L 8080:127.0.0.1:8080 -L 8081:127.0.0.1:8081 ec2-user@IP_PUBLICA
```

Visita `http://localhost:8080` y `http://localhost:8081` en tu PC. Para acceso
público falta configurar dominio y terminación HTTPS (proxy o balanceador);
no enviar sesiones/contraseñas por HTTP público. La guía Ubuntu tiene rutas de
configuración Nginx propias de esa distribución: no copiar sus comandos `apt`
ni `sites-available` a AL2023.

## Administrador y vinculación

En AWS, desde la raíz y con la API saludable:

```bash
read -r -p 'Email administrador: ' ADMIN_EMAIL
read -r -s -p 'Contraseña (12–72 caracteres): ' ADMIN_PASSWORD
echo
export ADMIN_EMAIL ADMIN_PASSWORD
sudo --preserve-env=ADMIN_EMAIL,ADMIN_PASSWORD docker compose --env-file .env.production \
  exec -T -e ADMIN_EMAIL -e ADMIN_PASSWORD api node dist/scripts/createAdmin.js
unset ADMIN_EMAIL ADMIN_PASSWORD
```

La contraseña no queda en el historial, pero se entrega transitoriamente por
entorno. No modifica cuentas existentes. Detén el bot local antes de iniciar
otra instancia para ese número:

```bash
dc up -d --no-build whatsapp-bot
dc logs -f --tail=40 whatsapp-bot
```

Escanea el QR y espera `ready`; Ctrl+C sale de los logs. Para habilitar respuestas,
cambia `WA_DIAGNOSTIC=false` en `apps/whatsapp-bot/.env.production` y recrea:

```bash
dc up -d --no-build --no-deps whatsapp-bot
sudo docker stats --no-stream
free -h
```

No usar `down -v`: elimina datos, modelo y sesión. Define respaldos fuera de la
instancia antes de atender clientes. El chatbot es de solo consulta y el webhook
Culqi permanece bloqueado hasta verificar autenticidad; ver [seguridad](SEGURIDAD_BOT.md).

## Qué se verifica

La CI construye y ejecuta smoke en amd64 y ARM64, incluyendo el lanzamiento del
navegador y pruebas de las acciones. Su resultado debe revisarse antes del deploy;
agregar el job no significa que haya pasado. La vinculación real, el rendimiento
con 4 GB y la publicación HTTPS deben verificarse en tu instancia. No se ha
accedido a tu cuenta AWS desde este chat.
