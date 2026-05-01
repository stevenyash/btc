import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import { guestService } from "@/services/guest";

interface UseWatchTimeTrackingOptions {
  isPlaying: boolean;
  selectedLessonId: number | null;
  phone?: string | null;
  isSubscriber: boolean;
  userId?: string | number;
  onWatchTimeUpdate?: (watchTime: number) => void;
}

export function useWatchTimeTracking({
  isPlaying,
  selectedLessonId,
  phone,
  isSubscriber,
  userId,
  onWatchTimeUpdate,
}: UseWatchTimeTrackingOptions) {
  const watchTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [watchTime, setWatchTime] = useState(0);

  const startTracking = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (isPlaying && selectedLessonId) {
        watchTimeRef.current += 1;
        const currentWatchTime = watchTimeRef.current;
        setWatchTime(currentWatchTime);

        // Update localStorage for guest users (resume capability)
        if (!isSubscriber && phone) {
          try {
            const stored = localStorage.getItem("guest_lesson_payments");
            if (stored) {
              const payments = JSON.parse(stored);
              const key = `${phone}_${selectedLessonId}`;
              if (payments[key]) {
                payments[key].watchTime = currentWatchTime;
                localStorage.setItem("guest_lesson_payments", JSON.stringify(payments));
              }
            }
          } catch {
            // Ignore localStorage errors
          }
        }

        // Send periodic updates to server (every 10 seconds)
        if (currentWatchTime % 10 === 0) {
          try {
            if (isSubscriber && userId) {
              await api.post("/guest_update_watch_time", {
                user_id: userId,
                lesson_id: selectedLessonId,
                watch_time: currentWatchTime,
              });
            } else if (phone) {
              await guestService.updateWatchTime(phone, selectedLessonId, currentWatchTime);
            }
          } catch (error) {
            console.error("Failed to update watch time:", error);
          }
        }

        onWatchTimeUpdate?.(currentWatchTime);
      }
    }, 1000);
  }, [isPlaying, selectedLessonId, phone, isSubscriber, userId, onWatchTimeUpdate]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetWatchTime = useCallback(() => {
    stopTracking();
    watchTimeRef.current = 0;
    setWatchTime(0);
  }, [stopTracking]);

  useEffect(() => {
    if (isPlaying) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isPlaying, startTracking, stopTracking]);

  return {
    watchTime,
    resetWatchTime,
  };
}

export default useWatchTimeTracking;
