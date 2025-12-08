'use client'

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t-4 border-green-500 py-6 mt-8 shadow-lg transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
            &copy; {new Date().getFullYear()} Ron Oshri Altshuler. All Rights Reserved.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Data source: <a href="https://fbref.com/en/" target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline font-semibold">FBRef</a> | Terms of Service Apply
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            ⚠️ This tool is for educational and entertainment purposes only. 
            Soccer outcomes are inherently unpredictable.
            The developer disclaims any responsibility for financial or betting outcomes.
          </p>
        </div>
      </div>
    </footer>
  )
}