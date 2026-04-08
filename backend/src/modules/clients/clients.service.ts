import { pool } from '../../config/db';

export const getClients = async (company_id: string) => {
  const result = await pool.query(
    'SELECT * FROM clients WHERE company_id = $1 ORDER BY full_name ASC',
    [company_id]
  );
  return result.rows;
};

export const getClientById = async (id: string, company_id: string) => {
  const result = await pool.query(
    'SELECT * FROM clients WHERE id = $1 AND company_id = $2',
    [id, company_id]
  );
  return result.rows[0] || null;
};

export const getClientOrders = async (id: string, company_id: string) => {
  const result = await pool.query(
    `SELECT o.*,
       json_agg(json_build_object(
         'product_id', oi.product_id,
         'product_name', p.name,
         'quantity', oi.quantity,
         'unit_price', oi.unit_price
       )) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.client_id = $1 AND o.company_id = $2
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [id, company_id]
  );
  return result.rows;
};

export const createClient = async (
  company_id: string,
  data: { full_name: string; phone?: string; email?: string; address?: string }
) => {
  const result = await pool.query(
    `INSERT INTO clients (company_id, full_name, phone, email, address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [company_id, data.full_name, data.phone ?? null, data.email ?? null, data.address ?? null]
  );
  return result.rows[0];
};

export const updateClient = async (
  id: string,
  company_id: string,
  data: Partial<{ full_name: string; phone: string; email: string; address: string }>
) => {
  const fields = Object.keys(data);
  if (fields.length === 0) throw new Error('Aucun champ à mettre à jour');
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = Object.values(data);
  const result = await pool.query(
    `UPDATE clients SET ${setClause} WHERE id = $${fields.length + 1} AND company_id = $${fields.length + 2} RETURNING *`,
    [...values, id, company_id]
  );
  return result.rows[0] || null;
};

export const deleteClient = async (id: string, company_id: string) => {
  const result = await pool.query(
    'DELETE FROM clients WHERE id = $1 AND company_id = $2 RETURNING id',
    [id, company_id]
  );
  return result.rowCount ? true : false;
};
