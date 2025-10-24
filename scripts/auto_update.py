#!/usr/bin/env python3
"""
Auto-update system for the Soccer Predictor application.

This script automates the entire data pipeline, including checking for new season
data, scraping new match information, processing the data, and retraining the
machine learning models. It is designed to be run as a scheduled task (e.g., via
cron) or manually to keep the prediction system up-to-date.

The script includes the following functionalities:
- Logging of all update activities to a timestamped log file.
- A health check to ensure data directories, files, and models are present.
- Automatic detection of new seasons to trigger updates to season links.
- Incremental scraping of new match data from FBRef.
- Conditional retraining of models based on the amount of new data found.
- Command-line arguments for forcing updates, running health checks only, and
  specifying leagues to update.
"""

import os
import sys
import json
import subprocess
from datetime import datetime
import logging
from typing import Tuple, Optional, List

# Setup logging
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
LOG_DIR = os.path.join(ROOT_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(
            os.path.join(LOG_DIR, f'update_{datetime.now().strftime("%Y%m%d")}.log')
        ),
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger(__name__)

# --------------------------
# Configuration
# --------------------------
DATA_DIR: str = os.path.join(ROOT_DIR, "fbref_data")
SEASON_LINKS_PATH: str = os.path.join(DATA_DIR, "season_links.json")

# Leagues to update (or 'all')
LEAGUES_TO_UPDATE: str = "all"  # Change to specific league if needed

# Retrain threshold: retrain if new data added
RETRAIN_THRESHOLD: int = 10  # Minimum new rows to trigger retrain


# --------------------------
# Run script helper
# --------------------------
def run_script(
    script_name: str, *args: str, input_text: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Run a Python script as a subprocess and capture its output.

    Args:
        script_name: The name of the script to run in the scripts directory.
        *args: Command-line arguments to pass to the script.
        input_text: Optional text to pass to the script's stdin.

    Returns:
        A tuple containing a boolean for success and the stdout or stderr.
    """
    script_path = os.path.join(SCRIPT_DIR, script_name)

    try:
        logger.info(f"Running {script_name}...")
        cmd: List[str] = [sys.executable, script_path] + list(args)

        result = subprocess.run(
            cmd, input=input_text, text=True, capture_output=True, cwd=ROOT_DIR
        )

        if result.returncode == 0:
            logger.info(f"{script_name} completed successfully")
            logger.debug(result.stdout)
            return True, result.stdout
        else:
            logger.error(f"{script_name} failed: {result.stderr}")
            return False, result.stderr

    except Exception as e:
        logger.error(f"Error running {script_name}: {e}")
        return False, str(e)


# --------------------------
# Check for updates
# --------------------------
def check_for_updates() -> bool:
    """
    Check if the season links file needs to be updated.

    Returns:
        True if an update is needed, False otherwise.
    """
    logger.info("Checking for season updates...")

    if not os.path.exists(SEASON_LINKS_PATH):
        logger.warning("Season links not found. Generating...")
        return True

    now = datetime.now()
    if now.month == 8 and now.day <= 7:
        logger.info("New season detected (August). Updating season links...")
        return True

    file_mod_time = datetime.fromtimestamp(os.path.getmtime(SEASON_LINKS_PATH))
    days_old = (now - file_mod_time).days

    if days_old > 30:
        logger.info(f"Season links are {days_old} days old. Updating...")
        return True

    logger.info("Season links are up to date.")
    return False


# --------------------------
# Update workflow
# --------------------------
def update_data() -> bool:
    """
    Run the full data update and model retraining workflow.

    Returns:
        True if the entire workflow completes successfully, False otherwise.
    """
    logger.info("=" * 60)
    logger.info("SOCCER PREDICTOR AUTO-UPDATE")
    logger.info("=" * 60)
    logger.info(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if check_for_updates():
        success, _ = run_script("populate_seasons.py")
        if not success:
            logger.error("Failed to update season links. Aborting.")
            return False

    logger.info("\nStep 2: Scraping new data...")
    success, output = run_script(
        "fbref_scraper.py", input_text=LEAGUES_TO_UPDATE + "\n"
    )

    if not success:
        logger.error("Failed to scrape data. Aborting.")
        return False

    new_rows = 0
    for line in output.split("\n"):
        if "new rows:" in line.lower():
            try:
                new_rows += int(line.split(":")[-1].strip())
            except (ValueError, IndexError):
                pass

    logger.info(f"Total new rows added: {new_rows}")

    if new_rows == 0:
        logger.info("No new data found. Skipping processing and training.")
        return True

    logger.info("\nStep 3: Processing data...")
    success, _ = run_script("process_scraped_data.py")

    if not success:
        logger.error("Failed to process data. Continuing anyway...")

    if new_rows >= RETRAIN_THRESHOLD:
        logger.info(f"\nStep 4: Retraining models ({new_rows} new rows)...")
        success, _ = run_script(
            "train_league_models.py", input_text=LEAGUES_TO_UPDATE + "\n"
        )

        if not success:
            logger.error("Failed to retrain models.")
            return False

        logger.info("Models retrained successfully")
    else:
        logger.info(
            f"\nStep 4: Skipping retrain ({new_rows} < {RETRAIN_THRESHOLD} threshold)"
        )

    logger.info("\n" + "=" * 60)
    logger.info("AUTO-UPDATE COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    return True


# --------------------------
# Health check
# --------------------------
def health_check() -> bool:
    """
    Perform a health check of the system and data integrity.

    Returns:
        True if all checks pass, False otherwise.
    """
    logger.info("\nRunning health check...")
    issues: List[str] = []

    if not os.path.exists(DATA_DIR):
        issues.append("Data directory missing")

    csv_count = (
        len([f for f in os.listdir(DATA_DIR) if f.endswith(".csv")])
        if os.path.exists(DATA_DIR)
        else 0
    )
    if csv_count == 0:
        issues.append("No CSV data files found")

    processed_dir = os.path.join(DATA_DIR, "processed")
    if not os.path.exists(processed_dir):
        issues.append("Processed directory missing")
    else:
        processed_count = len(
            [f for f in os.listdir(processed_dir) if f.endswith(".csv")]
        )
        if processed_count == 0:
            issues.append("No processed data files found")

    model_count = 0
    if os.path.exists(DATA_DIR):
        for item in os.listdir(DATA_DIR):
            model_path = os.path.join(DATA_DIR, item, "model.pkl")
            if os.path.exists(model_path):
                model_count += 1

    if model_count == 0:
        issues.append("No trained models found")

    if issues:
        logger.warning(f"Health check found {len(issues)} issue(s):")
        for issue in issues:
            logger.warning(f"  - {issue}")
        return False
    else:
        logger.info("Health check passed")
        logger.info(f"  - {csv_count} data files")
        logger.info(f"  - {model_count} trained models")
        return True


# --------------------------
# Main
# --------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Auto-update soccer predictor")
    parser.add_argument(
        "--check-only", action="store_true", help="Only run health check"
    )
    parser.add_argument(
        "--force", action="store_true", help="Force update even if no changes"
    )
    parser.add_argument(
        "--leagues", type=str, default="all", help="Leagues to update (default: all)"
    )

    args = parser.parse_args()

    if args.check_only:
        health_check()
        sys.exit(0)

    if args.leagues:
        LEAGUES_TO_UPDATE = args.leagues

    health_check()

    success = update_data()

    if success:
        logger.info("\nUpdate completed successfully")
        sys.exit(0)
    else:
        logger.error("\nUpdate failed")
        sys.exit(1)
