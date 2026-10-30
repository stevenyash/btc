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
      const searchFields = DB.Packages.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }

    if (req.query.subscription_type_id) {
      queryFilters.push(DB.filterBy("packages.subscription_type_id", req.query.subscription_type_id));
    }

    if (queryFilters.length) {
      where[DB.op.and] = queryFilters;
    }

    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Packages.listFields();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await DB.Packages.paginate(query, page, limit);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = parseInt(String(req.params.recid || ''), 10);
    if (isNaN(recid)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Packages.viewFields();

    const record: any = await DB.Packages.findOne(query);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    record.nextRecordId = await getNextRecordId(recid);
    record.previousRecordId = await getPreviousRecordId(recid);

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
    query.attributes = DB.Packages.editFields();
    const record = await DB.Packages.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/add', [
  body('subscription_type_id').not().isEmpty(),
  body('name').not().isEmpty(),
  body('description').not().isEmpty(),
  body('fee').not().isEmpty().isNumeric(),
  body('concurrent_access').not().isEmpty().isNumeric(),
  body('created_at').not().isEmpty(),
  body('no_of_lessons').not().isEmpty().isNumeric(),
  body('watch_time_minutes').not().isEmpty().isInt({ min: 1 }),
  body('duration_amount').not().isEmpty().isNumeric(),
  body('duration_unit').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.Packages.create(modeldata);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/edit/:recid', [
  body('subscription_type_id').optional({ nullable: true }).not().isEmpty(),
  body('name').optional({ nullable: true }).not().isEmpty(),
  body('description').optional({ nullable: true }).not().isEmpty(),
  body('fee').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('concurrent_access').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('no_of_lessons').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('watch_time_minutes').optional({ nullable: true }).isInt({ min: 1 }),
  body('duration_amount').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('duration_unit').optional({ nullable: true }).not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Packages.editFields();
    const record = await DB.Packages.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    await DB.Packages.update(modeldata, { where });
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
    const records = await DB.Packages.findAll(query);
    await DB.Packages.destroy(query);
    return res.json(recid);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

async function getNextRecordId(recid: number) {
  const query: any = {};
  const where: any = {};
  const keyField = 'id';
  where[keyField] = { [DB.op.gt]: recid };
  query.where = where;
  query.order = [[keyField, 'ASC']];
  query.attributes = [keyField];
  const record = await DB.Packages.findOne(query);
  return record ? record.id : null;
}

async function getPreviousRecordId(recid: number) {
  const query: any = {};
  const where: any = {};
  const keyField = 'id';
  where[keyField] = { [DB.op.lt]: recid };
  query.where = where;
  query.order = [[keyField, 'DESC']];
  query.attributes = [keyField];
  const record = await DB.Packages.findOne(query);
  return record ? record.id : null;
}

export default router;
