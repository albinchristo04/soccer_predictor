export const leagues = [
  'Premier League',
  'LaLiga',
  'Bundesliga',
  'Serie A',
  'Ligue 1',
  'Eredivisie',
  'Primeira Liga',
  'Super Lig',
  'Scottish Premiership'
] as const;

// Complete team lists for each league
export const teams: Record<string, string[]> = {
  'Premier League': [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton', 
    'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 
    'Liverpool', 'Luton', 'Manchester City', 'Manchester United', 
    'Newcastle United', 'Nottingham Forest', 'Sheffield United', 
    'Tottenham', 'West Ham', 'Wolves'
  ],
  'LaLiga': [
    'Alaves', 'Almeria', 'Athletic Bilbao', 'Atletico Madrid', 'Barcelona',
    'Betis', 'Celta Vigo', 'Getafe', 'Girona', 'Granada', 'Las Palmas',
    'Mallorca', 'Osasuna', 'Rayo Vallecano', 'Real Madrid', 'Real Sociedad',
    'Sevilla', 'Valencia', 'Villarreal', 'Cadiz'
  ],
  'Bundesliga': [
    'Augsburg', 'Bayer Leverkusen', 'Bayern Munich', 'Bochum', 
    'Borussia Dortmund', 'Borussia Monchengladbach', 'Darmstadt',
    'Eintracht Frankfurt', 'FC Koln', 'Freiburg', 'Heidenheim',
    'Hoffenheim', 'Mainz 05', 'RB Leipzig', 'Stuttgart', 'Union Berlin',
    'Werder Bremen', 'Wolfsburg'
  ],
  'Serie A': [
    'AC Milan', 'AS Roma', 'Atalanta', 'Bologna', 'Cagliari', 'Empoli',
    'Fiorentina', 'Frosinone', 'Genoa', 'Hellas Verona', 'Inter Milan',
    'Juventus', 'Lazio', 'Lecce', 'Monza', 'Napoli', 'Salernitana',
    'Sassuolo', 'Torino', 'Udinese'
  ],
  'Ligue 1': [
    'Brest', 'Clermont', 'Le Havre', 'Lens', 'Lille', 'Lorient', 'Lyon',
    'Marseille', 'Metz', 'Monaco', 'Montpellier', 'Nantes', 'Nice',
    'Paris Saint-Germain', 'Reims', 'Rennes', 'Strasbourg', 'Toulouse'
  ],
  'Eredivisie': [
    'Ajax', 'AZ Alkmaar', 'Excelsior', 'Feyenoord', 'Fortuna Sittard',
    'Go Ahead Eagles', 'Heerenveen', 'Heracles', 'NEC', 'PEC Zwolle',
    'PSV', 'RKC Waalwijk', 'Sparta Rotterdam', 'Twente', 'Utrecht',
    'Vitesse', 'Volendam', 'Almere City'
  ],
  'Primeira Liga': [
    'Benfica', 'Boavista', 'Braga', 'Casa Pia', 'Chaves', 'Estoril',
    'Estrela', 'Famalicao', 'FC Porto', 'Gil Vicente', 'Guimaraes',
    'Moreirense', 'Portimonense', 'Rio Ave', 'Sporting CP', 'Farense',
    'Arouca', 'Vizela'
  ],
  'Super Lig': [
    'Adana Demirspor', 'Alanyaspor', 'Ankaragucu', 'Antalyaspor',
    'Besiktas', 'Fatih Karagumruk', 'Fenerbahce', 'Galatasaray',
    'Gaziantep FK', 'Hatayspor', 'Istanbul Basaksehir', 'Kasimpasa',
    'Kayserispor', 'Konyaspor', 'Rizespor', 'Sivasspor', 'Trabzonspor',
    'Pendikspor'
  ],
  'Scottish Premiership': [
    'Aberdeen', 'Celtic', 'Dundee', 'Hearts', 'Hibernian',
    'Kilmarnock', 'Livingston', 'Motherwell', 'Rangers',
    'Ross County', 'St Johnstone', 'St Mirren'
  ]
};