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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string, sender: string = 'admin_user') => {
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
        sender,
      });

      const rasaResponses: RasaResponse[] = response.data;
      
      // Process Rasa responses
      rasaResponses.forEach((response) => {
        if (response.text) {
          setMessages(prev => [...prev, { 
            sender: 'bot', 
            text: response.text || '', 
            timestamp: new Date() 
          }]);
        }
      });

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

