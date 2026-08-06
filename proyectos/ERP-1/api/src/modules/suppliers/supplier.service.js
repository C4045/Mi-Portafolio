import { logger } from '../../config/logger.js';
import { SupplierRepository } from './supplier.repository.js';
import { SupplierResponseDTO, CreateSupplierDTO, UpdateSupplierDTO } from './supplier.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class SupplierService {
  constructor() { this.repository = new SupplierRepository(); }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive } = query;
    const { data, total } = await this.repository.findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive });
    return { data: data.map((s) => new SupplierResponseDTO(s)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async listAll(companyId) {
    const suppliers = await this.repository.listAll(companyId);
    return suppliers.map((s) => new SupplierResponseDTO(s));
  }

  async findById(id, companyId) {
    const s = await this.repository.findById(id, companyId);
    if (!s) throw new NotFoundError('Proveedor', id);
    return new SupplierResponseDTO(s);
  }

  async create(data, userId, companyId) {
    const dto = new CreateSupplierDTO(data);
    const existing = await this.repository.findByDocument(dto.documentType, dto.documentNumber, companyId);
    if (existing) throw new ConflictError('Ya existe un proveedor con ese documento');

    const supplier = await this.repository.create({ ...dto, companyId, createdBy: userId });
    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'Supplier', entityId: supplier.id, newValues: { businessName: dto.businessName, doc: dto.documentNumber } });
    logger.info(`Supplier ${dto.businessName} created by ${userId}`);
    return new SupplierResponseDTO(supplier);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Proveedor', id);
    const dto = new UpdateSupplierDTO(data);
    if (dto.documentNumber && (dto.documentNumber !== existing.documentNumber || dto.documentType !== existing.documentType)) {
      const docExists = await this.repository.findByDocument(dto.documentType || existing.documentType, dto.documentNumber, companyId);
      if (docExists) throw new ConflictError('Ya existe un proveedor con ese documento');
    }
    const updated = await this.repository.update(id, { ...dto, updatedBy: userId });
    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'Supplier', entityId: id, oldValues: { businessName: existing.businessName }, newValues: dto });
    logger.info(`Supplier ${id} updated by ${userId}`);
    return new SupplierResponseDTO(updated);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Proveedor', id);
    await this.repository.softDelete(id, userId);
    await createAuditLog({ userId, companyId, action: 'DELETE', entity: 'Supplier', entityId: id, oldValues: { businessName: existing.businessName } });
    logger.info(`Supplier ${id} deleted by ${userId}`);
  }
}
