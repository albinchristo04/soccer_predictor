'use client'

export const Footer = () => {
  return (
    <footer className="bg-secondary py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-secondary mb-2">
            Data source: FBRef | Terms of Service Apply
          </p>
          <p className="text-xs text-secondary">
            ⚠️ This tool is for educational and entertainment purposes only. 
            Soccer outcomes are inherently unpredictable.
            The developer disclaims any responsibility for financial or betting outcomes.
          </p>
        </div>
      </div>
    </footer>
  )
}