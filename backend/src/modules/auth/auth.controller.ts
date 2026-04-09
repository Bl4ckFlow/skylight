import { Request, Response } from 'express';
import { loginUser, createUser, getUsers, changePassword } from './auth.service';
import { AuthRequest } from '../../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }

  try {
    const data = await loginUser(email, password);
    res.json(data);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, role } = req.body;
  const company_id = req.user!.company_id;

  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }

  try {
    const user = await createUser(company_id, email, password, role || 'Employé');
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Cet email est déjà utilisé' });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(req.user);
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    return;
  }
  try {
    const data = await changePassword(req.user!.id, password);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await getUsers(req.user!.company_id);
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
