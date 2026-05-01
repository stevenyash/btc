import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.js';

const router = Router();

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await DB.Roles.findAndCountAll({
      limit,
      offset,
      order: [['role_id', 'DESC']],
      raw: true,
    });

    return res.json({
      data: rows,
      total: count,
      page,
      limit,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/roles/:id', async (req: Request, res: Response) => {
  try {
    const role = await DB.Roles.findByPk(req.params.id, { raw: true });
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    return res.json(role);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/roles', [
  body('role_name').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.Roles.create(modeldata);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/roles/:id', async (req: Request, res: Response) => {
  try {
    const role = await DB.Roles.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    await role.update(req.body);
    return res.json(role);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/roles/:id', async (req: Request, res: Response) => {
  try {
    const role = await DB.Roles.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    await role.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;