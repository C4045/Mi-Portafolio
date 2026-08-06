import { CategoryService } from './category.service.js';
import { createCategorySchema, updateCategorySchema, categoryQuerySchema } from './category.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const categoryService = new CategoryService();

export class CategoryController {
  async index(req, res, next) {
    try {
      const query = categoryQuerySchema.parse(req.query);
      const result = await categoryService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const categories = await categoryService.listAll(req.user.companyId);
      return successResponse(res, categories);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const category = await categoryService.findById(req.params.id, req.user.companyId);
      return successResponse(res, category);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await categoryService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, category, 'Categoría creada');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateCategorySchema.parse(req.body);
      const category = await categoryService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, category, 'Categoría actualizada');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await categoryService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Categoría eliminada');
    } catch (error) {
      next(error);
    }
  }
}
