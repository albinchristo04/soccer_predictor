# ⚽ Soccer Predictor v3.0

A modern soccer match prediction and live scores application powered by FotMob and ESPN data. Features real-time match updates, AI-powered predictions, comprehensive league standings, user authentication, and league standings simulation.

**📱 Now Available as a Progressive Web App (PWA)** - Install on Chrome for the best experience!

---

## ✨ Key Features

### 📱 Progressive Web App (PWA)
- **Installable:** Add to your home screen on desktop and mobile
- **Offline Support:** Access previously viewed content without internet
- **Fast Performance:** Service worker caching for instant loads
- **Native Feel:** Runs in standalone window without browser chrome
- **Background Sync:** Stay updated with latest scores even offline

### 📺 Live Scores & Matches
- **Real-time Updates:** Live match scores from all major leagues
- **Multi-source Data:** FotMob + ESPN API integration
- **Today's Matches:** Complete schedule with live and upcoming games
- **Match Details:** Lineups, events, and statistics

### 🎯 Match Predictions
- **Probabilistic Model:** Win/Draw/Loss probabilities with confidence scores
- **Expected Goals (xG):** Poisson-based goal predictions
- **Score Predictions:** Most likely scoreline with alternatives
- **Over/Under & BTTS:** Betting market predictions
- **News Sentiment:** Predictions influenced by recent news

### 🏆 League Coverage
- **Major European Leagues:**
  - Premier League (England)
  - La Liga (Spain)
  - Bundesliga (Germany)
  - Serie A (Italy)
  - Ligue 1 (France)
- **Other Leagues:**
  - Eredivisie (Netherlands)
  - Primeira Liga (Portugal)
  - MLS (USA)
- **Competitions:**
  - UEFA Champions League
  - UEFA Europa League

### 📊 Analytics
- **League Standings:** Live table with goal difference and form
- **Team Form:** Recent results and performance trends
- **Head-to-Head:** Historical matchup data
- **ELO Ratings:** Dynamic team strength ratings
- **League Simulation:** Monte Carlo simulation for final standings prediction

### 🔐 User Authentication
- **Email/Password:** Traditional account creation
- **Google OAuth:** Sign in with Google
- **User Predictions:** Save and track your predictions
- **Leaderboard:** Compete with other users
- **Statistics:** Track your prediction accuracy

### 📰 News Integration
- **League News:** Latest articles from ESPN
- **Team News:** Team-specific updates
- **Sentiment Analysis:** News-based prediction factors

---

## 🛠 Technology Stack

### Backend
- **FastAPI** - High-performance async Python API
- **FotMob API** - Real-time football data source
- **ESPN API** - Additional data and news
- **Pydantic** - Data validation and serialization
- **httpx** - Async HTTP client with rate limiting

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and caching

### ML/Prediction
- **Poisson Model** - Goal probability distribution
- **ELO System** - Team strength ratings
- **Monte Carlo** - Match and league simulation
- **Sentiment Analysis** - News-based prediction factors

### Authentication
- **JWT Tokens** - Secure authentication
- **Google OAuth** - Social login support
- **In-memory Storage** - Development storage (replace with DB for production)

---

## 📁 Project Structure

```
soccer_predictor/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings and league IDs
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py        # Authentication endpoints
│   │       ├── matches.py     # Match endpoints
│   │       ├── predictions.py # Prediction endpoints
│   │       ├── teams.py       # Team endpoints
│   │       └── leagues.py     # League endpoints
│   ├── services/
│   │   ├── auth/            # Authentication service
│   │   ├── espn/            # ESPN API client
│   │   ├── fotmob/          # FotMob API client
│   │   ├── prediction/      # Prediction models
│   │   ├── simulation/      # League simulation
│   │   └── ratings/         # ELO rating system
│   └── models/              # Pydantic models
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── contexts/            # React contexts (Auth)
│   ├── lib/                 # Utilities and API client
│   └── hooks/               # Custom React hooks
└── public/                  # Static assets
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn backend.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run frontend tests
npm test

# Run frontend tests with coverage
npm run test:coverage

# Run backend tests
source .venv/bin/activate
pytest backend/tests/

# Run backend tests with coverage
pytest backend/tests/ --cov=backend
```

### PWA Installation

Once deployed, the app can be installed as a Progressive Web App:

**Desktop (Chrome/Edge):**
1. Visit the website
2. Click the install icon (⊕) in the address bar
3. Click "Install" in the popup

**Mobile (Chrome/Safari):**
1. Visit the website
2. Open browser menu
3. Select "Add to Home Screen" or "Install App"

---

## 📡 API Endpoints

### Matches
- `GET /api/v1/matches/today` - Today's matches
- `GET /api/v1/matches/date/{date}` - Matches by date (YYYYMMDD)
- `GET /api/v1/matches/live` - Currently live matches
- `GET /api/v1/matches/{match_id}` - Match details

### Predictions
- `GET /api/v1/predictions/match/{match_id}` - Match prediction
- `POST /api/v1/predictions/batch` - Batch predictions

### Teams
- `GET /api/v1/teams/{team_id}` - Team details
- `GET /api/v1/teams/{team_id}/form` - Team form

### Leagues
- `GET /api/v1/leagues/` - List all leagues
- `GET /api/v1/leagues/{league_id}` - League info
- `GET /api/v1/leagues/{league_id}/standings` - League standings
- `GET /api/v1/leagues/{league_id}/matches` - League matches
- `GET /api/v1/leagues/{league_id}/news` - League news (ESPN)
- `GET /api/v1/leagues/{league_id}/simulation` - Simulate final standings
- `GET /api/v1/leagues/{league_id}/title-race` - Title probabilities

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Email login
- `POST /api/v1/auth/google` - Google OAuth login
- `POST /api/v1/auth/refresh` - Refresh tokens
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/predictions` - Save prediction
- `GET /api/v1/auth/predictions` - Get user predictions
- `GET /api/v1/auth/stats` - Get user stats
- `GET /api/v1/auth/leaderboard` - Get leaderboard

### Legacy Endpoints
- `GET /api/live_scores` - Live match scores
- `GET /api/todays_matches` - Today's matches
- `POST /api/predict/unified` - Match prediction

---

## 🔧 Configuration

Environment variables (create `.env.local` file for frontend):

```env
# Frontend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth (required for Google Sign-In)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

Backend environment variables (create `.env` file):

```env
# API Settings
FOTMOB_RATE_LIMIT=60
FOTMOB_CACHE_TTL=300

# Authentication
JWT_SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id

# Database (optional, for production)
DATABASE_URL=postgresql://...
```

### Setting up Google OAuth

To enable Google Sign-In:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Select "Web application" as the application type
6. Add your authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
7. Add authorized redirect URIs if needed
8. Copy the Client ID and set it as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

**Note:** If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set, the app will show an email/password login form instead. Google Sign-In will display an error message asking users to contact the administrator.

---

## 📊 Prediction Model

The prediction system uses a hybrid approach:

1. **ELO Ratings** - Dynamic team strength based on results
2. **Poisson Distribution** - Expected goals modeling
3. **Form Analysis** - Recent performance weighting (with recency bias)
4. **Head-to-Head** - Historical matchup data
5. **Home Advantage** - Venue factor adjustment
6. **News Sentiment** - ESPN news analysis for confidence factors
7. **Player Availability** - Injury and suspension impacts

### Prediction Output
```json
{
  "outcome": {
    "home_win": 0.52,
    "draw": 0.25,
    "away_win": 0.23
  },
  "goals": {
    "home_expected_goals": 1.58,
    "away_expected_goals": 0.96,
    "over_2_5": 0.47,
    "btts_yes": 0.49
  },
  "most_likely_score": {
    "score": "1-0",
    "probability": 0.12
  }
}
```

---

## 🏆 League Simulation

Monte Carlo simulation for predicting final standings:

- Simulates all remaining matches using team ELO ratings
- Uses Poisson distribution for goal outcomes
- Returns title probabilities for each team
- Predicts Top 4, Europa qualification, and relegation candidates
- Position distributions showing range of possible finishes

---

## 🔄 Data Sources

All match data is fetched in real-time from:

**FotMob** - Primary source providing:
- Live scores and match events
- Team statistics and form
- League standings and fixtures
- Player information and injuries

**ESPN** - Secondary source providing:
- Live scores and statistics
- News articles and headlines
- Team information

---

## 📝 License

MIT License - Feel free to use and modify for your projects.

---

## 🙏 Acknowledgments

- [FotMob](https://www.fotmob.com) - Football data provider
- [ESPN](https://www.espn.com) - Sports data and news
- [FastAPI](https://fastapi.tiangolo.com) - Modern Python API framework
- [Next.js](https://nextjs.org) - React framework
