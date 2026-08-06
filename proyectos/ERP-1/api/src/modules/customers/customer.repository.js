import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class CustomerRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive }) {
    const where = { companyId, deletedAt: null };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.OR = buildSearch(search, ['businessName', 'documentNumber', 'firstName', 'lastName', 'email', 'phone', 'city']);

    const orderBy = buildSort(sortBy, sortOrder, ['businessName', 'documentNumber', 'city', 'createdAt']);
    const include = { _count: { select: { sales: true } } };

    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.customer.count({ where }),
    ]);
    return { data, total };
  }

  async listAll(companyId) {
    return prisma.customer.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: { businessName: 'asc' },
    });
  }

  async findById(id, companyId) {
    return prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { _count: { select: { sales: true } } },
    });
  }

  async findByDocument(docType, docNumber, companyId) {
    return prisma.customer.findFirst({
      where: { documentType: docType, documentNumber: docNumber, companyId, deletedAt: null },
    });
  }

  async create(data) {
    return prisma.customer.create({ data });
  }

  async update(id, data) {
    return prisma.customer.update({ where: { id }, data });
  }

  async softDelete(id, deletedBy) {
    return prisma.customer.update({ where: { id }, data: { deletedAt: new Date(), deletedBy } });
  }
}
