#!/usr/bin/env python3
"""
Enhanced FBRef scraper for soccer match data.

This script scrapes both statistical data and match fixtures from FBRef.com for
various soccer leagues. It is designed to be robust, with features like retry
mechanisms, rate limiting, and parallel processing to handle web scraping
efficiently and politely.

The main functionalities include:
- Fetching HTML content with retries and random user agents to avoid blocking.
- Parsing all tables from a page, including those hidden in HTML comments.
- Scraping both stats and fixtures for each season to create a comprehensive dataset.
- Parallel scraping of multiple seasons to speed up the data collection process.
- Incremental updates, where the script checks for existing data and only
  fetches new seasons.

The script is intended to be run from the root directory of the project.
"""

import os
import time
import random
import json
import requests
import pandas as pd
from io import StringIO
from bs4 import BeautifulSoup, Comment
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Optional, Any, Set
import sys

# --------------------------
# Path Configuration
# --------------------------
SCRIPT_DIR: str = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR: str = os.path.dirname(SCRIPT_DIR)
DATA_DIR: str = os.path.join(ROOT_DIR, "fbref_data")
JSON_PATH: str = os.path.join(DATA_DIR, "season_links.json")
os.makedirs(DATA_DIR, exist_ok=True)

# --------------------------
# Settings
# --------------------------
DELAY_MIN: int = 5
DELAY_MAX: int = 12
MAX_RETRIES: int = 8
MAX_WORKERS: int = 2  # Reduced for politeness

USER_AGENTS: List[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
]


# --------------------------
# Fetch with retry
# --------------------------
def get_soup(url: str) -> BeautifulSoup:
    """
    Fetch and parse a URL with retries and rate limit handling.

    Args:
        url: The URL to fetch.

    Returns:
        A BeautifulSoup object of the parsed HTML.

    Raises:
        Exception: If the request fails after all retries.
    """
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            r = requests.get(url, headers=headers, timeout=30)
            if r.status_code == 429:
                wait = random.uniform(DELAY_MIN, DELAY_MAX) * (2**attempt)
                print(f"Rate limited. Waiting {wait:.1f}s...")
                time.sleep(wait)
                attempt += 1
                continue
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except requests.exceptions.RequestException as e:
            wait = random.uniform(DELAY_MIN, DELAY_MAX) * (2**attempt)
            print(f"Request failed: {e}. Retrying in {wait:.1f}s...")
            time.sleep(wait)
            attempt += 1
    raise Exception(f"Failed after {MAX_RETRIES} attempts: {url}")


# --------------------------
# Extract all tables
# --------------------------
def extract_all_tables(
    soup: BeautifulSoup, source: str, url: str
) -> List[pd.DataFrame]:
    """
    Extract all tables from a BeautifulSoup object, including commented ones.

    Args:
        soup: The BeautifulSoup object to parse.
        source: A string identifying the source of the data.
        url: The URL from which the data was scraped.

    Returns:
        A list of pandas DataFrames, one for each table found.
    """
    dfs: List[pd.DataFrame] = []

    comments = soup.find_all(string=lambda t: isinstance(t, Comment) and "<table" in t)
    for comment in comments:
        try:
            tables = pd.read_html(StringIO(comment))
            for df in tables:
                if not df.empty:
                    df["_source"] = source
                    df["_url"] = url
                    df["_table_type"] = "commented"
                    dfs.append(df)
        except Exception:
            continue

    for table in soup.find_all("table"):
        try:
            table_id = table.get("id", "unknown")
            df = pd.read_html(StringIO(str(table)))[0]
            if not df.empty:
                df["_source"] = source
                df["_url"] = url
                df["_table_id"] = table_id
                df["_table_type"] = "visible"
                dfs.append(df)
        except Exception:
            continue

    return dfs


# --------------------------
# Scrape single season (both URLs)
# --------------------------
def scrape_season(
    season_data: Dict[str, str], league_name: str
) -> Optional[pd.DataFrame]:
    """
    Scrape both stats and fixtures pages for a single season.

    Args:
        season_data: A dictionary with season info, including URLs.
        league_name: The name of the league being scraped.

    Returns:
        A concatenated DataFrame of all tables found, or None if scraping fails.
    """
    season = season_data.get("season", "unknown")
    stats_url = season_data.get("stats_url")
    fixtures_url = season_data.get("fixtures_url")

    all_dfs: List[pd.DataFrame] = []

    if stats_url:
        try:
            soup = get_soup(stats_url)
            stats_dfs = extract_all_tables(soup, f"{season}_stats", stats_url)
            all_dfs.extend(stats_dfs)
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
        except Exception as e:
            print(f"Failed to scrape stats for {season}: {e}")

    if fixtures_url:
        try:
            soup = get_soup(fixtures_url)
            fixtures_dfs = extract_all_tables(soup, f"{season}_fixtures", fixtures_url)
            all_dfs.extend(fixtures_dfs)
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
        except Exception as e:
            print(f"Failed to scrape fixtures for {season}: {e}")

    if all_dfs:
        return pd.concat(all_dfs, ignore_index=True)
    return None


# --------------------------
# Scrape seasons in parallel
# --------------------------
def scrape_seasons_parallel(
    season_data_list: List[Dict[str, str]], league_name: str
) -> List[pd.DataFrame]:
    """
    Scrape multiple seasons in parallel using a thread pool.

    Args:
        season_data_list: A list of season data dictionaries to scrape.
        league_name: The name of the league.

    Returns:
        A list of DataFrames, one for each successfully scraped season.
    """
    all_dfs: List[pd.DataFrame] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_season = {
            executor.submit(scrape_season, sd, league_name): sd
            for sd in season_data_list
        }

        for future in tqdm(
            as_completed(future_to_season),
            total=len(season_data_list),
            desc=f"Scraping {league_name}",
            ncols=90,
        ):
            season_data = future_to_season[future]
            try:
                df = future.result()
                if df is not None:
                    all_dfs.append(df)
            except Exception as e:
                print(f"Failed {season_data.get('season', 'unknown')}: {e}")

    return all_dfs


# --------------------------
# Update league data
# --------------------------
def update_league_data(league_name: str, season_data_list: List[Dict[str, str]]) -> int:
    """
    Update the CSV file for a league with new data.

    Args:
        league_name: The name of the league to update.
        season_data_list: A list of all season data for the league.

    Returns:
        The number of new rows added to the dataset.
    """
    csv_path = os.path.join(DATA_DIR, f"{league_name}.csv")
    print(f"\n{'='*60}")
    print(f"Fetching {league_name.replace('_',' ').title()}")
    print(f"{'='*60}")

    existing_df = pd.DataFrame()
    if os.path.exists(csv_path):
        existing_df = pd.read_csv(csv_path)
        if "_url" in existing_df.columns:
            fetched_urls: Set[str] = set(existing_df["_url"].dropna())
            new_season_data = [
                sd
                for sd in season_data_list
                if sd.get("stats_url") not in fetched_urls
                and sd.get("fixtures_url") not in fetched_urls
            ]
            season_data_list = new_season_data
            print(f"Existing data: {len(existing_df)} rows")
            print(f"New seasons to fetch: {len(season_data_list)}")
    else:
        print(f"No existing CSV. Fetching all {len(season_data_list)} seasons")

    if not season_data_list:
        print("Nothing new to fetch.")
        return 0

    all_dfs: List[pd.DataFrame] = [existing_df] if not existing_df.empty else []
    season_dfs = scrape_seasons_parallel(season_data_list, league_name)
    all_dfs.extend(season_dfs)

    if all_dfs:
        updated_df = pd.concat(all_dfs, ignore_index=True)
        updated_df.to_csv(csv_path, index=False)
        new_rows = len(updated_df) - len(existing_df)
        print(f"Saved {csv_path}")
        print(f"  Total rows: {len(updated_df)} (added {new_rows})")
        return new_rows
    else:
        print("No data scraped")
        return 0


# --------------------------
# Main
# --------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("Enhanced FBRef Scraper")
    print("=" * 60)
    print("Scrapes BOTH stats and fixtures for comprehensive data")
    print("=" * 60)

    if not os.path.exists(JSON_PATH):
        print(f"\nError: {JSON_PATH} not found!")
        print("   Please run populate_seasons.py first.")
        sys.exit(1)

    with open(JSON_PATH, "r") as f:
        season_links_data: Dict[str, List[Dict[str, str]]] = json.load(f)

    print("\nAvailable leagues:")
    for key in season_links_data:
        print(f"   • {key} ({len(season_links_data[key])} seasons)")

    choice = input("\nEnter league key to fetch (or 'all'): ").strip().lower()

    leagues_to_scrape: List[str] = []
    if choice == "all":
        leagues_to_scrape = list(season_links_data.keys())
    elif choice in season_links_data:
        leagues_to_scrape = [choice]
    else:
        print("Invalid input.")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"Scraping {len(leagues_to_scrape)} league(s)...")
    print(f"{'='*60}")
    print("This will take a while due to rate limiting...")

    total_new_rows = 0
    for lg_name in leagues_to_scrape:
        seasons = season_links_data[lg_name]
        new_rows_count = update_league_data(lg_name, seasons)
        total_new_rows += new_rows_count

    print(f"\n{'='*60}")
    print("Scraping complete!")
    print(f"{'='*60}")
    print(f"Total new rows added: {total_new_rows}")
    print(f"Data saved to: {DATA_DIR}")
