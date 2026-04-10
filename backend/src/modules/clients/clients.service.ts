import { pool } from '../../config/db';
import ExcelJS from 'exceljs';

type ClientData = {
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  client_type?: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
};

export const getClients = async (company_id: string, limit = 500, offset = 0) => {
  const result = await pool.query(
    'SELECT * FROM clients WHERE company_id = $1 ORDER BY full_name ASC LIMIT $2 OFFSET $3',
    [company_id, limit, offset]
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

export const createClient = async (company_id: string, data: ClientData) => {
  const result = await pool.query(
    `INSERT INTO clients (company_id, full_name, phone, email, address, client_type, nif, nis, rc, ai)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      company_id,
      data.full_name,
      data.phone ?? null,
      data.email ?? null,
      data.address ?? null,
      data.client_type ?? 'Particulier',
      data.nif ?? null,
      data.nis ?? null,
      data.rc ?? null,
      data.ai ?? null,
    ]
  );
  return result.rows[0];
};

export const updateClient = async (id: string, company_id: string, data: Partial<ClientData>) => {
  const allowed = ['full_name', 'phone', 'email', 'address', 'client_type', 'nif', 'nis', 'rc', 'ai'];
  const fields = Object.keys(data).filter(k => allowed.includes(k));
  if (fields.length === 0) throw new Error('Aucun champ à mettre à jour');
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => (data as any)[f]);
  const result = await pool.query(
    `UPDATE clients SET ${setClause} WHERE id = $${fields.length + 1} AND company_id = $${fields.length + 2} RETURNING *`,
    [...values, id, company_id]
  );
  return result.rows[0] || null;
};

export const getClientStats = async (id: string, company_id: string) => {
  const result = await pool.query(`
    SELECT
      COUNT(DISTINCT o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_spent,
      COUNT(DISTINCT CASE WHEN i.payment_status = 'Non Payé' THEN i.id END) AS unpaid_invoices,
      COALESCE(SUM(CASE WHEN i.payment_status = 'Non Payé' THEN o.total_amount ELSE 0 END), 0) AS unpaid_amount,
      MAX(o.created_at) AS last_order_at
    FROM clients c
    LEFT JOIN orders o ON o.client_id = c.id AND o.company_id = $2
    LEFT JOIN invoices i ON i.order_id = o.id
    WHERE c.id = $1 AND c.company_id = $2
  `, [id, company_id]);
  return result.rows[0];
};

export const exportClientsXlsx = async (company_id: string): Promise<ArrayBuffer> => {
  const result = await pool.query(
    `SELECT c.full_name, c.phone, c.email, c.address, c.client_type,
            c.nif, c.nis, c.rc, c.ai, c.created_at,
            COUNT(DISTINCT o.id) AS total_orders,
            COALESCE(SUM(o.total_amount), 0) AS total_spent
     FROM clients c
     LEFT JOIN orders o ON o.client_id = c.id AND o.company_id = c.company_id
     WHERE c.company_id = $1
     GROUP BY c.id
     ORDER BY c.full_name ASC`,
    [company_id]
  );

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Clients');

  ws.columns = [
    { header: 'Nom',            key: 'full_name',    width: 28 },
    { header: 'Type',           key: 'client_type',  width: 14 },
    { header: 'Téléphone',      key: 'phone',        width: 16 },
    { header: 'Email',          key: 'email',        width: 26 },
    { header: 'Adresse',        key: 'address',      width: 30 },
    { header: 'NIF',            key: 'nif',          width: 14 },
    { header: 'NIS',            key: 'nis',          width: 14 },
    { header: 'RC',             key: 'rc',           width: 14 },
    { header: 'AI',             key: 'ai',           width: 14 },
    { header: 'Commandes',      key: 'total_orders', width: 12 },
    { header: 'Total (DA)',      key: 'total_spent',  width: 16 },
    { header: 'Créé le',        key: 'created_at',   width: 14 },
  ];

  ws.getRow(1).font = { bold: true };

  for (const row of result.rows) {
    ws.addRow({
      full_name:    row.full_name,
      client_type:  row.client_type,
      phone:        row.phone ?? '',
      email:        row.email ?? '',
      address:      row.address ?? '',
      nif:          row.nif ?? '',
      nis:          row.nis ?? '',
      rc:           row.rc ?? '',
      ai:           row.ai ?? '',
      total_orders: Number(row.total_orders),
      total_spent:  Number(row.total_spent),
      created_at:   new Date(row.created_at).toLocaleDateString('fr-FR'),
    });
  }

  return wb.xlsx.writeBuffer();
};

export const deleteClient = async (id: string, company_id: string) => {
  const result = await pool.query(
    'DELETE FROM clients WHERE id = $1 AND company_id = $2 RETURNING id',
    [id, company_id]
  );
  return result.rowCount ? true : false;
};
