import axios from "axios";

const API_URL = "http://localhost:3000";

export const api = {
  getAllProducts: async () => {
    const res = await axios.get(`${API_URL}/api/products`);
    return res.data;
  },

  createOrder: async (orderData: any) => {
    const res = await axios.post(`${API_URL}/api/orders`, orderData);
    return res.data;
  },
};
