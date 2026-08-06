import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AuthRepository } from './auth.repository.js';
import { AuthResponseDTO, UserResponseDTO } from './auth.dto.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { ConflictError } from '../../errors/ConflictError.js';

export class AuthService {
  constructor() {
    this.repository = new AuthRepository();
  }

  async login(credentials) {
    const user = await this.repository.findByEmail(credentials.email);

    if (!user) {
      throw new UnauthorizedError('Credenciales invÃ¡lidas');
    }

    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Credenciales invÃ¡lidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Usuario inactivo');
    }

    const accessToken = this._generateAccessToken(user);
    const refreshToken = await this._generateRefreshToken(user);

    await this.repository.updateLastLogin(user.id);

    logger.info(`User ${user.email} logged in`);

    return new AuthResponseDTO({
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_TTL,
      user,
    });
  }

  async register(data) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('El email ya estÃ¡ registrado');
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await this.repository.createUser({
      ...data,
      passwordHash,
      createdBy: data.createdBy,
    });

    const defaultRole = await this.repository.findDefaultRole(data.companyId);
    if (defaultRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: defaultRole.id },
      });
    }

    logger.info(`User ${user.email} registered`);

    return new UserResponseDTO(user);
  }

  async refresh(refreshTokenStr) {
    const tokenHash = this._hashToken(refreshTokenStr);
    const record = await this.repository.findRefreshToken(tokenHash);

    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token invÃ¡lido o expirado');
    }

    await this.repository.revokeRefreshToken(record.id);

    const user = await this.repository.findById(record.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuario no activo');
    }

    const accessToken = this._generateAccessToken(user);
    const newRefreshToken = await this._generateRefreshToken(user);

    logger.info(`Token refreshed for user ${user.email}`);

    return new AuthResponseDTO({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: env.JWT_ACCESS_TTL,
      user,
    });
  }

  async logout(refreshTokenStr, userId) {
    if (refreshTokenStr) {
      const tokenHash = this._hashToken(refreshTokenStr);
      const record = await this.repository.findRefreshToken(tokenHash);
      if (record) {
        await this.repository.revokeRefreshToken(record.id);
      }
    }

    await this.repository.revokeUserRefreshTokens(userId);
    logger.info(`User ${userId} logged out`);
  }

  async me(userId) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }
    return new UserResponseDTO(user);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('ContraseÃ±a actual incorrecta');
    }

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await this.repository.updatePassword(userId, passwordHash);
    await this.repository.revokeUserRefreshTokens(userId);

    logger.info(`Password changed for user ${user.email}`);
  }

  async updateProfile(userId, data) {
    const user = await this.repository.updateProfile(userId, data);
    return new UserResponseDTO(user);
  }

  _generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        companyId: user.companyId,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_TTL }
    );
  }

  async _generateRefreshToken(user) {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = this._hashToken(token);

    await this.repository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL * 1000),
    });

    return token;
  }

  _hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
