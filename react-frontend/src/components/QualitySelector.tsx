interface Quality {
  level: number;
  label: string;
  height: number;
  width: number;
}

interface QualitySelectorProps {
  qualities: Quality[];
  selectedQuality: number;
  onQualityChange: (level: number) => void;
}

export function QualitySelector({
  qualities,
  selectedQuality,
  onQualityChange,
}: QualitySelectorProps) {
  if (qualities.length <= 1) {
    return null;
  }

  return (
    <fieldset className="flex flex-wrap items-center gap-3" aria-label="Video quality">
      <legend className="sr-only">Video quality</legend>
      <span className="text-sm font-medium text-slate-300">Video quality</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose video quality">
        <button
          type="button"
          onClick={() => onQualityChange(-1)}
          aria-pressed={selectedQuality === -1}
          className={
            "min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 " +
            (selectedQuality === -1
              ? "border-sky-400 bg-sky-400/15 text-sky-200"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800")
          }
        >
          Auto
        </button>
        {qualities.map((q) => (
          <button
            key={q.level}
            type="button"
            onClick={() => onQualityChange(q.level)}
            aria-pressed={selectedQuality === q.level}
            aria-label={`Play at ${q.label}`}
            className={
              "min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 " +
              (selectedQuality === q.level
                ? "border-sky-400 bg-sky-400/15 text-sky-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800")
            }
          >
            {q.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default QualitySelector;
