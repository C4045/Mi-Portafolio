import { logger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import { MovementRepository } from './movement.repository.js';
import { MovementResponseDTO, CreateMovementDTO } from './movement.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class MovementService {
  constructor() {
    this.repository = new MovementRepository();
  }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { sortBy, sortOrder, movementType, productId, warehouseId, dateFrom, dateTo } = query;

    const { data, total } = await this.repository.findAll({
      companyId, page, limit, skip, sortBy, sortOrder, movementType, productId, warehouseId, dateFrom, dateTo,
    });

    return {
      data: data.map((m) => new MovementResponseDTO(m)),
      pagination: buildPaginatedResponse(total, page, limit),
    };
  }

  async findById(id, companyId) {
    const movement = await this.repository.findById(id);
    if (!movement || movement.companyId !== companyId) {
      throw new NotFoundError('Movimiento', id);
    }
    return new MovementResponseDTO(movement);
  }

  async create(data, userId, companyId) {
    const dto = new CreateMovementDTO(data);
    const qty = dto.quantity;

    const product = await prisma.product.findFirst({
      where: { id: dto.productId, companyId, deletedAt: null },
    });
    if (!product) throw new NotFoundError('Producto', dto.productId);

    const currentStock = Number(product.currentStock);
    const isOut = ['adjustment_out', 'sale_out', 'transfer_out'].includes(dto.movementType);
    const newStock = isOut ? currentStock - qty : currentStock + qty;

    if (isOut && newStock < 0) {
      throw new ConflictError('Stock insuficiente');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: dto.productId },
        data: { currentStock: newStock, updatedBy: userId },
      });

      return tx.inventoryMovement.create({
        data: {
          companyId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          movementType: dto.movementType,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          quantity: qty,
          unitCost: dto.unitCost || Number(product.costPrice),
          totalCost: qty * (dto.unitCost || Number(product.costPrice)),
          stockBefore: currentStock,
          stockAfter: newStock,
          notes: dto.notes,
          userId,
        },
        include: {
          product: { select: { id: true, sku: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    await createAuditLog({
      userId, companyId, action: 'CREATE_MOVEMENT', entity: 'InventoryMovement',
      entityId: result.id,
      newValues: { productId: dto.productId, movementType: dto.movementType, quantity: qty, stockBefore: currentStock, stockAfter: newStock },
    });

    logger.info(`Movement ${dto.movementType} for product ${dto.productId}: ${currentStock} -> ${newStock}`);
    return new MovementResponseDTO(result);
  }

  async getSummary(companyId, query = {}) {
    const { dateFrom, dateTo } = query;
    const movements = await this.repository.getSummaryByType(companyId, dateFrom, dateTo);

    const summary = {
      entries: { total: 0, count: 0 },
      exits: { total: 0, count: 0 },
      transfers: { total: 0, count: 0 },
      adjustments: { total: 0, count: 0 },
    };

    for (const m of movements) {
      const type = m.movementType;
      const total = Number(m._sum.quantity || 0);
      const count = m._count || 0;

      if (['purchase_in', 'sale_return', 'adjustment_in', 'initial'].includes(type)) {
        summary.entries.total += total;
        summary.entries.count += count;
      } else if (['sale_out', 'purchase_return', 'adjustment_out'].includes(type)) {
        summary.exits.total += total;
        summary.exits.count += count;
      } else if (['transfer_in', 'transfer_out'].includes(type)) {
        summary.transfers.total += total;
        summary.transfers.count += count;
      }
    }

    return summary;
  }
}
