import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class RoleRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, isActive }) {
    const where = { companyId, deletedAt: null };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = buildSearch(search, ['name', 'displayName', 'description']);
    }

    const orderBy = buildSort(sortBy, sortOrder, ['name', 'displayName', 'level', 'createdAt', 'isActive']);

    const [data, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      }),
      prisma.role.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id, companyId) {
    return prisma.role.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async findByName(name, companyId) {
    return prisma.role.findFirst({
      where: { name, companyId, deletedAt: null },
    });
  }

  async create(data) {
    return prisma.role.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        level: data.level,
        createdBy: data.createdBy,
      },
    });
  }

  async update(id, data) {
    return prisma.role.update({
      where: { id },
      data,
    });
  }

  async softDelete(id, deletedBy) {
    return prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  }

  async assignPermissions(roleId, permissionIds) {
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
  }

  async findAllPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async findPermissionsByModule() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    const grouped = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) grouped[perm.module] = [];
      grouped[perm.module].push(perm);
    }
    return grouped;
  }
}
