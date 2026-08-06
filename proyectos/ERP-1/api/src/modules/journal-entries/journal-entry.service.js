import { logger } from '../../config/logger.js';
import { JournalEntryRepository } from './journal-entry.repository.js';
import { JournalEntryResponseDTO } from './journal-entry.dto.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { createAuditLog } from '../../utils/audit.js';

export class JournalEntryService {
  constructor() { this.repository = new JournalEntryRepository(); }

  async findAll(companyId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 100;
    const filters = {
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      skip: (page - 1) * limit,
      take: limit,
    };
    const [entries, total] = await Promise.all([
      this.repository.findAll(companyId, filters),
      this.repository.count(companyId, filters),
    ]);
    return { data: entries.map((e) => new JournalEntryResponseDTO(e)), total, page, limit };
  }

  async findById(id, companyId) {
    const entry = await this.repository.findById(id, companyId);
    if (!entry) throw new NotFoundError('Asiento contable', id);
    return new JournalEntryResponseDTO(entry);
  }

  async create(data, userId, companyId) {
    const last = await this.repository.findLastEntry(companyId);
    const nextNum = last ? String(Number(last.entryNumber.split('-')[1]) + 1).padStart(6, '0') : '000001';
    const entryNumber = `AS-${nextNum}`;

    const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);

    const entry = await this.repository.create(
      {
        companyId,
        entryNumber,
        description: data.description,
        entryDate: data.entryDate || new Date(),
        totalDebit,
        totalCredit,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        status: 'draft',
        createdBy: userId,
      },
      data.lines.map((l, i) => ({
        accountId: l.accountId,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description || null,
      }))
    );
    logger.info(`JournalEntry ${entryNumber} created by ${userId}`);
    await createAuditLog({ userId, companyId, action: 'CREATE', entity: 'JournalEntry', entityId: entry.id, newValues: { entryNumber, description: data.description } });
    return new JournalEntryResponseDTO(entry);
  }

  async update(id, data, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Asiento contable', id);
    if (existing.status === 'posted') throw new ConflictError('No se puede modificar un asiento contabilizado');

    const updateData = { updatedBy: userId };
    if (data.description) updateData.description = data.description;
    if (data.entryDate) updateData.entryDate = data.entryDate;
    if (data.referenceType !== undefined) updateData.referenceType = data.referenceType;
    if (data.referenceId !== undefined) updateData.referenceId = data.referenceId;

    let lines = null;
    if (data.lines) {
      const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
      updateData.totalDebit = totalDebit;
      updateData.totalCredit = totalCredit;
      lines = data.lines.map((l, i) => ({
        accountId: l.accountId,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description || null,
      }));
    }

    const updated = await this.repository.update(id, updateData, lines);
    logger.info(`JournalEntry ${id} updated by ${userId}`);
    await createAuditLog({ userId, companyId, action: 'UPDATE', entity: 'JournalEntry', entityId: id, oldValues: { status: existing.status }, newValues: data });
    return new JournalEntryResponseDTO(updated);
  }

  async post(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Asiento contable', id);
    if (existing.status === 'posted') throw new ConflictError('El asiento ya está contabilizado');
    const posted = await this.repository.update(id, { status: 'posted', updatedBy: userId });
    logger.info(`JournalEntry ${existing.entryNumber} posted by ${userId}`);
    await createAuditLog({ userId, companyId, action: 'POST', entity: 'JournalEntry', entityId: id, oldValues: { status: existing.status }, newValues: { status: 'posted' } });
    return new JournalEntryResponseDTO(posted);
  }

  async delete(id, userId, companyId) {
    const existing = await this.repository.findById(id, companyId);
    if (!existing) throw new NotFoundError('Asiento contable', id);
    if (existing.status === 'posted') throw new ConflictError('No se puede eliminar un asiento contabilizado');
    await this.repository.softDelete(id);
    logger.info(`JournalEntry ${id} deleted by ${userId}`);
    await createAuditLog({ userId, companyId, action: 'DELETE', entity: 'JournalEntry', entityId: id, oldValues: { entryNumber: existing.entryNumber } });
  }
}
