export class RoleResponseDTO {
  constructor(role) {
    this.id = role.id;
    this.companyId = role.companyId;
    this.name = role.name;
    this.displayName = role.displayName;
    this.description = role.description;
    this.level = role.level;
    this.isSystem = role.isSystem;
    this.isActive = role.isActive;
    this.createdAt = role.createdAt;
    this.updatedAt = role.updatedAt;
    this.permissions = role.permissions
      ? role.permissions.map((rp) => ({
          id: rp.permission?.id || rp.id,
          name: rp.permission?.name || rp.name,
          module: rp.permission?.module || rp.module,
          action: rp.permission?.action || rp.action,
        }))
      : [];
    this.userCount = role._count?.users || 0;
  }
}

export class CreateRoleDTO {
  constructor(data) {
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.level = data.level ?? 1;
    this.permissionIds = data.permissionIds || [];
  }
}

export class UpdateRoleDTO {
  constructor(data) {
    this.displayName = data.displayName;
    this.description = data.description;
    this.level = data.level;
  }
}

export class PermissionResponseDTO {
  constructor(permission) {
    this.id = permission.id;
    this.module = permission.module;
    this.action = permission.action;
    this.name = permission.name;
    this.description = permission.description;
  }
}
