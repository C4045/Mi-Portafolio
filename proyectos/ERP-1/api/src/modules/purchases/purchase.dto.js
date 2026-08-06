export class PurchaseResponseDTO {
  constructor(p) {
    this.id = p.id;
    this.companyId = p.companyId;
    this.sucursalId = p.sucursalId;
    this.supplierId = p.supplierId;
    this.userId = p.userId;
    this.documentType = p.documentType;
    this.documentSerie = p.documentSerie;
    this.documentNumber = p.documentNumber;
    this.orderDate = p.orderDate;
    this.expectedDate = p.expectedDate;
    this.currencyCode = p.currencyCode;
    this.exchangeRate = Number(p.exchangeRate);
    this.subtotal = Number(p.subtotal);
    this.tax = Number(p.tax);
    this.discount = Number(p.discount);
    this.total = Number(p.total);
    this.status = p.status;
    this.notes = p.notes;
    this.internalNotes = p.internalNotes;
    this.createdAt = p.createdAt;
    this.updatedAt = p.updatedAt;
    this.supplier = p.supplier ? { id: p.supplier.id, businessName: p.supplier.businessName, documentNumber: p.supplier.documentNumber } : null;
    this.sucursal = p.sucursal ? { id: p.sucursal.id, name: p.sucursal.name } : null;
    this.user = p.user ? { id: p.user.id, name: `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() } : null;
    this.items = p.items ? p.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      lineNumber: item.lineNumber,
      description: item.description,
      quantity: Number(item.quantity),
      receivedQty: Number(item.receivedQty),
      unitTypeId: item.unitTypeId,
      unitCost: Number(item.unitCost),
      discount: Number(item.discount),
      taxRate: Number(item.taxRate),
      subtotal: Number(item.subtotal),
      tax: Number(item.tax),
      total: Number(item.total),
      product: item.product ? { id: item.product.id, sku: item.product.sku, name: item.product.name } : null,
    })) : [];
    this.receivedPercent = this.items.length > 0
      ? Math.round((this.items.reduce((s, i) => s + i.receivedQty, 0) / this.items.reduce((s, i) => s + i.quantity, 0)) * 100)
      : 0;
  }
}
