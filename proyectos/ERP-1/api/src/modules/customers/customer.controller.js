import { CustomerService } from './customer.service.js';
import { createCustomerSchema, updateCustomerSchema, customerQuerySchema } from './customer.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const customerService = new CustomerService();

export class CustomerController {
  async index(req, res, next) {
    try {
      const query = customerQuerySchema.parse(req.query);
      const result = await customerService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const customers = await customerService.listAll(req.user.companyId);
      return successResponse(res, customers);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const customer = await customerService.findById(req.params.id, req.user.companyId);
      return successResponse(res, customer);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createCustomerSchema.parse(req.body);
      const customer = await customerService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, customer, 'Cliente creado');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateCustomerSchema.parse(req.body);
      const customer = await customerService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, customer, 'Cliente actualizado');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await customerService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Cliente eliminado');
    } catch (error) {
      next(error);
    }
  }
}
