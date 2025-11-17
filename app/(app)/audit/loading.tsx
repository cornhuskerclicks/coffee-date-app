export default function AuditLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>
          <div className="h-10 w-32 bg-muted rounded" />
        </div>
        
        <div className="h-20 bg-muted rounded" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
