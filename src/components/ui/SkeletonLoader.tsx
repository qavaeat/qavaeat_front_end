

import { cn } from "@/lib/utils";

// ─── primitive pulse block ────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/20 before:to-transparent",
        className,
      )}
    />
  );
}

// ─── row variant (menu / meal-plan list) ─────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 sm:px-5 py-4 border-b border-border last:border-0">
      {/* thumbnail */}
      <Shimmer className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0" />

      {/* text block */}
      <div className="flex-1 space-y-2 min-w-0">
        <Shimmer className="h-3.5 w-2/5 rounded-full" />
        <Shimmer className="h-2.5 w-3/4 rounded-full" />
        <div className="flex gap-1.5 mt-1">
          <Shimmer className="h-4 w-14 rounded-full" />
          <Shimmer className="h-4 w-14 rounded-full" />
        </div>
      </div>

      {/* price + actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <Shimmer className="h-4 w-20 rounded-full" />
        <Shimmer className="h-4 w-16 rounded-full" />
        <div className="flex gap-1">
          <Shimmer className="h-6 w-6 rounded-md" />
          <Shimmer className="h-6 w-6 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ─── card variant ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-3 bg-background">
      <Shimmer className="w-full h-36 rounded-xl" />
      <Shimmer className="h-3.5 w-3/5 rounded-full" />
      <Shimmer className="h-2.5 w-4/5 rounded-full" />
      <div className="flex justify-between items-center pt-1">
        <Shimmer className="h-4 w-20 rounded-full" />
        <Shimmer className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// ─── stat variant (dashboard KPI cards) ───────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-5 space-y-3 bg-background">
      <div className="flex justify-between items-start">
        <Shimmer className="h-3 w-24 rounded-full" />
        <Shimmer className="h-8 w-8 rounded-xl" />
      </div>
      <Shimmer className="h-7 w-28 rounded-full" />
      <Shimmer className="h-2.5 w-16 rounded-full" />
    </div>
  );
}

// ─── table-row variant ────────────────────────────────────────────────────────
function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
      <Shimmer className="h-3 w-20 rounded-full" />
      <Shimmer className="h-3 flex-1 rounded-full" />
      <Shimmer className="h-3 w-16 rounded-full" />
      <Shimmer className="h-3 w-12 rounded-full" />
      <div className="flex gap-1 ml-auto">
        <Shimmer className="h-6 w-6 rounded-md" />
        <Shimmer className="h-6 w-6 rounded-md" />
      </div>
    </div>
  );
}

// ─── public component ─────────────────────────────────────────────────────────
type SkeletonVariant = "row" | "card" | "stat" | "table";

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  /** Extra classes on the wrapper */
  className?: string;
}

export function SkeletonLoader({
  variant = "row",
  count = 5,
  className,
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
          className,
        )}
      >
        {items.map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-4 gap-4",
          className,
        )}
      >
        {items.map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  // row / table share a list wrapper
  return (
    <div
      className={cn(
        "bg-background rounded-2xl border border-border overflow-hidden shadow-sm",
        className,
      )}
    >
      {items.map((_, i) =>
        variant === "table" ? (
          <TableRowSkeleton key={i} />
        ) : (
          <RowSkeleton key={i} />
        ),
      )}
    </div>
  );
}