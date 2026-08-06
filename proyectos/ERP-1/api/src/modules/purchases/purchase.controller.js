import { PurchaseService } from './purchase.service.js';
import { createPurchaseSchema, updatePurchaseSchema, purchaseQuerySchema, receiveItemsSchema } from './purchase.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';

const purchaseService = new PurchaseService();

export class PurchaseController {
  async index(req, res, next) {
    try {
      const query = purchaseQuerySchema.parse(req.query);
      const result = await purchaseService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const purchase = await purchaseService.findById(req.params.id, req.user.companyId);
      return successResponse(res, purchase);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createPurchaseSchema.parse(req.body);
      const purchase = await purchaseService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, purchase, 'Orden de compra creada');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updatePurchaseSchema.parse(req.body);
      const purchase = await purchaseService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, purchase, 'Orden actualizada');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await purchaseService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Orden cancelada');
    } catch (error) {
      next(error);
    }
  }

  async receive(req, res, next) {
    try {
      const data = receiveItemsSchema.parse(req.body);
      const result = await purchaseService.receiveItems(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, result, 'Mercadería recibida');
    } catch (error) {
      next(error);
    }
  }

  async generatePdf(req, res, next) {
    try {
      const buffer = await purchaseService.generatePdf(req.params.id, req.user.companyId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=orden-compra-${req.params.id}.pdf`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
