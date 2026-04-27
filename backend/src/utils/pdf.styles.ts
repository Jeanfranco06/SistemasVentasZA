// backend/src/utils/pdf.styles.ts
import PDFDocument from 'pdfkit';

// Formateador de moneda peruana
export const formatPen = (amount: number): string => {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Formateador de fechas de PostgreSQL
export const formatDate = (dateString: string | Date): string => {
  const d = new Date(dateString);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface TableOptions {
  startY: number;
  headers: string[];
  rows: any[][];
  columnWidths: number[];
  doc: typeof PDFDocument.prototype;
  startYAfterTable?: (finalY: number) => void;
}

export const drawTable = (options: TableOptions) => {
  let { startY, headers, rows, columnWidths, doc } = options;
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  const cellPadding = 5;
  const rowHeightPadding = 4;
  const fontSize = 8;

  // 1. Dibujar Cabeceras
  doc.save();
  doc.rect(50, startY, tableWidth, 20).fill('#1e3a5f'); // Azul corporativo oscuro
  doc.fillColor('white').fontSize(fontSize).font('Helvetica-Bold');
  
  headers.forEach((header, i) => {
    doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + cellPadding, startY + 6, {
      width: columnWidths[i] - cellPadding * 2,
      align: 'left',
      lineBreak: false
    });
  });
  doc.restore();

  let currentY = startY + 20;

  // 2. Dibujar Filas
  rows.forEach((row, rowIndex) => {
    doc.save();
    
    // Calcular la altura máxima requerida por fila (Text Wrapping)
    let maxRowHeight = 15; // Altura mínima
    const cellHeights: number[] = [];

    row.forEach((cellData: any, cellIndex: number) => {
      const cellText = String(cellData || '');
      const textWidth = columnWidths[cellIndex] - cellPadding * 2;
      const heightOfText = doc.fontSize(fontSize).font('Helvetica').heightOfString(cellText, { width: textWidth }) + rowHeightPadding;
      cellHeights.push(heightOfText);
      if (heightOfText > maxRowHeight) maxRowHeight = heightOfText;
    });

    // Verificar si necesitamos salto de página
    if (currentY + maxRowHeight > doc.page.height - 60) {
      doc.addPage();
      currentY = 50;
      
      // Redibujar cabeceras en la nueva página
      doc.save();
      doc.rect(50, currentY, tableWidth, 20).fill('#1e3a5f');
      doc.fillColor('white').fontSize(fontSize).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + cellPadding, currentY + 6, {
          width: columnWidths[i] - cellPadding * 2, align: 'left', lineBreak: false
        });
      });
      doc.restore();
      currentY += 20;
    }

    // Fondo de fila (Zebra)
    const bgColor = rowIndex % 2 === 0 ? '#f8f9fa' : '#ffffff';
    doc.rect(50, currentY, tableWidth, maxRowHeight).fill(bgColor);

    // Dibujar texto de celdas
    doc.fillColor('#333333').fontSize(fontSize).font('Helvetica');
    row.forEach((cellData: any, cellIndex: number) => {
      const cellText = String(cellData || '');
      const x = 50 + columnWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0) + cellPadding;
      
      doc.text(cellText, x, currentY + (rowHeightPadding / 2) + 2, {
        width: columnWidths[cellIndex] - cellPadding * 2,
        align: 'left',
      });
    });

    // Línea divisoria inferior
    doc.moveTo(50, currentY + maxRowHeight).lineTo(50 + tableWidth, currentY + maxRowHeight).stroke('#dee2e6');
    
    currentY += maxRowHeight;
    doc.restore();
  });

  if (options.startYAfterTable) options.startYAfterTable(currentY);
};