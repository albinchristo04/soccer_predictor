'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function SeasonSelector({ seasons }: { seasons: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSeason = searchParams.get('season') || seasons[0];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/?season=${e.target.value}`);
  };

  return (
    <select value={selectedSeason} onChange={handleChange}>
      {seasons.map(season => (
        <option key={season} value={season}>
          {season}
        </option>
      ))}
    </select>
  );
}
