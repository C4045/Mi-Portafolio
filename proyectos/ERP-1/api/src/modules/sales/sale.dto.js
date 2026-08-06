export class SaleResponseDTO {
  constructor(s) {
    this.id = s.id;
    this.companyId = s.companyId;
    this.sucursalId = s.sucursalId;
    this.customerId = s.customerId;
    this.userId = s.userId;
    this.documentType = s.documentType;
    this.documentSerie = s.documentSerie;
    this.documentNumber = s.documentNumber;
    this.issueDate = s.issueDate;
    this.dueDate = s.dueDate;
    this.paymentTerm = s.paymentTerm;
    this.currencyCode = s.currencyCode;
    this.exchangeRate = Number(s.exchangeRate);
    this.subtotal = Number(s.subtotal);
    this.tax = Number(s.tax);
    this.discount = Number(s.discount);
    this.discountType = s.discountType;
    this.discountRate = Number(s.discountRate);
    this.total = Number(s.total);
    this.status = s.status;
    this.notes = s.notes;
    this.internalNotes = s.internalNotes;
    this.createdAt = s.createdAt;
    this.updatedAt = s.updatedAt;
    this.customer = s.customer ? { id: s.customer.id, businessName: s.customer.businessName, documentNumber: s.customer.documentNumber } : null;
    this.sucursal = s.sucursal ? { id: s.sucursal.id, name: s.sucursal.name } : null;
    this.user = s.user ? { id: s.user.id, name: `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() } : null;
    this.items = s.items ? s.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      lineNumber: item.lineNumber,
      description: item.description,
      quantity: Number(item.quantity),
      unitTypeId: item.unitTypeId,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      discountType: item.discountType,
      discountRate: Number(item.discountRate),
      taxRate: Number(item.taxRate),
      subtotal: Number(item.subtotal),
      tax: Number(item.tax),
      total: Number(item.total),
      product: item.product ? { id: item.product.id, sku: item.product.sku, name: item.product.name } : null,
    })) : [];
  }
}
