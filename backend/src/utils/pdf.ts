import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceData {
  id: string;
  invoice_number?: string;
  created_at: string;
  payment_status: string;
  tva_rate?: number;
  // Client
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  client_type?: string;
  client_nif?: string;
  client_nis?: string;
  client_rc?: string;
  client_ai?: string;
  // Company (seller)
  company_name?: string;
  company_activity?: string;
  company_address?: string;
  capital_social?: string;
  company_phone?: string;
  company_fax?: string;
  company_email?: string;
  company_website?: string;
  company_nif?: string;
  company_nis?: string;
  company_tin?: string;
  company_rc?: string;
  bank_name?: string;
  bank_rib?: string;
  bank_name2?: string;
  bank_rib2?: string;
  total_amount: number;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
}

// ─── Number to French words ───────────────────────────────────────────────────
const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function belowHundred(n: number): string {
  if (n < 20) return units[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7) return u === 1 ? 'soixante et onze' : `soixante-${units[10 + u]}`;
  if (t === 9) return u === 0 ? 'quatre-vingt' : `quatre-vingt-${units[u]}`;
  return u === 0 ? tens[t] : u === 1 && t !== 8 ? `${tens[t]} et un` : `${tens[t]}-${units[u]}`;
}

function belowThousand(n: number): string {
  if (n < 100) return belowHundred(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const prefix = h === 1 ? 'cent' : `${units[h]} cent${r === 0 && h > 1 ? 's' : ''}`;
  return r === 0 ? prefix : `${prefix} ${belowHundred(r)}`;
}

function numberToWords(n: number): string {
  if (n === 0) return 'zéro';
  const intPart = Math.floor(n);
  const centimes = Math.round((n - intPart) * 100);
  let result = '';
  const billions = Math.floor(intPart / 1_000_000_000);
  const millions = Math.floor((intPart % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((intPart % 1_000_000) / 1_000);
  const remainder = intPart % 1_000;
  if (billions) result += `${belowThousand(billions)} milliard${billions > 1 ? 's' : ''} `;
  if (millions) result += `${belowThousand(millions)} million${millions > 1 ? 's' : ''} `;
  if (thousands) result += thousands === 1 ? 'mille ' : `${belowThousand(thousands)} mille `;
  if (remainder) result += belowThousand(remainder);
  result = result.trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);
  if (centimes > 0) result += ` dinar${intPart > 1 ? 's' : ''} et ${belowHundred(centimes)} centime${centimes > 1 ? 's' : ''}`;
  else result += ` dinar${intPart > 1 ? 's' : ''}`;
  return result;
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
export const generateInvoicePDF = (invoice: InvoiceData, res: Response) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const invoiceNum = invoice.invoice_number || invoice.id.substring(0, 8).toUpperCase();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=facture-${invoiceNum}.pdf`);
  doc.pipe(res);

  const tvaRate = Number(invoice.tva_rate ?? 19);
  const totalHT = Number(invoice.total_amount);
  const taxe = Math.round(totalHT * tvaRate) / 100;
  const totalTTC = totalHT + taxe;

  const L = 40;   // left margin
  const R = 555;  // right edge
  const W = R - L;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // Left: company info
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000')
     .text(invoice.company_name || 'VOTRE ENTREPRISE', L, 40, { width: 280 });

  if (invoice.company_activity) {
    doc.fontSize(8).font('Helvetica').fillColor('#333')
       .text(invoice.company_activity, L, doc.y + 2, { width: 280 });
  }
  if (invoice.company_address) {
    doc.fontSize(8).text(`Adresse : ${invoice.company_address}`, L, doc.y + 2, { width: 280 });
  }
  if (invoice.capital_social) {
    doc.fontSize(8).text(`Capital Social : ${invoice.capital_social} DA`, L, doc.y + 2, { width: 280 });
  }

  // Right: invoice number + date
  const headerY = 40;
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#000')
     .text('Facture', 350, headerY, { width: 205, align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text(`Numéro`, 350, headerY + 32, { width: 100 });
  doc.text('Date', 460, headerY + 32, { width: 95, align: 'right' });
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
  doc.text(invoiceNum, 350, headerY + 46, { width: 100 });
  doc.text(new Date(invoice.created_at).toLocaleDateString('fr-FR'), 460, headerY + 46, { width: 95, align: 'right' });

  // Separator
  const sepY = Math.max(doc.y + 10, 130);
  doc.moveTo(L, sepY).lineTo(R, sepY).lineWidth(1).strokeColor('#000').stroke();

  // ── CLIENT BLOCK ────────────────────────────────────────────────────────────
  const clientY = sepY + 10;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000')
     .text(invoice.client_name, 320, clientY, { width: 235 });

  let cy = clientY + 16;
  const clientFields = [
    invoice.client_address,
    invoice.client_phone ? `Tél : ${invoice.client_phone}` : null,
    invoice.client_ai    ? `AI : ${invoice.client_ai}` : null,
    invoice.client_nif   ? `IF : ${invoice.client_nif}` : null,
    invoice.client_rc    ? `RC : ${invoice.client_rc}` : null,
    invoice.client_nis   ? `NIS : ${invoice.client_nis}` : null,
  ].filter(Boolean) as string[];

  doc.fontSize(9).font('Helvetica').fillColor('#333');
  clientFields.forEach(f => { doc.text(f, 320, cy, { width: 235 }); cy += 13; });

  const afterClient = Math.max(cy + 10, clientY + 70);

  // ── TABLE ───────────────────────────────────────────────────────────────────
  const tableTop = afterClient + 5;
  const colRef  = L;
  const colDesc = L + 45;
  const colQty  = 350;
  const colPU   = 400;
  const colRem  = 460;
  const colMHT  = 500;

  // Header row
  doc.rect(L, tableTop, W, 18).fillColor('#e8e8e8').fill();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
  doc.text('Réf.', colRef + 2, tableTop + 5, { width: 40 });
  doc.text('Désignation', colDesc + 2, tableTop + 5, { width: 200 });
  doc.text('Qté', colQty, tableTop + 5, { width: 45, align: 'right' });
  doc.text('P.U. HT', colPU, tableTop + 5, { width: 55, align: 'right' });
  doc.text('Remise', colRem, tableTop + 5, { width: 35, align: 'right' });
  doc.text('Mnt HT', colMHT, tableTop + 5, { width: 55, align: 'right' });

  // Table border
  doc.rect(L, tableTop, W, 18).lineWidth(0.5).strokeColor('#aaa').stroke();

  let rowY = tableTop + 18;
  invoice.items.forEach((item, i) => {
    const rowH = 18;
    if (i % 2 === 1) {
      doc.rect(L, rowY, W, rowH).fillColor('#f9f9f9').fill();
    }
    doc.fontSize(8).font('Helvetica').fillColor('#000');
    doc.text('', colRef + 2, rowY + 5, { width: 40 });
    doc.text(item.product_name, colDesc + 2, rowY + 5, { width: 200 });
    doc.text(String(item.quantity), colQty, rowY + 5, { width: 45, align: 'right' });
    doc.text(Number(item.unit_price).toFixed(2), colPU, rowY + 5, { width: 55, align: 'right' });
    doc.text('', colRem, rowY + 5, { width: 35, align: 'right' });
    doc.text(Number(item.subtotal).toFixed(2), colMHT, rowY + 5, { width: 55, align: 'right' });
    doc.rect(L, rowY, W, rowH).lineWidth(0.3).strokeColor('#ccc').stroke();
    rowY += rowH;
  });

  // Fill remaining table space (at least 4 empty rows)
  const minRows = 4;
  const drawnRows = invoice.items.length;
  for (let i = 0; i < Math.max(0, minRows - drawnRows); i++) {
    doc.rect(L, rowY, W, 18).lineWidth(0.3).strokeColor('#ccc').stroke();
    rowY += 18;
  }

  // ── SUMMARY TABLE ───────────────────────────────────────────────────────────
  const sumY = rowY + 8;

  // Labels row
  const sumCols = [
    { label: 'Code', x: L,    w: 35 },
    { label: 'Base HT', x: L+35, w: 70 },
    { label: 'Taux', x: L+105, w: 35 },
    { label: 'Taxe', x: L+140, w: 65 },
    { label: 'Total HT', x: L+205, w: 70 },
    { label: 'Escompte', x: L+275, w: 55 },
    { label: 'Port', x: L+330, w: 40 },
    { label: 'Total TTC', x: L+370, w: 70 },
    { label: 'Acompte', x: L+440, w: 55 },
    { label: 'NET À PAYER', x: L+495, w: 60 },
  ];

  doc.rect(L, sumY, W, 16).fillColor('#e8e8e8').fill();
  doc.rect(L, sumY, W, 16).lineWidth(0.5).strokeColor('#aaa').stroke();
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#000');
  sumCols.forEach(c => doc.text(c.label, c.x + 2, sumY + 5, { width: c.w - 4, align: 'center' }));

  // Values row
  const vY = sumY + 16;
  doc.rect(L, vY, W, 16).lineWidth(0.5).strokeColor('#aaa').stroke();
  doc.fontSize(8).font('Helvetica').fillColor('#000');
  [
    { x: L,     w: 35,  v: 'C19' },
    { x: L+35,  w: 70,  v: totalHT.toFixed(2) },
    { x: L+105, w: 35,  v: `${tvaRate}%` },
    { x: L+140, w: 65,  v: taxe.toFixed(2) },
    { x: L+205, w: 70,  v: totalHT.toFixed(2) },
    { x: L+275, w: 55,  v: '' },
    { x: L+330, w: 40,  v: '' },
    { x: L+370, w: 70,  v: totalTTC.toFixed(2) },
    { x: L+440, w: 55,  v: '' },
    { x: L+495, w: 60,  v: totalTTC.toFixed(2) },
  ].forEach(c => doc.text(c.v, c.x + 2, vY + 5, { width: c.w - 4, align: 'center' }));

  // Totals row
  const tY = vY + 16;
  doc.rect(L, tY, W, 14).lineWidth(0.3).strokeColor('#ccc').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
  doc.text(`Total    ${totalHT.toFixed(2)}`, L + 2, tY + 3, { width: 200 });
  doc.text(taxe.toFixed(2), L + 140, tY + 3, { width: 65, align: 'center' });

  // Amount in words
  const wordsY = tY + 20;
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000')
     .text('Arrêtée la présente facture à la somme de : ', L, wordsY, { continued: true });
  doc.font('Helvetica').text(numberToWords(totalTTC));

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const footerY = wordsY + 22;
  doc.moveTo(L, footerY).lineTo(R, footerY).lineWidth(0.5).strokeColor('#aaa').stroke();

  const f1 = L;
  const f2 = L + 150;
  const f3 = L + 320;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
  doc.text('Contact :', f1, footerY + 6);
  doc.text('Réf. Fiscales :', f2, footerY + 6);
  doc.text('Comptes Bancaires :', f3, footerY + 6);

  doc.fontSize(7).font('Helvetica').fillColor('#333');
  let fy = footerY + 18;
  if (invoice.company_phone)   { doc.text(`Tél : ${invoice.company_phone}`, f1, fy); fy += 11; }
  if (invoice.company_fax)     { doc.text(`Fax : ${invoice.company_fax}`, f1, fy); fy += 11; }
  if (invoice.company_email)   { doc.text(`E-mail : ${invoice.company_email}`, f1, fy); fy += 11; }
  if (invoice.company_website) { doc.text(`Site : ${invoice.company_website}`, f1, fy); }

  let fy2 = footerY + 18;
  if (invoice.company_nif) { doc.text(`NIF : ${invoice.company_nif}`, f2, fy2); fy2 += 11; }
  if (invoice.company_nis) { doc.text(`NIS : ${invoice.company_nis}`, f2, fy2); fy2 += 11; }
  if (invoice.company_tin) { doc.text(`TIN : ${invoice.company_tin}`, f2, fy2); fy2 += 11; }
  if (invoice.company_rc)  { doc.text(`RC : ${invoice.company_rc}`, f2, fy2); }

  let fy3 = footerY + 18;
  if (invoice.bank_name)  { doc.text(`Banque : ${invoice.bank_name}`, f3, fy3); fy3 += 11; }
  if (invoice.bank_rib)   { doc.text(`RIB : ${invoice.bank_rib}`, f3, fy3); fy3 += 11; }
  if (invoice.bank_name2) { doc.text(`Banque : ${invoice.bank_name2}`, f3, fy3); fy3 += 11; }
  if (invoice.bank_rib2)  { doc.text(`RIB : ${invoice.bank_rib2}`, f3, fy3); }

  // Page number
  doc.fontSize(7).fillColor('#999')
     .text('Page 1', R - 50, footerY + 6, { width: 50, align: 'right' });

  doc.end();
};
