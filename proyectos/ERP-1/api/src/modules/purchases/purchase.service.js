import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { PurchaseRepository } from './purchase.repository.js';
import { PurchaseResponseDTO } from './purchase.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class PurchaseService {
  constructor() { this.repository = new PurchaseRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, status, supplierId, dateFrom, dateTo } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, supplierId, dateFrom, dateTo });
    return { data: data.map((p) => new PurchaseResponseDTO(p)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async findById(id, companyId) {
    const purchase = await this.repository.findById(id);
    if (!purchase || purchase.companyId !== companyId) throw new NotFoundError('Orden de compra', id);
    return new PurchaseResponseDTO(purchase);
  }

  async create(data, userId, companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const sucursalId = data.sucursalId || (await prisma.sucursal.findFirst({ where: { companyId, isHeadquarters: true } }))?.id;

    const serie = 'POC-001';

    const purchase = await prisma.$transaction(async (tx) => {
      const lastDoc = await tx.purchase.findFirst({
        where: { companyId, documentSerie: serie },
        orderBy: { documentNumber: 'desc' },
        select: { documentNumber: true },
      });
      const nextNum = lastDoc ? String(Number(lastDoc.documentNumber) + 1).padStart(7, '0') : '0000001';

      const itemsData = data.items.map((item, idx) => {
        const quantity = Number(item.quantity);
        const unitCost = Number(item.unitCost);
        const discountRate = Number(item.discountRate || 0);
        const taxRate = Number(item.taxRate || 10);
        const lineDiscount = discountRate > 0 ? (quantity * unitCost * discountRate) / 100 : 0;
        const lineSubtotal = quantity * unitCost - lineDiscount;
        const lineTax = taxRate > 0 ? (lineSubtotal * taxRate) / 100 : 0;
        const lineTotal = lineSubtotal + lineTax;

        return {
          productId: item.productId,
          lineNumber: idx + 1,
          description: item.description || null,
          quantity,
          unitTypeId: item.unitTypeId || null,
          unitCost,
          discountRate,
          discount: lineDiscount,
          taxRate,
          subtotal: lineSubtotal,
          tax: lineTax,
          total: lineTotal,
        };
      });

      const subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);
      const discount = itemsData.reduce((s, i) => s + i.discount, 0);
      const tax = itemsData.reduce((s, i) => s + i.tax, 0);
      const total = itemsData.reduce((s, i) => s + i.total, 0);

      return tx.purchase.create({
        data: {
          companyId, sucursalId, supplierId: data.supplierId, userId,
          documentType: 'purchase_order', documentSerie: serie, documentNumber: nextNum,
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          subtotal, discount, tax, total,
          status: 'draft', notes: data.notes || null,
          items: { create: itemsData },
        },
        include: {
          supplier: { select: { id: true, businessName: true } },
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        },
      });
    });

    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Purchase', entityId: purchase.id, newValues: { docNumber: nextNum, supplierId: data.supplierId, total } });
    logger.info(`Purchase ${serie}-${nextNum} created by ${userId}`);
    return new PurchaseResponseDTO(purchase);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Orden de compra', id);
    if (existing.status !== 'draft') throw new ConflictError('Solo se pueden editar órdenes en borrador');

    await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });

    const itemsData = data.items.map((item, idx) => {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      const discountRate = Number(item.discountRate || 0);
      const taxRate = Number(item.taxRate || 10);
      const lineDiscount = discountRate > 0 ? (quantity * unitCost * discountRate) / 100 : 0;
      const lineSubtotal = quantity * unitCost - lineDiscount;
      const lineTax = taxRate > 0 ? (lineSubtotal * taxRate) / 100 : 0;
      const lineTotal = lineSubtotal + lineTax;
      return { productId: item.productId, lineNumber: idx + 1, description: item.description || null, quantity, unitCost, discountRate, discount: lineDiscount, taxRate, subtotal: lineSubtotal, tax: lineTax, total: lineTotal, unitTypeId: item.unitTypeId || null };
    });

    const subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);
    const discount = itemsData.reduce((s, i) => s + i.discount, 0);
    const tax = itemsData.reduce((s, i) => s + i.tax, 0);
    const total = itemsData.reduce((s, i) => s + i.total, 0);

    const updated = await this.repository.update(id, {
      supplierId: data.supplierId, orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      subtotal, discount, tax, total, notes: data.notes, updatedBy: userId,
      status: data.status || existing.status,
      items: { create: itemsData },
    });

    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'Purchase', entityId: id, oldValues: { status: existing.status }, newValues: { total, status: data.status } });
    logger.info(`Purchase ${id} updated by ${userId}`);
    const full = await this.repository.findById(id);
    return new PurchaseResponseDTO(full);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Orden de compra', id);
    if (existing.status === 'received' || existing.status === 'cancelled') throw new ConflictError('No se puede cancelar una orden recibida o ya cancelada');
    await this.repository.softDelete(id, userId);
    await createAuditLog({ userId, companyId, action: 'CANCEL', entity: 'Purchase', entityId: id, oldValues: { status: existing.status } });
    logger.info(`Purchase ${id} cancelled by ${userId}`);
  }

  async receiveItems(id, data, userId, companyId) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) throw new NotFoundError('Orden de compra', id);
    if (existing.status === 'cancelled') throw new ConflictError('No se puede recibir una orden cancelada');
    if (existing.status === 'received') throw new ConflictError('La orden ya fue recibida completamente');

    const result = await prisma.$transaction(async (tx) => {
      let allReceived = true;

      for (const receive of data.items) {
        const item = existing.items.find((i) => i.id === receive.itemId);
        if (!item) continue;

        const newReceived = Math.min(Number(item.quantity), Number(item.receivedQty) + Number(receive.quantity));
        const receivedDiff = newReceived - Number(item.receivedQty);

        await tx.purchaseItem.update({
          where: { id: item.id },
          data: { receivedQty: newReceived },
        });

        if (receivedDiff > 0) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          const currentStock = Number(product.currentStock);
          const newStock = currentStock + receivedDiff;

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock, updatedBy: userId },
          });

          await tx.inventoryMovement.create({
            data: {
              companyId, productId: item.productId, movementType: 'purchase_in',
              referenceType: 'purchase', referenceId: id,
              quantity: receivedDiff, unitCost: Number(item.unitCost),
              totalCost: receivedDiff * Number(item.unitCost),
              stockBefore: currentStock, stockAfter: newStock,
              notes: `Recepción OC ${existing.documentSerie}-${existing.documentNumber}`,
              userId,
            },
          });
        }

        if (newReceived < Number(item.quantity)) allReceived = false;
      }

      const newStatus = allReceived ? 'received' : 'partially_received';
      await tx.purchase.update({
        where: { id },
        data: { status: newStatus, updatedBy: userId },
      });

      return { status: newStatus, allReceived };
    });

    await createAuditLog({ userId, companyId, action: 'RECEIVE', entity: 'Purchase', entityId: id, newValues: { status: result.status } });
    logger.info(`Purchase ${id} received (status: ${result.status}) by ${userId}`);
    return result;
  }

  async generatePdf(id, companyId) {
    const purchase = await this.repository.findById(id);
    if (!purchase || purchase.companyId !== companyId) throw new NotFoundError('Orden de compra', id);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    return new Promise((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const formatGs = (n) => `Gs. ${Number(n).toLocaleString('es-PY')}`;

      doc.fontSize(16).font('Helvetica-Bold').text('ORDEN DE COMPRA', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#666')
        .text(`N° ${purchase.documentSerie}-${purchase.documentNumber}`, { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(8).fillColor('#333');
      doc.text(`Fecha: ${new Date(purchase.orderDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      if (purchase.expectedDate) doc.text(`Esperada: ${new Date(purchase.expectedDate).toLocaleDateString('es-PY')}`, { align: 'right' });
      doc.text(`Estado: ${purchase.status}`, { align: 'right' });
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1F2937').text('Proveedor:');
      doc.fontSize(9).font('Helvetica').fillColor('#374151')
        .text(purchase.supplier.businessName)
        .text(`RUC: ${purchase.supplier.documentNumber}`)
        .text(purchase.supplier.address || '')
        .text(`${purchase.supplier.phone || ''} ${purchase.supplier.email || ''}`);
      doc.moveDown(0.8);

      const headers = ['#', 'Producto', 'SKU', 'Cant.', 'Costo Unit.', 'Dscto %', 'Subtotal'];
      const colW = [16, 150, 60, 40, 65, 45, 55];
      const startX = 40;
      let y = doc.y;

      doc.rect(startX, y, 431, 14).fill('#4F46E5');
      let x = startX;
      headers.forEach((h, i) => {
        doc.fillColor('#FFF').fontSize(7).font('Helvetica-Bold').text(h, x + 2, y + 3, { width: colW[i], align: i >= 3 ? 'right' : 'left' });
        x += colW[i];
      });
      y += 14;

      purchase.items.forEach((item, idx) => {
        if (y > 730) { doc.addPage(); y = 40; }
        if (idx % 2 === 0) doc.rect(startX, y - 2, 431, 14).fill('#F9FAFB');
        x = startX;
        const vals = [String(idx + 1), item.product?.name || '', item.product?.sku || '', String(Number(item.quantity)), formatGs(item.unitCost), `${item.discountRate || 0}%`, formatGs(item.subtotal)];
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
        { label: 'Subtotal', value: formatGs(purchase.subtotal) },
        { label: 'Descuento', value: `-${formatGs(purchase.discount)}` },
        { label: 'IVA (10%)', value: formatGs(purchase.tax) },
        { label: 'TOTAL', value: formatGs(purchase.total), bold: true },
      ];
      totals.forEach((t) => {
        doc.fontSize(t.bold ? 11 : 9).font(t.bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.fillColor('#1F2937').text(t.label, 320, y);
        doc.text(t.value, 385, y, { align: 'right', width: 86 });
        y += t.bold ? 18 : 14;
      });

      if (purchase.notes) {
        y += 10;
        doc.fontSize(8).font('Helvetica').fillColor('#666').text(`Notas: ${purchase.notes}`, startX, y);
      }

      doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text(`Generado: ${new Date().toLocaleString('es-PY')}`, startX, 780);
      doc.end();
    });
  }
}
