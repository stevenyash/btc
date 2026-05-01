import { useState, useMemo } from "react";

interface UseMaxWatchTimeOptions {
  initialMaxWatchTime: number;
}

interface UseMaxWatchTimeReturn {
  maxWatchTime: number;
  setMaxWatchTime: (time: number) => void;
  remainingTime: number;
  progressPercent: number;
}

export function useMaxWatchTime({
  initialMaxWatchTime,
}: UseMaxWatchTimeOptions): UseMaxWatchTimeReturn {
  const [maxWatchTime, setMaxWatchTime] = useState(initialMaxWatchTime);

  const remainingTime = useMemo(() => Math.max(0, maxWatchTime), [maxWatchTime]);

  const progressPercent = useMemo(() => {
    return maxWatchTime > 0 ? (remainingTime / maxWatchTime) * 100 : 0;
  }, [maxWatchTime, remainingTime]);

  return {
    maxWatchTime,
    setMaxWatchTime,
    remainingTime,
    progressPercent,
  };
}

export default useMaxWatchTime;
