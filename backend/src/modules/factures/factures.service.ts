import { pool } from '../../config/db';

export const getInvoices = async (company_id: string, payment_status?: string) => {
  const query = payment_status
    ? `SELECT i.*, o.total_amount, o.created_at AS order_date, c.full_name AS client_name
       FROM invoices i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       WHERE i.company_id = $1 AND i.payment_status = $2
       ORDER BY i.created_at DESC`
    : `SELECT i.*, o.total_amount, o.created_at AS order_date, c.full_name AS client_name
       FROM invoices i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       WHERE i.company_id = $1
       ORDER BY i.created_at DESC`;
  const params = payment_status ? [company_id, payment_status] : [company_id];
  const result = await pool.query(query, params);
  return result.rows;
};

export const getInvoiceById = async (id: string, company_id: string) => {
  const result = await pool.query(
    `SELECT i.*, o.total_amount, o.status AS order_status, o.notes,
       c.full_name AS client_name, c.phone AS client_phone, c.email AS client_email,
       c.address AS client_address,
       json_agg(json_build_object(
         'product_name', p.name,
         'quantity', oi.quantity,
         'unit_price', oi.unit_price,
         'subtotal', (oi.quantity * oi.unit_price)
       )) AS items
     FROM invoices i
     JOIN orders o ON o.id = i.order_id
     JOIN clients c ON c.id = o.client_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE i.id = $1 AND i.company_id = $2
     GROUP BY i.id, o.id, c.id`,
    [id, company_id]
  );
  return result.rows[0] || null;
};

export const createInvoice = async (company_id: string, order_id: string) => {
  // Vérifier que la commande appartient à la company
  const order = await pool.query(
    'SELECT id FROM orders WHERE id = $1 AND company_id = $2',
    [order_id, company_id]
  );
  if (!order.rows[0]) throw new Error('Commande introuvable');

  const result = await pool.query(
    `INSERT INTO invoices (company_id, order_id)
     VALUES ($1, $2)
     RETURNING *`,
    [company_id, order_id]
  );
  return result.rows[0];
};

export const updatePaymentStatus = async (id: string, company_id: string, payment_status: string) => {
  const result = await pool.query(
    `UPDATE invoices SET payment_status = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [payment_status, id, company_id]
  );
  return result.rows[0] || null;
};

export const updatePdfUrl = async (id: string, company_id: string, pdf_url: string) => {
  const result = await pool.query(
    `UPDATE invoices SET pdf_url = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [pdf_url, id, company_id]
  );
  return result.rows[0] || null;
};
