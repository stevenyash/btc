import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import { useLessonSettingsStore } from "@/stores/useLessonSettingsStore";
import { type Lesson } from "@/services/guest";
import {
  BookOpen,
  Loader2,
  ArrowLeft,
  Zap,
} from "lucide-react";

import useSelectionFlow from "@/hooks/useSelectionFlow";
import VideoPlayer from "@/components/VideoPlayer";
import LessonCard from "@/components/LessonCard";

export default function SubscriberClassPage() {
  // Auth & Subscription
  const { user, isAuthenticated } = useAuthStore();
  const {
    lessonBalance,
    lessonsViewed,
    totalLessons,
    hasActiveSubscription,
    fetchSubscriberDetails,
  } = useSubscriptionStore();

  // Selection flow hook - manages level/grade/area and cascading data
  const selectionHandlers = useSelectionFlow({ fetchLevels: true });

  // Lesson settings store - fee and duration for guest/subscriber
  const { settings: lessonFees, fetchSettings } = useLessonSettingsStore();

  // UI local state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Load lesson settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Fetch subscriber details if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriberDetails();
    }
  }, [isAuthenticated, fetchSubscriberDetails]);

  // Show loading while lesson settings are being fetched
  if (!lessonFees) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  // Watch lesson button handler
  const handleWatchLesson = (lesson: Lesson) => {
    if (!hasActiveSubscription) {
      toast.error("You need an active subscription to watch lessons.");
      return;
    }
    setSelectedLesson(lesson);
  };

  // Close video player
  const handleCloseVideo = () => {
    setSelectedLesson(null);
  };

  // Compute remaining watch time for subscribers (based on lesson balance)
  const getRemainingWatchTime = (): number => {
    if (!hasActiveSubscription) return 0;
    // Subscribers have lessonBalance * duration in seconds
    return lessonBalance * lessonFees.subscribed.duration * 60;
  };

  const isSubscriber = isAuthenticated && hasActiveSubscription;

  return (
    <Layout>
      {/* Video Player Full-screen overlay */}
      {selectedLesson && (
        <VideoPlayer
          lesson={selectedLesson}
          isSubscriber={true}
          phone={undefined}
          userId={user?.id}
          initialMaxWatchTime={getRemainingWatchTime()}
          lessonBalance={lessonBalance}
          onClose={handleCloseVideo}
        />
      )}

      {/* Main page content (hidden during video playback) */}
      {!selectedLesson && (
        <>
          {/* Header */}
          <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Go To Class</h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome {user?.username || "Student"}! You have {lessonBalance} lesson credits remaining.
                  </p>
                </div>
                {isSubscriber && (
                  <div className="flex items-center gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <Zap className="h-5 w-5" />
                        <span className="font-semibold">{lessonBalance} Credits</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {lessonsViewed}/{totalLessons} used
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Selection & Lessons */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="grid gap-8">
                {/* Level selection */}
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

                {/* Grade selection */}
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

                {/* Area selection */}
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

                {/* Lessons grid */}
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
                          return (
                            <LessonCard
                              key={lesson.id}
                              lesson={lesson}
                              isSubscriber={true}
                              lessonBalance={lessonBalance}
                              watchDuration={lessonFees.subscribed.duration}
                              price={lessonFees.subscribed.fee}
                              isPurchased={true}
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
        </>
      )}
    </Layout>
  );
}
