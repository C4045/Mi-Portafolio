import { prisma } from '../../config/database.js';

export class JournalEntryRepository {
  async findAll(companyId, filters = {}) {
    const where = { companyId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.startDate && filters.endDate) {
      where.entryDate = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) };
    }
    return prisma.journalEntry.findMany({
      where,
      orderBy: { entryNumber: 'desc' },
      include: { lines: { include: { account: { select: { id: true, code: true, name: true } } } } },
      skip: filters.skip || 0,
      take: filters.take || 100,
    });
  }

  async count(companyId, filters = {}) {
    const where = { companyId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    return prisma.journalEntry.count({ where });
  }

  async findById(id, companyId) {
    return prisma.journalEntry.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { lines: { include: { account: { select: { id: true, code: true, name: true } } } } },
    });
  }

  async findLastEntry(companyId) {
    return prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });
  }

  async create(data, lines) {
    return prisma.journalEntry.create({
      data: { ...data, lines: { create: lines } },
      include: { lines: { include: { account: { select: { id: true, code: true, name: true } } } } },
    });
  }

  async update(id, data, lines) {
    const updateData = { ...data };
    if (lines) {
      updateData.lines = { deleteMany: {}, create: lines };
    }
    return prisma.journalEntry.update({
      where: { id },
      data: updateData,
      include: { lines: { include: { account: { select: { id: true, code: true, name: true } } } } },
    });
  }

  async softDelete(id) {
    return prisma.journalEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
