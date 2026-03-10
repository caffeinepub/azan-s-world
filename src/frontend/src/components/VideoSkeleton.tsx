import { Skeleton } from "@/components/ui/skeleton";

export function VideoSkeleton() {
  return (
    <div
      className="rounded-lg overflow-hidden bg-card"
      data-ocid="home.video.loading_state"
    >
      <Skeleton className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}
