export default function RadarSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar px-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="min-w-[160px] animate-pulse">
          <div className="aspect-[2/3] bg-surface border-4 border-brutal-border brutal-shadow mb-3" />
          <div className="h-4 bg-surface-2 border-2 border-brutal-border w-3/4 mb-2" />
          <div className="h-3 bg-surface-2 border-2 border-brutal-border w-1/2" />
        </div>
      ))}
    </div>
  );
}
