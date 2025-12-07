'use client'

export const Footer = () => {
  return (
    <footer className="glass-effect border-t-2 border-brand-500 dark:border-brand-600 py-6 mt-8 shadow-card-lg transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-primary mb-2 font-medium">
            &copy; {new Date().getFullYear()} Ron Oshri Altshuler. All Rights Reserved.
          </p>
          <p className="text-sm text-secondary mb-2">
            Data source: <a href="https://fbref.com/en/" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">FBRef</a> | Terms of Service Apply
          </p>
          <p className="text-xs text-tertiary">
            ⚠️ This tool is for educational and entertainment purposes only. 
            Soccer outcomes are inherently unpredictable.
            The developer disclaims any responsibility for financial or betting outcomes.
          </p>
        </div>
      </div>
    </footer>
  )
}