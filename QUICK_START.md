# 🚀 Quick Start - Flujo de WhatsApp a Web

## Cambios Implementados

### ✅ 1. Registro Automático desde WhatsApp
- Los clientes reciben contraseña automática por WhatsApp
- Pueden acceder a la web con email + contraseña generada
- Rol `customer` por defecto

### ✅ 2. Eliminación de Duplicidad de Pagos
- Endpoint `create-charge` deprecado
- Culqi Checkout maneja todo el flujo
- Sin duplicados en Payment

### ✅ 3. Checkout Corregido
- Carga correctamente la interfaz de Culqi
- Actualización automática de estado después del pago
- Polling mejorado

### ✅ 4. Webhook Mejorado
- Actualización automática de órdenes
- Mejor logging

## 📝 Prueba Rápida

### 1. Iniciar Backend:
```bash
cd apps/api
npm run dev
```

### 2. Iniciar Frontend:
```bash
cd apps/frontend
npm run dev
```

### 3. Flujo Completo:

**Por WhatsApp:**
1. Cliente: "Hola"
2. Bot: Muestra productos
3. Cliente: Selecciona productos
4. Bot: Pide nombre, email, dirección
5. Cliente: Confirma orden
6. Bot envía:
   ```
   ✅ Orden ORD-000123
   💳 Link de pago: [URL]
   🔐 Email: cliente@ejemplo.com
   🔐 Contraseña: a3f8b2c9
   ```

**En Web:**
1. Cliente abre link de pago
2. Ingresa datos de tarjeta
3. Paga
4. Redirige a /success
5. Puede hacer login con email + contraseña
6. Ve sus pedidos en /my-orders

## 🧪 Test con cURL

```bash
# 1. Crear usuario desde WhatsApp
curl -X POST http://localhost:3000/api/auth/register-from-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "name": "Test User",
    "phone": "+51999999999"
  }'

# 2. Login con la contraseña generada
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "CONTRASEÑA_GENERADA"
  }'
```

## 📦 Archivos Modificados

### Backend:
- `apps/api/src/controllers/auth.controller.ts` - Nuevo método `registerFromWhatsApp`
- `apps/api/src/routes/auth.routes.ts` - Nueva ruta
- `apps/api/src/controllers/culqi.controller.ts` - Corregido `getOrderForCheckout`, `confirmCulqiOrder`, deprecado `create-charge`

### WhatsApp Bot:
- `apps/whatsapp-bot/src/services/auth.service.ts` - Nuevo servicio
- `apps/whatsapp-bot/src/handlers/order.handler.ts` - Integración de registro automático

### Frontend:
- `apps/frontend/src/pages/checkout.tsx` - Eliminado create-charge, mejor polling

## 🎯 Próximos Pasos

1. Probar flujo completo desde WhatsApp
2. Verificar que el checkout carga correctamente
3. Confirmar que el pago se actualiza en la DB
4. Probar login con contraseña generada

## 📚 Documentación Completa

Ver `WHATSAPP_FLOW_IMPROVEMENTS.md` para detalles completos.

