import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class PurchaseRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, supplierId, dateFrom, dateTo }) {
    const where = { companyId, deletedAt: null };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy = buildSort(sortBy, sortOrder, ['orderDate', 'documentNumber', 'total', 'status', 'createdAt']);
    const include = {
      supplier: { select: { id: true, businessName: true, documentNumber: true } },
      sucursal: { select: { id: true, name: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    };

    const [data, total] = await Promise.all([
      prisma.purchase.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.purchase.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id) {
    return prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, businessName: true, documentNumber: true, phone: true, email: true, address: true } },
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
    return prisma.purchase.findFirst({
      where: { companyId, documentSerie: serie, deletedAt: null },
      orderBy: { documentNumber: 'desc' },
      select: { documentNumber: true },
    });
  }

  async create(data, include) {
    return prisma.purchase.create({ data, include });
  }

  async update(id, data, include) {
    return prisma.purchase.update({ where: { id }, data, include });
  }

  async softDelete(id, deletedBy) {
    return prisma.purchase.update({ where: { id }, data: { deletedAt: new Date(), deletedBy, status: 'cancelled' } });
  }
}
