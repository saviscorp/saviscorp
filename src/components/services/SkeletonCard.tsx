export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-video w-full bg-surface-gray" />

      {/* Body */}
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-surface-gray rounded w-3/4" />
        <div className="h-3 bg-surface-gray rounded w-1/2" />
        <div className="h-3 bg-surface-gray rounded w-1/3" />
      </div>
    </div>
  )
}
