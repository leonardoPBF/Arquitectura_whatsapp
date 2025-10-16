import { Request, Response } from "express";
import { exportToGoogleSheets } from "../service/googleSheets.service";

export const exportOrders = async (_: Request, res: Response) => {
  await exportToGoogleSheets();
  res.json({ message: "Datos exportados a Google Sheets" });
};
