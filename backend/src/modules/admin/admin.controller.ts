import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { listCompanies, getCompanyUsers, createCompanyWithAdmin, getPlatformStats, deleteCompany } from './admin.service';

export const getStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await getPlatformStats();
  res.json(stats);
});

export const getCompanies = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const companies = await listCompanies();
  res.json(companies);
});

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await getCompanyUsers(req.params.company_id);
  res.json(users);
});

export const removeCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  await deleteCompany(req.params.company_id);
  res.status(204).send();
});

export const createCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
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
      throw err;
    }
  }
});
