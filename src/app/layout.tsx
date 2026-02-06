import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
})

export const metadata: Metadata = {
  title: {
    default: 'SalaryMM - Quản lý lương nhân viên',
    template: '%s | SalaryMM',
  },
  description: 'Hệ thống quản lý lương nhân viên cho doanh nghiệp Việt Nam',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  )
}
