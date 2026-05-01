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
    <div className="flex items-center justify-center gap-2 py-3">
      <span className="text-sm text-slate-400">Quality:</span>
      <div className="flex gap-1">
        <button
          onClick={() => onQualityChange(-1)}
          className={
            "px-3 py-1 text-sm rounded " +
            (selectedQuality === -1
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600")
          }
        >
          Auto
        </button>
        {qualities.map((q) => (
          <button
            key={q.level}
            onClick={() => onQualityChange(q.level)}
            className={
              "px-3 py-1 text-sm rounded " +
              (selectedQuality === q.level
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600")
             }
           >
             {q.label}
           </button>
        ))}
      </div>
    </div>
  );
}

export default QualitySelector;
