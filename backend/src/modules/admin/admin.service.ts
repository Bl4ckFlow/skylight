import bcrypt from 'bcryptjs';
import { pool } from '../../config/db';

export const getPlatformStats = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM companies)::int AS total_companies,
      (SELECT COUNT(*) FROM users WHERE role != 'SuperAdmin')::int AS total_users,
      (SELECT COUNT(*) FROM clients)::int AS total_clients,
      (SELECT COUNT(*) FROM orders)::int AS total_orders
  `);
  return result.rows[0];
};

export const listCompanies = async () => {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,
      c.subscription_plan,
      c.created_at,
      COUNT(u.id)::int AS user_count
    FROM companies c
    LEFT JOIN users u ON u.company_id = c.id AND u.role != 'SuperAdmin'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
};

export const getCompanyUsers = async (company_id: string) => {
  const result = await pool.query(
    `SELECT id, email, role, created_at FROM users
     WHERE company_id = $1 AND role != 'SuperAdmin'
     ORDER BY created_at ASC`,
    [company_id]
  );
  return result.rows;
};

export const deleteCompany = async (company_id: string) => {
  await pool.query('DELETE FROM companies WHERE id = $1', [company_id]);
};

export const createCompanyWithAdmin = async (
  companyName: string,
  adminEmail: string,
  adminPassword: string,
  plan: 'free' | 'starter' | 'pro' = 'free'
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const companyResult = await client.query(
      `INSERT INTO companies (name, subscription_plan) VALUES ($1, $2) RETURNING *`,
      [companyName, plan]
    );
    const company = companyResult.rows[0];

    const hash = await bcrypt.hash(adminPassword, 10);
    const userResult = await client.query(
      `INSERT INTO users (company_id, email, password_hash, role)
       VALUES ($1, $2, $3, 'Admin') RETURNING id, email, role, company_id, created_at`,
      [company.id, adminEmail, hash]
    );

    await client.query('COMMIT');
    return { company, admin: userResult.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
