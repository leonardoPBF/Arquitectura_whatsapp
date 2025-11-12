# Sistema de Autenticación - Documentación

## 🎉 Características Implementadas

### Backend (API)

1. **Modelo de Usuario (`User`)** - `apps/api/src/models/User.ts`
   - Roles: `admin` y `customer`
   - Autenticación con bcrypt
   - Vinculación con modelo Customer para clientes

2. **Endpoints de Autenticación** - `apps/api/src/routes/auth.routes.ts`
   - `POST /api/auth/register` - Registro de usuarios
   - `POST /api/auth/login` - Inicio de sesión
   - `GET /api/auth/me` - Obtener usuario actual
   - `POST /api/auth/create-admin` - Crear administrador

### Frontend

1. **Contexto de Autenticación** - `apps/frontend/src/context/AuthContext.tsx`
   - Manejo de estado de usuario
   - Funciones de login/logout/register
   - Verificación de roles

2. **Rutas Protegidas**
   - Rutas de Admin (solo admin):
     - `/dashboard` - Dashboard con analytics y chatbot
   
   - Rutas de Cliente (solo customer):
     - `/` - Catálogo de productos
     - `/checkout` - Proceso de pago
     - `/success` - Confirmación de compra
     - `/my-orders` - Mis pedidos

3. **Componentes**
   - `Login.tsx` - Página de login/registro
   - `Navbar.tsx` - Barra de navegación con usuario y logout
   - `ProtectedRoute.tsx` - Componente para proteger rutas

## 📊 Dashboard Mejorado

Se agregaron nuevos gráficos al dashboard de admin:

1. **Métodos de Pago** - Distribución de pagos por método (efectivo, tarjeta, Yape, etc.)
2. **Productos Más Vendidos** - Top 10 productos por cantidad y revenue
3. **Estado de Pagos** - Resumen de pagos completados, pendientes, fallidos

## 🚀 Configuración Inicial

### 1. Instalar Dependencias del Backend

```bash
cd apps/api
npm install
```

### 2. Configurar Variable de Entorno

Agrega a tu archivo `.env` en `apps/api`:

```env
JWT_SECRET=tu-clave-secreta-super-segura-cambiala-en-produccion
```

### 3. Crear el Primer Usuario Admin

Puedes crear un admin de dos formas:

#### Opción A: Usando el endpoint directamente

```bash
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ejemplo.com",
    "password": "admin123",
    "name": "Administrador"
  }'
```

#### Opción B: Usando un script Node.js

Crea un archivo `apps/api/src/scripts/createAdmin.ts`:

```typescript
import { connectDB } from '../database';
import { User } from '../models/User';

async function createAdmin() {
  await connectDB();
  
  const adminData = {
    email: 'admin@ejemplo.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
  };

  const existingAdmin = await User.findOne({ email: adminData.email });
  if (existingAdmin) {
    console.log('❌ El admin ya existe');
    process.exit(0);
  }

  const admin = new User(adminData);
  await admin.save();
  
  console.log('✅ Administrador creado exitosamente');
  console.log('Email:', adminData.email);
  console.log('Password:', adminData.password);
  process.exit(0);
}

createAdmin().catch(console.error);
```

Ejecuta:
```bash
cd apps/api
npx ts-node src/scripts/createAdmin.ts
```

### 4. Iniciar el Backend

```bash
cd apps/api
npm run dev
```

### 5. Iniciar el Frontend

```bash
cd apps/frontend
npm run dev
```

## 📝 Uso del Sistema

### Login como Administrador

1. Ve a `http://localhost:5173/login`
2. Ingresa:
   - Email: `admin@ejemplo.com`
   - Password: `admin123`
3. Serás redirigido al dashboard (`/dashboard`)

### Registro como Cliente

1. Ve a `http://localhost:5173/login`
2. Haz clic en "¿No tienes cuenta? Regístrate"
3. Completa el formulario:
   - Nombre
   - Email
   - Teléfono (opcional)
   - Contraseña
4. Serás redirigido al catálogo de productos (`/`)

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- Los tokens JWT expiran en 7 días
- Las rutas están protegidas por rol
- El token se almacena en localStorage

## 🎨 Personalización

### Cambiar la Duración del Token

En `apps/api/src/controllers/auth.controller.ts`:

```typescript
const JWT_EXPIRES_IN = "7d"; // Cambia a "1h", "30d", etc.
```

### Agregar Más Campos al Usuario

Edita `apps/api/src/models/User.ts` y agrega los campos necesarios.

### Personalizar Redirecciones

Edita `apps/frontend/src/App.tsx` para cambiar las redirecciones después del login.

## 🐛 Solución de Problemas

### Error: "No token provided"

Asegúrate de que el token se está enviando correctamente. Verifica en `apps/frontend/src/services/api.ts` que el interceptor está configurado.

### Error: "Token inválido"

- Verifica que `JWT_SECRET` esté configurado en el backend
- El token puede haber expirado (7 días por defecto)
- Intenta hacer logout y login de nuevo

### No se puede crear admin

- Verifica que MongoDB esté corriendo
- Asegúrate de que el email no esté duplicado
- Revisa los logs del backend para más detalles

## 📱 Próximos Pasos Sugeridos

1. **Recuperación de Contraseña** - Implementar reset password
2. **Verificación de Email** - Enviar email de confirmación
3. **OAuth** - Agregar login con Google/Facebook
4. **Roles Adicionales** - Agregar más roles (vendedor, gerente, etc.)
5. **Permisos Granulares** - Sistema de permisos más detallado
6. **Two-Factor Authentication** - Agregar 2FA con OTP

## 📚 Recursos

- [JWT.io](https://jwt.io/) - Debugger de JWT
- [bcrypt](https://www.npmjs.com/package/bcryptjs) - Documentación de bcrypt
- [React Context](https://react.dev/reference/react/useContext) - Documentación de Context API

