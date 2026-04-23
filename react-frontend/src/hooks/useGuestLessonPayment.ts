import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'guest_lesson_payments';

export interface GuestLessonPayment {
  phone: string;
  lessonId: number;
  checkoutRequestId: string;
  transactionStatus: 'pending' | 'completed' | 'failed';
  paidAt: string;
  expiresAt: string;
  watchTime: number;
}

function getStorageKey(phone: string, lessonId: number): string {
  return `${phone}_${lessonId}`;
}

function getAllPayments(): Record<string, GuestLessonPayment> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePayment(payment: GuestLessonPayment): void {
  const all = getAllPayments();
  all[getStorageKey(payment.phone, payment.lessonId)] = payment;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function useGuestLessonPayment(phone: string | null, lessonId: number | null) {
  const [isPaid, setIsPaid] = useState(false);
  const [payment, setPayment] = useState<GuestLessonPayment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkPayment = useCallback(() => {
    if (!phone || !lessonId) {
      setIsPaid(false);
      setPayment(null);
      return;
    }

    const all = getAllPayments();
    const key = getStorageKey(phone, lessonId);
    const stored = all[key];

    if (stored) {
      const expiresAt = new Date(stored.expiresAt);
      const now = new Date();

      if (stored.transactionStatus === 'completed' && expiresAt > now) {
        setIsPaid(true);
        setPayment(stored);
      } else if (expiresAt <= now) {
        delete all[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        setIsPaid(false);
        setPayment(null);
      } else {
        setIsPaid(false);
        setPayment(null);
      }
    } else {
      setIsPaid(false);
      setPayment(null);
    }
  }, [phone, lessonId]);

  useEffect(() => {
    checkPayment();
  }, [checkPayment]);

  const savePaymentRecord = useCallback((data: {
    phone: string;
    lessonId: number;
    checkoutRequestId: string;
    transactionStatus: 'pending' | 'completed' | 'failed';
    paidAt?: string;
    expiresAt: string;
    watchTime?: number;
  }) => {
    const payment: GuestLessonPayment = {
      phone: data.phone,
      lessonId: data.lessonId,
      checkoutRequestId: data.checkoutRequestId,
      transactionStatus: data.transactionStatus,
      paidAt: data.paidAt || new Date().toISOString(),
      expiresAt: data.expiresAt,
      watchTime: data.watchTime || 0
    };
    savePayment(payment);
    setPayment(payment);
    setIsPaid(data.transactionStatus === 'completed');
  }, []);

  const updateWatchTime = useCallback((newWatchTime: number) => {
    if (payment) {
      const updated = { ...payment, watchTime: newWatchTime };
      savePayment(updated);
      setPayment(updated);
    }
  }, [payment]);

  const clearPayment = useCallback(() => {
    if (phone && lessonId) {
      const all = getAllPayments();
      delete all[getStorageKey(phone, lessonId)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setIsPaid(false);
      setPayment(null);
    }
  }, [phone, lessonId]);

  const isExpired = useCallback(() => {
    if (!payment) return true;
    return new Date(payment.expiresAt) <= new Date();
  }, [payment]);

  return {
    isPaid,
    payment,
    isLoading,
    isExpired: isExpired(),
    canResume: isPaid && !isExpired(),
    checkPayment,
    savePaymentRecord,
    updateWatchTime,
    clearPayment
  };
}

export default useGuestLessonPayment;
