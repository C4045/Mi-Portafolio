import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class SupplierRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive }) {
    const where = { companyId, deletedAt: null };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.OR = buildSearch(search, ['businessName', 'documentNumber', 'contactName', 'email', 'phone', 'city']);

    const orderBy = buildSort(sortBy, sortOrder, ['businessName', 'documentNumber', 'city', 'createdAt']);
    const include = { _count: { select: { purchases: true } } };

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.supplier.count({ where }),
    ]);
    return { data, total };
  }

  async listAll(companyId) {
    return prisma.supplier.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: { businessName: 'asc' },
    });
  }

  async findById(id, companyId) {
    return prisma.supplier.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { _count: { select: { purchases: true } } },
    });
  }

  async findByDocument(docType, docNumber, companyId) {
    return prisma.supplier.findFirst({
      where: { documentType: docType, documentNumber: docNumber, companyId, deletedAt: null },
    });
  }

  async create(data) {
    return prisma.supplier.create({ data });
  }

  async update(id, data) {
    return prisma.supplier.update({ where: { id }, data });
  }

  async softDelete(id, deletedBy) {
    return prisma.supplier.update({ where: { id }, data: { deletedAt: new Date(), deletedBy } });
  }
}
