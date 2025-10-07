import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZEN Platform',
  description: 'Plataforma de gestión empresarial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
