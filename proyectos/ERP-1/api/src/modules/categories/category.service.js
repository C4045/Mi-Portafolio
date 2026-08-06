import { logger } from '../../config/logger.js';
import { CategoryRepository } from './category.repository.js';
import { CategoryResponseDTO, CreateCategoryDTO, UpdateCategoryDTO } from './category.dto.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class CategoryService {
  constructor() {
    this.repository = new CategoryRepository();
  }

  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { search, sortBy, sortOrder, isActive, parentId } = query;

    const { data, total } = await this.repository.findAll({
      companyId, page, limit, skip, search, sortBy, sortOrder, isActive, parentId,
    });

    return {
      data: data.map((cat) => new CategoryResponseDTO(cat)),
      pagination: buildPaginatedResponse(total, page, limit),
    };
  }

  async listAll(companyId) {
    const categories = await this.repository.listAll(companyId);
    return categories.map((cat) => new CategoryResponseDTO(cat));
  }

  async findById(id, companyId) {
    const category = await this.repository.findById(id, companyId);
    if (!category) throw new NotFoundError('Categoría', id);
    return new CategoryResponseDTO(category);
  }

  async create(data, userId, companyId) {
    const dto = new CreateCategoryDTO(data);
    const existing = await this.repository.findByCode(dto.code, companyId);
    if (existing) throw new ConflictError('El código de categoría ya existe');

    const category = await this.repository.create({
      ...dto,
      companyId,
      createdBy: userId,
    });

    await createAuditLog({
      userId, companyId, action: 'CREATE', entity: 'Category', entityId: category.id,
      newValues: { code: dto.code, name: dto.name },
    });

    logger.info(`Category ${dto.code} created by ${userId}`);
    return new CategoryResponseDTO(category);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Categoría', id);

    const dto = new UpdateCategoryDTO(data);

    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.repository.findByCode(dto.code, companyId);
      if (codeExists) throw new ConflictError('El código de categoría ya existe');
    }

    const updated = await this.repository.update(id, { ...dto, updatedBy: userId });

    await createAuditLog({
      userId, companyId, action: 'UPDATE', entity: 'Category', entityId: id,
      oldValues: { code: existing.code, name: existing.name },
      newValues: dto,
    });

    logger.info(`Category ${id} updated by ${userId}`);
    return new CategoryResponseDTO(updated);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Categoría', id);

    await this.repository.softDelete(id, userId);

    await createAuditLog({
      userId, companyId, action: 'DELETE', entity: 'Category', entityId: id,
      oldValues: { code: existing.code, name: existing.name },
    });

    logger.info(`Category ${id} deleted by ${userId}`);
  }
}
