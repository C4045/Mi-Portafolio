import { z } from 'zod';

export const purchaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().min(0.01),
  unitCost: z.coerce.number().min(0),
  discountRate: z.coerce.number().min(0).max(100).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  description: z.string().max(500).optional(),
  unitTypeId: z.string().uuid().optional(),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  sucursalId: z.string().uuid().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().nullable().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(purchaseItemSchema).min(1, 'Al menos un producto requerido'),
});

export const updatePurchaseSchema = z.object({
  supplierId: z.string().uuid().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().nullable().optional(),
  status: z.enum(['draft', 'ordered', 'partially_received', 'received', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(purchaseItemSchema).min(1).optional(),
});

export const purchaseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const receiveItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number().min(0),
});

export const receiveItemsSchema = z.object({
  items: z.array(receiveItemSchema).min(1),
});
