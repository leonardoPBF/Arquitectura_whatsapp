import { connectDB } from '../database';
import { User } from '../models/User';
import { Customer } from '../models/Customer';

async function checkUser() {
  try {
    await connectDB();
    
    const email = process.argv[2];
    const action = process.argv[3]; // 'check' or 'delete'
    
    if (!email) {
      console.log('❌ Por favor proporciona un email');
      console.log('Uso: npm run check-user <email> [delete]');
      process.exit(1);
    }
    
    console.log(`\n🔍 Buscando usuario con email: ${email}\n`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ No se encontró ningún usuario con ese email');
      process.exit(0);
    }
    
    console.log('✅ Usuario encontrado:');
    console.log('ID:', user._id);
    console.log('Email:', user.email);
    console.log('Nombre:', user.name);
    console.log('Teléfono:', user.phone);
    console.log('Rol:', user.role);
    console.log('Customer ID:', user.customerId);
    console.log('Activo:', user.isActive);
    console.log('Creado:', user.createdAt);
    
    if (user.customerId) {
      const customer = await Customer.findById(user.customerId);
      if (customer) {
        console.log('\n📦 Cliente asociado:');
        console.log('ID:', customer._id);
        console.log('Nombre:', customer.name);
        console.log('Email:', customer.email);
        console.log('Teléfono:', customer.phone);
      }
    }
    
    if (action === 'delete') {
      console.log('\n⚠️  ELIMINANDO USUARIO...');
      await User.findByIdAndDelete(user._id);
      console.log('✅ Usuario eliminado exitosamente');
      
      if (user.customerId) {
        console.log('ℹ️  El registro de Customer NO se eliminó (puede tener órdenes asociadas)');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();

