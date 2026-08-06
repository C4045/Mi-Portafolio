import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class ProductRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive, categoryId, productType, stockStatus, isTracked }) {
    const where = { companyId, deletedAt: null };

    if (isActive !== undefined) where.isActive = isActive;
    if (categoryId !== undefined) where.categoryId = categoryId;
    if (productType !== undefined) where.productType = productType;
    if (isTracked !== undefined) where.isTracked = isTracked;

    if (stockStatus === 'low') {
      where.currentStock = { lte: prisma.product.fields.minStock, gt: 0 };
    } else if (stockStatus === 'out_of_stock') {
      where.currentStock = { lte: 0 };
    } else if (stockStatus === 'healthy') {
      where.currentStock = { gt: prisma.product.fields.minStock };
    }

    if (search) {
      where.OR = buildSearch(search, ['sku', 'name', 'barcode', 'description']);
    }

    const orderBy = buildSort(sortBy, sortOrder, ['sku', 'name', 'currentStock', 'salePrice', 'costPrice', 'createdAt']);
    const include = {
      category: { select: { id: true, name: true, code: true } },
      unitType: { select: { id: true, code: true, name: true } },
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id, companyId) {
    return prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, code: true } },
        unitType: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findBySku(sku, companyId) {
    return prisma.product.findFirst({
      where: { sku, companyId, deletedAt: null },
    });
  }

  async findByBarcode(barcode, companyId) {
    if (!barcode) return null;
    return prisma.product.findFirst({
      where: { barcode, companyId, deletedAt: null },
    });
  }

  async create(data) {
    return prisma.product.create({ data });
  }

  async update(id, data) {
    return prisma.product.update({ where: { id }, data });
  }

  async softDelete(id, deletedBy) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  }

  async updateStock(id, quantity) {
    return prisma.product.update({
      where: { id },
      data: { currentStock: quantity },
    });
  }

  async getLowStock(companyId) {
    return prisma.product.findMany({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
        isTracked: true,
        currentStock: { lte: prisma.product.fields.minStock },
      },
      orderBy: { currentStock: 'asc' },
      include: { category: { select: { name: true } } },
    });
  }

  async getOutOfStock(companyId) {
    return prisma.product.findMany({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
        isTracked: true,
        currentStock: { lte: 0 },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getMovementHistory(productId) {
    return prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        warehouse: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
