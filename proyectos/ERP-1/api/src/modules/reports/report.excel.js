import ExcelJS from 'exceljs';

export async function generateReportExcel({ title, columns, rows, summary, sheetName }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP System';
  const ws = workbook.addWorksheet(sheetName || title || 'Reporte');

  const xlCols = columns.map((c) => ({
    header: typeof c === 'object' ? c.header : c,
    key: typeof c === 'object' ? c.key : c.toLowerCase().replace(/\s/g, '_'),
    width: typeof c === 'object' && c.width ? Math.round(c.width / 6) : 18,
    style: { numFmt: (typeof c === 'object' && (c.align === 'right' || c.key === 'total' || c.key === 'amount')) ? '#,##0' : undefined },
  }));
  ws.columns = xlCols;

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;

  rows.forEach((row) => ws.addRow(row));

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum > 1) {
      row.eachCell((cell) => {
        cell.font = { size: 9, color: { argb: 'FF1F2937' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    }
  });

  if (summary) {
    const summaryStart = rows.length + 3;
    ws.getCell(`A${summaryStart}`).value = 'Resumen Ejecutivo';
    ws.getCell(`A${summaryStart}`).font = { bold: true, size: 10 };
    let sRow = summaryStart + 1;
    Object.entries(summary).forEach(([k, v]) => {
      ws.getCell(`A${sRow}`).value = k;
      ws.getCell(`B${sRow}`).value = v;
      ws.getCell(`A${sRow}`).font = { size: 9 };
      ws.getCell(`B${sRow}`).font = { size: 9, bold: true };
      sRow++;
    });
  }

  return workbook;
}
