import { Skeleton } from "../../../shared/components/ui/skeleton";

export function SliderSkeleton() {
  return (
    <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl h-72 md:h-96 lg:h-[450px]">
      <Skeleton className="w-full h-full rounded-none" />
      {/* Overlay gradiente similar al Slider real */}
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-center items-start p-6 md:p-10 lg:p-12 pb-20 md:pb-24">
        <div className="max-w-3xl w-full space-y-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 bg-white/20" />
            <Skeleton className="h-6 w-24 bg-white/20" />
            <Skeleton className="h-6 w-12 bg-white/20" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-10 md:h-16 w-3/4 bg-white/20" />
            <Skeleton className="h-10 md:h-16 w-1/2 bg-white/20" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full md:w-2/3 bg-white/10" />
            <Skeleton className="h-4 w-5/6 md:w-1/2 bg-white/10" />
          </div>

          <Skeleton className="h-12 w-40 rounded-lg bg-white/30" />
        </div>
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        <Skeleton className="h-1.5 w-10 rounded-full bg-white/40" />
        <Skeleton className="h-1.5 w-6 rounded-full bg-white/20" />
        <Skeleton className="h-1.5 w-6 rounded-full bg-white/20" />
        <Skeleton className="h-1.5 w-6 rounded-full bg-white/20" />
      </div>
    </div>
  );
}
