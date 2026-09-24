function Block({ className }: { className: string }) {
  return (
    <div className={`glass animate-pulse rounded-[22px] motion-reduce:animate-none ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading the overview" className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.6fr)]">
        {["a", "b", "c", "d", "e"].map((key) => (
          <Block key={key} className="h-[132px]" />
        ))}
      </div>
      <Block className="h-[180px]" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Block className="h-[520px]" />
        <div className="flex flex-col gap-6">
          <Block className="h-[240px]" />
          <Block className="h-[240px]" />
        </div>
      </div>
    </div>
  );
}
