import { logger } from '../../config/logger.js';
import { AccountRepository } from './account.repository.js';
import { AccountResponseDTO } from './account.dto.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class AccountService {
  constructor() { this.repository = new AccountRepository(); }

  async findTree(companyId) {
    const roots = await this.repository.findTree(companyId);
    return roots.map((a) => new AccountResponseDTO(a));
  }

  async findAll(companyId) {
    const accounts = await this.repository.findAll(companyId);
    return accounts.map((a) => new AccountResponseDTO(a));
  }

  async findById(id, companyId) {
    const a = await this.repository.findById(id, companyId);
    if (!a) throw new NotFoundError('Cuenta contable', id);
    return new AccountResponseDTO(a);
  }

  async create(data, userId, companyId) {
    const dup = await this.repository.findByCode(data.code, companyId);
    if (dup) throw new ConflictError('Ya existe una cuenta con ese código');
    if (data.parentId) {
      const parent = await this.repository.findById(data.parentId, companyId);
      if (!parent) throw new NotFoundError('Cuenta padre', data.parentId);
    }
    const account = await this.repository.create({ ...data, companyId });
    logger.info(`Account ${data.code} created by ${userId}`);
    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Account', entityId: account.id, newValues: { code: data.code, name: data.name } });
    return new AccountResponseDTO(account);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Cuenta contable', id);
    if (data.code && data.code !== existing.code) {
      const dup = await this.repository.findByCode(data.code, companyId);
      if (dup) throw new ConflictError('Ya existe una cuenta con ese código');
    }
    if (data.parentId && data.parentId !== existing.parentId) {
      if (data.parentId === id) throw new ConflictError('Una cuenta no puede ser su propio padre');
      const parent = await this.repository.findById(data.parentId, companyId);
      if (!parent) throw new NotFoundError('Cuenta padre', data.parentId);
    }
    const updated = await this.repository.update(id, data);
    logger.info(`Account ${id} updated by ${userId}`);
    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'Account', entityId: id, oldValues: { code: existing.code, name: existing.name }, newValues: data });
    return new AccountResponseDTO(updated);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Cuenta contable', id);
    await this.repository.delete(id);
    logger.info(`Account ${id} deleted by ${userId}`);
    await createAuditLog({ userId, companyId, action: 'DELETE', entity: 'Account', entityId: id, oldValues: { code: existing.code, name: existing.name } });
  }
}
