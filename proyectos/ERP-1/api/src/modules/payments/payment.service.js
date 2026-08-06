import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import { PaymentRepository } from './payment.repository.js';
import { PaymentResponseDTO } from './payment.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class PaymentService {
  constructor() { this.repository = new PaymentRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { saleId, dateFrom, dateTo } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, saleId, dateFrom, dateTo });
    return { data: data.map((p) => new PaymentResponseDTO(p)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async create(data, userId, companyId) {
    const sale = await prisma.sale.findUnique({ where: { id: data.saleId } });
    if (!sale || sale.companyId !== companyId) throw new NotFoundError('Venta', data.saleId);
    if (sale.status === 'cancelled') throw new ConflictError('No se pueden registrar pagos en ventas canceladas');

    const totalPaid = await this.repository.getSaleTotalPaid(data.saleId);
    const newTotalPaid = totalPaid + Number(data.amount);
    const saleTotal = Number(sale.total);

    if (newTotalPaid > saleTotal) throw new ConflictError('El pago excede el saldo pendiente');

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          ...data,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          companyId,
        },
      });

      const newStatus = newTotalPaid >= saleTotal ? 'paid' : 'partially_paid';
      if (sale.status !== newStatus) {
        await tx.sale.update({ where: { id: data.saleId }, data: { status: newStatus, updatedBy: userId } });
      }

      return payment;
    });

    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Payment', entityId: result.id, newValues: { saleId: data.saleId, amount: data.amount } });
    logger.info(`Payment ${result.id} created for sale ${data.saleId} by ${userId}`);
    return new PaymentResponseDTO(result);
  }

  async findById(id, companyId) {
    const payment = await this.repository.findById(id);
    if (!payment || payment.companyId !== companyId) throw new NotFoundError('Pago', id);
    return new PaymentResponseDTO(payment);
  }
}
