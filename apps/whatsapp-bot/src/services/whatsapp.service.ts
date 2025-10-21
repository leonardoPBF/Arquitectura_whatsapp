import axios from "axios";

const API_URL = "http://localhost:3000";

export const api = {
  // =========================
  // PRODUCTS
  // =========================
  getAllProducts: async () => {
    const res = await axios.get(`${API_URL}/api/products`);
    return res.data;
  },

  getProductById: async (id: string) => {
    const res = await axios.get(`${API_URL}/api/products/${id}`);
    return res.data;
  },

  searchProducts: async (query: string) => {
    const res = await axios.get(`${API_URL}/api/products/search`, { params: { q: query } });
    return res.data;
  },

  createProduct: async (data: any) => {
    const res = await axios.post(`${API_URL}/api/products`, data);
    return res.data;
  },

  updateProduct: async (id: string, data: any) => {
    const res = await axios.put(`${API_URL}/api/products/${id}`, data);
    return res.data;
  },

  deleteProduct: async (id: string) => {
    const res = await axios.delete(`${API_URL}/api/products/${id}`);
    return res.data;
  },

  // =========================
  // CUSTOMERS
  // =========================
  getCustomers: async () => {
    const res = await axios.get(`${API_URL}/api/customers`);
    return res.data;
  },

  getCustomerById: async (id: string) => {
    const res = await axios.get(`${API_URL}/api/customers/${id}`);
    return res.data;
  },

  getCustomerByPhone: async (phone: string) => {
    const res = await axios.get(`${API_URL}/api/customers/phone/${phone}`);
    return res.data;
  },

  createCustomer: async (data: any) => {
    const res = await axios.post(`${API_URL}/api/customers`, data);
    return res.data;
  },

  updateCustomer: async (id: string, data: any) => {
    const res = await axios.put(`${API_URL}/api/customers/${id}`, data);
    return res.data;
  },

  deleteCustomer: async (id: string) => {
    const res = await axios.delete(`${API_URL}/api/customers/${id}`);
    return res.data;
  },

  // =========================
  // CONVERSATIONS
  // =========================
  getConversations: async () => {
    const res = await axios.get(`${API_URL}/api/conversations`);
    return res.data;
  },

  getConversationByPhone: async (phone: string) => {
    const res = await axios.get(`${API_URL}/api/conversations/${phone}`);
    return res.data;
  },

  createConversation: async (data: any) => {
    const res = await axios.post(`${API_URL}/api/conversations`, data);
    return res.data;
  },

  getConversationCart: async (phone: string) => {
    const res = await axios.get(`${API_URL}/api/conversations/${phone}/cart`);
    return res.data;
  },

  addItemToConversationCart: async (phone: string, data: any) => {
    const res = await axios.post(`${API_URL}/api/conversations/${phone}/cart/add`, data);
    return res.data;
  },

  removeItemFromConversationCart: async (phone: string, data: any) => {
    const res = await axios.post(`${API_URL}/api/conversations/${phone}/cart/remove`, data);
    return res.data;
  },

  updateConversationCart: async (phone: string, cart: any[]) => {
    const res = await axios.patch(`${API_URL}/api/conversations/${phone}/cart`, { cart });
    return res.data;
  },

  updateConversationStep: async (phone: string, currentStep: string, lastMessage?: string) => {
    const res = await axios.patch(`${API_URL}/api/conversations/${phone}/step`, { currentStep, lastMessage });
    return res.data;
  },

  clearConversationCart: async (phone: string) => {
    const res = await axios.post(`${API_URL}/api/conversations/${phone}/clear-cart`);
    return res.data;
  },

  // =========================
  // ORDERS
  // =========================
  getOrders: async () => {
    const res = await axios.get(`${API_URL}/api/orders`);
    return res.data;
  },

  getOrderById: async (id: string) => {
    const res = await axios.get(`${API_URL}/api/orders/${id}`);
    return res.data;
  },

  getOrdersByCustomer: async (customerId: string) => {
    const res = await axios.get(`${API_URL}/api/orders/customer/${customerId}`);
    return res.data;
  },

  createOrder: async (data: any) => {
    const res = await axios.post(`${API_URL}/api/orders`, data);
    return res.data;
  },

  // Culqi: create order / payment and receive checkoutUrl
  createCulqiOrder: async (data: any) => {
    const res = await axios.post(`${API_URL}/api/culqi/create-order`, data);
    return res.data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const res = await axios.patch(`${API_URL}/api/orders/${id}/status`, { status });
    return res.data;
  },

  cancelOrder: async (id: string) => {
    const res = await axios.post(`${API_URL}/api/orders/${id}/cancel`);
    return res.data;
  },

  // =========================
  // PAYMENTS
  // =========================
  getPayments: async () => {
    const res = await axios.get(`${API_URL}/api/payments`);
    return res.data;
  },

  createPayment: async (data: any) => {
    const res = await axios.post(`${API_URL}/api/payments`, data);
    return res.data;
  },

  getPaymentById: async (id: string) => {
    const res = await axios.get(`${API_URL}/api/payments/${id}`);
    return res.data;
  },

  updatePaymentStatus: async (id: string, status: string) => {
    const res = await axios.patch(`${API_URL}/api/payments/${id}/status`, { status });
    return res.data;
  },

  // =========================
  // SHEETS
  // =========================
  exportOrdersToSheets: async () => {
    const res = await axios.get(`${API_URL}/api/sheets/export`);
    return res.data;
  },

  exportOrdersToCSV: async () => {
    const res = await axios.get(`${API_URL}/api/sheets/export/csv`);
    return res.data;
  },
};
