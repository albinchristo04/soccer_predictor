'use client';

import Link from 'next/link';



  export default function Navbar() {
  return (
    <header style={{ backgroundColor: '#121212', borderBottom: '1px solid rgba(245, 245, 220, 0.5)' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', margin: '0 auto', padding: '1rem', color: '#F5F5DC', boxSizing: 'border-box' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
          Soccer Stats
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: 'auto', marginRight: '1rem', flexShrink: 1 }}>
          <Link href="/" className="nav-link">Home</Link>
          <div className="relative group">
            <span style={{ cursor: 'pointer' }} className="nav-link">Leagues</span>
            <div className="absolute hidden group-hover:block mt-8 z-50 bg-gray-800 border border-gray-700 rounded-md w-80">
              <Link href="/leagues/premier-league" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>Premier League</Link>
              <Link href="/leagues/champions-league" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>Champions League</Link>
              <Link href="/leagues/laliga" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>LaLiga</Link>
              <Link href="/leagues/fifa-world-cup" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>FIFA World Cup</Link>
              <Link href="/leagues/bundesliga" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>Bundesliga</Link>
              <Link href="/leagues/mls" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>MLS</Link>
              <Link href="/leagues/serie-a" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>Serie A</Link>
              <Link href="/leagues/europa-league" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>Europa League</Link>
              <Link href="/leagues/ligue-1" className="block py-1 nav-link" style={{ whiteSpace: 'nowrap' }}>Ligue 1</Link>
            </div>
          </div>
          <Link href="/prediction" className="nav-link">Prediction</Link>
        </div>
      </nav>
    </header>
  );
}
