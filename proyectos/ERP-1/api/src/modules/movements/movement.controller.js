import { MovementService } from './movement.service.js';
import { movementQuerySchema, createMovementSchema } from './movement.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const movementService = new MovementService();

export class MovementController {
  async index(req, res, next) {
    try {
      const query = movementQuerySchema.parse(req.query);
      const result = await movementService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const movement = await movementService.findById(req.params.id, req.user.companyId);
      return successResponse(res, movement);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createMovementSchema.parse(req.body);
      const movement = await movementService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, movement, 'Movimiento registrado');
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await movementService.getSummary(req.user.companyId, req.query);
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }
}
