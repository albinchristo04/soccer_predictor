import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PageLoader } from '@/components/PageLoader'
import { ThemeProvider } from '@/providers/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Soccer Stats Predictor',
  description: 'AI-powered soccer match prediction and analysis',
  icons: {
    icon: '/soccer-ball.png',
  },
}

// Script to prevent flash of wrong theme
const themeScript = `
  (function() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
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
      </body>
    </html>
  )
}