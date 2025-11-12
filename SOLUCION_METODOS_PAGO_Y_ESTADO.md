# ✅ Solución: Métodos de Pago y Verificación de Estado

---

## 🐛 PROBLEMAS IDENTIFICADOS

### **1. Orden "expirada" pero activa en Culqi**
- El sistema marcaba la orden como expirada
- Pero en Culqi aparecía como activa
- Causa: No verificábamos el estado real antes de intentar confirmar

### **2. Método de pago siempre "efectivo" por defecto**
- `createCulqiOrder` no especificaba `payment_methods`
- Culqi usaba "pagoefectivo" por defecto
- Esto afecta qué métodos de pago puede usar el cliente

---

## ✅ SOLUCIONES APLICADAS

### **1. Agregar `payment_methods` al crear orden**

**ANTES:**
```typescript
const culqiOrder = await culqi.orders.createOrder({
  amount: Math.round(order.totalAmount * 100),
  currency_code: currency,
  description: `Orden #${order.orderNumber}`,
  // ❌ No se especificaba payment_methods
  // Culqi usaba "pagoefectivo" por defecto
});
```

**AHORA:**
```typescript
// ✅ Mapear método de pago a payment_methods de Culqi
const paymentMethodsMap: Record<string, string[]> = {
  card: ["card"],
  billetera_movil: ["billetera_movil"],
  pagoefectivo: ["pagoefectivo"],
  all: ["card", "billetera_movil", "pagoefectivo"],
};

const paymentMethods = paymentMethodsMap[method] || ["card"];

const culqiOrder = await culqi.orders.createOrder({
  amount: Math.round(order.totalAmount * 100),
  currency_code: currency,
  description: `Orden #${order.orderNumber}`,
  // ✅ Especificar métodos de pago permitidos
  payment_methods: paymentMethods,
});
```

**Beneficios:**
- ✅ Si `method = "card"` → Solo permite tarjeta
- ✅ Si `method = "billetera_movil"` → Solo billetera móvil
- ✅ Si `method = "pagoefectivo"` → Solo pago en efectivo
- ✅ Si `method = "all"` → Permite todos los métodos

---

### **2. Verificar estado de orden ANTES de confirmar**

**ANTES:**
```typescript
// ❌ Intentaba confirmar directamente
const confirmedOrder = await culqi.orders.confirmOrder({
  id: culqiOrderId,
  transaction_token: tokenId,
});

// Si la orden no existía → Error 500
```

**AHORA:**
```typescript
// ✅ PRIMERO: Verificar estado actual
let currentCulqiOrder: any;
try {
  currentCulqiOrder = await culqi.orders.getOrder({ id: culqiOrderId });
  console.log(`Estado actual: ${currentCulqiOrder.state}`);
  
  // Si ya está pagada → Retornar éxito
  if (currentCulqiOrder.state === "paid") {
    // Actualizar BD y retornar
    return res.json({ success: true, ... });
  }
  
  // Si está expirada o rechazada → No intentar confirmar
  if (currentCulqiOrder.state === "expired" || currentCulqiOrder.state === "rejected") {
    // Marcar payment y retornar error apropiado
    return res.status(400).json({ ... });
  }
  
  // Si está "pending" → Continuar a confirmar
} catch (getOrderError) {
  // Si no existe → Marcar como expirado
  if (getOrderError.merchant_message?.includes('No existe')) {
    payment.status = 'expired';
    return res.status(400).json({ orderExpired: true, ... });
  }
}

// ✅ SOLO SI ESTÁ PENDING: Intentar confirmar
const confirmedOrder = await culqi.orders.confirmOrder({
  id: culqiOrderId,
  transaction_token: tokenId,
});
```

**Beneficios:**
- ✅ Verifica estado real de Culqi antes de intentar confirmar
- ✅ Si ya está pagada → No intenta confirmar de nuevo
- ✅ Si está expirada → Marca correctamente como expired
- ✅ Si está pending → Procede a confirmar normalmente

---

## 📊 FLUJO MEJORADO

### **Crear Orden:**

```
1. WhatsApp Bot → createCulqiOrder({ method: "card" })
2. Backend mapea: method "card" → payment_methods: ["card"]
3. Culqi crea orden con payment_methods: ["card"]
4. ✅ Cliente solo puede pagar con tarjeta
```

### **Confirmar Orden:**

```
1. Usuario ingresa tarjeta en SDK
2. Frontend envía token
3. Backend: getOrder({ id: culqiOrderId })
   → Estado: "pending" ✅
4. Backend: confirmOrder({ id, transaction_token })
   → Estado: "paid" ✅
5. Actualizar BD y retornar éxito
```

### **Si Orden Ya Está Pagada:**

```
1. Usuario intenta pagar de nuevo
2. Backend: getOrder({ id: culqiOrderId })
   → Estado: "paid" ✅
3. Backend: NO intenta confirmar
   → Retorna: "Orden ya estaba pagada"
4. Actualiza BD si es necesario
```

### **Si Orden Está Expirada:**

```
1. Usuario intenta pagar orden expirada
2. Backend: getOrder({ id: culqiOrderId })
   → Estado: "expired" ❌
3. Backend: NO intenta confirmar
   → Marca payment.status = "expired"
   → Retorna: orderExpired: true
4. Frontend muestra mensaje y redirige
```

---

## 🎯 MÉTODOS DE PAGO DISPONIBLES

### **Culqi soporta:**

| Método | Valor en Culqi | Descripción |
|--------|----------------|-------------|
| **Tarjeta** | `"card"` | Tarjetas de crédito/débito |
| **Billetera Móvil** | `"billetera_movil"` | Yape, Plin, etc. |
| **Pago Efectivo** | `"pagoefectivo"` | Pago en efectivo (agentes, bancos) |

### **Cómo se usa:**

```typescript
// Solo tarjeta
createCulqiOrder({ method: "card" })
→ payment_methods: ["card"]

// Solo billetera móvil
createCulqiOrder({ method: "billetera_movil" })
→ payment_methods: ["billetera_movil"]

// Solo efectivo
createCulqiOrder({ method: "pagoefectivo" })
→ payment_methods: ["pagoefectivo"]

// Todos los métodos
createCulqiOrder({ method: "all" })
→ payment_methods: ["card", "billetera_movil", "pagoefectivo"]
```

---

## ⚠️ ¿AFECTA QUE SEA "EFECTIVO" POR DEFECTO?

**SÍ, afecta significativamente:**

### **Si no especificas `payment_methods`:**

1. **Culqi usa "pagoefectivo" por defecto**
   - Cliente solo puede pagar en efectivo
   - No puede usar tarjeta en el SDK
   - No puede usar billetera móvil

2. **El SDK de Culqi no funcionará correctamente**
   - Si intentas pagar con tarjeta → Error
   - El formulario de tarjeta puede no aparecer
   - Solo mostrará opciones de pago en efectivo

3. **El hosted checkout mostrará solo efectivo**
   - Cliente verá solo opciones de agentes/bancos
   - No verá opción de tarjeta

### **Con la solución:**

✅ Si `method = "card"`:
- Cliente puede pagar con tarjeta en SDK
- Hosted checkout muestra opción de tarjeta
- No muestra efectivo ni billetera móvil

✅ Si `method = "all"`:
- Cliente puede elegir cualquier método
- SDK muestra todas las opciones
- Hosted checkout muestra todas las opciones

---

## 🧪 CÓMO PROBAR

### **1. Rebuild backend:**
```bash
cd apps/api
npm run build
npm run dev
```

### **2. Crear orden con método específico:**
```bash
# Desde WhatsApp Bot (ya lo hace):
createCulqiOrder({ orderId: "...", method: "card" })

# Verificar en Culqi panel:
# La orden debe mostrar "Métodos de pago: Tarjeta"
```

### **3. Verificar estado antes de confirmar:**
```bash
# Intentar pagar orden
# Backend debería mostrar:
Estado actual de orden Culqi: pending
Orden Culqi confirmada - Estado: paid
```

### **4. Probar con orden ya pagada:**
```bash
# Intentar pagar de nuevo
# Backend debería mostrar:
Estado actual de orden Culqi: paid
✅ Orden ord_test_xxx ya está pagada
# NO intenta confirmar de nuevo
```

---

## 📝 LOGS MEJORADOS

### **Crear Orden:**

**ANTES:**
```
✅ Orden Culqi creada: ord_test_xxx
# No se especificaba payment_methods
```

**AHORA:**
```
✅ Orden Culqi creada: ord_test_xxx
# payment_methods: ["card"] (o el método especificado)
```

### **Confirmar Orden:**

**ANTES:**
```
💳 Confirmando orden Culqi ord_test_xxx
❌ Error: No existe order_id (si expiró)
```

**AHORA:**
```
💳 Confirmando orden Culqi ord_test_xxx
Estado actual de orden Culqi: pending
Orden Culqi confirmada - Estado: paid
✅ Pago completado
```

---

## ✅ RESUMEN

### **Problema 1: Orden "expirada" pero activa**
- ✅ Solución: Verificar estado con `getOrder()` antes de confirmar
- ✅ Si está "paid" → Retornar éxito sin intentar confirmar
- ✅ Si está "expired" → Marcar correctamente y retornar error apropiado
- ✅ Si está "pending" → Proceder a confirmar

### **Problema 2: Método de pago "efectivo" por defecto**
- ✅ Solución: Agregar `payment_methods` al crear orden
- ✅ Mapear `method` del request a `payment_methods` de Culqi
- ✅ Si `method = "card"` → Solo permite tarjeta
- ✅ Si `method = "all"` → Permite todos los métodos

### **Resultado:**
- ✅ Métodos de pago correctos según lo solicitado
- ✅ Verificación de estado antes de confirmar
- ✅ No más errores de "orden expirada" cuando está activa
- ✅ Mejor manejo de órdenes ya pagadas

---

**¡Problemas resueltos! Ahora los métodos de pago se configuran correctamente y se verifica el estado antes de confirmar.** ✅

