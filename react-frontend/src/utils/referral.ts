const REFERRAL_STORAGE_KEY = 'btc_referral_code';
const REFERRAL_URL_PARAM = 'ref';
const REFERRAL_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredReferral {
  code: string;
  capturedAt: number;
}

export function captureReferralFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get(REFERRAL_URL_PARAM);

  if (refCode) {
    const stored: StoredReferral = {
      code: refCode,
      capturedAt: Date.now(),
    };
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(stored));
      console.log('[Referral] Captured referral code from URL:', refCode);
    } catch {
      console.warn('[Referral] Failed to store referral code');
    }
  }

  return refCode;
}

export function setReferralCode(code: string): void {
  if (!code) {
    return;
  }
  const stored: StoredReferral = {
    code,
    capturedAt: Date.now(),
  };
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(stored));
    console.log('[Referral] Set referral code:', code);
  } catch {
    console.warn('[Referral] Failed to store referral code');
  }
}

export function getReferralCode(): string | null {
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;

    const stored: StoredReferral = JSON.parse(raw);
    const isExpired = Date.now() - stored.capturedAt > REFERRAL_EXPIRY_MS;

    if (isExpired) {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }

    return stored.code;
  } catch {
    return null;
  }
}

export function clearReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}
