import { type Lesson } from "@/services/guest";
import { useMaxWatchTime } from "@/hooks/useMaxWatchTime";
import { useVideoStream } from "@/hooks/useVideoStream";
import QualitySelector from "@/components/QualitySelector";
import VideoContainer from "@/components/VideoContainer";
import VideoInfo from "@/components/VideoInfo";
import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap } from "lucide-react";

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

  const { videoRef, streamUrl, isHlsStream, isLoading, availableQualities, selectedQuality, setSelectedQuality, cleanup } = useVideoStream({
    lesson,
    isSubscriber,
    phone,
    onError: handleError,
    onMaxWatchTimeUpdate: handleMaxWatchTimeUpdate,
   });

   console.log('[VideoPlayer] useVideoStream result', {
     hasStreamUrl: !!streamUrl,
     isHlsStream,
     isLoading,
     qualitiesCount: availableQualities.length
   });

    // Enforce time limit: track watched seconds and decrement remaining time
    useEffect(() => {
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
      let pollIntervalId: any = null;
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
    }, [isSubscriber, initialMaxWatchTime, setMaxWatchTime, streamUrl, onWatchTimeSync, cleanup]);

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

      let pollIntervalId: any = null;
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
    }, [streamUrl, onTimeUpdate, onProgress, onDurationChange, onSeeking, onSeeked, onRateChange, isHlsStream]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const progressPercent = initialMaxWatchTime > 0 ? ((initialMaxWatchTime - remainingTime) / initialMaxWatchTime) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading video...</div>
      </div>
    );
  }

  if (!streamUrl) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleClose}
          className="text-white hover:bg-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Button>

        {isSubscriber ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm">
                {formatTime(remainingTime)} remaining ({lessonBalance} credits)
              </span>
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all"
                style={{
                  width: remainingTime > 0 ? `${progressPercent}%` : "0%",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-sm">{formatTime(remainingTime)} remaining</span>
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isHlsStream && availableQualities.length > 1 && (
        <QualitySelector
          qualities={availableQualities}
          selectedQuality={selectedQuality}
          onQualityChange={setSelectedQuality}
        />
      )}

      <VideoContainer videoRef={videoRef} />

      <VideoInfo lesson={lesson} />
    </div>
  );
}

export default VideoPlayer;
