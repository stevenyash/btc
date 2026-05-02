import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XCircle, Loader2, CheckCircle, User } from "lucide-react";

export interface PhoneVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneInput: string;
  onPhoneChange: (value: string) => void;
  isVerifying: boolean;
  onVerify: () => void;
  registerError: string | null;
}

export function PhoneVerificationModal({
  open,
  onOpenChange,
  phoneInput,
  onPhoneChange,
  isVerifying,
  onVerify,
  registerError,
}: PhoneVerificationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Verify Your Phone
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your phone number to access lessons. Verified guests can purchase lessons via M-Pesa.
          </p>
          <div className="space-y-2">
            <Label htmlFor="phone-modal">Phone Number</Label>
            <Input
              id="phone-modal"
              type="tel"
              placeholder="2547XX XXX XXX"
              value={phoneInput}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
          {registerError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <XCircle className="h-4 w-4" />
              {registerError}
            </div>
          )}
          <Button
            className="w-full"
            onClick={onVerify}
            disabled={phoneInput.length < 12 || isVerifying}
          >
            {isVerifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Verify Phone
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PhoneVerificationModal;