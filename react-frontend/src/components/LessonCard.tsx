import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, CreditCard, ImageOff } from "lucide-react";
import type { Lesson } from "@/services/guest";
import { useState, useEffect, useRef } from "react";
import { publicApi } from "@/services/api";

export interface LessonCardProps {
  lesson: Lesson;
  isSubscriber: boolean;
  lessonBalance: number;
  watchDuration: number;
  price: number;
  isPurchased?: boolean;
  onWatch: () => void;
}

export function LessonCard({
  lesson,
  isSubscriber,
  lessonBalance,
  watchDuration,
  price,
  isPurchased = false,
  onWatch,
}: LessonCardProps) {
  const [imgError, setImgError] = useState(false);
  const [signedThumbUrl, setSignedThumbUrl] = useState<string | null>(null);
  const [loadingSignedThumb, setLoadingSignedThumb] = useState(false);
  const thumbCache = useRef(new Map<string, string>());

  useEffect(() => {
    const bunnyVideoId = lesson.bunny_video_id;

    if (!bunnyVideoId) {
      return;
    }

    const cached = thumbCache.current.get(bunnyVideoId);
    if (cached) {
      setSignedThumbUrl(cached);
      return;
    }

    setLoadingSignedThumb(true);
    publicApi.get(`/bunny/thumbnail/${bunnyVideoId}/0`)
      .then(res => {
        if (res.data?.signedUrl) {
          thumbCache.current.set(bunnyVideoId, res.data.signedUrl);
          setSignedThumbUrl(res.data.signedUrl);
        } else {
          setSignedThumbUrl(null);
        }
      })
      .catch(err => {
        console.error("Failed to fetch signed thumbnail:", err);
        setSignedThumbUrl(null);
      })
      .finally(() => setLoadingSignedThumb(false));
  }, [lesson.bunny_video_id]);

  const thumbToShow = signedThumbUrl || lesson.thumbnail_url;

  return (
    <Card key={lesson.id} className="overflow-hidden">
      <div className="aspect-video bg-slate-100 relative">
        {thumbToShow ? (
          <img
            src={thumbToShow}
            alt={lesson.title}
            crossOrigin="anonymous"
            referrerPolicy="origin"
            className="w-full h-full object-cover"
            onError={() => {
              console.error("[LessonCard] Image FAILED:", thumbToShow);
              setImgError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-2">
            <ImageOff className="h-10 w-10 text-slate-400" />
            {!lesson.bunny_video_id && (
              <span className="text-xs text-slate-400">No video ID</span>
            )}
            {lesson.bunny_video_id && loadingSignedThumb && (
              <span className="text-xs text-slate-400">Loading...</span>
            )}
            {!lesson.bunny_video_id && !lesson.thumbnail_url && (
              <span className="text-xs text-slate-400">No thumbnail URL</span>
            )}
            {imgError && thumbToShow && (
              <span className="text-xs text-red-500 font-medium">Image failed to load</span>
            )}
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-base">{lesson.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {lesson.description || "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {watchDuration} min watch time
          </div>
          {isSubscriber ? (
            <Button onClick={onWatch} disabled={lessonBalance <= 0}>
              <Play className="h-4 w-4 mr-1" />
              Watch Now
            </Button>
          ) : isPurchased ? (
            <Button onClick={onWatch}>
              <Play className="h-4 w-4 mr-1" />
              Watch Now
            </Button>
          ) : (
            <Button variant="secondary" onClick={onWatch}>
              <CreditCard className="h-4 w-4 mr-1" />
              Buy - KES {price}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LessonCard;
