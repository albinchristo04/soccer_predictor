#!/usr/bin/env python3
"""
Prediction and analysis tool for the Soccer Predictor application.

This script provides a command-line interface for performing various prediction
and analysis tasks. It supports head-to-head predictions, cross-league
comparisons, and full season simulations using Monte Carlo methods.

The tool is designed for usability, with features like case-insensitive team name
matching and the ability to handle multi-word team names. It loads trained
models and processed data to generate predictions and statistical insights.

Key functionalities include:
- Predicting outcomes for specific head-to-head matches.
- Simulating matches between teams from different leagues.
- Running Monte Carlo simulations to project final league standings.
- Calculating and displaying detailed statistics for leagues and teams.
- Saving prediction results and visualizations to the filesystem.

This script serves as a powerful tool for interacting with the trained models
and exploring the data outside of the main web application.
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
import warnings
from typing import List, Dict, Any, Optional, Tuple, Set

warnings.filterwarnings("ignore")

# --------------------------
# Paths
# --------------------------
BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR: str = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR: str = os.path.join(DATA_DIR, "processed")


# --------------------------
# Load model
# --------------------------
def load_league_model(league: str) -> Dict[str, Any]:
    """
    Load a trained model for a specific league.

    Args:
        league: The name of the league.

    Returns:
        A dictionary containing the model and associated metadata.

    Raises:
        FileNotFoundError: If the model file does not exist.
    """
    model_path = os.path.join(DATA_DIR, league, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model for '{league}' not found. Please train first!")
    model_data = joblib.load(model_path)
    print(f"Loaded {league} model (accuracy: {model_data.get('test_accuracy', 0):.3f})")
    return model_data


# --------------------------
# Load data
# --------------------------
def load_league_data(league: str) -> pd.DataFrame:
    """
    Load processed match data for a league.

    Args:
        league: The name of the league.

    Returns:
        A pandas DataFrame with the match data.

    Raises:
        FileNotFoundError: If the data file does not exist.
    """
    data_path = os.path.join(PROCESSED_DIR, f"{league}_processed.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Data for '{league}' not found. Please process data first!"
        )
    return pd.read_csv(data_path, low_memory=False)


def get_all_teams_for_league(league: str) -> List[str]:
    """
    Get a sorted list of all unique team names for a given league.

    Args:
        league: The name of the league.

    Returns:
        A sorted list of team names.
    """
    df = load_league_data(league)
    all_teams: Set[str] = set(df["home_team"].unique()) | set(df["away_team"].unique())
    return sorted([team for team in all_teams if pd.notna(team)])


# --------------------------
# Find team (case-insensitive fuzzy match)
# --------------------------
def find_team(team_input: str, available_teams: List[str]) -> str:
    """
    Find a team name with case-insensitive and partial matching.

    Args:
        team_input: The team name to search for.
        available_teams: A list of available team names.

    Returns:
        The matched team name.

    Raises:
        ValueError: If no match is found.
    """
    team_input = team_input.strip()
    for team in available_teams:
        if team.lower() == team_input.lower():
            return team
    for team in available_teams:
        if team_input.lower() in team.lower():
            return team
    raise ValueError(
        f"Team '{team_input}' not found.\n"
        f"Available teams: {', '.join(sorted(available_teams)[:10])}..."
    )


# --------------------------
# Get team statistics
# --------------------------
def get_team_stats(
    df: pd.DataFrame,
    team_name: str,
    model_data: Dict[str, Any],
) -> pd.Series:
    """
    Calculate the average statistics for a team.

    Args:
        df: DataFrame with match data.
        team_name: The name of the team.
        model_data: The model data dictionary.

    Returns:
        A pandas Series with the team's average statistics.
    """
    home_matches = df[df["home_team"].str.lower() == team_name.lower()]
    away_matches = df[df["away_team"].str.lower() == team_name.lower()]

    if home_matches.empty and away_matches.empty:
        available = sorted(
            set(df["home_team"].unique()) | set(df["away_team"].unique())
        )
        raise ValueError(
            f"Team '{team_name}' not found. Available: {', '.join(available[:10])}..."
        )

    feature_cols = model_data["feature_cols"]
    home_features = (
        home_matches[feature_cols].mean()
        if not home_matches.empty
        else pd.Series(0, index=feature_cols)
    )
    away_features = (
        away_matches[feature_cols].mean()
        if not away_matches.empty
        else pd.Series(0, index=feature_cols)
    )

    combined = home_features * 0.6 + away_features * 0.4
    return combined.fillna(0)


# --------------------------
# Save prediction
# --------------------------
def save_prediction(
    output_dir: str,
    filename: str,
    proba_dict: Dict[str, float],
    title: str,
    teams: Optional[Dict[str, str]] = None,
) -> None:
    """
    Save prediction results to JSON and create a visualization.

    Args:
        output_dir: The directory to save the files in.
        filename: The base name for the output files.
        proba_dict: A dictionary of outcome probabilities.
        title: The title for the visualization.
        teams: Optional dictionary of team names.
    """
    os.makedirs(output_dir, exist_ok=True)

    json_path = os.path.join(output_dir, f"{filename}.json")
    result: Dict[str, Any] = {
        "timestamp": datetime.now().isoformat(),
        "title": title,
        "probabilities": proba_dict,
    }
    if teams:
        result["teams"] = teams

    with open(json_path, "w") as f:
        json.dump(result, f, indent=2)

    plt.figure(figsize=(10, 6))
    outcomes = list(proba_dict.keys())
    probabilities = list(proba_dict.values())
    colors = {"win": "#4CAF50", "draw": "#FFC107", "loss": "#F44336"}
    bar_colors = [colors.get(o, "#2196F3") for o in outcomes]

    bars = plt.bar(
        outcomes, probabilities, color=bar_colors, edgecolor="black", linewidth=2
    )

    for bar, prob in zip(bars, probabilities):
        height = bar.get_height()
        plt.text(
            bar.get_x() + bar.get_width() / 2.0,
            height + 0.02,
            f"{prob*100:.1f}%",
            ha="center",
            va="bottom",
            fontsize=14,
            fontweight="bold",
        )

    plt.title(title, fontsize=16, fontweight="bold", pad=20)
    plt.ylabel("Probability", fontsize=12)
    plt.ylim(0, 1.0)
    plt.grid(axis="y", alpha=0.3)
    plt.tight_layout()

    img_path = os.path.join(output_dir, f"{filename}.png")
    plt.savefig(img_path, dpi=150, bbox_inches="tight")
    plt.close()

    print(f"Saved: {json_path}")
    print(f"Saved: {img_path}")


# --------------------------
# Analytics Functions
# --------------------------
def get_league_stats(league: str) -> Dict[str, Any]:
    """
    Get overall statistics for a league.

    Args:
        league: The name of the league.

    Returns:
        A dictionary of league statistics.
    """
    df = load_league_data(league)
    total_matches = len(df)
    home_wins = (df["result"] == "win").sum()
    away_wins = (df["result"] == "loss").sum()
    draws = (df["result"] == "draw").sum()

    avg_home_goals = df["home_goals"].mean()
    avg_away_goals = df["away_goals"].mean()
    avg_total_goals = df.get("total_goals", df["home_goals"] + df["away_goals"]).mean()

    return {
        "total_matches": total_matches,
        "home_wins": int(home_wins),
        "away_wins": int(away_wins),
        "draws": int(draws),
        "home_win_percentage": round((home_wins / total_matches) * 100, 2),
        "away_win_percentage": round((away_wins / total_matches) * 100, 2),
        "draw_percentage": round((draws / total_matches) * 100, 2),
        "avg_home_goals": round(avg_home_goals, 2),
        "avg_away_goals": round(avg_away_goals, 2),
        "avg_total_goals": round(avg_total_goals, 2),
    }


def get_team_detailed_stats(league: str, team_name: str) -> Dict[str, Any]:
    """
    Get detailed statistics for a specific team in a league.

    Args:
        league: The name of the league.
        team_name: The name of the team.

    Returns:
        A dictionary of detailed team statistics.
    """
    df = load_league_data(league)
    available_teams = get_all_teams_for_league(league)
    team_name = find_team(team_name, available_teams)

    team_matches = df[
        (df["home_team"].str.lower() == team_name.lower())
        | (df["away_team"].str.lower() == team_name.lower())
    ].copy()

    if team_matches.empty:
        raise ValueError(f"No matches found for team '{team_name}' in {league}.")

    total_matches = len(team_matches)
    team_matches["team_goals_scored"] = np.where(
        team_matches["home_team"].str.lower() == team_name.lower(),
        team_matches["home_goals"],
        team_matches["away_goals"],
    )
    team_matches["team_goals_conceded"] = np.where(
        team_matches["home_team"].str.lower() == team_name.lower(),
        team_matches["away_goals"],
        team_matches["home_goals"],
    )

    avg_goals_scored = team_matches["team_goals_scored"].mean()
    avg_goals_conceded = team_matches["team_goals_conceded"].mean()

    wins = np.where(
        (team_matches["home_team"].str.lower() == team_name.lower())
        & (team_matches["result"] == "win"),
        1,
        0,
    ) + np.where(
        (team_matches["away_team"].str.lower() == team_name.lower())
        & (team_matches["result"] == "loss"),
        1,
        0,
    )
    draws = (team_matches["result"] == "draw").sum()
    team_wins = wins.sum()
    team_losses = total_matches - team_wins - draws

    return {
        "team_name": team_name,
        "total_matches": total_matches,
        "wins": team_wins,
        "draws": draws,
        "losses": team_losses,
        "win_percentage": round((team_wins / total_matches) * 100, 2),
        "draw_percentage": round((draws / total_matches) * 100, 2),
        "loss_percentage": round((team_losses / total_matches) * 100, 2),
        "avg_goals_scored": round(avg_goals_scored, 2),
        "avg_goals_conceded": round(avg_goals_conceded, 2),
    }


def get_season_trends(league: str) -> List[Dict[str, Any]]:
    """
    Get data for plotting season trends.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries with season trend data.
    """
    df = load_league_data(league)
    if "season" not in df.columns:
        raise ValueError(
            f"'season' column not found in {league} data. Cannot generate trends."
        )
    df["season"] = df["season"].astype(str)
    season_data = (
        df.groupby("season")
        .agg(
            avg_total_goals=("total_goals", "mean"),
            avg_home_goals=("home_goals", "mean"),
            avg_away_goals=("away_goals", "mean"),
            total_matches=("date", "count"),
        )
        .reset_index()
    )
    return season_data.to_dict(orient="records")


# --------------------------
# Prediction Functions
# --------------------------
def predict_head_to_head(
    league: str,
    home_team: str,
    away_team: str,
) -> Dict[str, float]:
    """
    Predict the outcome of a head-to-head match.

    Args:
        league: The league of the match.
        home_team: The home team name.
        away_team: The away team name.

    Returns:
        A dictionary of prediction probabilities.
    """
    print("\n" + "=" * 60)
    print("HEAD-TO-HEAD PREDICTION")
    print("=" * 60)

    model_data = load_league_model(league)
    df = load_league_data(league)
    available_teams = get_all_teams_for_league(league)
    home_team = find_team(home_team, available_teams)
    away_team = find_team(away_team, available_teams)

    print(
        f"\nHome: {home_team}\nAway: {away_team}\nLeague: {league.replace('_', ' ').title()}"
    )

    home_stats = get_team_stats(df, home_team, model_data)
    away_stats = get_team_stats(df, away_team, model_data)

    feature_diff = (home_stats - away_stats).values.reshape(1, -1)
    model = model_data["model"]
    proba = model.predict_proba(feature_diff)[0]
    classes = model_data["classes"]
    proba_dict = {cls: float(prob) for cls, prob in zip(classes, proba)}

    print("\n" + "=" * 60)
    print("PREDICTION RESULTS")
    print("=" * 60)

    win_prob = proba_dict.get("win", 0)
    draw_prob = proba_dict.get("draw", 0)
    loss_prob = proba_dict.get("loss", 0)

    print(f"\n{'Outcome':<20} {'Probability':<15} {'Bar'}")
    print("-" * 60)
    print(
        f"{home_team + ' WINS':<20} {win_prob*100:>6.1f}%       {'█' * int(win_prob * 40)}"
    )
    print(f"{'DRAW':<20} {draw_prob*100:>6.1f}%       {'█' * int(draw_prob * 40)}")
    print(
        f"{away_team + ' WINS':<20} {loss_prob*100:>6.1f}%       {'█' * int(loss_prob * 40)}"
    )
    print("-" * 60)

    if win_prob > max(draw_prob, loss_prob):
        print(f"\nMost Likely: {home_team} WINS ({win_prob*100:.1f}%)")
    elif loss_prob > max(win_prob, draw_prob):
        print(f"\nMost Likely: {away_team} WINS ({loss_prob*100:.1f}%)")
    else:
        print(f"\nMost Likely: DRAW ({draw_prob*100:.1f}%)")

    output_dir = os.path.join(DATA_DIR, league, "predictions", "head_to_head")
    filename = f"{home_team.replace(' ', '_')}_vs_{away_team.replace(' ', '_')}"
    title = f"{home_team} vs {away_team}\n{league.replace('_', ' ').title()}"
    save_prediction(
        output_dir,
        filename,
        proba_dict,
        title,
        teams={"home": home_team, "away": away_team},
    )
    return proba_dict


def predict_cross_league(
    team_a: str,
    league_a: str,
    team_b: str,
    league_b: str,
) -> Dict[str, float]:
    """
    Predict the outcome of a cross-league match.

    Args:
        team_a: Name of the first team.
        league_a: League of the first team.
        team_b: Name of the second team.
        league_b: League of the second team.

    Returns:
        A dictionary of prediction probabilities.
    """
    print("\n" + "=" * 60)
    print("CROSS-LEAGUE PREDICTION")
    print("=" * 60)

    model_data_a = load_league_model(league_a)
    model_data_b = load_league_model(league_b)
    df_a = load_league_data(league_a)
    df_b = load_league_data(league_b)

    teams_a = get_all_teams_for_league(league_a)
    teams_b = get_all_teams_for_league(league_b)

    team_a = find_team(team_a, teams_a)
    team_b = find_team(team_b, teams_b)

    print(f"\n{team_a} ({league_a})\n     VS\n{team_b} ({league_b})")

    stats_a = get_team_stats(df_a, team_a, model_data_a)
    stats_b = get_team_stats(df_b, team_b, model_data_b)

    from sklearn.preprocessing import StandardScaler

    scaler = StandardScaler()
    stats_normalized = scaler.fit_transform([stats_a.values, stats_b.values])
    feature_diff = (stats_normalized[0] - stats_normalized[1]).reshape(1, -1)

    model_a = model_data_a["model"]
    model_b = model_data_b["model"]
    proba_a = model_a.predict_proba(feature_diff)[0]
    proba_b = model_b.predict_proba(feature_diff)[0]

    weight_a = model_data_a.get("test_accuracy", 0.5)
    weight_b = model_data_b.get("test_accuracy", 0.5)

    classes = model_data_a["classes"]
    proba_ensemble = (proba_a * weight_a + proba_b * weight_b) / (weight_a + weight_b)
    proba_dict = {cls: float(prob) for cls, prob in zip(classes, proba_ensemble)}

    print("\n" + "=" * 60)
    print("PREDICTION RESULTS")
    print("=" * 60)

    win_prob = proba_dict.get("win", 0)
    draw_prob = proba_dict.get("draw", 0)
    loss_prob = proba_dict.get("loss", 0)

    print(
        f"\n{team_a} WINS: {win_prob*100:.1f}%\nDRAW:         {draw_prob*100:.1f}%\n{team_b} WINS: {loss_prob*100:.1f}%"
    )

    output_dir = os.path.join(DATA_DIR, "cross_league_predictions")
    filename = f"{team_a.replace(' ', '_')}_vs_{team_b.replace(' ', '_')}"
    title = f"{team_a} ({league_a}) vs {team_b} ({league_b})"
    save_prediction(
        output_dir,
        filename,
        proba_dict,
        title,
        teams={
            "team_a": team_a,
            "league_a": league_a,
            "team_b": team_b,
            "league_b": league_b,
        },
    )
    return proba_dict


def simulate_season(league: str, num_simulations: int = 1000) -> pd.DataFrame:
    """
    Run a Monte Carlo simulation of a league season.

    Args:
        league: The name of the league to simulate.
        num_simulations: The number of simulations to run.

    Returns:
        A pandas DataFrame with the simulation results.
    """
    print("\n" + "=" * 60)
    print("SEASON SIMULATION")
    print("=" * 60)

    model_data = load_league_model(league)
    df = load_league_data(league)
    teams = get_all_teams_for_league(league)

    print(
        f"\nLeague: {league.replace('_', ' ').title()}\nTeams: {len(teams)}\nSimulations: {num_simulations:,}"
    )

    final_points: Dict[str, List[int]] = {team: [] for team in teams}
    model = model_data["model"]
    classes = model_data["classes"]
    feature_cols = model_data["feature_cols"]

    for _ in tqdm(range(num_simulations), desc="Simulating seasons", ncols=80):
        points: Dict[str, int] = {team: 0 for team in teams}
        for _, match in df.iterrows():
            home = match["home_team"]
            away = match["away_team"]
            if pd.isna(home) or pd.isna(away):
                continue
            try:
                home_features = match[
                    [c for c in feature_cols if c.startswith("home_")]
                ].values
                away_features = match[
                    [c for c in feature_cols if c.startswith("away_")]
                ].values
                feature_diff = (
                    pd.Series(home_features) - pd.Series(away_features)
                ).values.reshape(1, -1)
                proba = model.predict_proba(feature_diff)[0]
                outcome = np.random.choice(classes, p=proba)

                if outcome == "win":
                    points[home] += 3
                elif outcome == "draw":
                    points[home] += 1
                    points[away] += 1
                else:  # loss
                    points[away] += 3
            except (ValueError, KeyError, IndexError):
                continue
        for team in teams:
            final_points[team].append(points[team])

    print("\n" + "=" * 60)
    print("SIMULATION RESULTS")
    print("=" * 60)

    results: List[Dict[str, Any]] = []
    for team in teams:
        if not final_points[team]:
            continue
        results.append(
            {
                "team": team,
                "avg_points": np.mean(final_points[team]),
                "std_points": np.std(final_points[team]),
                "min_points": np.min(final_points[team]),
                "max_points": np.max(final_points[team]),
            }
        )

    results_df = pd.DataFrame(results).sort_values("avg_points", ascending=False)

    print("\nProjected Final Standings:")
    print("-" * 80)
    print(f"{'Rank':<6} {'Team':<35} {'Avg Pts':<12} {'Range':<15}")
    print("-" * 80)

    for i, row in results_df.iterrows():
        rank = results_df.index.get_loc(i) + 1
        range_str = f"{row['min_points']:.0f}-{row['max_points']:.0f}"
        print(
            f"{rank:<6} {row['team']:<35} {row['avg_points']:>7.1f}     {range_str:<15}"
        )

    output_dir = os.path.join(DATA_DIR, league, "predictions", "season_simulation")
    champion_probs = (
        results_df["avg_points"] / results_df["avg_points"].sum()
    ).to_dict()
    save_prediction(
        output_dir,
        "champion_probabilities",
        champion_probs,
        f"{league.replace('_', ' ').title()} - Championship Probabilities",
    )

    results_df.to_csv(
        os.path.join(output_dir, "full_simulation_results.csv"), index=False
    )
    print(f"\nFull results: {output_dir}")

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
  # Head-to-head (handles spaces and case)
  python scripts/predict_and_analyze.py --mode head_to_head \
      --league premier_league \
      --home_team "manchester city" \
      --away_team "liverpool"
  
  # Cross-league
  python scripts/predict_and_analyze.py --mode cross_league \
      --league_a premier_league --team_a "Manchester City" \
      --league_b la_liga --team_b "real madrid"
  
  # Season simulation
  python scripts/predict_and_analyze.py --mode season_simulation \
      --league premier_league --simulations 10000
        """,
    )

    parser.add_argument(
        "--mode",
        type=str,
        required=True,
        choices=["head_to_head", "cross_league", "season_simulation"],
    )
    parser.add_argument("--league", type=str)
    parser.add_argument("--home_team", type=str, nargs="+")
    parser.add_argument("--away_team", type=str, nargs="+")
    parser.add_argument("--league_a", type=str)
    parser.add_argument("--team_a", type=str, nargs="+")
    parser.add_argument("--league_b", type=str)
    parser.add_argument("--team_b", type=str, nargs="+")
    parser.add_argument("--simulations", type=int, default=1000)

    args = parser.parse_args()

    if args.home_team:
        args.home_team = " ".join(args.home_team)
    if args.away_team:
        args.away_team = " ".join(args.away_team)
    if args.team_a:
        args.team_a = " ".join(args.team_a)
    if args.team_b:
        args.team_b = " ".join(args.team_b)

    try:
        if args.mode == "head_to_head":
            if not all([args.league, args.home_team, args.away_team]):
                parser.error("head_to_head requires --league, --home_team, --away_team")
            predict_head_to_head(args.league, args.home_team, args.away_team)

        elif args.mode == "cross_league":
            if not all([args.league_a, args.team_a, args.league_b, args.team_b]):
                parser.error(
                    "cross_league requires --league_a, --team_a, --league_b, --team_b"
                )
            predict_cross_league(args.team_a, args.league_a, args.team_b, args.league_b)

        elif args.mode == "season_simulation":
            if not args.league:
                parser.error("season_simulation requires --league")
            simulate_season(args.league, args.simulations)

    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
