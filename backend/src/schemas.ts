import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mot de passe trop court'),
});

// Clients
export const clientSchema = z.object({
  full_name: z.string().min(2, 'Nom requis').max(255),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
});

// Commandes
export const createOrderSchema = z.object({
  client_id: z.string(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().int().min(1),
    unit_price: z.number().positive(),
  })).min(1),
  notes: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['En attente', 'En cours', 'Livrée']),
});

// Stock/Product
export const productSchema = z.object({
  name: z.string().min(1).max(255),
  buy_price: z.number().positive(),
  sell_price: z.number().positive(),
  stock_quantity: z.number().int().min(0),
  category: z.string().optional(),
  low_stock_threshold: z.number().int().min(0).default(5),
});

// Factures (minimal)
export const invoicePaymentSchema = z.object({
  payment_status: z.enum(['Payé', 'Non Payé']),
});

// Settings (generic)
export const settingsSchema = z.object({}); // Expand as needed

export type ClientData = z.infer<typeof clientSchema>;
export type OrderData = z.infer<typeof createOrderSchema>;

