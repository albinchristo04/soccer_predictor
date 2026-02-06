# Tarjeta Roja En Vivo - FotMob-Level Architecture

## Overview

This document outlines the complete restructuring of the Tarjeta Roja En Vivo app to achieve FotMob-level functionality with enhanced ML predictions, real-time data, and professional UX.

## New Project Structure

```
soccer_predictor/
├── backend/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app entry point
│   ├── config.py                   # Configuration management
│   │
│   ├── api/                        # API Routes (versioned)
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── matches.py          # Match endpoints
│   │   │   ├── predictions.py      # Prediction endpoints
│   │   │   ├── teams.py            # Team endpoints
│   │   │   ├── players.py          # Player endpoints
│   │   │   ├── leagues.py          # League endpoints
│   │   │   └── live.py             # Live score endpoints
│   │   └── websocket.py            # WebSocket handlers
│   │
│   ├── services/                   # Business Logic
│   │   ├── __init__.py
│   │   ├── fotmob/                 # FotMob Integration
│   │   │   ├── __init__.py
│   │   │   ├── client.py           # API client with rate limiting
│   │   │   ├── matches.py          # Match data fetching
│   │   │   ├── teams.py            # Team data fetching
│   │   │   ├── players.py          # Player data fetching
│   │   │   ├── leagues.py          # League data fetching
│   │   │   └── live.py             # Live score service
│   │   │
│   │   ├── prediction/             # ML Prediction System
│   │   │   ├── __init__.py
│   │   │   ├── model.py            # Main prediction model
│   │   │   ├── features.py         # Feature engineering
│   │   │   ├── training.py         # Model training pipeline
│   │   │   ├── evaluation.py       # Model evaluation
│   │   │   └── probabilistic.py    # Probabilistic predictions
│   │   │
│   │   ├── ratings/                # Team Rating System
│   │   │   ├── __init__.py
│   │   │   ├── elo.py              # ELO rating implementation
│   │   │   ├── form.py             # Form calculation
│   │   │   └── strength.py         # Team strength metrics
│   │   │
│   │   └── news/                   # News & Injuries
│   │       ├── __init__.py
│   │       ├── injuries.py         # Injury tracking
│   │       └── news.py             # News aggregation
│   │
│   ├── models/                     # Data Models (Pydantic)
│   │   ├── __init__.py
│   │   ├── match.py
│   │   ├── team.py
│   │   ├── player.py
│   │   ├── prediction.py
│   │   └── live.py
│   │
│   ├── db/                         # Database Layer
│   │   ├── __init__.py
│   │   ├── connection.py           # DB connection management
│   │   ├── repositories/           # Data access patterns
│   │   │   ├── matches.py
│   │   │   ├── teams.py
│   │   │   └── predictions.py
│   │   └── cache.py                # Redis caching
│   │
│   └── utils/                      # Utilities
│       ├── __init__.py
│       ├── logging.py
│       ├── rate_limiter.py
│       └── constants.py
│
├── src/                            # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Home / Live Dashboard
│   │   ├── globals.css
│   │   │
│   │   ├── matches/
│   │   │   ├── page.tsx            # All matches (live, upcoming, results)
│   │   │   ├── [matchId]/
│   │   │   │   └── page.tsx        # Match details page
│   │   │   └── live/
│   │   │       └── page.tsx        # Live matches only
│   │   │
│   │   ├── leagues/
│   │   │   ├── page.tsx            # All leagues
│   │   │   └── [leagueId]/
│   │   │       ├── page.tsx        # League overview
│   │   │       ├── table/
│   │   │       │   └── page.tsx    # Standings
│   │   │       ├── fixtures/
│   │   │       │   └── page.tsx    # Fixtures
│   │   │       └── stats/
│   │   │           └── page.tsx    # League stats
│   │   │
│   │   ├── teams/
│   │   │   ├── page.tsx            # Team search
│   │   │   └── [teamId]/
│   │   │       ├── page.tsx        # Team overview
│   │   │       ├── squad/
│   │   │       │   └── page.tsx    # Squad list
│   │   │       ├── fixtures/
│   │   │       │   └── page.tsx    # Team fixtures
│   │   │       └── stats/
│   │   │           └── page.tsx    # Team stats
│   │   │
│   │   ├── players/
│   │   │   └── [playerId]/
│   │   │       └── page.tsx        # Player profile
│   │   │
│   │   ├── predictions/
│   │   │   ├── page.tsx            # Predictions hub
│   │   │   ├── daily/
│   │   │   │   └── page.tsx        # Daily predictions
│   │   │   └── accuracy/
│   │   │       └── page.tsx        # Prediction accuracy
│   │   │
│   │   └── api/                    # API routes (if needed for edge)
│   │
│   ├── components/
│   │   ├── common/                 # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Modal.tsx
│   │   │
│   │   ├── match/                  # Match components
│   │   │   ├── MatchCard.tsx
│   │   │   ├── MatchHeader.tsx
│   │   │   ├── MatchStats.tsx
│   │   │   ├── MatchEvents.tsx
│   │   │   ├── MatchLineup.tsx
│   │   │   ├── MatchH2H.tsx
│   │   │   └── LiveScoreTicker.tsx
│   │   │
│   │   ├── prediction/             # Prediction components
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── ProbabilityBar.tsx
│   │   │   ├── ScorePrediction.tsx
│   │   │   └── ConfidenceMeter.tsx
│   │   │
│   │   ├── team/                   # Team components
│   │   │   ├── TeamCard.tsx
│   │   │   ├── TeamForm.tsx
│   │   │   ├── TeamStats.tsx
│   │   │   └── SquadList.tsx
│   │   │
│   │   ├── player/                 # Player components
│   │   │   ├── PlayerCard.tsx
│   │   │   └── PlayerStats.tsx
│   │   │
│   │   ├── league/                 # League components
│   │   │   ├── LeagueCard.tsx
│   │   │   ├── StandingsTable.tsx
│   │   │   └── LeagueStats.tsx
│   │   │
│   │   └── layout/                 # Layout components
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Footer.tsx
│   │       └── MobileNav.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useLiveMatches.ts
│   │   ├── useMatch.ts
│   │   ├── useTeam.ts
│   │   ├── usePrediction.ts
│   │   └── useWebSocket.ts
│   │
│   ├── lib/                        # Utilities
│   │   ├── api.ts                  # API client
│   │   ├── websocket.ts            # WebSocket client
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── store/                      # Zustand stores
│   │   ├── matchStore.ts
│   │   ├── predictionStore.ts
│   │   └── uiStore.ts
│   │
│   └── types/                      # TypeScript types
│       ├── match.ts
│       ├── team.ts
│       ├── player.ts
│       ├── prediction.ts
│       └── api.ts
│
├── ml/                             # Machine Learning
│   ├── notebooks/                  # Jupyter notebooks for exploration
│   ├── data/                       # Training data
│   ├── models/                     # Saved models
│   ├── training/                   # Training scripts
│   │   ├── train_model.py
│   │   ├── feature_engineering.py
│   │   └── evaluate_model.py
│   └── configs/                    # Model configs
│
├── data/                           # Data storage
│   ├── historical/                 # Historical match data
│   ├── cache/                      # Cached API responses
│   └── exports/                    # Data exports
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── tests/
│   ├── backend/
│   └── frontend/
│
└── scripts/
    ├── setup.sh
    ├── train_model.sh
    └── update_data.sh
```

## Enhanced ML Model Architecture

### Features Used for Prediction

#### Team-Level Features
1. **ELO Rating** - Dynamic rating updated after each match
2. **Current Season Form** - Last 5-10 matches (W/D/L, goals)
3. **Home/Away Specific Form** - Venue-adjusted performance
4. **Head-to-Head Record** - Historical matchups
5. **Goals Scored/Conceded Averages** - Attack/defense strength
6. **League Position** - Current standings
7. **Points Per Game** - Current season PPG
8. **Clean Sheet Rate** - Defensive solidity

#### Match-Level Features
1. **Rest Days** - Days since last match
2. **Distance Traveled** - For away matches
3. **Match Importance** - League position implications
4. **Derby Factor** - Local rivalry intensity
5. **Time of Season** - Early/mid/late season

#### External Factors
1. **Injuries** - Key player availability (weighted by player importance)
2. **Suspensions** - Red/yellow card accumulation
3. **Manager Changes** - Recent coaching changes
4. **Transfer Activity** - Recent signings/departures

### Model Types

1. **Outcome Classifier (XGBoost/LightGBM)**
   - Predicts Home Win / Draw / Away Win probabilities
   - Calibrated probabilities using Platt scaling

2. **Goals Regression Model**
   - Poisson regression for goal counts
   - Separate models for home/away goals
   - Outputs expected goals (xG)

3. **Score Distribution Model**
   - Monte Carlo simulation based on Poisson
   - Full probability matrix for all score combinations
   - Most likely scoreline with confidence

### Prediction Output Format
```json
{
  "match_id": "12345",
  "predictions": {
    "outcome": {
      "home_win": 0.45,
      "draw": 0.28,
      "away_win": 0.27,
      "confidence": 0.72
    },
    "goals": {
      "home_xg": 1.8,
      "away_xg": 1.2,
      "over_2_5": 0.58,
      "btts": 0.62
    },
    "scoreline": {
      "most_likely": "2-1",
      "probability": 0.14,
      "alternatives": [
        {"score": "1-1", "probability": 0.12},
        {"score": "1-0", "probability": 0.11}
      ]
    }
  },
  "factors": {
    "home_form": 0.78,
    "away_form": 0.65,
    "h2h_advantage": 0.12,
    "injury_impact": -0.08
  },
  "model_version": "2.0.0",
  "generated_at": "2026-01-02T15:30:00Z"
}
```

## FotMob API Integration

### Key Endpoints Used

1. **Matches by Date**
   ```
   GET /api/matches?date=20260102
   ```

2. **Match Details**
   ```
   GET /api/matchDetails?matchId=12345
   ```

3. **League Data**
   ```
   GET /api/leagues?id=47
   ```

4. **Team Data**
   ```
   GET /api/teams?id=9825
   ```

5. **Player Data**
   ```
   GET /api/playerData?id=12345
   ```

### Rate Limiting Strategy
- Max 60 requests/minute to FotMob API
- Response caching with Redis (TTL varies by data type)
- Stale-while-revalidate pattern for live data

## Real-time Architecture

### WebSocket Events
```typescript
// Client -> Server
{ type: 'subscribe', matches: [12345, 12346] }
{ type: 'unsubscribe', matches: [12345] }

// Server -> Client
{ type: 'score_update', matchId: 12345, home: 2, away: 1, minute: 67 }
{ type: 'event', matchId: 12345, event: { type: 'goal', player: 'Salah', minute: 67 } }
{ type: 'status_change', matchId: 12345, status: 'halftime' }
```

### Polling Fallback
- For environments without WebSocket support
- SSE (Server-Sent Events) as alternative
- SWR with 30-second refresh for live matches

## Database Schema (PostgreSQL)

```sql
-- Matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    fotmob_id VARCHAR(20) UNIQUE,
    home_team_id INT REFERENCES teams(id),
    away_team_id INT REFERENCES teams(id),
    league_id INT REFERENCES leagues(id),
    status VARCHAR(20),
    kickoff_time TIMESTAMP,
    home_score INT,
    away_score INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    fotmob_id VARCHAR(20) UNIQUE,
    name VARCHAR(100),
    short_name VARCHAR(50),
    logo_url VARCHAR(255),
    elo_rating DECIMAL(7,2) DEFAULT 1500,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id),
    home_win_prob DECIMAL(4,3),
    draw_prob DECIMAL(4,3),
    away_win_prob DECIMAL(4,3),
    predicted_home_goals DECIMAL(3,1),
    predicted_away_goals DECIMAL(3,1),
    confidence DECIMAL(4,3),
    model_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prediction results (for accuracy tracking)
CREATE TABLE prediction_results (
    id SERIAL PRIMARY KEY,
    prediction_id INT REFERENCES predictions(id),
    actual_outcome VARCHAR(10), -- 'home', 'draw', 'away'
    actual_home_goals INT,
    actual_away_goals INT,
    outcome_correct BOOLEAN,
    score_correct BOOLEAN,
    evaluated_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up new project structure
- [ ] Install and configure pyfotmob
- [ ] Create enhanced FotMob service with proper error handling
- [ ] Build base API routes

### Phase 2: ML Enhancement (Week 2-3)
- [ ] Design feature engineering pipeline
- [ ] Train XGBoost outcome classifier
- [ ] Train Poisson goals model
- [ ] Create probabilistic prediction service

### Phase 3: Real-time Features (Week 3-4)
- [ ] Implement WebSocket server
- [ ] Create live score polling service
- [ ] Build real-time frontend components
- [ ] Add match event streaming

### Phase 4: Frontend Overhaul (Week 4-5)
- [ ] Design new UI components
- [ ] Build match details page
- [ ] Create team/player pages
- [ ] Implement live dashboard

### Phase 5: Polish & Deploy (Week 5-6)
- [ ] Add caching layer
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Production deployment

## Tech Stack Summary

### Backend
- **Framework**: FastAPI (async, fast, modern)
- **Database**: PostgreSQL + Redis (caching)
- **ML**: scikit-learn, XGBoost, LightGBM
- **API Client**: httpx (async), pyfotmob
- **Task Queue**: Celery (for background jobs)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand + SWR
- **Real-time**: WebSocket + SWR fallback
- **Charts**: Recharts

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **Database**: Supabase or Railway PostgreSQL
- **Caching**: Upstash Redis
- **Monitoring**: Sentry, Vercel Analytics
