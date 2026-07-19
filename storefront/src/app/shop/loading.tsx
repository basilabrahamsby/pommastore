export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="border-b border-neutral-100 px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-7 w-32 bg-neutral-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="h-3 w-24 bg-neutral-100 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-3 w-full bg-neutral-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Product grid skeleton */}
        <div className="flex-1">
          {/* Sort bar skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-4 w-28 bg-neutral-100 rounded animate-pulse" />
            <div className="h-8 w-36 bg-neutral-100 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="group">
                {/* Image skeleton */}
                <div
                  className="aspect-[3/4] bg-neutral-100 rounded animate-pulse mb-3"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
                {/* Brand name */}
                <div className="h-2.5 w-16 bg-neutral-100 rounded animate-pulse mb-1.5" style={{ animationDelay: `${i * 60}ms` }} />
                {/* Product name */}
                <div className="h-3.5 w-full bg-neutral-100 rounded animate-pulse mb-1" style={{ animationDelay: `${i * 60}ms` }} />
                <div className="h-3.5 w-3/4 bg-neutral-100 rounded animate-pulse mb-2" style={{ animationDelay: `${i * 60}ms` }} />
                {/* Price */}
                <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
