/**
 * Generic full-page loading skeleton shown while a lazy route chunk
 * or its initial data is loading. Keeps layout stable and gives
 * screen readers a clear "busy" state instead of a blank screen.
 */
export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex w-full flex-col gap-4 p-6"
    >
      <span className="sr-only">Loading page content…</span>
      <div className="h-8 w-1/3 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
