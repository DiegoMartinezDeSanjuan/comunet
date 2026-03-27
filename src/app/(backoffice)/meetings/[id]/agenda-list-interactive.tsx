'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  deleteAgendaItemAction,
  deleteVoteAction,
  recordVoteAction,
  reorderAgendaItemsAction,
} from '@/modules/meetings/server/actions'

const VOTE_LABELS: Record<string, string> = {
  FOR: 'A favor',
  AGAINST: 'En contra',
  ABSTAIN: 'Abstención',
}

type AgendaListProps = {
  meetingId: string
  canManage: boolean
  isClosed: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
}

export function AgendaListInteractive({ meetingId, canManage, isClosed, items }: AgendaListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [voteDialogItem, setVoteDialogItem] = useState<string | null>(null)

  const [voteValue, setVoteValue] = useState<'FOR' | 'AGAINST' | 'ABSTAIN'>('FOR')
  const [voteCoef, setVoteCoef] = useState(0)

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Error inesperado.'
    toast({ title: 'Error', description: message, variant: 'destructive' })
  }

  const moveItem = (index: number, direction: 'UP' | 'DOWN') => {
    if (isPending || isClosed) return

    const newItems = [...items]
    const targetIndex = direction === 'UP' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newItems.length) return

    const temp = newItems[index].sortOrder
    newItems[index].sortOrder = newItems[targetIndex].sortOrder
    newItems[targetIndex].sortOrder = temp

    startTransition(async () => {
      try {
        await reorderAgendaItemsAction({
          meetingId,
          items: newItems.map((item) => ({ id: item.id, sortOrder: item.sortOrder })),
        })
        router.refresh()
      } catch (e) {
        handleError(e)
      }
    })
  }

  const handleDelete = (itemId: string) => {
    if (!confirm('¿Eliminar este punto? Se borrarán sus votos asociados.')) return
    startTransition(async () => {
      try {
        await deleteAgendaItemAction({ meetingId, agendaItemId: itemId })
        router.refresh()
      } catch (e) {
        handleError(e)
      }
    })
  }

  const handleAddVote = (itemId: string) => {
    startTransition(async () => {
      try {
        await recordVoteAction({
          meetingId,
          agendaItemId: itemId,
          vote: voteValue,
          coefficientWeight: voteCoef,
        })
        setVoteDialogItem(null)
        setVoteCoef(0)
        router.refresh()
      } catch (e) {
        handleError(e)
      }
    })
  }

  const handleDeleteVote = (voteId: string) => {
    if (!confirm('¿Eliminar voto?')) return
    startTransition(async () => {
      try {
        await deleteVoteAction({ meetingId, voteId })
        router.refresh()
      } catch (e) {
        handleError(e)
      }
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Todavía no se han definido puntos para esta reunión.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <article key={item.id} className="rounded-md border p-4 bg-white relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-lg">
                {item.sortOrder}. {item.title}
              </h3>
              {item.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
            {canManage && !isClosed && (
              <div className="flex flex-col gap-1 items-end">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === 0 || isPending}
                    onClick={() => moveItem(index, 'UP')}
                    title="Subir"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === items.length - 1 || isPending}
                    onClick={() => moveItem(index, 'DOWN')}
                    title="Bajar"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(item.id)}
                    title="Eliminar"
                  >
                    ✗
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold">{item.votes.length} votos registrados</span>
            {canManage && !isClosed && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVoteDialogItem(item.id)}
              >
                + Añadir Voto
              </Button>
            )}
          </div>

          {voteDialogItem === item.id && (
            <div className="mt-4 border border-blue-200 bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-3">Registrar nuevo voto (Asistente no referenciado)</h4>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Sentido del voto</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                    value={voteValue}
                    onChange={(e) => setVoteValue(e.target.value as 'FOR' | 'AGAINST' | 'ABSTAIN')}
                  >
                    <option value="FOR">A favor</option>
                    <option value="AGAINST">En contra</option>
                    <option value="ABSTAIN">Abstención</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Coeficiente (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                    value={voteCoef}
                    onChange={(e) => setVoteCoef(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button size="sm" onClick={() => handleAddVote(item.id)} disabled={isPending}>
                  Guardar Voto
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setVoteDialogItem(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {item.votes.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Titular</th>
                    <th className="px-2 py-2 font-medium">Unidad</th>
                    <th className="px-2 py-2 font-medium">Voto</th>
                    <th className="px-2 py-2 font-medium">Coeficiente</th>
                    {canManage && !isClosed && <th className="px-2 py-2 font-medium w-16"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {item.votes.map((vote: any) => (
                    <tr key={vote.id}>
                      <td className="px-2 py-2">{vote.owner?.fullName || 'Genérico'}</td>
                      <td className="px-2 py-2">{vote.unit?.reference || '-'}</td>
                      <td className="px-2 py-2">{VOTE_LABELS[vote.vote] ?? vote.vote}</td>
                      <td className="px-2 py-2">{String(vote.coefficientWeight)}</td>
                      {canManage && !isClosed && (
                        <td className="px-2 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={() => handleDeleteVote(vote.id)}
                            disabled={isPending}
                          >
                            ✗
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
