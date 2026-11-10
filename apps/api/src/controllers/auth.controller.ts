import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Customer } from '../models/Customer';

import { jwtSecret, identity } from '../middlewares/security';
const JWT_EXPIRES_IN = '7d';

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;
    if (req.body.role && req.body.role !== 'customer') return res.status(403).json({ message: 'El registro público solo admite clientes' });
    if (typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || password.length < 12 || password.length > 72 || typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !/^\+?\d{7,15}$/.test(phone)) {
      return res.status(400).json({ message: 'Email, nombre, teléfono y contraseña de 12 a 72 caracteres requeridos' });
    }
    const role = 'customer';

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    let customerId = null;

    // If role is customer, create or find customer record
    if (role === 'customer' || !role) {
      if (phone) {
        let customer = await Customer.findOne({ phone });
        if (customer) return res.status(409).json({ message: 'El teléfono ya está vinculado; inicia sesión o solicita asistencia' });
        if (!customer) {
          customer = new Customer({
            phone,
            name,
            email,
          });
          await customer.save();
        }
        customerId = customer._id;
      }
    }

    // Create user
    const user = new User({
      email,
      password,
      name,
      phone,
      role: role || 'customer',
      customerId,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
      jwtSecret(),
      { expiresIn: JWT_EXPIRES_IN, jwtid: crypto.randomUUID(), algorithm: 'HS256' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
      },
    });
  } catch {
    console.error('auth.operation_failed');
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

// POST /api/auth/register-from-whatsapp
// Registro automático desde WhatsApp con contraseña generada
export const registerFromWhatsApp = async (req: Request, res: Response) => {
  try {
    const { email, name, phone } = req.body;

    if (typeof email !== 'string' || typeof name !== 'string' || typeof phone !== 'string' || !/^\+?\d{7,15}$/.test(phone)) {
      return res.status(400).json({ 
        message: 'Email, nombre y teléfono son requeridos'
      });
    }

    // Check if user already exists by email or phone
    let user = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (user) {
      if (user.phone !== phone || user.email !== email || user.role !== 'customer') return res.status(409).json({ message: 'Identidad ya vinculada' });
      // Si ya existe, retornar info sin crear duplicado
      return res.status(200).json({
        message: 'Usuario ya existe',
        userExists: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          customerId: user.customerId,
        },
        // No enviar contraseña si ya existe
      });
    }

    // Cryptographically random initial password; only the trusted WhatsApp service receives it.
    const generatedPassword = crypto.randomBytes(16).toString('hex');

    // Create or find customer
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = new Customer({
        phone,
        name,
        email,
      });
      await customer.save();
    } else {
      // Update customer info if exists
      customer.name = name;
      customer.email = email;
      await customer.save();
    }

    // Create user with generated password
    user = new User({
      email,
      password: generatedPassword,
      name,
      phone,
      role: 'customer', // Siempre customer para WhatsApp
      customerId: customer._id,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
      jwtSecret(),
      { expiresIn: JWT_EXPIRES_IN, jwtid: crypto.randomUUID(), algorithm: 'HS256' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente desde WhatsApp',
      userExists: false,
      generatedPassword, // Enviar la contraseña generada
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
        phone: user.phone,
      },
    });
  } catch {
    console.error('auth.operation_failed');
    res.status(500).json({ message: 'Error al registrar usuario desde WhatsApp' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 72) return res.status(400).json({ message: 'Credenciales inválidas' });

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
      jwtSecret(),
      { expiresIn: JWT_EXPIRES_IN, jwtid: crypto.randomUUID(), algorithm: 'HS256' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
      },
    });
  } catch {
    console.error('auth.operation_failed');
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// GET /api/auth/me - Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = { userId: identity(res).id };
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
      },
    });
  } catch {
    console.error('auth.operation_failed');
    res.status(401).json({ message: 'Token inválido' });
  }
};

// POST /api/auth/create-admin - Helper to create admin user
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Create admin user
    const user = new User({
      email,
      password,
      name,
      role: 'admin',
    });

    await user.save();

    res.status(201).json({
      message: 'Administrador creado exitosamente',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    console.error('auth.operation_failed');
    res.status(500).json({ message: 'Error al crear administrador' });
  }
};

// Reset only the login account linked to this customer, never a customer profile alone.
export const resetCustomerPassword = async (req: Request, res: Response) => {
  if (identity(res)?.role !== 'admin') return res.sendStatus(403);
  const { password } = req.body;
  if (!/^[a-f\d]{24}$/i.test(String(req.params.customerId))) return res.status(400).json({ message: 'Cliente inválido' });
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Usa al menos 12 caracteres y un máximo de 72 bytes' });
  }
  try {
    const user = await User.findOne({ customerId: req.params.customerId, role: 'customer', isActive: true });
    if (!user) return res.status(404).json({ message: 'Este cliente no tiene una cuenta de acceso activa' });
    user.password = password;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    user.updatedAt = new Date();
    await user.save();
    return res.json({ message: 'Contraseña restablecida. Las sesiones anteriores quedaron cerradas.' });
  } catch {
    return res.status(500).json({ message: 'No se pudo restablecer la contraseña' });
  }
};
