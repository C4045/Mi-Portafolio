import { z } from 'zod';

export const createCustomerSchema = z.object({
  documentType: z.enum(['CI', 'RUC', 'PASSPORT']).optional(),
  documentNumber: z.string().min(3).max(50),
  businessName: z.string().min(2).max(300).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  birthDate: z.string().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  isCreditHold: z.coerce.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateCustomerSchema = z.object({
  documentType: z.enum(['CI', 'RUC', 'PASSPORT']).optional(),
  documentNumber: z.string().min(3).max(50).optional(),
  businessName: z.string().min(2).max(300).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  birthDate: z.string().optional().nullable(),
  creditLimit: z.coerce.number().min(0).optional(),
  isCreditHold: z.coerce.boolean().optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  isActive: z.coerce.boolean().optional(),
});
