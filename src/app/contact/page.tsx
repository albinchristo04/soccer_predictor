import Link from 'next/link'

export const metadata = {
  title: 'Contact Us | Tarjeta Roja Soccer Predictor',
  description: 'Contact Tarjeta Roja Soccer Predictor for support, feedback, or inquiries about our soccer prediction services.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[var(--accent-primary)] hover:opacity-80 transition-opacity mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Contact Us
          </h1>
          <p className="text-[var(--text-secondary)]">
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Get In Touch</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">📧 Email Support</h3>
                <p className="text-[var(--text-secondary)] mb-2">
                  For general inquiries and support:
                </p>
                <a 
                  href="mailto:support@tarjetarojaenvivo.live" 
                  className="text-[var(--accent-primary)] hover:underline break-all"
                >
                  support@tarjetarojaenvivo.live
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">🔒 Privacy Concerns</h3>
                <p className="text-[var(--text-secondary)] mb-2">
                  For privacy-related questions:
                </p>
                <a 
                  href="mailto:privacy@tarjetarojaenvivo.live" 
                  className="text-[var(--accent-primary)] hover:underline break-all"
                >
                  privacy@tarjetarojaenvivo.live
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">💡 Feedback & Suggestions</h3>
                <p className="text-[var(--text-secondary)] mb-2">
                  We value your input to improve our service:
                </p>
                <a 
                  href="mailto:feedback@tarjetarojaenvivo.live" 
                  className="text-[var(--accent-primary)] hover:underline break-all"
                >
                  feedback@tarjetarojaenvivo.live
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">🌐 Website</h3>
                <p className="text-[var(--text-secondary)] mb-2">
                  Visit our main website:
                </p>
                <a 
                  href="https://tarjetarojaenvivo.live" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-primary)] hover:underline"
                >
                  tarjetarojaenvivo.live
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">How accurate are your predictions?</h3>
                <p className="text-[var(--text-secondary)]">
                  Our predictions use advanced machine learning models combining team statistics, form data, and historical performance. While we strive for accuracy, soccer outcomes are inherently unpredictable.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">How often are predictions updated?</h3>
                <p className="text-[var(--text-secondary)]">
                  Predictions are updated regularly based on the latest team news, player availability, and statistical data. Live scores update in real-time during matches.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Do you cover all soccer leagues?</h3>
                <p className="text-[var(--text-secondary)]">
                  We cover major European leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) plus top competitions like Champions League and Europa League, with plans to expand coverage.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Is there a mobile app?</h3>
                <p className="text-[var(--text-secondary)]">
                  Our website is designed as a Progressive Web App (PWA) that can be installed on your mobile device for a native app-like experience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">About Tarjeta Roja Soccer Predictor</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Tarjeta Roja Soccer Predictor provides AI-powered soccer match predictions and real-time analysis using data from leading sources like ESPN and FotMob. Our platform helps fans make informed decisions about match outcomes while enjoying the beautiful game.
          </p>
          <p className="text-[var(--text-secondary)]">
            <strong>Disclaimer:</strong> This service is for entertainment and educational purposes only. Soccer outcomes are inherently unpredictable, and we make no guarantees about prediction accuracy. Please gamble responsibly.
          </p>
        </div>
      </div>
    </div>
  )
}