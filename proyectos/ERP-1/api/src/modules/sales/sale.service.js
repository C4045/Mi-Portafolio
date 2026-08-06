import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { SaleRepository } from './sale.repository.js';
import { SaleResponseDTO } from './sale.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class SaleService {
  constructor() { this.repository = new SaleRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, status, customerId, dateFrom, dateTo } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, customerId, dateFrom, dateTo });
    return { data: data.map((s) => new SaleResponseDTO(s)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async findById(id, companyId) {
    const sale = await this.repository.findById(id);
    if (!sale || sale.companyId !== companyId) throw new NotFoundError('Venta', id);
    return new SaleResponseDTO(sale);
  }

  async create(data, userId, companyId) {
    const sucursalId = data.sucursalId || (await prisma.sucursal.findFirst({ where: { companyId, isHeadquarters: true } }))?.id;

    const serie = 'FAC-001';

    const sale = await prisma.$transaction(async (tx) => {
      const lastDoc = await tx.sale.findFirst({
        where: { companyId, documentSerie: serie },
        orderBy: { documentNumber: 'desc' },
        select: { documentNumber: true },
      });
      const nextNum = lastDoc ? String(Number(lastDoc.documentNumber) + 1).padStart(7, '0') : '0000001';

      const itemsData = data.items.map((item, idx) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const discountRate = Number(item.discountRate || 0);
        const taxRate = Number(item.taxRate || 10);
        const lineDiscount = discountRate > 0 ? (quantity * unitPrice * discountRate) / 100 : 0;
        const lineSubtotal = quantity * unitPrice - lineDiscount;
        const lineTax = taxRate > 0 ? (lineSubtotal * taxRate) / 100 : 0;
        const lineTotal = lineSubtotal + lineTax;

        return {
          productId: item.productId,
          lineNumber: idx + 1,
          description: item.description || null,
          quantity,
          unitTypeId: item.unitTypeId || null,
          unitPrice,
          discountType: 'percentage',
          discountRate,
          discount: lineDiscount,
          taxRate,
          subtotal: lineSubtotal,
          tax: lineTax,
          total: lineTotal,
        };
      });

      let subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);
      let discount = itemsData.reduce((s, i) => s + i.discount, 0);
      let tax = itemsData.reduce((s, i) => s + i.tax, 0);

      const headerDiscountType = data.discountType || 'percentage';
      const headerDiscountRate = Number(data.discountRate || 0);
      let headerDiscount = 0;
      if (headerDiscountRate > 0) {
        headerDiscount = headerDiscountType === 'percentage'
          ? (subtotal * headerDiscountRate) / 100
          : Math.min(headerDiscountRate, subtotal);
        discount += headerDiscount;
      }

      const total = subtotal - headerDiscount + tax;

      return tx.sale.create({
        data: {
          companyId, sucursalId, customerId: data.customerId, userId,
          documentType: 'invoice', documentSerie: serie, documentNumber: nextNum,
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          paymentTerm: data.paymentTerm || null,
          currencyCode: data.currencyCode || 'PYG',
          exchangeRate: data.exchangeRate ?? 1,
          subtotal, tax, discount, discountType: headerDiscountType, discountRate: headerDiscountRate, total,
          status: 'draft', notes: data.notes || null, internalNotes: data.internalNotes || null,
          items: { create: itemsData },
        },
        include: {
          customer: { select: { id: true, businessName: true, documentNumber: true } },
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        },
      });
    });

    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Sale', entityId: sale.id, newValues: { docNumber: sale.documentNumber, customerId: data.customerId, total: Number(sale.total) } });
    logger.info(`Sale ${serie}-${nextNum} created by ${userId}`);
    return new SaleResponseDTO(sale);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Venta', id);
    if (existing.status !== 'draft') throw new ConflictError('Solo se pueden editar ventas en borrador');

    await prisma.saleItem.deleteMany({ where: { saleId: id } });

    const itemsData = data.items.map((item, idx) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discountRate = Number(item.discountRate || 0);
      const taxRate = Number(item.taxRate || 10);
      const lineDiscount = discountRate > 0 ? (quantity * unitPrice * discountRate) / 100 : 0;
      const lineSubtotal = quantity * unitPrice - lineDiscount;
      const lineTax = taxRate > 0 ? (lineSubtotal * taxRate) / 100 : 0;
      const lineTotal = lineSubtotal + lineTax;
      return { productId: item.productId, lineNumber: idx + 1, description: item.description || null, quantity, unitPrice, discountType: 'percentage', discountRate, discount: lineDiscount, taxRate, subtotal: lineSubtotal, tax: lineTax, total: lineTotal, unitTypeId: item.unitTypeId || null };
    });

    let subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);
    let discount = itemsData.reduce((s, i) => s + i.discount, 0);
    let tax = itemsData.reduce((s, i) => s + i.tax, 0);

    const headerDiscountType = data.discountType || existing.discountType;
    const headerDiscountRate = Number(data.discountRate ?? existing.discountRate);
    let headerDiscount = 0;
    if (headerDiscountRate > 0) {
      headerDiscount = headerDiscountType === 'percentage'
        ? (subtotal * headerDiscountRate) / 100
        : Math.min(headerDiscountRate, subtotal);
      discount += headerDiscount;
    }

    const total = subtotal - headerDiscount + tax;

    const updated = await this.repository.update(id, {
      customerId: data.customerId,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paymentTerm: data.paymentTerm,
      currencyCode: data.currencyCode,
      exchangeRate: data.exchangeRate,
      subtotal, tax, discount, discountType: headerDiscountType, discountRate: headerDiscountRate, total,
      notes: data.notes, internalNotes: data.internalNotes, updatedBy: userId,
      status: data.status || existing.status,
      items: { create: itemsData },
    });

    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'Sale', entityId: id, oldValues: { status: existing.status }, newValues: { total, status: data.status } });
    logger.info(`Sale ${id} updated by ${userId}`);
    const full = await this.repository.findById(id);
    return new SaleResponseDTO(full);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Venta', id);
    if (existing.status === 'paid' || existing.status === 'invoiced' || existing.status === 'cancelled') throw new ConflictError('No se puede cancelar una venta pagada, facturada o ya cancelada');
    await this.repository.softDelete(id, userId);
    await createAuditLog({ userId, companyId, action: 'CANCEL', entity: 'Sale', entityId: id, oldValues: { status: existing.status } });
    logger.info(`Sale ${id} cancelled by ${userId}`);
  }

  async confirm(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Venta', id);
    if (existing.status !== 'draft') throw new ConflictError('Solo se pueden confirmar ventas en borrador');

    const result = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const currentStock = Number(product.currentStock);
        const qty = Number(item.quantity);
        if (currentStock < qty) throw new ConflictError(`Stock insuficiente para ${product.name || product.sku}. Disponible: ${currentStock}, requerido: ${qty}`);

        const newStock = currentStock - qty;
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock, updatedBy: userId },
        });

        await tx.inventoryMovement.create({
          data: {
            companyId, productId: item.productId, movementType: 'sale_out',
            referenceType: 'sale', referenceId: id,
            quantity: -qty, unitCost: Number(item.unitPrice),
            totalCost: -qty * Number(item.unitPrice),
            stockBefore: currentStock, stockAfter: newStock,
            notes: `Venta ${existing.documentSerie}-${existing.documentNumber}`,
            userId,
          },
        });
      }

      await tx.sale.update({
        where: { id },
        data: { status: 'confirmed', updatedBy: userId },
      });

      return { status: 'confirmed' };
    });

    await createAuditLog({ userId, companyId, action: 'CONFIRM', entity: 'Sale', entityId: id, newValues: { status: 'confirmed' } });
    logger.info(`Sale ${id} confirmed by ${userId}`);
    return result;
  }

  async generatePdf(id, companyId) {
    const sale = await this.repository.findById(id);
    if (!sale || sale.companyId !== companyId) throw new NotFoundError('Venta', id);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    return new Promise((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const formatGs = (n) => `Gs. ${Number(n).toLocaleString('es-PY')}`;

      doc.fontSize(16).font('Helvetica-Bold').text('FACTURA / VENTA', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#666')
        .text(`N° ${sale.documentSerie}-${sale.documentNumber}`, { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(8).fillColor('#333');
      doc.text(`Fecha: ${new Date(sale.issueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      if (sale.dueDate) doc.text(`Vencimiento: ${new Date(sale.dueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      doc.text(`Estado: ${sale.status}`, { align: 'right' });
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1F2937').text('Cliente:');
      doc.fontSize(9).font('Helvetica').fillColor('#374151')
        .text(sale.customer.businessName || `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim())
        .text(`Documento: ${sale.customer.documentNumber}`)
        .text(sale.customer.address || '')
        .text(`${sale.customer.phone || ''} ${sale.customer.email || ''}`);
      doc.moveDown(0.8);

      const headers = ['#', 'Producto', 'SKU', 'Cant.', 'P. Unit.', 'Dscto %', 'Subtotal'];
      const colW = [16, 150, 60, 40, 65, 45, 55];
      const startX = 40;
      let y = doc.y;

      doc.rect(startX, y, 431, 14).fill('#059669');
      let x = startX;
      headers.forEach((h, i) => {
        doc.fillColor('#FFF').fontSize(7).font('Helvetica-Bold').text(h, x + 2, y + 3, { width: colW[i], align: i >= 3 ? 'right' : 'left' });
        x += colW[i];
      });
      y += 14;

      sale.items.forEach((item, idx) => {
        if (y > 730) { doc.addPage(); y = 40; }
        if (idx % 2 === 0) doc.rect(startX, y - 2, 431, 14).fill('#F9FAFB');
        x = startX;
        const vals = [String(idx + 1), item.product?.name || '', item.product?.sku || '', String(Number(item.quantity)), formatGs(item.unitPrice), `${item.discountRate || 0}%`, formatGs(item.subtotal)];
        vals.forEach((v, i) => {
          doc.fillColor('#1F2937').fontSize(7).font('Helvetica').text(v, x + 2, y, { width: colW[i], align: i >= 3 ? 'right' : 'left' });
          x += colW[i];
        });
        y += 14;
      });

      y += 10;
      doc.rect(startX, y - 4, 431, 0.5).fill('#D1D5DB');
      y += 6;
      const totals = [
        { label: 'Subtotal', value: formatGs(sale.subtotal) },
        { label: 'Descuento', value: `-${formatGs(sale.discount)}` },
        { label: 'IVA (10%)', value: formatGs(sale.tax) },
        { label: 'TOTAL', value: formatGs(sale.total), bold: true },
      ];
      totals.forEach((t) => {
        doc.fontSize(t.bold ? 11 : 9).font(t.bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.fillColor('#1F2937').text(t.label, 320, y);
        doc.text(t.value, 385, y, { align: 'right', width: 86 });
        y += t.bold ? 18 : 14;
      });

      if (sale.notes) {
        y += 10;
        doc.fontSize(8).font('Helvetica').fillColor('#666').text(`Notas: ${sale.notes}`, startX, y);
      }

      doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text(`Generado: ${new Date().toLocaleString('es-PY')}`, startX, 780);
      doc.end();
    });
  }
}
