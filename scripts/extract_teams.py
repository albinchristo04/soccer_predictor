"""
Extracts unique team names from various league CSV files.

This script reads match data from CSV files for different soccer leagues,
extracts the names of all unique teams, and prints them to the console.
It is designed to handle different column names for home and away teams and
can also extract team names from a single 'Squad' column, which is common
in tournament data like the FIFA World Cup.

The script cleans the team names by removing country codes that are sometimes
prefixed to the names (e.g., 'es Spain' becomes 'Spain'). The final output
is a sorted list of unique team names for each league.
"""

import pandas as pd
from typing import List, Dict, Set


def get_unique_teams(
    file_path: str,
    home_col: str = "Home",
    away_col: str = "Away",
    squad_col: str = "Squad",
) -> List[str]:
    """
    Extracts a sorted list of unique team names from a CSV file.

    Args:
        file_path: The path to the CSV file.
        home_col: The name of the column for home teams.
        away_col: The name of the column for away teams.
        squad_col: The name of the column for squad names (used if home/away
                   columns are not present).

    Returns:
        A sorted list of unique team names.
    """
    try:
        df = pd.read_csv(file_path)
        all_teams: Set[str] = set()

        if home_col in df.columns and away_col in df.columns:
            home_teams = df[home_col].dropna().unique()
            away_teams = df[away_col].dropna().unique()
            all_teams.update(home_teams)
            all_teams.update(away_teams)
        elif squad_col in df.columns:
            all_teams.update(df[squad_col].dropna().unique())
        else:
            return []

        cleaned_teams: Set[str] = set()
        for team in all_teams:
            if isinstance(team, str) and len(team.split()) > 1:
                if len(team.split()[0]) == 2 and team.split()[0].islower():
                    cleaned_teams.add(" ".join(team.split()[1:]))
                else:
                    cleaned_teams.add(team)
            else:
                cleaned_teams.add(team)

        return sorted(list(cleaned_teams))
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []


leagues: Dict[str, str] = {
    "Premier League": "/home/roaltshu/code/soccer_predictor/fbref_data/premier_league.csv",
    "La Liga": "/home/roaltshu/code/soccer_predictor/fbref_data/la_liga.csv",
    "Serie A": "/home/roaltshu/code/soccer_predictor/fbref_data/serie_a.csv",
    "Bundesliga": "/home/roaltshu/code/soccer_predictor/fbref_data/bundesliga.csv",
    "Ligue 1": "/home/roaltshu/code/soccer_predictor/fbref_data/ligue_1.csv",
    "Champions League (UCL)": "/home/roaltshu/code/soccer_predictor/fbref_data/ucl.csv",
    "Europa League (UEL)": "/home/roaltshu/code/soccer_predictor/fbref_data/uel.csv",
    "MLS": "/home/roaltshu/code/soccer_predictor/fbref_data/mls.csv",
    "FIFA World Cup": "/home/roaltshu/code/soccer_predictor/fbref_data/world_cup.csv",
}

all_league_teams: Dict[str, List[str]] = {}

for league, path in leagues.items():
    if league == "FIFA World Cup":
        all_league_teams[league] = get_unique_teams(path, squad_col="Squad")
    else:
        all_league_teams[league] = get_unique_teams(path)

for league, teams in all_league_teams.items():
    print(f"{league} Teams: {teams}")
