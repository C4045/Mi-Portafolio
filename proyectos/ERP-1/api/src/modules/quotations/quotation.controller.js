import { QuotationService } from './quotation.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';
import { z } from 'zod';

const quotationItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  discountRate: z.coerce.number().min(0).max(100).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  description: z.string().max(500).optional(),
  unitTypeId: z.string().uuid().optional(),
});

const createQuotationSchema = z.object({
  customerId: z.string().uuid(),
  sucursalId: z.string().uuid().optional(),
  issueDate: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  currencyCode: z.string().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(quotationItemSchema).min(1),
});

const updateQuotationSchema = z.object({
  customerId: z.string().uuid().optional(),
  issueDate: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(quotationItemSchema).min(1).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const service = new QuotationService();

export class QuotationController {
  async index(req, res, next) {
    try {
      const query = querySchema.parse(req.query);
      const result = await service.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const q = await service.findById(req.params.id, req.user.companyId);
      return successResponse(res, q);
    } catch (error) { next(error); }
  }

  async store(req, res, next) {
    try {
      const data = createQuotationSchema.parse(req.body);
      const q = await service.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, q, 'Cotización creada');
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = updateQuotationSchema.parse(req.body);
      const q = await service.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, q, 'Cotización actualizada');
    } catch (error) { next(error); }
  }

  async destroy(req, res, next) {
    try {
      await service.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Cotización cancelada');
    } catch (error) { next(error); }
  }

  async accept(req, res, next) {
    try {
      const result = await service.accept(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, result, 'Cotización aceptada');
    } catch (error) { next(error); }
  }

  async convertToSale(req, res, next) {
    try {
      const sale = await service.convertToSale(req.params.id, req.user.id, req.user.companyId);
      return createdResponse(res, sale, 'Venta generada desde cotización');
    } catch (error) { next(error); }
  }

  async generatePdf(req, res, next) {
    try {
      const buffer = await service.generatePdf(req.params.id, req.user.companyId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${req.params.id}.pdf`);
      res.send(buffer);
    } catch (error) { next(error); }
  }
}
