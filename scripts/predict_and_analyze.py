#!/usr/bin/env python3
import os
import json
import argparse
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from tqdm import tqdm
from sklearn.preprocessing import StandardScaler

# --------------------------
# Paths
# --------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
os.makedirs(DATA_DIR, exist_ok=True)

# --------------------------
# Helper Functions
# --------------------------
def load_league_model(league):
    model_path = os.path.join(DATA_DIR, league, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model for {league} not found at {model_path}")
    return joblib.load(model_path)

def load_league_data(league):
    csv_path = os.path.join(DATA_DIR, f"{league}.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset for {league} not found at {csv_path}")
    
    df = pd.read_csv(csv_path, low_memory=False)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Detect home/away or squad/opponent columns
    if "home_team" in df.columns and "away_team" in df.columns:
        pass
    elif "squad" in df.columns and "opponent" in df.columns:
        df.rename(columns={"squad":"home_team", "opponent":"away_team"}, inplace=True)
    else:
        # Attempt to find columns heuristically
        home_cols = [c for c in df.columns if "home" in c and "team" in c]
        away_cols = [c for c in df.columns if "away" in c and "team" in c]
        if home_cols and away_cols:
            df.rename(columns={home_cols[0]:"home_team", away_cols[0]:"away_team"}, inplace=True)
        else:
            print(f"Warning: '{league}' does not have 'home_team' or 'away_team'. Skipping simulations.")
            return None

    # Detect goals
    if "home_goals" in df.columns and "away_goals" in df.columns:
        pass
    elif "gf" in df.columns and "ga" in df.columns:
        df.rename(columns={"gf":"home_goals","ga":"away_goals"}, inplace=True)
    elif "score" in df.columns:
        def parse_score(s):
            if isinstance(s,str):
                s = s.replace("-", "–")
                parts = s.split("–")
                if len(parts)==2:
                    try: return int(parts[0]), int(parts[1])
                    except: return np.nan,np.nan
            return np.nan,np.nan
        df[["home_goals","away_goals"]] = df["score"].apply(lambda x: pd.Series(parse_score(x)))
        df.dropna(subset=["home_goals","away_goals"], inplace=True)
        df["home_goals"] = df["home_goals"].astype(int)
        df["away_goals"] = df["away_goals"].astype(int)
    else:
        print(f"Warning: '{league}' does not have goal columns. Skipping simulations.")
        return None

    # Derive result column if missing
    if "result" not in df.columns:
        df["result"] = np.where(df["home_goals"]>df["away_goals"],"win",
                                np.where(df["home_goals"]<df["away_goals"],"loss","draw"))
    return df

def save_json_and_plot(output_dir, filename_base, data_dict, title):
    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir,f"{filename_base}.json"),"w") as f:
        json.dump(data_dict,f,indent=4)
    plt.figure(figsize=(6,4))
    plt.bar(data_dict.keys(), data_dict.values(), color=["green","gray","red"])
    plt.title(title)
    plt.ylabel("Probability")
    plt.ylim(0,1)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir,f"{filename_base}.png"))
    plt.close()

# --------------------------
# League Analyzer
# --------------------------
class LeagueAnalyzer:
    def __init__(self, league):
        self.league = league
        self.model = load_league_model(league)
        self.df = load_league_data(league)
        if self.df is None:
            self.current_season = None
            self.vis_dir = None
        else:
            self.current_season = self.df['season'].max() if 'season' in self.df.columns else 'all_seasons'
            self.vis_dir = os.path.join(DATA_DIR, league, "visualizations", str(self.current_season))

    def get_team_stats(self, team_name):
        team_df = self.df[(self.df['home_team']==team_name) | (self.df['away_team']==team_name)]
        if team_df.empty:
            raise ValueError(f"Team {team_name} not found in {self.league}")
        features = team_df.drop(columns=['home_team','away_team','result','season','source','url'], errors='ignore').mean()
        return features

    def predict_head_to_head(self, home_team, away_team):
        home_stats = self.get_team_stats(home_team)
        away_stats = self.get_team_stats(away_team)
        X = pd.DataFrame([home_stats.values - away_stats.values])
        proba = self.model.predict_proba(X)[0]
        classes = self.model.classes_
        result_dict = {cls: proba[i] for i, cls in enumerate(classes)}
        output_dir = os.path.join(self.vis_dir, "head_to_head")
        save_json_and_plot(output_dir, f"{home_team}_vs_{away_team}", result_dict, f"{home_team} vs {away_team}")
        return result_dict

    def simulate_season(self, num_simulations=10000):
        if self.df is None:
            print(f"Skipping season simulation for {self.league} (missing home/away columns or goals).")
            return None, None

        teams = pd.unique(pd.concat([self.df['home_team'], self.df['away_team']]))
        teams = [t for t in teams if pd.notna(t)]
        points = {team:[] for team in teams}

        tqdm_bar = tqdm(total=num_simulations, desc=f"Simulating season for {self.league}")
        for _ in range(num_simulations):
            match_points = {team:0 for team in teams}
            for _, match in self.df.iterrows():
                home, away = match['home_team'], match['away_team']
                if pd.isna(home) or pd.isna(away):
                    continue
                home_stats = self.get_team_stats(home)
                away_stats = self.get_team_stats(away)
                X = pd.DataFrame([home_stats.values - away_stats.values])
                proba = self.model.predict_proba(X)[0]
                outcome = np.random.choice(self.model.classes_, p=proba)
                if outcome=='win': match_points[home]+=3
                elif outcome=='draw': match_points[home]+=1; match_points[away]+=1
                elif outcome=='loss': match_points[away]+=3
            for t, pts in match_points.items(): points[t].append(pts)
            tqdm_bar.update(1)
        tqdm_bar.close()

        champion_probs = {t: np.mean([pts==max([np.mean(p) for p in points.values()]) for pts in points[t]]) for t in teams}
        relegation_probs = {t: 1 - champion_probs[t] for t in teams}
        output_dir = os.path.join(self.vis_dir, "season_simulation")
        save_json_and_plot(output_dir, "champion_probabilities", champion_probs, f"{self.league} Champion Probabilities")
        save_json_and_plot(output_dir, "relegation_probabilities", relegation_probs, f"{self.league} Relegation Probabilities")
        return champion_probs, relegation_probs

# --------------------------
# Cross-League Prediction
# --------------------------
def calculate_league_strengths(league_models):
    strengths = {}
    for league, model in league_models.items():
        df = load_league_data(league)
        if df is None:
            strengths[league] = 1.0
            continue
        teams = pd.unique(pd.concat([df['home_team'], df['away_team']]))
        strengths[league] = 1.0 + len(teams)/len(df)
    return strengths

def predict_cross_league(team_a, league_a, team_b, league_b):
    analyzer_a = LeagueAnalyzer(league_a)
    analyzer_b = LeagueAnalyzer(league_b)
    stats_a = analyzer_a.get_team_stats(team_a)
    stats_b = analyzer_b.get_team_stats(team_b)
    scaler = StandardScaler()
    X_norm = scaler.fit_transform([stats_a.values, stats_b.values])
    X_diff = pd.DataFrame([X_norm[0]-X_norm[1]])
    proba_a = analyzer_a.model.predict_proba(X_diff)[0]
    proba_b = analyzer_b.model.predict_proba(X_diff)[0]
    classes = analyzer_a.model.classes_
    league_strengths = calculate_league_strengths({league_a:analyzer_a.model, league_b:analyzer_b.model})
    strength_a, strength_b = league_strengths[league_a], league_strengths[league_b]
    ensemble_proba = {cls: (proba_a[i]*strength_a + proba_b[i]*strength_b)/2 for i, cls in enumerate(classes)}
    today = pd.Timestamp.today().strftime("%Y-%m-%d")
    output_dir = os.path.join(DATA_DIR, "global_predictions", today)
    save_json_and_plot(output_dir, f"{team_a}_vs_{team_b}", ensemble_proba, f"{team_a} ({league_a}) vs {team_b} ({league_b})")
    return ensemble_proba

# --------------------------
# CLI
# --------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", type=str, required=True, choices=["head_to_head","cross_league","season_simulation"])
    parser.add_argument("--league", type=str, default=None)
    parser.add_argument("--league_a", type=str, default=None)
    parser.add_argument("--league_b", type=str, default=None)
    parser.add_argument("--home_team", type=str, default=None)
    parser.add_argument("--away_team", type=str, default=None)
    parser.add_argument("--team_a", type=str, default=None)
    parser.add_argument("--team_b", type=str, default=None)
    args = parser.parse_args()

    if args.mode=="head_to_head":
        if not all([args.league, args.home_team, args.away_team]): raise ValueError("Missing args for head_to_head")
        analyzer = LeagueAnalyzer(args.league)
        result = analyzer.predict_head_to_head(args.home_team, args.away_team)
        print(f"Head-to-head probabilities ({args.league}): {result}")

    elif args.mode=="cross_league":
        if not all([args.league_a, args.team_a, args.league_b, args.team_b]): raise ValueError("Missing args for cross_league")
        result = predict_cross_league(args.team_a, args.league_a, args.team_b, args.league_b)
        print(f"Cross-league probabilities: {result}")

    elif args.mode=="season_simulation":
        leagues_to_simulate = [args.league] if args.league and args.league!="all" else \
                              [f.replace(".csv","") for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
        for lg in tqdm(leagues_to_simulate, desc="Processing Leagues", ncols=90):
            try:
                analyzer = LeagueAnalyzer(lg)
                champion_probs, relegation_probs = analyzer.simulate_season()
                if champion_probs:
                    print(f"Season simulation completed for {lg}")
            except Exception as e:
                print(f"Error processing {lg}: {e}")
