import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MpesaPaymentModule } from "@/components/MpesaPaymentModule";
import { useGuestStore } from "@/stores/useGuestStore";
import { useMpesaStore, type BusinessMetadata } from "@/stores/useMpesaStore";
import { guestService, type Lesson } from "@/services/guest";
import { getReferralCode } from "@/utils/referral";

export interface LessonPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  isSubscriber: boolean;
  phone: string | null;
  userPhone?: string | null;
  lessonFees: {
    subscribed: { fee: number; duration: number };
    non_subscribed: { fee: number; duration: number };
  };
  onPurchaseComplete: () => void;
  isExhausted?: boolean;
}

export function LessonPurchaseModal({
  open,
  onClose,
  lesson,
  isSubscriber,
  phone,
  userPhone,
  lessonFees,
  onPurchaseComplete,
  isExhausted = false,
}: LessonPurchaseModalProps) {
  const { reset: resetMpesa } = useMpesaStore();

  if (!open || !lesson) return null;

  const amount = isExhausted
    ? lessonFees.subscribed.fee
    : isSubscriber
      ? lessonFees.subscribed.fee
      : lessonFees.non_subscribed.fee;
  const purchaseDuration = isExhausted || isSubscriber
    ? lessonFees.subscribed.duration
    : lessonFees.non_subscribed.duration;
  const accountReference = `lesson_${lesson.id}_${isExhausted ? "exhausted" : isSubscriber ? "subscriber" : "guest"}`;
  const defaultPhone = isExhausted
    ? userPhone || phone || ""
    : isSubscriber
      ? userPhone || ""
      : phone || "";
  const businessMetadata = {
    activationType: isSubscriber ? "subscribelessonactivation" : "guestlessonactivation",
    lessonId: lesson.id,
    lessonFees: amount,
    ...(!isSubscriber && { referralCode: getReferralCode() || undefined }),
    ...((isExhausted || !isSubscriber) && {
      duration: isExhausted ? lessonFees.subscribed.duration : lessonFees.non_subscribed.duration,
    }),
  };

  const handlePaymentSuccess = async (transaction: {
    checkoutRequestID: string;
    transactionID?: string;
    amount: number;
    phoneNumber: string;
    businessMetadata?: BusinessMetadata;
    guestSessionKey?: string;
  }) => {
    if (transaction.businessMetadata?.activationType === "guestlessonactivation") {
      if (!transaction.phoneNumber) {
        throw new Error("Payment confirmed, but the payment phone number is unavailable. Contact support before paying again.");
      }

      const session = await guestService.activatePaymentSession(
        transaction.checkoutRequestID,
        transaction.guestSessionKey,
        transaction.phoneNumber
      );
      const statuses = await guestService.getAllPurchaseStatuses(session.phone, [lesson.id]);
      const status = statuses.find((item) => item.lesson_id === lesson.id);
      if (!status?.purchased) {
        throw new Error("Payment confirmed, but lesson access is still being prepared. Retry in a moment.");
      }

      const purchaseStatuses = new Map(useGuestStore.getState().purchaseStatuses);
      purchaseStatuses.set(lesson.id, status);
      useGuestStore.setState({ purchaseStatuses });
    }

    resetMpesa();
    onPurchaseComplete();
  };

  const handlePaymentFailure = (error: string) => {
    console.error("Payment failed:", error);
    toast.error(error || "Payment failed");
  };

  const handleClose = () => {
    resetMpesa();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isExhausted ? "Buy Lesson (Subscriber Rate)" : isSubscriber ? "Add More Lessons" : "Purchase Lesson"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{lesson.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm"><strong>Lesson:</strong> {lesson.title}</p>
            <p className="text-sm"><strong>Watch Time:</strong> {purchaseDuration} minutes</p>
            {isExhausted && (
              <p className="text-sm text-orange-600"><strong>Note:</strong> This lesson will have its own watch-time allowance and will not use package balances.</p>
            )}
          </div>

          {isExhausted ? (
            <div className="bg-orange-50 p-3 rounded text-sm text-orange-800">
              <p className="font-semibold">Subscriber Rate</p>
              <p className="text-2xl font-bold">KES {lessonFees.subscribed.fee}</p>
              <p className="text-xs">{purchaseDuration} min watch time</p>
            </div>
          ) : isSubscriber ? (
            <>
              <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                <p className="font-semibold">Subscriber Rate</p>
                <p className="text-2xl font-bold">KES {lessonFees.subscribed.fee}</p>
                <p className="text-xs">per credit ({lessonFees.subscribed.duration} min watch time)</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Or upgrade your subscription for unlimited access:</p>
                <Button variant="outline" className="w-full" onClick={handleClose}>
                  Upgrade to Unlimited
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
              <p><strong>Price:</strong> KES {lessonFees.non_subscribed.fee}</p>
              <p className="text-xs mt-1">You get {lessonFees.non_subscribed.duration} minutes of watch time that can be paused and resumed.</p>
            </div>
          )}

          <MpesaPaymentModule
            amount={amount}
            accountReference={accountReference}
            defaultPhone={defaultPhone}
            businessMetadata={businessMetadata}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default LessonPurchaseModal;
