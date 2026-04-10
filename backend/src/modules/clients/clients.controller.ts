import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as service from './clients.service';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const clients = await service.getClients(req.user!.company_id);
  res.json(clients);
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const client = await service.getClientById(req.params.id, req.user!.company_id);
  if (!client) { res.status(404).json({ error: 'Client introuvable' }); return; }
  res.json(client);
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await service.getClientOrders(req.params.id, req.user!.company_id);
  res.json(orders);
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await service.getClientStats(req.params.id, req.user!.company_id);
  res.json(stats);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const client = await service.createClient(req.user!.company_id, req.body);
  res.status(201).json(client);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const client = await service.updateClient(req.params.id, req.user!.company_id, req.body);
  if (!client) { res.status(404).json({ error: 'Client introuvable' }); return; }
  res.json(client);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await service.deleteClient(req.params.id, req.user!.company_id);
    if (!deleted) { res.status(404).json({ error: 'Client introuvable' }); return; }
    res.status(204).send();
  } catch {
    res.status(409).json({ error: 'Impossible de supprimer un client avec des commandes actives' });
  }
});
