import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './factures.service';
import { generateInvoicePDF } from '../../utils/pdf';

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  const { payment_status } = req.query;
  const invoices = await service.getInvoices(req.user!.company_id, payment_status as string | undefined);
  res.json(invoices);
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await service.getInvoiceById(req.params.id, req.user!.company_id);
  if (!invoice) { res.status(404).json({ error: 'Facture introuvable' }); return; }
  res.json(invoice);
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { order_id } = req.body;
  if (!order_id) { res.status(400).json({ error: 'order_id est requis' }); return; }
  try {
    const invoice = await service.createInvoice(req.user!.company_id, order_id);
    res.status(201).json(invoice);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Une facture existe déjà pour cette commande' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { payment_status } = req.body;
  if (!['Payé', 'Non Payé'].includes(payment_status)) {
    res.status(400).json({ error: 'Statut invalide : "Payé" ou "Non Payé"' });
    return;
  }
  const invoice = await service.updatePaymentStatus(req.params.id, req.user!.company_id, payment_status);
  if (!invoice) { res.status(404).json({ error: 'Facture introuvable' }); return; }
  res.json(invoice);
};

export const downloadPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await service.getInvoiceById(req.params.id, req.user!.company_id);
  if (!invoice) { res.status(404).json({ error: 'Facture introuvable' }); return; }
  generateInvoicePDF(invoice, res);
};
