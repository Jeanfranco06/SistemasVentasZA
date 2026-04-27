// backend/src/utils/pdfGestion.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface OrdenParaPDF {
  codigoOrden: string;
  fechaCreacion: string | Date;
  cliente: {
    razonSocial?: string | null;
    usuario?: {
      email?: string;
      nombreCompleto?: string;
    };
  };
  items: Array<{
    productoNombre: string;
    sku: string;
    cantidad: number;
    precioUnitario: number | string;
    subtotal: number | string;
  }>;
  subtotal: number | string;
  impuestoIgv: number | string;
  costoEnvio: number | string;
  total: number | string;
  direccionesEnvio?: Array<{
    direccion: string;
    ciudad?: string;
    destinatarioNombre?: string;
  }>;
  metodoEnvio?: {
    nombre?: string;
  };
  estado?: {
    nombre: string;
  };
}

export const generarPdfOrden = async (orden: OrdenParaPDF): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 40,
          right: 40,
        },
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const formatCurrency = (value: number | string) => `S/ ${Number(value).toFixed(2)}`;
      const fecha = new Date(orden.fechaCreacion);
      const fechaFormateada = fecha.toLocaleDateString('es-PE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Colores
      const primaryColor = '#4f46e5';
      const darkColor = '#1a1a2e';
      const grayColor = '#64748b';
      const lightGray = '#f8fafc';

      // ============================================
      // HEADER
      // ============================================
      
      // Título
      doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('ORDEN DE COMPRA', { align: 'left' });
      
      // Subtítulo
      doc.fontSize(9).fillColor(grayColor).font('Helvetica').text('Comprobante Electronico', { align: 'left' });
      
      // Línea decorativa
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(primaryColor);
      doc.moveDown(0.5);

      // Código y fecha a la derecha
      doc.fontSize(13).fillColor(darkColor).font('Helvetica-Bold').text(`#${orden.codigoOrden}`, { align: 'right' });
      doc.fontSize(9).fillColor(grayColor).font('Helvetica').text(fechaFormateada, { align: 'right' });
      
      // Estado
      const estadoTexto = (orden.estado?.nombre || 'Pendiente').toUpperCase().replace('_', ' ');
      doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold').text(estadoTexto, { align: 'right' });
      
      doc.moveDown(1);

      // ============================================
      // INFORMACIÓN DEL CLIENTE
      // ============================================
      
      doc.fontSize(10).fillColor(grayColor).font('Helvetica-Bold').text('INFORMACION DEL CLIENTE');
      doc.moveDown(0.3);
      
      doc.fontSize(9).fillColor(darkColor).font('Helvetica-Bold').text('Nombre:', { continued: true });
      doc.font('Helvetica').text(` ${orden.cliente?.razonSocial || 'N/A'}`);
      
      doc.font('Helvetica-Bold').text('Email:', { continued: true });
      doc.font('Helvetica').text(` ${orden.cliente?.usuario?.email || 'N/A'}`);
      
      doc.moveDown(0.5);

      // ============================================
      // DIRECCIÓN DE ENVÍO
      // ============================================
      
      if (orden.direccionesEnvio?.length > 0) {
        doc.fontSize(10).fillColor(grayColor).font('Helvetica-Bold').text('DIRECCION DE ENVIO');
        doc.moveDown(0.3);
        
        const dir = orden.direccionesEnvio[0];
        doc.fontSize(9).fillColor(darkColor).font('Helvetica-Bold').text('Destinatario:', { continued: true });
        doc.font('Helvetica').text(` ${dir.destinatarioNombre || 'N/A'}`);
        
        doc.font('Helvetica-Bold').text('Direccion:', { continued: true });
        doc.font('Helvetica').text(` ${dir.direccion}`);
        
        doc.font('Helvetica-Bold').text('Ciudad:', { continued: true });
        doc.font('Helvetica').text(` ${dir.ciudad || 'N/A'}`);
        
        if (orden.metodoEnvio?.nombre) {
          doc.font('Helvetica-Bold').text('Metodo:', { continued: true });
          doc.font('Helvetica').text(` ${orden.metodoEnvio.nombre}`);
        }
        
        doc.moveDown(0.5);
      }

      // ============================================
      // TABLA DE PRODUCTOS
      // ============================================
      
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(darkColor).font('Helvetica-Bold').text('DETALLE DE PRODUCTOS');
      doc.moveDown(0.5);

      // Encabezados de tabla - Ajustar posiciones
      const tableTop = doc.y;
      const tableHeight = 18;
      const pageWidth = 595; // A4 width in points
      const marginLeft = 40;
      const marginRight = 40;
      const tableWidth = pageWidth - marginLeft - marginRight;
      
      // Column positions
      const colProductoX = marginLeft;
      const colSkuX = marginLeft + 200;
      const colCantX = marginLeft + 300;
      const colPrecioX = marginLeft + 360;
      const colSubtotalX = marginLeft + 440;
      
      // Header background
      doc.fillColor(primaryColor);
      doc.rect(marginLeft, tableTop, tableWidth, tableHeight).fill();
      
      // Header text
      doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('Producto', colProductoX + 5, tableTop + 5, { width: 190, align: 'left' });
      doc.text('SKU', colSkuX + 5, tableTop + 5, { width: 55, align: 'left' });
      doc.text('Cant.', colCantX + 5, tableTop + 5, { width: 50, align: 'center' });
      doc.text('Precio', colPrecioX + 5, tableTop + 5, { width: 70, align: 'right' });
      doc.text('Subtotal', colSubtotalX + 5, tableTop + 5, { width: 70, align: 'right' });

      // Filas de productos
      let currentY = tableTop + tableHeight + 3;
      
      orden.items.forEach((item, index) => {
        const rowY = currentY + (index * 16);
        
        // Fondo alternado
        if (index % 2 === 0) {
          doc.fillColor(lightGray);
          doc.rect(marginLeft, rowY, tableWidth, 16).fill();
        }
        
        doc.fontSize(7).fillColor(darkColor).font('Helvetica');
        
        // Truncar nombre si es muy largo
        let nombreProducto = item.productoNombre;
        if (nombreProducto.length > 35) {
          nombreProducto = nombreProducto.substring(0, 32) + '...';
        }
        
        doc.text(nombreProducto, colProductoX + 5, rowY + 4, { width: 190, align: 'left' });
        doc.text(item.sku, colSkuX + 5, rowY + 4, { width: 55, align: 'left' });
        doc.text(String(item.cantidad), colCantX + 5, rowY + 4, { width: 50, align: 'center' });
        doc.text(formatCurrency(item.precioUnitario), colPrecioX + 5, rowY + 4, { width: 70, align: 'right' });
        doc.text(formatCurrency(item.subtotal), colSubtotalX + 5, rowY + 4, { width: 70, align: 'right' });
      });

      // Actualizar posición Y después de la tabla
      const tableEndY = currentY + (orden.items.length * 16) + 8;
      doc.y = tableEndY;

      // ============================================
      // TOTALES
      // ============================================
      
      doc.moveDown(0.5);
      
      const totalWidth = 180;
      const totalStartX = pageWidth - marginRight - totalWidth;
      
      // Subtotal
      doc.fontSize(9).fillColor(grayColor).font('Helvetica');
      doc.text('Subtotal:', totalStartX, doc.y, { width: 90, align: 'left' });
      doc.fillColor(darkColor).text(formatCurrency(orden.subtotal), totalStartX + 90, doc.y, { width: 90, align: 'right' });
      doc.moveDown(0.4);
      
      // IGV
      doc.fillColor(grayColor).text('IGV (18%):', totalStartX, doc.y, { width: 90, align: 'left' });
      doc.fillColor(darkColor).text(formatCurrency(orden.impuestoIgv), totalStartX + 90, doc.y, { width: 90, align: 'right' });
      doc.moveDown(0.4);
      
      // Envío
      doc.fillColor(grayColor).text('Envio:', totalStartX, doc.y, { width: 90, align: 'left' });
      doc.fillColor(darkColor).text(formatCurrency(orden.costoEnvio), totalStartX + 90, doc.y, { width: 90, align: 'right' });
      doc.moveDown(0.8);
      
      // Total - Con mejor contraste y visibilidad
      const totalBoxY = doc.y;
      const totalBoxHeight = 24;
      
      // Rectángulo de fondo oscuro para el total
      doc.fillColor('#1a1a2e');
      doc.rect(totalStartX, totalBoxY, totalWidth, totalBoxHeight).fill();
      
      // Texto blanco grande y destacado
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('TOTAL:', totalStartX + 8, totalBoxY + 6, { width: 80, align: 'left' });
      doc.text(formatCurrency(orden.total), totalStartX + 8, totalBoxY + 6, { width: totalWidth - 16, align: 'right' });

      // ============================================
      // FOOTER
      // ============================================
      
      doc.moveDown(2);
      
      // Línea decorativa
      const footerLineY = doc.y;
      doc.moveTo(marginLeft, footerLineY).lineTo(pageWidth - marginRight, footerLineY).stroke(grayColor);
      doc.moveDown(0.3);
      
      // Footer text - centered properly
      const footerText = 'Este documento es una representacion electronica de la orden de compra.';
      const footerText2 = `Generado por StockFlow - ${new Date().toLocaleString('es-PE')}`;
      
      doc.fontSize(7).fillColor(grayColor).font('Helvetica');
      
      // Calculate center position
      const footerWidth = pageWidth - marginLeft - marginRight;
      const textWidth1 = doc.widthOfString(footerText);
      const textWidth2 = doc.widthOfString(footerText2);
      
      const centerX1 = marginLeft + (footerWidth - textWidth1) / 2;
      const centerX2 = marginLeft + (footerWidth - textWidth2) / 2;
      
      doc.text(footerText, centerX1, doc.y, { width: footerWidth, align: 'center' });
      doc.moveDown(0.3);
      doc.text(footerText2, centerX2, doc.y, { width: footerWidth, align: 'center' });

      // Finalizar documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Función legacy para compatibilidad
type PdfGestionConfig = {
  titulo: string;
  htmlCuerpo: string;
  imagenBase64: string;
};

export const generarPdfGestionConGrafico = async (config: PdfGestionConfig) => {
  const htmlCompleto = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        header { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
        h1 { margin: 0; color: #2c3e50; }
        .chart-container { text-align: center; margin: 20px 0; }
        .chart-container img { max-width: 100%; height: auto; border: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #2c3e50; color: white; }
        .notice { margin-top: 24px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #475569; }
      </style>
    </head>
    <body>
      <header>
        <h1>StockFlow Reporte: ${config.titulo}</h1>
        <small>Generado: ${new Date().toLocaleString('es-PE')}</small>
      </header>
      <div class="chart-container">
        <img src="data:image/png;base64,${config.imagenBase64}" alt="Grafico de Gestion" />
      </div>
      <div class="content">
        ${config.htmlCuerpo}
      </div>
      <div class="notice">
        Generacion PDF temporal sin dependencia externa.
      </div>
    </body>
    </html>
  `;

  return Buffer.from(htmlCompleto, 'utf-8');
};