import { z } from 'zod';

const journalLineSchema = z.object({
  accountId: z.string().uuid(),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  description: z.string().max(500).optional(),
}).refine((data) => data.debit > 0 || data.credit > 0, {
  message: 'Debe tener débito o crédito mayor a cero',
}).refine((data) => !(data.debit > 0 && data.credit > 0), {
  message: 'No puede tener débito y crédito simultáneamente',
});

export const createJournalEntrySchema = z.object({
  description: z.string().min(3).max(500),
  entryDate: z.coerce.date().optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional(),
  lines: z.array(journalLineSchema).min(2, 'Debe tener al menos 2 líneas'),
}).refine(
  (data) => {
    const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  },
  { message: 'El total del débito debe ser igual al total del crédito' }
);

export const updateJournalEntrySchema = z.object({
  description: z.string().min(3).max(500).optional(),
  entryDate: z.coerce.date().optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional(),
  lines: z.array(journalLineSchema).min(2).optional(),
});
