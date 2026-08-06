import { prisma } from '../../config/database.js';

export class PaymentRepository {
  async findAll({ companyId, page, limit, skip, saleId, dateFrom, dateTo }) {
    const where = { companyId };
    if (saleId) where.saleId = saleId;
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) where.paymentDate.lte = new Date(dateTo);
    }
    const include = {
      paymentMethod: { select: { id: true, name: true, code: true } },
      sale: { select: { id: true, documentSerie: true, documentNumber: true } },
    };
    const [data, total] = await Promise.all([
      prisma.payment.findMany({ where, include, skip, take: limit, orderBy: { paymentDate: 'desc' } }),
      prisma.payment.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        paymentMethod: { select: { id: true, name: true, code: true } },
        sale: { select: { id: true, documentSerie: true, documentNumber: true, total: true } },
      },
    });
  }

  async create(data) {
    return prisma.payment.create({ data });
  }

  async getSaleTotalPaid(saleId) {
    const result = await prisma.payment.aggregate({
      where: { saleId },
      _sum: { amount: true },
    });
    return Number(result._sum.amount || 0);
  }

  async getLastDocumentNumber(companyId, serie) {
    return prisma.invoice.findFirst({
      where: { companyId, documentSerie: serie, deletedAt: null },
      orderBy: { documentNumber: 'desc' },
      select: { documentNumber: true },
    });
  }
}
