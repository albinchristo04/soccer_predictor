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
  const bodyClassName = "min-h-screen premium-gradient text-primary transition-colors duration-300"
    
  return (
    <html lang="en">
      <body className={bodyClassName}>
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