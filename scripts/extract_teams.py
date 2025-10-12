
import pandas as pd

def get_unique_teams(file_path, home_col='Home', away_col='Away', squad_col='Squad'):
    try:
        df = pd.read_csv(file_path)
        if home_col in df.columns and away_col in df.columns:
            home_teams = df[home_col].unique()
            away_teams = df[away_col].unique()
            all_teams = pd.concat([pd.Series(home_teams), pd.Series(away_teams)]).unique()
        elif squad_col in df.columns:
            all_teams = df[squad_col].unique()
        else:
            return []

        all_teams = [x for x in all_teams if str(x) != "nan"]
        # Remove country codes from team names (e.g., 'es Spain')
        cleaned_teams = []
        for team in all_teams:
            if isinstance(team, str) and len(team.split()) > 1:
                # Check if the first part is a two-letter country code
                if len(team.split()[0]) == 2 and team.split()[0].islower():
                    cleaned_teams.append(' '.join(team.split()[1:]))
                else:
                    cleaned_teams.append(team)
            else:
                cleaned_teams.append(team)
        return sorted(list(set(cleaned_teams)))
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

leagues = {
    "Premier League": "/home/roaltshu/code/soccer_predictor/fbref_data/premier_league.csv",
    "La Liga": "/home/roaltshu/code/soccer_predictor/fbref_data/la_liga.csv",
    "Serie A": "/home/roaltshu/code/soccer_predictor/fbref_data/serie_a.csv",
    "Bundesliga": "/home/roaltshu/code/soccer_predictor/fbref_data/bundesliga.csv",
    "Ligue 1": "/home/roaltshu/code/soccer_predictor/fbref_data/ligue_1.csv",
    "Champions League (UCL)": "/home/roaltshu/code/soccer_predictor/fbref_data/ucl.csv",
    "Europa League (UEL)": "/home/roaltshu/code/soccer_predictor/fbref_data/uel.csv",
    "MLS": "/home/roaltshu/code/soccer_predictor/fbref_data/mls.csv",
    "FIFA World Cup": "/home/roaltshu/code/soccer_predictor/fbref_data/world_cup.csv"
}

all_league_teams = {}

for league, path in leagues.items():
    if league == "FIFA World Cup":
        all_league_teams[league] = get_unique_teams(path, squad_col='Squad')
    else:
        all_league_teams[league] = get_unique_teams(path)

for league, teams in all_league_teams.items():
    print(f"{league} Teams: {teams}")

