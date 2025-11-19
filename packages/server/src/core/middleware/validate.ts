import { ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err: any) {
    return res.status(400).json({ errors: err.errors });
  }
};
