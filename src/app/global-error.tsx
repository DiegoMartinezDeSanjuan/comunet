'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html lang="es" className="dark">
      <body className="bg-[hsl(222.2,84%,4.9%)] text-[hsl(210,40%,98%)] antialiased">
        <div className="flex min-h-screen items-center justify-center">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10">
              <svg
                className="h-10 w-10 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold">Error crítico</h1>
            <p className="mt-2 text-sm text-gray-400">
              Ha ocurrido un error inesperado en la aplicación.
            </p>

            {error.digest && (
              <p className="mt-3 font-mono text-xs text-gray-500">
                Ref: {error.digest}
              </p>
            )}

            <div className="mt-8">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
