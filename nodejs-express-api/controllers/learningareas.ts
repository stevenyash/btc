import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.ts';

const router = Router();

router.get(['/', '/index/:fieldname?/:fieldvalue?'], async (req: Request, res: Response) => {
  try {
    const query: any = {};
    const queryFilters: any[] = [];
    const where: any = {};
    const replacements: any = {};
    const fieldName = req.params.fieldname;
    const fieldValue = req.params.fieldvalue;
    if (fieldName) queryFilters.push(DB.filterBy(fieldName, fieldValue));
    const search = req.query.search;
    if (search) {
      const searchFields = DB.LearningAreas.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'learning_area_id', 'desc');
    query.attributes = DB.LearningAreas.listFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.LearningAreas.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};
    where['learning_area_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LearningAreas.viewFields();
    const record = await DB.LearningAreas.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const query: any = {};
    const where: any = {};
    where['learning_area_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LearningAreas.editFields();
    const record = await DB.LearningAreas.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/add', [
  body('name').optional({ nullable: true, checkFalsy: true }),
  body('description').optional({ nullable: true, checkFalsy: true }),
  body('grade_id').optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body('color').optional({ nullable: true, checkFalsy: true }),
  body('icon').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.LearningAreas.create(modeldata);
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.put('/edit/:recid', [
  body('name').optional({ nullable: true, checkFalsy: true }),
  body('description').optional({ nullable: true, checkFalsy: true }),
  body('grade_id').optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body('color').optional({ nullable: true, checkFalsy: true }),
  body('icon').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['learning_area_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LearningAreas.editFields();
    const record = await DB.LearningAreas.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    await DB.LearningAreas.update(modeldata, { where: { learning_area_id: recid } });
    return res.json({ message: "Record updated" });
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    await DB.LearningAreas.destroy({ where: { learning_area_id: recid } });
    return res.json({ message: "Record deleted" });
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/:areaId/lessons', async (req: Request, res: Response) => {
  try {
    const areaId = req.params.areaId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const query: any = {};
    const where: any = {};
    where['area_id'] = areaId;
    where['is_active'] = true;
    query.raw = true;
    query.where = where;
    query.order = DB.getOrderBy(req, 'sort_order', 'asc');
    query.attributes = DB.Lessons.listFields();
    const result = await DB.Lessons.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;

