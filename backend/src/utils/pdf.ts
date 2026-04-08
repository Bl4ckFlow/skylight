import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceData {
  id: string;
  created_at: string;
  payment_status: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  total_amount: number;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
}

export const generateInvoicePDF = (invoice: InvoiceData, res: Response) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=facture-${invoice.id}.pdf`);
  doc.pipe(res);

  // En-tête
  doc.fontSize(24).font('Helvetica-Bold').text('SKYLIGHT', 50, 50);
  doc.fontSize(10).font('Helvetica').fillColor('#666').text('Votre solution de gestion', 50, 80);

  doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e2e8f0').stroke();

  // Titre facture
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a202c')
     .text('FACTURE', 400, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#666')
     .text(`N° ${invoice.id.substring(0, 8).toUpperCase()}`, 400, 75, { align: 'right' })
     .text(`Date : ${new Date(invoice.created_at).toLocaleDateString('fr-FR')}`, 400, 90, { align: 'right' });

  // Infos client
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a202c').text('Facturé à :', 50, 120);
  doc.fontSize(11).font('Helvetica').fillColor('#4a5568')
     .text(invoice.client_name, 50, 138);
  if (invoice.client_phone) doc.text(`Tél : ${invoice.client_phone}`, 50, 153);
  if (invoice.client_email) doc.text(`Email : ${invoice.client_email}`, 50, 168);
  if (invoice.client_address) doc.text(`Adresse : ${invoice.client_address}`, 50, 183);

  // Tableau des articles
  const tableTop = 230;
  doc.moveTo(50, tableTop).lineTo(545, tableTop).strokeColor('#e2e8f0').stroke();

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#718096');
  doc.text('PRODUIT', 50, tableTop + 10);
  doc.text('QTÉ', 300, tableTop + 10);
  doc.text('PRIX UNIT.', 370, tableTop + 10);
  doc.text('SOUS-TOTAL', 460, tableTop + 10);

  doc.moveTo(50, tableTop + 28).lineTo(545, tableTop + 28).strokeColor('#e2e8f0').stroke();

  let y = tableTop + 40;
  invoice.items.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.rect(50, y - 5, 495, 22).fillColor('#f7fafc').fill();
    }
    doc.font('Helvetica').fillColor('#1a202c').fontSize(10);
    doc.text(item.product_name, 50, y, { width: 240 });
    doc.text(String(item.quantity), 300, y);
    doc.text(`${Number(item.unit_price).toFixed(2)} DA`, 370, y);
    doc.text(`${Number(item.subtotal).toFixed(2)} DA`, 460, y);
    y += 25;
  });

  // Total
  doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor('#e2e8f0').stroke();
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a202c')
     .text('TOTAL :', 370, y + 20)
     .text(`${Number(invoice.total_amount).toFixed(2)} DA`, 460, y + 20);

  // Statut paiement
  const statusColor = invoice.payment_status === 'Payé' ? '#38a169' : '#e53e3e';
  doc.fontSize(12).font('Helvetica-Bold').fillColor(statusColor)
     .text(`Statut : ${invoice.payment_status}`, 50, y + 20);

  doc.end();
};
