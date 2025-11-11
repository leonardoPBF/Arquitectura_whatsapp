import axios, { AxiosError } from "axios";
import { Request, Response } from "express";

export const sendMessageToRasa = async (req: Request, res: Response) => {
  try {
    const { message, sender } = req.body;

    const response = await axios.post("http://localhost:5005/webhooks/rest/webhook", {
      sender,
      message,
    });

    return res.json(response.data);
  } catch (error) {
    if(axios.isAxiosError(error)){
        console.error('❌ Error al comunicar con Rasa:', error.message);
    }else {
      console.error('❌ Ocurrió un error inesperado:', (error as Error).message);
    }
    res.status(500).json({ error: 'Error comunicando con Rasa' });
  }
};
