import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps async route handlers so rejected promises are forwarded to Express's error middleware
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
