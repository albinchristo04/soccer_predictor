# scripts/train_league_model.py

import os
import json
from pathlib import Path
import pandas as pd
import numpy as np
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import joblib
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

# -------------------------
# Paths
# -------------------------
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR.parent / "fbref_data"
MODEL_DIR = BASE_DIR.parent / "models"
MODEL_DIR.mkdir(exist_ok=True, parents=True)

# -------------------------
# Helper functions
# -------------------------
def load_league_data(csv_path, sample_size=2000):
    """Stream CSV, select numeric columns, and return a sampled DataFrame."""
    chunks = []
    numeric_cols = ["Gls", "Sh", "SoT", "xG", "Ast", "Poss", "MP"]

    for chunk in pd.read_csv(csv_path, chunksize=5000, low_memory=False):
        # Keep only relevant numeric columns if available
        available = [c for c in numeric_cols if c in chunk.columns]
        if not available:
            continue
        for col in available:
            chunk[col] = pd.to_numeric(chunk[col], errors="coerce")
        chunk = chunk.dropna(subset=available, how="all")
        chunks.append(chunk[available])

        if sum(len(c) for c in chunks) > sample_size:
            break  # stop early to avoid loading everything

    if not chunks:
        raise ValueError(f"No numeric data found in {csv_path.name}")

    df = pd.concat(chunks, ignore_index=True)
    if len(df) > sample_size:
        df = df.sample(sample_size, random_state=42)

    return df


def train_model(df, league_name):
    """Train a lightweight logistic regression model."""
    df = df.dropna()
    if df.empty or "Gls" not in df.columns:
        print(f"[WARN] Not enough numeric data to train model for {league_name}")
        return None, None

    median_goals = df["Gls"].median()
    df["Target"] = (df["Gls"] > median_goals).astype(int)

    X = df.drop(columns=["Target", "Gls"], errors="ignore")
    y = df["Target"]

    if len(X) < 10 or y.nunique() < 2:
        print(f"[WARN] Insufficient data variation for {league_name}")
        return None, None

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # Lightweight model
    model = LogisticRegression(max_iter=500)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    model_path = MODEL_DIR / f"{league_name}_model.pkl"
    scaler_path = MODEL_DIR / f"{league_name}_scaler.pkl"
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    return acc, str(model_path)


# -------------------------
# Main
# -------------------------
def main():
    csv_files = sorted(DATA_DIR.glob("*.csv"))
    if not csv_files:
        print(f"No CSV files found in {DATA_DIR}")
        return

    results = {}
    print("Training models for leagues...")

    for csv_path in tqdm(csv_files, desc="Leagues"):
        league_name = csv_path.stem
        try:
            df = load_league_data(csv_path)
            acc, model_path = train_model(df, league_name)
            if acc is not None:
                results[league_name] = {"accuracy": acc, "model_path": model_path}
        except Exception as e:
            print(f"[ERROR] Failed to process {league_name}: {e}")

    summary_path = MODEL_DIR / "model_training_summary.json"
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nTraining complete. Summary saved to {summary_path}")


if __name__ == "__main__":
    main()