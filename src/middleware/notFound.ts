import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.originalUrl} not found`
        }
    });
};
