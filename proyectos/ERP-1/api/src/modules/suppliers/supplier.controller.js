import { SupplierService } from './supplier.service.js';
import { createSupplierSchema, updateSupplierSchema, supplierQuerySchema } from './supplier.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const supplierService = new SupplierService();

export class SupplierController {
  async index(req, res, next) {
    try {
      const query = supplierQuerySchema.parse(req.query);
      const result = await supplierService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const suppliers = await supplierService.listAll(req.user.companyId);
      return successResponse(res, suppliers);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const supplier = await supplierService.findById(req.params.id, req.user.companyId);
      return successResponse(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createSupplierSchema.parse(req.body);
      const supplier = await supplierService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, supplier, 'Proveedor creado');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateSupplierSchema.parse(req.body);
      const supplier = await supplierService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, supplier, 'Proveedor actualizado');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await supplierService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Proveedor eliminado');
    } catch (error) {
      next(error);
    }
  }
}
