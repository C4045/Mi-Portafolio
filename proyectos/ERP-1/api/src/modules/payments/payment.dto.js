export class PaymentResponseDTO {
  constructor(p) {
    this.id = p.id;
    this.companyId = p.companyId;
    this.saleId = p.saleId;
    this.paymentMethodId = p.paymentMethodId;
    this.amount = Number(p.amount);
    this.reference = p.reference;
    this.paymentDate = p.paymentDate;
    this.notes = p.notes;
    this.createdAt = p.createdAt;
    this.paymentMethod = p.paymentMethod ? { id: p.paymentMethod.id, name: p.paymentMethod.name, code: p.paymentMethod.code } : null;
    this.sale = p.sale ? { id: p.sale.id, documentSerie: p.sale.documentSerie, documentNumber: p.sale.documentNumber } : null;
  }
}
