import { Request, Response } from 'express';
import { loginUser, createUser, getUsers, updateUserRole, deleteUser, changePassword } from './auth.service';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await loginUser(req.body.email, req.body.password);
  res.json(data);
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const user = await createUser(req.user!.company_id, req.body.email, req.body.password, req.body.role);
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === '23505') res.status(409).json({ error: 'Cet email est déjà utilisé' });
    else throw err;
  }
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await changePassword(req.user!.id, req.body.password);
  res.json(data);
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await getUsers(req.user!.company_id);
  res.json(users);
});

export const changeUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    return;
  }
  const user = await updateUserRole(req.params.id, req.user!.company_id, role);
  if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
  res.json(user);
});

export const removeUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    return;
  }
  const deleted = await deleteUser(req.params.id, req.user!.company_id);
  if (!deleted) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
  res.status(204).send();
});
