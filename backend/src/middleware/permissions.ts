import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Roles that have full access to everything
const SUPER_ROLES = ['Admin', 'SuperAdmin'];

/**
 * requireRole('Comptable', 'Admin') → allows Comptable AND Admin (and SuperAdmin always passes)
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    if (!userRole) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }
    const allowed = [...SUPER_ROLES, ...roles];
    if (!allowed.includes(userRole)) {
      res.status(403).json({ error: `Accès refusé. Rôle requis : ${roles.join(' ou ')}` });
      return;
    }
    next();
  };
};

// Shorthand permission guards per module
export const canStock     = requireRole('Logistique');
export const canClients   = requireRole('Commercial');
export const canCommandes = requireRole('Commercial', 'Livreur');
export const canFactures  = requireRole('Comptable');
