@echo off
echo ========================================
echo Iniciando Rasa Chatbot Server
echo ========================================
echo.

REM Verificar que existe un modelo
if not exist "models\*.tar.gz" (
    echo [ERROR] No se encontraron modelos entrenados.
    echo Por favor, ejecuta primero: rasa train
    pause
    exit /b 1
)

echo [1/2] Iniciando Action Server...
start "Rasa Actions" cmd /k "rasa run actions"
timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Rasa Server con API...
echo.
echo Servidor disponible en: http://localhost:5005
echo Action Server disponible en: http://localhost:5055
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

rasa run --enable-api --cors "*" --debug

