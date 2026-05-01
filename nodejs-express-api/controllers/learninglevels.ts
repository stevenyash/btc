import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import utils from '../helpers/utils.js';
import { body } from 'express-validator';
import validateFormData from '../helpers/validate_form.js';

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
      const searchFields = DB.LearningLevels.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = [['name', 'ASC']];
    query.attributes = DB.LearningLevels.listFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.LearningLevels.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};
    where['level_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LearningLevels.viewFields();
    const record = await DB.LearningLevels.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const query: any = {};
    const where: any = {};
    where['level_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LearningLevels.editFields();
    const record = await DB.LearningLevels.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/add', [
  body('name').optional({ nullable: true, checkFalsy: true }),
  body('description').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.LearningLevels.create(modeldata);
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/edit/:recid', [
  body('name').optional({ nullable: true, checkFalsy: true }),
  body('description').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['level_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LearningLevels.editFields();
    const record = await DB.LearningLevels.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    await DB.LearningLevels.update(modeldata, { where });
    return res.json(modeldata);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = utils.asString(req.params.recid).split(',');
    const query: any = {};
    const where: any = {};
    where['level_id'] = recid;
    query.raw = true;
    query.where = where;
    const records = await DB.LearningLevels.findAll(query);
    for (const record of records) {
      const gradeCount = await DB.Grades.count({ where: { level_id: record.level_id } });
      if (gradeCount > 0) {
        return res.status(400).json({ error: `Cannot delete level "${record.name}" because it has ${gradeCount} associated grade(s).` });
      }
    }
    await DB.LearningLevels.destroy(query);
    return res.json(recid);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/:levelId/grades', async (req: Request, res: Response) => {
  try {
    const levelId = req.params.levelId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const query: any = {};
    const where: any = {};
    where['level_id'] = levelId;
    where['is_active'] = true;
    query.raw = true;
    query.where = where;
    query.order = [['name', 'ASC']];
    query.attributes = DB.Grades.listFields();
    const result = await DB.Grades.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;