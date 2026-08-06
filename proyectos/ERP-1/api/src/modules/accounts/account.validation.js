import { z } from 'zod';

export const createAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(200),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  nature: z.enum(['debit', 'credit']),
  level: z.coerce.number().int().min(1).max(10).default(1),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(500).optional(),
});

export const updateAccountSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(2).max(200).optional(),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']).optional(),
  nature: z.enum(['debit', 'credit']).optional(),
  level: z.coerce.number().int().min(1).max(10).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(500).optional(),
  isActive: z.coerce.boolean().optional(),
});
