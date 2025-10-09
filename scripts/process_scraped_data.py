#!/usr/bin/env python3
"""
Process raw scraped data into match-level format for model training.
This script should run AFTER fbref_scraper.py and BEFORE train_league_models.py
"""
import os
import pandas as pd
import numpy as np
from tqdm import tqdm

# --------------------------
# Paths
# --------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

# --------------------------
# Extract match results from scraped data
# --------------------------
def extract_matches_from_tables(df, league_name):
    """
    Extract individual matches from the scraped table data.
    FBRef provides league tables and match results in different formats.
    """
    print(f"\nProcessing {league_name}...")
    
    # Standardize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    
    # Try to find match results table
    # FBRef has tables with match results that include columns like:
    # 'wk', 'day', 'date', 'time', 'home', 'score', 'away', 'attendance', 'venue', 'referee'
    
    matches = []
    
    # Check if this is a standings table or match results table
    if 'home' in df.columns and 'away' in df.columns and 'score' in df.columns:
        # This is match results data
        for _, row in df.iterrows():
            try:
                home_team = row.get('home', np.nan)
                away_team = row.get('away', np.nan)
                score = row.get('score', np.nan)
                
                if pd.isna(home_team) or pd.isna(away_team) or pd.isna(score):
                    continue
                
                # Parse score (format: "2–1" or "2-1")
                if isinstance(score, str):
                    score = score.replace("-", "–")  # Normalize dash
                    parts = score.split("–")
                    if len(parts) == 2:
                        try:
                            home_goals = int(parts[0].strip())
                            away_goals = int(parts[1].strip())
                            
                            match = {
                                'home_team': home_team,
                                'away_team': away_team,
                                'home_goals': home_goals,
                                'away_goals': away_goals,
                                'date': row.get('date', ''),
                                'season': row.get('source', '').split()[0] if 'source' in row else '',
                                'venue': row.get('venue', ''),
                                'attendance': row.get('attendance', np.nan)
                            }
                            matches.append(match)
                        except (ValueError, AttributeError):
                            continue
            except Exception as e:
                continue
    
    elif 'squad' in df.columns and 'mp' in df.columns:
        # This is a standings table - we need match-by-match data instead
        # For now, skip these tables as they don't contain individual match data
        print(f"  Skipping standings table for {league_name}")
        return pd.DataFrame()
    
    if not matches:
        print(f"  No match data found in {league_name}")
        return pd.DataFrame()
    
    matches_df = pd.DataFrame(matches)
    print(f"  Extracted {len(matches_df)} matches")
    return matches_df

# --------------------------
# Aggregate team statistics
# --------------------------
def calculate_team_stats(matches_df, league_name):
    """
    Calculate rolling team statistics from match data.
    This creates features for ML model training.
    """
    if matches_df.empty:
        return matches_df
    
    print(f"  Calculating team statistics for {league_name}...")
    
    # Sort by date
    if 'date' in matches_df.columns:
        matches_df = matches_df.sort_values('date').reset_index(drop=True)
    
    # Calculate result
    matches_df['result'] = matches_df.apply(
        lambda row: 'win' if row['home_goals'] > row['away_goals'] 
        else ('loss' if row['home_goals'] < row['away_goals'] else 'draw'),
        axis=1
    )
    
    # Calculate rolling statistics for each team
    teams = pd.concat([matches_df['home_team'], matches_df['away_team']]).unique()
    
    # Create team stats dictionaries
    team_stats = {team: {
        'goals_scored': [],
        'goals_conceded': [],
        'wins': 0,
        'draws': 0,
        'losses': 0,
        'matches_played': 0
    } for team in teams}
    
    # Enhanced match data with team statistics
    enhanced_matches = []
    
    for idx, match in matches_df.iterrows():
        home = match['home_team']
        away = match['away_team']
        
        # Get current stats (before this match)
        home_stats = team_stats[home].copy()
        away_stats = team_stats[away].copy()
        
        # Create feature row
        match_features = {
            'home_team': home,
            'away_team': away,
            'home_goals': match['home_goals'],
            'away_goals': match['away_goals'],
            'result': match['result'],
            'season': match['season'],
            
            # Home team stats
            'home_avg_goals_scored': np.mean(home_stats['goals_scored']) if home_stats['goals_scored'] else 0,
            'home_avg_goals_conceded': np.mean(home_stats['goals_conceded']) if home_stats['goals_conceded'] else 0,
            'home_wins': home_stats['wins'],
            'home_draws': home_stats['draws'],
            'home_losses': home_stats['losses'],
            'home_matches_played': home_stats['matches_played'],
            'home_win_rate': home_stats['wins'] / max(home_stats['matches_played'], 1),
            
            # Away team stats
            'away_avg_goals_scored': np.mean(away_stats['goals_scored']) if away_stats['goals_scored'] else 0,
            'away_avg_goals_conceded': np.mean(away_stats['goals_conceded']) if away_stats['goals_conceded'] else 0,
            'away_wins': away_stats['wins'],
            'away_draws': away_stats['draws'],
            'away_losses': away_stats['losses'],
            'away_matches_played': away_stats['matches_played'],
            'away_win_rate': away_stats['wins'] / max(away_stats['matches_played'], 1),
        }
        
        enhanced_matches.append(match_features)
        
        # Update team stats with this match result
        team_stats[home]['goals_scored'].append(match['home_goals'])
        team_stats[home]['goals_conceded'].append(match['away_goals'])
        team_stats[away]['goals_scored'].append(match['away_goals'])
        team_stats[away]['goals_conceded'].append(match['home_goals'])
        
        team_stats[home]['matches_played'] += 1
        team_stats[away]['matches_played'] += 1
        
        if match['result'] == 'win':
            team_stats[home]['wins'] += 1
            team_stats[away]['losses'] += 1
        elif match['result'] == 'loss':
            team_stats[home]['losses'] += 1
            team_stats[away]['wins'] += 1
        else:
            team_stats[home]['draws'] += 1
            team_stats[away]['draws'] += 1
    
    return pd.DataFrame(enhanced_matches)

# --------------------------
# Process all leagues
# --------------------------
def process_all_leagues():
    """
    Process all scraped league data into match-level format.
    """
    csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    
    if not csv_files:
        print("No CSV files found in fbref_data directory.")
        print("Please run fbref_scraper.py first!")
        return
    
    print(f"Found {len(csv_files)} league files to process")
    
    for csv_file in tqdm(csv_files, desc="Processing leagues"):
        league_name = csv_file.replace(".csv", "")
        csv_path = os.path.join(DATA_DIR, csv_file)
        
        try:
            # Read raw scraped data
            df = pd.read_csv(csv_path, low_memory=False)
            
            # Extract match-level data
            matches_df = extract_matches_from_tables(df, league_name)
            
            if matches_df.empty:
                print(f"  Warning: No match data extracted for {league_name}")
                continue
            
            # Calculate team statistics
            processed_df = calculate_team_stats(matches_df, league_name)
            
            if processed_df.empty:
                print(f"  Warning: No processed data for {league_name}")
                continue
            
            # Save processed data
            output_path = os.path.join(PROCESSED_DIR, f"{league_name}_processed.csv")
            processed_df.to_csv(output_path, index=False)
            print(f"  Saved {len(processed_df)} matches to {output_path}")
            
        except Exception as e:
            print(f"  Error processing {league_name}: {e}")
            continue
    
    print("\nProcessing complete!")
    print(f"Processed data saved to: {PROCESSED_DIR}")

# --------------------------
# Main
# --------------------------
if __name__ == "__main__":
    print("="*60)
    print("FB Ref Data Processor")
    print("="*60)
    print("\nThis script processes raw scraped data into match-level format.")
    print("It should be run AFTER fbref_scraper.py and BEFORE train_league_models.py")
    print("="*60)
    
    process_all_leagues()
