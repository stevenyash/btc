import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const title = req.body.title || '';
  const data = req.body.data || '';
  res.render('layouts/report.ejs', { title, data, config: (req as any).app.locals.config });
});

export default router;
