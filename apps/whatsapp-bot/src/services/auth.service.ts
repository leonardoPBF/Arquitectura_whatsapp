import { backend as axios } from './backend';
import { config } from '../config';

const API_URL = config.apiUrl;

export const authService = {
  /**
   * Registra o verifica un usuario desde WhatsApp
   * Genera contraseña automática si es nuevo usuario
   */
  async registerFromWhatsApp(data: { email: string; name: string; phone: string }) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register-from-whatsapp`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error al registrar usuario desde WhatsApp:', error.response?.data || error.message);
      throw error;
    }
  },
};

