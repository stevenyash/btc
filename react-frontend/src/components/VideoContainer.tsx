import type { RefObject } from "react";

interface VideoContainerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  title: string;
  poster?: string | null;
}

export function VideoContainer({ videoRef, title, poster }: VideoContainerProps) {
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        aria-label={`Lesson video: ${title}`}
        controls
        controlsList="nodownload"
        playsInline
        preload="none"
        poster={poster || undefined}
      />
    </div>
  );
}

export default VideoContainer;
