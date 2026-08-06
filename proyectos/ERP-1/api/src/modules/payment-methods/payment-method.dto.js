export class PaymentMethodResponseDTO {
  constructor(p) {
    this.id = p.id;
    this.companyId = p.companyId;
    this.code = p.code;
    this.name = p.name;
    this.description = p.description;
    this.isActive = p.isActive;
    this.createdAt = p.createdAt;
  }
}
