import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

export function validateKenyanPhone(phone: string): PhoneValidationResult {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove all spaces and special characters
  const cleaned = phone.replace(/[\s\-+()]/g, "");

  // Check for valid patterns
  // - 07XXXXXXXX (10 digits starting with 7)
  // - 254XXXXXXXXX (12 digits starting with 254)
  // - 7XXXXXXXX (9 digits starting with 7)
  const pattern7 = /^7\d{8}$/;
  const pattern254 = /^2547\d{8}$/;
  const pattern07 = /^07\d{8}$/;

  if (!pattern7.test(cleaned) && !pattern254.test(cleaned) && !pattern07.test(cleaned)) {
    return { isValid: false, error: "Please enter a valid Kenyan phone number" };
  }

  return { isValid: true };
}

export function formatKenyanPhone(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle different formats
  if (digits.startsWith("254") && digits.length === 12) {
    // Already in 254XXXXXXXXX format
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    // 07XXXXXXXX format - convert to 254XXXXXXXXX
    return "254" + digits.substring(1);
  }

  if (digits.length === 9 && digits.startsWith("7")) {
    // 7XXXXXXXX format - convert to 254XXXXXXXXX
    return "254" + digits;
  }

  // Return as-is if we can't determine format
  return digits;
}