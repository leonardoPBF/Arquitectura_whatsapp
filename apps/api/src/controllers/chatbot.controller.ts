import axios, { AxiosError } from "axios";
import { Request, Response } from "express";

export const sendMessageToRasa = async (req: Request, res: Response) => {
  try {
    const { message, sender } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!message || !sender) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: message y sender son obligatorios' 
      });
    }

    console.log('📤 Enviando mensaje a Rasa:', { message, sender });

    // Configurar timeout para evitar que se quede colgado
    // El formato correcto para Rasa REST webhook es: { sender, message }
    const response = await axios.post(
      "http://localhost:5005/webhooks/rest/webhook",
      {
        sender: sender || 'admin_user',
        message: message,
      },
      {
        timeout: 30000, // 30 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500, // No lanzar error para códigos 4xx
      }
    );

    console.log('📥 Respuesta de Rasa:', JSON.stringify(response.data, null, 2));
    console.log('📊 Status de Rasa:', response.status);

    // Asegurar que siempre retornamos un array
    let responseData = [];
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        responseData = response.data;
      } else if (typeof response.data === 'object') {
        responseData = [response.data];
      } else if (typeof response.data === 'string') {
        responseData = [{ text: response.data }];
      }
    }

    // Si no hay respuesta, retornar un mensaje por defecto
    if (responseData.length === 0) {
      console.warn('⚠️ Rasa retornó una respuesta vacía');
      responseData = [{ 
        text: 'Lo siento, no pude procesar tu mensaje. Por favor, intenta nuevamente.' 
      }];
    }
    
    return res.json(responseData);
  } catch (error) {
    console.error('❌ Error completo:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('❌ Error de Axios:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      // Si Rasa no está disponible
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          error: 'El servicio de chatbot no está disponible. Por favor, verifica que Rasa esté corriendo en http://localhost:5005' 
        });
      }

      // Si Rasa retorna un error
      if (error.response) {
        return res.status(error.response.status || 500).json({ 
          error: `Error del servicio de chatbot: ${error.response.statusText || error.message}`,
          details: error.response.data 
        });
      }
    } else {
      console.error('❌ Error inesperado:', (error as Error).message);
      console.error('❌ Stack:', (error as Error).stack);
    }
    
    return res.status(500).json({ 
      error: 'Error comunicando con el servicio de chatbot',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
