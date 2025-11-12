# Mejoras del Flujo de WhatsApp y Culqi

## 🎯 Problemas Resueltos

### 1. ✅ Generación Automática de Contraseña desde WhatsApp

**Antes:**
- El bot solo pedía email, no contraseña
- Los clientes no podían acceder a la web

**Ahora:**
- Cuando un cliente completa su orden por WhatsApp, automáticamente se crea su usuario con:
  - Email proporcionado
  - Contraseña generada automáticamente (8 caracteres hex)
  - Rol: `customer` (por defecto)
- El cliente recibe su contraseña por WhatsApp:
  ```
  🔐 Acceso a tu cuenta web:
  Email: cliente@ejemplo.com
  Contraseña: a3f8b2c9

  ⚠️ Guarda esta contraseña para acceder a tu cuenta en nuestra página web y revisar tus pedidos.
  ```

**Endpoint Creado:**
- `POST /api/auth/register-from-whatsapp`
  - Registra o verifica usuario
  - Genera contraseña automática si es nuevo
  - Vincula con Customer existente

**Archivos Modificados:**
- `apps/api/src/controllers/auth.controller.ts` - Nuevo método `registerFromWhatsApp`
- `apps/api/src/routes/auth.routes.ts` - Nueva ruta
- `apps/whatsapp-bot/src/services/auth.service.ts` - Nuevo servicio
- `apps/whatsapp-bot/src/handlers/order.handler.ts` - Integración en flujo de orden

---

### 2. ✅ Eliminación de Duplicidad de Pagos

**Problema:**
- El endpoint `/api/culqi/create-charge` creaba un nuevo Payment cada vez
- Causaba duplicidad en la base de datos
- Confusión en el tracking de pagos

**Solución:**
- **DEPRECADO** el endpoint `create-charge`
- Culqi Checkout maneja el pago completo
- El webhook actualiza automáticamente el estado
- Ya no se crean pagos duplicados

**Flujo Correcto:**
1. WhatsApp crea la orden → `create-order`
2. Backend crea Payment y genera link Culqi
3. Cliente paga en Culqi Checkout
4. Culqi envía webhook → actualiza Payment
5. Frontend hace polling para refrescar estado

---

### 3. ✅ Corrección del Checkout de Culqi

**Problemas:**
- El checkout no cargaba la interfaz de Culqi
- No se actualizaba el estado después del pago
- El endpoint `getOrderForCheckout` no retornaba info correcta

**Soluciones Implementadas:**

#### Backend (`culqi.controller.ts`):

1. **`getOrderForCheckout` mejorado:**
   ```typescript
   - Verifica si ya fue pagado en Culqi
   - Actualiza estado local automáticamente
   - Retorna estructura compatible con frontend
   - Mejor logging para debugging
   ```

2. **`confirmCulqiOrder` mejorado:**
   ```typescript
   - Consulta estado actual en Culqi
   - Actualiza Payment y Order
   - Logging detallado
   ```

3. **`createCulqiOrder` mejorado:**
   ```typescript
   - Usa checkout_url de Culqi directamente
   - Mejor manejo de client_details
   - confirmation_url para webhook
   ```

#### Frontend (`checkout.tsx`):

```typescript
// Flujo simplificado:
1. Cargar orden con culqiOrderId
2. Mostrar botón de pago
3. Abrir checkout_url de Culqi
4. Polling automático para verificar pago
5. Redireccionar a /success cuando se confirma
```

---

### 4. ✅ Mejoras en el Webhook

**Configuración:**
```typescript
confirmation_url: `${API_URL}/api/culqi/webhook`
```

**Manejo de Eventos:**
- `order.status.changed` - Actualiza Payment y Order
- `charge.succeeded` - Marca como completado
- `charge.failed` - Marca como fallido
- `refund.created` - Procesa reembolso

---

## 📱 Flujo Completo de WhatsApp a Web

### Para el Cliente:

1. **WhatsApp Bot:**
   ```
   Cliente: Hola
   Bot: ¡Bienvenido! [Muestra productos]
   Cliente: [Selecciona productos]
   Bot: ¿Tu nombre?
   Cliente: Juan Pérez
   Bot: ¿Tu email?
   Cliente: juan@ejemplo.com
   Bot: ¿Tu dirección?
   Cliente: Av. Principal 123
   Bot: [Muestra resumen]
   Cliente: SI
   Bot: ✅ Pedido confirmado
        Número de orden: ORD-000123
        💰 Total: S/. 150.00
        
        💳 Para pagar con tarjeta: [LINK]
        
        🔐 Acceso a tu cuenta web:
        Email: juan@ejemplo.com
        Contraseña: a3f8b2c9
        
        ⚠️ Guarda esta contraseña para acceder a nuestra web
   ```

2. **Cliente hace clic en el link de pago**

3. **Culqi Checkout:**
   - Ingresa datos de tarjeta
   - Paga
   - Culqi procesa

4. **Actualización automática:**
   - Webhook actualiza backend
   - Frontend detecta cambio
   - Redirección a /success

5. **Acceso a la Web:**
   - Login con email y contraseña
   - Ver pedidos en /my-orders
   - Seguimiento de estado

---

## 🔧 Configuración Necesaria

### Variables de Entorno

**Backend (.env):**
```env
JWT_SECRET=tu-clave-secreta-segura
CULQI_PRIVATE_KEY=sk_test_xxxxx
CULQI_PUBLIC_KEY=pk_test_xxxxx
API_URL=http://localhost:3000
LOCAL_LINK=http://localhost:5173/checkout
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
VITE_CULQI_PUBLIC_KEY=pk_test_xxxxx
```

---

## 🧪 Cómo Probar

### 1. Test de Registro desde WhatsApp:

```bash
curl -X POST http://localhost:3000/api/auth/register-from-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "name": "Usuario Test",
    "phone": "+51999999999"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Usuario creado exitosamente desde WhatsApp",
  "userExists": false,
  "generatedPassword": "a3f8b2c9",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "test@ejemplo.com",
    "name": "Usuario Test",
    "role": "customer"
  }
}
```

### 2. Test del Flujo de Pago:

1. Crear una orden por WhatsApp
2. Copiar el link de pago que envía el bot
3. Abrir el link en el navegador
4. Verificar que carga el checkout
5. Usar tarjeta de prueba de Culqi:
   - Número: `4111 1111 1111 1111`
   - CVV: `123`
   - Fecha: Cualquier futura
6. Completar pago
7. Verificar redirección a /success
8. Verificar estado en dashboard admin

### 3. Test de Login con Contraseña Generada:

1. Ir a `/login`
2. Usar email y contraseña que envió el bot
3. Verificar acceso a `/my-orders`
4. Ver la orden creada

---

## 📊 Endpoints Afectados

### Nuevos:
- ✅ `POST /api/auth/register-from-whatsapp`

### Modificados:
- ✅ `GET /api/culqi/order/:culqiOrderId` - Mejor actualización de estado
- ✅ `POST /api/culqi/create-order` - Usa checkout_url de Culqi
- ✅ `POST /api/culqi/confirm-order` - Mejor logging

### Deprecados:
- ❌ `POST /api/culqi/create-charge` - Ya no usar (retorna 410)

---

## 🐛 Troubleshooting

### El checkout no carga:
1. Verificar que CULQI_PUBLIC_KEY está configurado
2. Revisar console del navegador
3. Verificar que el culqiOrderId es válido
4. Revisar logs del backend

### La contraseña no se envía:
1. Verificar que el usuario proporciona email por WhatsApp
2. Revisar logs del handler de order
3. Verificar que authService está importado

### El pago no se actualiza:
1. Verificar webhook en Culqi dashboard
2. Revisar logs de `/api/culqi/webhook`
3. Verificar polling en frontend
4. Manualmente: `POST /api/culqi/confirm-order` con culqiOrderId

---

## 🚀 Próximos Pasos Sugeridos

1. **Recuperación de Contraseña:**
   - Endpoint para resetear contraseña
   - Enviar código por WhatsApp o email

2. **Notificaciones:**
   - Email cuando se crea la cuenta
   - Email de confirmación de pago
   - WhatsApp cuando el pago se completa

3. **Seguridad:**
   - Rate limiting en endpoints de auth
   - 2FA opcional
   - Logs de seguridad

4. **UX:**
   - Tutorial en primera compra
   - Guardado de tarjetas (Culqi)
   - Historial de contraseñas generadas

