import type { RefObject } from "react";

interface VideoContainerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export function VideoContainer({ videoRef }: VideoContainerProps) {
  return (
    <div className="aspect-video bg-black max-w-5xl mx-auto">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        playsInline
        autoPlay
      />
    </div>
  );
}

export default VideoContainer;
