// backend/src/utils/pdfGestion.ts
import puppeteer from 'puppeteer';

export const generarPdfGestionConGrafico = async (config: { titulo: string; htmlCuerpo: string; imagenBase64: string }) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const htmlCompleto = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        header { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
        h1 { margin: 0; color: #2c3e50; }
        .chart-container { text-align: center; margin: 20px 0; }
        .chart-container img { max-width: 100%; height: auto; border: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #2c3e50; color: white; }
      </style>
    </head>
    <body>
      <header>
        <h1>StockFlow Reporte: ${config.titulo}</h1>
        <small>Generado: ${new Date().toLocaleString('es-PE')}</small>
      </header>
      <div class="chart-container">
        <img src="data:image/png;base64,${config.imagenBase64}" alt="Gráfico de Gestión" />
      </div>
      <div class="content">
        ${config.htmlCuerpo}
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return pdfBuffer; // Retornar buffer para enviar como response directa
};