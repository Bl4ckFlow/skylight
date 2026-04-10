import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler and forwards any thrown error to Express error handler.
 * Eliminates the need for try/catch in every controller.
 */
export const asyncHandler =
  (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
