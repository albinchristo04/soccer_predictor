# ⚽ Soccer Match Predictor

A comprehensive machine learning system for predicting soccer match outcomes using historical data from 9 major leagues and competitions.

## 🎯 Overview

This project was born from a passion for soccer and a desire to create a tool that provides statistical insights into the beautiful game. As a big fan, I always wanted a way to investigate and quantify the odds of match outcomes. This tool is the result of that inspiration.

This tool scrapes historical soccer data from FBRef, processes it with advanced feature engineering, trains RandomForest classifiers for each league, and provides three prediction modes:
- **Head-to-head**: Predict specific match outcomes
- **Cross-league**: Compare teams from different leagues
- **Season simulation**: Monte Carlo simulation of entire seasons

## ✨ Features

*   **Web Interface:** A Next.js application provides a user-friendly interface to interact with the prediction models.
*   **AI/ML Algorithm:** The platform uses an advanced AI/ML algorithm, trained on historical data, to offer users guided decision-making for predicting winner outcomes, considering factors like home versus away advantage.
*   **Prediction Modes:**
    *   **Head-to-Head:** Predict the outcome of a match between two teams.
    *   **Cross-League:** Compare teams from different leagues and see predicted outcomes.
    *   **Simulation:** Simulate the outcome of a season or a tournament.
*   **Analytics:**
    *   **League Stats:** View statistics for each league.
    *   **Team Comparisons:** Compare the performance of different teams.
    *   **Trends:** Analyze trends in team and league performance over time.
*   **About:**
    *   **Model Explanation:** Understand how the prediction model works.
    *   **Accuracy Metrics:** View the accuracy of the prediction model.
    *   **Disclaimers:** Important information about the limitations of the tool.

## 📊 How It Works

### 1. Data Scraping
The system scrapes data from [FBRef](https://fbref.com), targeting **both** statistics pages and fixtures pages to get comprehensive data including:
- Match results (scores, dates, venues)
- Team statistics (possession, shots, passes, etc.)
- Advanced metrics (xG, xGA when available)
- Player statistics

**Why both pages?**
- **Stats pages** provide rich team-level statistics and advanced metrics
- **Fixtures pages** provide actual match-by-match results
- Merging both gives the most comprehensive dataset for predictions

### 2. Data Processing
Raw scraped data is transformed into match-level features:
- **Rolling statistics**: Form over last 5 matches
- **Team strength indicators**: Win rates, goal averages
- **Home/away performance**: Separate metrics for venue
- **Historical head-to-head**: Past matchup results

### 3. Machine Learning Model

**Architecture: RandomForest Classifier**

#### Why RandomForest?

**Pros:**
- **Handles non-linear relationships**: Soccer outcomes depend on complex interactions between features
- **Robust to outliers**: Handles unusual match results without overfitting
- **Feature importance**: Reveals which statistics matter most
- **No feature scaling needed**: Works with raw statistics
- **Ensemble method**: Combines 300 decision trees for stable predictions
- **Handles missing data**: Gracefully manages incomplete historical records

**Cons:**
- **Not interpretable**: Black-box model (but we mitigate with feature importance)
- **Memory intensive**: Large forests require significant storage
- **Prediction speed**: Slower than simpler models
- **Can't extrapolate**: Limited to patterns seen in training data

#### Model Configuration
```python
RandomForestClassifier(
    n_estimators=300,        # 300 trees for stability
    max_depth=15,            # Prevent overfitting
    min_samples_split=10,    # Robust splits
    min_samples_leaf=5,      # Minimum leaf size
    class_weight='balanced', # Handle win/draw/loss imbalance
    random_state=42          # Reproducibility
)
```

#### Why Not Other Models?

| Model | Why Not Used |
|-------|--------------|
| **Logistic Regression** | Too simple; can't capture non-linear patterns in soccer |
| **Neural Networks** | Requires massive data; prone to overfitting on our dataset size |
| **SVM** | Computationally expensive; doesn't handle multi-class well |
| **Naive Bayes** | Assumes feature independence (not true for soccer stats) |
| **Gradient Boosting** | More prone to overfitting; RandomForest is more stable |

#### Expected Performance
- **Training Accuracy**: 55-65%
- **Testing Accuracy**: 45-55%
- **Baseline (random)**: 33%

**Note**: Soccer is inherently unpredictable. A 50% accuracy is actually very good and indicates the model captures meaningful patterns. Even professional bookmakers achieve only 55-60% accuracy.

### 4. Prediction & Analysis

Three prediction modes with comprehensive visualizations:
- Probability distributions (JSON + charts)
- Season simulations with Monte Carlo methods
- Cross-league comparisons with normalization

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/roni-altshuler/soccer_predictor.git
cd soccer_predictor

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
npm install
```

### Running the Pipeline

```bash
# Option 1: Automated pipeline
./run_pipeline.sh

# Option 2: Manual steps
python3 scripts/populate_seasons.py
python3 scripts/fbref_scraper.py         # Select league or 'all'
python3 scripts/process_scraped_data.py
python3 scripts/train_league_models.py   # Select league or 'all'
```

### Making Predictions

```bash
# Head-to-head (case-insensitive, handles spaces)
python3 scripts/predict_and_analyze.py --mode head_to_head \
    --league premier_league \
    --home_team "manchester city" \
    --away_team liverpool

# Cross-league
python3 scripts/predict_and_analyze.py --mode cross_league \
    --league_a premier_league --team_a "Real Madrid" \
    --league_b la_liga --team_b barcelona

# Season simulation
python3 scripts/predict_and_analyze.py --mode season_simulation \
    --league premier_league --simulations 10000
```

### Running the Web Application

**Option 1: Single Command**

Use the `run_app.sh` script to start both the frontend and backend concurrently:

```bash
./run_app.sh
```

**Option 2: Manual Start**

If you prefer to run the frontend and backend separately:

```bash
# Start the Next.js frontend
npm run dev

# In a new terminal, start the FastAPI backend
.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
soccer_predictor/
├── scripts/
│   ├── populate_seasons.py       # Generate URLs
│   ├── fbref_scraper.py          # Scrape data
│   ├── process_scraped_data.py   # Process & feature engineering
│   ├── train_league_models.py    # Train ML models
│   ├── predict_and_analyze.py    # Make predictions
│   └── auto_update.py            # Auto-update system (future)
├── fbref_data/
│   ├── *.csv                     # Raw scraped data
│   ├── processed/                # Processed match data
│   └── {league}/
│       ├── model.pkl             # Trained models
│       ├── visualizations/       # Charts & plots
│       └── predictions/          # Prediction results
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── analytics/
│   │   │   └── page.tsx          # Analytics page
│   │   ├── about/
│   │   │   └── page.tsx          # About page
│   │   └── prediction/
│   │       └── page.tsx          # Prediction page
├── run_pipeline.sh               # Automated pipeline
├── requirements.txt
└── README.md
```

## 🎓 Supported Leagues

- **Premier League** (England)
- **La Liga** (Spain)
- **Bundesliga** (Germany)
- **Serie A** (Italy)
- **Ligue 1** (France)
- **MLS** (USA/Canada)
- **UEFA Champions League**
- **UEFA Europa League**
- **FIFA World Cup**

## 🔄 Future Updates & Scalability

### Auto-Update System
A scheduled script will:
1. Check for new match data weekly
2. Append to existing CSVs incrementally
3. Retrain models with new data
4. Update predictions automatically

### Adding New Leagues
The system is designed to be plug-and-play:
1. Add league to `LEAGUES` dict in `populate_seasons.py`
2. Run pipeline - all scripts handle new leagues automatically
3. No code changes needed

### Multiple Model Framework
Future versions will support:
- Model selection (RandomForest, XGBoost, Neural Networks)
- Ensemble predictions combining multiple models
- Model performance comparison dashboard

## ⚠️ Important Disclaimers

### Prediction Accuracy
**This tool is for educational and entertainment purposes only.**

- Soccer matches are inherently unpredictable due to countless variables (injuries, weather, referee decisions, luck, etc.)
- The model is based on **statistical patterns** in historical data
- **Past performance does not guarantee future results**
- Model accuracy of 45-55% is actually quite good for soccer prediction

### Liability Disclaimer
**The creator of this tool cannot be held liable for:**
- Incorrect predictions or forecast errors
- Financial losses from betting or gambling based on predictions
- Decisions made using this tool's output
- Any damages, direct or indirect, from use of this software

**DO NOT USE THIS TOOL FOR GAMBLING OR BETTING.**

This is a statistical analysis tool for educational purposes. Always gamble responsibly and within your means. The creator strongly discourages using this tool for betting decisions.

### Data Source
All data is scraped from FBRef. Please respect their [terms of service](https://www.sports-reference.com/termsofuse.html) and rate limits. This tool implements:
- Randomized delays between requests (5-12 seconds)
- Exponential backoff for rate limiting
- Limited concurrent requests
- Respectful scraping practices

## 🛠️ User Input Handling

### Team Names
The system now handles:
- **Case-insensitive**: "Manchester City", "manchester city", "MANCHESTER CITY" all work
- **Multi-word names**: No need for quotes in terminal
- **Partial matching**: "City" matches "Manchester City"

### Example Commands
```bash
# All of these work:
python3 scripts/predict_and_analyze.py --mode head_to_head \
    --league premier_league \
    --home_team Manchester City \
    --away_team Liverpool

python3 scripts/predict_and_analyze.py --mode head_to_head \
    --league premier_league \
    --home_team "manchester city" \
    --away_team "LIVERPOOL"
```

## 📊 Output Interpretation

### Head-to-Head Results
```
Manchester City WINS:  45.2%  ████████████████████
DRAW:                  28.5%  ███████████
Liverpool WINS:        26.3%  ██████████

✅ Most Likely: Manchester City WINS (45.2%)
```

- **WIN**: Home team (first named) wins
- **DRAW**: Match ends in a tie
- **LOSS**: Away team (second named) wins

### Season Simulation
Shows projected final standings based on Monte Carlo simulation:
- **Avg Pts**: Expected points for the season
- **Range**: Min-max points across all simulations
- Top teams have highest championship probability

## 🔧 Troubleshooting

### "No match data extracted"
- **Cause**: Scraper got standings instead of match results
- **Fix**: Ensure `populate_seasons.py` generates `/schedule/` URLs

### "Analytics page is not found (404)"
- **Cause**: The Next.js application might not be properly built.
- **Fix**: Rebuild the application:
  ```bash
  npm run build
  ```

### "Prediction results are not displayed"
- **Cause**: The prediction models have not been trained.
- **Fix**: Run the model training script:
  ```bash
  python3 scripts/train_league_models.py
  ```

### "Model not found"
- **Cause**: Haven't trained models yet
- **Fix**: Run `python3 scripts/train_league_models.py`

### Low accuracy (<40%)
- **Cause**: Insufficient training data
- **Fix**: Scrape more seasons or use a different league

## 📈 Performance Metrics

Typical model performance:
- **Precision (win)**: 0.50-0.60
- **Recall (win)**: 0.55-0.65
- **F1-score**: 0.50-0.58
- **Overall accuracy**: 45-55%

These metrics indicate the model successfully identifies patterns while acknowledging soccer's inherent randomness.

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional data sources
- More sophisticated models
- Better feature engineering
- Web interface development
- Mobile app integration

## 🙏 Credits

- **Data Source**: [FBRef](https://fbref.com) - Comprehensive soccer statistics
- **ML Framework**: scikit-learn
- **Visualization**: matplotlib, seaborn
- **Web Scraping**: BeautifulSoup, requests

---

**Built with ⚽ by [Roni Altshuler](https://github.com/roni-altshuler)**

*For questions or issues, please open a GitHub issue.*
