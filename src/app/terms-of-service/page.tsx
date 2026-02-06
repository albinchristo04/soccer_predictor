import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Tarjeta Roja Soccer Predictor',
  description: 'Terms of Service for Tarjeta Roja Soccer Predictor - your rights and responsibilities when using our services.',
}

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-[var(--text-secondary)]">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 text-[var(--text-primary)]">
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Agreement to Terms</h2>
              <p className="mb-4">
                These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;) and Tarjeta Roja Soccer Predictor (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), concerning your access to and use of the website tarjetarojaenvivo.live as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the &quot;Site&quot;).
              </p>
              <p>
                You agree that by accessing the Site, you have read, understood, and agreed to be bound by all of these Terms of Service. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND YOU MUST DISCONTINUE USE IMMEDIATELY.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Intellectual Property Rights</h2>
              <p className="mb-4">
                Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the &quot;Content&quot;) and the trademarks, service marks, and logos contained therein (the &quot;Marks&quot;) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of the United States, foreign jurisdictions, and international conventions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">User Representations</h2>
              <p className="mb-4">
                By using the Site, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>All registration information you submit will be true, accurate, current, and complete</li>
                <li>You will maintain the accuracy of such information and promptly update such registration information as necessary</li>
                <li>You have the legal capacity and you agree to comply with these Terms of Service</li>
                <li>You are not a minor in the jurisdiction in which you reside</li>
                <li>You will not access the Site through automated or non-human means</li>
                <li>You will not use the Site for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Prohibited Activities</h2>
              <p className="mb-4">
                You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
              </p>
              <p className="mb-4">As a user of the Site, you agree not to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us</li>
                <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information</li>
                <li>Circumvent, disable, or otherwise interfere with security-related features of the Site</li>
                <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Site</li>
                <li>Use any information obtained from the Site in order to harass, abuse, or harm another person</li>
                <li>Make improper use of our support services or submit false reports of abuse or misconduct</li>
                <li>Use the Site in a manner inconsistent with any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">User Generated Contributions</h2>
              <p className="mb-4">
                The Site may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Site, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, &quot;Contributions&quot;).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Site Management</h2>
              <p className="mb-4">
                We reserve the right, but not the obligation, to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Monitor the Site for violations of these Terms of Service</li>
                <li>Take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms of Service</li>
                <li>In our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof</li>
                <li>In our sole discretion and without limitation, notice, or liability, to remove from the Site or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Term and Termination</h2>
              <p className="mb-4">
                These Terms of Service shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS OF SERVICE OR OF ANY APPLICABLE LAW OR REGULATION.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Modifications and Interruptions</h2>
              <p className="mb-4">
                We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We also reserve the right to modify or discontinue all or part of the Site without notice at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Governing Law</h2>
              <p>
                These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of the State of [Your State/Country] applicable to agreements made and to be entirely performed within the State of [Your State/Country], without regard to its conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Disclaimer</h2>
              <p>
                THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Limitations of Liability</h2>
              <p>
                IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SITE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Contact Us</h2>
              <p>
                In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:{' '}
                <a href="mailto:support@tarjetarojaenvivo.live" className="text-[var(--accent-primary)] hover:underline">
                  support@tarjetarojaenvivo.live
                </a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}