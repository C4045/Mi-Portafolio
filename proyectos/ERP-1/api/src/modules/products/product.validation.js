import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(500),
  categoryId: z.string().uuid().nullable().optional(),
  unitTypeId: z.string().uuid(),
  barcode: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  productType: z.enum(['product', 'service', 'combo']).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional(),
  maxStock: z.coerce.number().min(0).optional(),
  currentStock: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  hasIva: z.boolean().optional(),
  ivaPercentage: z.coerce.number().min(0).max(100).optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  weight: z.coerce.number().min(0).nullable().optional(),
  volume: z.coerce.number().min(0).nullable().optional(),
  isTracked: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(500).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  unitTypeId: z.string().uuid().optional(),
  barcode: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  productType: z.enum(['product', 'service', 'combo']).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional(),
  maxStock: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  hasIva: z.boolean().optional(),
  ivaPercentage: z.coerce.number().min(0).max(100).optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  weight: z.coerce.number().min(0).nullable().optional(),
  volume: z.coerce.number().min(0).nullable().optional(),
  isTracked: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isActive: z.coerce.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  productType: z.enum(['product', 'service', 'combo']).optional(),
  stockStatus: z.enum(['low', 'out_of_stock', 'healthy']).optional(),
  isTracked: z.coerce.boolean().optional(),
});

export const adjustStockSchema = z.object({
  quantity: z.coerce.number().min(0),
  movementType: z.enum(['adjustment_in', 'adjustment_out', 'purchase_in', 'purchase_return', 'sale_out', 'sale_return', 'transfer_in', 'transfer_out']),
  warehouseId: z.string().uuid().nullable().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  unitCost: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});
