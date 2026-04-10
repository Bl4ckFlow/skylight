import { pool } from '../../config/db';
import ExcelJS from 'exceljs';

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
       c.address AS client_address, c.client_type,
       c.nif AS client_nif, c.nis AS client_nis, c.rc AS client_rc, c.ai AS client_ai,
       co.name AS company_name, co.activity AS company_activity,
       co.address AS company_address, co.capital_social,
       co.phone AS company_phone, co.fax AS company_fax,
       co.email AS company_email, co.website AS company_website,
       co.nif AS company_nif, co.nis AS company_nis,
       co.tin AS company_tin, co.rc AS company_rc,
       co.bank_name, co.bank_rib, co.bank_name2, co.bank_rib2,
       co.tva_rate,
       json_agg(json_build_object(
         'product_name', p.name,
         'quantity', oi.quantity,
         'unit_price', oi.unit_price,
         'subtotal', (oi.quantity * oi.unit_price)
       ) ORDER BY p.name) AS items
     FROM invoices i
     JOIN orders o ON o.id = i.order_id
     JOIN clients c ON c.id = o.client_id
     JOIN companies co ON co.id = i.company_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE i.id = $1 AND i.company_id = $2
     GROUP BY i.id, o.id, c.id, co.id`,
    [id, company_id]
  );
  return result.rows[0] || null;
};

export const getInvoiceLogs = async (invoice_id: string, company_id: string) => {
  const result = await pool.query(
    `SELECT il.* FROM invoice_logs il
     JOIN invoices i ON i.id = il.invoice_id
     WHERE il.invoice_id = $1 AND i.company_id = $2
     ORDER BY il.changed_at ASC`,
    [invoice_id, company_id]
  );
  return result.rows;
};

export const createInvoice = async (company_id: string, order_id: string) => {
  const order = await pool.query(
    'SELECT id FROM orders WHERE id = $1 AND company_id = $2',
    [order_id, company_id]
  );
  if (!order.rows[0]) throw new Error('Commande introuvable');

  // Generate sequential invoice number
  const company = await pool.query(
    `UPDATE companies SET invoice_counter = COALESCE(invoice_counter, 0) + 1
     WHERE id = $1 RETURNING invoice_counter, invoice_prefix`,
    [company_id]
  );
  const { invoice_counter, invoice_prefix } = company.rows[0];
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const invoice_number = `${invoice_prefix || 'F'}${yymm}${String(invoice_counter).padStart(4, '0')}`;

  const result = await pool.query(
    `INSERT INTO invoices (company_id, order_id, invoice_number)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [company_id, order_id, invoice_number]
  );
  return result.rows[0];
};

export const updatePaymentStatus = async (
  id: string,
  company_id: string,
  payment_status: string,
  userId: string,
  userEmail: string
) => {
  const current = await pool.query(
    'SELECT payment_status FROM invoices WHERE id = $1 AND company_id = $2',
    [id, company_id]
  );
  if (!current.rows[0]) return null;

  if (current.rows[0].payment_status === 'Payé') {
    throw new Error('Une facture payée ne peut pas être modifiée');
  }

  const result = await pool.query(
    `UPDATE invoices SET payment_status = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [payment_status, id, company_id]
  );

  await pool.query(
    `INSERT INTO invoice_logs (invoice_id, changed_by_user_id, changed_by_email)
     VALUES ($1, $2, $3)`,
    [id, userId, userEmail]
  );

  return result.rows[0];
};

export const exportInvoicesXlsx = async (company_id: string): Promise<ArrayBuffer> => {
  const result = await pool.query(
    `SELECT i.invoice_number, i.payment_status, i.created_at,
            c.full_name AS client_name,
            o.total_amount, o.created_at AS order_date
     FROM invoices i
     JOIN orders o ON o.id = i.order_id
     JOIN clients c ON c.id = o.client_id
     WHERE i.company_id = $1
     ORDER BY i.created_at DESC`,
    [company_id]
  );

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Factures');

  ws.columns = [
    { header: 'N° Facture',    key: 'invoice_number', width: 16 },
    { header: 'Client',        key: 'client_name',    width: 28 },
    { header: 'Montant (DA)',  key: 'total_amount',   width: 16 },
    { header: 'Statut',       key: 'payment_status',  width: 14 },
    { header: 'Date commande', key: 'order_date',     width: 18 },
    { header: 'Date facture',  key: 'created_at',     width: 18 },
  ];

  ws.getRow(1).font = { bold: true };

  for (const row of result.rows) {
    ws.addRow({
      invoice_number: row.invoice_number,
      client_name:    row.client_name,
      total_amount:   Number(row.total_amount),
      payment_status: row.payment_status,
      order_date:     new Date(row.order_date).toLocaleDateString('fr-FR'),
      created_at:     new Date(row.created_at).toLocaleDateString('fr-FR'),
    });
  }

  return wb.xlsx.writeBuffer();
};

export const updatePdfUrl = async (id: string, company_id: string, pdf_url: string) => {
  const result = await pool.query(
    `UPDATE invoices SET pdf_url = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [pdf_url, id, company_id]
  );
  return result.rows[0] || null;
};
