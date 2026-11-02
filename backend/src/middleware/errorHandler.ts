import type { Request, Response, NextFunction } from 'express';

type HttpError = Error & { status?: number; driverError?: { code?: string } };

export function errorHandler(err: HttpError, _req: Request, res: Response, next: NextFunction) {
    if (res.headersSent) return next(err);

    if (err.driverError?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Duplicate entry' });
    }

    if (typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ message: 'Bad request' });
    }

    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
}