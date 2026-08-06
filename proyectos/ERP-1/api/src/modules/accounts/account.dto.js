export class AccountResponseDTO {
  constructor(a) {
    this.id = a.id;
    this.companyId = a.companyId;
    this.parentId = a.parentId;
    this.code = a.code;
    this.name = a.name;
    this.type = a.type;
    this.nature = a.nature;
    this.level = a.level;
    this.description = a.description;
    this.isActive = a.isActive;
    this.createdAt = a.createdAt;
    if (a.children) this.children = a.children.map((c) => new AccountResponseDTO(c));
  }
}
