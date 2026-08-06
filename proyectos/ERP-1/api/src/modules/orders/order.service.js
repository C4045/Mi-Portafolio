import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { OrderRepository } from './order.repository.js';
import { SaleResponseDTO } from '../sales/sale.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class OrderService {
  constructor() { this.repository = new OrderRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, status, customerId, dateFrom, dateTo } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, customerId, dateFrom, dateTo });
    return { data: data.map((s) => new SaleResponseDTO(s)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async findById(id, companyId) {
    const o = await this.repository.findById(id);
    if (!o || o.companyId !== companyId) throw new NotFoundError('Pedido', id);
    return new SaleResponseDTO(o);
  }

  async create(data, userId, companyId) {
    const sucursalId = data.sucursalId || (await prisma.sucursal.findFirst({ where: { companyId, isHeadquarters: true } }))?.id;
    const serie = 'PED-001';

    const order = await prisma.$transaction(async (tx) => {
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
          documentType: 'order', documentSerie: serie, documentNumber: nextNum,
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes || null, currencyCode: 'PYG', exchangeRate: 1,
          subtotal, tax, discount, total, status: 'draft',
          items: { create: itemsData },
        },
        include: { customer: { select: { id: true, businessName: true } }, items: { include: { product: { select: { id: true, sku: true, name: true } } } } },
      });
    });

    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Order', entityId: order.id, newValues: { docNumber: order.documentNumber, customerId: data.customerId, total: Number(order.total) } });
    logger.info(`Order ${serie}-${order.documentNumber} created by ${userId}`);
    return new SaleResponseDTO(order);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Pedido', id);
    if (existing.status !== 'draft') throw new ConflictError('Solo se pueden editar pedidos en borrador');

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
      dueDate: data.dueDate ? new Date(data.dueDate) : null, notes: data.notes, updatedBy: userId,
      subtotal, tax, discount, total, status: data.status || existing.status, items: { create: itemsData },
    });

    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'Order', entityId: id, oldValues: { status: existing.status }, newValues: { total } });
    logger.info(`Order ${id} updated by ${userId}`);
    const full = await this.repository.findById(id);
    return new SaleResponseDTO(full);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Pedido', id);
    if (existing.status === 'fulfilled' || existing.status === 'cancelled') throw new ConflictError('No se puede cancelar un pedido cumplido o ya cancelado');
    await this.repository.softDelete(id, userId);
    await createAuditLog({ userId, companyId, action: 'CANCEL', entity: 'Order', entityId: id, oldValues: { status: existing.status } });
    logger.info(`Order ${id} cancelled by ${userId}`);
  }

  async confirm(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Pedido', id);
    if (existing.status !== 'draft') throw new ConflictError('Solo se pueden confirmar pedidos en borrador');
    await this.repository.update(id, { status: 'confirmed', updatedBy: userId });
    await createAuditLog({ userId, companyId, action: 'CONFIRM', entity: 'Order', entityId: id, newValues: { status: 'confirmed' } });
    logger.info(`Order ${id} confirmed by ${userId}`);
    return { status: 'confirmed' };
  }

  async fulfill(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Pedido', id);
    if (existing.status !== 'confirmed') throw new ConflictError('Solo se pueden cumplir pedidos confirmados');

    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const currentStock = Number(product.currentStock);
        const qty = Number(item.quantity);
        if (currentStock < qty) throw new ConflictError(`Stock insuficiente para ${product.name || product.sku}`);
        const newStock = currentStock - qty;
        await tx.product.update({ where: { id: item.productId }, data: { currentStock: newStock, updatedBy: userId } });
        await tx.inventoryMovement.create({
          data: { companyId, productId: item.productId, movementType: 'sale_out', referenceType: 'order', referenceId: id, quantity: -qty, unitCost: Number(item.unitPrice), totalCost: -qty * Number(item.unitPrice), stockBefore: currentStock, stockAfter: newStock, notes: `Pedido ${existing.documentSerie}-${existing.documentNumber}`, userId },
        });
      }
      await tx.sale.update({ where: { id }, data: { status: 'fulfilled', updatedBy: userId } });
    });

    await createAuditLog({ userId, companyId, action: 'FULFILL', entity: 'Order', entityId: id, newValues: { status: 'fulfilled' } });
    logger.info(`Order ${id} fulfilled by ${userId}`);
    return { status: 'fulfilled' };
  }

  async generatePdf(id, companyId) {
    const o = await this.repository.findById(id);
    if (!o || o.companyId !== companyId) throw new NotFoundError('Pedido', id);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    return new Promise((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      const fmt = (n) => `Gs. ${Number(n).toLocaleString('es-PY')}`;
      doc.fontSize(16).font('Helvetica-Bold').text('PEDIDO', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text(`${o.documentSerie}-${o.documentNumber}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#333');
      doc.text(`Fecha: ${new Date(o.issueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      if (o.dueDate) doc.text(`Entrega: ${new Date(o.dueDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      doc.text(`Estado: ${o.status}`, { align: 'right' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1F2937').text('Cliente:');
      doc.fontSize(9).font('Helvetica').fillColor('#374151').text(o.customer?.businessName || '').text(o.customer?.documentNumber || '');
      doc.moveDown(0.8);
      const headers = ['#', 'Producto', 'SKU', 'Cant.', 'P. Unit.', 'Dscto %', 'Subtotal'];
      const colW = [16, 150, 60, 40, 65, 45, 55];
      const startX = 40; let y = doc.y;
      doc.rect(startX, y, 431, 14).fill('#2563EB');
      let x = startX;
      headers.forEach((h, i) => { doc.fillColor('#FFF').fontSize(7).font('Helvetica-Bold').text(h, x + 2, y + 3, { width: colW[i], align: i >= 3 ? 'right' : 'left' }); x += colW[i]; });
      y += 14;
      o.items.forEach((item, idx) => {
        if (y > 730) { doc.addPage(); y = 40; }
        if (idx % 2 === 0) doc.rect(startX, y - 2, 431, 14).fill('#F9FAFB');
        x = startX;
        [String(idx + 1), item.product?.name || '', item.product?.sku || '', String(Number(item.quantity)), fmt(item.unitPrice), `${item.discountRate || 0}%`, fmt(item.subtotal)].forEach((v, i) => { doc.fillColor('#1F2937').fontSize(7).font('Helvetica').text(v, x + 2, y, { width: colW[i], align: i >= 3 ? 'right' : 'left' }); x += colW[i]; });
        y += 14;
      });
      y += 10;
      doc.rect(startX, y - 4, 431, 0.5).fill('#D1D5DB');
      y += 6;
      [{ label: 'Subtotal', value: fmt(o.subtotal) }, { label: 'Descuento', value: `-${fmt(o.discount)}` }, { label: 'IVA (10%)', value: fmt(o.tax) }, { label: 'TOTAL', value: fmt(o.total), bold: true }].forEach((t) => {
        doc.fontSize(t.bold ? 11 : 9).font(t.bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.fillColor('#1F2937').text(t.label, 320, y); doc.text(t.value, 385, y, { align: 'right', width: 86 });
        y += t.bold ? 18 : 14;
      });
      if (o.notes) { y += 10; doc.fontSize(8).font('Helvetica').fillColor('#666').text(`Notas: ${o.notes}`, startX, y); }
      doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text(`Generado: ${new Date().toLocaleString('es-PY')}`, startX, 780);
      doc.end();
    });
  }
}
