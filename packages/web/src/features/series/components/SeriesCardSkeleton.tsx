import { Card } from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";

export function SeriesCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden w-full h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="relative w-full aspect-2/3 overflow-hidden rounded-t-lg">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-1 mt-1 flex-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8 shrink-0" />
          <Skeleton className="h-8 w-8 shrink-0" />
        </div>
      </div>
    </Card>
  );
}
