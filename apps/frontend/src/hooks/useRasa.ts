import { useState } from 'react';
import api from '@/services/api';

export interface RasaMessage {
  text: string;
  recipient_id?: string;
}

export interface RasaResponse {
  text?: string;
  image?: string;
  buttons?: Array<{ title: string; payload: string }>;
  custom?: any;
}

export const useRasa = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; timestamp: Date }>>([]);
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    setLoading(true);
    setError(null);

    // Add user message to chat
    setMessages(prev => [...prev, { 
      sender: 'user', 
      text: message, 
      timestamp: new Date() 
    }]);

    try {
      const response = await api.post('/api/chatbot', {
        message,
        conversationId,
      });

      
      // Manejar diferentes formatos de respuesta
      let rasaResponses: RasaResponse[] = [];
      
      if (Array.isArray(response.data)) {
        rasaResponses = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Si es un objeto único, convertirlo a array
        rasaResponses = [response.data];
      } else if (typeof response.data === 'string') {
        // Si es un string directo, crear un objeto de respuesta
        rasaResponses = [{ text: response.data }];
      }
      
      
      // Process Rasa responses
      if (rasaResponses.length === 0) {
        // Si no hay respuestas, mostrar un mensaje por defecto
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: 'No recibí una respuesta válida. Por favor, intenta nuevamente.', 
          timestamp: new Date() 
        }]);
      } else {
        rasaResponses.forEach((response) => {
          if (response.text) {
            setMessages(prev => [...prev, { 
              sender: 'bot', 
              text: response.text || '', 
              timestamp: new Date() 
            }]);
          }
        });
      }

      return rasaResponses;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al comunicar con Rasa';
      setError(errorMessage);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `Error: ${errorMessage}`, 
        timestamp: new Date() 
      }]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setConversationId(crypto.randomUUID());
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  };
};

