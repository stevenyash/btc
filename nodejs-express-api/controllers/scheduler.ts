import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.ts';
import { createMeetEvent } from '../helpers/googleMeet.js';

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
    joinTables.push({ model: DB.Users, required: false, as: 'users', attributes: [] });
    query.include = joinTables;
    const search = req.query.search;
    if (search) {
      const searchFields = DB.Scheduler.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Scheduler.listFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.Scheduler.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/view/:recid', async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid || null;
    const query: any = {};
    const where: any = {};
    const joinTables: any[] = [];
    joinTables.push({ model: DB.Users, required: false, as: 'users', attributes: [] });
    query.include = joinTables;
    where[DB.op.and] = DB.raw('scheduler.id = :recid');
    query.replacements = { recid };
    query.raw = true;
    query.where = where;
    query.attributes = DB.Scheduler.viewFields();
    const record = await DB.Scheduler.findOne(query);
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
    query.attributes = DB.Scheduler.editFields();
    const record = await DB.Scheduler.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/add', [
  body('user_id').optional({ nullable: true, checkFalsy: true }),
  body('grade').optional({ nullable: true, checkFalsy: true }),
  body('learning_area').optional({ nullable: true, checkFalsy: true }),
  body('strand').optional({ nullable: true, checkFalsy: true }),
  body('start_date').optional({ nullable: true, checkFalsy: true }),
  body('end_date').optional({ nullable: true, checkFalsy: true }),
  body('status').optional({ nullable: true, checkFalsy: true }),
  body('link').optional({ nullable: true, checkFalsy: true }),
  body('meetingid').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const modeldata = (req as any).getValidFormData();
    await beforeAdd(modeldata, req);
    const record = await DB.Scheduler.create(modeldata);
    return res.json(record);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

async function beforeAdd(postdata: any, req: Request) {
  const hostemail = (req as any).user?.email || "nzukipk@gmail.com";
  const summary = `${postdata.grade} ${postdata.learning_area} ${postdata.strand || ""}`.trim();
  const description = `Lesson on ${postdata.learning_area} for grade ${postdata.grade}`;
  const localTimeZone = 'Africa/Nairobi';
  const startTime = new Date(`${postdata.start_date}:00`).toISOString();
  const endTime = new Date(`${postdata.end_date}:00`).toISOString();
  const meetData = await createMeetEvent({ summary, description, startTime, endTime, timeZone: localTimeZone, hostemail });
  postdata.link = meetData.meetingUrl;
  postdata.meetingid = meetData.eventId;
  return postdata;
}

router.post('/edit/:recid', [
  body('user_id').optional({ nullable: true, checkFalsy: true }),
  body('grade').optional({ nullable: true, checkFalsy: true }),
  body('learning_area').optional({ nullable: true, checkFalsy: true }),
  body('strand').optional({ nullable: true, checkFalsy: true }),
  body('start_date').optional({ nullable: true, checkFalsy: true }),
  body('end_date').optional({ nullable: true, checkFalsy: true }),
  body('status').optional({ nullable: true, checkFalsy: true }),
  body('link').optional({ nullable: true, checkFalsy: true }),
  body('meetingid').optional({ nullable: true, checkFalsy: true }),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const recid = req.params.recid;
    const modeldata = (req as any).getValidFormData({ includeOptionals: true });
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    query.attributes = DB.Scheduler.editFields();
    const record = await DB.Scheduler.findOne(query);
    if (!record) return res.status(404).json({ error: "Record not found" });
    await DB.Scheduler.update(modeldata, { where });
    return res.json(modeldata);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/delete/:recid', async (req: Request, res: Response) => {
  try {
    const recid = (req.params.recid || '').split(',');
    const query: any = {};
    const where: any = {};
    where['id'] = recid;
    query.raw = true;
    query.where = where;
    await DB.Scheduler.destroy(query);
    return res.json(recid);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/teachersscheduler/:fieldname?/:fieldvalue?', async (req: Request, res: Response) => {
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
      const searchFields = DB.Scheduler.searchFields();
      where[DB.op.or] = searchFields;
      replacements.search = `%${search}%`;
    }
    where['user_id'] = (req as any).user.id;
    if (queryFilters.length) where[DB.op.and] = queryFilters;
    query.raw = true;
    query.where = where;
    query.replacements = replacements;
    query.order = DB.getOrderBy(req, 'id', 'desc');
    query.attributes = DB.Scheduler.teachersschedulerFields();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.Scheduler.paginate(query, page, limit);
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;

