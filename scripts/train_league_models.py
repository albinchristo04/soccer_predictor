import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# --------------------------
# Paths
# --------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
os.makedirs(DATA_DIR, exist_ok=True)

# --------------------------
# Helper: clean and prepare league data
# --------------------------
def clean_league_data(df, league_name):
    tqdm.write(f"Cleaning data for {league_name}...")
    df.columns = [c.strip().replace(" ", "_").lower() for c in df.columns]
    df = df.dropna(axis=1, how="all")
    df = df.loc[:, ~df.columns.duplicated()]

    # try to find or derive home/away teams
    team_cols = [c for c in df.columns if "team" in c]
    if len(team_cols) >= 2:
        df.rename(columns={team_cols[0]: "home_team", team_cols[1]: "away_team"}, inplace=True)
    elif len(team_cols) == 1:
        df.rename(columns={team_cols[0]: "home_team"}, inplace=True)

    # try to find goal columns
    goal_candidates = df.columns
    home_goals_col = next((c for c in goal_candidates if "home_goals" in c or "goals_for" in c or c == "gf"), None)
    away_goals_col = next((c for c in goal_candidates if "away_goals" in c or "goals_against" in c or c == "ga"), None)

    # case 1: both home_goals and away_goals columns exist
    if home_goals_col and away_goals_col:
        df["home_goals"] = pd.to_numeric(df[home_goals_col], errors="coerce")
        df["away_goals"] = pd.to_numeric(df[away_goals_col], errors="coerce")

    # case 2: try to parse from a single score column like "2–1"
    elif "score" in df.columns:
        def parse_score(s):
            if isinstance(s, str):
                parts = s.replace("-", "–").split("–")
                if len(parts) == 2:
                    try:
                        return int(parts[0].strip()), int(parts[1].strip())
                    except:
                        return np.nan, np.nan
            return np.nan, np.nan

        df[["home_goals", "away_goals"]] = df["score"].apply(lambda x: pd.Series(parse_score(x)))

    # drop rows without numeric goals
    df = df.dropna(subset=["home_goals", "away_goals"])
    df["home_goals"] = df["home_goals"].astype(int)
    df["away_goals"] = df["away_goals"].astype(int)

    # create result column
    df["result"] = np.where(df["home_goals"] > df["away_goals"], "win",
                    np.where(df["home_goals"] < df["away_goals"], "loss", "draw"))

    if "result" not in df.columns:
        raise ValueError(f"Could not extract results for {league_name}")

    tqdm.write(f"Extracted {len(df)} matches for {league_name}")
    return df

# --------------------------
# Helper: train per-league model
# --------------------------
def train_league_model(df, league_name):
    tqdm.write(f"Training model for {league_name}...")
    features = [c for c in df.columns if c not in ["result", "home_team", "away_team", "season", "url", "source", "score"]]
    X = df[features].select_dtypes(include=[np.number]).fillna(0)
    y = df["result"]

    if len(X) < 50:
        tqdm.write(f"Skipping {league_name}, not enough data ({len(X)} rows).")
        return None

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    model = RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    tqdm.write(f"Model performance for {league_name}:")
    tqdm.write(classification_report(y_test, preds))

    # Confusion matrix visualization
    cm = confusion_matrix(y_test, preds, labels=["win", "draw", "loss"])
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["win", "draw", "loss"],
                yticklabels=["win", "draw", "loss"])
    plt.title(f"{league_name.title()} Confusion Matrix")
    plt.ylabel("True")
    plt.xlabel("Predicted")
    plt.tight_layout()

    vis_dir = os.path.join(DATA_DIR, league_name, "visualizations")
    os.makedirs(vis_dir, exist_ok=True)
    plt.savefig(os.path.join(vis_dir, f"{league_name}_confusion_matrix.png"))
    plt.close()

    model_path = os.path.join(DATA_DIR, league_name, "model.pkl")
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)

    tqdm.write(f"Model saved to {model_path}")
    return model

# --------------------------
# Helper: generate visualizations
# --------------------------
def generate_visualizations(df, league_name):
    tqdm.write(f"Generating visualizations for {league_name}...")
    vis_dir = os.path.join(DATA_DIR, league_name, "visualizations")
    os.makedirs(vis_dir, exist_ok=True)

    # Result distribution
    plt.figure(figsize=(6, 4))
    df["result"].value_counts().plot(kind="bar", color=["#4CAF50", "#FFC107", "#F44336"])
    plt.title(f"{league_name.title()} Result Distribution")
    plt.ylabel("Matches")
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f"{league_name}_result_distribution.png"))
    plt.close()

    # Goals histogram
    plt.figure(figsize=(6, 4))
    sns.histplot(df["home_goals"], kde=True)
    plt.title(f"{league_name.title()} Home Goals Distribution")
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f"{league_name}_home_goals_hist.png"))
    plt.close()

    tqdm.write(f"Saved visualizations for {league_name}.")

# --------------------------
# Main
# --------------------------
def main(selected_leagues=None):
    tqdm.write("Starting per-league model training...")
    csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    if selected_leagues and selected_leagues != "all":
        csv_files = [f"{selected_leagues}.csv"] if f"{selected_leagues}.csv" in csv_files else []

    if not csv_files:
        tqdm.write("No league CSV files found.")
        return

    with tqdm(total=len(csv_files), desc="Processing Leagues", ncols=90) as pbar:
        for csv_file in csv_files:
            league_name = csv_file.replace(".csv", "")
            league_path = os.path.join(DATA_DIR, csv_file)
            try:
                df = pd.read_csv(league_path, low_memory=False)
                df = clean_league_data(df, league_name)
                model = train_league_model(df, league_name)
                if model is not None:
                    generate_visualizations(df, league_name)
            except Exception as e:
                tqdm.write(f"Error processing {league_name}: {e}")
            pbar.update(1)
    tqdm.write("All leagues processed successfully.")

# --------------------------
# Entry point
# --------------------------
if __name__ == "__main__":
    print("Available leagues:")
    leagues = [f.replace(".csv", "") for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    for lg in leagues:
        print(f" - {lg}")

    choice = input("\nEnter league key to train (or 'all'): ").strip().lower()
    main(selected_leagues=choice)
