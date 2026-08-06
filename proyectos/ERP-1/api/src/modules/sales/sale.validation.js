import { z } from 'zod';

export const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  discountRate: z.coerce.number().min(0).max(100).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  description: z.string().max(500).optional(),
  unitTypeId: z.string().uuid().optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid(),
  sucursalId: z.string().uuid().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  paymentTerm: z.string().max(50).optional(),
  currencyCode: z.enum(['PYG', 'USD', 'BRL', 'ARS']).optional(),
  exchangeRate: z.coerce.number().min(0).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountRate: z.coerce.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
  items: z.array(saleItemSchema).min(1, 'Al menos un producto requerido'),
});

export const updateSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  paymentTerm: z.string().max(50).optional(),
  currencyCode: z.enum(['PYG', 'USD', 'BRL', 'ARS']).optional(),
  exchangeRate: z.coerce.number().min(0).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountRate: z.coerce.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
  status: z.enum(['draft', 'confirmed', 'invoiced', 'cancelled', 'partially_paid', 'paid']).optional(),
  items: z.array(saleItemSchema).min(1).optional(),
});

export const saleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const confirmSaleSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().uuid(),
  })).optional(),
});
