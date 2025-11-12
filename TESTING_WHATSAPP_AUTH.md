# 🧪 Testing WhatsApp Authentication Flow

## ✅ Issue Resolved

**Problem:** The email `leonardobf140224@gmail.com` already existed as an **admin** user without phone/customerId, preventing proper WhatsApp registration.

**Solution:** User was deleted from database. Now you can test the complete flow.

---

## 🔄 Steps to Test

### 1. **Restart Your Servers** (IMPORTANT!)

Make sure you're running the latest code:

```bash
# Terminal 1 - API Server
cd apps/api
npm run dev

# Terminal 2 - WhatsApp Bot
cd apps/whatsapp-bot
npm run dev

# Terminal 3 - Frontend (if testing web login)
cd apps/frontend
npm run dev
```

### 2. **Clear Browser Storage** (if testing frontend)

Open browser console (F12) and run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

This removes the invalid JWT token causing the "invalid signature" error.

### 3. **Create a New Order via WhatsApp**

Send messages to your WhatsApp bot:

```
1. "menu" - Ver productos
2. Select a product
3. Enter quantity
4. "2" - Finalizar pedido
5. Enter your name: "Leonardo Paul Buitron"
6. (Email will be auto-detected if you used it before, or you'll be asked)
7. Enter your address: "Calle Puno 840"
8. "SI" - Confirm order
```

### 4. **Expected Result** ✅

You should receive a WhatsApp message like:

```
✅ Pedido confirmado
Número de orden: ORD-000012
💰 Total: S/.599.80

Gracias por tu compra.

💳 Para pagar con tarjeta, abre este enlace: http://localhost:5173/checkout?order=ord_test_...

🔐 Acceso a tu cuenta web:
Email: leonardobf140224@gmail.com
Contraseña: a1b2c3d4

⚠️ Guarda esta contraseña para acceder a tu cuenta en nuestra página web y revisar tus pedidos.
```

### 5. **Verify User was Created**

Check database:

```bash
cd apps/api
npm run check-user leonardobf140224@gmail.com
```

Should show:
- ✅ Role: **customer**
- ✅ Phone: **51966428078** (or your WhatsApp number)
- ✅ Customer ID: **(linked to Customer record)**
- ✅ Name: **Leonardo Paul Buitron**

### 6. **Test Web Login**

1. Open `http://localhost:5173/login`
2. Use the email and **generated password** from WhatsApp
3. You should see your orders page

---

## 🐛 Troubleshooting

### Problem: Still no password sent via WhatsApp

**Check:**
1. Are servers running with latest code? → Restart them
2. Check API console for errors like "No se pudo crear usuario automáticamente"
3. Verify API_URL in `apps/whatsapp-bot/.env` is correct (default: `http://localhost:3000`)

### Problem: "El email ya está registrado" in frontend

**Solution:**
```bash
npm run check-user leonardobf140224@gmail.com delete
```
Then try WhatsApp order again.

### Problem: JWT "invalid signature" error

**Solution:** Clear browser localStorage (see step 2)

---

## 📝 What Changed

1. ✅ `registerFromWhatsApp` endpoint creates users with:
   - Auto-generated password (8 characters)
   - Role: `customer`
   - Linked to Customer record via `customerId`
   - Phone number stored

2. ✅ WhatsApp bot sends password after successful order

3. ✅ Web login works with WhatsApp-generated credentials

4. ✅ Customers can view their orders on `/my-orders`

---

## 🚀 Next Steps

After successful test:
1. ✅ Customer can login to web with WhatsApp credentials
2. ✅ Admin can see all data in dashboard
3. ✅ Payment flow works with Culqi checkout URL
4. ✅ Users are properly linked to their orders

---

**Ready to test!** Make a new WhatsApp order and you should receive your password. 🎉

