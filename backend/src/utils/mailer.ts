import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const generateDeliveryToken = (order_id: string, company_id: string): string => {
  return jwt.sign(
    { order_id, company_id, type: 'delivery_confirm' },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

export const verifyDeliveryToken = (token: string): { order_id: string; company_id: string } | null => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    if (payload.type !== 'delivery_confirm') return null;
    return { order_id: payload.order_id, company_id: payload.company_id };
  } catch {
    return null;
  }
};

interface DeliveryEmailOptions {
  to: string;
  clientName: string;
  companyName: string;
  orderDate: string;
  totalAmount: number;
  items: { product_name: string; quantity: number; unit_price: number }[];
  confirmUrl: string;
}

export const sendDeliveryEmail = async (opts: DeliveryEmailOptions): Promise<void> => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[mailer] SMTP not configured — skipping delivery email');
    return;
  }

  const itemsHtml = opts.items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${Number(i.unit_price).toLocaleString('fr-DZ')} DA</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#0a0a0a;padding:28px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">${opts.companyName}</p>
      <p style="margin:4px 0 0;color:#888;font-size:13px;">Confirmation de livraison</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#111;font-size:16px;font-weight:600;">Bonjour ${opts.clientName},</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
        Votre commande du <strong>${opts.orderDate}</strong> a été livrée.
        Merci de confirmer la bonne réception en cliquant sur le bouton ci-dessous.
      </p>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:8px 12px;text-align:left;font-weight:600;color:#333;">Article</th>
            <th style="padding:8px 12px;text-align:center;font-weight:600;color:#333;">Qté</th>
            <th style="padding:8px 12px;text-align:right;font-weight:600;color:#333;">Prix</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- Total -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:28px;">
        <div style="background:#f8f8f8;border-radius:8px;padding:12px 20px;text-align:right;">
          <p style="margin:0;font-size:12px;color:#888;">Total HT</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#0a0a0a;">
            ${Number(opts.totalAmount).toLocaleString('fr-DZ')} DA
          </p>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${opts.confirmUrl}"
           style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;">
          ✓ Confirmer la réception
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:#aaa;margin:12px 0 0;">
        Ce lien est valable 7 jours.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa;">
      <p style="margin:0;font-size:11px;color:#bbb;text-align:center;">
        ${opts.companyName} · Envoyé via Skylight
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${opts.companyName}" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Votre commande a été livrée — ${opts.companyName}`,
    html,
  });
};
