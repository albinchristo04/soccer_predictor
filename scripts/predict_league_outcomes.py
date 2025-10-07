#!/usr/bin/env python3
"""
scripts/predict_league_outcomes.py

Given current team stats for a league, estimate:
- Title probability (top 1%)
- Relegation probability (bottom 3 teams)
"""
import joblib
import pandas as pd
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR.parent / "fbref_data"
MODEL_DIR = DATA_DIR / "models"

def predict_league(league, current_df):
    model_path = MODEL_DIR / f"{league}_model.pkl"
    if not model_path.exists():
        raise FileNotFoundError(f"No model for {league}. Train it first.")

    model = joblib.load(model_path)
    feature_cols = [f for f in current_df.columns if f in model.feature_names_in_]

    preds = model.predict(current_df[feature_cols].fillna(0))
    current_df["Predicted_Performance"] = preds
    current_df = current_df.sort_values("Predicted_Performance", ascending=False)

    current_df["Title_Prob"] = (1 - current_df["Predicted_Performance"].rank(pct=True)) ** 3
    current_df["Relegation_Prob"] = current_df["Predicted_Performance"].rank(pct=True) ** 3

    print(f"\n{league.upper()} — predicted standings:")
    print(current_df[["Squad", "Predicted_Performance", "Title_Prob", "Relegation_Prob"]].head(10))

    return current_df

def main():
    league = "premier_league"
    df = pd.read_csv(DATA_DIR / f"{league}.csv")
    current_season = df[df["Source"].str.contains("2024|2025", na=False)]
    result = predict_league(league, current_season)
    result.to_csv(DATA_DIR / f"{league}_predictions.csv", index=False)

if __name__ == "__main__":
    main()

