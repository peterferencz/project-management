import { Request, Response, NextFunction } from "express";
import * as z from "zod"

export const validateBody = (schema: z.ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const obj = schema.safeParse(req.body);

    if(!obj.success) {
        return res.status(400).json({
            message: 'Invalid body - ' + obj.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        })
    }

    req.body = obj.data
    next();
  };
};