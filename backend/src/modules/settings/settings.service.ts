import { pool } from '../../config/db';

export const getCompanySettings = async (company_id: string) => {
  const result = await pool.query('SELECT * FROM companies WHERE id = $1', [company_id]);
  return result.rows[0] || null;
};

export const updateCompanySettings = async (company_id: string, data: Record<string, any>) => {
  const allowed = [
    'name', 'activity', 'address', 'capital_social',
    'phone', 'fax', 'email', 'website',
    'nif', 'nis', 'tin', 'rc',
    'bank_name', 'bank_rib', 'bank_name2', 'bank_rib2',
    'invoice_prefix', 'tva_rate',
  ];
  const fields = Object.keys(data).filter(k => allowed.includes(k));
  if (fields.length === 0) throw new Error('Aucun champ valide');
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => data[f]);
  const result = await pool.query(
    `UPDATE companies SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, company_id]
  );
  return result.rows[0];
};
