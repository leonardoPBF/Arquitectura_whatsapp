@echo off
echo ========================================
echo Entrenando y Iniciando Rasa Chatbot
echo ========================================
echo.

echo [1/3] Entrenando modelo de Rasa...
rasa train

if errorlevel 1 (
    echo [ERROR] Fallo al entrenar el modelo
    pause
    exit /b 1
)

echo.
echo [2/3] Iniciando Action Server...
start "Rasa Actions" cmd /k "rasa run actions"
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Iniciando Rasa Server con API...
echo.
echo Servidor disponible en: http://localhost:5005
echo Action Server disponible en: http://localhost:5055
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

rasa run --enable-api --cors "*" --debug

