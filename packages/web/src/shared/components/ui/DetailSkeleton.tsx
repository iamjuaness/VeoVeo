import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <div className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
        
        <div className="absolute top-6 left-6 z-20">
          <Skeleton className="h-10 w-24 rounded-lg bg-white/10" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 z-10">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster Skeleton */}
              <Skeleton className="hidden md:block w-[250px] h-[375px] rounded-2xl shrink-0 border-4 border-white/10 bg-white/5" />
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-20 rounded-full bg-white/10" />
                  <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
                  <Skeleton className="h-8 w-16 rounded-full bg-white/10" />
                </div>
                <Skeleton className="h-12 md:h-16 w-3/4 md:w-1/2 bg-white/20" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-2/3 bg-white/10" />
                </div>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Skeleton className="h-12 w-40 rounded-xl bg-white/15" />
                  <Skeleton className="h-12 w-40 rounded-xl bg-white/15" />
                  <Skeleton className="h-12 w-40 rounded-xl bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <Skeleton className="w-20 h-20 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="py-4 rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
