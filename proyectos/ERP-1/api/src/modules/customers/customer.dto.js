export class CustomerResponseDTO {
  constructor(c) {
    this.id = c.id;
    this.companyId = c.companyId;
    this.documentType = c.documentType;
    this.documentNumber = c.documentNumber;
    this.businessName = c.businessName;
    this.firstName = c.firstName;
    this.lastName = c.lastName;
    this.email = c.email;
    this.phone = c.phone;
    this.mobile = c.mobile;
    this.address = c.address;
    this.city = c.city;
    this.state = c.state;
    this.country = c.country;
    this.birthDate = c.birthDate;
    this.creditLimit = Number(c.creditLimit);
    this.isCreditHold = c.isCreditHold;
    this.notes = c.notes;
    this.isActive = c.isActive;
    this.createdAt = c.createdAt;
    this.updatedAt = c.updatedAt;
    this.salesCount = c._count?.sales ?? 0;
  }
}

export class CreateCustomerDTO {
  constructor(data) {
    this.documentType = data.documentType || 'CI';
    this.documentNumber = data.documentNumber;
    this.businessName = data.businessName || null;
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.mobile = data.mobile || null;
    this.address = data.address || null;
    this.city = data.city || null;
    this.state = data.state || null;
    this.country = data.country || 'Paraguay';
    this.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    this.creditLimit = data.creditLimit ?? 0;
    this.isCreditHold = data.isCreditHold ?? false;
    this.notes = data.notes || null;
  }
}

export class UpdateCustomerDTO {
  constructor(data) {
    if (data.documentType !== undefined) this.documentType = data.documentType;
    if (data.documentNumber !== undefined) this.documentNumber = data.documentNumber;
    if (data.businessName !== undefined) this.businessName = data.businessName;
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.email !== undefined) this.email = data.email;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.mobile !== undefined) this.mobile = data.mobile;
    if (data.address !== undefined) this.address = data.address;
    if (data.city !== undefined) this.city = data.city;
    if (data.state !== undefined) this.state = data.state;
    if (data.country !== undefined) this.country = data.country;
    if (data.birthDate !== undefined) this.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.creditLimit !== undefined) this.creditLimit = data.creditLimit;
    if (data.isCreditHold !== undefined) this.isCreditHold = data.isCreditHold;
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }
}
