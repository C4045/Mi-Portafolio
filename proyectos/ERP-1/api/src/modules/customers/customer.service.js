import { logger } from '../../config/logger.js';
import { CustomerRepository } from './customer.repository.js';
import { CustomerResponseDTO, CreateCustomerDTO, UpdateCustomerDTO } from './customer.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class CustomerService {
  constructor() { this.repository = new CustomerRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive });
    return { data: data.map((c) => new CustomerResponseDTO(c)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async listAll(companyId) {
    const customers = await this.repository.listAll(companyId);
    return customers.map((c) => new CustomerResponseDTO(c));
  }

  async findById(id, companyId) {
    const c = await this.repository.findById(id, companyId);
    if (!c) throw new NotFoundError('Cliente', id);
    return new CustomerResponseDTO(c);
  }

  async create(data, userId, companyId) {
    const dto = new CreateCustomerDTO(data);
    const existing = await this.repository.findByDocument(dto.documentType, dto.documentNumber, companyId);
    if (existing) throw new ConflictError('Ya existe un cliente con ese documento');

    const customer = await this.repository.create({ ...dto, companyId, createdBy: userId });
    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Customer', entityId: customer.id, newValues: { businessName: dto.businessName || `${dto.firstName} ${dto.lastName}`, doc: dto.documentNumber } });
    logger.info(`Customer ${dto.businessName || dto.documentNumber} created by ${userId}`);
    return new CustomerResponseDTO(customer);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Cliente', id);
    const dto = new UpdateCustomerDTO(data);
    if (dto.documentNumber && (dto.documentNumber !== existing.documentNumber || dto.documentType !== existing.documentType)) {
      const docExists = await this.repository.findByDocument(dto.documentType || existing.documentType, dto.documentNumber, companyId);
      if (docExists && docExists.id !== id) throw new ConflictError('Ya existe un cliente con ese documento');
    }
    const updated = await this.repository.update(id, { ...dto, updatedBy: userId });
    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'Customer', entityId: id, oldValues: { businessName: existing.businessName }, newValues: dto });
    logger.info(`Customer ${id} updated by ${userId}`);
    return new CustomerResponseDTO(updated);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Cliente', id);
    await this.repository.softDelete(id, userId);
    await createAuditLog({ userId, companyId, action: 'DELETE', entity: 'Customer', entityId: id, oldValues: { businessName: existing.businessName } });
    logger.info(`Customer ${id} deleted by ${userId}`);
  }
}
