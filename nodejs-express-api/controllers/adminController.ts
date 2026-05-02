import { Router, Request, Response } from 'express';
import DB from '../models/db.js';
import bunnyService from '../services/bunnyService.js';
import fs from 'fs';
import mailer from '../helpers/mailer.js';

const router = Router();

// Get admin stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      pendingPayments
    ] = await Promise.all([
      DB.Users.count(),
      DB.Users.count({ where: { account_status: 'active' } }),
      DB.Subscriptions.count(),
      DB.Subscriptions.count({ where: { status: 'active' } }),
      DB.Transactions.sum('amount', { where: { status: 'success' } }) || 0,
      DB.Transactions.count({ where: { status: 'pending' } })
    ]);

    return res.json({
      total_users: totalUsers,
      active_users: activeUsers,
      total_subscriptions: totalSubscriptions,
      active_subscriptions: activeSubscriptions,
      total_revenue: totalRevenue,
      pending_payments: pendingPayments,
      monthly_growth: 0
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get recent users
router.get('/recent-users', async (req: Request, res: Response) => {
  try {
     const users = await DB.Users.findAll({
       order: [['id', 'DESC']],
       limit: 5,
       raw: true
     });

    const recentUsers = users.map((u: any) => ({
      id: u.id,
      name: u.username || u.first_name || 'Unknown',
      email: u.email || '',
      status: u.account_status || 'active',
      created_at: u.created_at
    }));

    return res.json(recentUsers);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get recent transactions
router.get('/recent-transactions', async (req: Request, res: Response) => {
  try {
    const transactions = await DB.Transactions.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email'] }
      ]
    });

    const recentTransactions = transactions.map((t: any) => ({
      id: t.id,
      user: t.user?.username || 'Unknown',
      type: t.transaction_type || 'payment',
      amount: parseFloat(t.amount) || 0,
      status: t.status || 'pending',
      created_at: t.created_at
    }));

    return res.json(recentTransactions);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get subscription types
router.get('/subscription-types', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await DB.SubscriptionTypes.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      raw: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/subscription-types/:id', async (req: Request, res: Response) => {
  try {
    const subscriptionType = await DB.SubscriptionTypes.findByPk(req.params.id, { raw: true });
    if (!subscriptionType) {
      return res.status(404).json({ error: 'Subscription type not found' });
    }
    return res.json(subscriptionType);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/subscription-types', async (req: Request, res: Response) => {
  try {
    const record = await DB.SubscriptionTypes.create(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/subscription-types/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.SubscriptionTypes.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Subscription type not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/subscription-types/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.SubscriptionTypes.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Subscription type not found' });
    }
    await record.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const where: any = {};
    if (role) where.user_role_id = role;
    if (status) where.account_status = status;

     const { count, rows } = await DB.Users.findAndCountAll({
       where,
       limit,
       offset,
       order: [['id', 'DESC']],
      include: [
        { model: DB.Roles, as: 'roles', attributes: ['role_name'] }
      ],
      raw: true,
      nest: true
    });

    const users = rows.map((u: any) => ({
      id: u.id,
      name: u.username || u.first_name || 'Unknown',
      email: u.email || '',
      phone: u.phone || '',
      role: u.roles?.role_name || 'user',
      role_id: u.user_role_id,
      status: u.account_status || 'active',
      subscription_code: u.subscription_code || '',
      created_at: u.created_at
    }));

    return res.json({
      users,
      pagination: { total: count }
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await DB.Users.findByPk(req.params.id, {
      include: [{ model: DB.Roles, as: 'roles' }],
      raw: true,
      nest: true
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await DB.Users.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.update(req.body);
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await DB.Users.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await DB.Transactions.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email'] }
      ],
      raw: true,
      nest: true
    });

    const transactions = rows.map((t: any) => ({
      id: t.id,
      user: t.user?.username || 'Unknown',
      type: t.transaction_type || 'payment',
      amount: t.amount || 0,
      status: t.status || 'pending',
      created_at: t.created_at
    }));

    return res.json({
      data: transactions,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await DB.Transactions.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    await transaction.update(req.body);
    return res.json(transaction);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await DB.Transactions.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    await transaction.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get marketers
router.get('/marketers', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

     const { count, rows } = await DB.Marketers.findAndCountAll({
       limit,
       offset,
       order: [['join_date', 'DESC']],
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email', 'phone'] }
      ],
      raw: true,
      nest: true
    });

     const marketers = rows.map((m: any) => ({
       id: m.id,
       user_id: m.user_id,
       user_name: m.user?.username || 'Unknown',
       email: m.user?.email || '',
       phone: m.user?.phone || '',
       referral_code: m.referral_code || '',
       total_invites: m.total_invites || 0,
       active_referrals: m.active_referrals || 0,
       total_earnings: m.total_earnings || 0,
       pending_earnings: m.pending_earnings || 0,
       status: m.status || 'active',
       created_at: m.join_date || null
     }));

    return res.json({
      data: marketers,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/marketers', async (req: Request, res: Response) => {
  try {
    const record = await DB.Marketers.create(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketers/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.Marketers.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Marketer not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/marketers/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.Marketers.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Marketer not found' });
    }
    await record.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get available users for marketer
router.get('/users-available-for-marketer', async (req: Request, res: Response) => {
  try {
    const users = await DB.Users.findAll({
      where: {
        id: {
          [DB.op.notIn]: DB.raw('(SELECT user_id FROM marketers WHERE user_id IS NOT NULL)')
        }
      },
      attributes: ['id', 'username', 'email'],
      raw: true
    });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Marketer commissions
router.get('/marketer-commissions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const { count, rows } = await DB.MarketerCommissions.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Marketers, as: 'marketer' },
        { model: DB.Users, as: 'user' },
        { model: DB.Transactions, as: 'transaction' }
      ],
      raw: true,
      nest: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketer-commissions/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.MarketerCommissions.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Commission not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Marketer withdrawals
router.get('/marketer-withdrawals', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const { count, rows } = await DB.MarketerWithdrawals.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Marketers, as: 'marketer' }
      ],
      raw: true,
      nest: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketer-withdrawals/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.MarketerWithdrawals.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Marketer redemptions
router.get('/marketer-redemptions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const { count, rows } = await DB.MarketerPointRedemptions.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: DB.Marketers, as: 'marketer' }
      ],
      raw: true,
      nest: true
    });

    return res.json({
      data: rows,
      total: count
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/marketer-redemptions/:id', async (req: Request, res: Response) => {
  try {
    const record = await DB.MarketerPointRedemptions.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Redemption not found' });
    }
    await record.update(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Resend marketer credentials
router.post('/marketers/:id/resend-credentials', async (req: Request, res: Response) => {
  try {
    const marketerId = req.params.id;
    const marketer = await DB.Marketers.findByPk(marketerId, {
      include: [
        { model: DB.Users, as: 'user', attributes: ['username', 'email', 'phone'] }
      ]
    });

    if (!marketer) {
      return res.status(404).json({ error: 'Marketer not found' });
    }

    if (!marketer.user) {
      return res.status(400).json({ error: 'Marketer has no associated user' });
    }

    const emailSubject = "Your BTC Marketer Account Credentials";
    const emailBody = `
      <h2>Welcome to BTC Marketer Program!</h2>
      <p>Hello ${marketer.user.username},</p>
      <p>Your marketer account has been activated. Here are your login details:</p>
      <ul>
        <li><strong>Email:</strong> ${marketer.user.email}</li>
        <li><strong>Phone:</strong> ${marketer.user.phone || 'Not provided'}</li>
        <li><strong>Referral Code:</strong> ${marketer.referral_code || 'Not generated yet'}</li>
      </ul>
      <p>You can use your email or phone to log in to the marketer portal.</p>
      <p>Best regards,<br/>BTC Team</p>
    `;

    await mailer.sendMail(marketer.user.email, emailSubject, emailBody);

    return res.json({ success: true, message: 'Credentials resent successfully' });
  } catch (err) {
    console.error('Error resending marketer credentials:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
