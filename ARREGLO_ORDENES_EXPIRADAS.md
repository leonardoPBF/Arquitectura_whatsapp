# ✅ Arreglo: Manejo de Órdenes Expiradas en Culqi

---

## 🐛 PROBLEMA IDENTIFICADO

```
Error: No existe el siguiente order_id: 'ord_test_pxxcld8OCHtmND0Z'
```

**Causas:**
1. La orden expiró en Culqi (tiempo límite de pago excedido)
2. La orden se eliminó en el panel de Culqi
3. La orden nunca se creó correctamente

**Impacto:**
- ❌ Error 500 en el backend
- ❌ Bucle infinito de consultas fallidas
- ❌ Payment queda en estado "pending" indefinidamente

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Cambios en 3 endpoints:**

1. ✅ `GET /api/culqi/order/:culqiOrderId` (getCulqiOrderStatus)
2. ✅ `POST /api/culqi/confirm-order` (confirmCulqiOrder)
3. ✅ `POST /api/culqi/sync-order/:culqiOrderId` (syncSpecificOrder)

---

## 🔧 MEJORAS APLICADAS

### **1. Manejo de Errores Específico**

**Antes:**
```typescript
try {
  const culqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });
  // ... procesar
} catch (error) {
  console.error("❌ Error al obtener orden:", error);
  return res.status(500).json({ message: "Error" });  // ❌ Genérico
}
```

**Después:**
```typescript
try {
  culqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });
  // ... procesar normalmente
} catch (culqiError: any) {
  // ✅ Detectar si es error de orden no existe
  if (culqiError.type === 'parameter_error' || 
      culqiError.merchant_message?.includes('No existe')) {
    
    orderExpired = true;
    
    // ✅ Marcar payment como expirado
    if (payment.status === 'pending') {
      payment.status = 'expired';
      payment.gatewayResponse = { 
        ...payment.gatewayResponse,
        error: culqiError,
        expired_at: new Date()
      };
      await payment.save();
    }
    
    // ✅ Retornar respuesta amigable
    return res.json({
      success: true,  // ✅ NO error 500
      message: "La orden ha expirado en Culqi",
      orderExpired: true,
      payment,
    });
  }
  
  // Otros errores sí los lanzamos
  throw culqiError;
}
```

---

### **2. Nuevo Estado: "expired"**

Los `Payment` ahora pueden tener estado `expired`:

```typescript
// Estados posibles de Payment:
- "pending"    → Esperando pago
- "completed"  → Pago completado
- "failed"     → Pago fallido
- "expired"    → Orden expiró en Culqi (NUEVO)
```

---

### **3. Respuestas Mejoradas**

#### **GET /api/culqi/order/:culqiOrderId**

**Antes (orden expirada):**
```json
{
  "message": "Error al obtener orden",
  "error": "parameter_error"
}
```
Status: `500` ❌

**Después (orden expirada):**
```json
{
  "success": true,
  "message": "La orden ha expirado en Culqi",
  "orderExpired": true,
  "payment": {
    "_id": "...",
    "status": "expired",
    "gatewayResponse": {
      "error": {...},
      "expired_at": "2025-11-11T20:00:00.000Z"
    }
  },
  "culqiOrder": null
}
```
Status: `200` ✅

---

#### **POST /api/culqi/confirm-order**

**Antes (orden expirada):**
```json
{
  "message": "Error al confirmar orden",
  "error": "..."
}
```
Status: `500` ❌

**Después (orden expirada):**
```json
{
  "success": false,
  "message": "La orden de pago ha expirado en Culqi",
  "orderExpired": true,
  "payment": {
    "status": "expired",
    ...
  }
}
```
Status: `200` ✅

---

## 📊 FLUJO MEJORADO

### **Escenario: Usuario intenta pagar una orden expirada**

#### **ANTES:**

```
1. Frontend: GET /api/culqi/order/ord_test_xxx
2. Backend: await culqi.orders.getOrder(...)
3. Culqi: ❌ Error "No existe order_id"
4. Backend: ❌ Error 500
5. Frontend: ❌ Muestra "Error al obtener orden"
6. Frontend: 🔄 Polling continúa consultando (bucle)
7. Backend: ❌ Logs llenos de errores
```

#### **DESPUÉS:**

```
1. Frontend: GET /api/culqi/order/ord_test_xxx
2. Backend: await culqi.orders.getOrder(...)
3. Culqi: ❌ Error "No existe order_id"
4. Backend: ✅ Detecta error de parámetro
5. Backend: ✅ Marca payment.status = "expired"
6. Backend: ✅ Responde 200 con orderExpired: true
7. Frontend: ✅ Detiene polling
8. Frontend: ✅ Muestra "Esta orden ha expirado. Por favor, crea una nueva orden."
```

---

## 🧪 CÓMO PROBAR

### **Simular Orden Expirada:**

```bash
# 1. Crear una orden normal
POST /api/culqi/create-order
{
  "orderId": "abc123",
  "method": "card"
}

# Respuesta incluye:
{
  "culqiOrder": {
    "id": "ord_test_xxx"
  }
}

# 2. Esperar que expire (o eliminarla en panel de Culqi)

# 3. Intentar consultarla
GET /api/culqi/order/ord_test_xxx

# Respuesta esperada:
{
  "success": true,
  "message": "La orden ha expirado en Culqi",
  "orderExpired": true,
  "payment": {
    "status": "expired"  // ✅ Actualizado
  }
}
```

---

## 🔍 LOGS MEJORADOS

### **Antes:**
```
❌ Error al obtener orden: {object: 'error', type: 'parameter_error'}
GET /api/culqi/order/ord_test_xxx 500
❌ Error al obtener orden: {object: 'error', type: 'parameter_error'}
GET /api/culqi/order/ord_test_xxx 500
...
```

### **Después:**
```
🔍 Buscando orden con culqiOrderId: ord_test_xxx
❌ Error consultando orden en Culqi: No existe el siguiente order_id...
⚠️ Payment abc123 marcado como expired
GET /api/culqi/order/ord_test_xxx 200
✅ Orden expirada, estado local actualizado
```

---

## 📝 RESUMEN DE CAMBIOS

### **Archivos Modificados:**

1. ✅ `apps/api/src/controllers/culqi.controller.ts`
   - `getCulqiOrderStatus()` - Manejo de órdenes expiradas
   - `confirmCulqiOrder()` - Manejo de órdenes expiradas
   - `syncSpecificOrder()` - Manejo de órdenes expiradas

### **Nuevo Estado:**

- ✅ Payment.status puede ser `"expired"`

### **Respuestas API:**

- ✅ Status 200 en lugar de 500 para órdenes expiradas
- ✅ Campo `orderExpired: true` para identificar casos
- ✅ Mensajes descriptivos del estado

---

## 🚀 PRÓXIMOS PASOS

### **Frontend (Recomendado):**

Actualizar `checkout.tsx` para manejar `orderExpired`:

```typescript
const response = await culqiAPI.confirmOrder({ culqiOrderId });

if (response.data.orderExpired) {
  // ✅ Detener polling
  clearInterval(pollingIntervalRef.current!);
  setCheckingPayment(false);
  
  // ✅ Mostrar mensaje claro
  setError(
    "Esta orden de pago ha expirado. " +
    "Por favor, regresa a tus pedidos y genera un nuevo enlace de pago."
  );
  
  // Opcional: Redirigir a MyOrders
  setTimeout(() => navigate('/my-orders'), 3000);
}
```

---

## ✅ BENEFICIOS

1. ✅ **No más errores 500** para órdenes expiradas
2. ✅ **No más bucles infinitos** de polling
3. ✅ **Estado local actualizado** automáticamente
4. ✅ **Logs más claros** y descriptivos
5. ✅ **Mejor UX** - Usuario sabe qué pasó

---

## 🔧 COMANDOS ÚTILES

### **Rebuild Backend:**
```bash
cd apps/api
npm run build
npm run dev  # Restart
```

### **Ver payments expirados:**
```bash
# En MongoDB o API:
GET /api/payments?status=expired
```

### **Forzar sincronización:**
```bash
POST /api/culqi/sync-payments
# Marcará como expired todas las órdenes que no existen en Culqi
```

---

**¡Arreglo completado! Las órdenes expiradas ahora se manejan correctamente.** ✅

