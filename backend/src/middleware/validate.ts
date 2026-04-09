import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = (result.error as ZodError).errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      res.status(400).json({ error: message });
      return;
    }
    req.body = result.data;
    next();
  };
