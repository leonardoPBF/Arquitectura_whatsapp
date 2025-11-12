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
  paymentId?: string;
  orderId?: string;
  orderExpired?: boolean;
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
   * GET /api/orders/:id
   * Obtiene una orden por su _id en la base de datos
   */
  getOrderById: (id: string): Promise<AxiosResponse<any>> => {
    return api.get(`/api/orders/${id}`);
  },

  /**
   * POST /api/culqi/create-charge
   * Crea un cargo directo con token de Culqi
   */
  createCharge: (data: {
    tokenId: string;
    culqiOrderId: string;
    amount?: number;
    email?: string;
  }): Promise<AxiosResponse<ConfirmPaymentResponse>> => {
    return api.post('/api/culqi/verify-payment', data);
  },

  /**
   * GET /api/culqi/payment/:paymentId
   * Obtiene el detalle de un pago interno
   */
  getPaymentDetails: (paymentId: string): Promise<AxiosResponse<PaymentDetailsResponse>> => {
    return api.get(`/api/culqi/payment/${paymentId}`);
  },
};

// Orders API helpers
export const ordersAPI = {
  // GET /api/orders/:id
  getOrderById: (id: string) => api.get(`/api/orders/${id}`),

  // GET /api/orders
  getAllOrders: () => api.get('/api/orders'),

  // Helper to find an order by its public orderNumber (e.g. ORD-000008)
  // Backend doesn't expose a dedicated endpoint for lookup by orderNumber,
  // so fetch all orders and find the matching one locally (fine for dev/demo).
  findOrderByNumber: async (orderNumber: string) => {
    const res = await api.get('/api/orders');
    const orders = res.data as any[];
    return orders.find(o => o.orderNumber === orderNumber) || null;
  }
};

// Analytics API helpers
export const analyticsAPI = {
  // GET /api/customers
  getAllCustomers: () => api.get('/api/customers'),
  
  // GET /api/orders
  getAllOrders: () => api.get('/api/orders'),
  
  // GET /api/payments
  getAllPayments: () => api.get('/api/payments'),
  
  // GET /api/products
  getAllProducts: () => api.get('/api/products'),
};

// Auth API helpers
export const authAPI = {
  // POST /api/auth/login
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
  
  // POST /api/auth/register
  register: (data: { email: string; password: string; name: string; phone?: string; role?: string }) =>
    api.post('/api/auth/register', data),
  
  // GET /api/auth/me
  getCurrentUser: () => api.get('/api/auth/me'),
  
  // POST /api/auth/create-admin
  createAdmin: (data: { email: string; password: string; name: string }) =>
    api.post('/api/auth/create-admin', data),
};

export default api;