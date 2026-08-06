import { CompanyService } from './company.service.js';
import { updateCompanySchema, createSucursalSchema, updateSucursalSchema } from './company.validation.js';
import { successResponse, createdResponse } from '../../utils/response.js';

const companyService = new CompanyService();

export class CompanyController {
  async show(req, res, next) {
    try {
      const company = await companyService.findById(req.user.companyId);
      return successResponse(res, company);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateCompanySchema.parse(req.body);
      const company = await companyService.update(req.user.companyId, data, req.user.id);
      return successResponse(res, company, 'Empresa actualizada');
    } catch (error) {
      next(error);
    }
  }

  async listSucursales(req, res, next) {
    try {
      const sucursales = await companyService.listSucursales(req.user.companyId);
      return successResponse(res, sucursales);
    } catch (error) {
      next(error);
    }
  }

  async createSucursal(req, res, next) {
    try {
      const data = createSucursalSchema.parse(req.body);
      const sucursal = await companyService.createSucursal(req.user.companyId, data, req.user.id);
      return createdResponse(res, sucursal, 'Sucursal creada');
    } catch (error) {
      next(error);
    }
  }

  async updateSucursal(req, res, next) {
    try {
      const data = updateSucursalSchema.parse(req.body);
      const sucursal = await companyService.updateSucursal(req.params.id, req.user.companyId, data, req.user.id);
      return successResponse(res, sucursal, 'Sucursal actualizada');
    } catch (error) {
      next(error);
    }
  }

  async deleteSucursal(req, res, next) {
    try {
      await companyService.deleteSucursal(req.params.id, req.user.companyId, req.user.id);
      return successResponse(res, null, 'Sucursal eliminada');
    } catch (error) {
      next(error);
    }
  }
}
