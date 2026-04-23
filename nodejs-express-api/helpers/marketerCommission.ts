import DB from '../models/db.js';

interface Transaction {
  id: number;
  amount: number;
}

interface User {
  id: number;
  referred_by: string | null;
}

interface Marketer {
  id: number;
  referral_code: string;
  commission_rate: string | null;
  total_earnings?: number;
  pending_earnings?: number;
}

interface SystemSetting {
  setting_key: string;
  setting_value: string;
}

interface MarketerCommission {
  marketer_id: number;
  user_id: number;
  transaction_id: number;
  purchase_type: string;
  purchase_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
}

async function awardCommission(transaction: Transaction, userId: number, purchaseType: string): Promise<{ marketer_id: number; commission_amount: number } | null> {
  try {
    const user = await DB.Users.findOne({ where: { id: userId } }) as User | null;
    if (!user || !user.referred_by || user.referred_by === 'NULL') return;

    const marketer = await DB.Marketers.findOne({ where: { referral_code: user.referred_by } }) as Marketer | null;
    if (!marketer) return;

    let commissionRate = parseFloat(marketer.commission_rate || '0');
    if (!commissionRate || commissionRate <= 0) {
      const setting = await DB.SystemSettings.findOne({ where: { setting_key: 'default_commission_rate' } }) as SystemSetting | null;
      commissionRate = parseFloat(setting?.setting_value || '0.10');
    }

    const purchaseAmount = parseFloat(String(transaction.amount));
    const commissionAmount = Math.round(purchaseAmount * commissionRate * 100) / 100;

    await DB.MarketerCommissions.create({
      marketer_id: marketer.id,
      user_id: userId,
      transaction_id: transaction.id,
      purchase_type: purchaseType,
      purchase_amount: purchaseAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      status: 'approved'
    } as MarketerCommission);

    await DB.Marketers.increment(
      { total_earnings: commissionAmount, pending_earnings: commissionAmount },
      { where: { id: marketer.id } }
    );

    console.log(`[Commission] Awarded ${commissionAmount} to marketer ${marketer.id} for ${purchaseType}`);
    return { marketer_id: marketer.id, commission_amount: commissionAmount };
  } catch (err) {
    console.error('[Commission Error]', (err as Error).message);
    return null;
  }
}

export { awardCommission };