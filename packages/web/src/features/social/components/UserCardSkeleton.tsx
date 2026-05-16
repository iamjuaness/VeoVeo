import { Card, CardContent } from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";

export function UserCardSkeleton() {
  return (
    <Card className="group relative border border-primary/5 bg-background/50 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Skeleton className="w-14 h-14 rounded-full" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="mt-6 pt-4 border-t border-primary/5 flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
