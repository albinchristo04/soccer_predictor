import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PageLoader } from '@/components/PageLoader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Soccer Stats Predictor',
  description: 'AI-powered soccer match prediction and analysis',
  icons: {
    icon: '/soccer-ball.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider>
          <Suspense fallback={null}>
            <PageLoader />
          </Suspense>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}