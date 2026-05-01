import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import utils from '../helpers/utils.js';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.js';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const phone = (req as any).user.username;
    
    const dashboardSql = `
      SELECT 
        COALESCE(
          ROUND(
            (COUNT(CASE WHEN status = 'active' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
            0
          ), 
          0
        ) AS conversion_rate,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_referrals,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) AS weekly_growth,
        COUNT(*) AS total_invites
      FROM invites 
      WHERE user_id = :userId
    `;
    const dashboardResult: any = await DB.rawQueryOne(dashboardSql, { userId });
    
    const performanceSql = `
      SELECT 
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) AS weekly_invites,
        COUNT(CASE WHEN status = 'active' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS monthly_conversions
      FROM invites 
      WHERE user_id = :userId
    `;
    const performanceResult: any = await DB.rawQueryOne(performanceSql, { userId });
    
    const marketerSql = `
      SELECT 
        COALESCE(points, 0) AS total_points,
        COALESCE(redeemed_points, 0) AS redeemed_points,
        COALESCE(points, 0) - COALESCE(redeemed_points, 0) AS available_points,
        COALESCE(commission_rate, 0.10) AS commission_rate,
        COALESCE(total_earnings, 0) AS total_earnings,
        COALESCE(pending_earnings, 0) AS pending_earnings,
        COALESCE(withdrawn_earnings, 0) AS withdrawn_earnings
      FROM marketers 
      WHERE phone = :phone
    `;
    const marketerResult: any = await DB.rawQueryOne(marketerSql, { phone });
    
    const pointValueSql = `SELECT setting_value FROM system_settings WHERE setting_key = 'point_value'`;
    const pointValueResult: any = await DB.rawQueryOne(pointValueSql, {});
    const pointValue = pointValueResult ? parseFloat(pointValueResult.setting_value) : 10.00;
    
    const activitySql = `
      SELECT 
        CASE 
          WHEN status = 'active' THEN 'person_add'
          WHEN status = 'pending' THEN 'email'
          ELSE 'info'
        END AS icon,
        CASE 
          WHEN status = 'active' THEN 'positive'
          WHEN status = 'pending' THEN 'primary'
          ELSE 'grey'
        END AS color,
        CONCAT(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, created_at, NOW()) < 1 THEN CONCAT(TIMESTAMPDIFF(MINUTE, created_at, NOW()), ' minutes ago')
            WHEN TIMESTAMPDIFF(HOUR, created_at, NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, created_at, NOW()), ' hours ago')
            ELSE CONCAT(TIMESTAMPDIFF(DAY, created_at, NOW()), ' days ago')
          END
        ) AS time,
        CASE 
          WHEN status = 'active' THEN 'New Referral'
          WHEN status = 'pending' THEN 'Invite Sent'
          ELSE 'Activity'
        END AS title,
        CONCAT(invitee_phone, ' - ', COALESCE(invitee_email, 'No email')) AS description
      FROM invites 
      WHERE user_id = :userId
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const activityResult = await DB.rawQueryList(activitySql, { userId });
    
    const commissionsSql = `
      SELECT 
        mc.id,
        mc.purchase_type,
        mc.purchase_amount,
        mc.commission_amount,
        mc.commission_rate,
        mc.status,
        mc.created_at
      FROM marketer_commissions mc
      INNER JOIN marketers m ON mc.marketer_id = m.id
      WHERE m.phone = :phone
      ORDER BY mc.created_at DESC
      LIMIT 10
    `;
    const commissionsResult = await DB.rawQueryList(commissionsSql, { phone });
    
    const targetProgress = 50;
    const targetProgressValue = Math.min(100, Math.round(((performanceResult?.weekly_invites || 0) / targetProgress) * 100));
    
    return res.json({
      dashboard: {
        conversion_rate: Number(dashboardResult?.conversion_rate) || 0,
        active_referrals: Number(dashboardResult?.active_referrals) || 0,
        weekly_growth: Number(dashboardResult?.weekly_growth) || 0,
        total_invites: Number(dashboardResult?.total_invites) || 0,
      },
      performance: {
        weekly_invites: Number(performanceResult?.weekly_invites) || 0,
        monthly_conversions: Number(performanceResult?.monthly_conversions) || 0,
        monthly_points: Number(marketerResult?.total_points) || 0,
        target_progress: targetProgressValue,
      },
      earnings: {
        total_points: Number(marketerResult?.total_points) || 0,
        redeemed_points: Number(marketerResult?.redeemed_points) || 0,
        available_points: Number(marketerResult?.available_points) || 0,
        point_value: pointValue,
        potential_cash: (Number(marketerResult?.available_points) || 0) * pointValue,
        commission_rate: Number(marketerResult?.commission_rate) || 0.1,
        total_earnings: Number(marketerResult?.total_earnings) || 0,
        pending_earnings: Number(marketerResult?.pending_earnings) || 0,
        withdrawn_earnings: Number(marketerResult?.withdrawn_earnings) || 0,
      },
      activity: activityResult || [],
      commissions: commissionsResult || [],
    });
  } catch (err) {
    console.error("Marketer dashboard error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

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
      const searchFields = DB.Marketers.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Marketers.listFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.Marketers.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Marketers.viewFields();
    const record = await DB.Marketers.findOne(query);
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
    query.attributes = DB.Marketers.editFields();
    const record = await DB.Marketers.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/add', [
  body('firstname').not().isEmpty(),
  body('lastname').not().isEmpty(),
  body('email').isEmail(),
  body('phone').not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    const record = await DB.Marketers.create(modeldata);
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/edit/:recid', [
  body('firstname').optional({ nullable: true }).not().isEmpty(),
  body('lastname').optional({ nullable: true }).not().isEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional({ nullable: true }).not().isEmpty(),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Marketers.editFields();
    const record = await DB.Marketers.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    await DB.Marketers.update(modeldata, { where });
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
    await DB.Marketers.destroy(query);
    return res.json(recid);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;

