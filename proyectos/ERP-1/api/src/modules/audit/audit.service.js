import { prisma } from '../../config/database.js';
import { getPagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { AuditLogDTO } from './audit.dto.js';

export class AuditService {
  async findAll(query, companyId) {
    const { page, limit, skip } = getPagination(query);
    const { entity, entityId, action, userId, startDate, endDate } = query;

    const where = { companyId };

    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data: data.map((l) => new AuditLogDTO(l)), pagination: buildPaginatedResponse(total, page, limit) };
  }

  async findByEntity(entity, entityId, companyId) {
    const logs = await prisma.auditLog.findMany({
      where: { entity, entityId, companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    return logs.map((l) => new AuditLogDTO(l));
  }
}
