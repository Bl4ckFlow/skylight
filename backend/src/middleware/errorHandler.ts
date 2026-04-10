import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) {
    console.error(`[${req.method}] ${req.path} — ${err.message}`, err.stack);
  }
  res.status(status).json({ error: err.message || 'Erreur interne' });
}
