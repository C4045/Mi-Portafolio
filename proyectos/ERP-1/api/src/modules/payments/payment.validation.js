import { z } from 'zod';

export const createPaymentSchema = z.object({
  saleId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  amount: z.coerce.number().min(0.01),
  reference: z.string().max(100).optional(),
  paymentDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  saleId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
