// backend/src/utils/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generarPdfOperacional = (datos: { titulo: string; cabeceras: string[]; filas: any[] }) => {
  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream('./reporte_temp.pdf');
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(20).text(`StockFlow - ${datos.titulo}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'right' });
    doc.moveDown(1);

    // Tabla
    const startY = doc.y;
    const columnWidth = (doc.page.width - 100) / datos.cabeceras.length;
    
    // Cabeceras
    doc.rect(50, startY, doc.page.width - 100, 20).fill('#2c3e50');
    datos.cabeceras.forEach((cab, i) => {
      doc.fillColor('white').fontSize(10)
         .text(cab, 50 + (i * columnWidth), startY + 5, { width: columnWidth, align: 'center' });
    });

    // Filas
    let currentY = startY + 20;
    datos.filas.forEach((fila, rowIndex) => {
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;
      }
      
      const bgColor = rowIndex % 2 === 0 ? '#f8f9fa' : '#ffffff';
      doc.rect(50, currentY, doc.page.width - 100, 20).fill(bgColor);
      
      Object.values(fila).forEach((valor: any, colIndex) => {
        doc.fillColor('black').fontSize(9)
           .text(String(valor), 50 + (colIndex * columnWidth), currentY + 5, { width: columnWidth, align: 'center' });
      });
      currentY += 20;
    });

    // Pie de página
    doc.end();
    stream.on('finish', () => resolve('./reporte_temp.pdf'));
    stream.on('error', reject);
  });
};