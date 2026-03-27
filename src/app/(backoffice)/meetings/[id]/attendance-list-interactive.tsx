'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  deleteAttendanceAction,
  recordAttendanceAction,
} from '@/modules/meetings/server/actions'

const ATTENDANCE_TYPE_LABELS: Record<string, string> = {
  IN_PERSON: 'Presencial',
  DELEGATED: 'Delegada',
  REMOTE: 'Remota',
}

type AttendanceListProps = {
  meetingId: string
  canManage: boolean
  isClosed: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attendances: any[]
}

export function AttendanceListInteractive({
  meetingId,
  canManage,
  isClosed,
  attendances,
}: AttendanceListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [isAdding, setIsAdding] = useState(false)
  const [attendeeName, setAttendeeName] = useState('')
  const [coefficient, setCoefficient] = useState<number>(0)
  const [attType, setAttType] = useState<'IN_PERSON' | 'DELEGATED' | 'REMOTE'>('IN_PERSON')

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Error inesperado.'
    toast({ title: 'Error', description: message, variant: 'destructive' })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar asistente?')) return
    startTransition(async () => {
      try {
        await deleteAttendanceAction({ meetingId, attendanceId: id })
        router.refresh()
      } catch (e) {
        handleError(e)
      }
    })
  }

  const handleAdd = () => {
    if (!attendeeName.trim()) {
      toast({ title: 'Atención', description: 'Debe ingresar un nombre.', variant: 'default' })
      return
    }
    
    startTransition(async () => {
      try {
        await recordAttendanceAction({
          meetingId,
          attendeeName,
          coefficientPresent: coefficient,
          attendanceType: attType,
        })
        setIsAdding(false)
        setAttendeeName('')
        setCoefficient(0)
        setAttType('IN_PERSON')
        router.refresh()
      } catch (e) {
        handleError(e)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Relación de asistentes cargados y tipo de presencia o representación.
        </p>
        {canManage && !isClosed && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? 'Cancelar' : '+ Añadir Asistente'}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-md border bg-muted/30 p-4 mb-4 grid gap-4 md:grid-cols-4 items-end">
          <div className="space-y-2 col-span-2">
            <label className="text-xs font-semibold">Nombre del asistente</label>
            <Input
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold">Tipo</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={attType}
                onChange={(e) => setAttType(e.target.value as 'IN_PERSON' | 'DELEGATED' | 'REMOTE')}
              >
              <option value="IN_PERSON">Presencial</option>
              <option value="DELEGATED">Delegada</option>
              <option value="REMOTE">Remota</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold">Coeficiente (%)</label>
            <Input
              type="number"
              step="0.01"
              value={coefficient}
              onChange={(e) => setCoefficient(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="col-span-1 md:col-span-4 flex justify-end">
            <Button onClick={handleAdd} disabled={isPending}>
              Guardar Asistencia
            </Button>
          </div>
        </div>
      )}

      {attendances.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Aún no hay asistentes registrados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="px-2 py-2 font-medium">Asistente</th>
                <th className="px-2 py-2 font-medium">Titular (Vinculado)</th>
                <th className="px-2 py-2 font-medium">Unidad</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 font-medium">Coeficiente</th>
                {canManage && !isClosed && <th className="px-2 py-2 font-medium" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendances.map((attendance) => (
                <tr key={attendance.id}>
                  <td className="px-2 py-2">{attendance.attendeeName}</td>
                  <td className="px-2 py-2">{attendance.owner?.fullName || '-'}</td>
                  <td className="px-2 py-2">{attendance.unit?.reference || '-'}</td>
                  <td className="px-2 py-2">
                    {ATTENDANCE_TYPE_LABELS[attendance.attendanceType] ?? attendance.attendanceType}
                  </td>
                  <td className="px-2 py-2">{String(attendance.coefficientPresent)}</td>
                  {canManage && !isClosed && (
                    <td className="px-2 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-6 w-6 p-0"
                        disabled={isPending}
                        onClick={() => handleDelete(attendance.id)}
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
      )}
    </div>
  )
}
