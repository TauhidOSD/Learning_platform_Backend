import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Centralized error handler — keeps controllers free of repetitive try/catch boilerplate
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate value: this record already exists." });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors).map((e: any) => e.message).join(", ") });
  }

  res.status(statusCode).json({ message });
};
