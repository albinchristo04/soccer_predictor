# ⚽ Soccer Match Predictor

A comprehensive machine learning system for predicting soccer match outcomes using historical data from 9 major leagues and competitions. This tool provides a web interface for easy predictions and a powerful command-line interface for advanced analysis and season simulations.

***

## 📜 Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [System Architecture](#system-architecture)
- [Installation and Setup](#installation-and-setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Supported Leagues](#supported-leagues)
- [Contributing](#contributing)
- [Acknowledgments and Credits](#acknowledgments-and-credits)
- [Contact](#contact)

***

<a name="features"></a>
## Features

### Web Application (Frontend)
- **Interactive Predictions:** Easily predict match outcomes for head-to-head and cross-league matchups.
- **League Analytics:** A dedicated analytics page with interactive charts to visualize league statistics, including:
    - Result Distribution (Win/Draw/Loss)
    - Goals per Match Distribution
    - Average Goals per Match by Season
- **Responsive Design:** A clean and modern user interface that works on all screen sizes.
- **Team Selection:** A user-friendly dropdown to select leagues and teams.

### Command-Line Interface (CLI)
- **Head-to-Head Prediction:** Predict the outcome of a single match between two teams in the same league.
- **Cross-League Prediction:** Predict the outcome of a match between two teams from different leagues.
- **Season Simulation:** Run Monte Carlo simulations to project the final league standings for a full season.
- **Data Pipeline:** A series of scripts to automate the entire data pipeline, from scraping to model training.

### Machine Learning Backend
- **Data Scraping:** A robust web scraper to collect historical match data from FBRef.
- **Feature Engineering:** Advanced feature engineering to create meaningful features for the machine learning model.
- **RandomForest Classifier:** A RandomForest model trained on historical data to predict match outcomes.
- **API Server:** A FastAPI backend to serve the machine learning model and analytics data to the frontend.

***

<a name="technologies-used"></a>
## Technologies Used

### Frontend
- **Next.js:** A React framework for building server-side rendered and static web applications.
- **React:** A JavaScript library for building user interfaces.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **Recharts:** A composable charting library built on React components.
- **SWR:** A React Hooks library for data fetching.
- **Zustand:** A small, fast, and scalable state-management solution.

### Backend
- **FastAPI:** A modern, fast (high-performance), web framework for building APIs with Python 3.7+.
- **Uvicorn:** A lightning-fast ASGI server implementation.
- **Pydantic:** Data validation and settings management using Python type annotations.

### Machine Learning & Data Science
- **Scikit-learn:** A machine learning library for Python.
- **Pandas:** A fast, powerful, flexible, and easy-to-use open-source data analysis and manipulation tool.
- **NumPy:** A fundamental package for scientific computing with Python.
- **Matplotlib & Seaborn:** Libraries for creating static, animated, and interactive visualizations in Python.
- **Joblib:** A set of tools to provide lightweight pipelining in Python.

### Web Scraping
- **Requests:** A simple, yet elegant, HTTP library.
- **Beautiful Soup:** A Python library for pulling data out of HTML and XML files.
- **LXML:** A library for processing XML and HTML in Python.

### Development & Deployment
- **Git & GitHub:** Version control and code hosting.
- **npm:** A package manager for the JavaScript programming language.
- **pip:** The package installer for Python.
- **Virtualenv:** A tool to create isolated Python environments.
- **Concurrent.ly:** A tool to run multiple commands concurrently.

***

<a name="system-architecture"></a>
## System Architecture

The application is composed of three main components:

1.  **Frontend:** A Next.js web application that provides the user interface for interacting with the prediction models and viewing analytics.
2.  **Backend:** A FastAPI server that exposes a RESTful API to the frontend. The backend is responsible for handling requests, calling the machine learning service, and providing analytics data.
3.  **Machine Learning Service:** A set of Python scripts that handle the entire machine learning pipeline, including data scraping, data processing, feature engineering, model training, and prediction.

***

<a name="installation-and-setup"></a>
## Installation and Setup

To run the Soccer Match Predictor locally, follow these steps:

### Prerequisites
- Python 3.10 or higher
- Node.js 18.0 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/roni-altshuler/soccer_predictor.git
cd soccer_predictor
```

### 2. Create and Activate a Python Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows use `.venv\Scripts\activate`
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

### 4. Install Node.js Dependencies
```bash
npm install
```

### 5. Run the Data Pipeline
To get the latest data and train the models, run the following scripts in order:
```bash
python3 scripts/populate_seasons.py
python3 scripts/fbref_scraper.py
python3 scripts/process_scraped_data.py
python3 scripts/train_league_models.py
```
Alternatively, you can run the automated pipeline script:
```bash
./run_pipeline.sh
```

### 6. Run the Application
To start the frontend and backend servers concurrently, use the following command:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

***

<a name="usage"></a>

## Usage
### Web Interface
Navigate to `http://localhost:3000` in your web browser. You can use the "Predict" page to make head-to-head and cross-league predictions, and the "Analytics" page to explore league statistics.

### Command-Line Interface
You can also use the CLI to make predictions and run simulations. Here are some examples:

**Head-to-Head Prediction:**
```bash
python3 scripts/predict_and_analyze.py --mode head_to_head --league premier_league --home_team "Manchester City" --away_team "Liverpool"
```

**Cross-League Prediction:**
```bash
python3 scripts/predict_and_analyze.py --mode cross_league --league_a premier_league --team_a "Chelsea" --league_b la_liga --team_b "Barcelona"
```

**Season Simulation:**
```bash
python3 scripts/predict_and_analyze.py --mode season_simulation --league premier_league --simulations 10000
```

***

<a name="project-structure"></a>
## Project Structure
```
soccer_predictor/
├── backend/              # FastAPI backend server
├── fbref_data/           # Raw and processed data, trained models, and visualizations
├── node_modules/         # Node.js dependencies
├── public/               # Static assets for the frontend
├── scripts/              # Python scripts for the data pipeline and predictions
├── src/                  # Next.js frontend application
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── requirements.txt
├── run_app.sh
├── tailwind.config.js
├── tsconfig.json
└── ...
```

***

<a name="supported-leagues"></a>
## Supported Leagues
- Premier League (England)
- La Liga (Spain)
- Bundesliga (Germany)
- Serie A (Italy)
- Ligue 1 (France)
- MLS (USA/Canada)
- UEFA Champions League
- UEFA Europa League
- FIFA World Cup

***

<a name="contributing"></a>
## Contributing
Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue on the GitHub repository.

***

***

<a name="acknowledgments-and-credits"></a>
## Acknowledgments and Credits
- **Data Source:** [FBRef](https://fbref.com) for providing comprehensive soccer statistics.
- **Inspiration:** This project was inspired by the desire to apply machine learning to the beautiful game of soccer.
- **Libraries & Frameworks:** A big thank you to the developers of all the open-source libraries and frameworks used in this project.

***

<a name="contact"></a>
## Contact
Roni Altshuler - [GitHub](https://github.com/roni-altshuler)

Project Link: [https://github.com/roni-altshuler/soccer_predictor](https://github.com/roni-altshuler/soccer_predictor)
