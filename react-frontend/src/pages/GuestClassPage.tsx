import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useGuestStore } from "@/stores/useGuestStore";
import { useLessonSettingsStore } from "@/stores/useLessonSettingsStore";
import { guestService, type Lesson } from "@/services/guest";
import {
  BookOpen,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import useSelectionFlow from "@/hooks/useSelectionFlow";
import VideoPlayer from "@/components/VideoPlayer";
import LessonCard from "@/components/LessonCard";
import LessonPurchaseModal from "@/components/LessonPurchaseModal";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";

export default function GuestClassPage() {
  const {
    phone,
    isVerified,
    purchaseStatuses,
  } = useGuestStore();

  const { settings: lessonFees, fetchSettings } = useLessonSettingsStore();
  const selectionHandlers = useSelectionFlow({ fetchLevels: true });

  const [phoneInput, setPhoneInput] = useState(() => {
    const saved = localStorage.getItem("guest_phone");
    return saved && saved.length >= 12 ? saved : "";
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [purchaseLesson, setPurchaseLesson] = useState<Lesson | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleVerifyPhone = async () => {
    if (!phoneInput || phoneInput.length < 12) return;
    setIsVerifying(true);
    setRegisterError(null);
    try {
      const result = await useGuestStore.getState().verifyPhone(phoneInput);
      if (result) {
        localStorage.setItem("guest_phone", phoneInput);
        useGuestStore.getState().setPhone(phoneInput);
        useGuestStore.getState().setVerified(true);
        setShowPhoneModal(false);
        toast.success("Phone verified! You can now purchase lessons.");
        const lessonIds = selectionHandlers.lessons.map((l) => l.id);
        if (lessonIds.length > 0) {
          await useGuestStore.getState().checkAllPurchaseStatuses(phoneInput, lessonIds);
        }
      } else {
        setRegisterError("This phone is already registered. Please log in instead.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setRegisterError("Failed to verify phone");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = () => {
    useGuestStore.getState().clearAll();
    setPhoneInput("");
    localStorage.removeItem("guest_phone");
    void guestService.clearPaymentSession().catch((error) => {
      console.error("Failed to clear guest session:", error);
    });
  };

  const handleWatchLesson = (lesson: Lesson) => {
    if (!phone || !isVerified) {
      setShowPhoneModal(true);
      return;
    }
    const status = purchaseStatuses.get(lesson.id);
    if (!status?.purchased) {
      setPurchaseLesson(lesson);
      setShowPurchaseModal(true);
      return;
    }
    setSelectedLesson(lesson);
  };

  const handlePurchaseComplete = () => {
    setShowPurchaseModal(false);
    if (purchaseLesson) {
      setSelectedLesson(purchaseLesson);
      setPurchaseLesson(null);
    }
  };

  const handleCloseVideo = () => {
    setSelectedLesson(null);
  };

  const handleWatchTimeSync = useCallback(async (watchTimeSeconds: number) => {
    if (!phone || !selectedLesson) return;

    try {
      await guestService.updateWatchTime(phone, selectedLesson.id, watchTimeSeconds);
    } catch (error) {
      console.error("Failed to sync guest watch time:", error);
    }
  }, [phone, selectedLesson]);

  const getInitialMaxWatchTime = (lesson: Lesson): number => {
    if (phone && isVerified) {
      const status = purchaseStatuses.get(lesson.id);
      if (status?.max_watch_time) {
        return status.max_watch_time;
      }
    }
    return 0;
  };

  if (!lessonFees) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {selectedLesson && (
        <VideoPlayer
          lesson={selectedLesson}
          isSubscriber={false}
          phone={phone}
          initialMaxWatchTime={getInitialMaxWatchTime(selectedLesson)}
          onClose={handleCloseVideo}
          onWatchTimeSync={handleWatchTimeSync}
        />
      )}

      <LessonPurchaseModal
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        lesson={purchaseLesson}
        isSubscriber={false}
        phone={phone}
        userPhone={null}
        lessonFees={lessonFees}
        onPurchaseComplete={handlePurchaseComplete}
      />

      {!selectedLesson && (
        <>
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Go To Class</h1>
                  <p className="text-muted-foreground mt-1">
                    Access video lessons - pay per lesson
                  </p>
                </div>
                {phone && isVerified ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>{phone}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="grid gap-8">
                {!selectionHandlers.selectedLevel && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Select Your Level</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectionHandlers.levels.map((level) => (
                        <Button
                          key={level.id}
                          variant="outline"
                          className="h-24 flex-col gap-2"
                          onClick={() => selectionHandlers.handleLevelSelect(level)}
                        >
                          <BookOpen className="h-8 w-8" />
                          {level.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectionHandlers.selectedLevel && !selectionHandlers.selectedGrade && (
                  <div>
                    <Button variant="ghost" onClick={selectionHandlers.handleBackToLevels} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Levels
                    </Button>
                    <h2 className="text-xl font-semibold mb-4">Select Grade</h2>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {selectionHandlers.grades.map((grade) => (
                        <Button
                          key={grade.id}
                          variant="outline"
                          className="h-16"
                          onClick={() => selectionHandlers.handleGradeSelect(grade)}
                        >
                          {grade.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectionHandlers.selectedGrade && !selectionHandlers.selectedArea && (
                  <div>
                    <Button variant="ghost" onClick={selectionHandlers.handleBackToGrades} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Grades
                    </Button>
                    <h2 className="text-xl font-semibold mb-4">Select Subject</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectionHandlers.areas.map((area) => (
                        <Card
                          key={area.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => selectionHandlers.handleAreaSelect(area)}
                        >
                          <CardContent className="p-4 text-center">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="font-medium">{area.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectionHandlers.selectedArea && (
                  <div>
                    <Button variant="ghost" onClick={selectionHandlers.handleBackToAreas} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Subjects
                    </Button>
                    <h2 className="text-xl font-semibold mb-4">
                      {selectionHandlers.selectedArea?.name} - Lessons
                    </h2>

                    {selectionHandlers.isLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : selectionHandlers.lessons.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <p className="text-muted-foreground">No lessons available for this subject.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {selectionHandlers.lessons.map((lesson) => {
                          const status = purchaseStatuses.get(lesson.id);
                          const isPurchased = status?.purchased;
                          return (
                            <LessonCard
                              key={lesson.id}
                              lesson={lesson}
                              isSubscriber={false}
                              lessonBalance={0}
                              watchDuration={lessonFees.non_subscribed.duration}
                              price={lessonFees.non_subscribed.fee}
                              isPurchased={isPurchased}
                              onWatch={() => handleWatchLesson(lesson)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {!isVerified && (
            <section className="py-8 bg-muted/30">
              <div className="container mx-auto px-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Verify your phone to purchase and access lessons
                  </p>
                  <Button onClick={() => setShowPhoneModal(true)}>
                    Verify Phone Number
                  </Button>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <PhoneVerificationModal
        open={showPhoneModal}
        onOpenChange={setShowPhoneModal}
        phoneInput={phoneInput}
        onPhoneChange={setPhoneInput}
        isVerifying={isVerifying}
        onVerify={handleVerifyPhone}
        registerError={registerError}
      />
    </Layout>
  );
}