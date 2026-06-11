# 🔧 Solución Error 500 en Chatbot

## Problema Identificado

El error 500 ocurre porque:
1. **Modelo desactualizado**: Rasa está cargando un modelo entrenado con `language: en` (inglés) pero el `config.yml` ahora está configurado con `language: es` (español).
2. **Incompatibilidad de idioma**: El modelo no puede procesar mensajes en español correctamente.

## Solución

### Paso 1: Detener Rasa
Detén los procesos de Rasa que están corriendo (Action Server y Rasa Server).

### Paso 2: Re-entrenar el Modelo

```bash
cd apps/rasa-chatbot

# Activar entorno virtual (si es necesario)
..\..\venv\Scripts\activate

# Entrenar el modelo con el idioma español
rasa train
```

Esto creará un nuevo modelo entrenado con español.

### Paso 3: Iniciar Rasa Correctamente

**Terminal 1 - Action Server:**
```bash
cd apps/rasa-chatbot
rasa run actions
```

**Terminal 2 - Rasa Server:**
```bash
cd apps/rasa-chatbot
rasa run --enable-api --cors "*" --debug
```

O usar el script automático:
```bash
cd apps/rasa-chatbot
.\train-and-start.bat
```

### Paso 4: Verificar que Funciona

1. Verifica en los logs de Rasa que el modelo se cargó correctamente:
   ```
   Loading model models\20251113-XXXXX-XXXXX.tar.gz...
   ```

2. Prueba el chatbot desde el frontend.

## Cambios Realizados

### 1. `config.yml`
- ✅ Cambiado `language: en` → `language: es`

### 2. `chatbot.controller.ts`
- ✅ Mejorado manejo de errores con logs detallados
- ✅ Agregado timeout de 30 segundos
- ✅ Validación de campos requeridos
- ✅ Manejo de diferentes formatos de respuesta
- ✅ Mensajes de error más descriptivos

### 3. Scripts de Ayuda
- ✅ `train-and-start.bat`: Entrena e inicia todo automáticamente
- ✅ `start-rasa.bat`: Solo inicia (si ya está entrenado)

## Verificación

Después de re-entrenar, deberías ver en los logs:

```
✅ Loading model models\20251113-XXXXX-XXXXX.tar.gz...
✅ Starting Rasa server on http://0.0.0.0:5005
✅ Action endpoint is up and running on http://0.0.0.0:5055
```

Y en el backend cuando hagas una petición:
```
📤 Enviando mensaje a Rasa: { message: 'hola', sender: 'admin_user' }
📥 Respuesta de Rasa: [{ "text": "¡Hola! ¿En qué puedo ayudarte?" }]
📊 Status de Rasa: 200
```

## Notas Importantes

- ⚠️ **Siempre re-entrena** el modelo después de cambiar el idioma en `config.yml`
- ⚠️ **El Action Server debe estar corriendo** antes del Rasa Server
- ⚠️ **Verifica que ambos servidores estén activos** antes de probar el chatbot

## Troubleshooting

### Si sigue dando error 500:
1. Verifica los logs del backend para ver el error específico
2. Verifica que Rasa esté respondiendo: `curl http://localhost:5005/status`
3. Verifica que el Action Server esté corriendo: `curl http://localhost:5055/health`

### Si Rasa no responde:
1. Verifica que el puerto 5005 no esté ocupado
2. Verifica que el modelo se entrenó correctamente
3. Revisa los logs de Rasa para ver errores de carga del modelo

