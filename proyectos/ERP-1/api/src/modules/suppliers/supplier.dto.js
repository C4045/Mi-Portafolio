export class SupplierResponseDTO {
  constructor(s) {
    this.id = s.id;
    this.companyId = s.companyId;
    this.documentType = s.documentType;
    this.documentNumber = s.documentNumber;
    this.businessName = s.businessName;
    this.contactName = s.contactName;
    this.email = s.email;
    this.phone = s.phone;
    this.mobile = s.mobile;
    this.address = s.address;
    this.city = s.city;
    this.state = s.state;
    this.country = s.country;
    this.paymentTerms = s.paymentTerms;
    this.creditDays = s.creditDays;
    this.notes = s.notes;
    this.isActive = s.isActive;
    this.createdAt = s.createdAt;
    this.updatedAt = s.updatedAt;
    this.purchasesCount = s._count?.purchases ?? 0;
  }
}

export class CreateSupplierDTO {
  constructor(data) {
    this.documentType = data.documentType || 'RUC';
    this.documentNumber = data.documentNumber;
    this.businessName = data.businessName;
    this.contactName = data.contactName || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.mobile = data.mobile || null;
    this.address = data.address || null;
    this.city = data.city || null;
    this.state = data.state || null;
    this.country = data.country || 'Paraguay';
    this.paymentTerms = data.paymentTerms || null;
    this.creditDays = data.creditDays || 0;
    this.notes = data.notes || null;
  }
}

export class UpdateSupplierDTO {
  constructor(data) {
    if (data.documentType !== undefined) this.documentType = data.documentType;
    if (data.documentNumber !== undefined) this.documentNumber = data.documentNumber;
    if (data.businessName !== undefined) this.businessName = data.businessName;
    if (data.contactName !== undefined) this.contactName = data.contactName;
    if (data.email !== undefined) this.email = data.email;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.mobile !== undefined) this.mobile = data.mobile;
    if (data.address !== undefined) this.address = data.address;
    if (data.city !== undefined) this.city = data.city;
    if (data.state !== undefined) this.state = data.state;
    if (data.country !== undefined) this.country = data.country;
    if (data.paymentTerms !== undefined) this.paymentTerms = data.paymentTerms;
    if (data.creditDays !== undefined) this.creditDays = data.creditDays;
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }
}
