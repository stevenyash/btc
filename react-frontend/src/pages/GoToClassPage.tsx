/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGuestStore } from "@/stores/useGuestStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useLessonSettingsStore } from "@/stores/useLessonSettingsStore";
import { type Lesson, guestService } from "@/services/guest";
import { subscriptionService } from "@/services/subscription";
import { api } from "@/services/api";
import { getPlaybackDeviceId } from "@/services/playbackDevice";
import {
  BookOpen,
  CheckCircle,
  CreditCard,
  Loader2,
  ArrowLeft,
  Play,
  UserPlus,
  Zap,
  AlertTriangle,
} from "lucide-react";

import useSelectionFlow from "@/hooks/useSelectionFlow";
import VideoPlayer from "@/components/VideoPlayer";
import { useRole } from "@/hooks/useRole";
import LessonPurchaseModal from "@/components/LessonPurchaseModal";
import PhoneVerificationCard from "@/components/PhoneVerificationCard";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";

export default function GoToClassPage() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
  } = useAuthStore();

  const {
    lessonBalance,
    lessonsViewed,
    totalLessons,
    remainingWatchTimeSeconds,
    hasActiveSubscription,
    fetchSubscriberDetails,
  } = useSubscriptionStore();

  const {
    phone,
    isVerified,
    purchaseStatuses,
  } = useGuestStore();
  const { isAdmin } = useRole();

  const { settings: lessonFees, fetchSettings } = useLessonSettingsStore();
  const selectionHandlers = useSelectionFlow({ fetchLevels: true });
  const isSubscriber = isAuthenticated && hasActiveSubscription;
  const isExhaustedSubscriber = isSubscriber &&
    (lessonBalance <= 0 || remainingWatchTimeSeconds <= 0);

  useEffect(() => {
    if (isExhaustedSubscriber && user?.phone && selectionHandlers.lessons.length > 0) {
      const lessonIds = selectionHandlers.lessons.map(l => l.id);
      useGuestStore.getState().checkAllPurchaseStatuses(user.phone, lessonIds);
    }
  }, [isExhaustedSubscriber, user?.phone, selectionHandlers.lessons]);

  const [phoneInput, setPhoneInput] = useState(() => {
    const saved = localStorage.getItem("guest_phone");
    return saved && saved.length >= 12 ? saved : "";
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAccessMode, setSelectedAccessMode] = useState<"admin" | "subscription" | "individual" | "guest" | "preview" | null>(null);
  const [purchaseLesson, setPurchaseLesson] = useState<Lesson | null>(null);
  const [purchaseAtSubscriberRate, setPurchaseAtSubscriberRate] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingLesson, setPendingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriberDetails();
    }
  }, [isAuthenticated, fetchSubscriberDetails]);

  const handleVerifyPhone = async () => {
    if (!phoneInput || phoneInput.length < 12) return;
    setIsVerifying(true);
    setRegisterError(null);
    try {
      const verified = await guestService.verifyPhone(phoneInput);
      if (!verified) {
        setRegisterError("This phone belongs to a registered user. Please sign in to continue.");
        return;
      }
      localStorage.setItem("guest_phone", phoneInput);
      useGuestStore.getState().setPhone(phoneInput);
      useGuestStore.getState().setVerified(true);

      const lessonIds = selectionHandlers.lessons.map((l) => l.id).filter(id => id);
      if (lessonIds.length > 0) {
        await useGuestStore.getState().checkAllPurchaseStatuses(phoneInput, lessonIds);
      }

      if (pendingLesson) {
        setShowPhoneModal(false);
        let status: Awaited<ReturnType<typeof guestService.checkPurchaseStatus>> | null = null;
        try {
          status = await guestService.checkPurchaseStatus(phoneInput, pendingLesson.id);
        } catch (error) {
          const responseStatus = isAxiosError(error) ? error.response?.status : undefined;
          if (responseStatus !== 401 && responseStatus !== 403) {
            throw error;
          }
        }
        if (!status?.purchased) {
          setPurchaseAtSubscriberRate(false);
          setPurchaseLesson(pendingLesson);
          setShowPurchaseModal(true);
        } else {
          setSelectedAccessMode("guest");
          setSelectedLesson(pendingLesson);
        }
        setPendingLesson(null);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setRegisterError(error.message || "Operation failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePhoneModalChange = (open: boolean) => {
    setShowPhoneModal(open);
    if (!open) {
      setPendingLesson(null);
    }
  };

  const handleRegisterGuest = async () => {
    if (!phoneInput || phoneInput.length < 12) return;
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const result = await guestService.registerGuest(phoneInput);
      if (result.success) {
        localStorage.setItem("guest_phone", phoneInput);
        useGuestStore.getState().setPhone(phoneInput);
        useGuestStore.getState().setVerified(true);
        toast.success("Account created! You can now purchase lessons.");
        const lessonIds = selectionHandlers.lessons.map((l) => l.id);
        if (lessonIds.length > 0) {
          await useGuestStore.getState().checkAllPurchaseStatuses(phoneInput, lessonIds);
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setRegisterError(error.message || "Registration failed");
    } finally {
      setIsRegistering(false);
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

  const handleWatchLesson = async (lesson: Lesson) => {
    if (isAuthenticated && isAdmin) {
      try {
        const response = await api.get(`/lessons/access/${lesson.id}`, {
          params: {
            check_only: "true",
            device_id: getPlaybackDeviceId(),
          },
        });
        setSelectedAccessMode(response.data.access_mode);
        setSelectedLesson(lesson);
      } catch (error: unknown) {
        const data = (error as { response?: { data?: { error?: string } } })?.response?.data;
        toast.error(data?.error || "Could not check lesson access. Please retry.");
      }
      return;
    }

    if (isSubscriber) {
      try {
        const response = await api.get(`/lessons/access/${lesson.id}`, {
          params: {
            check_only: "true",
            device_id: getPlaybackDeviceId(),
          },
        });
        setSelectedAccessMode(response.data.access_mode);
        setSelectedLesson(lesson);
      } catch (error: unknown) {
        const data = (error as { response?: { data?: { code?: string; error?: string } } })
          ?.response?.data;
        if (["DEVICE_LIMIT_REACHED", "LESSON_LIMIT_REACHED", "WATCH_TIME_EXHAUSTED", "INDIVIDUAL_PURCHASE_REQUIRED"].includes(data?.code || "")) {
          setPurchaseAtSubscriberRate(true);
          setPurchaseLesson(lesson);
          setShowPurchaseModal(true);
          return;
        }
        toast.error(data?.error || "Could not check lesson access. Please retry.");
      }
      return;
    }

    if (!phone || !isVerified) {
      setPendingLesson(lesson);
      setShowPhoneModal(true);
      return;
    }
    const status = purchaseStatuses.get(lesson.id);
    if (!status?.purchased) {
      setPurchaseAtSubscriberRate(false);
      setPurchaseLesson(lesson);
      setShowPurchaseModal(true);
      return;
    }
    setSelectedAccessMode("individual");
    setSelectedLesson(lesson);
  };

  const handlePurchaseComplete = () => {
    setShowPurchaseModal(false);
    if (purchaseLesson) {
      setSelectedAccessMode("individual");
      setSelectedLesson(purchaseLesson);
      setPurchaseLesson(null);
    }
  };

  const handleCloseVideo = () => {
    setSelectedLesson(null);
    setSelectedAccessMode(null);
  };

  const handleWatchTimeSync = useCallback(async (watchTimeSeconds: number) => {
    if (!isSubscriber || !selectedLesson) return;

    try {
      const result = await subscriptionService.updateLessonBalance({
        lessonId: selectedLesson.id,
        watchTimeSeconds,
        deviceId: getPlaybackDeviceId(),
      });

      if (result.success) {
        useSubscriptionStore.setState({
          lessonBalance: Math.max(0, result.total_lessons - result.lessons_used),
          lessonsViewed: result.lessons_used,
          remainingWatchTimeSeconds: result.remaining_watch_time_seconds,
        });

        if (result.exhausted) {
          toast.info("Your package watch-time allowance is exhausted. Buy this lesson or renew your subscription.");
          setSelectedLesson(null);
          setSelectedAccessMode(null);
        }
      }
    } catch (error: any) {
      console.error("Failed to sync watch time:", error);
      if (error.response?.data?.exhausted || error.response?.data?.code === "WATCH_TIME_EXHAUSTED") {
        toast.info("Your package watch-time allowance is exhausted. Buy this lesson or renew your subscription.");
        useSubscriptionStore.setState({ remainingWatchTimeSeconds: 0 });
        setSelectedLesson(null);
        setSelectedAccessMode(null);
      }
    }
  }, [isSubscriber, selectedLesson]);

  const handleGuestWatchTimeSync = useCallback(async (watchTimeSeconds: number) => {
    const guestPhone = user?.phone || phone;
    if (!guestPhone || !selectedLesson) return;

    try {
      await guestService.updateWatchTime(guestPhone, selectedLesson.id, watchTimeSeconds, getPlaybackDeviceId());
    } catch (error) {
      console.error("Failed to sync guest watch time:", error);
    }
  }, [user?.phone, phone, selectedLesson]);

  const getInitialMaxWatchTime = (lesson: Lesson): number => {
    if (selectedAccessMode === "subscription") {
      return remainingWatchTimeSeconds;
    }
    if (isSubscriber && selectedAccessMode === "individual") {
      return (lessonFees?.subscribed.duration || 90) * 60;
    }
    if (phone && isVerified) {
      const status = purchaseStatuses.get(lesson.id);
      if (status?.max_watch_time) {
        return status.max_watch_time;
      }
    }
    if (isSubscriber) {
      return remainingWatchTimeSeconds;
    }
    return 0;
  };

  const getRemainingWatchTime = (): number => {
    if (!isAuthenticated || !hasActiveSubscription) return 0;
    return remainingWatchTimeSeconds;
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
      {selectedLesson && (selectedAccessMode === "subscription" || selectedAccessMode === "admin") && (
        <VideoPlayer
          lesson={selectedLesson}
          isSubscriber={true}
          phone={undefined}
          userId={user?.id}
          initialMaxWatchTime={selectedAccessMode === "admin" ? 0 : getRemainingWatchTime()}
          lessonBalance={lessonBalance}
          onClose={handleCloseVideo}
          onWatchTimeSync={selectedAccessMode === "admin" ? undefined : handleWatchTimeSync}
          usesSubscriberDeviceSession={selectedAccessMode !== "admin"}
          unlimitedWatchTime={selectedAccessMode === "admin"}
        />
      )}

      {selectedLesson && selectedAccessMode !== "subscription" && selectedAccessMode !== "admin" && (
        <VideoPlayer
          lesson={selectedLesson}
          isSubscriber={false}
          phone={user?.phone || phone}
          initialMaxWatchTime={getInitialMaxWatchTime(selectedLesson)}
          onClose={handleCloseVideo}
          onWatchTimeSync={handleGuestWatchTimeSync}
        />
      )}

      <LessonPurchaseModal
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        lesson={purchaseLesson}
        isSubscriber={false}
        phone={phone}
        userPhone={user?.phone || null}
        lessonFees={lessonFees}
        onPurchaseComplete={handlePurchaseComplete}
        isExhausted={purchaseAtSubscriberRate}
      />

      <PhoneVerificationModal
        open={showPhoneModal}
        onOpenChange={handlePhoneModalChange}
        phoneInput={phoneInput}
        onPhoneChange={setPhoneInput}
        isVerifying={isVerifying}
        onVerify={handleVerifyPhone}
        registerError={registerError}
      />

      {!selectedLesson && (
        <>
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-8 md:py-12">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Go To Class</h1>
                  {isExhaustedSubscriber ? (
                    <p className="text-orange-600 mt-1 text-sm md:text-base font-medium">
                      A package allowance is exhausted. You can still resume eligible lessons or buy another lesson.
                    </p>
                  ) : isSubscriber ? (
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                      Welcome {user?.username || "Student"}! {lessonBalance} lesson slots and {Math.ceil(remainingWatchTimeSeconds / 60)} viewing minutes remain.
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                      Access video lessons - pay per lesson
                    </p>
                  )}
                </div>
                {isSubscriber && !isExhaustedSubscriber && (
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3">
                      <div className="flex items-center gap-1.5 md:gap-2 text-green-700">
                        <Zap className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="font-semibold text-sm md:text-base">{lessonBalance} lesson slots</span>
                      </div>
                      <p className="text-xs text-green-600 mt-0.5 md:mt-1">
                        {lessonsViewed}/{totalLessons} lessons used · {Math.ceil(remainingWatchTimeSeconds / 60)} min left
                      </p>
                    </div>
                  </div>
                )}
                {!isSubscriber && phone && isVerified && (
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1.5 md:gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm">{phone}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs md:text-sm">
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {isExhaustedSubscriber && (
            <section className="py-4 md:py-6 bg-orange-50 border-b border-orange-200">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        A package limit has been reached. You can buy an individual lesson at the subscriber rate (KES {lessonFees.subscribed.fee}) or renew your subscription.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => navigate("/subscriptions")}>
                      Renew Subscription
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="py-6 md:py-8">
            <div className="container mx-auto px-4">
              <div className="grid gap-6 md:gap-8">
                {!selectionHandlers.selectedLevel && (
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Select Your Level</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                      {selectionHandlers.levels.map((level) => (
                        <Button
                          key={level.id}
                          variant="outline"
                          className="h-20 md:h-24 flex-col gap-2 text-sm"
                          onClick={() => selectionHandlers.handleLevelSelect(level)}
                        >
                          <BookOpen className="h-6 w-6 md:h-8 md:w-8" />
                          {level.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectionHandlers.selectedLevel && !selectionHandlers.selectedGrade && (
                  <div>
                    <Button variant="ghost" onClick={selectionHandlers.handleBackToLevels} className="mb-3 md:mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Levels
                    </Button>
                    <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Select Grade</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                      {selectionHandlers.grades.map((grade) => (
                        <Button
                          key={grade.id}
                          variant="outline"
                          className="h-14 md:h-16 text-sm"
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
                    <Button variant="ghost" onClick={selectionHandlers.handleBackToGrades} className="mb-3 md:mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Grades
                    </Button>
                    <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Select Subject</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                      {selectionHandlers.areas.map((area) => (
                        <Card
                          key={area.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => selectionHandlers.handleAreaSelect(area)}
                        >
                          <CardContent className="p-3 md:p-4 text-center">
                            <BookOpen className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-1.5 md:mb-2 text-primary" />
                            <p className="font-medium text-sm md:text-base">{area.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectionHandlers.selectedArea && (
                  <div>
                    <Button variant="ghost" onClick={selectionHandlers.handleBackToAreas} className="mb-3 md:mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Subjects
                    </Button>
                    <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                      {selectionHandlers.selectedArea?.name} - Lessons
                    </h2>

                    {selectionHandlers.isLoading ? (
                      <div className="flex justify-center py-10 md:py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : selectionHandlers.lessons.length === 0 ? (
                      <Card>
                        <CardContent className="py-10 md:py-12 text-center">
                          <p className="text-muted-foreground">No lessons available for this subject.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-0">
                          {/* Mobile: Card Layout */}
                          <div className="block md:hidden divide-y">
                            {selectionHandlers.lessons.map((lesson) => {
                              const status = purchaseStatuses.get(lesson.id);
                              const isPurchased = status?.purchased;
                              const price = isExhaustedSubscriber
                                ? lessonFees.subscribed.fee
                                : isSubscriber
                                  ? lessonFees.subscribed.fee
                                  : lessonFees.non_subscribed.fee;

                              return (
                                <div key={lesson.id} className="p-3 md:p-4 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-sm md:text-base pr-2">{lesson.title}</h3>
                                    {isSubscriber ? (
                                      <span className="text-xs md:text-sm font-medium text-green-600 shrink-0">
                                        {isExhaustedSubscriber && !isPurchased ? `KES ${price} if purchased` : "Included; subscriber rate if package limits are reached"}
                                      </span>
                                    ) : (
                                      <span className="text-xs md:text-sm font-medium shrink-0">KES {price}</span>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs md:text-sm text-muted-foreground">
                                      {isSubscriber ? "Shared package time" : `${lessonFees.non_subscribed.duration} min`}
                                    </span>
                                    {isSubscriber ? (
                                      <Button
                                        size="sm"
                                        onClick={() => handleWatchLesson(lesson)}
                                        className="text-xs"
                                      >
                                        <Play className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                                        Watch
                                      </Button>
                                    ) : isPurchased ? (
                                      <Button size="sm" onClick={() => handleWatchLesson(lesson)} className="text-xs">
                                        <Play className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                                        Watch
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleWatchLesson(lesson)}
                                        className="text-xs"
                                      >
                                        <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                                        Buy
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop/Tablet: Table Layout */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b bg-muted/30">
                                  <th className="text-left py-3 px-4 font-medium">Lesson</th>
                                  <th className="text-center py-3 px-4 font-medium">Watch Time</th>
                                  <th className="text-center py-3 px-4 font-medium">Price</th>
                                  <th className="text-right py-3 px-4 font-medium">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectionHandlers.lessons.map((lesson) => {
                                  const status = purchaseStatuses.get(lesson.id);
                                  const isPurchased = status?.purchased;
                                  const price = isExhaustedSubscriber
                                    ? lessonFees.subscribed.fee
                                    : isSubscriber
                                      ? lessonFees.subscribed.fee
                                      : lessonFees.non_subscribed.fee;

                                  return (
                                    <tr key={lesson.id} className="border-b hover:bg-muted/50 transition-colors">
                                      <td className="py-3 px-4 font-medium">{lesson.title}</td>
                                      <td className="py-3 px-4 text-center text-sm">
                                        {isSubscriber ? "Shared package time" : `${lessonFees.non_subscribed.duration} min`}
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        {isSubscriber ? (
                                          <span className="text-sm font-medium text-green-600">
                                            {isExhaustedSubscriber && !isPurchased ? `KES ${price} if purchased` : "Included; subscriber rate if package limits are reached"}
                                          </span>
                                        ) : (
                                          <span className="text-sm font-medium">KES {price}</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        {isSubscriber ? (
                                          <Button
                                            size="sm"
                                            onClick={() => handleWatchLesson(lesson)}
                                          >
                                            <Play className="h-4 w-4 mr-1" />
                                            Watch
                                          </Button>
                                        ) : isPurchased ? (
                                          <Button size="sm" onClick={() => handleWatchLesson(lesson)}>
                                            <Play className="h-4 w-4 mr-1" />
                                            Watch
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleWatchLesson(lesson)}
                                          >
                                            <CreditCard className="h-4 w-4 mr-1" />
                                            Buy
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {!isSubscriber && !isVerified && (
            <section className="py-6 md:py-8 bg-muted/30">
              <div className="container mx-auto px-4">
                <PhoneVerificationCard
                  phoneInput={phoneInput}
                  onPhoneChange={setPhoneInput}
                  isVerifying={isVerifying}
                  onVerify={handleVerifyPhone}
                />
                <div className="mt-4">
                  {registerError && (
                    <p className="text-red-500 text-sm mb-2">{registerError}</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleRegisterGuest}
                    disabled={isRegistering || !phoneInput || phoneInput.length < 12}
                    className="w-full"
                  >
                    {isRegistering ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register New Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </Layout>
  );
}