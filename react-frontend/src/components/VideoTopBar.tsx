import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Clock } from "lucide-react";

interface VideoTopBarProps {
  isSubscriber: boolean;
  lessonBalance?: number;
  remainingTime: number;
  progressPercent: number;
  formatTime: (seconds: number) => string;
  onClose: () => void;
}

export function VideoTopBar({
  isSubscriber,
  lessonBalance,
  remainingTime,
  progressPercent,
  formatTime,
  onClose,
}: VideoTopBarProps) {
  return (
    <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-white hover:bg-slate-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lessons
      </Button>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isSubscriber ? (
            <Zap className="h-4 w-4 text-yellow-400" />
          ) : (
            <Clock className="h-4 w-4 text-yellow-400" />
          )}
          <span className="text-sm">
            {formatTime(remainingTime)} remaining
            {isSubscriber && lessonBalance !== undefined
              ? ` (${lessonBalance} credits)`
              : null}
          </span>
        </div>
        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{
              width: isSubscriber
                ? remainingTime > 0
                  ? `${progressPercent}%`
                  : "0%"
                : `${100 - progressPercent}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default VideoTopBar;
