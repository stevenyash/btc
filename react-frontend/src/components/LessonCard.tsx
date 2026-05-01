import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Clock, Play, CreditCard } from "lucide-react";
import type { Lesson } from "@/services/guest";

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
  return (
    <Card key={lesson.id} className="overflow-hidden">
      <div className="aspect-video bg-slate-100 relative">
        {lesson.thumbnail_url ? (
          <img
            src={lesson.thumbnail_url}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-slate-400" />
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
