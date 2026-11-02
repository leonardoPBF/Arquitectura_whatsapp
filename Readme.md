# Docker, CI y diagnóstico de WhatsApp

- [Ejecutar todas las aplicaciones con Docker y Nginx](docs/DOCKER.md)
- [Desplegar en AWS: Ubuntu, 4 GB, HTTPS y arranque por etapas](docs/AWS_DEPLOY.md)
- [Controles de seguridad y cambios de acceso](docs/SEGURIDAD_BOT.md)
- [Compatibilidad y migración a la API oficial de WhatsApp](docs/WHATSAPP_CLOUD_API.md)

Ver [el plan de implementación y los hallazgos](docs/PLAN_DOCKER_CI_WHATSAPP.md).
Para comprobar el entorno: `npm run doctor:whatsapp`. Para vincular sin respuestas
automáticas: `npm run diagnose:whatsapp` (detener antes otras instancias del bot).

# ============================================
# CONFIGURACIÓN INICIAL
# ============================================

## Seed de Base de Datos
npx ts-node apps/api/src/scripts/seed.ts

## Configuración de Python y Rasa
python -m venv venv
.\venv\Scripts\activate
pip install rasa
python --version -> 3.10.11

# ============================================
# RASa CHATBOT
# ============================================

cd apps/rasa-chatbot

## PRIMERA VEZ: Entrenar modelo
rasa train

## Iniciar Rasa (2 terminales necesarias):

### Terminal 1: Action Server
rasa run actions

### Terminal 2: Rasa Server con API
rasa run --enable-api --cors "*" --debug

## O usar los scripts de ayuda:
# Entrenar e iniciar todo:
.\train-and-start.bat

# Solo iniciar (si ya está entrenado):
.\start-rasa.bat

# ============================================
# NOTAS IMPORTANTES
# ============================================
# - El idioma está configurado como "es" (español)
# - Si cambias el idioma en config.yml, debes re-entrenar: rasa train
# - El Action Server debe estar corriendo antes del Rasa Server
# - Verifica que ambos servidores estén activos:
#   - Rasa API: http://localhost:5005
#   - Actions: http://localhost:5055
