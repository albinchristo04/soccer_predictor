#!/usr/bin/env python3
"""
Enhanced data processor for FBRef scraper data.

This script processes the raw scraped data from FBRef, which includes both match
fixtures and team statistics. It cleans, transforms, and enriches the data to
create a feature-rich dataset suitable for machine learning.

The main processing steps include:
- Extracting structured match results from fixture tables.
- Extracting team-level statistics from separate stats tables.
- Merging match results with team statistics to enrich the match data.
- Calculating rolling statistics (e.g., form, win rate) for each team.
- Handling different data formats and column names gracefully.

The output is a set of processed CSV files, one for each league, which are
saved in the `fbref_data/processed` directory. This processed data serves as the
input for training the prediction models.
"""

import os
import pandas as pd
import numpy as np
from tqdm import tqdm
import warnings
from typing import List, Dict, Any, Optional

warnings.filterwarnings("ignore")

# --------------------------
# Paths
# --------------------------
SCRIPT_DIR: str = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR: str = os.path.dirname(SCRIPT_DIR)
DATA_DIR: str = os.path.join(ROOT_DIR, "fbref_data")
PROCESSED_DIR: str = os.path.join(DATA_DIR, "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)


# --------------------------
# Extract match results
# --------------------------
def extract_match_results(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract match results from a DataFrame of fixture data.

    Args:
        df: The DataFrame containing fixture data.

    Returns:
        A DataFrame with structured match results.
    """
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    matches: List[Dict[str, Any]] = []

    if "home" in df.columns and "away" in df.columns:
        for _, row in df.iterrows():
            try:
                home, away, score = row.get("home"), row.get("away"), row.get("score")
                if pd.isna(home) or pd.isna(away):
                    continue

                match_data = {
                    "home_team": str(home).strip(),
                    "away_team": str(away).strip(),
                    "date": row.get("date"),
                    "attendance": row.get("attendance"),
                    "venue": row.get("venue"),
                    "referee": row.get("referee"),
                    "status": "played",
                    "home_goals": np.nan,
                    "away_goals": np.nan,
                    "season": (
                        str(row.get("_source", "")).split("_")[0]
                        if row.get("_source")
                        else ""
                    ),
                }

                if pd.notna(score) and isinstance(score, str):
                    score = score.replace("-", "–").replace("—", "–")
                    parts = score.split("–")
                    if len(parts) == 2:
                        try:
                            match_data["home_goals"] = int(parts[0])
                            match_data["away_goals"] = int(parts[1])
                        except (ValueError, AttributeError):
                            match_data["status"] = "scheduled"
                else:
                    match_data["status"] = "scheduled"

                matches.append(match_data)
            except Exception:
                continue

    return pd.DataFrame(matches)


# --------------------------
# Extract team statistics
# --------------------------
def extract_team_stats(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract team-level statistics from a DataFrame of stats tables.

    Args:
        df: The DataFrame containing team statistics.

    Returns:
        A DataFrame with cleaned and selected team statistics.
    """
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    team_col = "squad" if "squad" in df.columns else "team"

    if team_col in df.columns:
        valid_teams = df[team_col].notna() & (df[team_col].astype(str).str.len() > 2)
        df_filtered = df[valid_teams].copy()

        if not (10 <= len(df_filtered) <= 100):
            return pd.DataFrame()

        numeric_cols = df_filtered.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) > 50:
            keywords = [
                "gf",
                "ga",
                "xg",
                "poss",
                "sh",
                "sot",
                "pass",
                "tkl",
                "int",
                "clr",
                "pts",
                "w",
                "d",
                "l",
            ]
            numeric_cols = [
                c for c in numeric_cols if any(kw in c.lower() for kw in keywords)
            ][:30]

        if numeric_cols:
            stats_df = df_filtered[[team_col] + numeric_cols].copy()
            stats_df.rename(columns={team_col: "team"}, inplace=True)
            stats_df["team"] = stats_df["team"].str.strip()
            return stats_df.drop_duplicates(subset=["team"], keep="first")

    return pd.DataFrame()


# --------------------------
# Merge match results with team stats
# --------------------------
def enrich_matches_with_stats(
    matches_df: pd.DataFrame, team_stats_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Enrich match data by merging it with team statistics.

    Args:
        matches_df: DataFrame of match results.
        team_stats_df: DataFrame of team statistics.

    Returns:
        An enriched DataFrame with merged stats for home and away teams.
    """
    if team_stats_df.empty or matches_df.empty:
        return matches_df

    team_stats_df["team"] = team_stats_df["team"].str.strip()
    matches_df["home_team"] = matches_df["home_team"].str.strip()
    matches_df["away_team"] = matches_df["away_team"].str.strip()

    home_stats = team_stats_df.add_prefix("home_").rename(
        columns={"home_team": "home_team"}
    )
    enriched = matches_df.merge(home_stats, on="home_team", how="left")

    away_stats = team_stats_df.add_prefix("away_").rename(
        columns={"away_team": "away_team"}
    )
    return enriched.merge(away_stats, on="away_team", how="left")


# --------------------------
# Calculate rolling statistics
# --------------------------
def calculate_rolling_stats(matches_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate rolling statistics and form metrics for each team.

    Args:
        matches_df: The DataFrame of match data.

    Returns:
        A DataFrame with added rolling statistics for each match.
    """
    if matches_df.empty:
        return matches_df

    # Sort by date
    if "date" in matches_df.columns:
        matches_df = matches_df.sort_values("date").reset_index(drop=True)

    teams = pd.concat([matches_df["home_team"], matches_df["away_team"]]).unique()
    team_stats: Dict[str, Dict[str, Any]] = {
        team: {
            "goals_scored": [],
            "goals_conceded": [],
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "matches_played": 0,
        }
        for team in teams
    }
    enhanced_matches: List[Dict[str, Any]] = []

    for _, match in matches_df.iterrows():
        home, away = match["home_team"], match["away_team"]
        home_s, away_s = (
            team_stats.get(home, {}).copy(),
            team_stats.get(away, {}).copy(),
        )

        if not home_s or not away_s:
            continue

        match_features = match.to_dict()
        for p, s in [("home", home_s), ("away", away_s)]:
            match_features[f"{p}_form_goals_scored"] = (
                np.mean(s["goals_scored"][-5:]) if s["goals_scored"] else 0
            )
            match_features[f"{p}_form_goals_conceded"] = (
                np.mean(s["goals_conceded"][-5:]) if s["goals_conceded"] else 0
            )
            match_features[f"{p}_form_win_rate"] = s["wins"] / max(
                s["matches_played"], 1
            )
        enhanced_matches.append(match_features)

        if match["status"] == "played":
            # Update stats only for played matches
            team_stats[home]["goals_scored"].append(match["home_goals"])
            team_stats[home]["goals_conceded"].append(match["away_goals"])
            team_stats[away]["goals_scored"].append(match["away_goals"])
            team_stats[away]["goals_conceded"].append(match["home_goals"])
            team_stats[home]["matches_played"] += 1
            team_stats[away]["matches_played"] += 1

            if match["home_goals"] > match["away_goals"]:
                team_stats[home]["wins"] += 1
                team_stats[away]["losses"] += 1
            elif match["home_goals"] < match["away_goals"]:
                team_stats[home]["losses"] += 1
                team_stats[away]["wins"] += 1
            else:
                team_stats[home]["draws"] += 1
                team_stats[away]["draws"] += 1

    enhanced_df = pd.DataFrame(enhanced_matches)
    enhanced_df["result"] = np.nan
    played_mask = enhanced_df["status"] == "played"
    enhanced_df.loc[played_mask, "result"] = enhanced_df[played_mask].apply(
        lambda row: (
            "win"
            if row["home_goals"] > row["away_goals"]
            else ("loss" if row["home_goals"] < row["away_goals"] else "draw")
        ),
        axis=1,
    )

    return enhanced_df


# --------------------------
# Process league
# --------------------------
def process_league(league_name: str, csv_path: str) -> Optional[pd.DataFrame]:
    """
    Process the data for a single league.

    Args:
        league_name: The name of the league.
        csv_path: The path to the raw CSV data file.

    Returns:
        A processed DataFrame, or None if processing fails.
    """
    print(f"\n{'='*60}")
    print(f"Processing {league_name}")
    print(f"{'='*60}")

    try:
        df = pd.read_csv(csv_path, low_memory=False)
        print(f"Loaded {len(df)} rows from raw data")

        fixtures_df = (
            df[df["_source"].str.contains("fixtures", na=False)]
            if "_source" in df.columns
            else df
        )
        stats_df = (
            df[df["_source"].str.contains("stats", na=False)]
            if "_source" in df.columns
            else pd.DataFrame()
        )

        matches = extract_match_results(fixtures_df)
        if matches.empty:
            print("No match results found")
            return None
        print(f"Extracted {len(matches)} matches")

        team_stats = (
            extract_team_stats(stats_df) if not stats_df.empty else pd.DataFrame()
        )
        if not team_stats.empty:
            print(f"Extracted stats for {len(team_stats)} teams")
            matches = enrich_matches_with_stats(matches, team_stats)

        processed = calculate_rolling_stats(matches)

        print(
            f"Processed {len(processed)} matches with {len(processed.columns)} features"
        )
        return processed

    except Exception as e:
        print(f"Error processing {league_name}: {e}")
        import traceback

        traceback.print_exc()
        return None


# --------------------------
# Main
# --------------------------
def process_all_leagues() -> None:
    """
    Process all league CSV files found in the data directory.
    """
    csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]

    if not csv_files:
        print("\nNo CSV files found! Please run fbref_scraper.py first.")
        return

    print(f"\n{'='*60}")
    print("Enhanced Data Processor")
    print(f"{'='*60}")
    print(f"Found {len(csv_files)} league files")

    for csv_file in tqdm(csv_files, desc="Processing leagues"):
        league_name = csv_file.replace(".csv", "")
        csv_path = os.path.join(DATA_DIR, csv_file)

        processed_df = process_league(league_name, csv_path)

        if processed_df is not None and not processed_df.empty:
            output_path = os.path.join(PROCESSED_DIR, f"{league_name}_processed.csv")
            processed_df.to_csv(output_path, index=False)
            print(f"Saved to: {output_path}")

    print(f"\n{'='*60}")
    print("Processing complete!")
    print(f"{'='*60}")
    print(f"Processed data saved to: {PROCESSED_DIR}")


if __name__ == "__main__":
    process_all_leagues()
