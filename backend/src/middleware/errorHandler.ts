import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[${req.method}] ${req.path}`, err);
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({ error: err.message || 'Erreur interne' });
}
