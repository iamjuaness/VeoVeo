import { Card, CardContent, CardHeader } from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";

export function RecommendationSkeleton() {
  return (
    <Card className="group border border-primary/10 bg-background/50 rounded-2xl overflow-hidden shadow-sm">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-3">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="w-20 h-28 rounded-xl shrink-0" />
            <div className="flex-1 py-1 space-y-2">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="border-t border-primary/5 pt-4 flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
