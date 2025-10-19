import { Request, Response } from "express";
import { exportToGoogleSheets, exportToCSV } from "../service/googleSheets.service";
import { Order } from "../models/Order";

// GET /api/sheets/export
export const exportOrders = async (_: Request, res: Response) => {
  try {
    // Obtener todos los pedidos desde MongoDB
    const orders = await Order.find().lean();

    // Configura tus datos de Google Sheets
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
    const sheetName = "Pedidos";

    const sheetData = [
      // Cabeceras
      ["ID", "Cliente", "Teléfono", "Total", "Estado", "Fecha de creación"],
      // Filas de datos
      ...orders.map(order => [
        order._id?.toString() ?? "",
        order.customerId ?? "",
        order.customerPhone ?? "",
        order.totalAmount ?? 0,
        order.status ?? "",
        new Date(order.createdAt).toLocaleString("es-PE"),
      ]),
    ];

    await exportToGoogleSheets(spreadsheetId, sheetName, sheetData);

    res.json({ message: "✅ Datos exportados a Google Sheets correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error al exportar a Google Sheets", error });
  }
};

// GET /api/sheets/export/csv
export const exportOrdersCSV = async (_: Request, res: Response) => {
  try {
    const orders = await Order.find().lean();

    const filePath = "./tmp/orders.csv";
    const csv = await exportToCSV(orders, filePath);

    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error al generar CSV", error });
  }
};

