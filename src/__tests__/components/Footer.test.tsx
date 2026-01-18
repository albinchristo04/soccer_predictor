import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/Footer'

describe('Footer', () => {
  it('renders the soccer predictor branding', () => {
    render(<Footer />)
    expect(screen.getByText('Soccer Predictor')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<Footer />)
    expect(screen.getByText('Leagues')).toBeInTheDocument()
    expect(screen.getByText('Predict')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('displays copyright information', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument()
  })

  it('shows data source attribution', () => {
    render(<Footer />)
    expect(screen.getByText('Powered by')).toBeInTheDocument()
    const fbrefLink = screen.getByRole('link', { name: /FBRef/i })
    expect(fbrefLink).toHaveAttribute('href', 'https://fbref.com/en/')
    expect(fbrefLink).toHaveAttribute('target', '_blank')
  })

  it('displays educational disclaimer', () => {
    render(<Footer />)
    expect(screen.getByText(/For educational and entertainment purposes only/i)).toBeInTheDocument()
  })
})
