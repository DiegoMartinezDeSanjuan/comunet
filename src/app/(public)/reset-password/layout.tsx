import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear nueva contraseña | COMUNET',
  referrer: 'no-referrer',
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
