import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MpesaPaymentModule } from "@/components/MpesaPaymentModule";
import { useGuestStore } from "@/stores/useGuestStore";
import { useMpesaStore } from "@/stores/useMpesaStore";
import { guestService, type Lesson } from "@/services/guest";

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
}: LessonPurchaseModalProps) {
  const { checkAllPurchaseStatuses, lessons } = useGuestStore();
  const { reset: resetMpesa } = useMpesaStore();

  if (!open || !lesson) return null;

  const amount = isSubscriber ? lessonFees.subscribed.fee : lessonFees.non_subscribed.fee;
  const accountReference = `lesson_${lesson.id}_${isSubscriber ? "subscriber" : "guest"}`;
  const defaultPhone = isSubscriber ? (userPhone || "") : (phone || "");
  const businessMetadata = {
    activationType: isSubscriber ? "subscribelessonactivation" : "guestlessonactivation",
    lessonId: lesson.id,
    lessonFees: amount,
  };

  const handlePaymentSuccess = async (transaction: {
    checkoutRequestID: string;
    transactionID?: string;
    amount: number;
    phoneNumber: string;
  }) => {
    if (!phone) return;

    try {
      await guestService.purchaseLesson(phone, lesson.id, {
        amount: transaction.amount,
        checkoutRequestID: transaction.checkoutRequestID,
        transactionID: transaction.transactionID,
      });

      // Save to localStorage for offline/fast access (guest only)
      if (!isSubscriber) {
        const expiresAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
        const payments = JSON.parse(localStorage.getItem("guest_lesson_payments") || "{}");
        payments[`${phone}_${lesson.id}`] = {
          phone,
          lessonId: lesson.id,
          checkoutRequestId: transaction.checkoutRequestID,
          transactionStatus: "completed",
          paidAt: new Date().toISOString(),
          expiresAt,
          watchTime: 0,
        };
        localStorage.setItem("guest_lesson_payments", JSON.stringify(payments));
      }

      resetMpesa();
      onPurchaseComplete();

      // Refresh purchase statuses
      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length > 0) {
        await checkAllPurchaseStatuses(phone, lessonIds);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to complete purchase");
    }
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
            <CardTitle>{isSubscriber ? "Add More Lessons" : "Purchase Lesson"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{lesson.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm"><strong>Lesson:</strong> {lesson.title}</p>
            <p className="text-sm"><strong>Watch Time:</strong> {lessonFees.non_subscribed.duration} minutes</p>
            {isSubscriber && (
              <p className="text-sm"><strong>Credits:</strong> {lessonFees.subscribed.duration} min per credit</p>
            )}
          </div>

          {isSubscriber ? (
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
