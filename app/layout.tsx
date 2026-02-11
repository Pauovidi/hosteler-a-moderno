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

import { buildBaseMetadata } from '@/lib/seo'

// ... existing imports

export const metadata: Metadata = buildBaseMetadata()


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
