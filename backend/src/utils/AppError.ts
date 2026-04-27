// backend/src/utils/AppError.ts
export class AppError extends Error {
  statusCode: number;
  status: string;
  errors?: any;

  constructor(message: string, statusCode: number = 500, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'falla_cliente' : 'error_servidor';
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}