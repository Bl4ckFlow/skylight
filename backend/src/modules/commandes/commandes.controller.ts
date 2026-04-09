import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './commandes.service';

const VALID_STATUSES = ['En attente', 'En cours', 'Livrée'];

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  const orders = await service.getOrders(req.user!.company_id, status as string | undefined);
  res.json(orders);
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await service.getOrderById(req.params.id, req.user!.company_id);
  if (!order) { res.status(404).json({ error: 'Commande introuvable' }); return; }
  res.json(order);
};

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const logs = await service.getOrderLogs(req.params.id, req.user!.company_id);
  res.json(logs);
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { client_id, items, notes } = req.body;

  if (!client_id || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'client_id et items[] sont requis' });
    return;
  }

  try {
    const order = await service.createOrder(req.user!.company_id, client_id, items, notes);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}` });
    return;
  }

  try {
    const order = await service.updateOrderStatus(
      req.params.id,
      req.user!.company_id,
      status,
      req.user!.id,
      req.user!.email
    );
    if (!order) { res.status(404).json({ error: 'Commande introuvable' }); return; }
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await service.deleteOrder(req.params.id, req.user!.company_id);
    if (!deleted) { res.status(404).json({ error: 'Commande introuvable' }); return; }
    res.status(204).send();
  } catch {
    res.status(409).json({ error: 'Impossible de supprimer cette commande' });
  }
};
