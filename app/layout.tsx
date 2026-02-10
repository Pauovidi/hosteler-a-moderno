import React from "react"
import type { Metadata } from 'next'
import { Orbitron, Agdasima } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const orbitron = Orbitron({ 
  subsets: ["latin"],
  variable: '--font-display',
  display: 'swap',
});

const agdasima = Agdasima({ 
  subsets: ["latin"],
  weight: ['400', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Personalizados Hosteleria | Branding y Soluciones Integrales para Hosteleria y Agencias',
  description: 'Expertos en productos personalizados para hosteleria: cristaleria, vajilla, cuberteria, servilletas y textil. Entrega rapida y calidad premium europea.',
  generator: 'v0.app',
  keywords: ['hosteleria', 'personalizados', 'cristaleria', 'vajilla', 'cuberteria', 'servilletas', 'hoteles', 'HORECA'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${orbitron.variable} ${agdasima.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
