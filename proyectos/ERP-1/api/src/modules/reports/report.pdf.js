import PDFDocument from 'pdfkit';

export function generateReportPdf({ title, subtitle, dateRange, columns, rows, summary, companyName }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = 595;
    const left = 40;
    const right = pageW - 40;
    const usable = right - left;

    const fBold = 'Helvetica-Bold';
    const fReg = 'Helvetica';
    const primary = '#1F2937';
    const muted = '#6B7280';
    const accent = '#2563EB';

    function drawTable(headers, rows2, startY, colWidths) {
      const totalW = colWidths.reduce((s, w) => s + w, 0);
      let y = startY;

      doc.rect(left, y, totalW, 16).fill(accent);
      let x = left;
      headers.forEach((h, i) => {
        doc.fillColor('#FFF').fontSize(7).font(fBold).text(h, x + 3, y + 4, { width: colWidths[i], align: ['total', 'subtotal', 'tax', 'discount', 'debit', 'credit', 'balance', 'amount', 'cost', 'price', 'profit', 'sale_price', 'cost_price'].includes(h.toLowerCase()) ? 'right' : 'left' });
        x += colWidths[i];
      });
      y += 16;

      rows2.forEach((row, idx) => {
        if (y > 730) { doc.addPage(); y = 40; }
        if (idx % 2 === 0) doc.rect(left, y - 2, totalW, 14).fill('#F9FAFB');
        x = left;
        headers.forEach((h, i) => {
          const val = row[i] != null ? String(row[i]) : '';
          const isNum = !isNaN(parseFloat(val)) && val.length > 0;
          doc.fillColor('#1F2937').fontSize(7).font(fReg).text(val, x + 3, y, { width: colWidths[i] - 6, align: isNum ? 'right' : 'left' });
          x += colWidths[i];
        });
        y += 14;
      });

      return y + 4;
    }

    doc.fontSize(18).font(fBold).fillColor(primary).text(title, left, 40, { align: 'center' });
    if (subtitle) doc.fontSize(10).font(fReg).fillColor(muted).text(subtitle, left, 62, { align: 'center' });
    doc.moveDown(0.5);
    if (dateRange) doc.fontSize(8).font(fReg).fillColor(muted).text(`Período: ${dateRange}`, left, doc.y, { align: 'center' });
    doc.moveDown(1.5);

    if (companyName) {
      doc.fontSize(8).font(fReg).fillColor(muted).text(companyName, left, doc.y, { align: 'right' });
      doc.moveDown(0.5);
    }

    doc.rect(left, doc.y, usable, 0.5).fill('#E5E7EB');
    doc.moveDown(0.8);

    if (columns && rows) {
      const colWidths2 = columns.map((c) => {
        if (typeof c === 'object' && c.width) return c.width;
        return Math.max(50, Math.floor(usable / columns.length));
      });
      drawTable(columns.map((c) => (typeof c === 'object' ? c.header : c)), rows, doc.y, colWidths2);
      doc.moveDown(0.5);
    }

    doc.moveDown(0.3);
    doc.rect(left, doc.y, usable, 0.5).fill('#E5E7EB');
    doc.moveDown(0.5);

    if (summary) {
      doc.fontSize(9).font(fBold).fillColor(primary).text('Resumen Ejecutivo', left, doc.y);
      doc.moveDown(0.3);
      Object.entries(summary).forEach(([k, v]) => {
        doc.fontSize(8).font(fReg).fillColor(primary).text(`  ${k}: ${v}`, left, doc.y);
        doc.moveDown(0.2);
      });
    }

    doc.moveDown(1);
    doc.fontSize(7).font(fReg).fillColor('#9CA3AF').text(`Generado: ${new Date().toLocaleString('es-PY')}`, left, 780);

    doc.end();
  });
}
