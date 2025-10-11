import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-6">
        Welcome to Soccer Stats Predictor
      </h1>
      
      <div className="mb-8">
        <p className="text-xl mb-4">
          Your AI-powered assistant for analyzing soccer match outcomes
        </p>
        <p className="text-secondary">
          Using advanced machine learning to predict match results based on historical data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Link href="/predict?mode=head-to-head" className="block">
          <div className="bg-secondary p-6 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer border border-transparent hover:border-accent">
            <h2 className="text-2xl font-semibold mb-4">🏠 Head-to-Head</h2>
            <p>Compare teams within the same league and get detailed match predictions</p>
          </div>
        </Link>
        <Link href="/predict?mode=cross-league" className="block">
          <div className="bg-secondary p-6 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer border border-transparent hover:border-accent">
            <h2 className="text-2xl font-semibold mb-4">🌍 Cross-League</h2>
            <p>Analyze hypothetical matchups between teams from different leagues</p>
          </div>
        </Link>
      </div>

      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">⚠️ Disclaimer</h2>
        <p className="text-secondary">
          This tool is for educational and entertainment purposes only.
          Predictions are based on historical data and should not be used for betting.
        </p>
      </div>
    </div>
  )
}