import { PaymentMethodService } from './payment-method.service.js';
import { createPaymentMethodSchema, updatePaymentMethodSchema } from './payment-method.validation.js';
import { successResponse, createdResponse } from '../../utils/response.js';

const service = new PaymentMethodService();

export class PaymentMethodController {
  async index(req, res, next) {
    try {
      const methods = await service.findAll(req.user.companyId);
      return successResponse(res, methods);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const method = await service.findById(req.params.id, req.user.companyId);
      return successResponse(res, method);
    } catch (error) { next(error); }
  }

  async store(req, res, next) {
    try {
      const data = createPaymentMethodSchema.parse(req.body);
      const method = await service.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, method, 'Método de pago creado');
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = updatePaymentMethodSchema.parse(req.body);
      const method = await service.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, method, 'Método de pago actualizado');
    } catch (error) { next(error); }
  }
}
