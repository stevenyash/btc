import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMpesaStore, type BusinessMetadata } from "@/stores/useMpesaStore";

 interface MpesaPaymentModuleProps {
   amount: number;
   accountReference: string;
   businessMetadata?: BusinessMetadata;
   defaultPhone?: string;
   readonlyPhone?: boolean;
   skipActivation?: boolean; // If true, callback handles activation - don't activate manually
   onSuccess: (transaction: {
     checkoutRequestID: string;
     transactionID?: string;
     amount: number;
     phoneNumber: string;
     businessMetadata?: BusinessMetadata;
   }) => void;
   onFailure: (error: string) => void;
 }

export function MpesaPaymentModule({
  amount,
  accountReference,
  businessMetadata,
  defaultPhone,
  readonlyPhone = false,
  skipActivation = false,
  onSuccess,
  onFailure,
}: MpesaPaymentModuleProps) {
  const paymentAmount = Number(amount) || 0
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone || "");
  
  const {
    status,
    checkoutId,
    error,
    transaction,
    pay,
    verify,
    reset,
    activate,
  } = useMpesaStore();

  useEffect(() => {
    if (status === "success" && transaction) {
      // Only activate manually if skipActivation is false (callback handles it automatically)
      if (!skipActivation) {
        activate(transaction.checkoutRequestID, transaction.businessMetadata);
      }
      onSuccess({
        checkoutRequestID: transaction.checkoutRequestID,
        transactionID: transaction.transactionID,
        amount: transaction.amount,
        phoneNumber: transaction.phoneNumber,
        businessMetadata: transaction.businessMetadata,
      });
    }
  }, [status, transaction, skipActivation, onSuccess]);

  useEffect(() => {
    if (status === "error" && error) {
      onFailure(error);
    }
  }, [status, error, onFailure]);

  const handlePay = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return;
    }

    const result = await pay(paymentAmount, phoneNumber, accountReference, businessMetadata);
    if (result.success && result.checkoutId) {
      verify(result.checkoutId);
    }
  };

  const handleRetry = () => {
    reset();
  };

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("254")) {
      return cleaned;
    }
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.substring(1);
    }
    return "254" + cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneNumber(formatted);
  };

   const displayPhone = phoneNumber || "";

   if (status === "idle" || status === "error") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            M-Pesa Payment
          </CardTitle>
          <CardDescription>
            Pay KSh {paymentAmount.toLocaleString()} via M-Pesa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "error" && error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

           <div className="space-y-2">
             <Label htmlFor="phone">Phone Number</Label>
             <Input
               id="phone"
               type="tel"
               placeholder="7XXXXXXXX or 254XXXXXXXXX"
               value={displayPhone}
               onChange={handlePhoneChange}
               readOnly={readonlyPhone}
             />
             <p className="text-xs text-muted-foreground">
               Enter your M-Pesa registered phone number
             </p>
           </div>

            <Button
              onClick={handlePay}
              disabled={!phoneNumber || phoneNumber.length < 9}
              className="w-full"
            >
              {`Pay KSh ${paymentAmount.toLocaleString()}`}
            </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Initiating Payment...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we send the payment prompt
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "pending") {
    const handleManualVerify = async () => {
      if (checkoutId) {
        verify(checkoutId);
      }
    };

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Payment Initiated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm text-yellow-800">
              Check your phone and enter your M-Pesa PIN to complete the payment
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Amount: <span className="font-bold">KSh {paymentAmount.toLocaleString()}</span>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Phone: <span className="font-bold">{displayPhone}</span>
          </p>

          <div className="flex gap-2">
            <Button onClick={handleManualVerify} variant="default" className="flex-1">
              Check Payment Status
            </Button>
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Waiting for M-Pesa prompt? Click "Check Payment Status" to verify
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "success" && transaction) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-lg font-medium">Payment Successful!</p>
          <p className="text-sm text-muted-foreground">
            Transaction ID: {transaction.transactionID || checkoutId}
          </p>
          <p className="text-sm text-green-600 mt-2">
            Subscription activated successfully
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Redirecting to dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}