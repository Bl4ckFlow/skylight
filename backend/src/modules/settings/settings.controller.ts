import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { getCompanySettings, updateCompanySettings } from './settings.service';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  const settings = await getCompanySettings(req.user!.company_id);
  if (!settings) { res.status(404).json({ error: 'Entreprise introuvable' }); return; }
  res.json(settings);
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await updateCompanySettings(req.user!.company_id, req.body);
    res.json(settings);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
