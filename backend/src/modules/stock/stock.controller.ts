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
  const { name, stock_quantity, buy_price, sell_price, category, low_stock_threshold } = req.body;
  if (!name || buy_price == null || sell_price == null) {
    res.status(400).json({ error: 'Champs requis : name, buy_price, sell_price' });
    return;
  }
  try {
    const product = await service.createProduct(req.user!.company_id, {
      name, stock_quantity, buy_price, sell_price, category, low_stock_threshold,
    });
    res.status(201).json(product);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
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

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  const deleted = await service.deleteProduct(req.params.id, req.user!.company_id);
  if (!deleted) { res.status(404).json({ error: 'Produit introuvable' }); return; }
  res.status(204).send();
};
