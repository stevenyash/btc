import { type Lesson } from "@/services/guest";

interface VideoInfoProps {
  lesson: Lesson;
}

export function VideoInfo({ lesson }: VideoInfoProps) {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
      <p className="text-slate-400">{lesson.description || "No description"}</p>
    </div>
  );
}

export default VideoInfo;
