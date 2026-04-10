import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Remove sslmode from connection string — we handle SSL manually
const connectionString = process.env.DATABASE_URL?.replace('?sslmode=require', '').replace('&sslmode=require', '');

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', (client) => {
  client.query("SET search_path TO public");
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
  process.exit(1);
});
