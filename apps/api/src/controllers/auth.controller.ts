import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User";
import { Customer } from "../models/Customer";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    let customerId = null;

    // If role is customer, create or find customer record
    if (role === "customer" || !role) {
      if (phone) {
        let customer = await Customer.findOne({ phone });
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
      role: role || "customer",
      customerId,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
      },
    });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error al registrar usuario", error });
  }
};

// POST /api/auth/register-from-whatsapp
// Registro automático desde WhatsApp con contraseña generada
export const registerFromWhatsApp = async (req: Request, res: Response) => {
  try {
    const { email, name, phone } = req.body;

    if (!email || !name || !phone) {
      return res.status(400).json({ 
        message: "Email, nombre y teléfono son requeridos" 
      });
    }

    // Check if user already exists by email or phone
    let user = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (user) {
      // Si ya existe, retornar info sin crear duplicado
      return res.status(200).json({
        message: "Usuario ya existe",
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

    // Generate random password (8 caracteres: letras y números)
    const generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 caracteres hex

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
      role: "customer", // Siempre customer para WhatsApp
      customerId: customer._id,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "Usuario creado exitosamente desde WhatsApp",
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
  } catch (error) {
    console.error("Error en registerFromWhatsApp:", error);
    res.status(500).json({ message: "Error al registrar usuario desde WhatsApp", error });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error al iniciar sesión", error });
  }
};

// GET /api/auth/me - Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
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
  } catch (error) {
    console.error("Error en getCurrentUser:", error);
    res.status(401).json({ message: "Token inválido" });
  }
};

// POST /api/auth/create-admin - Helper to create admin user
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Create admin user
    const user = new User({
      email,
      password,
      name,
      role: "admin",
    });

    await user.save();

    res.status(201).json({
      message: "Administrador creado exitosamente",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en createAdmin:", error);
    res.status(500).json({ message: "Error al crear administrador", error });
  }
};
