#!/usr/bin/env python3
"""
Generate season URLs for all leagues, including both stats and fixtures pages.

This script creates a JSON file containing URLs for historical and current seasons
for a predefined list of soccer leagues. It is the first step in the data
collection pipeline, providing the necessary links for the web scraper.

The script automatically determines the current season and generates a list of
seasons for each league, going back to a specified start year. For each season,
it creates URLs for both the main statistics page and the scores/fixtures page
on FBRef.com.

The output is a JSON file (`season_links.json`) that maps league names to a
list of season-specific URL dictionaries.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Union, Any

# --------------------------
# Path Configuration
# --------------------------
SCRIPT_DIR: str = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR: str = os.path.dirname(SCRIPT_DIR)
DATA_DIR: str = os.path.join(ROOT_DIR, "fbref_data")
os.makedirs(DATA_DIR, exist_ok=True)
OUTPUT_PATH: str = os.path.join(DATA_DIR, "season_links.json")

# --------------------------
# League info
# --------------------------
LEAGUES: Dict[str, Dict[str, Union[int, str]]] = {
    "premier_league": {"id": 9, "start_season": "1888-1889"},
    "la_liga": {"id": 12, "start_season": "1988-1989"},
    "bundesliga": {"id": 20, "start_season": "1988-1989"},
    "serie_a": {"id": 11, "start_season": "1988-1989"},
    "ligue_1": {"id": 13, "start_season": "1995-1996"},
    "mls": {"id": 22, "start_season": 1996},
    "ucl": {"id": 8, "start_season": "1990-1991"},
    "uel": {"id": 19, "start_season": "1990-1991"},
    "world_cup": {"id": 1, "start_season": 1930},
}


# --------------------------
# Determine current season
# --------------------------
def get_current_season(single_year: bool = False) -> Union[int, str]:
    """
    Determine the current season based on the current date.

    Args:
        single_year: If True, returns a single year. Otherwise, returns a
                     dual-year string (e.g., '2023-2024').

    Returns:
        The current season as an integer or string.
    """
    now = datetime.now()
    year = now.year
    if single_year:
        return year
    else:
        if now.month >= 8:
            return f"{year}-{year + 1}"
        else:
            return f"{year - 1}-{year}"


# --------------------------
# Generate list of seasons
# --------------------------
def generate_seasons(
    start: Union[int, str],
    end: Union[int, str],
    single_year: bool = False,
    step: int = 1,
) -> List[str]:
    """
    Generate a list of season strings between a start and end year.

    Args:
        start: The starting season (e.g., 1990 or '1990-1991').
        end: The ending season.
        single_year: If True, treat seasons as single years.
        step: The step between seasons (e.g., 4 for World Cups).

    Returns:
        A list of season strings.
    """
    seasons: List[str] = []
    if single_year:
        start_year = int(start)
        end_year = int(end)
        for y in range(start_year, end_year + 1, step):
            seasons.append(str(y))
    else:
        start_year = int(str(start).split("-")[0])
        end_year = int(str(end).split("-")[0])
        for y in range(end_year, start_year - 1, -1):
            seasons.append(f"{y}-{y + 1}")
    return seasons


# --------------------------
# Generate JSON structure
# --------------------------
def generate_season_links() -> Dict[str, List[Dict[str, str]]]:
    """
    Generate the full JSON structure of league and season links.

    Returns:
        A dictionary mapping league names to a list of season link data.
    """
    season_links: Dict[str, List[Dict[str, str]]] = {}

    for league, info in LEAGUES.items():
        league_id = info["id"]
        start_season = info["start_season"]
        single_year = isinstance(start_season, int)
        current_season = get_current_season(single_year=single_year)

        seasons: List[str]
        if league == "world_cup":
            seasons = generate_seasons(
                start=start_season, end=current_season, single_year=True, step=4
            )
        else:
            seasons = generate_seasons(
                start=start_season, end=current_season, single_year=single_year
            )

        links: List[Dict[str, str]] = []
        for s in seasons:
            league_name_clean = league.replace("_", " ").title()
            if league_name_clean == "Ucl":
                league_name_clean = "Champions-League"
            elif league_name_clean == "Uel":
                league_name_clean = "Europa-League"
            league_name_clean = league_name_clean.replace(" ", "-")

            links.append(
                {
                    "season": s,
                    "stats_url": f"https://fbref.com/en/comps/{league_id}/{s}/{s}-{league_name_clean}-Stats",
                    "fixtures_url": f"https://fbref.com/en/comps/{league_id}/{s}/schedule/{s}-{league_name_clean}-Scores-and-Fixtures",
                }
            )

        season_links[league] = links

    return season_links


# --------------------------
# Main
# --------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("Season Links Generator (Enhanced)")
    print("=" * 60)
    print(f"\nGenerating season URLs for {len(LEAGUES)} leagues...")
    print("Generating BOTH stats and fixtures URLs for rich data")

    season_links_data = generate_season_links()

    for league_name, season_links_list in season_links_data.items():
        print(f"  {league_name:20s}: {len(season_links_list)} seasons")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(season_links_data, f, indent=2)

    print(f"\nSeason links saved to: {OUTPUT_PATH}")
    total_seasons = sum(len(links) for links in season_links_data.values())
    print(f"  Total seasons: {total_seasons}")
    print("=" * 60)
