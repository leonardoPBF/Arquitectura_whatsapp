import { Request, Response } from "express";
import { exportToGoogleSheets, exportToCSV } from "../service/googleSheets.service";

// GET /api/sheets/export
export const exportOrders = async (_: Request, res: Response) => {
  try {
    await exportToGoogleSheets();
    res.json({ message: "Datos exportados a Google Sheets" });
  } catch (error) {
    res.status(500).json({ message: "Error al exportar a Google Sheets", error });
  }
};

// GET /api/sheets/export/csv
export const exportOrdersCSV = async (_: Request, res: Response) => {
  try {
    const csv = await exportToCSV();
    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: "Error al generar CSV", error });
  }
};
