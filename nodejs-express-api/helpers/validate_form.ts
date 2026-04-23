import { validationResult, matchedData } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

interface ValidatedDataOptions {
  includeOptionals?: boolean;
}

interface CustomRequest extends Request {
  getValidFormData?: (options?: ValidatedDataOptions) => any;
}

export function validateFormData(req: CustomRequest, res: Response, next: NextFunction): void {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errorMsgs: string[] = [];

    validation.array().forEach((error: any) => {
      console.log(error);
      const fieldName = error.path;
      const message = error.msg.toString();
      errorMsgs.push(`${fieldName}: ${message}`);
    });

    console.log(errorMsgs);
    res.status(400).json({ errors: errorMsgs });
    return;
  }

  (req as any).getValidFormData = function (options: ValidatedDataOptions = { includeOptionals: false }) {
    return matchedData(req, { locations: ['body'], ...options });
  };

  next();
}

export default validateFormData;