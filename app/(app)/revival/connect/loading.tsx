export default function ConnectLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    </div>
  )
}
