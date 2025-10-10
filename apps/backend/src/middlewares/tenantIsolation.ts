import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

export const tenantIsolation = (model: any) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return ResponseHandler.error(res, 'No autenticado', 401);
      }
      
      const { companyId } = req.user;
      const resourceId = req.params.id;
      
      // Si hay un ID en los params, verificar que pertenezca a la empresa
      if (resourceId && mongoose.Types.ObjectId.isValid(resourceId)) {
        const resource = await model.findById(resourceId);
        
        if (!resource) {
          return ResponseHandler.error(res, 'Recurso no encontrado', 404);
        }
        
        if (resource.companyId.toString() !== companyId) {
          return ResponseHandler.error(
            res,
            'No tienes acceso a este recurso',
            403
          );
        }
      }
      
      // Agregar filtro de empresa a las queries
      req.query.companyId = companyId;
      
      next();
    } catch (error) {
      return ResponseHandler.error(res, 'Error de validación de acceso', 500);
    }
  };
};
