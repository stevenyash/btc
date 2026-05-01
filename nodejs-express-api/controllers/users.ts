import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import utils from '../helpers/utils.js';
import uploader from '../helpers/uploader.js';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.js';

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

    const joinTables: any[] = [];
    joinTables.push({
      model: DB.Roles,
      required: true,
      as: 'roles',
      attributes: [],
    });

    query.include = joinTables;

    const search = req.query.search;
    if (search) {
      const searchFields = DB.Users.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }

    where['role_name'] != "subscriber";

    if (queryFilters.length) {
      where[DB.op.and] = queryFilters;
    }

    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Users.listFields();

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await DB.Users.paginate(query, page, limit);
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

    const joinTables: any[] = [];
    joinTables.push({
      model: DB.Roles,
      required: true,
      as: 'roles',
      attributes: [],
    });

    query.include = joinTables;
    where[DB.op.and] = DB.raw('users.id = :recid');
    query.replacements = { recid };
    query.raw = true;
    query.where = where;
    query.attributes = DB.Users.viewFields();

    const record = await DB.Users.findOne(query);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/add', [
  body('email').not().isEmpty().isEmail(),
  body('username').not().isEmpty(),
  body('usercode').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    modeldata.usercode = utils.usercodeHash(modeldata.usercode);
    const record = await DB.Users.create(modeldata);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = req.body;
    if (modeldata.usercode) {
      modeldata.usercode = utils.usercodeHash(modeldata.usercode);
    }
    await DB.Users.update(modeldata, { where: { id: recid } });
    return res.json({ message: "Record updated" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    await DB.Users.destroy({ where: { id: recid } });
    return res.json({ message: "Record deleted" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;

