import { RoleService } from './role.service.js';
import { createRoleSchema, updateRoleSchema, assignPermissionsSchema, roleQuerySchema } from './role.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const roleService = new RoleService();

export class RoleController {
  async index(req, res, next) {
    try {
      const query = roleQuerySchema.parse(req.query);
      const result = await roleService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const role = await roleService.findById(req.params.id, req.user.companyId);
      return successResponse(res, role);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createRoleSchema.parse(req.body);
      const role = await roleService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, role, 'Rol creado');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateRoleSchema.parse(req.body);
      const role = await roleService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, role, 'Rol actualizado');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await roleService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Rol eliminado');
    } catch (error) {
      next(error);
    }
  }

  async assignPermissions(req, res, next) {
    try {
      const data = assignPermissionsSchema.parse(req.body);
      const role = await roleService.assignPermissions(req.params.id, data.permissionIds, req.user.id, req.user.companyId);
      return successResponse(res, role, 'Permisos asignados');
    } catch (error) {
      next(error);
    }
  }

  async listPermissions(req, res, next) {
    try {
      const permissions = await roleService.listPermissions();
      return successResponse(res, permissions);
    } catch (error) {
      next(error);
    }
  }
}
