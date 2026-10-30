import { type Lesson } from "@/services/guest";
import { useMaxWatchTime } from "@/hooks/useMaxWatchTime";
import { useVideoStream } from "@/hooks/useVideoStream";
import QualitySelector from "@/components/QualitySelector";
import VideoContainer from "@/components/VideoContainer";
import VideoInfo from "@/components/VideoInfo";
import { useEffect, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock3, LockKeyhole, Maximize, Minimize, RefreshCw, Zap } from "lucide-react";
import { api } from "@/services/api";
import { getPlaybackDeviceId } from "@/services/playbackDevice";

export interface VideoPlayerProps {
  lesson: Lesson;
  isSubscriber: boolean;
  phone?: string | null;
  userId?: string | number;
  initialMaxWatchTime: number;
  lessonBalance?: number;
  onClose: () => void;
  onTimeUpdate?: (data: { currentTime: number }) => void;
  onProgress?: (progress: { playedSeconds: number; played: number; loaded: number }) => void;
  onDurationChange?: (duration: number) => void;
  onSeeking?: () => void;
  onSeeked?: () => void;
  onRateChange?: (rate: number) => void;
  onError?: (error: unknown) => void;
  onWatchTimeSync?: (watchTimeSeconds: number) => void;
  usesSubscriberDeviceSession?: boolean;
  unlimitedWatchTime?: boolean;
}

export function VideoPlayer({
  lesson,
  isSubscriber,
  phone,
  initialMaxWatchTime,
  lessonBalance = 0,
  onClose,
  onTimeUpdate,
  onProgress,
  onDurationChange,
  onSeeking,
  onSeeked,
  onRateChange,
  onError,
  onWatchTimeSync,
  usesSubscriberDeviceSession = false,
  unlimitedWatchTime = false,
}: VideoPlayerProps) {
  console.log('[VideoPlayer] Mounted', {
    lessonId: lesson.id,
    isSubscriber,
    phone,
    initialMaxWatchTime,
    lessonBalance,
  });

  const { setMaxWatchTime, remainingTime } = useMaxWatchTime({
    initialMaxWatchTime,
  });
  const playerShellRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  console.log('[VideoPlayer] useMaxWatchTime initialized', { initialMaxWatchTime, remainingTime });

   const lastUpdateRef = useRef<number>(0);
  const maxWatchTimeRef = useRef<number>(initialMaxWatchTime);
  const hasShownTimeUpMessageRef = useRef(false);
  const accumulatedWatchTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const SYNC_INTERVAL_SECONDS = 30; // Sync every 30 seconds of watched time

  // Keep ref in sync with state
  useEffect(() => {
    maxWatchTimeRef.current = remainingTime;
  }, [remainingTime]);

  const handleMaxWatchTimeUpdate = useCallback((seconds: number) => {
    console.log('[VideoPlayer] onMaxWatchTimeUpdate callback', { seconds });
    setMaxWatchTime(seconds);
  }, [setMaxWatchTime]);

  const handleError = useCallback((error: unknown) => {
    console.error('[VideoPlayer] onError callback', error);
    onError?.(error);
  }, [onError]);

  const {
    videoRef,
    streamUrl,
    isHlsStream,
    isLoading,
    availableQualities,
    selectedQuality,
    setSelectedQuality,
    cleanup,
    error,
    retryStreamUrl,
  } = useVideoStream({
    lesson,
    isSubscriber,
    phone,
    onError: handleError,
    onMaxWatchTimeUpdate: unlimitedWatchTime ? undefined : handleMaxWatchTimeUpdate,
   });

   useEffect(() => {
     const updateFullscreenState = () => {
       setIsFullscreen(document.fullscreenElement === playerShellRef.current);
     };

     document.addEventListener("fullscreenchange", updateFullscreenState);
     return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
   }, []);

   useEffect(() => {
     if (!usesSubscriberDeviceSession) return;
     return () => {
       api.delete("/lessons/device-session", {
         data: { device_id: getPlaybackDeviceId() },
       }).catch((error) => {
         console.error("Failed to release playback device:", error);
       });
     };
   }, [usesSubscriberDeviceSession]);

   useEffect(() => {
     if (!usesSubscriberDeviceSession) return;
     const heartbeat = () => {
       api.post("/lessons/device-session/heartbeat", {
         device_id: getPlaybackDeviceId(),
         lesson_id: lesson.id,
       }).catch((error) => {
         console.error("Playback device heartbeat failed:", error);
       });
     };
     const intervalId = window.setInterval(heartbeat, 30_000);
     return () => window.clearInterval(intervalId);
   }, [lesson.id, usesSubscriberDeviceSession]);

   console.log('[VideoPlayer] useVideoStream result', {
     hasStreamUrl: !!streamUrl,
     isHlsStream,
     isLoading,
     qualitiesCount: availableQualities.length
   });

    // Enforce time limit: track watched seconds and decrement remaining time
    useEffect(() => {
      if (unlimitedWatchTime) return;

      console.log('[VideoPlayer] Time enforcement effect mounted', {
        isSubscriber,
        maxWatchTime: maxWatchTimeRef.current,
        streamUrl: streamUrl?.substring(0, 20),
      });

      // Only run when a stream URL is available
      if (!streamUrl) {
        console.log('[VideoPlayer] No streamUrl yet, skipping time enforcement');
        return;
      }

      // Enable time enforcement for all users when they have a finite watch time budget
      if (initialMaxWatchTime <= 0 && maxWatchTimeRef.current <= 0) {
        console.log('[VideoPlayer] No watch time budget, skipping time enforcement');
        return;
      }

      let animationFrameId: number;
      let isTracking = true;
      let pollIntervalId: ReturnType<typeof window.setInterval> | null = null;
      let videoElement: HTMLVideoElement | null = null;
      let handlersAttached = false;

      const handlePlay = () => {
        console.log('[VideoPlayer] Video play event');
        if (isTracking) {
          lastUpdateRef.current = Date.now();
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(updateWatchTime);
        }
      };

      const handlePause = () => {
        console.log('[VideoPlayer] Video pause event');
        cancelAnimationFrame(animationFrameId);
      };

      const handleSeeking = () => {
        console.log('[VideoPlayer] Video seeking event');
        lastUpdateRef.current = Date.now();
      };

      const handleSeeked = () => {
        console.log('[VideoPlayer] Video seeked event');
        lastUpdateRef.current = Date.now();
      };

      const handleEnded = () => {
        console.log('[VideoPlayer] Video ended event');
        cancelAnimationFrame(animationFrameId);
      };

      const updateWatchTime = () => {
        if (!isTracking) return;

        const now = Date.now();
        const deltaSeconds = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;

        console.log('[VideoPlayer] updateWatchTime', {
          deltaSeconds,
          maxWatchTimeBefore: maxWatchTimeRef.current,
          videoPaused: videoElement?.paused,
          videoSeeking: videoElement?.seeking,
        });

        // Only decrement if video is playing (not paused or seeking)
        if (videoElement && !videoElement.paused && !videoElement.seeking && deltaSeconds > 0) {
          const currentMaxTime = maxWatchTimeRef.current;
          const newTime = Math.max(0, currentMaxTime - deltaSeconds);
          setMaxWatchTime(newTime);
          maxWatchTimeRef.current = newTime;

          accumulatedWatchTimeRef.current += deltaSeconds;

          // Periodically sync watch time to parent (every SYNC_INTERVAL_SECONDS)
          if (accumulatedWatchTimeRef.current - lastSyncTimeRef.current >= SYNC_INTERVAL_SECONDS) {
            const secondsToSync = Math.floor(accumulatedWatchTimeRef.current - lastSyncTimeRef.current);
            onWatchTimeSync?.(secondsToSync);
            lastSyncTimeRef.current = accumulatedWatchTimeRef.current;
            console.log('[VideoPlayer] Synced watch time:', secondsToSync, 'seconds');
          }

          console.log('[VideoPlayer] Decremented time', { newTime });
        }

        // Check if time is up using ref (always current)
        if (maxWatchTimeRef.current <= 0 && !hasShownTimeUpMessageRef.current) {
          hasShownTimeUpMessageRef.current = true;
          isTracking = false;

          const videoToPause = videoElement || videoRef.current;
          if (videoToPause) {
            videoToPause.pause();
          }

          cleanup();

          console.log('[VideoPlayer] Time is up! Video paused');
          toast.info("Time's up! You've used all your watch time for this lesson.");

          // Sync any remaining accumulated time before stopping
          const remainingAccumulated = accumulatedWatchTimeRef.current - lastSyncTimeRef.current;
          if (remainingAccumulated > 0) {
            onWatchTimeSync?.(Math.floor(remainingAccumulated));
          }

          return;
        }

        animationFrameId = requestAnimationFrame(updateWatchTime);
      };

      const attachListeners = (video: HTMLVideoElement) => {
        videoElement = video;
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('seeking', handleSeeking);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('ended', handleEnded);
        handlersAttached = true;
        console.log('[VideoPlayer] Time enforcement listeners attached');

        // If video is already playing, start tracking immediately
        if (!video.paused) {
          handlePlay();
        }
      };

      const detachListeners = (video: HTMLVideoElement) => {
        if (!handlersAttached) return;
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('seeking', handleSeeking);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('ended', handleEnded);
        handlersAttached = false;
      };

      // Try to attach immediately or poll for video element
      if (videoRef.current) {
        attachListeners(videoRef.current);
      } else {
        let attempts = 0;
        const maxAttempts = 100;
        pollIntervalId = setInterval(() => {
          attempts++;
          if (videoRef.current) {
            clearInterval(pollIntervalId!);
            attachListeners(videoRef.current!);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollIntervalId!);
            console.error('[VideoPlayer] Video element not found after polling for time enforcement');
          }
        }, 50);
      }

      return () => {
        isTracking = false;
        cancelAnimationFrame(animationFrameId);
        if (pollIntervalId) clearInterval(pollIntervalId);
        if (videoElement && handlersAttached) {
          detachListeners(videoElement);
        }

        // Sync any unsynced accumulated time before cleanup (prevents bypass by closing before 30s)
        const unsyncedTime = accumulatedWatchTimeRef.current - lastSyncTimeRef.current;
        if (unsyncedTime > 1) {
          onWatchTimeSync?.(Math.floor(unsyncedTime));
          console.log('[VideoPlayer] Synced unsynced time on cleanup:', Math.floor(unsyncedTime), 'seconds');
        }

        // Reset for next video
        hasShownTimeUpMessageRef.current = false;
        lastUpdateRef.current = 0;
        accumulatedWatchTimeRef.current = 0;
        lastSyncTimeRef.current = 0;
        console.log('[VideoPlayer] Time enforcement cleanup');
      };
    }, [cleanup, isSubscriber, initialMaxWatchTime, setMaxWatchTime, streamUrl, onWatchTimeSync, unlimitedWatchTime, videoRef]);

    // Attach ReactPlayer callback event listeners
    useEffect(() => {
      console.log('[VideoPlayer] Setting up video event listeners', {
        streamUrl: streamUrl?.substring(0, 50),
        isHlsStream,
      });

      // Only run when a stream URL is available
      if (!streamUrl) {
        console.log('[VideoPlayer] No streamUrl yet, skipping event listeners');
        return;
      }

      let pollIntervalId: ReturnType<typeof window.setInterval> | null = null;
      let videoElement: HTMLVideoElement | null = null;
      let handlersAttached = false;

      const handleTimeUpdate = () => {
        onTimeUpdate?.({ currentTime: videoElement!.currentTime });
        onProgress?.({
          playedSeconds: videoElement!.currentTime,
          played: videoElement!.duration ? videoElement!.currentTime / videoElement!.duration : 0,
          loaded: videoElement!.buffered.length > 0 ? videoElement!.buffered.end(videoElement!.buffered.length - 1) / videoElement!.duration : 0,
        });
      };

      const handleDurationChange = () => {
        console.log('[VideoPlayer] Duration changed:', videoElement?.duration);
        onDurationChange?.(videoElement!.duration);
      };

      const handleSeeking = () => {
        console.log('[VideoPlayer] Video seeking (via timeupdate)');
        onSeeking?.();
      };

      const handleSeeked = () => {
        console.log('[VideoPlayer] Video seeked (via timeupdate)');
        onSeeked?.();
      };

      const handleRateChange = () => {
        console.log('[VideoPlayer] Playback rate changed:', videoElement?.playbackRate);
        onRateChange?.(videoElement!.playbackRate);
      };

      const attachListeners = (video: HTMLVideoElement) => {
        videoElement = video;
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('seeking', handleSeeking);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('ratechange', handleRateChange);
        handlersAttached = true;
        console.log('[VideoPlayer] Video event listeners attached');
      };

      const detachListeners = (video: HTMLVideoElement) => {
        if (!handlersAttached) return;
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('seeking', handleSeeking);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('ratechange', handleRateChange);
        handlersAttached = false;
      };

      if (videoRef.current) {
        attachListeners(videoRef.current);
      } else {
        let attempts = 0;
        const maxAttempts = 100;
        pollIntervalId = setInterval(() => {
          attempts++;
          if (videoRef.current) {
            clearInterval(pollIntervalId!);
            attachListeners(videoRef.current!);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollIntervalId!);
            console.error('[VideoPlayer] Video element not found for event listeners');
          }
        }, 50);
      }

      return () => {
        if (pollIntervalId) clearInterval(pollIntervalId);
        if (videoElement && handlersAttached) {
          detachListeners(videoElement);
        }
        console.log('[VideoPlayer] Video event listeners detached');
      };
    }, [streamUrl, onTimeUpdate, onProgress, onDurationChange, onSeeking, onSeeked, onRateChange, isHlsStream, videoRef]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    cleanup();
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch((error: unknown) => {
        console.error("Could not exit fullscreen:", error);
      });
    }
    onClose();
  };

  const remainingPercent = initialMaxWatchTime > 0
    ? Math.min(100, Math.max(0, (remainingTime / initialMaxWatchTime) * 100))
    : 0;
  const playbackError = error instanceof Error ? error.message : "The lesson video could not be loaded.";
  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (playerShellRef.current?.requestFullscreen) {
        await playerShellRef.current.requestFullscreen();
      } else {
        toast.error("Fullscreen is not available in this browser.");
      }
    } catch (error) {
      console.error("Could not change fullscreen mode:", error);
      toast.error("Could not change fullscreen mode. Please try again.");
    }
  };

  return (
    <div
      ref={playerShellRef}
      className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white"
    >
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="min-h-11 rounded-xl px-3 text-slate-100 hover:bg-white/10 hover:text-white"
            aria-label="Back to lessons"
          >
            <ArrowLeft aria-hidden="true" className="mr-2 h-5 w-5" />
            Back to lessons
          </Button>

          {unlimitedWatchTime ? (
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 text-sm font-medium text-emerald-100">
              <Zap aria-hidden="true" className="h-4 w-4" />
              Admin playback · no package limits
            </span>
          ) : (
            <div className="min-w-[min(100%,18rem)] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 sm:min-w-72">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-slate-200">
                  {isSubscriber ? (
                    <Zap aria-hidden="true" className="h-4 w-4 text-amber-300" />
                  ) : (
                    <Clock3 aria-hidden="true" className="h-4 w-4 text-amber-300" />
                  )}
                  Time remaining
                </span>
                <span className="font-semibold tabular-nums text-white">{formatTime(remainingTime)}</span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700"
                role="progressbar"
                aria-label="Remaining lesson watch time"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(remainingPercent)}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-300"
                  style={{ width: `${remainingPercent}%` }}
                />
              </div>
              {isSubscriber && (
                <p className="mt-1 text-right text-xs text-slate-400">
                  {lessonBalance} lesson {lessonBalance === 1 ? "slot" : "slots"} remaining
                </p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 sm:mb-7">
            <VideoInfo lesson={lesson} />
          </div>

          <section
            aria-label="Lesson video player"
            className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/30"
          >
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <LockKeyhole aria-hidden="true" className="h-4 w-4 text-emerald-300" />
                <span>Private lesson stream</span>
              </div>
            </div>

            {isLoading ? (
              <div
                className="flex aspect-video flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center"
                role="status"
                aria-live="polite"
              >
                <RefreshCw aria-hidden="true" className="h-8 w-8 animate-spin text-sky-300" />
                <p className="text-base font-medium text-white">Preparing your lesson…</p>
                <p className="max-w-sm text-sm text-slate-400">This usually takes just a moment.</p>
              </div>
            ) : streamUrl ? (
              <VideoContainer
                videoRef={videoRef}
                title={lesson.title}
                poster={lesson.thumbnail_url}
              />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
                <p className="max-w-lg text-base font-medium text-white">
                  {error !== null ? "We couldn’t load this lesson." : "This lesson stream isn’t available right now."}
                </p>
                {error !== null && (
                  <>
                    <p className="max-w-lg text-sm text-slate-400">{playbackError}</p>
                    <Button
                      onClick={retryStreamUrl}
                      className="min-h-11 rounded-xl bg-sky-300 px-5 font-semibold text-slate-950 hover:bg-sky-200"
                    >
                      <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
                      Try loading again
                    </Button>
                  </>
                )}
              </div>
            )}
          </section>

          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Watch at your own pace</p>
              <p className="text-sm leading-5 text-slate-400">
                Press play when you’re ready. Use the video controls to pause, adjust volume, or seek.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={isFullscreen}
              disabled={!streamUrl || isLoading}
              className="min-h-11 shrink-0 rounded-xl border-white/15 bg-white/5 px-4 text-white hover:bg-white/10 hover:text-white"
            >
              {isFullscreen ? (
                <Minimize aria-hidden="true" className="mr-2 h-4 w-4" />
              ) : (
                <Maximize aria-hidden="true" className="mr-2 h-4 w-4" />
              )}
              {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </Button>
          </div>

          {isHlsStream && availableQualities.length > 1 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:px-5">
              <QualitySelector
                qualities={availableQualities}
                selectedQuality={selectedQuality}
                onQualityChange={setSelectedQuality}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default VideoPlayer;
