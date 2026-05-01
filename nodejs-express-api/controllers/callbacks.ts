import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import DB from '../models/db.js';
import utils from '../helpers/utils.js';
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
      const searchFields = DB.Callbacks.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'callback_id', 'desc');
    query.attributes = DB.Callbacks.listFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.Callbacks.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};
    where['callback_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Callbacks.viewFields();
    const record = await DB.Callbacks.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const query: any = {};
    const where: any = {};
    where['callback_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Callbacks.editFields();
    const record = await DB.Callbacks.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/add', [
  body('transaction_id').not().isEmpty(),
  body('merchant_request_id').optional({ nullable: true, checkFalsy: true }),
  body('checkout_request_id').optional({ nullable: true, checkFalsy: true }),
  body('result_code').optional({ nullable: true, checkFalsy: true }),
  body('result_description').optional({ nullable: true, checkFalsy: true }),
  body('mpesa_receipt_number').optional({ nullable: true, checkFalsy: true }),
  body('amount').optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body('transaction_date').optional({ nullable: true, checkFalsy: true }),
  body('phone_number').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.Callbacks.create(modeldata);
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/edit/:recid', [
  body('transaction_id').optional({ nullable: true }).not().isEmpty(),
  body('merchant_request_id').optional({ nullable: true, checkFalsy: true }),
  body('checkout_request_id').optional({ nullable: true, checkFalsy: true }),
  body('result_code').optional({ nullable: true, checkFalsy: true }),
  body('result_description').optional({ nullable: true, checkFalsy: true }),
  body('mpesa_receipt_number').optional({ nullable: true, checkFalsy: true }),
  body('amount').optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body('transaction_date').optional({ nullable: true, checkFalsy: true }),
  body('phone_number').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['callback_id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Callbacks.editFields();
    const record = await DB.Callbacks.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    await DB.Callbacks.update(modeldata, { where });
    return res.json(modeldata);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = utils.asString(req.params.recid).split(',');
    const query: any = {};
    const where: any = {};
    where['callback_id'] = recid;
    query.raw = true;
    query.where = where;
    await DB.Callbacks.destroy(query);
    return res.json(recid);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;

