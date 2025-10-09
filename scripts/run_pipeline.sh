#!/bin/bash
# Soccer Prediction Pipeline - Complete Workflow
# This script runs all steps in the correct order

set -e  # Exit on error

# Always run from project root
cd "$(dirname "$0")/.." || exit 1

echo "=========================================="
echo "Soccer Prediction Pipeline"
echo "=========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 not found. Please install Python 3."
    exit 1
fi

echo "Python 3 found"

# Step 1: Generate season links
echo ""
echo "=========================================="
echo "Step 1: Generating Season Links"
echo "=========================================="
if [ ! -f "season_links.json" ]; then
    echo "Running populate_seasons.py..."
    python3 scripts/populate_seasons.py
    echo "Season links generated"
else
    echo "season_links.json already exists (skipping)"
fi

# Step 2: Scrape data (optional - user choice)
echo ""
echo "=========================================="
echo "Step 2: Scrape Data from FBRef"
echo "=========================================="
echo "WARNING: This step takes a long time due to rate limiting!"
echo "   You can skip this if you already have scraped data."
echo ""
read -p "Do you want to scrape data? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Which league to scrape?"
    echo "Options: premier_league, la_liga, bundesliga, serie_a, ligue_1, mls, ucl, uel, world_cup, or 'all'"
    read -p "Enter choice: " league_choice
    
    echo "Running fbref_scraper.py for $league_choice..."
    echo "$league_choice" | python3 scripts/fbref_scraper.py
    echo "Data scraped"
else
    echo "Skipping scraping step"
fi

# Step 3: Process scraped data
echo ""
echo "=========================================="
echo "Step 3: Process Scraped Data"
echo "=========================================="

if [ ! -d "fbref_data" ]; then
    echo "fbref_data directory not found!"
    echo "   Please run fbref_scraper.py first or place CSV files in fbref_data/"
    exit 1
fi

csv_count=$(ls fbref_data/*.csv 2>/dev/null | wc -l)
if [ $csv_count -eq 0 ]; then
    echo "No CSV files found in fbref_data/"
    echo "   Please run fbref_scraper.py first"
    exit 1
fi

echo "Running process_scraped_data.py..."
python3 scripts/process_scraped_data.py
echo "Data processed"

# Step 4: Train models
echo ""
echo "=========================================="
echo "Step 4: Train ML Models"
echo "=========================================="

if [ ! -d "fbref_data/processed" ]; then
    echo "Processed data directory not found!"
    echo "   Please run process_scraped_data.py first"
    exit 1
fi

processed_count=$(ls fbref_data/processed/*_processed.csv 2>/dev/null | wc -l)
if [ $processed_count -eq 0 ]; then
    echo "No processed CSV files found!"
    echo "   Please run process_scraped_data.py first"
    exit 1
fi

echo "Which league to train?"
echo "Options: specific league name or 'all'"
read -p "Enter choice: " train_choice

echo "Running train_league_models.py for $train_choice..."
echo "$train_choice" | python3 scripts/train_league_models.py
echo "Models trained"

# Step 5: Make predictions
echo ""
echo "=========================================="
echo "Step 5: Make Predictions"
echo "=========================================="
echo ""
echo "The pipeline is complete! You can now make predictions."
echo ""
echo "Example commands:"
echo ""
echo "# Head-to-head prediction:"
echo "python3 predict_and_analyze.py --mode head_to_head \\"
echo "    --league premier_league \\"
echo "    --home_team \"Manchester City\" \\"
echo "    --away_team \"Liverpool\""
echo ""
echo "# Cross-league prediction:"
echo "python3 predict_and_analyze.py --mode cross_league \\"
echo "    --league_a premier_league --team_a \"Manchester City\" \\"
echo "    --league_b la_liga --team_b \"Real Madrid\""
echo ""
echo "# Season simulation:"
echo "python3 predict_and_analyze.py --mode season_simulation \\"
echo "    --league premier_league --simulations 10000"
echo ""

read -p "Do you want to run a prediction now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Select prediction mode:"
    echo "1) Head-to-head"
    echo "2) Cross-league"
    echo "3) Season simulation"
    read -p "Enter choice (1-3): " pred_mode
    
    case $pred_mode in
        1)
            read -p "League: " league
            read -p "Home team: " home
            read -p "Away team: " away
            python3 scripts/predict_and_analyze.py --mode head_to_head \
                --league "$league" --home_team "$home" --away_team "$away"
            ;;
        2)
            read -p "League A: " league_a
            read -p "Team A: " team_a
            read -p "League B: " league_b
            read -p "Team B: " team_b
            python3 scripts/predict_and_analyze.py --mode cross_league \
                --league_a "$league_a" --team_a "$team_a" \
                --league_b "$league_b" --team_b "$team_b"
            ;;
        3)
            read -p "League: " league
            read -p "Number of simulations (default 1000): " sims
            sims=${sims:-1000}
            python3 scripts/predict_and_analyze.py --mode season_simulation \
                --league "$league" --simulations "$sims"
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
fi

echo ""
echo "=========================================="
echo "Pipeline Complete!"
echo "=========================================="
echo ""
echo "Results are saved in:"
echo "  • Models: fbref_data/{league}/model.pkl"
echo "  • Visualizations: fbref_data/{league}/visualizations/"
echo "  • Predictions: fbref_data/{league}/predictions/"
echo ""
