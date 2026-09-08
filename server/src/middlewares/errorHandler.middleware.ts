import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly islemKodu?: string;

  constructor(message: string, statusCode: number = 500, islemKodu?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.islemKodu = islemKodu;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = (err as AppError).statusCode || 500;
  const islemKodu = (err as AppError).islemKodu || 'ERR_SYSTEM_500';

  console.error(`[Error] ${statusCode} - ${err.message}`);

  res.status(statusCode).json({
    error: err.message,
    islemKodu,
    islemAck: err.message,
  });
}
