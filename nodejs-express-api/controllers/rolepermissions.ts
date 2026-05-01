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
    
    const joinTables: any[] = [];
    joinTables.push({
      model: DB.Roles,
      required: false,
      as: 'roles',
      attributes: [],
    });
    query.include = joinTables;
    
    const search = req.query.search;
    if (search) {
      const searchFields = DB.RolePermissions.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    if (req.query.role_id) {
      queryFilters.push(DB.filterBy("roles.role_id", req.query.role_id));
    }
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.RolePermissions.listFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.RolePermissions.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};
    const joinTables: any[] = [];
    joinTables.push({
      model: DB.Roles,
      required: false,
      as: 'roles',
      attributes: [],
    });
    query.include = joinTables;
    where[DB.op.and] = DB.raw('role_permissions.id = :recid');
    query.replacements = { recid };
    query.raw = true;
    query.where = where;
    query.attributes = DB.RolePermissions.viewFields();
    const record = await DB.RolePermissions.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/edit/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.RolePermissions.editFields();
    const record = await DB.RolePermissions.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/add', [
  body('list').not().isEmpty().isNumeric(),
  body('edit').not().isEmpty(),
  body('remove').not().isEmpty().isNumeric(),
  body('view').not().isEmpty().isNumeric(),
  body('page').not().isEmpty(),
  body('role_id').not().isEmpty(),
  body('store').optional({ nullable: true, checkFalsy: true }).isNumeric(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const existingPermission = await DB.RolePermissions.findOne({
      where: { role_id: modeldata.role_id, page: modeldata.page }
    });
    if (existingPermission) {
      return res.status(400).json({ error: 'Permission for this page already exists for the specified role' });
    }
    const record = await DB.RolePermissions.create(modeldata);
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/edit/:recid', [
  body('list').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('edit').optional({ nullable: true }).not().isEmpty(),
  body('remove').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('view').optional({ nullable: true }).not().isEmpty().isNumeric(),
  body('page').optional({ nullable: true }).not().isEmpty(),
  body('role_id').optional({ nullable: true }).not().isEmpty(),
  body('store').optional({ nullable: true, checkFalsy: true }).isNumeric(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.RolePermissions.editFields();
    const record = await DB.RolePermissions.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    
    if (modeldata.role_id || modeldata.page) {
      const duplicateWhere: any = {
        role_id: modeldata.role_id || record.role_id,
        page: modeldata.page || record.page,
        id: { [DB.op.ne]: recid }
      };
      const existingPermission = await DB.RolePermissions.findOne({ where: duplicateWhere });
      if (existingPermission) {
        return res.status(400).json({ error: 'Permission for this page already exists for the specified role' });
      }
    }
    await DB.RolePermissions.update(modeldata, { where });
    return res.json(modeldata);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = utils.asString(req.params.recid).split(',');
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    const records = await DB.RolePermissions.findAll(query);
    await DB.RolePermissions.destroy(query);
    return res.json(recid);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/check-duplicate', async (req: Request, res: Response) => {
  try {
    const roleId = req.query.role_id as string;
    const page = req.query.page as string;
    const excludeId = req.query.exclude_id ? parseInt(req.query.exclude_id as string) : null;
    if (!roleId || !page) {
      return res.status(400).json({ error: 'Role ID and page are required' });
    }
    const where: any = { role_id: roleId, page };
    if (excludeId) {
      where.id = { [DB.op.ne]: excludeId };
    }
    const existing = await DB.RolePermissions.findOne({ where });
    return res.json({ exists: !!existing });
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/by-role/:roleId', async (req: Request, res: Response) => {
  try {
    const roleId = req.params.roleId;
    const permissions = await DB.RolePermissions.findAll({
      where: { role_id: roleId },
      order: [['page', 'ASC']],
      raw: true
    });
    return res.json(permissions);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;

