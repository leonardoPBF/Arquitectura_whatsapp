import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Interfaces para tipos de respuesta
interface OrderResponse {
  id: string;
  order_number: string;
  description: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
  };
}

interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  charge?: any;
  order?: any;
  payment?: any;
}

interface CreateOrderResponse {
  success: boolean;
  message: string;
  checkoutUrl: string;
  culqiOrder: any;
  payment: any;
}

interface OrderStatusResponse {
  success: boolean;
  payment: any;
  culqiOrder: any;
}

interface PaymentDetailsResponse {
  success: boolean;
  payment: any;
}

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor de requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de responses
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Error desconocido';
      
      switch (status) {
        case 401:
          console.error('No autorizado:', message);
          break;
        case 403:
          console.error('Acceso prohibido:', message);
          break;
        case 404:
          console.error('Recurso no encontrado:', message);
          break;
        case 500:
          console.error('Error del servidor:', message);
          break;
        default:
          console.error('Error:', message);
      }
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    } else {
      console.error('Error al configurar la petición:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API de Culqi - Actualizada según tus endpoints del backend
export const culqiAPI = {
  /**
   * GET /api/culqi/order/:culqiOrderId
   * Obtiene los datos de una orden Culqi para mostrar en el checkout
   */
  getOrder: (culqiOrderId: string): Promise<AxiosResponse<OrderStatusResponse>> => {
    return api.get(`/api/culqi/order/${culqiOrderId}`);
  },

  /**
   * POST /api/culqi/confirm-order
   * Confirma el estado de pago de una orden
   */
  confirmOrder: (data: {
    culqiOrderId: string;
  }): Promise<AxiosResponse<ConfirmPaymentResponse>> => {
    return api.post('/api/culqi/confirm-order', data);
  },

  /**
   * POST /api/culqi/create-order
   * Crea una nueva orden y genera el link de pago
   */
  createOrder: (data: {
    orderId: string;
    currency?: string;
    method: string;
  }): Promise<AxiosResponse<CreateOrderResponse>> => {
    return api.post('/api/culqi/create-order', data);
  },

  /**
   * POST /api/culqi/create-charge
   * Crea un cargo directo con token de Culqi
   */
  createCharge: (data: {
    tokenId: string;
    culqiOrderId: string;
    amount: number;
    email?: string;
  }): Promise<AxiosResponse<ConfirmPaymentResponse>> => {
    return api.post('/api/culqi/create-charge', data);
  },

  /**
   * GET /api/culqi/payment/:paymentId
   * Obtiene el detalle de un pago interno
   */
  getPaymentDetails: (paymentId: string): Promise<AxiosResponse<PaymentDetailsResponse>> => {
    return api.get(`/api/culqi/payment/${paymentId}`);
  },
};

export default api;