import { Request, Response, NextFunction } from 'express';
import uploader from './s3uploader.js';

export function s3UploadMiddleware(fieldName: string, fileFormName = 'file') {
  return function (req: Request, res: Response, next: NextFunction) {
    const uploadField = fieldName || (req.params as Record<string, unknown>).fieldname as string;

    uploader.upload(uploadField).array(fileFormName)(req, res, (err: Error | null) => {
      if (err) {
        console.error(err);
        return res.badRequest(err.message);
      }
      return next();
    });
  };
}