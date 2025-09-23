
import Link from 'next/link';
import { getSeasons } from '@/lib/data';

export default function Navbar() {
  const seasons = getSeasons();

  return (
    <header style={{ backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1280px', margin: '0 auto', padding: '1rem', color: '#F5F5DC' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
          Premier League Stats
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/" className="nav-link">Home</Link>
          <div className="relative group">
            <span style={{ cursor: 'pointer' }} className="nav-link">Seasons</span>
            <div className="absolute hidden group-hover:block mt-2 max-h-32 overflow-y-auto z-10">
              {seasons.map(season => (
                <Link key={season} href={`/seasons/${season.replace('/', '-')}`} className="block py-1 nav-link">
                  {season}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/prediction" className="nav-link">Prediction</Link>
        </div>
      </nav>
    </header>
  );
}
