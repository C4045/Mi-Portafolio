import { InvoiceService } from './invoice.service.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const service = new InvoiceService();

export class InvoiceController {
  async index(req, res, next) {
    try { const query = querySchema.parse(req.query); const result = await service.findAll(query, req.user.companyId); return paginatedResponse(res, result.data, result.pagination); }
    catch (error) { next(error); }
  }
  async show(req, res, next) {
    try { const inv = await service.findById(req.params.id, req.user.companyId); return successResponse(res, inv); }
    catch (error) { next(error); }
  }
  async generateFromSale(req, res, next) {
    try { const inv = await service.generateFromSale(req.params.saleId, req.user.id, req.user.companyId); return createdResponse(res, inv, 'Factura generada'); }
    catch (error) { next(error); }
  }
  async destroy(req, res, next) {
    try { await service.cancel(req.params.id, req.user.id, req.user.companyId); return successResponse(res, null, 'Factura cancelada'); }
    catch (error) { next(error); }
  }
  async generatePdf(req, res, next) {
    try { const buffer = await service.generatePdf(req.params.id, req.user.companyId); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename=factura-${req.params.id}.pdf`); res.send(buffer); }
    catch (error) { next(error); }
  }
}
