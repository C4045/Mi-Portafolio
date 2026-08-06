import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { UserRepository } from './user.repository.js';
import { UserResponseDTO, CreateUserDTO, UpdateUserDTO } from './user.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  async findAll(query, userId, companyId) {
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
      data: data.map((user) => new UserResponseDTO(user)),
      pagination: buildPaginatedResponse(total, page, limit),
    };
  }

  async findById(id, companyId) {
    const user = await this.repository.findById(id, companyId);
    if (!user) {
      throw new NotFoundError('Usuario', id);
    }
    return new UserResponseDTO(user);
  }

  async create(data, userId, companyId) {
    const dto = new CreateUserDTO(data);

    const existingEmail = await this.repository.findByEmail(dto.email, companyId);
    if (existingEmail) {
      throw new ConflictError('El email ya está registrado en esta empresa');
    }

    const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

    const user = await this.repository.create({
      ...dto,
      passwordHash,
      companyId,
      createdBy: userId,
    });

    if (dto.roleIds.length > 0) {
      await this.repository.assignRoles(user.id, dto.roleIds);
    }

    const fullUser = await this.repository.findById(user.id, companyId);

    await createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      newValues: { username: dto.username, email: dto.email },
    });

    logger.info(`User ${dto.email} created by ${userId}`);
    return new UserResponseDTO(fullUser);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    const dto = new UpdateUserDTO(data);

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.repository.findByEmail(dto.email, companyId);
      if (emailExists) {
        throw new ConflictError('El email ya está registrado en esta empresa');
      }
    }

    const oldValues = {
      username: existing.username,
      email: existing.email,
      isActive: existing.isActive,
    };

    const updated = await this.repository.update(id, {
      ...dto,
      updatedBy: userId,
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValues,
      newValues: dto,
    });

    const fullUser = await this.repository.findById(id, companyId);
    logger.info(`User ${id} updated by ${userId}`);
    return new UserResponseDTO(fullUser);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    await this.repository.softDelete(id, userId);

    await createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      oldValues: { username: existing.username, email: existing.email },
    });

    logger.info(`User ${id} deleted by ${userId}`);
  }

  async assignRoles(id, roleIds, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Usuario', id);
    }

    await this.repository.assignRoles(id, roleIds);

    await createAuditLog({
      userId,
      companyId,
      action: 'ASSIGN_ROLES',
      entity: 'User',
      entityId: id,
      newValues: { roleIds },
    });

    const fullUser = await this.repository.findById(id, companyId);
    logger.info(`Roles assigned to user ${id} by ${userId}`);
    return new UserResponseDTO(fullUser);
  }
}
