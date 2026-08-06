import { z } from 'zod';

export const createPaymentMethodSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
});

export const updatePaymentMethodSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(500).optional(),
  isActive: z.coerce.boolean().optional(),
});
