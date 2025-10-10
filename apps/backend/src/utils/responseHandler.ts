import { Response } from 'express';
import { ApiResponse } from '../types';

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Operación exitosa',
    statusCode: number = 200
  ) {
    const response: ApiResponse<T> = {
      status: 'success',
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }
  
  static error(
    res: Response,
    message: string = 'Error en la operación',
    statusCode: number = 500,
    error?: string
  ) {
    const response: ApiResponse = {
      status: 'error',
      message,
      error,
    };
    return res.status(statusCode).json(response);
  }
  
  static created<T>(res: Response, data: T, message: string = 'Recurso creado') {
    return this.success(res, data, message, 201);
  }
  
  static noContent(res: Response) {
    return res.status(204).send();
  }
}