export class PermissionResponseDTO {
  constructor(p) {
    this.id = p.id;
    this.module = p.module;
    this.action = p.action;
    this.name = p.name;
    this.description = p.description;
    this.createdAt = p.createdAt;
  }
}
