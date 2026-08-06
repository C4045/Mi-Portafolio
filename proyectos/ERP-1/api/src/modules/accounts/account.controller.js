import { AccountService } from './account.service.js';
import { createAccountSchema, updateAccountSchema } from './account.validation.js';
import { successResponse, createdResponse } from '../../utils/response.js';

const service = new AccountService();

export class AccountController {
  async index(req, res, next) {
    try {
      const tree = await service.findTree(req.user.companyId);
      return successResponse(res, tree);
    } catch (error) { next(error); }
  }

  async list(req, res, next) {
    try {
      const accounts = await service.findAll(req.user.companyId);
      return successResponse(res, accounts);
    } catch (error) { next(error); }
  }

  async show(req, res, next) {
    try {
      const account = await service.findById(req.params.id, req.user.companyId);
      return successResponse(res, account);
    } catch (error) { next(error); }
  }

  async store(req, res, next) {
    try {
      const data = createAccountSchema.parse(req.body);
      const account = await service.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, account, 'Cuenta contable creada');
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = updateAccountSchema.parse(req.body);
      const account = await service.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, account, 'Cuenta contable actualizada');
    } catch (error) { next(error); }
  }

  async destroy(req, res, next) {
    try {
      await service.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Cuenta contable eliminada');
    } catch (error) { next(error); }
  }
}
