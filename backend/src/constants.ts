export const ROLES = ['Admin', 'Employé', 'Comptable', 'Commercial', 'Logistique', 'Livreur', 'SuperAdmin'] as const;
export type Role = typeof ROLES[number];

export const ORDER_STATUSES = ['En attente', 'En cours', 'Livrée'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_RANK: Record<OrderStatus, number> = {
  'En attente': 0,
  'En cours':   1,
  'Livrée':     2,
};

export const PAYMENT_STATUSES = ['Non Payé', 'Payé'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
