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
      const searchFields = DB.Purchases.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'purchase_id', 'desc');
    query.attributes = DB.Purchases.listFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.Purchases.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};
    where['purchase_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Purchases.viewFields();
    const record = await DB.Purchases.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/add', [
  body('user_id').not().isEmpty(),
  body('package_id').not().isEmpty(),
  body('transaction_status').optional({ nullable: true, checkFalsy: true }),
  body('payment_reference').optional({ nullable: true, checkFalsy: true }),
  body('amount_paid').optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body('expiry_date').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.Purchases.create(modeldata);
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const query: any = {};
    const where: any = {};
    where['purchase_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Purchases.editFields();
    const record = await DB.Purchases.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/edit/:recid', [
  body('user_id').optional({ nullable: true }).not().isEmpty(),
  body('package_id').optional({ nullable: true }).not().isEmpty(),
  body('transaction_status').optional({ nullable: true, checkFalsy: true }),
  body('payment_reference').optional({ nullable: true, checkFalsy: true }),
  body('amount_paid').optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body('expiry_date').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['purchase_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Purchases.editFields();
    const record = await DB.Purchases.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    await DB.Purchases.update(modeldata, { where });
    return res.json(modeldata);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = utils.asString(req.params.recid).split(',');
    const query: any = {};
    const where: any = {};
    where['purchase_id'] = recid;
    query.raw = true;
    query.where = where;
    await DB.Purchases.findAll(query);
    await DB.Purchases.destroy(query);
    return res.json(recid);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;

