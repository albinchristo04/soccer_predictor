import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto text-center py-12 animate-fade-in">
      <h1 className="text-5xl font-extrabold mb-6 text-primary">
        Welcome to Soccer Stats Predictor
      </h1>
      
      <div className="mb-12">
        <p className="text-2xl text-secondary mb-4">
          Your AI-powered assistant for analyzing soccer match outcomes
        </p>
        <p className="text-lg text-tertiary">
          Using advanced machine learning to predict match results based on historical data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Link href="/upcoming" className="block group">
          <div className="card-professional p-8 rounded-2xl h-full flex flex-col backdrop-blur-sm bg-card">
            <h2 className="text-3xl font-bold mb-4 text-primary flex items-center justify-center whitespace-nowrap group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              📅 Upcoming Matches
            </h2>
            <p className="text-lg text-secondary">Get predictions for upcoming matches in major leagues</p>
          </div>
        </Link>
        <Link href="/predict?mode=head-to-head" className="block group">
          <div className="card-professional p-8 rounded-2xl h-full flex flex-col backdrop-blur-sm bg-card">
            <h2 className="text-3xl font-bold mb-4 text-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              🏠 Head-to-Head
            </h2>
            <p className="text-lg text-secondary">Compare teams within the same league and get detailed match predictions</p>
          </div>
        </Link>
        <Link href="/predict?mode=cross-league" className="block group">
          <div className="card-professional p-8 rounded-2xl h-full flex flex-col backdrop-blur-sm bg-card">
            <h2 className="text-3xl font-bold mb-4 text-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              🌍 Cross-League
            </h2>
            <p className="text-lg text-secondary">Analyze hypothetical matchups between teams from different leagues</p>
          </div>
        </Link>
      </div>

      <div className="glass-effect p-8 rounded-2xl shadow-card-lg border-l-4 border-brand-500">
        <h2 className="text-2xl font-semibold mb-4 text-primary">⚠️ Disclaimer</h2>
        <p className="text-secondary">
          This tool is for educational and entertainment purposes only.
          Predictions are based on historical data and should not be used for betting.
        </p>
      </div>
    </div>
  )
}