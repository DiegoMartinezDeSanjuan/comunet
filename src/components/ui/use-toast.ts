'use client'

import { useState } from 'react'
export function useToast() {
  const [toasts] = useState<any[]>([])

  const toast = ({ title, description, variant, ...props }: any) => {
    // Basic mock implementation that alerts for errors
    if (variant === 'destructive' && typeof window !== 'undefined') {
      alert(`Error: ${title}\n${description || ''}`)
    } else {
      console.log('Toast:', { title, description, variant, ...props })
    }
  }

  return { toast, toasts }
}
