import { prisma } from '../../config/database.js';

export class AuthRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        company: true,
        sucursal: true,
      },
    });
  }

  async createUser(data) {
    return prisma.user.create({
      data: {
        companyId: data.companyId,
        sucursalId: data.sucursalId,
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        createdBy: data.createdBy,
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
  }

  async updateLastLogin(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async createRefreshToken(data) {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeRefreshToken(id) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeUserRefreshTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async updatePassword(userId, passwordHash) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateProfile(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async findDefaultRole(companyId) {
    return prisma.role.findFirst({
      where: { companyId, name: 'seller', isActive: true },
    });
  }
}
