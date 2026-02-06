import PredictionTracker from '@/components/tracking/PredictionTracker'

export default function TrackingPage() {
  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            📊 Prediction Tracking
          </h1>
          <p className="text-[var(--text-secondary)]">
            Track model accuracy and learn from results
          </p>
        </div>

        {/* Tracker Component */}
        <PredictionTracker />

        {/* Info Card */}
        <div className="mt-8 p-4 bg-[var(--muted-bg)] rounded-xl">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-[var(--text-primary)] mb-1">1. Predictions Made</p>
              <p className="text-[var(--text-tertiary)]">
                Every match prediction is stored with probabilities and confidence levels
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)] mb-1">2. Results Tracked</p>
              <p className="text-[var(--text-tertiary)]">
                After matches complete, actual outcomes are recorded and compared
              </p>
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)] mb-1">3. Model Learns</p>
              <p className="text-[var(--text-tertiary)]">
                Accuracy metrics feed back into the model to improve future predictions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Prediction Tracking | Tarjeta Roja Soccer Predictor',
  description: 'Track prediction accuracy and model performance over time',
}
