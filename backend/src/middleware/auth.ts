import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    company_id: string;
    role: string;
    email: string;
    token_version?: number;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  let token: string;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (queryToken) {
    token = queryToken;
  } else {
    res.status(401).json({ error: 'Token manquant ou invalide' });
    return;
  }

  let decoded: AuthRequest['user'] & { token_version?: number };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
  } catch {
    res.status(401).json({ error: 'Token expiré ou invalide' });
    return;
  }

  // Verify token_version matches DB — if role changed, old tokens are rejected
  pool.query('SELECT token_version FROM users WHERE id = $1', [decoded.id])
    .then(result => {
      if (!result.rows[0]) {
        res.status(401).json({ error: 'Utilisateur introuvable' });
        return;
      }
      const dbVersion = result.rows[0].token_version ?? 0;
      const tokenVersion = decoded.token_version ?? 0;
      if (dbVersion !== tokenVersion) {
        res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
        return;
      }
      req.user = decoded;
      next();
    })
    .catch(next);
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'Admin' && req.user?.role !== 'SuperAdmin') {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    return;
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'SuperAdmin') {
    res.status(403).json({ error: 'Accès réservé au super administrateur' });
    return;
  }
  next();
};
