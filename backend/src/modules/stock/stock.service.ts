import { pool } from '../../config/db';

export const getProducts = async (company_id: string) => {
  const result = await pool.query(
    'SELECT * FROM products WHERE company_id = $1 ORDER BY name ASC',
    [company_id]
  );
  return result.rows;
};

export const getLowStockProducts = async (company_id: string) => {
  const result = await pool.query(
    'SELECT * FROM products WHERE company_id = $1 AND stock_quantity <= low_stock_threshold ORDER BY stock_quantity ASC',
    [company_id]
  );
  return result.rows;
};

export const getProductById = async (id: string, company_id: string) => {
  const result = await pool.query(
    'SELECT * FROM products WHERE id = $1 AND company_id = $2',
    [id, company_id]
  );
  return result.rows[0] || null;
};

export const createProduct = async (
  company_id: string,
  data: {
    name: string;
    stock_quantity: number;
    buy_price: number;
    sell_price: number;
    category?: string;
    low_stock_threshold?: number;
  }
) => {
  const result = await pool.query(
    `INSERT INTO products (company_id, name, stock_quantity, buy_price, sell_price, category, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      company_id,
      data.name,
      data.stock_quantity ?? 0,
      data.buy_price,
      data.sell_price,
      data.category ?? null,
      data.low_stock_threshold ?? 5,
    ]
  );
  return result.rows[0];
};

export const updateProduct = async (id: string, company_id: string, data: Partial<{
  name: string;
  stock_quantity: number;
  buy_price: number;
  sell_price: number;
  category: string;
  low_stock_threshold: number;
}>) => {
  const fields = Object.keys(data);
  if (fields.length === 0) throw new Error('Aucun champ à mettre à jour');

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = Object.values(data);

  const result = await pool.query(
    `UPDATE products SET ${setClause} WHERE id = $${fields.length + 1} AND company_id = $${fields.length + 2} RETURNING *`,
    [...values, id, company_id]
  );
  return result.rows[0] || null;
};

export const getStockMovements = async (product_id: string, company_id: string) => {
  const result = await pool.query(`
    SELECT sm.*, u.email AS user_email
    FROM stock_movements sm
    JOIN users u ON u.id = sm.user_id
    WHERE sm.product_id = $1 AND sm.company_id = $2
    ORDER BY sm.created_at DESC
    LIMIT 50
  `, [product_id, company_id]);
  return result.rows;
};

export const addStockMovement = async (
  product_id: string,
  company_id: string,
  user_id: string,
  delta: number,
  reason: string
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prod = await client.query(
      'SELECT stock_quantity FROM products WHERE id = $1 AND company_id = $2',
      [product_id, company_id]
    );
    if (!prod.rows[0]) throw new Error('Produit introuvable');
    const oldQty = prod.rows[0].stock_quantity;
    const newQty = oldQty + delta;
    if (newQty < 0) throw new Error('Stock insuffisant');

    await client.query(
      'UPDATE products SET stock_quantity = $1 WHERE id = $2 AND company_id = $3',
      [newQty, product_id, company_id]
    );
    await client.query(`
      INSERT INTO stock_movements (product_id, company_id, user_id, delta, qty_before, qty_after, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [product_id, company_id, user_id, delta, oldQty, newQty, reason]);

    await client.query('COMMIT');
    return { qty_before: oldQty, qty_after: newQty, delta };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deleteProduct = async (id: string, company_id: string) => {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 AND company_id = $2 RETURNING id',
    [id, company_id]
  );
  return result.rowCount ? true : false;
};
