/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { toast } from "sonner";
import { api } from "@/services/api";
import { guestService, type Lesson } from "@/services/guest";
import { getPlaybackDeviceId } from "@/services/playbackDevice";

interface UseVideoStreamOptions {
  lesson: Lesson;
  isSubscriber: boolean;
  phone?: string | null;
  onError?: (error: unknown) => void;
  onMaxWatchTimeUpdate?: (seconds: number) => void;
  onReady?: () => void;
  onStart?: () => void;
  onPlay?: () => void;
  onPlaying?: () => void;
  onPause?: () => void;
  onWaiting?: () => void;
  onEnded?: () => void;
}

interface UseVideoStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamUrl: string | null;
  isHlsStream: boolean;
  isLoading: boolean;
  availableQualities: Array<{ level: number; label: string; height: number; width: number }>;
  selectedQuality: number;
  setSelectedQuality: (level: number) => void;
  refreshStreamUrl: () => Promise<void>;
  cleanup: () => void;
  error: unknown | null;
  isRateLimited: boolean;
  retryAfter?: number;
  retryStreamUrl: () => void;
}

export function useVideoStream({
  lesson,
  isSubscriber,
  phone,
  onError,
  onMaxWatchTimeUpdate,
  onReady,
  onStart,
  onPlay,
  onPlaying,
  onPause,
  onWaiting,
  onEnded,
}: UseVideoStreamOptions): UseVideoStreamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const startHlsOnPlayRef = useRef<(() => void) | null>(null);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isHlsStream, setIsHlsStream] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableQualities, setAvailableQualities] = useState<
    Array<{ level: number; label: string; height: number; width: number }>
  >([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [error, setError] = useState<unknown | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined);
  const [requestAttempt, setRequestAttempt] = useState(0);

  console.log('[useVideoStream] Hook initialized', {
    lessonId: lesson.id,
    isSubscriber,
    phone: phone?.substring(0, 6),
  });

  // Track if we've attempted a refresh to avoid loops
  const refreshAttemptedRef = useRef(false);
  const refreshStreamUrlFnRef = useRef<(() => Promise<void>) | null>(null);
  const initializedStreamUrlRef = useRef<string | null>(null);
  const requestRetryCountRef = useRef(0);
  const rateLimitResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quality change handler
  const handleQualityChange = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setSelectedQuality(level);
    }
  }, []);

  // Initialize HLS from URL
  const initializeHls = useCallback(
    (videoUrl: string) => {
      if (!videoRef.current) {
        console.error("initializeHls: videoRef is null");
        return;
      }

      console.log("Initializing HLS for URL:", videoUrl.substring(0, 100));
      const video = videoRef.current;

      if (hlsRef.current) {
        if (startHlsOnPlayRef.current) {
          video.removeEventListener("play", startHlsOnPlayRef.current);
          startHlsOnPlayRef.current = null;
        }
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      setAvailableQualities([]);
      setSelectedQuality(-1);

      if (videoUrl.includes(".m3u8") && Hls.isSupported()) {
        // Extract all token query params from the master manifest URL for sub-request auth.
        // Bunny directory tokens include token_path (and potentially token_countries, etc.)
        // — ALL of those must be forwarded on every sub-playlist and segment request.
        const urlSearchParams = new URLSearchParams(videoUrl.split('?')?.[1] || '');
        const tokenParamNames = [
          'token',
          'expires',
          'token_path',
          'token_countries',
          'token_countries_blocked',
          'token_ignore_params',
          'limit',
        ];

        const hasTokenParams = tokenParamNames.some((p) => urlSearchParams.has(p));
        const TokenLoader = hasTokenParams
          ? class extends (Hls as any).DefaultConfig.loader {
            load(context: any, config: any, callbacks: any) {
              // Only append if the sub-request URL doesn't already carry a token
              if (
                context.url &&
                !tokenParamNames.some((p) => context.url.includes(`${p}=`))
              ) {
                const sep = context.url.includes('?') ? '&' : '?';
                const extra = tokenParamNames
                  .map((p) => {
                    const v = urlSearchParams.get(p);
                    return v ? `${p}=${encodeURIComponent(v)}` : null;
                  })
                  .filter(Boolean)
                  .join('&');
                context.url = `${context.url}${sep}${extra}`;
              }
              super.load(context, config, callbacks);
            }
          }
          : undefined;

        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: false,
          progressive: false,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 10000,
          levelLoadingTimeOut: 10000,
          autoStartLoad: false,
          pLoader: TokenLoader as any,
          fLoader: TokenLoader as any,
        });

        const startLoadOnPlay = () => {
          if (hlsRef.current === hls) {
            hls.startLoad();
          }
        };
        startHlsOnPlayRef.current = startLoadOnPlay;
        video.addEventListener("play", startLoadOnPlay);

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('[useVideoStream] HLS manifest parsed');
          onReady?.();
          onStart?.();
        });

        hls.on(Hls.Events.LEVELS_UPDATED, (_event: unknown, data: unknown) => {
          const levelsData = data as {
            levels?: Array<{ height?: number; width?: number }>;
          };
          const levels = (levelsData.levels || []).map((l, idx) => ({
            level: idx,
            label: l.height
              ? `${l.height}p`
              : l.width
              ? `${l.width}p`
              : `Level ${idx}`,
            height: l.height || 0,
            width: l.width || 0,
          }));
          setAvailableQualities(levels);
          if (levels.length > 0) {
            const highest = levels.length - 1;
            setSelectedQuality(highest);
            hls.currentLevel = highest;
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event: unknown, data: unknown) => {
          const switched = data as { level: number };
          setSelectedQuality(switched.level);
        });

        hls.on(Hls.Events.ERROR, (_event: unknown, data: unknown) => {
          const err = data as {
            fatal: boolean;
            type: string;
            details: string;
            url?: string;
          };
          console.error("HLS error:", data);

          const isLikelyAuthError =
            err.url &&
            (err.url.includes(".m3u8") || err.url.includes(".ts")) &&
            !err.fatal;

          if (err.fatal) {
            switch (err.type) {
              case "networkError":
                hls.startLoad();
                break;
              case "mediaError":
                hls.recoverMediaError();
                break;
              default:
                setError(new Error(`HLS fatal error: ${err.type}`));
                onError?.(new Error(`HLS fatal error: ${err.type}`));
                hls.destroy();
                break;
            }
          } else if (isLikelyAuthError) {
            if (!refreshAttemptedRef.current) {
              refreshAttemptedRef.current = true;
              refreshStreamUrlFnRef.current?.();
            } else {
              setError(new Error("Stream expired"));
              toast.error("Video stream expired. Please reload the page.");
            }
          } else {
            switch (err.details) {
              case "levelLoadError":
              case "fragmentLoadError":
              case "audioTrackLoadError":
              case "keySystemError":
                hls.recoverMediaError();
                break;
              default:
                setTimeout(() => {
                  hls.recoverMediaError();
                }, 1000);
            }
          }
        });

        hlsRef.current = hls;
      } else if (videoUrl.includes(".m3u8") && video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        console.log('[useVideoStream] Safari native HLS: setting video.src');
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', () => {
          console.log('[useVideoStream] Safari HLS loadedmetadata');
          onReady?.();
        });
        video.addEventListener('play', () => {
          console.log('[useVideoStream] Safari HLS play');
          onPlay?.();
        });
        video.addEventListener('playing', () => {
          console.log('[useVideoStream] Safari HLS playing');
          onPlaying?.();
        });
        video.addEventListener('pause', () => {
          console.log('[useVideoStream] Safari HLS pause');
          onPause?.();
        });
        video.addEventListener('waiting', () => {
          console.log('[useVideoStream] Safari HLS waiting');
          onWaiting?.();
        });
        video.addEventListener('ended', () => {
          console.log('[useVideoStream] Safari HLS ended');
          onEnded?.();
        });
        const handleError = () => {
          console.error('[useVideoStream] Safari HLS error:', video.error);
          onError?.(video.error);
          toast.error("Failed to load video stream");
        };
        video.addEventListener('error', handleError);
      } else if (videoUrl.includes(".m3u8")) {
        // HLS but no Hls.js support and no native HLS - show error
        console.error('[useVideoStream] HLS not supported by browser');
        setError(new Error("HLS video streaming is not supported in your browser. Please use Chrome, Firefox, or Safari."));
        toast.error("Video format not supported. Try a different browser.");
        return;
} else {
          // Non-HLS video (MP4, WebM, etc.)
          console.log('[useVideoStream] Non-HLS: setting video.src');
          video.src = videoUrl;
          video.addEventListener('loadedmetadata', () => {
            console.log('[useVideoStream] Non-HLS loadedmetadata, duration:', video.duration, 'readyState:', video.readyState, 'networkState:', video.networkState);
            onReady?.();
          });
          video.addEventListener('loadstart', () => {
            console.log('[useVideoStream] Non-HLS loadstart, networkState:', video.networkState);
          });
          video.addEventListener('progress', () => {
            console.log('[useVideoStream] Non-HLS progress, buffered:', video.buffered.length > 0 ? video.buffered.end(0) : 0);
          });
          video.addEventListener('canplay', () => {
            console.log('[useVideoStream] Non-HLS canplay');
          });
          video.addEventListener('canplaythrough', () => {
            console.log('[useVideoStream] Non-HLS canplaythrough');
          });
          video.addEventListener('play', () => {
            console.log('[useVideoStream] Non-HLS play');
            onPlay?.();
          });
          video.addEventListener('playing', () => {
            console.log('[useVideoStream] Non-HLS playing');
            onPlaying?.();
          });
          video.addEventListener('pause', () => {
            console.log('[useVideoStream] Non-HLS pause');
            onPause?.();
          });
          video.addEventListener('waiting', () => {
            console.log('[useVideoStream] Non-HLS waiting');
            onWaiting?.();
          });
          video.addEventListener('ended', () => {
            console.log('[useVideoStream] Non-HLS ended');
            onEnded?.();
          });
          video.addEventListener('stalled', () => {
            console.log('[useVideoStream] Non-HLS stalled');
          });
          video.addEventListener('suspend', () => {
            console.log('[useVideoStream] Non-HLS suspend');
          });
          video.addEventListener('abort', () => {
            console.log('[useVideoStream] Non-HLS abort');
          });
           const handleError = () => {
              console.error('[useVideoStream] Non-HLS video error:', video.error);
              console.error('[useVideoStream] Video error code:', video.error?.code);
              console.error('[useVideoStream] Video currentSrc:', video.currentSrc);
              console.error('[useVideoStream] Video networkState:', video.networkState);
              console.error('[useVideoStream] Video readyState:', video.readyState);
              onError?.(video.error);
              toast.error("Failed to load video");
            };
           video.addEventListener('error', handleError);
           console.log('[useVideoStream] Non-HLS event listeners attached');
         }

    },
    [setAvailableQualities, setSelectedQuality, setError, onError, onReady, onStart, onPlay, onPlaying, onPause, onWaiting, onEnded]
  );

  // Refresh stream URL (auth/token recovery) with rate limit handling
  const refreshStreamUrl = useCallback(async () => {
    const currentUrl = streamUrl;
    if (!currentUrl) return;

    try {
      let videoUrl: string;
      let isHls: boolean;

      if (isSubscriber) {
        const response = await api.get(`/lessons/stream-url/${lesson.id}`, {
          params: { signed: "true", device_id: getPlaybackDeviceId() },
        });

        // Handle rate limiting
        if ((response as any).isRateLimit) {
          setIsRateLimited(true);
          setRetryAfter((response as any).retryAfter);
          const retrySec = (response as any).retryAfter || 15;
          toast.error(`Rate limit exceeded. Please wait ${retrySec} seconds before retrying.`);
          return;
        }

        if (response.data.success && response.data.video_url) {
          videoUrl = response.data.video_url;
          isHls = response.data.is_hls || videoUrl.includes(".m3u8");
          if (response.data.remaining_watch_time_seconds !== undefined) {
            onMaxWatchTimeUpdate?.(response.data.remaining_watch_time_seconds);
          }
        } else {
          toast.error("Failed to refresh video stream");
          return;
        }
      } else {
        if (!phone) {
          toast.error("Phone number required");
          return;
        }
         const result = await guestService.getStreamUrl(lesson.id, phone, getPlaybackDeviceId());
         if (result.success && result.video_url) {
           videoUrl = result.video_url;
           isHls = result.is_hls || videoUrl.includes(".m3u8");
           if (result.lesson_balance !== undefined) {
             onMaxWatchTimeUpdate?.(result.lesson_balance);
           }
         } else {
          toast.error(result.message || "Failed to refresh video stream");
          return;
        }
      }

      // Reset rate limit state on success
      setIsRateLimited(false);
      setRetryAfter(undefined);
      requestRetryCountRef.current = 0;

      if (videoUrl !== currentUrl) {
        setStreamUrl(videoUrl);
        setIsHlsStream(isHls);
        refreshAttemptedRef.current = false;
        toast.success("Video stream refreshed");
      }
    } catch (err: any) {
      console.error("Error refreshing video:", err);
      
      if (err.isRateLimit) {
        setIsRateLimited(true);
        const retrySec = err.retryAfter || 15;
        setRetryAfter(retrySec);
        toast.error(`Rate limit exceeded. Please wait ${retrySec} seconds before retrying.`);
      } else {
        toast.error("Failed to refresh video stream");
        setError(err);
      }
    }
  }, [lesson.id, isSubscriber, phone, streamUrl, onMaxWatchTimeUpdate]);

  // Keep refreshStreamUrl ref updated
  useEffect(() => {
    refreshStreamUrlFnRef.current = refreshStreamUrl;
  }, [refreshStreamUrl]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (rateLimitResetTimerRef.current) {
      clearTimeout(rateLimitResetTimerRef.current);
      rateLimitResetTimerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      if (startHlsOnPlayRef.current) {
        videoRef.current.removeEventListener("play", startHlsOnPlayRef.current);
        startHlsOnPlayRef.current = null;
      }
      videoRef.current.removeEventListener('loadedmetadata', () => onReady?.());
      videoRef.current.removeEventListener('play', () => onPlay?.());
      videoRef.current.removeEventListener('playing', () => onPlaying?.());
      videoRef.current.removeEventListener('pause', () => onPause?.());
      videoRef.current.removeEventListener('waiting', () => onWaiting?.());
      videoRef.current.removeEventListener('ended', () => onEnded?.());
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    setIsRateLimited(false);
    setRetryAfter(undefined);
    requestRetryCountRef.current = 0;
  }, [onReady, onPlay, onPlaying, onPause, onWaiting, onEnded]);

  const retryStreamUrl = useCallback(() => {
    cleanup();
    initializedStreamUrlRef.current = null;
    setStreamUrl(null);
    setIsHlsStream(false);
    setError(null);
    setIsLoading(true);
    setRequestAttempt((attempt) => attempt + 1);
  }, [cleanup]);

  // Fetch initial stream URL
  useEffect(() => {
    const controller = new AbortController();

    console.log('[useVideoStream] Starting initial fetch for lesson', lesson.id, 'isSubscriber:', isSubscriber);
    const fetchStreamUrl = async () => {
      try {
        let videoUrl: string;
        let isHls: boolean;

        if (isSubscriber) {
          console.log('[useVideoStream] Subscriber: fetching stream URL');
          const response = await api.get(`/lessons/stream-url/${lesson.id}`, {
            params: { signed: "true", device_id: getPlaybackDeviceId() },
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;

          if ((response as any).isRateLimit) {
            const retryIn = (response as any).retryAfter;
            setIsRateLimited(true);
            setRetryAfter(retryIn);
            setError(
              new Error(
                retryIn
                  ? `Too many video requests. Try again in ${retryIn} seconds.`
                  : "Too many video requests. Please try again shortly."
              )
            );
            setIsLoading(false);
            return;
          }

          if (response.data.success && response.data.video_url) {
            videoUrl = response.data.video_url;
            isHls = response.data.is_hls || videoUrl.includes(".m3u8");
            if (response.data.remaining_watch_time_seconds !== undefined) {
              onMaxWatchTimeUpdate?.(response.data.remaining_watch_time_seconds);
            }
            console.log('[useVideoStream] Subscriber stream URL received:', {
              videoUrl: videoUrl.substring(0, 80),
              isHls,
            });
          } else {
            console.error('[useVideoStream] Subscriber: No video_url in response');
            setError(new Error("Failed to get video URL"));
            setIsLoading(false);
            return;
          }
        } else {
          if (!phone) {
            console.error('[useVideoStream] Guest: No phone provided');
            setIsLoading(false);
            return;
          }
          console.log('[useVideoStream] Guest: fetching stream URL');
         const result = await guestService.getStreamUrl(
           lesson.id,
           phone,
           getPlaybackDeviceId(),
           controller.signal,
         );
         if (controller.signal.aborted) return;

         if (result.success && result.video_url) {
           videoUrl = result.video_url;
           isHls = result.is_hls || videoUrl.includes(".m3u8");
           console.log('[useVideoStream] Guest stream URL received:', {
             videoUrl: videoUrl.substring(0, 80),
             isHls,
             lesson_balance: result.lesson_balance,
           });
           if (result.lesson_balance !== undefined) {
             onMaxWatchTimeUpdate?.(result.lesson_balance);
           }
         } else {
            console.error('[useVideoStream] Guest: Failed to get video URL:', result.message);
            setError(new Error(result.message || "Failed to get video URL"));
            setIsLoading(false);
            return;
          }
        }

        // Set the stream URL (triggers initialization effect)
        setStreamUrl(videoUrl);
        setIsHlsStream(isHls);
        setIsLoading(false);
        console.log('[useVideoStream] State updated: streamUrl and isHlsStream set');
      } catch (err: any) {
        if (controller.signal.aborted) return;

        console.error('[useVideoStream] Error in fetchStreamUrl:', err);
        setError(err);
        onError?.(err);
        const responseError = err?.response?.data?.error;
        toast.error(
          typeof responseError === 'string'
            ? responseError
            : err instanceof Error
              ? err.message
              : 'Failed to get video URL'
        );
        setIsLoading(false);
      }
    };

    fetchStreamUrl();
    return () => controller.abort();
  }, [lesson.id, isSubscriber, phone, onError, onMaxWatchTimeUpdate, requestAttempt]);

    // Initialize video element after streamUrl is set and video element is available
    useEffect(() => {
      console.log('[useVideoStream] streamUrl changed:', streamUrl?.substring(0, 80));
      console.log('[useVideoStream] isHlsStream:', isHlsStream);
      console.log('[useVideoStream] videoRef.current exists:', !!videoRef.current);

      if (!streamUrl) {
        console.log('[useVideoStream] No stream URL yet, waiting...');
        return;
      }

      const initVideo = () => {
        if (initializedStreamUrlRef.current === streamUrl) return;

        console.log('[useVideoStream] initVideo called, videoRef.current:', !!videoRef.current);
        if (!videoRef.current) {
          console.error("Video element not available yet");
          return;
        }

        initializedStreamUrlRef.current = streamUrl;
        const video = videoRef.current;
        console.log('[useVideoStream] Video element found, current src:', video.src);

        if (isHlsStream) {
          if (Hls.isSupported()) {
            console.log('[useVideoStream] Initializing HLS.js');
            initializeHls(streamUrl);
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            console.log('[useVideoStream] Using Safari native HLS');
            video.src = streamUrl;
          } else {
            console.error('[useVideoStream] HLS not supported');
            setError(new Error("HLS video streaming is not supported in your browser."));
            toast.error("Video format not supported. Try a different browser.");
          }
        } else {
          console.log('[useVideoStream] Setting video.src for non-HLS');
          video.src = streamUrl;
          console.log('[useVideoStream] Video src set to:', video.src.substring(0, 100));
        }
      };

      // Try immediately
      if (videoRef.current) {
        console.log('[useVideoStream] videoRef.current exists immediately, calling initVideo');
        initVideo();
      } else {
        console.log('[useVideoStream] videoRef.current is null, starting poll loop');
        // Poll for video element
        const maxAttempts = 50;
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          console.log(`[useVideoStream] Poll attempt ${attempts}, videoRef.current:`, !!videoRef.current);
          if (videoRef.current) {
            clearInterval(interval);
            initVideo();
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error('[useVideoStream] Max polling attempts reached, video element not found');
            setError(new Error("Video player failed to initialize - element not found"));
          }
        }, 50);

        return () => clearInterval(interval);
      }
    }, [streamUrl, isHlsStream, initializeHls]);

   return {
    videoRef,
    streamUrl,
    isHlsStream,
    isLoading,
    availableQualities,
    selectedQuality,
    setSelectedQuality: handleQualityChange,
    refreshStreamUrl,
    cleanup,
    error,
    isRateLimited,
    retryAfter,
    retryStreamUrl,
  };
}

export default useVideoStream;
