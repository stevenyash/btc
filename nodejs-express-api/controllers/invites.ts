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
      const searchFields = DB.Invites.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }

    const allowedRoles = ["admin", "superadmin"];
    const userRole = (req as any).userRoleName;

    if (!allowedRoles.includes(userRole)) {
      where['user_id'] = (req as any).user.id;
    }

    if (queryFilters.length) {
      where[DB.op.and] = queryFilters;
    }

    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Invites.listFields();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await DB.Invites.paginate(query, page, limit);
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

    const allowedRoles = ["admin", "superadmin"];
    const userRole = (req as any).userRoleName;

    if (!allowedRoles.includes(userRole)) {
      where['user_id'] = (req as any).user.id;
    }

    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Invites.viewFields();

    const record = await DB.Invites.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/add/', [
  body('invitee_email').optional({ nullable: true, checkFalsy: true }).isEmail(),
  body('invitee_phone').optional({ nullable: true, checkFalsy: true }),
  body('referral_code').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    modeldata['user_id'] = (req as any).user.id;

    const invitee_emailCount = await DB.Invites.count({ where: { 'invitee_email': modeldata.invitee_email } });
    if (invitee_emailCount > 0) {
      return res.status(400).json({ error: `${modeldata.invitee_email} already exist.` });
    }

    const invitee_phoneCount = await DB.Invites.count({ where: { 'invitee_phone': modeldata.invitee_phone } });
    if (invitee_phoneCount > 0) {
      return res.status(400).json({ error: `${modeldata.invitee_phone} already exist.` });
    }

    await beforeAdd(modeldata, req);

    const record = await DB.Invites.create(modeldata);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

async function beforeAdd(postdata: any, req: any) {
  const where = { phone: req.user.phone || req.user.username };
  const record = await DB.Marketers.findOne({ where });
  postdata.referral_code = record?.id;
}

router.get('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const query: any = {};
    const where: any = {};

    const allowedRoles = ["admin", "superadmin"];
    const userRole = (req as any).userRoleName;

    if (!allowedRoles.includes(userRole)) {
      where['user_id'] = (req as any).user.id;
    }

    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Invites.editFields();

    const record = await DB.Invites.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/edit/:recid', [
  body('invitee_email').optional({ nullable: true, checkFalsy: true }).isEmail(),
  body('invitee_phone').optional({ nullable: true, checkFalsy: true }),
  body('referral_code').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });

    const invitee_emailCount = await DB.Invites.count({
      where: { 'invitee_email': modeldata.invitee_email, 'id': { [DB.op.ne]: recid } }
    });
    if (invitee_emailCount > 0) {
      return res.status(400).json({ error: `${modeldata.invitee_email} already exist.` });
    }

    const invitee_phoneCount = await DB.Invites.count({
      where: { 'invitee_phone': modeldata.invitee_phone, 'id': { [DB.op.ne]: recid } }
    });
    if (invitee_phoneCount > 0) {
      return res.status(400).json({ error: `${modeldata.invitee_phone} already exist.` });
    }

    const query: any = {};
    const where: any = {};

    const allowedRoles = ["admin", "superadmin"];
    const userRole = (req as any).userRoleName;

    if (!allowedRoles.includes(userRole)) {
      where['user_id'] = (req as any).user.id;
    }

    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Invites.editFields();

    const record = await DB.Invites.findOne(query);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    await DB.Invites.update(modeldata, { where: where });
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

    const allowedRoles = ["admin", "superadmin"];
    const userRole = (req as any).userRoleName;

    if (!allowedRoles.includes(userRole)) {
      where['user_id'] = (req as any).user.id;
    }

    where['id'] = recid;
    query.raw = true;
    query.where = where;

    const records = await DB.Invites.findAll(query);

    for (const record of records) {
      // perform action on each record before delete
    }

    await DB.Invites.destroy(query);
    return res.json(recid);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;

