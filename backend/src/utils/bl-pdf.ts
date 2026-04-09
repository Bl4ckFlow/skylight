import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface BLData {
  bl_number: string;
  created_at: string;
  // Client
  client_name: string;
  client_phone?: string;
  client_address?: string;
  client_type?: string;
  client_nif?: string;
  client_nis?: string;
  client_rc?: string;
  client_ai?: string;
  // Company
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
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  notes?: string;
}

export const generateBLPDF = (data: BLData, res: Response) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=bl-${data.bl_number}.pdf`);
  doc.pipe(res);

  const L = 40;
  const R = 555;
  const W = R - L;

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000')
     .text(data.company_name || 'VOTRE ENTREPRISE', L, 40, { width: 280 });

  if (data.company_activity) {
    doc.fontSize(8).font('Helvetica').fillColor('#333')
       .text(data.company_activity, L, doc.y + 2, { width: 280 });
  }
  if (data.company_address) {
    doc.fontSize(8).text(`Adresse : ${data.company_address}`, L, doc.y + 2, { width: 280 });
  }
  if (data.capital_social) {
    doc.fontSize(8).text(`Capital Social : ${data.capital_social} DA`, L, doc.y + 2, { width: 280 });
  }

  // Right: BL number + date
  const headerY = 40;
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#000')
     .text('Bon de Livraison', 300, headerY, { width: 255, align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text('Numéro', 350, headerY + 32, { width: 100 });
  doc.text('Date', 460, headerY + 32, { width: 95, align: 'right' });
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
  doc.text(data.bl_number, 350, headerY + 46, { width: 100 });
  doc.text(new Date(data.created_at).toLocaleDateString('fr-FR'), 460, headerY + 46, { width: 95, align: 'right' });

  // Separator
  const sepY = Math.max(doc.y + 10, 130);
  doc.moveTo(L, sepY).lineTo(R, sepY).lineWidth(1).strokeColor('#000').stroke();

  // ── CLIENT BLOCK ──────────────────────────────────────────────────────────
  const clientY = sepY + 10;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000')
     .text(data.client_name, 320, clientY, { width: 235 });

  let cy = clientY + 16;
  const clientFields = [
    data.client_address,
    data.client_phone ? `Tél : ${data.client_phone}` : null,
    data.client_ai    ? `AI : ${data.client_ai}` : null,
    data.client_nif   ? `IF : ${data.client_nif}` : null,
    data.client_rc    ? `RC : ${data.client_rc}` : null,
    data.client_nis   ? `NIS : ${data.client_nis}` : null,
  ].filter(Boolean) as string[];

  doc.fontSize(9).font('Helvetica').fillColor('#333');
  clientFields.forEach(f => { doc.text(f, 320, cy, { width: 235 }); cy += 13; });

  const afterClient = Math.max(cy + 10, clientY + 70);

  // ── ITEMS TABLE ───────────────────────────────────────────────────────────
  const tableTop = afterClient + 5;
  const colDesc = L;
  const colQty  = 360;
  const colPU   = 415;
  const colMHT  = 475;

  // Header row
  doc.rect(L, tableTop, W, 18).fillColor('#e8e8e8').fill();
  doc.rect(L, tableTop, W, 18).lineWidth(0.5).strokeColor('#aaa').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
  doc.text('Désignation', colDesc + 4, tableTop + 5, { width: 300 });
  doc.text('Qté', colQty, tableTop + 5, { width: 50, align: 'right' });
  doc.text('P.U. HT', colPU, tableTop + 5, { width: 55, align: 'right' });
  doc.text('Mnt HT', colMHT, tableTop + 5, { width: 75, align: 'right' });

  let rowY = tableTop + 18;
  data.items.forEach((item, i) => {
    const rowH = 18;
    if (i % 2 === 1) {
      doc.rect(L, rowY, W, rowH).fillColor('#f9f9f9').fill();
    }
    doc.fontSize(8).font('Helvetica').fillColor('#000');
    doc.text(item.product_name, colDesc + 4, rowY + 5, { width: 300 });
    doc.text(String(item.quantity), colQty, rowY + 5, { width: 50, align: 'right' });
    doc.text(Number(item.unit_price).toFixed(2), colPU, rowY + 5, { width: 55, align: 'right' });
    doc.text(Number(item.subtotal).toFixed(2), colMHT, rowY + 5, { width: 75, align: 'right' });
    doc.rect(L, rowY, W, rowH).lineWidth(0.3).strokeColor('#ccc').stroke();
    rowY += rowH;
  });

  // Fill at least 4 empty rows
  const minRows = 4;
  for (let i = 0; i < Math.max(0, minRows - data.items.length); i++) {
    doc.rect(L, rowY, W, 18).lineWidth(0.3).strokeColor('#ccc').stroke();
    rowY += 18;
  }

  // Total HT row
  const totalHT = data.items.reduce((s, i) => s + Number(i.subtotal), 0);
  const totalRow = rowY;
  doc.rect(L, totalRow, W, 18).fillColor('#e8e8e8').fill();
  doc.rect(L, totalRow, W, 18).lineWidth(0.5).strokeColor('#aaa').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');
  doc.text('Total HT', colDesc + 4, totalRow + 5, { width: 300 });
  doc.text(totalHT.toFixed(2), colMHT, totalRow + 5, { width: 75, align: 'right' });
  rowY = totalRow + 18;

  // Notes
  if (data.notes) {
    doc.fontSize(8).font('Helvetica').fillColor('#555')
       .text(`Note : ${data.notes}`, L, rowY + 8, { width: W });
    rowY += 22;
  }

  // ── SIGNATURE ZONES ───────────────────────────────────────────────────────
  const sigY = rowY + 20;
  const sigW = (W - 20) / 2;

  // Left zone: livreur
  doc.rect(L, sigY, sigW, 60).lineWidth(0.5).strokeColor('#aaa').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000')
     .text('Signature du livreur', L + 6, sigY + 6, { width: sigW - 12 });

  // Right zone: client
  const sigRX = L + sigW + 20;
  doc.rect(sigRX, sigY, sigW, 60).lineWidth(0.5).strokeColor('#aaa').stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000')
     .text('Signature du client — Cachet', sigRX + 6, sigY + 6, { width: sigW - 12 });
  doc.fontSize(7).font('Helvetica').fillColor('#555')
     .text('Reçu conforme', sigRX + 6, sigY + 20, { width: sigW - 12 });

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = sigY + 75;
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
  if (data.company_phone)   { doc.text(`Tél : ${data.company_phone}`, f1, fy); fy += 11; }
  if (data.company_fax)     { doc.text(`Fax : ${data.company_fax}`, f1, fy); fy += 11; }
  if (data.company_email)   { doc.text(`E-mail : ${data.company_email}`, f1, fy); fy += 11; }
  if (data.company_website) { doc.text(`Site : ${data.company_website}`, f1, fy); }

  let fy2 = footerY + 18;
  if (data.company_nif) { doc.text(`NIF : ${data.company_nif}`, f2, fy2); fy2 += 11; }
  if (data.company_nis) { doc.text(`NIS : ${data.company_nis}`, f2, fy2); fy2 += 11; }
  if (data.company_tin) { doc.text(`TIN : ${data.company_tin}`, f2, fy2); fy2 += 11; }
  if (data.company_rc)  { doc.text(`RC : ${data.company_rc}`, f2, fy2); }

  let fy3 = footerY + 18;
  if (data.bank_name)  { doc.text(`Banque : ${data.bank_name}`, f3, fy3); fy3 += 11; }
  if (data.bank_rib)   { doc.text(`RIB : ${data.bank_rib}`, f3, fy3); fy3 += 11; }
  if (data.bank_name2) { doc.text(`Banque : ${data.bank_name2}`, f3, fy3); fy3 += 11; }
  if (data.bank_rib2)  { doc.text(`RIB : ${data.bank_rib2}`, f3, fy3); }

  doc.fontSize(7).fillColor('#999')
     .text('Page 1', R - 50, footerY + 6, { width: 50, align: 'right' });

  doc.end();
};
