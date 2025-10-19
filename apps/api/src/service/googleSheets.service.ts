import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";
import { writeFileSync } from "fs";

/**
 * Exporta datos a Google Sheets usando la API de Google Sheets.
 * @param spreadsheetId ID del Google Sheet
 * @param sheetName Nombre de la hoja donde se insertarán los datos
 * @param data Arreglo de arreglos con los datos [[col1, col2], [val1, val2], ...]
 */
export const exportToGoogleSheets = async (
  spreadsheetId: string,
  sheetName: string,
  data: any[][]
) => {
  try {
    console.log("📤 Exportando datos a Google Sheets...");

    // Autenticación con credenciales del servicio
    const auth = new GoogleAuth({
      keyFile: "credentials.json", // ruta a tu archivo JSON de credenciales
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Inserta los datos en el rango especificado
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: data,
      },
    });

    console.log("✅ Datos exportados correctamente a Google Sheets");
    return response.data;
  } catch (error) {
    console.error("❌ Error al exportar a Google Sheets:", error);
    throw error;
  }
};

/**
 * Exporta los datos a un archivo CSV local.
 * @param data Arreglo de objetos o de arreglos
 * @param filePath Ruta del archivo CSV a generar
 */
import fs from "fs";
import { Parser } from "json2csv";

// ✅ Exportar a CSV desde datos de MongoDB
export const exportToCSV = async (data: any[], filePath: string): Promise<string> => {
  try {
    if (!data || data.length === 0) {
      throw new Error("No hay datos para exportar");
    }

    // Definir las columnas que quieres en el CSV
    const fields = [
      { label: "ID", value: "_id" },
      { label: "Cliente", value: "customerId" },
      { label: "Teléfono", value: "customerPhone" },
      { label: "Total", value: "totalAmount" },
      { label: "Estado", value: "status" },
      { label: "Fecha de creación", value: (row: any) => new Date(row.createdAt).toLocaleString("es-PE") },
    ];

    // Usar json2csv para convertir los datos
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);

    // Crear directorio temporal si no existe
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Guardar archivo CSV
    fs.writeFileSync(filePath, csv, "utf-8");

    console.log(`✅ Archivo CSV generado en: ${filePath}`);
    return csv;
  } catch (error) {
    console.error("❌ Error al exportar CSV:", error);
    throw error;
  }
};
