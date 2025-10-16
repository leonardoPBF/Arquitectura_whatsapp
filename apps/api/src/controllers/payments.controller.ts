import { Request, Response } from "express";

export const culqiWebhook = (req: Request, res: Response) => {
  console.log("🔔 Webhook Culqi recibido:", req.body);
  res.status(200).send("OK");
};

export const validateYape = (req: Request, res: Response) => {
  console.log("📷 Validando Yape:", req.body);
  res.status(200).json({ valid: true });
};
