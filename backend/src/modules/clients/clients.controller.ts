import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './clients.service';

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  const clients = await service.getClients(req.user!.company_id);
  res.json(clients);
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await service.getClientById(req.params.id, req.user!.company_id);
  if (!client) { res.status(404).json({ error: 'Client introuvable' }); return; }
  res.json(client);
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const orders = await service.getClientOrders(req.params.id, req.user!.company_id);
  res.json(orders);
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const { full_name, phone, email, address } = req.body;
  if (!full_name) { res.status(400).json({ error: 'Le nom complet est requis' }); return; }
  try {
    const client = await service.createClient(req.user!.company_id, { full_name, phone, email, address });
    res.status(201).json(client);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await service.updateClient(req.params.id, req.user!.company_id, req.body);
    if (!client) { res.status(404).json({ error: 'Client introuvable' }); return; }
    res.json(client);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await service.deleteClient(req.params.id, req.user!.company_id);
    if (!deleted) { res.status(404).json({ error: 'Client introuvable' }); return; }
    res.status(204).send();
  } catch {
    res.status(409).json({ error: 'Impossible de supprimer un client avec des commandes actives' });
  }
};
