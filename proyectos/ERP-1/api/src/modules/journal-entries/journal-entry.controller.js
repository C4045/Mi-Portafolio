import { JournalEntryService } from './journal-entry.service.js';
import { createJournalEntrySchema, updateJournalEntrySchema } from './journal-entry.validation.js';
import { successResponse, createdResponse } from '../../utils/response.js';

const service = new JournalEntryService();

export class JournalEntryController {
  async index(req, res, next) {
    try {
      const result = await service.findAll(req.user.companyId, req.query);
      return successResponse(res, result);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const entry = await service.findById(req.params.id, req.user.companyId);
      return successResponse(res, entry);
    } catch (error) { next(error); }
  }

  async store(req, res, next) {
    try {
      const data = createJournalEntrySchema.parse(req.body);
      const entry = await service.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, entry, 'Asiento contable creado');
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = updateJournalEntrySchema.parse(req.body);
      const entry = await service.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, entry, 'Asiento contable actualizado');
    } catch (error) { next(error); }
  }

  async post(req, res, next) {
    try {
      const entry = await service.post(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, entry, 'Asiento contable contabilizado');
    } catch (error) { next(error); }
  }

  async destroy(req, res, next) {
    try {
      await service.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Asiento contable eliminado');
    } catch (error) { next(error); }
  }
}
