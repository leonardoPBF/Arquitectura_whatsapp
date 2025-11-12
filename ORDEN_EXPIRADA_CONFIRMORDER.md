# ✅ Solución: Orden Expirada al Intentar Confirmar

---

## 🐛 PROBLEMA

**Error en backend:**
```
💳 Confirmando orden Culqi ord_test_fc1LgAujXa26w8MO para orden ORD-000011
❌ Error: No existe el siguiente order_id: 'ord_test_fc1LgAujXa26w8MO'.
POST /api/culqi/create-charge 500
```

**Causa:**
- Orden creada hace tiempo (probablemente más de 24 horas)
- Culqi eliminó la orden expirada de su sistema
- Cuando el usuario intenta pagar, Culqi no encuentra la orden

---

## 🔍 FLUJO DEL PROBLEMA

```
1. WhatsApp Bot crea orden
   → createCulqiOrder() → "ord_test_fc1LgAujXa26w8MO"
   → Fecha de expiración: 11/11/2025 13:39 (24 horas)

2. Usuario NO paga inmediatamente
   → Pasan más de 24 horas

3. Culqi elimina la orden automáticamente
   → La orden ya no existe en Culqi

4. Usuario intenta pagar (tarde)
   → Ingresa tarjeta en SDK
   → Frontend envía token
   → Backend intenta: confirmOrder({ id: "ord_test_fc1LgAujXa26w8MO" })
   → ❌ Culqi: "No existe el siguiente order_id"
   → ❌ Backend: Error 500
```

---

## ✅ SOLUCIÓN APLICADA

### **1. Backend: Detectar orden expirada**

```typescript
try {
  const confirmedOrder = await culqi.orders.confirmOrder({
    id: culqiOrderId,
    transaction_token: tokenId,
  });
  
  // Procesar pago exitoso...
} catch (culqiError: any) {
  // ✅ DETECTAR ORDEN EXPIRADA
  if (culqiError.type === 'parameter_error' || 
      culqiError.merchant_message?.includes('No existe')) {
    
    console.warn(`⚠️ Orden Culqi ${culqiOrderId} expiró o no existe`);
    
    // Marcar payment como expirado
    payment.status = 'expired';
    payment.gatewayResponse = { 
      error: culqiError,
      expired_at: new Date()
    };
    await payment.save();
    
    // ✅ Responder 400 (no 500) con orderExpired: true
    return res.status(400).json({
      success: false,
      message: "La orden de pago ha expirado. Por favor, genera un nuevo enlace de pago.",
      orderExpired: true,
      error: culqiError.merchant_message,
    });
  }
  
  // Otro tipo de error
  throw culqiError;
}
```

**Beneficios:**
- ✅ No responde 500 (es un error esperado, no del servidor)
- ✅ Marca el payment como `expired` en la BD
- ✅ Responde con `orderExpired: true` para que el frontend lo maneje

---

### **2. Frontend: Detectar y redirigir**

```typescript
try {
  const response = await culqiAPI.createCharge({ ... });
  
  if (response.data.success) {
    // Pago exitoso
    navigate(`/success?order=${dbOrderId}`);
  } else {
    // ✅ DETECTAR SI EXPIRÓ
    if (response.data.orderExpired) {
      setError(
        "Esta orden de pago ha expirado. " +
        "Por favor, regresa a 'Mis Pedidos' y genera un nuevo enlace de pago."
      );
      setTimeout(() => navigate('/my-orders'), 5000);
    } else {
      setError(response.data.message || "El pago fue rechazado");
    }
  }
} catch (err: any) {
  // ✅ TAMBIÉN DETECTAR EN ERRORES 400
  if (err.response?.status === 400 && err.response?.data?.orderExpired) {
    setError(
      "Esta orden de pago ha expirado. " +
      "Por favor, regresa a 'Mis Pedidos' y genera un nuevo enlace de pago."
    );
    setTimeout(() => navigate('/my-orders'), 5000);
  } else {
    setError(err.response?.data?.message || "Error al procesar el pago");
  }
}
```

**Beneficios:**
- ✅ Muestra mensaje claro al usuario
- ✅ Redirige a `/my-orders` después de 5 segundos
- ✅ Usuario puede generar nuevo enlace de pago

---

## 🔄 FLUJO MEJORADO

```
1. Usuario intenta pagar orden expirada
   → Ingresa tarjeta en SDK
   → Frontend envía token

2. Backend intenta confirmar
   → confirmOrder({ id: "ord_test_xxx" })
   → ❌ Culqi: "No existe order_id"

3. Backend detecta expiración
   → Marca payment.status = "expired"
   → Responde 400 con orderExpired: true

4. Frontend detecta expiración
   → Muestra: "Esta orden ha expirado..."
   → Redirige a /my-orders en 5 segundos

5. Usuario en /my-orders
   → Ve orden con estado "Pendiente"
   → Click "💳 Pagar Ahora"
   → Se crea NUEVA orden Culqi (válida)
   → Usuario puede pagar correctamente ✅
```

---

## 📊 COMPARACIÓN

### **ANTES:**
```
Backend: confirmOrder() → Error 500
Frontend: "Error al procesar pago" (genérico)
Usuario: Confundido, no sabe qué hacer ❌
```

### **DESPUÉS:**
```
Backend: confirmOrder() → Error 400 + orderExpired: true
Frontend: "Esta orden ha expirado. Genera un nuevo enlace..."
Usuario: Redirigido a /my-orders para generar nuevo pago ✅
```

---

## 🎯 ESTADOS DE PAYMENT

Después de estos cambios, un `Payment` puede tener:

| Estado | Cuándo |
|--------|--------|
| `pending` | Orden creada, esperando pago |
| `completed` | Pago exitoso |
| `failed` | Pago rechazado (fondos, tarjeta inválida) |
| `expired` | Orden expiró en Culqi (24h+) |

---

## 🧪 CÓMO PROBAR

### **1. Simular orden expirada:**

```bash
# Opción A: Modificar BD manualmente
# Cambiar culqiOrderId a uno que no existe:
db.payments.updateOne(
  { orderNumber: "ORD-000011" },
  { $set: { culqiOrderId: "ord_test_EXPIRED" } }
)

# Opción B: Esperar 24 horas (no recomendado para testing)

# Opción C: Eliminar orden en panel de Culqi
```

### **2. Intentar pagar:**
```
1. Abrir checkout de la orden
2. Click "Pagar Ahora"
3. Ingresar tarjeta
4. Click "Pagar"

Resultado esperado:
✅ Mensaje: "Esta orden de pago ha expirado..."
✅ Redirige a /my-orders en 5 segundos
```

### **3. Verificar BD:**
```bash
# Payment debería tener:
{
  status: "expired",
  gatewayResponse: {
    error: { ... },
    expired_at: "2025-11-11T..."
  }
}
```

---

## 📝 LOGS MEJORADOS

### **Backend:**

**ANTES:**
```
💳 Confirmando orden Culqi ord_test_xxx
❌ Error al crear cargo: { object: 'error', ... }
POST /api/culqi/create-charge 500
```

**DESPUÉS:**
```
💳 Confirmando orden Culqi ord_test_xxx
❌ Error al confirmar orden Culqi: { object: 'error', ... }
⚠️ Orden Culqi ord_test_xxx expiró o no existe
POST /api/culqi/create-charge 400
```

---

### **Frontend:**

**ANTES:**
```
❌ Error al procesar pago: AxiosError ...
Error del servidor: Error al procesar pago
```

**DESPUÉS:**
```
❌ Error al procesar pago: AxiosError ...
[Mensaje en pantalla]: Esta orden de pago ha expirado.
                        Por favor, regresa a 'Mis Pedidos' y genera un nuevo enlace de pago.
[Redirigiendo a /my-orders en 5 segundos...]
```

---

## 💡 MEJORA ADICIONAL RECOMENDADA

### **Prevenir que se abra checkout de orden ya expirada:**

En `loadOrderData()` del frontend:

```typescript
// Verificar si la orden ya expiró antes de cargar el checkout
if (payment?.status === 'expired') {
  setError(
    "Esta orden ya expiró. " +
    "Por favor, regresa a 'Mis Pedidos' y genera un nuevo enlace de pago."
  );
  setLoading(false);
  setTimeout(() => navigate('/my-orders'), 3000);
  return;
}

// Verificar fecha de expiración si está disponible
if (culqiOrder?.expiration_date) {
  const now = Math.floor(Date.now() / 1000); // Unix timestamp
  if (now > culqiOrder.expiration_date) {
    setError("Esta orden ha expirado. Genera un nuevo enlace de pago.");
    setTimeout(() => navigate('/my-orders'), 3000);
    return;
  }
}
```

---

## ✅ RESUMEN

### **Problema:**
- Orden expiró en Culqi
- Backend devolvía error 500
- Usuario confundido

### **Solución:**
- Backend detecta expiración → Marca payment como `expired` → Responde 400
- Frontend detecta `orderExpired: true` → Muestra mensaje claro → Redirige a /my-orders
- Usuario puede generar nuevo enlace de pago

### **Resultado:**
- ✅ Mejor UX
- ✅ Mensajes claros
- ✅ Usuario sabe qué hacer
- ✅ Payment actualizado en BD

---

**¡Problema resuelto! Ahora las órdenes expiradas se manejan correctamente en `confirmOrder`.** ✅

**Restart backend y probar con una orden nueva (no expirada).**

