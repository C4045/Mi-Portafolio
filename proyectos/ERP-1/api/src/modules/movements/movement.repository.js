import { prisma } from '../../config/database.js';
import { buildSort } from '../../utils/helpers.js';

export class MovementRepository {
  async findAll({ companyId, page, limit, skip, sortBy, sortOrder, movementType, productId, warehouseId, dateFrom, dateTo }) {
    const where = { companyId };

    if (movementType) where.movementType = movementType;
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const orderBy = buildSort(sortBy, sortOrder, ['createdAt', 'movementType', 'quantity']);
    const include = {
      product: { select: { id: true, sku: true, name: true } },
      warehouse: { select: { id: true, name: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    };

    const [data, total] = await Promise.all([
      prisma.inventoryMovement.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id) {
    return prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data) {
    return prisma.inventoryMovement.create({
      data,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getSummaryByType(companyId, dateFrom, dateTo) {
    const dateFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const where = { companyId };
    if (dateFrom || dateTo) where.createdAt = dateFilter;

    const movements = await prisma.inventoryMovement.groupBy({
      by: ['movementType'],
      where,
      _sum: { quantity: true, totalCost: true },
      _count: true,
    });

    return movements;
  }
}
