import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Tarjeta Roja Soccer Predictor',
  description: 'Privacy policy for Tarjeta Roja Soccer Predictor - how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-[var(--text-secondary)]">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 text-[var(--text-primary)]">
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Introduction</h2>
              <p className="mb-4">
                Welcome to Tarjeta Roja Soccer Predictor (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website tarjetarojaenvivo.live, including any other media form, media channel, mobile website, or mobile application related or connected thereto (collectively, the &quot;Site&quot;).
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-[var(--text-primary)]">Personal Information You Disclose to Us</h3>
              <p className="mb-4"><strong>We collect personal information that you voluntarily provide to us when you:</strong></p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Register for an account</li>
                <li>Log in with Google OAuth</li>
                <li>Save predictions or interact with our services</li>
                <li>Contact us via email or contact forms</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-[var(--text-primary)]">Information Automatically Collected</h3>
              <p className="mb-4"><strong>We automatically collect certain information when you visit, use, or navigate the Site:</strong></p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Log and Usage Data:</strong> Log data such as your IP address, browser type, operating system, access times, and pages viewed</li>
                <li><strong>Device Information:</strong> Device type, unique device identifiers, and mobile network information</li>
                <li><strong>Location Information:</strong> Approximate location information inferred from your IP address</li>
                <li><strong>Cookies and Similar Technologies:</strong> Cookies, web beacons, and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">How We Use Your Information</h2>
              <p className="mb-4">We use personal information collected via our Site for business purposes, including:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>To facilitate account creation and authentication</li>
                <li>To provide and maintain our services</li>
                <li>To save and track your predictions</li>
                <li>To send administrative information</li>
                <li>To respond to your inquiries and offer support</li>
                <li>To analyze usage patterns and improve our services</li>
                <li>To detect and prevent fraud and security issues</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Third-Party Services</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-[var(--text-primary)]">Google Services</h3>
              <p className="mb-4">
                We use Google OAuth for authentication and Google Analytics for site analytics. These services may collect information about your use of our Site.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-[var(--text-primary)]">Advertising Partners</h3>
              <p className="mb-4">
                We may use third-party advertising companies to serve ads when you visit our Site. These companies may use information about your visits to our Site and other websites to provide advertisements about goods and services of interest to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Cookies and Tracking Technologies</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to track activity on our Site and hold certain information. Cookies are files with small amounts of data which may include an anonymous unique identifier.
              </p>
              <p className="mb-4">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational security measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Your Privacy Rights</h2>
              <p className="mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we process your data</li>
                <li><strong>Right to Data Portability:</strong> Obtain and reuse your data</li>
                <li><strong>Right to Object:</strong> Object to processing of your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Contact Us</h2>
              <p className="mb-4">
                If you have questions or comments about this privacy policy, you may email us at:{' '}
                <a href="mailto:privacy@tarjetarojaenvivo.live" className="text-[var(--accent-primary)] hover:underline">
                  privacy@tarjetarojaenvivo.live
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}