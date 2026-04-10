import { z } from 'zod';
import { ROLES, ORDER_STATUSES, PAYMENT_STATUSES } from './constants';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().min(1, 'Email requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

// Controller reads req.body.password — field must be named "password"
export const changePasswordSchema = z.object({
  password: z.string().min(6, 'Minimum 6 caractères'),
});

export const registerSchema = z.object({
  email:    z.string().min(1, 'Email requis'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  role:     z.enum(ROLES).default('Commercial'),
});

// ── Clients ───────────────────────────────────────────────────────────────────
export const clientSchema = z.object({
  full_name:   z.string().min(2, 'Nom requis').max(255),
  phone:       z.string().optional(),
  email:       z.string().optional(),
  address:     z.string().max(500).optional(),
  client_type: z.enum(['Particulier', 'Entreprise']).default('Particulier'),
  nif:         z.string().optional(),
  nis:         z.string().optional(),
  rc:          z.string().optional(),
  ai:          z.string().optional(),
});

// PUT allows partial updates — only validate fields that are provided
export const clientUpdateSchema = clientSchema.partial().refine(
  d => d.full_name === undefined || d.full_name.length >= 2,
  { message: 'Nom trop court', path: ['full_name'] }
);

// ── Commandes ─────────────────────────────────────────────────────────────────
export const createOrderSchema = z.object({
  client_id: z.string().min(1, 'client_id requis'),
  items: z.array(z.object({
    product_id: z.string().min(1),
    quantity:   z.number().int().min(1),
    unit_price: z.number().positive(),
  })).min(1, 'Au moins un article requis'),
  notes: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

// ── Stock ─────────────────────────────────────────────────────────────────────
export const productSchema = z.object({
  name:                z.string().min(1).max(255),
  buy_price:           z.number().nonnegative(),
  sell_price:          z.number().nonnegative(),
  stock_quantity:      z.number().int().min(0).default(0),
  category:            z.string().optional(),
  low_stock_threshold: z.number().int().min(0).default(5),
});

export const productUpdateSchema = productSchema.partial();

export const stockMovementSchema = z.object({
  delta:  z.number().int().refine(n => n !== 0, { message: 'delta ne peut pas être 0' }),
  reason: z.string().min(1, 'Motif requis'),
});

// ── Factures ──────────────────────────────────────────────────────────────────
export const createInvoiceSchema = z.object({
  order_id: z.string().min(1, 'order_id requis'),
});

export const invoicePaymentSchema = z.object({
  payment_status: z.enum(PAYMENT_STATUSES),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type ClientData       = z.infer<typeof clientSchema>;
export type OrderData        = z.infer<typeof createOrderSchema>;
export type ProductData      = z.infer<typeof productSchema>;
export type RegisterData     = z.infer<typeof registerSchema>;
