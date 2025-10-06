'use client';

import { useEffect, useState } from 'react';
import { fetchAllSeasons, fetchRankedSeasonStats, fetchChartsData, fetchTeamPerformanceData, fetchSeasonAnalysisData, fetchAverageGoalsPerSeason, SeasonStats } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, Label, Customized } from 'recharts';

interface ChartsData {
  outcomeData: { name: string; value: number }[];
  wdlData: { name: string; W: number; D: number; L: number }[];
}

interface PerformanceData {
  performanceData: any[];
  teams: string[];
}

interface SeasonAnalysisData {
  goalsData: { name: string; GF: number; GA: number }[];
  shotsData: { name: string; Shots: number; SoT: number }[];
  goalsRegression: { m: number; c: number; rSquared: number };
  shotsRegression: { m: number; c: number; rSquared: number };
}

interface AvgGoalsPerSeasonData {
  season: string;
  avgGoals: number;
}

export default function PremierLeaguePage() {
  const [seasons, setSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('---');
  const [seasonStats, setSeasonStats] = useState<SeasonStats[] | null>(null);
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [seasonAnalysisData, setSeasonAnalysisData] = useState<SeasonAnalysisData | null>(null);
  const [avgGoalsPerSeason, setAvgGoalsPerSeason] = useState<AvgGoalsPerSeasonData[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadSeasons = async () => {
      const allSeasons = await fetchAllSeasons('PremierLeague');
      setSeasons(allSeasons);
    };
    loadSeasons();
  }, []);

  useEffect(() => {
    const loadAvgGoals = async () => {
      const data = await fetchAverageGoalsPerSeason('PremierLeague');
      setAvgGoalsPerSeason(data);
    };
    loadAvgGoals();
  }, []);

  useEffect(() => {
    const loadSeasonData = async () => {
      if (selectedSeason && selectedSeason !== '---') {
        const stats = await fetchRankedSeasonStats('PremierLeague', selectedSeason);
        setSeasonStats(stats);
        const charts = await fetchChartsData('PremierLeague', selectedSeason);
        setChartsData(charts);
        const performance = await fetchTeamPerformanceData('PremierLeague', selectedSeason);
        setPerformanceData(performance);
        const analysisData = await fetchSeasonAnalysisData('PremierLeague', selectedSeason);
        setSeasonAnalysisData(analysisData);
      } else {
        setSeasonStats(null);
        setChartsData(null);
        setPerformanceData(null);
        setSeasonAnalysisData(null);
      }
    };
    loadSeasonData();
  }, [selectedSeason]);

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const season = e.target.value;
    setSelectedSeason(season);
  };

  const COLORS = ['#4CAF50', '#FF5722', '#9E9E9E'];

  const TEAM_COLORS = [
    '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#333', padding: '10px', border: '1px solid #555' }}>
          <p className="label">{`${label}`}</p>
          <p className="intro" style={{ color: '#4CAF50' }}>{`Wins: ${payload[0].value}`}</p>
          <p className="intro" style={{ color: '#9E9E9E' }}>{`Draws: ${payload[1].value}`}</p>
          <p className="intro" style={{ color: '#FF5722' }}>{`Losses: ${payload[2].value}`}</p>
        </div>
      );
    }
  
    return null;
  };

  const GoalsScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: '10px', border: '1px solid #ccc', color: '#fff' }}>
          <p>{`Team: ${data.name}`}</p>
          <p>{`Goals For: ${data.GF}`}</p>
          <p>{`Goals Against: ${data.GA}`}</p>
        </div>
      );
    }

    return null;
  };

  const ShotsScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', padding: '10px', border: '1px solid #ccc', color: '#fff' }}>
          <p>{`Team: ${data.name}`}</p>
          <p>{`Shots: ${data.Shots}`}</p>
          <p>{`Shots on Target: ${data.SoT}`}</p>
        </div>
      );
    }

    return null;
  };

  const goalsLine = seasonAnalysisData ? [
    { GF: Math.min(...seasonAnalysisData.goalsData.map(d => d.GF)), GA: seasonAnalysisData.goalsRegression.m * Math.min(...seasonAnalysisData.goalsData.map(d => d.GF)) + seasonAnalysisData.goalsRegression.c },
    { GF: Math.max(...seasonAnalysisData.goalsData.map(d => d.GF)), GA: seasonAnalysisData.goalsRegression.m * Math.max(...seasonAnalysisData.goalsData.map(d => d.GF)) + seasonAnalysisData.goalsRegression.c },
  ] : [];

  const shotsLine = seasonAnalysisData ? [
    { Shots: Math.min(...seasonAnalysisData.shotsData.map(d => d.Shots)), SoT: seasonAnalysisData.shotsRegression.m * Math.min(...seasonAnalysisData.shotsData.map(d => d.Shots)) + seasonAnalysisData.shotsRegression.c },
    { Shots: Math.max(...seasonAnalysisData.shotsData.map(d => d.Shots)), SoT: seasonAnalysisData.shotsRegression.m * Math.max(...seasonAnalysisData.shotsData.map(d => d.Shots)) + seasonAnalysisData.shotsRegression.c },
  ] : [];

  return (
    <div style={{ padding: '2rem', color: '#F5F5DC' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#F5F5DC', borderRadius: '0.5rem', width: 'fit-content' }}>
        <Image
          src="/logo/Premier_League_Symbol.svg"
          alt="Premier League Logo"
          width={30}
          height={38}
          style={{ marginRight: '0.5rem' }}
        />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#121212' }}>Premier League</h1>
      </div>
      <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
        The Premier League is the top level of the English football league system. Contested by 20 clubs, it operates on a system of promotion and relegation with the English Football League (EFL). Seasons run from August to May, with each team playing 38 matches (playing all 19 other teams both home and away). Most games are played on Saturday and Sunday afternoons. The competition was founded as the FA Premier League on 20 February 1992 following the decision of clubs in the Football League First Division to break away from the Football League, founded in 1888, and take advantage of a lucrative new television rights deal. For more information, visit the <a href="https://www.premierleague.com/" target="_blank" rel="noopener noreferrer" className="league-link">official Premier League website</a>.
      </p>

      {avgGoalsPerSeason && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Average Goals per Season</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={avgGoalsPerSeason} margin={{ top: 20, right: 30, left: 30, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="season">
                <Label value="Season" offset={-20} position="insideBottom" />
              </XAxis>
              <YAxis>
                <Label value="Average Goals" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <Tooltip />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '60px' }} />
              <Line type="monotone" dataKey="avgGoals" stroke="#8884d8" name="Average Goals" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Explore Seasons</h2>
      {seasons.length > 0 ? (
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
      ) : (
        <p>Loading seasons...</p>
      )}

      {selectedSeason !== '---' && seasonStats && seasonStats.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{selectedSeason} Final Standings</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#444' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>#</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>Squad</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>W</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>D</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>L</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>GF</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>GA</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>GD</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #555' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {seasonStats.map((stat, index) => (
                <tr key={stat.Squad} style={{ backgroundColor: index % 2 === 0 ? '#333' : '#222' }}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{index + 1}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.Squad}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.W}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.D}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.L}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.GF}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.GA}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.GD}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #444' }}>{stat.Pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSeason !== '---' && chartsData && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Season Analysis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Match Outcomes</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <Pie
                    data={chartsData.outcomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {chartsData.outcomeData.map((entry: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '60px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Team Wins, Draws, Losses</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartsData.wdlData}
                  margin={{
                    top: 20, right: 30, left: 30, bottom: 40,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} interval={0} tick={{ fontSize: 12 }}>
                    <Label value="Teams" offset={-25} position="insideBottom" />
                  </XAxis>
                  <YAxis>
                    <Label value="Count" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                  </YAxis>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '60px' }} />
                  <Bar dataKey="W" stackId="a" fill="#4CAF50" name="Wins" />
                  <Bar dataKey="D" stackId="a" fill="#9E9E9E" name="Draws" />
                  <Bar dataKey="L" stackId="a" fill="#FF5722" name="Losses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {seasonAnalysisData && (
              <>
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Goals For vs. Goals Against</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 30 }}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="GF" name="Goals For">
                        <Label value="Goals For" offset={-20} position="insideBottom" />
                      </XAxis>
                      <YAxis type="number" dataKey="GA" name="Goals Against">
                        <Label value="Goals Against" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                      </YAxis>
                      <ZAxis dataKey="name" name="Team" />
                      <Tooltip content={<GoalsScatterTooltip />} />
                      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '60px' }} />
                      <Scatter name="Teams" data={seasonAnalysisData.goalsData} fill="#8884d8" />
                      <Line type="monotone" dataKey="GA" data={goalsLine} stroke="#ff0000" dot={false} activeDot={false} legendType="none" />
                      <Customized
                        component={props => {
                          const { width, height, offset } = props;
                          if (isNaN(width)) return null;
                          return (
                            <text x={30} y={20} fill="#ff0000" fontSize={16}>
                            </text>
                          );
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Shots vs. Shots on Target</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 30 }}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="Shots" name="Shots">
                        <Label value="Shots" offset={-20} position="insideBottom" />
                      </XAxis>
                      <YAxis type="number" dataKey="SoT" name="Shots on Target">
                        <Label value="Shots on Target" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                      </YAxis>
                      <ZAxis dataKey="name" name="Team" />
                      <Tooltip content={<ShotsScatterTooltip />} />
                      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '60px' }} />
                      <Scatter name="Teams" data={seasonAnalysisData.shotsData} fill="#82ca9d" />
                      <Line type="monotone" dataKey="SoT" data={shotsLine} stroke="#ff0000" dot={false} activeDot={false} legendType="none" />
                      <Customized
                        component={props => {
                          const { width, height, offset } = props;
                          if (isNaN(width)) return null;
                          return (
                            <text x={30} y={20} fill="#ff0000" fontSize={16}>
                              {`R² = ${seasonAnalysisData.shotsRegression.rSquared.toFixed(2)}`}
                            </text>
                          );
                        }}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {performanceData && performanceData.performanceData.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Team Performance Over Season</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={performanceData.performanceData} margin={{ top: 20, right: 30, left: 30, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date">
                <Label value="Date" offset={-20} position="insideBottom" />
              </XAxis>
              <YAxis>
                <Label value="Points" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '60px' }} />
              {performanceData.teams.map((team, index) => (
                <Line key={team} type="monotone" dataKey={team} stroke={TEAM_COLORS[index % TEAM_COLORS.length]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}