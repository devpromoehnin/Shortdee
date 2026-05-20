/**
 * Application error with a stable code + HTTP status.
 * Serialized by the global error handler into the standard envelope:
 *   { error: { code, message, details? } }
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  unauthorized: (message = 'ต้องเข้าสู่ระบบก่อน') =>
    new AppError('UNAUTHORIZED', message, 401),
  forbidden: (message = 'ไม่มีสิทธิ์เข้าถึง') => new AppError('FORBIDDEN', message, 403),
  notFound: (message = 'ไม่พบข้อมูล') => new AppError('NOT_FOUND', message, 404),
  quotaExceeded: (details?: Record<string, unknown>) =>
    new AppError('QUOTA_EXCEEDED', 'เครดิตหมดแล้ว — อัพเกรดเพื่อใช้งานต่อ', 402, details),
}
