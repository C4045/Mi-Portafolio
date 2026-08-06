import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema, refreshSchema, changePasswordSchema, updateProfileSchema } from './auth.validation.js';
import { LoginDTO, RegisterDTO, RefreshDTO, ChangePasswordDTO } from './auth.dto.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { logger } from '../../config/logger.js';
import { createAuditLog } from '../../utils/audit.js';

const authService = new AuthService();

export class AuthController {
  async login(req, res, next) {
    try {
      const data = loginSchema.parse(req.body);
      const dto = new LoginDTO(data);
      const result = await authService.login(dto);
      createAuditLog({ userId: result.user.id, companyId: result.user.companyId, action: 'LOGIN', entity: 'User', entityId: result.user.id });
      return successResponse(res, result, 'Login exitoso');
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const data = registerSchema.parse(req.body);
      const dto = new RegisterDTO(data);
      const user = await authService.register(dto);
      createAuditLog({ userId: user.id, companyId: user.companyId, action: 'REGISTER', entity: 'User', entityId: user.id, newValues: { email: user.email, username: user.username } });
      return createdResponse(res, user, 'Usuario registrado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const data = refreshSchema.parse(req.body);
      const dto = new RefreshDTO(data);
      const result = await authService.refresh(dto.refreshToken);
      createAuditLog({ userId: result.user.id, companyId: result.user.companyId, action: 'REFRESH', entity: 'User', entityId: result.user.id });
      return successResponse(res, result, 'Token renovado');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.body.refreshToken;
      await authService.logout(refreshToken, req.user.id);
      createAuditLog({ userId: req.user.id, companyId: req.user.companyId, action: 'LOGOUT', entity: 'User', entityId: req.user.id });
      return successResponse(res, null, 'Sesión cerrada');
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.me(req.user.id);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const data = changePasswordSchema.parse(req.body);
      const dto = new ChangePasswordDTO(data);
      await authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
      createAuditLog({ userId: req.user.id, companyId: req.user.companyId, action: 'CHANGE_PASSWORD', entity: 'User', entityId: req.user.id });
      return successResponse(res, null, 'Contraseña actualizada');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await authService.updateProfile(req.user.id, data);
      return successResponse(res, user, 'Perfil actualizado');
    } catch (error) {
      next(error);
    }
  }
}
