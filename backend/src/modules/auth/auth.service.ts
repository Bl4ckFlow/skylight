import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db';

export const loginUser = async (email: string, password: string) => {
  const result = await pool.query(
    'SELECT id, company_id, email, password_hash, role, must_change_password FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) throw new Error('Identifiants incorrects');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Identifiants incorrects');

  const token = jwt.sign(
    { id: user.id, company_id: user.company_id, role: user.role, email: user.email, must_change_password: user.must_change_password },
    process.env.JWT_SECRET as string,
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, company_id: user.company_id, must_change_password: user.must_change_password },
  };
};

export const getUsers = async (company_id: string) => {
  const result = await pool.query(
    'SELECT id, email, role, created_at FROM users WHERE company_id = $1 ORDER BY created_at DESC',
    [company_id]
  );
  return result.rows;
};

const VALID_ROLES = ['Admin', 'Employé', 'Comptable', 'Commercial', 'Logistique', 'Livreur', 'SuperAdmin'];

export const createUser = async (
  company_id: string,
  email: string,
  password: string,
  role: string
) => {
  if (!VALID_ROLES.includes(role)) throw new Error(`Rôle invalide : ${role}`);
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (company_id, email, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, email, role, company_id, created_at`,
    [company_id, email, hash, role]
  );
  return result.rows[0];
};

export const changePassword = async (user_id: string, newPassword: string) => {
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await pool.query(
    'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2 RETURNING id, company_id, email, role',
    [hash, user_id]
  );
  const user = result.rows[0];
  const token = jwt.sign(
    { id: user.id, company_id: user.company_id, role: user.role, email: user.email, must_change_password: false },
    process.env.JWT_SECRET as string,
    { expiresIn: 60 * 60 * 24 * 7 }
  );
  return { token, user: { ...user, must_change_password: false } };
};
