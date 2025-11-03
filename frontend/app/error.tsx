'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-payglobe-card px-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-payglobe-foreground">Something went wrong!</h2>
        <p className="text-payglobe-muted text-sm">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-4 py-2 bg-payglobe-primary text-white rounded-md hover:bg-payglobe-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
