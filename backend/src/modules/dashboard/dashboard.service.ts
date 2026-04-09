import { pool } from '../../config/db';

export const getDashboardStats = async (company_id: string) => {
  const [kpis, caMonthly, topProducts, recentOrders] = await Promise.all([
    // KPIs
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE company_id = $1) AS total_orders,
        (SELECT COUNT(*) FROM orders WHERE company_id = $1 AND status = 'En attente') AS pending_orders,
        (SELECT COUNT(*) FROM orders WHERE company_id = $1 AND status = 'Livrée') AS delivered_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE company_id = $1) AS total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices i JOIN orders o ON o.id = i.order_id WHERE i.company_id = $1 AND i.payment_status = 'Non Payé') AS unpaid_amount,
        (SELECT COUNT(*) FROM clients WHERE company_id = $1) AS total_clients,
        (SELECT COUNT(*) FROM products WHERE company_id = $1 AND stock_quantity <= low_stock_threshold) AS low_stock_count,
        (SELECT COUNT(*) FROM invoices WHERE company_id = $1 AND payment_status = 'Non Payé') AS unpaid_invoices
    `, [company_id]),

    // CA par mois (12 derniers mois)
    pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(o.total_amount), 0) AS revenue,
        COUNT(o.id) AS orders_count
      FROM orders o
      WHERE o.company_id = $1
        AND o.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY DATE_TRUNC('month', o.created_at) ASC
    `, [company_id]),

    // Top 5 produits vendus
    pool.query(`
      SELECT
        p.name,
        SUM(oi.quantity) AS total_qty,
        SUM(oi.quantity * oi.unit_price) AS total_revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.company_id = $1
      GROUP BY p.id, p.name
      ORDER BY total_qty DESC
      LIMIT 5
    `, [company_id]),

    // 5 dernières commandes
    pool.query(`
      SELECT o.id, o.status, o.total_amount, o.created_at, c.full_name AS client_name
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      WHERE o.company_id = $1
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [company_id]),
  ]);

  return {
    kpis: kpis.rows[0],
    caMonthly: caMonthly.rows,
    topProducts: topProducts.rows,
    recentOrders: recentOrders.rows,
  };
};
