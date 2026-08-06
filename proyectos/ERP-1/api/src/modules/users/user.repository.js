import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class UserRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive }) {
    const where = { companyId, deletedAt: null };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = buildSearch(search, ['username', 'email', 'firstName', 'lastName']);
    }

    const orderBy = buildSort(sortBy, sortOrder, ['username', 'email', 'firstName', 'lastName', 'createdAt', 'isActive']);

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          roles: { include: { role: true } },
          sucursal: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id, companyId) {
    return prisma.user.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        roles: { include: { role: true } },
        sucursal: { select: { id: true, name: true } },
      },
    });
  }

  async findByEmail(email, companyId) {
    return prisma.user.findFirst({
      where: { email, companyId, deletedAt: null },
    });
  }

  async create(data) {
    return prisma.user.create({
      data: {
        companyId: data.companyId,
        sucursalId: data.sucursalId,
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        createdBy: data.createdBy,
      },
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id, deletedBy) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  }

  async assignRoles(userId, roleIds) {
    await prisma.userRole.deleteMany({ where: { userId } });

    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
      });
    }
  }

  async getUserRoles(userId) {
    return prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }
}
