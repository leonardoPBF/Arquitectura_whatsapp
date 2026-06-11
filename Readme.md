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
