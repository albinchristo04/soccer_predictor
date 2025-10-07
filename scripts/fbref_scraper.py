# import os
# import time
# import random
# import json
# import requests
# import pandas as pd
# from io import StringIO
# from bs4 import BeautifulSoup, Comment
# from tqdm import tqdm

# # --------------------------
# # Paths
# # --------------------------
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
# DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
# MASTER_PATH = os.path.join(DATA_DIR, "fbref_master_dataset.csv")
# JSON_PATH = os.path.join(SCRIPTS_DIR, "season_links.json")
# os.makedirs(DATA_DIR, exist_ok=True)

# # --------------------------
# # Delay settings
# # --------------------------
# DELAY_MIN = 8
# DELAY_MAX = 15
# MAX_RETRIES = 8

# # --------------------------
# # User agents
# # --------------------------
# USER_AGENTS = [
#     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
#     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15"
# ]

# # --------------------------
# # 429-safe fetch
# # --------------------------
# def get_soup(url):
#     attempt = 0
#     while attempt < MAX_RETRIES:
#         try:
#             headers = {"User-Agent": random.choice(USER_AGENTS)}
#             r = requests.get(url, headers=headers)
#             if r.status_code == 429:
#                 wait = random.uniform(DELAY_MIN, DELAY_MAX) * (2 ** attempt)
#                 print(f"⚠️ 429 Too Many Requests. Waiting {wait:.1f}s and retrying...")
#                 time.sleep(wait)
#                 attempt += 1
#                 continue
#             r.raise_for_status()
#             return BeautifulSoup(r.text, "html.parser")
#         except requests.exceptions.RequestException as e:
#             wait = random.uniform(DELAY_MIN, DELAY_MAX) * (2 ** attempt)
#             print(f"⚠️ Request failed: {e}. Waiting {wait:.1f}s and retrying...")
#             time.sleep(wait)
#             attempt += 1
#     raise Exception(f"Failed to fetch URL after {MAX_RETRIES} attempts: {url}")

# # --------------------------
# # Extract tables including commented ones
# # --------------------------
# def extract_tables(soup, source, url):
#     dfs = []

#     comments = soup.find_all(string=lambda text: isinstance(text, Comment) and "<table" in text)
#     for c in comments:
#         try:
#             tables = pd.read_html(StringIO(c))
#             for df in tables:
#                 if not df.empty:
#                     df["Source"] = source
#                     df["URL"] = url
#                     dfs.append(df)
#         except:
#             continue

#     for table in soup.find_all("table"):
#         try:
#             df = pd.read_html(StringIO(str(table)))[0]
#             if not df.empty:
#                 df["Source"] = source
#                 df["URL"] = url
#                 dfs.append(df)
#         except:
#             continue

#     return dfs

# # --------------------------
# # Scrape a single season
# # --------------------------
# def scrape_season(url):
#     soup = get_soup(url)
#     season_name = soup.select_one("h1").text.strip()
#     dfs = extract_tables(soup, season_name, url)
#     time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
#     if dfs:
#         return pd.concat(dfs, ignore_index=True)
#     return None

# # --------------------------
# # Scrape/update league sequentially
# # --------------------------
# def update_league_data(league_name, season_urls):
#     csv_path = os.path.join(DATA_DIR, f"{league_name}.csv")
#     print(f"\n📘 Fetching {league_name.replace('_',' ').title()}...")

#     existing = pd.DataFrame()
#     if os.path.exists(csv_path):
#         existing = pd.read_csv(csv_path)
#         fetched_urls = set(existing["URL"].dropna())
#         season_urls = [s for s in season_urls if s not in fetched_urls]
#         print(f"Existing seasons: {len(fetched_urls)}. New to fetch: {len(season_urls)}")
#     else:
#         print(f"No existing CSV. Fetching all {len(season_urls)} seasons.")

#     all_dfs = [existing] if not existing.empty else []

#     for url in tqdm(season_urls, desc=f"Scraping {league_name}", ncols=90):
#         try:
#             df = scrape_season(url)
#             if df is not None:
#                 all_dfs.append(df)
#         except Exception as e:
#             print(f"⚠️ Failed to scrape {url}: {e}")

#     if all_dfs:
#         updated = pd.concat(all_dfs, ignore_index=True)
#         updated.to_csv(csv_path, index=False)
#         new_rows = len(updated) - len(existing)
#         print(f"✅ Saved {csv_path}, new rows: {new_rows}")
#         return new_rows
#     return 0

# # --------------------------
# # Combine all leagues
# # --------------------------
# def combine_leagues():
#     files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv") and f != os.path.basename(MASTER_PATH)]
#     dfs = []
#     summary = []

#     for f in tqdm(files, desc="Combining leagues", ncols=90):
#         path = os.path.join(DATA_DIR, f)
#         df = pd.read_csv(path)
#         league_name = f.replace(".csv","")
#         df["League"] = league_name
#         dfs.append(df)
#         summary.append((league_name, len(df)))

#     if dfs:
#         master = pd.concat(dfs, ignore_index=True)
#         master.to_csv(MASTER_PATH, index=False)
#         print(f"\n🏆 Master dataset saved to {MASTER_PATH}")
#         return summary, len(master)
#     else:
#         return None, 0

# # --------------------------
# # Main
# # --------------------------
# if __name__ == "__main__":
#     if not os.path.exists(JSON_PATH):
#         raise Exception(f"{JSON_PATH} not found. Generate season_links.json first.")

#     with open(JSON_PATH, "r") as f:
#         season_links = json.load(f)

#     print("Available leagues:")
#     for key in season_links:
#         print(f" - {key}")

#     choice = input("\nEnter league key to fetch (or 'all'): ").strip().lower()
#     leagues_to_scrape = [choice] if choice in season_links else list(season_links.keys()) if choice=="all" else []
#     if not leagues_to_scrape:
#         print("❌ Invalid input.")
#         exit()

#     summaries = []
#     for lg in leagues_to_scrape:
#         urls = season_links[lg]
#         new_rows = update_league_data(lg, urls)
#         summaries.append((lg, new_rows))

#     print("\n🔁 Combining all leagues into master dataset...")
#     summary, total_rows = combine_leagues()
#     if summary:
#         df_summary = pd.DataFrame(summary, columns=["League", "Total Rows"])
#         df_summary["New Rows Scraped"] = [dict(summaries).get(l,0) for l in df_summary["League"]]
#         print("\n📊 Summary")
#         print("-"*60)
#         print(df_summary.to_string(index=False))
#         print("-"*60)
#         print(f"Grand Total Rows in Master Dataset: {total_rows:,}")

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

# --------------------------
# Paths
# --------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
MASTER_PATH = os.path.join(DATA_DIR, "fbref_master_dataset.csv")
JSON_PATH = os.path.join(SCRIPTS_DIR, "season_links.json")
os.makedirs(DATA_DIR, exist_ok=True)

# --------------------------
# Delay & concurrency settings
# --------------------------
DELAY_MIN = 4
DELAY_MAX = 10
MAX_RETRIES = 8
MAX_WORKERS = 3  # scrape 2-3 seasons in parallel

# --------------------------
# User agents
# --------------------------
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15"
]

# --------------------------
# 429-safe fetch
# --------------------------
def get_soup(url):
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            r = requests.get(url, headers=headers)
            if r.status_code == 429:
                wait = random.uniform(DELAY_MIN, DELAY_MAX) * (2 ** attempt)
                print(f"⚠️ 429 Too Many Requests. Waiting {wait:.1f}s and retrying...")
                time.sleep(wait)
                attempt += 1
                continue
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except requests.exceptions.RequestException as e:
            wait = random.uniform(DELAY_MIN, DELAY_MAX) * (2 ** attempt)
            print(f"⚠️ Request failed: {e}. Waiting {wait:.1f}s and retrying...")
            time.sleep(wait)
            attempt += 1
    raise Exception(f"Failed to fetch URL after {MAX_RETRIES} attempts: {url}")

# --------------------------
# Extract tables including commented ones
# --------------------------
def extract_tables(soup, source, url):
    dfs = []

    # commented tables
    comments = soup.find_all(string=lambda text: isinstance(text, Comment) and "<table" in text)
    for c in comments:
        try:
            tables = pd.read_html(StringIO(c))
            for df in tables:
                if not df.empty:
                    df["Source"] = source
                    df["URL"] = url
                    dfs.append(df)
        except:
            continue

    # visible tables
    for table in soup.find_all("table"):
        try:
            df = pd.read_html(StringIO(str(table)))[0]
            if not df.empty:
                df["Source"] = source
                df["URL"] = url
                dfs.append(df)
        except:
            continue

    return dfs

# --------------------------
# Scrape a single season
# --------------------------
def scrape_season(url):
    soup = get_soup(url)
    season_name = soup.select_one("h1").text.strip()
    dfs = extract_tables(soup, season_name, url)
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
    if dfs:
        return pd.concat(dfs, ignore_index=True)
    return None

# --------------------------
# Scrape seasons in parallel (2-3 at a time)
# --------------------------
def scrape_seasons_parallel(season_urls, league_name):
    all_dfs = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_url = {executor.submit(scrape_season, url): url for url in season_urls}
        for future in tqdm(as_completed(future_to_url),
                           total=len(season_urls),
                           desc=f"Scraping {league_name}",
                           ncols=90):
            url = future_to_url[future]
            try:
                df = future.result()
                if df is not None:
                    all_dfs.append(df)
            except Exception as e:
                print(f"⚠️ Failed to scrape {url}: {e}")
    return all_dfs

# --------------------------
# Scrape/update league
# --------------------------
def update_league_data(league_name, season_urls):
    csv_path = os.path.join(DATA_DIR, f"{league_name}.csv")
    print(f"\n📘 Fetching {league_name.replace('_',' ').title()}...")

    existing = pd.DataFrame()
    if os.path.exists(csv_path):
        existing = pd.read_csv(csv_path)
        fetched_urls = set(existing["URL"].dropna())
        season_urls = [s for s in season_urls if s not in fetched_urls]
        print(f"Existing seasons: {len(fetched_urls)}. New to fetch: {len(season_urls)}")
    else:
        print(f"No existing CSV. Fetching all {len(season_urls)} seasons.")

    if not season_urls:
        print("✅ Nothing new to fetch.")
        return 0

    all_dfs = [existing] if not existing.empty else []
    season_dfs = scrape_seasons_parallel(season_urls, league_name)
    all_dfs += season_dfs

    updated = pd.concat(all_dfs, ignore_index=True)
    updated.to_csv(csv_path, index=False)
    new_rows = len(updated) - len(existing)
    print(f"✅ Saved {csv_path}, new rows: {new_rows}")
    return new_rows

# --------------------------
# Combine all leagues
# --------------------------
def combine_leagues():
    files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv") and f != os.path.basename(MASTER_PATH)]
    dfs = []
    summary = []

    for f in tqdm(files, desc="Combining leagues", ncols=90):
        path = os.path.join(DATA_DIR, f)
        df = pd.read_csv(path)
        league_name = f.replace(".csv","")
        df["League"] = league_name
        dfs.append(df)
        summary.append((league_name, len(df)))

    if dfs:
        master = pd.concat(dfs, ignore_index=True)
        master.to_csv(MASTER_PATH, index=False)
        print(f"\n🏆 Master dataset saved to {MASTER_PATH}")
        return summary, len(master)
    else:
        return None, 0

# --------------------------
# Main
# --------------------------
if __name__ == "__main__":
    if not os.path.exists(JSON_PATH):
        raise Exception(f"{JSON_PATH} not found. Generate season_links.json first.")

    with open(JSON_PATH, "r") as f:
        season_links = json.load(f)

    print("Available leagues:")
    for key in season_links:
        print(f" - {key}")

    choice = input("\nEnter league key to fetch (or 'all'): ").strip().lower()
    summaries = []

    leagues_to_scrape = [choice] if choice in season_links else list(season_links.keys()) if choice=="all" else []
    if not leagues_to_scrape:
        print("❌ Invalid input.")
        exit()

    for lg in leagues_to_scrape:
        urls = season_links[lg]
        new_rows = update_league_data(lg, urls)
        summaries.append((lg, new_rows))

    print("\n🔁 Combining all leagues into master dataset...")
    summary, total_rows = combine_leagues()
    if summary:
        df_summary = pd.DataFrame(summary, columns=["League", "Total Rows"])
        df_summary["New Rows Scraped"] = [dict(summaries).get(l,0) for l in df_summary["League"]]
        print("\n📊 Summary")
        print("-"*60)
        print(df_summary.to_string(index=False))
        print("-"*60)
        print(f"Grand Total Rows in Master Dataset: {total_rows:,}")
