import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './stock.service';

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  const products = await service.getProducts(req.user!.company_id);
  res.json(products);
};

export const lowStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const products = await service.getLowStockProducts(req.user!.company_id);
  res.json(products);
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await service.getProductById(req.params.id, req.user!.company_id);
  if (!product) { res.status(404).json({ error: 'Produit introuvable' }); return; }
  res.json(product);
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await service.createProduct(req.user!.company_id, req.body);
  res.status(201).json(product);
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await service.updateProduct(req.params.id, req.user!.company_id, req.body);
    if (!product) { res.status(404).json({ error: 'Produit introuvable' }); return; }
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  const movements = await service.getStockMovements(req.params.id, req.user!.company_id);
  res.json(movements);
};

export const addMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  const { delta, reason } = req.body;
  if (delta === undefined || !reason) {
    res.status(400).json({ error: 'delta et reason sont requis' });
    return;
  }
  try {
    const result = await service.addStockMovement(
      req.params.id, req.user!.company_id, req.user!.id, Number(delta), reason
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  const deleted = await service.deleteProduct(req.params.id, req.user!.company_id);
  if (!deleted) { res.status(404).json({ error: 'Produit introuvable' }); return; }
  res.status(204).send();
};
