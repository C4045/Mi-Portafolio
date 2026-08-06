import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { InvoiceRepository } from './invoice.repository.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class InvoiceService {
  constructor() { this.repository = new InvoiceRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, status, dateFrom, dateTo } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, dateFrom, dateTo });
    return { data: data.map(this._toDTO), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async findById(id, companyId) {
    const inv = await this.repository.findById(id);
    if (!inv || inv.companyId !== companyId) throw new NotFoundError('Factura', id);
    return this._toDTO(inv);
  }

  async generateFromSale(saleId, userId, companyId) {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!sale || sale.companyId !== companyId) throw new NotFoundError('Venta', saleId);
    if (sale.status === 'cancelled') throw new ConflictError('No se puede facturar una venta cancelada');
    const existingInvoice = await this.repository.findBySaleId(saleId);
    if (existingInvoice) throw new ConflictError('Esta venta ya tiene una factura asociada');

    const serie = 'FAC-001';
    const lastDoc = await this.repository.getLastDocumentNumber(companyId, serie);
    const nextNum = lastDoc ? String(Number(lastDoc.documentNumber) + 1).padStart(7, '0') : '0000001';

    const lastInv = await this.repository.getLastInvoiceNumber(companyId);
    const invNum = lastInv ? String(Number(lastInv.invoiceNumber) + 1).padStart(10, '0') : '0000000001';

    const itemsData = sale.items.map((item) => ({
      productId: item.productId,
      description: item.description || item.product?.name || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    const invoice = await this.repository.create({
      saleId, companyId, customerId: sale.customerId,
      documentType: 'invoice', documentSerie: serie, documentNumber: nextNum,
      invoiceNumber: invNum, issueDate: new Date(), dueDate: sale.dueDate || null,
      subtotal: sale.subtotal, tax: sale.tax, discount: sale.discount, total: sale.total,
      currencyCode: sale.currencyCode, status: 'issued', createdBy: userId,
      items: { create: itemsData },
    });

    await prisma.sale.update({ where: { id: saleId }, data: { status: 'invoiced', updatedBy: userId } });

    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Invoice', entityId: invoice.id, newValues: { saleId, invoiceNumber: invNum } });
    logger.info(`Invoice ${invNum} generated from sale ${saleId} by ${userId}`);
    return this._toDTO(invoice);
  }

  async cancel(id, userId, companyId) {
    const inv = await this.repository.findById(id);
    if (!inv || inv.companyId !== companyId) throw new NotFoundError('Factura', id);
    if (inv.status === 'cancelled') throw new ConflictError('Factura ya cancelada');
    await this.repository.softDelete(id, userId);
    await createAuditLog({ userId, companyId, action: 'CANCEL', entity: 'Invoice', entityId: id, oldValues: { status: inv.status } });
    logger.info(`Invoice ${id} cancelled by ${userId}`);
  }

  async generatePdf(id, companyId) {
    const inv = await this.repository.findById(id);
    if (!inv || inv.companyId !== companyId) throw new NotFoundError('Factura', id);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    return new Promise((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (n) => `Gs. ${Number(n).toLocaleString('es-PY')}`;
      doc.fontSize(16).font('Helvetica-Bold').text('FACTURA', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text(`N° ${inv.invoiceNumber}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#333');
      doc.text(`Fecha de emisión: ${new Date(inv.issueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      if (inv.dueDate) doc.text(`Vencimiento: ${new Date(inv.dueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      doc.moveDown(0.5);
      const customer = inv.sale?.customer;
      if (customer) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1F2937').text('Cliente:');
        doc.fontSize(9).font('Helvetica').fillColor('#374151').text(customer.businessName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()).text(`RUC/CI: ${customer.documentNumber}`).text(customer.address || '');
      }
      doc.moveDown(0.8);

      const headers = ['#', 'Producto', 'Cant.', 'P. Unit.', 'Total'];
      const colW = [16, 220, 50, 70, 75];
      const startX = 40; let y = doc.y;
      doc.rect(startX, y, 431, 14).fill('#DC2626');
      let x = startX;
      headers.forEach((h, i) => { doc.fillColor('#FFF').fontSize(7).font('Helvetica-Bold').text(h, x + 2, y + 3, { width: colW[i], align: i >= 3 ? 'right' : 'left' }); x += colW[i]; });
      y += 14;
      inv.items.forEach((item, idx) => {
        if (y > 730) { doc.addPage(); y = 40; }
        if (idx % 2 === 0) doc.rect(startX, y - 2, 431, 14).fill('#F9FAFB');
        x = startX;
        [String(idx + 1), item.description, String(Number(item.quantity)), fmt(item.unitPrice), fmt(item.total)].forEach((v, i) => { doc.fillColor('#1F2937').fontSize(7).font('Helvetica').text(v, x + 2, y, { width: colW[i], align: i >= 3 ? 'right' : 'left' }); x += colW[i]; });
        y += 14;
      });
      y += 10;
      doc.rect(startX, y - 4, 431, 0.5).fill('#D1D5DB');
      y += 6;
      [{ label: 'Subtotal', value: fmt(inv.subtotal) }, { label: 'Descuento', value: `-${fmt(inv.discount)}` }, { label: 'IVA (10%)', value: fmt(inv.tax) }, { label: 'TOTAL', value: fmt(inv.total), bold: true }].forEach((t) => {
        doc.fontSize(t.bold ? 11 : 9).font(t.bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.fillColor('#1F2937').text(t.label, 320, y); doc.text(t.value, 385, y, { align: 'right', width: 86 });
        y += t.bold ? 18 : 14;
      });
      doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text(`Generado: ${new Date().toLocaleString('es-PY')}`, startX, 780);
      doc.end();
    });
  }

  _toDTO(inv) {
    return {
      id: inv.id, saleId: inv.saleId, companyId: inv.companyId, customerId: inv.customerId,
      documentType: inv.documentType, documentSerie: inv.documentSerie, documentNumber: inv.documentNumber,
      invoiceNumber: inv.invoiceNumber, issueDate: inv.issueDate, dueDate: inv.dueDate,
      subtotal: Number(inv.subtotal), tax: Number(inv.tax), discount: Number(inv.discount), total: Number(inv.total),
      currencyCode: inv.currencyCode, status: inv.status, notes: inv.notes, pdfGenerated: inv.pdfGenerated,
      createdAt: inv.createdAt,
      sale: inv.sale ? { id: inv.sale.id, documentSerie: inv.sale.documentSerie, documentNumber: inv.sale.documentNumber, customer: inv.sale.customer } : null,
      items: inv.items ? inv.items.map((i) => ({ id: i.id, productId: i.productId, description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), total: Number(i.total) })) : [],
    };
  }
}
