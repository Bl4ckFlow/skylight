import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('ondigitalocean')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('connect', (client) => {
  client.query("SET search_path TO app, public");
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
  process.exit(1);
});
