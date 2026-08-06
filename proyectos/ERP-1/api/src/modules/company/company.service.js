import { logger } from '../../config/logger.js';
import { CompanyRepository } from './company.repository.js';
import { CompanyResponseDTO, SucursalResponseDTO, UpdateCompanyDTO, CreateSucursalDTO, UpdateSucursalDTO } from './company.dto.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class CompanyService {
  constructor() {
    this.repository = new CompanyRepository();
  }

  async findById(companyId) {
    const company = await this.repository.findById(companyId);
    if (!company) {
      throw new NotFoundError('Empresa');
    }
    return new CompanyResponseDTO(company);
  }

  async update(companyId, data, userId) {
    const dto = new UpdateCompanyDTO(data);
    const company = await this.repository.findById(companyId);
    if (!company) {
      throw new NotFoundError('Empresa');
    }

    const oldValues = { name: company.name, taxId: company.taxId };

    const updated = await this.repository.update(companyId, {
      ...dto,
      updatedBy: userId,
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      entity: 'Company',
      entityId: companyId,
      oldValues,
      newValues: dto,
    });

    logger.info(`Company ${companyId} updated by ${userId}`);
    return new CompanyResponseDTO(updated);
  }

  async createSucursal(companyId, data, userId) {
    const dto = new CreateSucursalDTO(data);

    const existing = await this.repository.findSucursalByCode(dto.code, companyId);
    if (existing) {
      throw new ConflictError('El código de sucursal ya existe');
    }

    const sucursal = await this.repository.createSucursal({
      ...dto,
      companyId,
      createdBy: userId,
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      entity: 'Sucursal',
      entityId: sucursal.id,
      newValues: { code: dto.code, name: dto.name },
    });

    logger.info(`Sucursal ${dto.code} created by ${userId}`);
    return new SucursalResponseDTO(sucursal);
  }

  async updateSucursal(id, companyId, data, userId) {
    const existing = await this.repository.findSucursalById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Sucursal', id);
    }

    const dto = new UpdateSucursalDTO(data);

    const updated = await this.repository.updateSucursal(id, {
      ...dto,
      updatedBy: userId,
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      entity: 'Sucursal',
      entityId: id,
      oldValues: { name: existing.name },
      newValues: dto,
    });

    logger.info(`Sucursal ${id} updated by ${userId}`);
    return new SucursalResponseDTO(updated);
  }

  async deleteSucursal(id, companyId, userId) {
    const existing = await this.repository.findSucursalById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Sucursal', id);
    }

    await this.repository.softDeleteSucursal(id, userId);

    await createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      entity: 'Sucursal',
      entityId: id,
      oldValues: { name: existing.name },
    });

    logger.info(`Sucursal ${id} deleted by ${userId}`);
  }

  async listSucursales(companyId) {
    const sucursales = await this.repository.listSucursales(companyId);
    return sucursales.map((s) => new SucursalResponseDTO(s));
  }
}
