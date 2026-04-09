import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { listCompanies, getCompanyUsers, createCompanyWithAdmin, getPlatformStats } from './admin.service';

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getPlatformStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCompanies = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await listCompanies();
    res.json(companies);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await getCompanyUsers(req.params.company_id);
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  const { company_name, admin_email, admin_password, plan } = req.body;

  if (!company_name || !admin_email || !admin_password) {
    res.status(400).json({ error: 'Nom entreprise, email et mot de passe requis' });
    return;
  }

  try {
    const result = await createCompanyWithAdmin(company_name, admin_email, admin_password, plan);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Cet email est déjà utilisé' });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};
