import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import validateFormData from '../helpers/validate_form.js';
import DB from '../models/db.js';
import mpesaService from '../helpers/MpesaService.js';

const router = Router();

async function getSetting(key: string, defaultValue: string | null = null): Promise<string | null> {
  const record = await DB.SystemSettings.findOne({ where: { setting_key: key } });
  return record ? record.setting_value : defaultValue;
}

async function getMarketerByUser(user: any) {
  return await DB.Marketers.findOne({ where: { phone: user.username } });
}

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const marketer = await getMarketerByUser((req as any).user);
    if (!marketer) return res.status(404).json({ error: 'Marketer profile not found' });

    const availablePoints = (marketer.points || 0) - (marketer.redeemed_points || 0);
    const pointValue = parseFloat(await getSetting('point_value', '10.00') || '10.00');
    const potentialCash = availablePoints * pointValue;

    return res.json({
      points: marketer.points || 0,
      redeemed_points: marketer.redeemed_points || 0,
      available_points: availablePoints,
      point_value: pointValue,
      potential_cash: potentialCash,
      commission_rate: parseFloat(marketer.commission_rate) || 0.10,
      total_earnings: parseFloat(marketer.total_earnings) || 0,
      pending_earnings: parseFloat(marketer.pending_earnings) || 0,
      withdrawn_earnings: parseFloat(marketer.withdrawn_earnings) || 0,
    });
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/commissions', async (req: Request, res: Response) => {
  try {
    const marketer = await getMarketerByUser((req as any).user);
    if (!marketer) return res.status(404).json({ error: 'Marketer profile not found' });

    const query: any = {
      raw: true,
      where: { marketer_id: marketer.id },
      order: DB.getOrderBy(req, 'created_at', 'desc'),
      attributes: DB.MarketerCommissions.listFields()
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.MarketerCommissions.paginate(query, page, limit);

    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/redemptions', async (req: Request, res: Response) => {
  try {
    const marketer = await getMarketerByUser((req as any).user);
    if (!marketer) return res.status(404).json({ error: 'Marketer profile not found' });

    const query: any = {
      raw: true,
      where: { marketer_id: marketer.id },
      order: DB.getOrderBy(req, 'created_at', 'desc'),
      attributes: DB.MarketerPointRedemptions.listFields()
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.MarketerPointRedemptions.paginate(query, page, limit);

    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/redeem-points', [
  body('points_to_redeem').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const marketer = await getMarketerByUser((req as any).user);
    if (!marketer) return res.status(404).json({ error: 'Marketer profile not found' });

    const pointsToRedeem = parseInt(req.body.points_to_redeem);
    const availablePoints = (marketer.points || 0) - (marketer.redeemed_points || 0);

    const minRedemption = parseInt(await getSetting('min_points_redemption', '10') || '10');
    if (pointsToRedeem < minRedemption) {
      return res.status(400).json({ error: `Minimum ${minRedemption} points required for redemption` });
    }

    if (pointsToRedeem > availablePoints) {
      return res.status(400).json({ error: `Insufficient points. Available: ${availablePoints}` });
    }

    const pendingRedemption = await DB.MarketerPointRedemptions.findOne({
      where: { marketer_id: marketer.id, status: 'pending' }
    });
    if (pendingRedemption) {
      return res.status(400).json({ error: 'You have a pending redemption request. Please wait for admin approval.' });
    }

    const pointValue = parseFloat(await getSetting('point_value', '10.00') || '10.00');
    const cashAmount = pointsToRedeem * pointValue;

    const redemption = await DB.MarketerPointRedemptions.create({
      marketer_id: marketer.id,
      points_redeemed: pointsToRedeem,
      point_value: pointValue,
      cash_amount: cashAmount,
      status: 'pending',
    });

return res.json(redemption);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/withdrawals', async (req: Request, res: Response) => {
  try {
    const marketer = await getMarketerByUser((req as any).user);
    if (!marketer) return res.status(404).json({ error: 'Marketer profile not found' });

    const query: any = {
      raw: true,
      where: { marketer_id: marketer.id },
      order: DB.getOrderBy(req, 'created_at', 'desc'),
      attributes: DB.MarketerWithdrawals?.listFields?.() || ['id', 'amount', 'phone_number', 'status', 'created_at', 'processed_at']
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await DB.MarketerWithdrawals.paginate(query, page, limit);

    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/withdraw', [
  body('phone_number').notEmpty().withMessage('Phone number is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least KES 100'),
], validateFormData as any, async (req: Request, res: Response) => {
  try {
    const marketer = await getMarketerByUser((req as any).user);
    if (!marketer) return res.status(404).json({ error: 'Marketer profile not found' });

    const { phone_number, amount } = req.body;
    const cleanPhone = phone_number.replace(/^0/, "254").replace(/\D/g, "");
    
    if (!cleanPhone.startsWith("254") || cleanPhone.length !== 12) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const pendingEarnings = parseFloat(marketer.pending_earnings) || 0;
    if (amount > pendingEarnings) {
      return res.status(400).json({ error: 'Insufficient pending earnings' });
    }

    const pendingWithdrawal = await DB.MarketerWithdrawals?.findOne({
      where: { marketer_id: marketer.id, status: 'pending' }
    });
    if (pendingWithdrawal) {
      return res.status(400).json({ error: 'You have a pending withdrawal request' });
    }

    const withdrawal = await DB.MarketerWithdrawals.create({
      marketer_id: marketer.id,
      phone_number: cleanPhone,
      amount: amount,
      status: 'pending',
      source: 'commission',
    });

    return res.json({
      success: true,
      withdrawalId: withdrawal.id,
      message: 'Withdrawal request submitted. Please wait for admin approval.'
    });

  } catch (err) { return res.status(500).json({ error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
