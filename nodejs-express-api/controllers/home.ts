import { Router, Request, Response } from 'express';

const router = Router();

router.get(['/', '/index'], async function (req: Request, res: Response) {
  res.render('pages/index/welcome.html');
});

export default router;
