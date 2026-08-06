import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { QuotationRepository } from './quotation.repository.js';
import { SaleResponseDTO } from '../sales/sale.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class QuotationService {
  constructor() { this.repository = new QuotationRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, status, customerId, dateFrom, dateTo } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, customerId, dateFrom, dateTo });
    return { data: data.map((s) => new SaleResponseDTO(s)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async findById(id, companyId) {
    const q = await this.repository.findById(id);
    if (!q || q.companyId !== companyId) throw new NotFoundError('Cotización', id);
    return new SaleResponseDTO(q);
  }

  async create(data, userId, companyId) {
    const sucursalId = data.sucursalId || (await prisma.sucursal.findFirst({ where: { companyId, isHeadquarters: true } }))?.id;
    const serie = 'COT-001';

    const quotation = await prisma.$transaction(async (tx) => {
      const lastDoc = await tx.sale.findFirst({
        where: { companyId, documentSerie: serie },
        orderBy: { documentNumber: 'desc' },
        select: { documentNumber: true },
      });
      const nextNum = lastDoc ? String(Number(lastDoc.documentNumber) + 1).padStart(7, '0') : '0000001';

      const itemsData = data.items.map((item, idx) => {
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        const dr = Number(item.discountRate || 0);
        const tr = Number(item.taxRate || 10);
        const lineDiscount = dr > 0 ? (qty * price * dr) / 100 : 0;
        const lineSubtotal = qty * price - lineDiscount;
        const lineTax = tr > 0 ? (lineSubtotal * tr) / 100 : 0;
        return { productId: item.productId, lineNumber: idx + 1, description: item.description || null, quantity: qty, unitPrice: price, discountType: 'percentage', discountRate: dr, discount: lineDiscount, taxRate: tr, subtotal: lineSubtotal, tax: lineTax, total: lineSubtotal + lineTax, unitTypeId: item.unitTypeId || null };
      });

      let subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);
      let discount = itemsData.reduce((s, i) => s + i.discount, 0);
      const tax = itemsData.reduce((s, i) => s + i.tax, 0);
      const total = subtotal + tax;

      return tx.sale.create({
      data: {
        companyId, sucursalId, customerId: data.customerId, userId,
        documentType: 'quotation', documentSerie: serie, documentNumber: nextNum,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.validUntil ? new Date(data.validUntil) : null,
        currencyCode: data.currencyCode || 'PYG', exchangeRate: 1,
        subtotal, tax, discount, total, status: 'draft',
        notes: data.notes || null,
        items: { create: itemsData },
      },
      include: {
        customer: { select: { id: true, businessName: true } },
        items: { include: { product: { select: { id: true, sku: true, name: true } } } },
      },
    });
    });

    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Quotation', entityId: quotation.id, newValues: { docNumber: quotation.documentNumber, customerId: data.customerId, total: Number(quotation.total) } });
    logger.info(`Quotation ${serie}-${quotation.documentNumber} created by ${userId}`);
    return new SaleResponseDTO(quotation);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Cotización', id);
    if (existing.status !== 'draft') throw new ConflictError('Solo se pueden editar cotizaciones en borrador');

    await prisma.saleItem.deleteMany({ where: { saleId: id } });

    const itemsData = data.items.map((item, idx) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const dr = Number(item.discountRate || 0);
      const tr = Number(item.taxRate || 10);
      const lineDiscount = dr > 0 ? (qty * price * dr) / 100 : 0;
      const lineSubtotal = qty * price - lineDiscount;
      const lineTax = tr > 0 ? (lineSubtotal * tr) / 100 : 0;
      return { productId: item.productId, lineNumber: idx + 1, description: item.description || null, quantity: qty, unitPrice: price, discountType: 'percentage', discountRate: dr, discount: lineDiscount, taxRate: tr, subtotal: lineSubtotal, tax: lineTax, total: lineSubtotal + lineTax, unitTypeId: item.unitTypeId || null };
    });

    let subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);
    let discount = itemsData.reduce((s, i) => s + i.discount, 0);
    const tax = itemsData.reduce((s, i) => s + i.tax, 0);
    const total = subtotal + tax;

    await this.repository.update(id, {
      customerId: data.customerId, issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      dueDate: data.validUntil ? new Date(data.validUntil) : null,
      notes: data.notes, updatedBy: userId, status: data.status || existing.status,
      subtotal, tax, discount, total, items: { create: itemsData },
    });

    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'Quotation', entityId: id, oldValues: { status: existing.status }, newValues: { total } });
    logger.info(`Quotation ${id} updated by ${userId}`);
    const full = await this.repository.findById(id);
    return new SaleResponseDTO(full);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Cotización', id);
    if (existing.status === 'accepted' || existing.status === 'cancelled') throw new ConflictError('No se puede cancelar una cotización aceptada o ya cancelada');
    await this.repository.softDelete(id, userId);
    await createAuditLog({ userId, companyId, action: 'CANCEL', entity: 'Quotation', entityId: id, oldValues: { status: existing.status } });
    logger.info(`Quotation ${id} cancelled by ${userId}`);
  }

  async accept(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Cotización', id);
    if (existing.status !== 'draft') throw new ConflictError('Solo se pueden aceptar cotizaciones en borrador');
    await this.repository.update(id, { status: 'accepted', updatedBy: userId });
    await createAuditLog({ userId, companyId, action: 'ACCEPT', entity: 'Quotation', entityId: id, newValues: { status: 'accepted' } });
    logger.info(`Quotation ${id} accepted by ${userId}`);
    return { status: 'accepted' };
  }

  async convertToSale(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Cotización', id);
    if (existing.status !== 'accepted') throw new ConflictError('Solo se pueden convertir cotizaciones aceptadas');

    const saleSerie = 'FAC-001';
    const lastSale = await prisma.sale.findFirst({
      where: { companyId, documentSerie: saleSerie, documentType: 'invoice', deletedAt: null },
      orderBy: { documentNumber: 'desc' }, select: { documentNumber: true },
    });
    const nextNum = lastSale ? String(Number(lastSale.documentNumber) + 1).padStart(7, '0') : '0000001';

    const sale = await prisma.sale.create({
      data: {
        companyId: existing.companyId, sucursalId: existing.sucursalId,
        customerId: existing.customerId, userId,
        documentType: 'invoice', documentSerie: saleSerie, documentNumber: nextNum,
        issueDate: new Date(), currencyCode: existing.currencyCode || 'PYG', exchangeRate: 1,
        subtotal: Number(existing.subtotal), tax: Number(existing.tax), discount: Number(existing.discount), total: Number(existing.total),
        status: 'draft', notes: `Convertido de cotización ${existing.documentSerie}-${existing.documentNumber}`,
        items: {
          create: existing.items.map((item) => ({
            productId: item.productId, lineNumber: item.lineNumber,
            description: item.description || null, quantity: Number(item.quantity), unitTypeId: item.unitTypeId || null,
            unitPrice: Number(item.unitPrice), discountType: item.discountType || 'percentage', discountRate: Number(item.discountRate || 0),
            discount: Number(item.discount || 0), taxRate: Number(item.taxRate || 10), subtotal: Number(item.subtotal), tax: Number(item.tax || 0), total: Number(item.total),
          })),
        },
      },
      include: { customer: { select: { id: true, businessName: true } }, items: { include: { product: { select: { id: true, sku: true, name: true } } } } },
    });

    await this.repository.update(id, { status: 'converted', updatedBy: userId });
    await createAuditLog({ userId, companyId, action: 'CONVERT', entity: 'Quotation', entityId: id, newValues: { saleId: sale.id } });
    logger.info(`Quotation ${id} converted to sale ${sale.id} by ${userId}`);
    return new SaleResponseDTO(sale);
  }

  async generatePdf(id, companyId) {
    const q = await this.repository.findById(id);
    if (!q || q.companyId !== companyId) throw new NotFoundError('Cotización', id);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    return new Promise((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (n) => `Gs. ${Number(n).toLocaleString('es-PY')}`;
      doc.fontSize(16).font('Helvetica-Bold').text('COTIZACIÓN', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text(`${q.documentSerie}-${q.documentNumber}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#333');
      doc.text(`Fecha: ${new Date(q.issueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      if (q.dueDate) doc.text(`Válida hasta: ${new Date(q.dueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      doc.text(`Estado: ${q.status}`, { align: 'right' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1F2937').text('Cliente:');
      doc.fontSize(9).font('Helvetica').fillColor('#374151').text(q.customer?.businessName || '').text(q.customer?.documentNumber || '');
      doc.moveDown(0.8);

      const headers = ['#', 'Producto', 'SKU', 'Cant.', 'P. Unit.', 'Dscto %', 'Subtotal'];
      const colW = [16, 150, 60, 40, 65, 45, 55];
      const startX = 40;
      let y = doc.y;
      doc.rect(startX, y, 431, 14).fill('#7C3AED');
      let x = startX;
      headers.forEach((h, i) => { doc.fillColor('#FFF').fontSize(7).font('Helvetica-Bold').text(h, x + 2, y + 3, { width: colW[i], align: i >= 3 ? 'right' : 'left' }); x += colW[i]; });
      y += 14;
      q.items.forEach((item, idx) => {
        if (y > 730) { doc.addPage(); y = 40; }
        if (idx % 2 === 0) doc.rect(startX, y - 2, 431, 14).fill('#F9FAFB');
        x = startX;
        [String(idx + 1), item.product?.name || '', item.product?.sku || '', String(Number(item.quantity)), fmt(item.unitPrice), `${item.discountRate || 0}%`, fmt(item.subtotal)].forEach((v, i) => { doc.fillColor('#1F2937').fontSize(7).font('Helvetica').text(v, x + 2, y, { width: colW[i], align: i >= 3 ? 'right' : 'left' }); x += colW[i]; });
        y += 14;
      });
      y += 10;
      doc.rect(startX, y - 4, 431, 0.5).fill('#D1D5DB');
      y += 6;
      [
        { label: 'Subtotal', value: fmt(q.subtotal) },
        { label: 'Descuento', value: `-${fmt(q.discount)}` },
        { label: 'IVA (10%)', value: fmt(q.tax) },
        { label: 'TOTAL', value: fmt(q.total), bold: true },
      ].forEach((t) => {
        doc.fontSize(t.bold ? 11 : 9).font(t.bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.fillColor('#1F2937').text(t.label, 320, y);
        doc.text(t.value, 385, y, { align: 'right', width: 86 });
        y += t.bold ? 18 : 14;
      });
      if (q.notes) { y += 10; doc.fontSize(8).font('Helvetica').fillColor('#666').text(`Notas: ${q.notes}`, startX, y); }
      doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text(`Generado: ${new Date().toLocaleString('es-PY')}`, startX, 780);
      doc.end();
    });
  }
}
