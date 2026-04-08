import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db';

export const loginUser = async (email: string, password: string) => {
  const result = await pool.query(
    'SELECT id, company_id, email, password_hash, role FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) throw new Error('Identifiants incorrects');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Identifiants incorrects');

  const token = jwt.sign(
    { id: user.id, company_id: user.company_id, role: user.role, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, company_id: user.company_id },
  };
};

export const createUser = async (
  company_id: string,
  email: string,
  password: string,
  role: 'Admin' | 'Employé'
) => {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (company_id, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, role, company_id, created_at`,
    [company_id, email, hash, role]
  );
  return result.rows[0];
};
