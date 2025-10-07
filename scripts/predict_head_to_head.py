#!/usr/bin/env python3
"""
scripts/predict_head_to_head.py

Predict win probability for any two teams in a league using trained model.
"""
import joblib
import pandas as pd
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR.parent / "fbref_data"
MODEL_DIR = DATA_DIR / "models"

def team_vector(df, team):
    row = df[df["Squad"].str.lower() == team.lower()]
    if row.empty:
        raise ValueError(f"Team '{team}' not found.")
    return row.mean(numeric_only=True).fillna(0)

def predict_matchup(league, team1, team2):
    model_path = MODEL_DIR / f"{league}_model.pkl"
    model = joblib.load(model_path)
    df = pd.read_csv(DATA_DIR / f"{league}.csv")

    v1 = team_vector(df, team1)
    v2 = team_vector(df, team2)

    diff = (v1 - v2).to_frame().T
    diff = diff[[f for f in diff.columns if f in model.feature_names_in_]]
    prob = model.predict(diff)[0]

    prob_team1 = np.clip(prob, 0, 1)
    prob_team2 = 1 - prob_team1

    print(f"\n{team1} vs {team2} — predicted win probabilities:")
    print(f"{team1}: {prob_team1:.2%}")
    print(f"{team2}: {prob_team2:.2%}")
    return {team1: prob_team1, team2: prob_team2}

if __name__ == "__main__":
    predict_matchup("serie_a", "Inter", "Juventus")

