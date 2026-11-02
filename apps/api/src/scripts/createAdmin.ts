import { connectDB } from '../database';
import { User } from '../models/User';
import mongoose from 'mongoose';

async function createAdmin() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name = 'Administrador' } = process.env;
  if (!email || !password || password.length < 12 || password.length > 72) {
    throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (12–72 caracteres) en el entorno del proceso');
  }
  await connectDB();
  try {
    if (await User.exists({ email })) throw new Error('La cuenta ya existe; no se modificó');
    await User.create({ email, password, name, role: 'admin' });
    console.log('Administrador creado. La contraseña no se muestra ni se guarda en logs.');
  } finally { await mongoose.disconnect(); }
}
createAdmin().catch(() => { console.error('No se pudo crear el administrador. Revisa las variables y que la cuenta no exista.'); process.exitCode = 1; });
