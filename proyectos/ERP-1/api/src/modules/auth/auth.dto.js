export class LoginDTO {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}

export class RegisterDTO {
  constructor(data) {
    this.companyId = data.companyId;
    this.sucursalId = data.sucursalId;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
  }
}

export class RefreshDTO {
  constructor({ refreshToken }) {
    this.refreshToken = refreshToken;
  }
}

export class ChangePasswordDTO {
  constructor({ currentPassword, newPassword }) {
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
  }
}

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
    this.roles = user.roles
      ? user.roles.map((ur) => ({
          id: ur.role?.id || ur.id,
          name: ur.role?.name || ur.name,
          displayName: ur.role?.displayName || ur.displayName,
          level: ur.role?.level || ur.level,
        }))
      : [];
  }
}

export class AuthResponseDTO {
  constructor({ accessToken, refreshToken, expiresIn, user }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = 'bearer';
    this.expiresIn = expiresIn;
    this.user = new UserResponseDTO(user);
  }
}
