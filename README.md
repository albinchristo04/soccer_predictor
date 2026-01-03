# ⚽ Soccer Predictor v2.0

A modern soccer match prediction and live scores application powered by FotMob data. Features real-time match updates, AI-powered predictions, comprehensive league standings, and team analytics.

---

## ✨ Key Features

### 📺 Live Scores & Matches
- **Real-time Updates:** Live match scores from all major leagues
- **Today's Matches:** Complete schedule with live and upcoming games
- **Match Details:** Lineups, events, and statistics

### 🎯 Match Predictions
- **Probabilistic Model:** Win/Draw/Loss probabilities with confidence scores
- **Expected Goals (xG):** Poisson-based goal predictions
- **Score Predictions:** Most likely scoreline with alternatives
- **Over/Under & BTTS:** Betting market predictions

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

---

## 🛠 Technology Stack

### Backend
- **FastAPI** - High-performance async Python API
- **FotMob API** - Real-time football data source
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
- **Monte Carlo** - Match simulation

---

## 📁 Project Structure

```
soccer_predictor/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings and league IDs
│   ├── fotmob_service.py    # Legacy FotMob service
│   ├── live_score_service.py # Live score tracking
│   ├── api/
│   │   └── v1/
│   │       ├── matches.py     # Match endpoints
│   │       ├── predictions.py # Prediction endpoints
│   │       ├── teams.py       # Team endpoints
│   │       └── leagues.py     # League endpoints
│   ├── services/
│   │   ├── fotmob/          # FotMob API client
│   │   ├── prediction/      # Prediction models
│   │   └── ratings/         # ELO rating system
│   └── models/              # Pydantic models
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
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

### Legacy Endpoints
- `GET /api/live_scores` - Live match scores
- `GET /api/todays_matches` - Today's matches
- `POST /api/predict/unified` - Match prediction

---

## 🔧 Configuration

Environment variables (create `.env` file):

```env
# API Settings
FOTMOB_RATE_LIMIT=60
FOTMOB_CACHE_TTL=300

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📊 Prediction Model

The prediction system uses a hybrid approach:

1. **ELO Ratings** - Dynamic team strength based on results
2. **Poisson Distribution** - Expected goals modeling
3. **Form Analysis** - Recent performance weighting
4. **Head-to-Head** - Historical matchup data
5. **Home Advantage** - Venue factor adjustment

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

## 🔄 Data Source

All match data is fetched in real-time from **FotMob**, providing:
- Live scores and match events
- Team statistics and form
- League standings and fixtures
- Player information and injuries

---

## 📝 License

MIT License - Feel free to use and modify for your projects.

---

## 🙏 Acknowledgments

- [FotMob](https://www.fotmob.com) - Football data provider
- [FastAPI](https://fastapi.tiangolo.com) - Modern Python API framework
- [Next.js](https://nextjs.org) - React framework
