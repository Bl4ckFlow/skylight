import { pool } from '../../config/db';

export const getOrders = async (company_id: string, status?: string) => {
  const query = status
    ? 'SELECT o.*, c.full_name AS client_name FROM orders o JOIN clients c ON c.id = o.client_id WHERE o.company_id = $1 AND o.status = $2 ORDER BY o.created_at DESC'
    : 'SELECT o.*, c.full_name AS client_name FROM orders o JOIN clients c ON c.id = o.client_id WHERE o.company_id = $1 ORDER BY o.created_at DESC';
  const params = status ? [company_id, status] : [company_id];
  const result = await pool.query(query, params);
  return result.rows;
};

export const getOrderById = async (id: string, company_id: string) => {
  const order = await pool.query(
    `SELECT o.*, c.full_name AS client_name
     FROM orders o
     JOIN clients c ON c.id = o.client_id
     WHERE o.id = $1 AND o.company_id = $2`,
    [id, company_id]
  );
  if (!order.rows[0]) return null;

  const items = await pool.query(
    `SELECT oi.*, p.name AS product_name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [id]
  );

  return { ...order.rows[0], items: items.rows };
};

export const createOrder = async (
  company_id: string,
  client_id: string,
  items: { product_id: string; quantity: number; unit_price: number }[],
  notes?: string
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const total_amount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const orderResult = await client.query(
      `INSERT INTO orders (company_id, client_id, total_amount, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [company_id, client_id, total_amount, notes ?? null]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      // Vérifier stock disponible
      const stock = await client.query(
        'SELECT stock_quantity FROM products WHERE id = $1 AND company_id = $2',
        [item.product_id, company_id]
      );
      if (!stock.rows[0] || stock.rows[0].stock_quantity < item.quantity) {
        throw new Error(`Stock insuffisant pour le produit ${item.product_id}`);
      }

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.unit_price]
      );
      // Le trigger SQL gère la décrémentation du stock
    }

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (id: string, company_id: string, status: string) => {
  const result = await pool.query(
    `UPDATE orders SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [status, id, company_id]
  );
  return result.rows[0] || null;
};

export const deleteOrder = async (id: string, company_id: string) => {
  const result = await pool.query(
    'DELETE FROM orders WHERE id = $1 AND company_id = $2 RETURNING id',
    [id, company_id]
  );
  return result.rowCount ? true : false;
};
