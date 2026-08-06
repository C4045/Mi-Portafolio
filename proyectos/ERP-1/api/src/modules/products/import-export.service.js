import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';

export class ImportExportService {
  async exportToExcel(companyId, query = {}) {
    const where = { companyId, deletedAt: null };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        category: { select: { name: true } },
        unitType: { select: { name: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Productos');

    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Nombre', key: 'name', width: 35 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Código Barras', key: 'barcode', width: 15 },
      { header: 'Tipo', key: 'productType', width: 12 },
      { header: 'Costo', key: 'costPrice', width: 12 },
      { header: 'Precio Venta', key: 'salePrice', width: 14 },
      { header: 'Stock Actual', key: 'currentStock', width: 12 },
      { header: 'Stock Mínimo', key: 'minStock', width: 12 },
      { header: 'Stock Máximo', key: 'maxStock', width: 12 },
      { header: 'Unidad', key: 'unitType', width: 10 },
      { header: 'Estado', key: 'isActive', width: 10 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    for (const p of products) {
      sheet.addRow({
        sku: p.sku,
        name: p.name,
        category: p.category?.name || '',
        barcode: p.barcode || '',
        productType: p.productType,
        costPrice: Number(p.costPrice),
        salePrice: Number(p.salePrice),
        currentStock: Number(p.currentStock),
        minStock: Number(p.minStock),
        maxStock: Number(p.maxStock),
        unitType: p.unitType?.name || '',
        isActive: p.isActive ? 'Activo' : 'Inactivo',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportToPdf(companyId, query = {}) {
    const where = { companyId, deletedAt: null };
    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } } },
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').text('Catálogo de Productos', { align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#666')
        .text(`Generado: ${new Date().toLocaleDateString('es-PY')}`, { align: 'right' });
      doc.moveDown(1);

      const headers = ['SKU', 'Nombre', 'Categoría', 'Costo', 'Precio', 'Stock', 'Activo'];
      const colWidths = [60, 140, 70, 60, 60, 40, 40];
      const startX = 30;
      const tableTop = doc.y + 5;

      const drawHeader = (y) => {
        doc.rect(startX, y, 470, 16).fill('#4F46E5');
        let x = startX;
        headers.forEach((h, i) => {
          doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold')
            .text(h, x + 2, y + 4, { width: colWidths[i], align: i >= 3 ? 'right' : 'left' });
          x += colWidths[i];
        });
        return y + 16;
      };

      let y = drawHeader(tableTop);

      products.forEach((p, idx) => {
        if (y > 750) {
          doc.addPage();
          y = drawHeader(30);
        }

        if (idx % 2 === 0) {
          doc.rect(startX, y - 2, 470, 14).fill('#F3F4F6');
        }

        let x = startX;
        const values = [
          p.sku, p.name, p.category?.name || '',
          `Gs. ${Number(p.costPrice).toLocaleString('es-PY')}`,
          `Gs. ${Number(p.salePrice).toLocaleString('es-PY')}`,
          String(Number(p.currentStock)),
          p.isActive ? 'Sí' : 'No',
        ];

        values.forEach((val, i) => {
          doc.fillColor('#1F2937').fontSize(6.5).font('Helvetica')
            .text(val, x + 2, y, { width: colWidths[i], align: i >= 3 ? 'right' : 'left' });
          x += colWidths[i];
        });

        y += 14;
      });

      doc.moveDown(1);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1F2937')
        .text(`Total de productos: ${products.length}`, { align: 'right' });

      doc.end();
    });
  }

  async importFromExcel(buffer, userId, companyId) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];

    const results = { created: 0, updated: 0, errors: [] };

    const unitType = await prisma.unitType.findFirst({
      where: { companyId, code: 'UNIT' },
    });
    const defaultUnitTypeId = unitType?.id;

    const categoryMap = {};
    const categories = await prisma.category.findMany({
      where: { companyId, deletedAt: null },
    });
    for (const cat of categories) {
      categoryMap[cat.name.toLowerCase()] = cat.id;
    }

    let rowIndex = 1;
    for (const row of sheet.getSheetValues()) {
      rowIndex++;
      if (rowIndex === 1) continue;
      if (!row || !row[2]) continue;

      try {
        const sku = String(row[1] || '').trim();
        const name = String(row[2] || '').trim();
        const categoryName = String(row[3] || '').trim();
        const barcode = String(row[4] || '').trim() || null;
        const costPrice = parseFloat(row[6]) || 0;
        const salePrice = parseFloat(row[7]) || 0;
        const currentStock = parseFloat(row[8]) || 0;
        const minStock = parseFloat(row[9]) || 0;
        const maxStock = parseFloat(row[10]) || 0;

        if (!sku || !name) {
          results.errors.push({ row: rowIndex, message: 'SKU y nombre son requeridos' });
          continue;
        }

        let categoryId = null;
        if (categoryName) {
          const key = categoryName.toLowerCase();
          categoryId = categoryMap[key] || null;
          if (!categoryMap[key]) {
            const cat = await prisma.category.create({
              data: { companyId, code: categoryName.substring(0, 20).toUpperCase(), name: categoryName, createdBy: userId },
            });
            categoryMap[key] = cat.id;
            categoryId = cat.id;
          }
        }

        const existing = await prisma.product.findFirst({
          where: { sku, companyId, deletedAt: null },
        });

        const productData = {
          name,
          categoryId,
          unitTypeId: defaultUnitTypeId,
          barcode,
          costPrice,
          salePrice,
          currentStock,
          minStock,
          maxStock,
          isTracked: true,
        };

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { ...productData, updatedBy: userId },
          });
          results.updated++;
        } else {
          await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
              data: { ...productData, sku, companyId, createdBy: userId },
            });

            if (currentStock > 0) {
              await tx.inventoryMovement.create({
                data: {
                  companyId, productId: p.id, movementType: 'initial',
                  quantity: currentStock, stockBefore: 0, stockAfter: currentStock,
                  unitCost: costPrice, totalCost: currentStock * costPrice,
                  userId, notes: 'Importación por Excel',
                },
              });
            }
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({ row: rowIndex, message: error.message });
      }
    }

    logger.info(`Excel import: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`);
    return results;
  }

  async generateTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Plantilla Productos');

    sheet.columns = [
      { header: 'SKU *', key: 'sku', width: 15 },
      { header: 'Nombre *', key: 'name', width: 35 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Código Barras', key: 'barcode', width: 15 },
      { header: 'Tipo', key: 'productType', width: 12 },
      { header: 'Costo', key: 'costPrice', width: 12 },
      { header: 'Precio Venta', key: 'salePrice', width: 14 },
      { header: 'Stock Inicial', key: 'currentStock', width: 12 },
      { header: 'Stock Mínimo', key: 'minStock', width: 12 },
      { header: 'Stock Máximo', key: 'maxStock', width: 12 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    sheet.addRow({
      sku: 'PROD-001',
      name: 'Ejemplo de producto',
      category: 'Electrónicos',
      barcode: '123456789',
      productType: 'product',
      costPrice: 50000,
      salePrice: 85000,
      currentStock: 10,
      minStock: 5,
      maxStock: 50,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
