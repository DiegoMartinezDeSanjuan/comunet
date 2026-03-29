import { requireAuth } from '@/lib/auth'
import { getCommunityDetails } from '@/modules/communities/server/service'
import { getOwners } from '@/modules/contacts/server/contact-service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { requirePermission } from '@/lib/permissions'
import { BoardPositionForm } from './board-form'

export const dynamic = 'force-dynamic'

export default async function CommunityBoardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  if (!requirePermission(session, 'communities.manage')) redirect('/communities')

  const { id } = await params
  const [community, allOwners] = await Promise.all([
    getCommunityDetails(id, session.officeId),
    getOwners(session.officeId)
  ])

  if (!community) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/communities/${community.id}`} 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Junta Directiva: {community.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Cargos y responsables actuales de la comunidad</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Miembros de la Junta</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Cargo</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Propietario / Persona</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Nombramiento</th>
              </tr>
            </thead>
            <tbody>
              {community.boardPositions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground">No hay cargos registrados actualmente.</td>
                </tr>
              ) : (
                community.boardPositions.map((pos: any) => (
                  <tr key={pos.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 font-semibold">{pos.role}</td>
                    <td className="p-4">
                      <Link href={`/owners/${pos.ownerId}`} className="text-primary hover:underline">{pos.owner.fullName}</Link>
                    </td>
                    <td className="p-4">{pos.startDate ? new Date(pos.startDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Nuevo Cargo</h2>
          <BoardPositionForm communityId={community.id} owners={allOwners.map((o: any) => ({id: o.id, fullName: o.fullName}))} />
        </div>
      </div>
    </div>
  )
}
