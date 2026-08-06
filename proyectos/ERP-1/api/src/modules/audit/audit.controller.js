import { AuditService } from './audit.service.js';
import { auditQuerySchema } from './audit.validation.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';
import { NotFoundError } from '../../errors/NotFoundError.js';

const auditService = new AuditService();

export class AuditController {
  async findAll(req, res, next) {
    try {
      const query = auditQuerySchema.parse(req.query);
      const result = await auditService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async findByEntity(req, res, next) {
    try {
      const { entity, entityId } = req.params;
      if (!entity || !entityId) {
        throw new NotFoundError('Audit');
      }
      const logs = await auditService.findByEntity(entity, entityId, req.user.companyId);
      return successResponse(res, logs);
    } catch (error) {
      next(error);
    }
  }
}
