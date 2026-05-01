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

    if (fieldName) {
      queryFilters.push(DB.filterBy(fieldName, fieldValue));
    }

    const search = req.query.search;
    if (search) {
      const searchFields = DB.LessonTrack.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }

    if (queryFilters.length) {
      where[DB.op.and] = queryFilters;
    }

    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.LessonTrack.listFields();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await DB.LessonTrack.paginate(query, page, limit);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};

    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LessonTrack.viewFields();

    const record = await DB.LessonTrack.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/add/', [
  body('subscription_id').not().isEmpty().isNumeric(),
  body('user_id').not().isEmpty().isNumeric(),
  body('lessons_viewed').not().isEmpty().isNumeric(),
  body('lesson_balance').not().isEmpty().isNumeric(),
  body('total_lessons').not().isEmpty().isNumeric(),
  body('package_id').not().isEmpty().isNumeric(),
  body('status').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.LessonTrack.create(modeldata);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const query: any = {};
    const where: any = {};

    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LessonTrack.editFields();

    const record = await DB.LessonTrack.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/edit/:recid', [
  body('subscription_id').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('user_id').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('lessons_viewed').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('lesson_balance').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('total_lessons').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('package_id').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('status').optional({ nullable: true }).not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};

    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.LessonTrack.editFields();

    const record = await DB.LessonTrack.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    await DB.LessonTrack.update(modeldata, { where: where });
    return res.json(modeldata);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = utils.asString(req.params.recid).split(',');
    const query: any = {};
    const where: any = {};

    where['id'] = recid;
    query.raw = true;
    query.where = where;

    const records = await DB.LessonTrack.findAll(query);

    for (const record of records) {
      // perform action on each record before delete
    }

    await DB.LessonTrack.destroy(query);
    return res.json(recid);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;

