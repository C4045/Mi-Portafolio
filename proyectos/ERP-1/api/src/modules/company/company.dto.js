export class CompanyResponseDTO {
  constructor(company) {
    this.id = company.id;
    this.name = company.name;
    this.legalName = company.legalName;
    this.taxId = company.taxId;
    this.taxIdType = company.taxIdType;
    this.logoUrl = company.logoUrl;
    this.website = company.website;
    this.phone = company.phone;
    this.email = company.email;
    this.address = company.address;
    this.city = company.city;
    this.state = company.state;
    this.country = company.country;
    this.currencyCode = company.currencyCode;
    this.timezone = company.timezone;
    this.isActive = company.isActive;
    this.config = company.config;
    this.createdAt = company.createdAt;
    this.updatedAt = company.updatedAt;
    this.sucursales = company.sucursales
      ? company.sucursales.map((s) => new SucursalResponseDTO(s))
      : undefined;
  }
}

export class SucursalResponseDTO {
  constructor(sucursal) {
    this.id = sucursal.id;
    this.companyId = sucursal.companyId;
    this.code = sucursal.code;
    this.name = sucursal.name;
    this.address = sucursal.address;
    this.phone = sucursal.phone;
    this.email = sucursal.email;
    this.isHeadquarters = sucursal.isHeadquarters;
    this.isActive = sucursal.isActive;
    this.createdAt = sucursal.createdAt;
    this.updatedAt = sucursal.updatedAt;
  }
}

export class UpdateCompanyDTO {
  constructor(data) {
    this.name = data.name;
    this.legalName = data.legalName;
    this.taxId = data.taxId;
    this.taxIdType = data.taxIdType;
    this.phone = data.phone;
    this.email = data.email;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.country = data.country;
    this.currencyCode = data.currencyCode;
    this.timezone = data.timezone;
    this.config = data.config;
    this.logoUrl = data.logoUrl;
    this.website = data.website;
  }
}

export class CreateSucursalDTO {
  constructor(data) {
    this.code = data.code;
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
    this.isHeadquarters = data.isHeadquarters || false;
  }
}

export class UpdateSucursalDTO {
  constructor(data) {
    this.code = data.code;
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
    this.isHeadquarters = data.isHeadquarters;
    this.isActive = data.isActive;
  }
}
