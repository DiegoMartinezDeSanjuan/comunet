import { FileQuestion, Home } from 'lucide-react'
import Link from 'next/link'

export default function PortalNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        <h2 className="text-xl font-bold text-foreground">
          Recurso no encontrado
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El elemento que buscas no existe o ha sido eliminado.
        </p>

        <div className="mt-6">
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            Inicio portal
          </Link>
        </div>
      </div>
    </div>
  )
}
