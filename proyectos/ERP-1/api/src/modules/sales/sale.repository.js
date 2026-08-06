import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class SaleRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, customerId, dateFrom, dateTo }) {
    const where = { companyId, deletedAt: null };
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
      sucursal: { select: { id: true, name: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    };

    const [data, total] = await Promise.all([
      prisma.sale.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.sale.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, businessName: true, documentNumber: true, phone: true, email: true, address: true } },
        sucursal: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        items: {
          orderBy: { lineNumber: 'asc' },
          include: { product: { select: { id: true, sku: true, name: true, unitTypeId: true } } },
        },
      },
    });
  }

  async getLastDocumentNumber(companyId, serie) {
    return prisma.sale.findFirst({
      where: { companyId, documentSerie: serie, deletedAt: null },
      orderBy: { documentNumber: 'desc' },
      select: { documentNumber: true },
    });
  }

  async create(data, include) {
    return prisma.sale.create({ data, include });
  }

  async update(id, data, include) {
    return prisma.sale.update({ where: { id }, data, include });
  }

  async softDelete(id, deletedBy) {
    return prisma.sale.update({ where: { id }, data: { deletedAt: new Date(), deletedBy, status: 'cancelled' } });
  }
}
