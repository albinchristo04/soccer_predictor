#!/usr/bin/env python3
"""
Make predictions using trained models.
Supports head-to-head, cross-league, and season simulation modes.
"""
import os
import json
import argparse
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from tqdm import tqdm
from datetime import datetime

# --------------------------
# Paths
# --------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

# --------------------------
# Helper: Load model
# --------------------------
def load_league_model(league):
    """Load trained model and metadata."""
    model_path = os.path.join(DATA_DIR, league, "model.pkl")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model for '{league}' not found at {model_path}\n"
            f"Please run train_league_models.py first!"
        )
    
    model_data = joblib.load(model_path)
    print(f"Loaded model for {league}")
    print(f"  - Test accuracy: {model_data['test_accuracy']:.3f}")
    print(f"  - Training samples: {model_data['n_samples']}")
    
    return model_data

# --------------------------
# Helper: Load processed data
# --------------------------
def load_league_data(league):
    """Load processed match data."""
    data_path = os.path.join(PROCESSED_DIR, f"{league}_processed.csv")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Data for '{league}' not found at {data_path}\n"
            f"Please run process_scraped_data.py first!"
        )
    
    df = pd.read_csv(data_path, low_memory=False)
    print(f"Loaded {len(df)} matches for {league}")
    
    return df

# --------------------------
# Helper: Get team statistics
# --------------------------
def get_team_stats(df, team_name, model_data):
    """Calculate average statistics for a team."""
    # Find matches where team played (home or away)
    home_matches = df[df['home_team'] == team_name]
    away_matches = df[df['away_team'] == team_name]
    
    if home_matches.empty and away_matches.empty:
        raise ValueError(
            f"Team '{team_name}' not found in data.\n"
            f"Available teams: {sorted(set(df['home_team'].unique()) | set(df['away_team'].unique()))[:10]}..."
        )
    
    # Get feature columns from model
    feature_cols = model_data['feature_cols']
    
    # Calculate average stats when playing at home
    home_features = home_matches[feature_cols].mean() if not home_matches.empty else pd.Series(0, index=feature_cols)
    
    # Calculate average stats when playing away
    away_features = away_matches[feature_cols].mean() if not away_matches.empty else pd.Series(0, index=feature_cols)
    
    # Combine (weighted average favoring recent form)
    combined = (home_features * 0.6 + away_features * 0.4)
    
    return combined.fillna(0)

# --------------------------
# Helper: Save predictions
# --------------------------
def save_prediction(output_dir, filename, proba_dict, title, teams=None):
    """Save prediction as JSON and visualization."""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save JSON
    json_path = os.path.join(output_dir, f"{filename}.json")
    result = {
        'timestamp': datetime.now().isoformat(),
        'title': title,
        'probabilities': proba_dict
    }
    if teams:
        result['teams'] = teams
    
    with open(json_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    # Create visualization
    plt.figure(figsize=(10, 6))
    outcomes = list(proba_dict.keys())
    probabilities = list(proba_dict.values())
    colors = {'win': '#4CAF50', 'draw': '#FFC107', 'loss': '#F44336'}
    bar_colors = [colors.get(o, '#2196F3') for o in outcomes]
    
    bars = plt.bar(outcomes, probabilities, color=bar_colors, edgecolor='black', linewidth=2)
    
    # Add percentage labels
    for bar, prob in zip(bars, probabilities):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.02,
                f'{prob*100:.1f}%',
                ha='center', va='bottom', fontsize=14, fontweight='bold')
    
    plt.title(title, fontsize=16, fontweight='bold', pad=20)
    plt.ylabel('Probability', fontsize=12)
    plt.ylim(0, 1.0)
    plt.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    
    img_path = os.path.join(output_dir, f"{filename}.png")
    plt.savefig(img_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"Saved prediction to: {json_path}")
    print(f"Saved visualization to: {img_path}")

# --------------------------
# Mode 1: Head-to-head prediction
# --------------------------
def predict_head_to_head(league, home_team, away_team):
    """Predict outcome of a specific match."""
    print("\n" + "="*60)
    print("HEAD-TO-HEAD PREDICTION")
    print("="*60)
    print(f"\nLeague: {league}")
    print(f"Home: {home_team}")
    print(f"Away: {away_team}")
    print()
    
    # Load model and data
    model_data = load_league_model(league)
    df = load_league_data(league)
    
    # Get team stats
    print(f"\nCalculating statistics...")
    home_stats = get_team_stats(df, home_team, model_data)
    away_stats = get_team_stats(df, away_team, model_data)
    
    # Create feature vector (difference between teams)
    feature_diff = (home_stats - away_stats).values.reshape(1, -1)
    
    # Make prediction
    model = model_data['model']
    proba = model.predict_proba(feature_diff)[0]
    classes = model_data['classes']
    
    proba_dict = {cls: float(prob) for cls, prob in zip(classes, proba)}
    
    # Display results
    print("\n" + "="*60)
    print("PREDICTION RESULTS")
    print("="*60)
    for outcome, prob in sorted(proba_dict.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * int(prob * 40)
        print(f"{outcome.upper():6s}: {prob*100:5.1f}% {bar}")
    
    # Most likely outcome
    most_likely = max(proba_dict, key=proba_dict.get)
    print(f"\nMost likely: {most_likely.upper()} ({proba_dict[most_likely]*100:.1f}%)")
    
    # Save prediction
    output_dir = os.path.join(DATA_DIR, league, "predictions", "head_to_head")
    filename = f"{home_team.replace(' ', '_')}_vs_{away_team.replace(' ', '_')}"
    title = f"{home_team} vs {away_team}\n{league.replace('_', ' ').title()}"
    
    save_prediction(output_dir, filename, proba_dict, title, 
                   teams={'home': home_team, 'away': away_team})
    
    return proba_dict

# --------------------------
# Mode 2: Cross-league prediction
# --------------------------
def predict_cross_league(team_a, league_a, team_b, league_b):
    """Predict outcome between teams from different leagues."""
    print("\n" + "="*60)
    print("CROSS-LEAGUE PREDICTION")
    print("="*60)
    print(f"\nTeam A: {team_a} ({league_a})")
    print(f"Team B: {team_b} ({league_b})")
    print()
    
    # Load models and data
    model_data_a = load_league_model(league_a)
    model_data_b = load_league_model(league_b)
    df_a = load_league_data(league_a)
    df_b = load_league_data(league_b)
    
    # Get team stats
    print(f"\nCalculating statistics...")
    stats_a = get_team_stats(df_a, team_a, model_data_a)
    stats_b = get_team_stats(df_b, team_b, model_data_b)
    
    # Normalize features (important for cross-league comparison)
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    stats_normalized = scaler.fit_transform([stats_a.values, stats_b.values])
    
    # Calculate feature difference
    feature_diff = (stats_normalized[0] - stats_normalized[1]).reshape(1, -1)
    
    # Get predictions from both models
    model_a = model_data_a['model']
    model_b = model_data_b['model']
    
    proba_a = model_a.predict_proba(feature_diff)[0]
    proba_b = model_b.predict_proba(feature_diff)[0]
    
    # Ensemble prediction (weighted by model accuracy)
    weight_a = model_data_a['test_accuracy']
    weight_b = model_data_b['test_accuracy']
    
    classes = model_data_a['classes']
    proba_ensemble = (proba_a * weight_a + proba_b * weight_b) / (weight_a + weight_b)
    
    proba_dict = {cls: float(prob) for cls, prob in zip(classes, proba_ensemble)}
    
    # Display results
    print("\n" + "="*60)
    print("PREDICTION RESULTS")
    print("="*60)
    print(f"\n{league_a} model prediction:")
    for cls, prob in zip(classes, proba_a):
        print(f"  {cls:6s}: {prob*100:5.1f}%")
    
    print(f"\n{league_b} model prediction:")
    for cls, prob in zip(classes, proba_b):
        print(f"  {cls:6s}: {prob*100:5.1f}%")
    
    print(f"\nEnsemble prediction (weighted by accuracy):")
    for outcome, prob in sorted(proba_dict.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * int(prob * 40)
        print(f"{outcome.upper():6s}: {prob*100:5.1f}% {bar}")
    
    # Save prediction
    output_dir = os.path.join(DATA_DIR, "cross_league_predictions")
    filename = f"{team_a.replace(' ', '_')}_vs_{team_b.replace(' ', '_')}"
    title = f"{team_a} ({league_a}) vs {team_b} ({league_b})"
    
    save_prediction(output_dir, filename, proba_dict, title,
                   teams={'team_a': team_a, 'league_a': league_a,
                         'team_b': team_b, 'league_b': league_b})
    
    return proba_dict

# --------------------------
# Mode 3: Season simulation
# --------------------------
def simulate_season(league, num_simulations=1000):
    """Monte Carlo simulation of entire season."""
    print("\n" + "="*60)
    print("SEASON SIMULATION")
    print("="*60)
    print(f"\nLeague: {league}")
    print(f"Simulations: {num_simulations}")
    print()
    
    # Load model and data
    model_data = load_league_model(league)
    df = load_league_data(league)
    
    # Get unique teams
    teams = sorted(set(df['home_team'].unique()) | set(df['away_team'].unique()))
    teams = [t for t in teams if pd.notna(t)]
    
    print(f"Teams in league: {len(teams)}")
    print()
    
    # Initialize results storage
    final_points = {team: [] for team in teams}
    
    # Run simulations
    model = model_data['model']
    classes = model_data['classes']
    
    for sim in tqdm(range(num_simulations), desc="Simulating seasons"):
        points = {team: 0 for team in teams}
        
        # Simulate each match in the dataset
        for _, match in df.iterrows():
            home = match['home_team']
            away = match['away_team']
            
            if pd.isna(home) or pd.isna(away):
                continue
            
            # Get team stats
            try:
                home_stats = get_team_stats(df, home, model_data)
                away_stats = get_team_stats(df, away, model_data)
                
                # Predict outcome
                feature_diff = (home_stats - away_stats).values.reshape(1, -1)
                proba = model.predict_proba(feature_diff)[0]
                
                # Sample outcome
                outcome = np.random.choice(classes, p=proba)
                
                # Award points
                if outcome == 'win':
                    points[home] += 3
                elif outcome == 'draw':
                    points[home] += 1
                    points[away] += 1
                elif outcome == 'loss':
                    points[away] += 3
                    
            except (ValueError, KeyError):
                continue
        
        # Store final points
        for team in teams:
            final_points[team].append(points[team])
    
    # Calculate statistics
    print("\n" + "="*60)
    print("SIMULATION RESULTS")
    print("="*60)
    
    results = []
    for team in teams:
        if not final_points[team]:
            continue
        
        results.append({
            'team': team,
            'avg_points': np.mean(final_points[team]),
            'std_points': np.std(final_points[team]),
            'min_points': np.min(final_points[team]),
            'max_points': np.max(final_points[team]),
            'champion_prob': np.sum([pts == max([np.mean(final_points[t]) for t in teams]) 
                                    for pts in final_points[team]]) / num_simulations
        })
    
    results_df = pd.DataFrame(results).sort_values('avg_points', ascending=False)
    
    print("\nProjected Final Standings:")
    print("-" * 80)
    print(f"{'Rank':<6} {'Team':<30} {'Avg Pts':<10} {'Range':<15} {'Champion %':<12}")
    print("-" * 80)
    
    for idx, row in results_df.iterrows():
        rank = results_df.index.get_loc(idx) + 1
        range_str = f"{row['min_points']:.0f}-{row['max_points']:.0f}"
        print(f"{rank:<6} {row['team']:<30} {row['avg_points']:>7.1f}    "
              f"{range_str:<15} {row['champion_prob']*100:>7.1f}%")
    
    # Save results
    output_dir = os.path.join(DATA_DIR, league, "predictions", "season_simulation")
    
    # Champion probabilities
    champion_probs = results_df.set_index('team')['champion_prob'].to_dict()
    save_prediction(output_dir, "champion_probabilities", champion_probs,
                   f"{league.replace('_', ' ').title()} - Championship Probabilities")
    
    # Save detailed results
    results_df.to_csv(os.path.join(output_dir, "full_simulation_results.csv"), index=False)
    print(f"\nFull results saved to: {output_dir}")
    
    return results_df

# --------------------------
# CLI
# --------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Soccer Match Prediction & Analysis Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Head-to-head prediction
  python predict_and_analyze.py --mode head_to_head \\
      --league premier_league \\
      --home_team "Manchester City" \\
      --away_team "Liverpool"
  
  # Cross-league prediction
  python predict_and_analyze.py --mode cross_league \\
      --league_a premier_league --team_a "Manchester City" \\
      --league_b la_liga --team_b "Real Madrid"
  
  # Season simulation
  python predict_and_analyze.py --mode season_simulation \\
      --league premier_league \\
      --simulations 10000
        """
    )
    
    parser.add_argument("--mode", type=str, required=True,
                       choices=["head_to_head", "cross_league", "season_simulation"],
                       help="Prediction mode")
    parser.add_argument("--league", type=str, help="League name")
    parser.add_argument("--home_team", type=str, help="Home team name")
    parser.add_argument("--away_team", type=str, help="Away team name")
    parser.add_argument("--league_a", type=str, help="First league (cross-league)")
    parser.add_argument("--team_a", type=str, help="First team (cross-league)")
    parser.add_argument("--league_b", type=str, help="Second league (cross-league)")
    parser.add_argument("--team_b", type=str, help="Second team (cross-league)")
    parser.add_argument("--simulations", type=int, default=1000,
                       help="Number of simulations (season mode)")
    
    args = parser.parse_args()
    
    try:
        if args.mode == "head_to_head":
            if not all([args.league, args.home_team, args.away_team]):
                parser.error("head_to_head requires --league, --home_team, --away_team")
            predict_head_to_head(args.league, args.home_team, args.away_team)
            
        elif args.mode == "cross_league":
            if not all([args.league_a, args.team_a, args.league_b, args.team_b]):
                parser.error("cross_league requires --league_a, --team_a, --league_b, --team_b")
            predict_cross_league(args.team_a, args.league_a, args.team_b, args.league_b)
            
        elif args.mode == "season_simulation":
            if not args.league:
                parser.error("season_simulation requires --league")
            simulate_season(args.league, args.simulations)
            
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
