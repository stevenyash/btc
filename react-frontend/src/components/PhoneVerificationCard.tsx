import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, CheckCircle } from "lucide-react";

export interface PhoneVerificationCardProps {
  phoneInput: string;
  onPhoneChange: (value: string) => void;
  isVerifying: boolean;
  onVerify: () => void;
}

export function PhoneVerificationCard({
  phoneInput,
  onPhoneChange,
  isVerifying,
  onVerify,
}: PhoneVerificationCardProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Verify Your Phone
        </CardTitle>
        <CardDescription>
          Enter your phone to access purchased lessons or make payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-verify">Phone Number</Label>
            <Input
              id="phone-verify"
              type="tel"
              placeholder="2547XX XXX XXX"
              value={phoneInput}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
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
      </CardContent>
    </Card>
  );
}

export default PhoneVerificationCard;
