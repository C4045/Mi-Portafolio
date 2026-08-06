import { prisma } from '../../config/database.js';
import { buildSearch, buildSort, buildFilters } from '../../utils/helpers.js';

export class CategoryRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive, parentId }) {
    const where = { companyId, deletedAt: null };

    if (isActive !== undefined) where.isActive = isActive;
    if (parentId !== undefined) where.parentId = parentId;
    if (search) where.OR = buildSearch(search, ['code', 'name', 'description']);

    const orderBy = buildSort(sortBy, sortOrder, ['code', 'name', 'sortOrder', 'createdAt']);
    const include = { _count: { select: { children: true, products: true } } };

    const [data, total] = await Promise.all([
      prisma.category.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.category.count({ where }),
    ]);

    return { data, total };
  }

  async listAll(companyId) {
    return prisma.category.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id, companyId) {
    return prisma.category.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { _count: { select: { children: true, products: true } } },
    });
  }

  async findByCode(code, companyId) {
    return prisma.category.findFirst({
      where: { code, companyId, deletedAt: null },
    });
  }

  async create(data) {
    return prisma.category.create({ data });
  }

  async update(id, data) {
    return prisma.category.update({ where: { id }, data });
  }

  async softDelete(id, deletedBy) {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  }
}
