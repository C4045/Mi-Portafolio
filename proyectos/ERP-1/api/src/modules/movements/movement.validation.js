import { z } from 'zod';

export const createMovementSchema = z.object({
  productId: z.string().uuid(),
  movementType: z.enum(['purchase_in', 'purchase_return', 'sale_out', 'sale_return', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out', 'initial']),
  quantity: z.coerce.number().min(0),
  warehouseId: z.string().uuid().nullable().optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().optional(),
  unitCost: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const movementQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  movementType: z.string().optional(),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
