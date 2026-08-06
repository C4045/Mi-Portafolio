import { ProductService } from './product.service.js';
import { createProductSchema, updateProductSchema, productQuerySchema, adjustStockSchema } from './product.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const productService = new ProductService();

export class ProductController {
  async index(req, res, next) {
    try {
      const query = productQuerySchema.parse(req.query);
      const result = await productService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const product = await productService.findById(req.params.id, req.user.companyId);
      return successResponse(res, product);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await productService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, product, 'Producto creado');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateProductSchema.parse(req.body);
      const product = await productService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, product, 'Producto actualizado');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await productService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Producto eliminado');
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const data = adjustStockSchema.parse(req.body);
      const result = await productService.adjustStock(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, result, 'Stock ajustado');
    } catch (error) {
      next(error);
    }
  }

  async getStockAlerts(req, res, next) {
    try {
      const alerts = await productService.getStockAlerts(req.user.companyId);
      return successResponse(res, alerts);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const movements = await productService.getMovementHistory(req.params.id, req.user.companyId);
      return successResponse(res, movements);
    } catch (error) {
      next(error);
    }
  }
}
