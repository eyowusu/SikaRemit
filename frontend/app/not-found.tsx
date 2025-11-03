export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-payglobe-card px-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-payglobe-foreground">Page Not Found</h2>
        <p className="text-payglobe-muted">Could not find the requested resource</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 bg-payglobe-primary text-white rounded-md hover:bg-payglobe-primary/90 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
