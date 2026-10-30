import { type Lesson } from "@/services/guest";
import { BookOpenCheck } from "lucide-react";

interface VideoInfoProps {
  lesson: Lesson;
}

export function VideoInfo({ lesson }: VideoInfoProps) {
  return (
    <section aria-labelledby="lesson-video-title">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-sky-200">
        <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
        <span>Lesson video</span>
      </div>
      <h1 id="lesson-video-title" className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
        {lesson.title}
      </h1>
      {lesson.description ? (
        <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-300 sm:text-base">
          {lesson.description}
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Watch the lesson and follow along at your own pace.</p>
      )}
    </section>
  );
}

export default VideoInfo;
