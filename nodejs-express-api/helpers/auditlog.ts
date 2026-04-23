import { Request } from 'express';

interface AuditLogRecord {
  action?: string;
  details?: any;
  userId?: number;
  [key: string]: any;
}

export default async function writeToLog(req: Request, payload: AuditLogRecord): Promise<void> {
  // Not implemented
}

export { writeToLog };