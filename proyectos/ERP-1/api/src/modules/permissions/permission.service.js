import { logger } from '../../config/logger.js';
import { PermissionRepository } from './permission.repository.js';
import { PermissionResponseDTO } from './permission.dto.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';

export class PermissionService {
  constructor() { this.repository = new PermissionRepository(); }

  async findAll() {
    const grouped = await this.repository.findAllGrouped();
    return grouped;
  }

  async findById(id) {
    const perm = await this.repository.findById(id);
    if (!perm) throw new NotFoundError('Permiso', id);
    return new PermissionResponseDTO(perm);
  }

  async create(data) {
    const name = `${data.module}.${data.action}`;
    const existing = await this.repository.findByName(name);
    if (existing) throw new ConflictError('El permiso ya existe');
    const perm = await this.repository.create({ ...data, name });
    logger.info(`Permission ${name} created`);
    return new PermissionResponseDTO(perm);
  }

  async delete(id) {
    const perm = await this.repository.findById(id);
    if (!perm) throw new NotFoundError('Permiso', id);
    await this.repository.delete(id);
    logger.info(`Permission ${perm.name} deleted`);
  }
}
