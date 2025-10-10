import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { AuthRequest, TokenPayload } from '../types';
import { ResponseHandler } from '../utils/responseHandler';
import User from '../models/User';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(
        res,
        'No se proporcionó token de autenticación',
        401
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    
    // Verificar que el usuario existe y está activo
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return ResponseHandler.error(
        res,
        'Usuario no autorizado o inactivo',
        401
      );
    }
    
    // Agregar usuario al request
    req.user = {
      id: decoded.id,
      companyId: decoded.companyId,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return ResponseHandler.error(res, 'Token inválido', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      return ResponseHandler.error(res, 'Token expirado', 401);
    }
    return ResponseHandler.error(res, 'Error de autenticación', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseHandler.error(res, 'No autenticado', 401);
    }
    
    if (!roles.includes(req.user.role)) {
      return ResponseHandler.error(
        res,
        'No tienes permisos para esta acción',
        403
      );
    }
    
    next();
  };
};