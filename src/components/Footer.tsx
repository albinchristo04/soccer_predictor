'use client'

export const Footer = () => {
  return (
    <footer className="bg-secondary py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">
            &copy; {new Date().getFullYear()} Ron Oshri Altshuler. All Rights Reserved.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Data source: <a href="https://fbref.com/en/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">FBRef</a> | Terms of Service Apply
          </p>
          <p className="text-xs text-gray-600">
            ⚠️ This tool is for educational and entertainment purposes only. 
            Soccer outcomes are inherently unpredictable.
            The developer disclaims any responsibility for financial or betting outcomes.
          </p>
        </div>
      </div>
    </footer>
  )
}