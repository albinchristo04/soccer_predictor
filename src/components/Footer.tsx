'use client'

import Link from 'next/link'

export const Footer = () => {
  return (
    <footer className="bg-[var(--card-bg)] border-t border-[var(--border-color)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                <span className="text-xl">⚽</span>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Tarjeta Roja Soccer Predictor
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              AI-powered soccer match prediction and analysis
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Quick Links
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/upcoming" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                Leagues
              </Link>
              <Link href="/predict" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                Predict
              </Link>
              <Link href="/analytics" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                Analytics
              </Link>
              <Link href="/about" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                About
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Legal
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/privacy-policy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                Contact
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--text-tertiary)]">
              &copy; 2026 Tarjeta Roja Soccer Predictor. All Rights Reserved.
            </p>
            <p className="text-xs text-[var(--text-tertiary)] text-center">
              ⚠️ For educational and entertainment purposes only. Soccer outcomes are inherently unpredictable.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}