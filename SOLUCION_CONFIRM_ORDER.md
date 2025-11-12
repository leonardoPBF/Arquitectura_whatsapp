# ✅ Solución: Confirmar Orden Existente (No Crear Cargo Nuevo)

---

## 🐛 PROBLEMA IDENTIFICADO

**Flujo incorrecto:**
```
1. Backend crea Culqi Order → culqiOrderId: "ord_test_xxx"
2. Frontend recibe token del SDK → tokenId: "tkn_test_xxx"
3. Backend crea Charge NUEVO → charge.id: "chr_test_yyy"
   
Resultado en Culqi:
❌ Orden "ord_test_xxx" → Estado: pending (NO pagada)
✅ Cargo "chr_test_yyy" → Estado: paid (pago exitoso)

Problema: Son dos transacciones separadas, la orden original nunca se pagó
```

---

## ✅ SOLUCIÓN: Usar `confirmOrder()`

### **Método Correcto: `culqi.orders.confirmOrder()`**

```typescript
// ❌ ANTES: Crear cargo nuevo (incorrecto)
const charge = await culqi.charges.createCharge({
  amount: "59980",
  source_id: tokenId,  // Token del SDK
  ...
});

// ✅ AHORA: Confirmar orden existente (correcto)
const confirmedOrder = await culqi.orders.confirmOrder({
  id: culqiOrderId,           // La orden que ya creamos
  transaction_token: tokenId,  // Token del SDK
});
```

---

## 🔄 COMPARACIÓN DE FLUJOS

### **ANTES (Incorrecto):**

```
1. createCulqiOrder()
   → Culqi crea: Order "ord_test_AAA"
   → Estado: pending
   
2. Usuario ingresa tarjeta en SDK
   → Culqi genera: Token "tkn_test_BBB"
   
3. createCharge({ source_id: "tkn_test_BBB" })
   → Culqi crea: Charge "chr_test_CCC" (NUEVO)
   → Estado: paid
   
Resultado en Culqi:
- Order "ord_test_AAA": pending ❌
- Charge "chr_test_CCC": paid ✅

Problema: Order y Charge NO están relacionados
```

---

### **AHORA (Correcto):**

```
1. createCulqiOrder()
   → Culqi crea: Order "ord_test_AAA"
   → Estado: pending
   
2. Usuario ingresa tarjeta en SDK
   → Culqi genera: Token "tkn_test_BBB"
   
3. confirmOrder({ id: "ord_test_AAA", transaction_token: "tkn_test_BBB" })
   → Culqi CONFIRMA: Order "ord_test_AAA"
   → Estado: paid
   
Resultado en Culqi:
- Order "ord_test_AAA": paid ✅

Solución: La orden original se paga correctamente
```

---

## 📝 CAMBIOS APLICADOS

### **Backend: `culqi.controller.ts`**

#### **Antes:**
```typescript
// ❌ Creaba un cargo nuevo
const charge = await culqi.charges.createCharge({
  amount: amountInCents.toString(),
  currency_code: "PEN",
  email: email,
  source_id: tokenId,
  description: `Pago Orden #${order.orderNumber}`,
  metadata: { order_id: culqiOrderId },
});

const isSuccessful = charge.outcome?.type === "venta_exitosa";
```

#### **Ahora:**
```typescript
// ✅ Confirma la orden existente
const confirmedOrder = await culqi.orders.confirmOrder({
  id: culqiOrderId,           // ID de la orden que ya creamos
  transaction_token: tokenId, // Token del SDK
});

const isSuccessful = confirmedOrder.state === "paid";
```

---

## 🎯 BENEFICIOS

### **1. Una sola transacción en Culqi**
```
ANTES:
- 1 orden sin pagar
- 1 cargo pagado
Total: 2 registros separados

AHORA:
- 1 orden pagada
Total: 1 registro ✅
```

### **2. Tracking correcto**
```
ANTES:
culqiOrderId: "ord_test_xxx" (pending)
transactionId: "chr_test_yyy" (paid)
❌ No coinciden

AHORA:
culqiOrderId: "ord_test_xxx" (paid)
transactionId: "ord_test_xxx" (paid)
✅ Mismo ID, consistente
```

### **3. Reportes y reconciliación**
- ✅ Más fácil reconciliar pagos en Culqi
- ✅ No hay órdenes huérfanas sin pagar
- ✅ Webhooks funcionan correctamente
- ✅ Reportes más limpios

---

## 🔍 MÉTODOS DE CULQI

### **1. `culqi.orders.createOrder()` - Crear orden**
```typescript
const order = await culqi.orders.createOrder({
  amount: 59980,
  currency_code: "PEN",
  description: "Orden #ORD-000012",
  order_number: "ORD-000012",
  client_details: { ... },
  expiration_date: Math.floor(Date.now() / 1000) + 86400,
});

// Devuelve:
{
  id: "ord_test_xxx",
  state: "pending",
  checkout_url: "https://checkout.culqi.com/...",
  ...
}
```

**Cuándo usar:** Al crear la orden inicial (ya lo estás haciendo bien)

---

### **2. `culqi.orders.confirmOrder()` - Confirmar orden con token**
```typescript
const confirmedOrder = await culqi.orders.confirmOrder({
  id: "ord_test_xxx",           // Orden existente
  transaction_token: "tkn_test_yyy", // Token del SDK
});

// Devuelve:
{
  id: "ord_test_xxx",
  state: "paid",  // ✅ Ahora está pagada
  ...
}
```

**Cuándo usar:** Cuando recibes un token del SDK y quieres pagar la orden existente

---

### **3. `culqi.charges.createCharge()` - Crear cargo directo**
```typescript
const charge = await culqi.charges.createCharge({
  amount: "59980",
  source_id: "tkn_test_yyy",
  ...
});

// Devuelve:
{
  id: "chr_test_zzz",  // ID diferente, nuevo cargo
  outcome: { type: "venta_exitosa" },
  ...
}
```

**Cuándo usar:** Solo si NO creaste una orden antes (pago directo sin orden)

---

## 🧪 CÓMO PROBAR

### **1. Rebuild backend:**
```bash
cd apps/api
npm run build
npm run dev
```

### **2. Crear orden desde WhatsApp:**
```
Bot → Crear orden
Backend → createCulqiOrder() → "ord_test_AAA"
Bot → Enviar URL de checkout
```

### **3. Pagar con SDK:**
```
1. Abrir checkout
2. Click "Pagar Ahora"
3. Ingresar tarjeta: 4111 1111 1111 1111
4. Click "Pagar"
```

### **4. Verificar backend logs:**
```bash
# Debería mostrar:
💳 Confirmando orden Culqi ord_test_AAA para orden ORD-000012
Orden Culqi confirmada - Estado: paid
✅ Pago completado para orden ORD-000012
```

### **5. Verificar Culqi panel:**
```
Órdenes:
✅ ord_test_AAA - Estado: paid

NO debería haber:
❌ Cargos separados con IDs diferentes
❌ Órdenes en estado pending
```

---

## 📊 ESTADOS DE ORDEN CULQI

Después de `confirmOrder()`, la orden puede tener estos estados:

| Estado | Significado |
|--------|-------------|
| `paid` | ✅ Pago exitoso |
| `expired` | ❌ Orden expiró (timeout) |
| `rejected` | ❌ Pago rechazado (fondos, tarjeta inválida, etc.) |
| `pending` | ⏳ Aún no confirmado |

---

## 🔧 LOGS MEJORADOS

### **ANTES:**
```
💳 Creando cargo para orden ORD-000012 - Monto: 59980 centavos
✅ Pago completado para orden ORD-000012

Culqi panel:
- Order ord_test_AAA: pending
- Charge chr_test_BBB: paid
```

### **AHORA:**
```
💳 Confirmando orden Culqi ord_test_AAA para orden ORD-000012
Orden Culqi confirmada - Estado: paid
✅ Pago completado para orden ORD-000012

Culqi panel:
- Order ord_test_AAA: paid ✅
```

---

## ⚠️ CASOS ESPECIALES

### **¿Qué pasa si la orden ya expiró?**

```typescript
try {
  const confirmedOrder = await culqi.orders.confirmOrder({ ... });
} catch (error) {
  // error.merchant_message: "La orden ha expirado"
  // Manejar apropiadamente
}
```

### **¿Qué pasa si el token es inválido?**

```typescript
const confirmedOrder = await culqi.orders.confirmOrder({ ... });

if (confirmedOrder.state === "rejected") {
  // Token rechazado (tarjeta inválida, fondos insuficientes, etc.)
  // Mostrar error al usuario
}
```

---

## 📚 DOCUMENTACIÓN CULQI

**Método `confirmOrder`:**
- Docs: https://docs.culqi.com/#ordenes-confirmar-orden
- Requiere: `order_id` + `transaction_token`
- Retorna: Orden actualizada con estado `paid` o `rejected`

**Diferencia con `createCharge`:**
- `createCharge`: Crea un cargo independiente (sin orden)
- `confirmOrder`: Confirma/paga una orden existente ✅

---

## ✅ RESUMEN

### **Problema:**
- Creábamos una orden pero no la pagábamos
- Creábamos un cargo separado
- Dos transacciones desconectadas en Culqi

### **Solución:**
- Usar `culqi.orders.confirmOrder()` en lugar de `culqi.charges.createCharge()`
- Esto paga la orden original que ya creamos
- Una sola transacción, tracking correcto

### **Resultado:**
- ✅ Orden pagada correctamente
- ✅ IDs consistentes
- ✅ Reportes limpios en Culqi
- ✅ Webhooks funcionan bien

---

**¡Problema resuelto! Ahora la orden original se paga correctamente.** ✅

