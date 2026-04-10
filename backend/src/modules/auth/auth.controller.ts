import { Request, Response } from 'express';
import { loginUser, createUser, getUsers, changePassword } from './auth.service';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await loginUser(req.body.email, req.body.password);
  res.json(data);
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, role } = req.body;
  try {
    const user = await createUser(req.user!.company_id, email, password, role);
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Cet email est déjà utilisé' });
    } else {
      throw err;
    }
  }
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  // req.body.password validated by changePasswordSchema (min 6 chars)
  const data = await changePassword(req.user!.id, req.body.password);
  res.json(data);
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await getUsers(req.user!.company_id);
  res.json(users);
});
