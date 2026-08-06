import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class OrderRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, customerId, dateFrom, dateTo }) {
    const where = { companyId, deletedAt: null, documentType: 'order' };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const orderBy = buildSort(sortBy, sortOrder, ['issueDate', 'documentNumber', 'total', 'status', 'createdAt']);
    const include = {
      customer: { select: { id: true, businessName: true, documentNumber: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    };
    const [data, total] = await Promise.all([
      prisma.sale.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.sale.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id) {
    return prisma.sale.findFirst({
      where: { id, documentType: 'order', deletedAt: null },
      include: {
        customer: { select: { id: true, businessName: true, documentNumber: true, phone: true, email: true, address: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        items: { orderBy: { lineNumber: 'asc' }, include: { product: { select: { id: true, sku: true, name: true } } } },
      },
    });
  }

  async getLastDocumentNumber(companyId, serie) {
    return prisma.sale.findFirst({
      where: { companyId, documentSerie: serie, documentType: 'order', deletedAt: null },
      orderBy: { documentNumber: 'desc' }, select: { documentNumber: true },
    });
  }

  async create(data) {
    return prisma.sale.create({ data });
  }

  async update(id, data) {
    return prisma.sale.update({ where: { id }, data });
  }

  async softDelete(id, deletedBy) {
    return prisma.sale.update({ where: { id }, data: { deletedAt: new Date(), deletedBy, status: 'cancelled' } });
  }
}
