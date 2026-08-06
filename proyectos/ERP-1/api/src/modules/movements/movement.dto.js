export class MovementResponseDTO {
  constructor(m) {
    this.id = m.id;
    this.companyId = m.companyId;
    this.productId = m.productId;
    this.warehouseId = m.warehouseId;
    this.movementType = m.movementType;
    this.referenceType = m.referenceType;
    this.referenceId = m.referenceId;
    this.quantity = Number(m.quantity);
    this.unitCost = m.unitCost ? Number(m.unitCost) : null;
    this.totalCost = m.totalCost ? Number(m.totalCost) : null;
    this.stockBefore = m.stockBefore ? Number(m.stockBefore) : null;
    this.stockAfter = m.stockAfter ? Number(m.stockAfter) : null;
    this.notes = m.notes;
    this.createdAt = m.createdAt;
    this.product = m.product ? { id: m.product.id, sku: m.product.sku, name: m.product.name } : null;
    this.warehouse = m.warehouse ? { id: m.warehouse.id, name: m.warehouse.name } : null;
    this.user = m.user ? { id: m.user.id, name: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() } : null;
  }
}

export class CreateMovementDTO {
  constructor(data) {
    this.productId = data.productId;
    this.movementType = data.movementType;
    this.quantity = Number(data.quantity);
    this.warehouseId = data.warehouseId || null;
    this.referenceType = data.referenceType || null;
    this.referenceId = data.referenceId || null;
    this.unitCost = data.unitCost ? Number(data.unitCost) : null;
    this.notes = data.notes || null;
  }
}
