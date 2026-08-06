import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import { ProductRepository } from './product.repository.js';
import { ProductResponseDTO, CreateProductDTO, UpdateProductDTO, StockAlertDTO } from './product.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class ProductService {
  constructor() {
    this.repository = new ProductRepository();
  }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive, categoryId, productType, stockStatus, isTracked } = query;

    const { data, total } = await this.repository.findAll({
      companyId, page, limit, skip, search, sortBy, sortOrder, isActive, categoryId, productType, stockStatus, isTracked,
    });

    return {
      data: data.map((p) => new ProductResponseDTO(p)),
      pagination: buildPaginatedResponse(total, page, limit),
    };
  }

  async findById(id, companyId) {
    const product = await this.repository.findById(id, companyId);
    if (!product) throw new NotFoundError('Producto', id);
    return new ProductResponseDTO(product);
  }

  async create(data, userId, companyId) {
    const dto = new CreateProductDTO(data);

    const existingSku = await this.repository.findBySku(dto.sku, companyId);
    if (existingSku) throw new ConflictError('El SKU ya existe');

    if (dto.barcode) {
      const existingBarcode = await this.repository.findByBarcode(dto.barcode, companyId);
      if (existingBarcode) throw new ConflictError('El código de barras ya existe');
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: { ...dto, companyId, createdBy: userId },
      });

      if (dto.isTracked && Number(dto.currentStock) > 0) {
        await tx.inventoryMovement.create({
          data: {
            companyId,
            productId: p.id,
            movementType: 'initial',
            quantity: Number(dto.currentStock),
            stockBefore: 0,
            stockAfter: Number(dto.currentStock),
            unitCost: Number(dto.costPrice) || 0,
            totalCost: Number(dto.currentStock) * (Number(dto.costPrice) || 0),
            userId,
            notes: 'Stock inicial',
          },
        });
      }

      return p;
    });

    await createAuditLog({
      userId, companyId, action: 'CREATE', entity: 'Product', entityId: product.id,
      newValues: { sku: dto.sku, name: dto.name },
    });

    logger.info(`Product ${dto.sku} created by ${userId}`);
    return new ProductResponseDTO(product);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Producto', id);

    const dto = new UpdateProductDTO(data);

    if (dto.sku && dto.sku !== existing.sku) {
      const skuExists = await this.repository.findBySku(dto.sku, companyId);
      if (skuExists) throw new ConflictError('El SKU ya existe');
    }

    if (dto.barcode && dto.barcode !== existing.barcode) {
      const barcodeExists = await this.repository.findByBarcode(dto.barcode, companyId);
      if (barcodeExists) throw new ConflictError('El código de barras ya existe');
    }

    const updated = await this.repository.update(id, { ...dto, updatedBy: userId });

    await createAuditLog({
      userId, companyId, action: 'UPDATE', entity: 'Product', entityId: id,
      oldValues: { sku: existing.sku, name: existing.name, stock: Number(existing.currentStock) },
      newValues: dto,
    });

    logger.info(`Product ${id} updated by ${userId}`);
    return new ProductResponseDTO(updated);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Producto', id);

    await this.repository.softDelete(id, userId);

    await createAuditLog({
      userId, companyId, action: 'DELETE', entity: 'Product', entityId: id,
      oldValues: { sku: existing.sku, name: existing.name },
    });

    logger.info(`Product ${id} deleted by ${userId}`);
  }

  async adjustStock(id, data, userId, companyId) {
    const product = await this.repository.findById(id, companyId);
    if (!product) throw new NotFoundError('Producto', id);

    const currentStock = Number(product.currentStock);
    const qty = Number(data.quantity);
    const movementType = data.movementType;
    const newStock = movementType === 'adjustment_out' || movementType === 'sale_out'
      ? currentStock - qty
      : currentStock + qty;

    if (newStock < 0) throw new ConflictError('Stock insuficiente para esta operación');

    const result = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { currentStock: newStock, updatedBy: userId },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          companyId,
          productId: id,
          warehouseId: data.warehouseId || null,
          movementType,
          referenceType: data.referenceType || 'manual',
          referenceId: data.referenceId || null,
          quantity: qty,
          unitCost: data.unitCost || Number(product.costPrice),
          totalCost: qty * (data.unitCost || Number(product.costPrice)),
          stockBefore: currentStock,
          stockAfter: newStock,
          notes: data.notes || null,
          userId,
        },
      });

      return movement;
    });

    await createAuditLog({
      userId, companyId, action: 'STOCK_ADJUST', entity: 'Product', entityId: id,
      oldValues: { stock: currentStock },
      newValues: { stock: newStock, movement: movementType, quantity: qty },
    });

    logger.info(`Stock adjusted for product ${id}: ${currentStock} -> ${newStock} (${movementType})`);
    return result;
  }

  async getStockAlerts(companyId) {
    const [lowStock, outOfStock] = await Promise.all([
      this.repository.getLowStock(companyId),
      this.repository.getOutOfStock(companyId),
    ]);

    return {
      lowStock: lowStock.filter((p) => Number(p.currentStock) > 0).map((p) => new StockAlertDTO(p)),
      outOfStock: outOfStock.map((p) => new StockAlertDTO(p)),
      totalAlerts: lowStock.length + outOfStock.length,
    };
  }

  async getMovementHistory(productId, companyId) {
    const product = await this.repository.findById(productId, companyId);
    if (!product) throw new NotFoundError('Producto', productId);

    return this.repository.getMovementHistory(productId);
  }
}
