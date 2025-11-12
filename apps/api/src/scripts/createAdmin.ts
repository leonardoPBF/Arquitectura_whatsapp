import { connectDB } from '../database';
import { User } from '../models/User';

async function createAdmin() {
  try {
    await connectDB();
    
    const adminData = {
      email: 'admin@ejemplo.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin' as const,
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('❌ El administrador ya existe');
      console.log('Email:', adminData.email);
      process.exit(0);
    }

    const admin = new User(adminData);
    await admin.save();
    
    console.log('✅ Administrador creado exitosamente');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Rol:', adminData.role);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
    process.exit(1);
  }
}

createAdmin();

