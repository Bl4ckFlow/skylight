import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as service from './stock.service';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const products = await service.getProducts(req.user!.company_id);
  res.json(products);
});

export const lowStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const products = await service.getLowStockProducts(req.user!.company_id);
  res.json(products);
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await service.getProductById(req.params.id, req.user!.company_id);
  if (!product) { res.status(404).json({ error: 'Produit introuvable' }); return; }
  res.json(product);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await service.createProduct(req.user!.company_id, req.body);
  res.status(201).json(product);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await service.updateProduct(req.params.id, req.user!.company_id, req.body);
  if (!product) { res.status(404).json({ error: 'Produit introuvable' }); return; }
  res.json(product);
});

export const getMovements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const movements = await service.getStockMovements(req.params.id, req.user!.company_id);
  res.json(movements);
});

export const addMovement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await service.addStockMovement(
    req.params.id, req.user!.company_id, req.user!.id,
    Number(req.body.delta), req.body.reason
  );
  res.json(result);
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deleted = await service.deleteProduct(req.params.id, req.user!.company_id);
  if (!deleted) { res.status(404).json({ error: 'Produit introuvable' }); return; }
  res.status(204).send();
});
