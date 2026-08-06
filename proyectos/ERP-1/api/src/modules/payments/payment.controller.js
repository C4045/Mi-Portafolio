import { PaymentService } from './payment.service.js';
import { createPaymentSchema, paymentQuerySchema } from './payment.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const service = new PaymentService();

export class PaymentController {
  async index(req, res, next) {
    try {
      const query = paymentQuerySchema.parse(req.query);
      const result = await service.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const payment = await service.findById(req.params.id, req.user.companyId);
      return successResponse(res, payment);
    } catch (error) { next(error); }
  }

  async store(req, res, next) {
    try {
      const data = createPaymentSchema.parse(req.body);
      const payment = await service.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, payment, 'Pago registrado');
    } catch (error) { next(error); }
  }
}
