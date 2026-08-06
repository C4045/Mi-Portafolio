import { UserService } from './user.service.js';
import { createUserSchema, updateUserSchema, assignRolesSchema, userQuerySchema } from './user.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const userService = new UserService();

export class UserController {
  async index(req, res, next) {
    try {
      const query = userQuerySchema.parse(req.query);
      const result = await userService.findAll(query, req.user.id, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const user = await userService.findById(req.params.id, req.user.companyId);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, user, 'Usuario creado');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await userService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, user, 'Usuario actualizado');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await userService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Usuario eliminado');
    } catch (error) {
      next(error);
    }
  }

  async assignRoles(req, res, next) {
    try {
      const data = assignRolesSchema.parse(req.body);
      const user = await userService.assignRoles(req.params.id, data.roleIds, req.user.id, req.user.companyId);
      return successResponse(res, user, 'Roles asignados');
    } catch (error) {
      next(error);
    }
  }
}
