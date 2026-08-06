import { PermissionService } from './permission.service.js';
import { createPermissionSchema } from './permission.validation.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { createAuditLog } from '../../utils/audit.js';

const service = new PermissionService();

export class PermissionController {
  async index(req, res, next) {
    try {
      const result = await service.findAll();
      return successResponse(res, result);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const permission = await service.findById(req.params.id);
      return successResponse(res, permission);
    } catch (error) { next(error); }
  }

  async store(req, res, next) {
    try {
      const data = createPermissionSchema.parse(req.body);
      const permission = await service.create(data);
      createAuditLog({ userId: req.user?.id, companyId: req.user?.companyId, action: 'CREATE', entity: 'Permission', entityId: permission.id, newValues: { name: permission.name, module: permission.module } });
      return createdResponse(res, permission, 'Permiso creado');
    } catch (error) { next(error); }
  }

  async destroy(req, res, next) {
    try {
      await service.delete(req.params.id);
      createAuditLog({ userId: req.user?.id, companyId: req.user?.companyId, action: 'DELETE', entity: 'Permission', entityId: req.params.id });
      return successResponse(res, null, 'Permiso eliminado');
    } catch (error) { next(error); }
  }
}
