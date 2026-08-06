export class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.companyId = user.companyId;
    this.sucursalId = user.sucursalId;
    this.username = user.username;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.mustChangePassword = user.mustChangePassword;
    this.lastLoginAt = user.lastLoginAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.deletedAt = user.deletedAt;
    this.roles = user.roles
      ? user.roles.map((ur) => ({
          id: ur.role?.id || ur.id,
          name: ur.role?.name || ur.name,
          displayName: ur.role?.displayName || ur.displayName,
          level: ur.role?.level || ur.level,
        }))
      : [];
    this.sucursal = user.sucursal
      ? { id: user.sucursal.id, name: user.sucursal.name }
      : null;
  }
}

export class CreateUserDTO {
  constructor(data) {
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
    this.sucursalId = data.sucursalId;
    this.roleIds = data.roleIds || [];
  }
}

export class UpdateUserDTO {
  constructor(data) {
    this.username = data.username;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
    this.sucursalId = data.sucursalId;
    this.isActive = data.isActive;
  }
}
