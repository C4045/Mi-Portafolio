import { logger } from '../../config/logger.js';
import { RoleRepository } from './role.repository.js';
import { RoleResponseDTO, CreateRoleDTO, UpdateRoleDTO, PermissionResponseDTO } from './role.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { ForbiddenError } from '../../errors/UnauthorizedError.js';
import { createAuditLog } from '../../utils/audit.js';

export class RoleService {
  constructor() {
    this.repository = new RoleRepository();
  }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive } = query;

    const { data, total } = await this.repository.findAll({
      companyId,
      page,
      limit,
      skip,
      search,
      sortBy,
      sortOrder,
      isActive,
    });

    return {
      data: data.map((role) => new RoleResponseDTO(role)),
      pagination: buildPaginatedResponse(total, page, limit),
    };
  }

  async findById(id, companyId) {
    const role = await this.repository.findById(id, companyId);
    if (!role) {
      throw new NotFoundError('Rol', id);
    }
    return new RoleResponseDTO(role);
  }

  async create(data, userId, companyId) {
    const dto = new CreateRoleDTO(data);

    const existing = await this.repository.findByName(dto.name, companyId);
    if (existing) {
      throw new ConflictError('El nombre del rol ya existe');
    }

    const role = await this.repository.create({
      ...dto,
      companyId,
      createdBy: userId,
    });

    if (dto.permissionIds.length > 0) {
      await this.repository.assignPermissions(role.id, dto.permissionIds);
    }

    const fullRole = await this.repository.findById(role.id, companyId);

    await createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      entity: 'Role',
      entityId: role.id,
      newValues: { name: dto.name, displayName: dto.displayName },
    });

    logger.info(`Role ${dto.name} created by ${userId}`);
    return new RoleResponseDTO(fullRole);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Rol', id);
    }

    if (existing.isSystem) {
      throw new ForbiddenError('No puedes modificar un rol del sistema');
    }

    const dto = new UpdateRoleDTO(data);

    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: userId,
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      entity: 'Role',
      entityId: id,
      oldValues: { displayName: existing.displayName },
      newValues: dto,
    });

    const fullRole = await this.repository.findById(id, companyId);
    logger.info(`Role ${id} updated by ${userId}`);
    return new RoleResponseDTO(fullRole);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Rol', id);
    }

    if (existing.isSystem) {
      throw new ForbiddenError('No puedes eliminar un rol del sistema');
    }

    await this.repository.softDelete(id, userId);

    await createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      entity: 'Role',
      entityId: id,
      oldValues: { name: existing.name },
    });

    logger.info(`Role ${id} deleted by ${userId}`);
  }

  async assignPermissions(id, permissionIds, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Rol', id);
    }

    await this.repository.assignPermissions(id, permissionIds);

    await createAuditLog({
      userId,
      companyId,
      action: 'ASSIGN_PERMISSIONS',
      entity: 'Role',
      entityId: id,
      newValues: { permissionIds },
    });

    const fullRole = await this.repository.findById(id, companyId);
    logger.info(`Permissions assigned to role ${id} by ${userId}`);
    return new RoleResponseDTO(fullRole);
  }

  async listPermissions() {
    const grouped = await this.repository.findPermissionsByModule();
    return grouped;
  }
}
