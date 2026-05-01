import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import utils from '../helpers/utils.js';
import Rbac from '../helpers/rbac.js';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.js';

const router = Router();

router.get(['/', '/index'], async (req: Request, res: Response) => {
  try {
    const recid = (req as any).user.id;
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = [...DB.Users.accountviewFields(), 'user_role_id'];

    const record = await DB.Users.findOne(query);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Get role information
    const role = await DB.Roles.findOne({
      where: { role_id: record.user_role_id },
      attributes: ['role_id', 'role_name']
    });

    // Get role-based permissions from role_permissions table
    const rolePerms = await DB.RolePermissions.findAll({
      where: { role_id: record.user_role_id },
      raw: true
    });
    const permissions: string[] = [];
    rolePerms.forEach((p: any) => {
      if (p.list) permissions.push(`${p.page}.list`);
      if (p.view) permissions.push(`${p.page}.view`);
      if (p.edit) permissions.push(`${p.page}.edit`);
      if (p.remove) permissions.push(`${p.page}.remove`);
      if (p.store) permissions.push(`${p.page}.store`);
    });

    // Get user-specific privileges
    const userPrivs = await DB.UserPrivileges.findAll({
      where: { user_id: recid, is_active: 1 },
      attributes: ['privilege']
    });
    const userPrivileges = userPrivs.map((p: any) => p.privilege);

    // Combine permissions (role + user-specific)
    const allPermissions = [...permissions, ...userPrivileges];

    // Return user data with role and permissions
    return res.json({
      ...record,
      role_id: role?.role_id || null,
      role_name: role?.role_name || null,
      permissions: allPermissions
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/edit', [
  body('email').isEmail(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = (req as any).user.id;
    const modeldata = (req as any).getValidFormData();
    await DB.Users.update(modeldata, { where: { id: recid } });
    return res.json({ message: "Profile updated" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/updateusercode', [
  body('usercode').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = (req as any).user.id;
    const modeldata = (req as any).getValidFormData();
    modeldata.usercode = utils.usercodeHash(modeldata.usercode);
    await DB.Users.update(modeldata, { where: { id: recid } });
    return res.json({ message: "usercode updated" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;

