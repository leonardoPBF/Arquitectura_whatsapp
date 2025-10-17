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
export const exportToCSV = (data: any[], filePath: string) => {
  try {
    console.log("📤 Exportando datos a CSV...");

    // Si los datos son objetos, obtener los encabezados
    const isObjectData = typeof data[0] === "object" && !Array.isArray(data[0]);
    let csvContent = "";

    if (isObjectData) {
      const headers = Object.keys(data[0]);
      csvContent += headers.join(",") + "\n";
      data.forEach((row) => {
        csvContent += headers.map((h) => row[h]).join(",") + "\n";
      });
    } else {
      // Si los datos son arreglos
      csvContent = data.map((row) => row.join(",")).join("\n");
    }

    writeFileSync(filePath, csvContent, "utf-8");
    console.log(`✅ CSV exportado correctamente en: ${filePath}`);
  } catch (error) {
    console.error("❌ Error al exportar CSV:", error);
    throw error;
  }
};
