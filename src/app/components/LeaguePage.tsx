'use client';

import { useEffect, useState } from 'react';
import { fetchAllSeasons, fetchRankedSeasonStats } from '@/app/actions';
import { SeasonStats } from '@/lib/data';
import Image from 'next/image';

interface LeaguePageProps {
  leagueName: string;
  leagueLogo: string;
  leagueDescription: string;
  leagueUrl: string;
}

export default function LeaguePage({ leagueName, leagueLogo, leagueDescription, leagueUrl }: LeaguePageProps) {
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('---');
  const [seasonStats, setSeasonStats] = useState<SeasonStats[] | null>(null);

  useEffect(() => {
    async function loadSeasons() {
      console.log('Fetching seasons for league:', leagueName);
      const fetchedSeasons = await fetchAllSeasons(leagueName);
      console.log('Fetched seasons:', fetchedSeasons);
      setSeasons(fetchedSeasons);
    }
    loadSeasons();
  }, [leagueName]);

  const handleSeasonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const season = e.target.value;
    console.log('Selected season:', season);
    setSelectedSeason(season);
    if (season !== '---') {
      console.log('Fetching stats for league:', leagueName, 'season:', season);
      const stats = await fetchRankedSeasonStats(leagueName, season);
      console.log('Fetched season stats:', stats);
      setSeasonStats(stats);
    } else {
      setSeasonStats(null);
    }
  };

  console.log('Current seasonStats state:', seasonStats);

  return (
    <div style={{ padding: '2rem', color: '#F5F5DC' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#F5F5DC', borderRadius: '0.5rem', width: 'fit-content' }}>
        <Image
          src={leagueLogo}
          alt={`${leagueName} Logo`}
          width={30}
          height={30}
          style={{ marginRight: '0.5rem' }}
        />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#121212' }}>{leagueName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
      </div>

      <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
        {leagueDescription} For more information, visit the <a href={leagueUrl} target="_blank" rel="noopener noreferrer" className="league-link">official {leagueName} website</a>.
      </p>

      <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Explore Seasons</h2>
      <select
        value={selectedSeason}
        onChange={handleSeasonChange}
        style={{
          padding: '0.5rem',
          borderRadius: '0.25rem',
          backgroundColor: '#333',
          color: '#F5F5DC',
          border: '1px solid #555',
          fontSize: '1rem',
          marginBottom: '2rem',
        }}
      >
        <option value="---">---</option>
        {seasons.map(season => (
          <option key={season} value={season}>
            {season}
          </option>
        ))}
      </select>

      {seasonStats && (
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Season Stats</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>Rank</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>Squad</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>W</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>D</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>L</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>GF</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>GA</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>GD</th>
                <th style={{ border: '1px solid #555', padding: '0.5rem', textAlign: 'left' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {seasonStats.filter(stat => stat.Squad).map((stat, index) => (
                <tr key={stat.Squad} style={{ backgroundColor: stat.relegated ? '#ff0000' : '' }}>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.Squad}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.W}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.D}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.L}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.GF}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.GA}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.GD}</td>
                  <td style={{ border: '1px solid #555', padding: '0.5rem' }}>{stat.Pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
