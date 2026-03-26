'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { markNotificationReadAction } from '@/modules/notifications/server/actions'

export function MarkNotificationReadButton({
  notificationId,
}: {
  notificationId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await markNotificationReadAction(notificationId)
            toast({
              title: 'Notificacion leida',
              description: 'La notificacion se ha marcado como leida.',
            })
            router.refresh()
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : 'No se pudo actualizar la notificacion.'

            toast({
              title: 'Error',
              description: message,
              variant: 'destructive',
            })
          }
        })
      }}
    >
      {isPending ? 'Guardando...' : 'Marcar leida'}
    </Button>
  )
}
