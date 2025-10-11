'use client'

import { useState } from 'react'
import ReCAPTCHA from "react-google-recaptcha"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [captchaValue, setCaptchaValue] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    
    try {
      // Here you would typically send the form data to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

      <div className="bg-secondary p-6 rounded-lg">
        {status === 'success' ? (
          <div className="text-center py-8">
            <p className="text-accent text-xl mb-4">Message sent successfully!</p>
            <p>We'll get back to you as soon as possible.</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 px-6 py-2 bg-accent text-black rounded hover:bg-accent/90"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 bg-background rounded border border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 bg-background rounded border border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-2 bg-background rounded border border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2 bg-background rounded border border-gray-700 h-32"
                required
              />
            </div>

            <div className="flex justify-center mb-6">
              <ReCAPTCHA
                sitekey="6Lcvi-YrAAAAAHetw2Q8-Gmoa2ZS9Rkg7zTNze5K"
                onChange={(value) => setCaptchaValue(value)}
                theme="dark"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending' || !captchaValue}
              className="w-full px-6 py-3 bg-accent text-black rounded hover:bg-accent/90 disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'error' && (
              <p className="text-red-500 text-center">
                There was an error sending your message. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}