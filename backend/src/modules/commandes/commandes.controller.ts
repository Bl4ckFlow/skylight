import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as service from './commandes.service';
import { generateBLPDF } from '../../utils/bl-pdf';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, limit, offset } = req.query;
  const orders = await service.getOrders(
    req.user!.company_id,
    status as string | undefined,
    limit ? parseInt(limit as string, 10) : undefined,
    offset ? parseInt(offset as string, 10) : undefined,
  );
  res.json(orders);
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await service.getOrderById(req.params.id, req.user!.company_id);
  if (!order) { res.status(404).json({ error: 'Commande introuvable' }); return; }
  res.json(order);
});

export const getLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await service.getOrderLogs(req.params.id, req.user!.company_id);
  res.json(logs);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { client_id, items, notes } = req.body;
  const order = await service.createOrder(req.user!.company_id, client_id, items, notes);
  res.status(201).json(order);
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await service.updateOrderStatus(
    req.params.id,
    req.user!.company_id,
    req.body.status,
    req.user!.id,
    req.user!.email,
    req.user!.role
  );
  if (!order) { res.status(404).json({ error: 'Commande introuvable' }); return; }
  res.json(order);
});

export const confirmDelivery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Token manquant' });
    return;
  }
  const result = await service.confirmDelivery(token);
  res.json({ success: true, confirmed_at: result.client_confirmed_at });
});

export const downloadBL = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await service.getOrderForBL(req.params.id, req.user!.company_id);
  if (!order) { res.status(404).json({ error: 'Commande introuvable' }); return; }
  generateBLPDF(order, res);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await service.deleteOrder(req.params.id, req.user!.company_id);
    if (!deleted) { res.status(404).json({ error: 'Commande introuvable' }); return; }
    res.status(204).send();
  } catch {
    res.status(409).json({ error: 'Impossible de supprimer cette commande' });
  }
});
