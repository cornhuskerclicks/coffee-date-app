export default function AuditBuilderLoading() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Loading audit builder...</p>
      </div>
    </div>
  )
}
