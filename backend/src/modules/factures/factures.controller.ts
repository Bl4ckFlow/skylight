import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as service from './factures.service';
import { generateInvoicePDF } from '../../utils/pdf';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { payment_status } = req.query;
  const invoices = await service.getInvoices(req.user!.company_id, payment_status as string | undefined);
  res.json(invoices);
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoice = await service.getInvoiceById(req.params.id, req.user!.company_id);
  if (!invoice) { res.status(404).json({ error: 'Facture introuvable' }); return; }
  res.json(invoice);
});

export const getLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await service.getInvoiceLogs(req.params.id, req.user!.company_id);
  res.json(logs);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await service.createInvoice(req.user!.company_id, req.body.order_id);
    res.status(201).json(invoice);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Une facture existe déjà pour cette commande' });
    } else {
      throw err;
    }
  }
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoice = await service.updatePaymentStatus(
    req.params.id,
    req.user!.company_id,
    req.body.payment_status,
    req.user!.id,
    req.user!.email
  );
  if (!invoice) { res.status(404).json({ error: 'Facture introuvable' }); return; }
  res.json(invoice);
});

export const downloadPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoice = await service.getInvoiceById(req.params.id, req.user!.company_id);
  if (!invoice) { res.status(404).json({ error: 'Facture introuvable' }); return; }
  generateInvoicePDF(invoice, res);
});
