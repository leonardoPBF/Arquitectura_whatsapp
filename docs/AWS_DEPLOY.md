# Desplegar en AWS con 4 GB de RAM

Guía preparada el 01/11/2026 para una instancia nueva **Ubuntu 24.04 LTS,
x86_64 (amd64)**. Confirma la AMI y `uname -m` antes de ejecutar: estos comandos
no son para Amazon Linux ni para Graviton/ARM. El bot descarga Chrome para Linux
desde Puppeteer; no se ha validado este conjunto de imágenes en ARM.

Cuatro GB es un entorno ajustado para MongoDB, API, Rasa y Chrome simultáneos.
La configuración general recomienda 6–8 GB. No se ha medido todavía el consumo
en tu instancia: swap y arranque secuencial reducen picos, pero no garantizan
capacidad. Para producción continua, medir memoria/latencia y aumentar RAM o
mover Rasa a otra máquina si hay presión. No entrenar mientras atiendes usuarios.
Reservar aproximadamente 40 GB de disco como punto de partida para imágenes,
caché de builds, swap y datos; revisar el espacio real con `df -h`.

## 1. Acceso y red

En el Security Group permite TCP 22 **solo desde tu IP**. Para publicar con TLS,
permite 80 y 443. No abras 27017, 3000, 5005, 5055, 8080 ni 8081.
Los dos puertos de Nginx Docker quedan en loopback; más adelante un Nginx del
host termina HTTPS y reenvía a ellos. Mongo no publica puertos y actualmente
no tiene autenticación entre contenedores: no exponerlo ni compartir su red
con cargas no confiables.

Desde tu PC (sustituye clave e IP):

```powershell
ssh -i "C:\ruta\clave.pem" ubuntu@IP_PUBLICA
```

Los siguientes bloques se ejecutan **en Bash dentro de AWS**, desde una sesión
con permiso sudo. No se requiere Node, Python ni npm en el host.

## 2. Instalar Git, Docker Engine y Compose

Comprueba primero la plataforma:

```bash
cat /etc/os-release
uname -m
free -h
df -h /
```

Instalación mediante el [repositorio oficial de Docker para Ubuntu](https://docs.docker.com/engine/install/ubuntu/):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git nano
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

Usamos `sudo docker` sin agregar el usuario al grupo Docker.

## 3. Swap para amortiguar picos

Este bloque crea 4 GB **solo si todavía no hay swap ni `/swapfile`**. Necesita
espacio libre. Si ya existe swap, conserva su configuración.

```bash
if [ "$(swapon --show --noheadings | wc -l)" -eq 0 ] && [ ! -e /swapfile ]; then
  sudo fallocate -l 4G /swapfile &&
  sudo chmod 600 /swapfile &&
  sudo mkswap /swapfile &&
  sudo swapon /swapfile &&
  { grep -qE '^/swapfile[[:space:]]' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab; }
fi
swapon --show
free -h
```

## 4. Clonar y generar los nueve archivos de entorno

```bash
mkdir -p "$HOME/apps"
cd "$HOME/apps"
git clone https://github.com/leonardoPBF/Arquitectura_whatsapp.git
cd Arquitectura_whatsapp
git log -1 --oneline
sudo docker run --rm --user "$(id -u):$(id -g)" \
  -v "$PWD:/work" -w /work node:22-bookworm-slim node scripts/docker-setup.cjs
dc() { sudo docker compose --parallel 1 --env-file .env.production "$@"; }
dc config --quiet
```

Si el repositorio es privado, usa autenticación GitHub o una deploy key de solo
lectura. No pegues un token dentro de la URL de clone. La función `dc` debe
definirse nuevamente al abrir otra terminal, siempre desde la raíz del proyecto.

El generador crea secretos aleatorios y empareja API/bot/actions. Los archivos
reales `.env.production` no se suben a Git; el clone no copia tus datos, sesiones
de WhatsApp ni credenciales locales.

```bash
nano apps/api/.env.production
nano apps/whatsapp-bot/.env.production
nano apps/frontend/.env.production
```

Configura antes del build (ejemplo, sustituye los dominios):

| Archivo | Valores a revisar |
| --- | --- |
| Raíz `.env.production` | Mantener `HTTP_BIND=127.0.0.1`, `FRONTEND_PORT=8080`, `DOCS_PORT=8081` |
| API | `CORS_ORIGINS=https://app.tudominio.com,https://www.tudominio.com`, `LOCAL_LINK=https://app.tudominio.com/checkout`; credenciales Culqi si se usará |
| Bot | `LOCAL_LINK=https://app.tudominio.com/checkout`; conservar `WA_DIAGNOSTIC=true` hasta vincular |
| Frontend | `VITE_API_URL=` vacío; solo clave **pública** en `VITE_CULQI_PUBLIC_KEY` |

Mantén las direcciones internas `http://api:3000`, `http://rasa:5005` y
`mongodb://mongo:27017/lumina`. No reemplaces esos hosts por la IP pública.
Si aún no tienes dominio, usa inicialmente el túnel SSH del paso 6 y conserva
las URLs localhost; los enlaces de checkout no servirán desde teléfonos externos
hasta configurar una dirección pública HTTPS.

## 5. Construir y entrenar antes de arrancar servicios

En el primer despliegue, construye por servicio. `--parallel 1` limita las
operaciones de Compose, pero BuildKit aún puede paralelizar etapas internas.
Si se agota la memoria, construye las imágenes en otra máquina/CI o aumenta RAM;
no repitas indefinidamente un build que termina con código 137.

```bash
dc build api
dc build nginx
dc build whatsapp-bot
dc build rasa-actions
dc build rasa-train
dc run --rm --no-deps rasa-train
```

No continúes si falla algún comando. El último valida datos y entrena en el
volumen `rasa-models`, sin los otros servicios consumiendo RAM. Puede tardar
bastante con 4 GB. Para entrenamientos posteriores detén primero los servicios
durante una ventana de mantenimiento (`dc stop`) o entrena fuera del servidor.
El modelo y su huella se reutilizan al arrancar si los datos no cambiaron.

## 6. Arranque y comprobaciones

```bash
dc up -d --no-build --wait --wait-timeout 300 mongo api nginx
dc up -d --no-build --wait --wait-timeout 300 rasa-actions
dc up -d --no-build --wait --wait-timeout 900 rasa
dc ps -a
sudo docker stats --no-stream
curl -fsS http://127.0.0.1:8080/health/ready
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/api/orders
sudo docker run --rm --network host --user "$(id -u):$(id -g)" \
  -v "$PWD:/work:ro" -w /work node:22-bookworm-slim node scripts/docker-smoke.cjs
```

Readiness debe responder `ready`, órdenes sin token debe dar **401**, y el smoke
debe finalizar correctamente. `rasa-train` terminado con código 0 es normal.
El smoke básico no prueba pagos ni la conversación autenticada de Rasa.

Sin dominio, desde tu **PC** abre un túnel y mantenlo activo:

```powershell
ssh -i "C:\ruta\clave.pem" -N -L 8080:127.0.0.1:8080 -L 8081:127.0.0.1:8081 ubuntu@IP_PUBLICA
```

Abre `http://localhost:8080` y `http://localhost:8081` en tu PC. Esto permite
comprobar la web sin enviar contraseñas por HTTP público.

## 7. Publicar con dominio y HTTPS

Asigna DNS A de `app.tudominio.com` y `www.tudominio.com` a la IP pública estable
de la instancia. Espera la propagación. Esta sección usa Nginx **del host** como
terminación TLS; el Nginx de Docker sigue sirviendo las dos aplicaciones.

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/lumina
```

Contenido, sustituyendo ambos dominios:

```nginx
server {
    listen 80;
    server_name app.tudominio.com;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
server {
    listen 80;
    server_name www.tudominio.com;
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar, obtener certificados y comprobar renovación:

La emisión y la comprobación de renovación usan los comandos de
[Certbot para Nginx](https://certbot.eff.org/instructions?ws=nginx&os=pip).

```bash
sudo ln -sfn /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/lumina
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx --redirect -d app.tudominio.com -d www.tudominio.com
sudo certbot renew --dry-run
curl -fsS https://app.tudominio.com/health/ready
```

Usa únicamente dominios que controles y resuelvan a esta instancia. Los puertos
80/443 deben llegar al host para emitir y renovar los certificados.

## 8. Primer administrador y WhatsApp

Crear la primera cuenta sin escribir su contraseña en el historial de Bash:

```bash
read -r -p 'Email administrador: ' ADMIN_EMAIL
read -r -s -p 'Contraseña (12–72 caracteres): ' ADMIN_PASSWORD
echo
export ADMIN_EMAIL ADMIN_PASSWORD
sudo --preserve-env=ADMIN_EMAIL,ADMIN_PASSWORD docker compose --env-file .env.production \
  exec -T -e ADMIN_EMAIL -e ADMIN_PASSWORD api node dist/scripts/createAdmin.js
unset ADMIN_EMAIL ADMIN_PASSWORD
```

No sobrescribe una cuenta existente. Los secretos existen transitoriamente en
el entorno del proceso: utiliza una cuenta SSH confiable.

Detén cualquier otro bot que atienda ese mismo número. En AWS:

```bash
dc up -d --no-build whatsapp-bot
dc logs -f --tail=40 whatsapp-bot
```

Escanea el QR y espera `ready`. Ctrl+C sale de los logs, no detiene el bot.
Después cambia `WA_DIAGNOSTIC=false` en su `.env.production` y aplica:

```bash
dc up -d --no-build --no-deps whatsapp-bot
sudo docker stats --no-stream
free -h
```

La sesión Linux es nueva y queda en un volumen. No copies el perfil Chrome de
Windows. El chatbot administrativo es de solo consulta y el webhook Culqi sigue
bloqueado con 503 hasta verificar autenticidad; ver [SEGURIDAD_BOT.md](SEGURIDAD_BOT.md).
No considerar pagos automáticos listos solo porque la web responda.

## Operación y actualizaciones

```bash
dc logs --tail=100 api rasa rasa-actions
sudo docker system df
sudo docker stats --no-stream
free -h
```

Con 4 GB, actualizar durante una ventana de mantenimiento: respaldar primero,
`git pull --ff-only`, repetir generación de entornos (conserva existentes),
`dc stop`, construir servicios cambiados, entrenar si procede y repetir el
arranque/verificación. No usar `down -v`: borra datos, sesión y modelos.
Versionar releases y copiar backups fuera de la instancia antes de atender
clientes; tener un volumen Docker persistente no sustituye un respaldo.

## Estado de validación

Esta guía no implica que se haya accedido a tu cuenta AWS ni ejecutado comandos
en ella. Docker local no estaba disponible al preparar el despliegue; las
imágenes modificadas deben construirse y comprobarse con los pasos anteriores.
El 01/11/2026 pasaron las 22 pruebas API, las 14 pruebas de WhatsApp, los builds
de las cuatro aplicaciones y la validación de los nueve `.env.production`.
La CI tiene un check de lint con deuda previa: revisar su resultado en GitHub,
además de build, pruebas de autorización y smoke Docker.
