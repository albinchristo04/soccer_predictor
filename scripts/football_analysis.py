# scripts/football_analysis.py
import os
import json
from pathlib import Path
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from tqdm import tqdm

# ----------------------
# Paths
# ----------------------
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR.parent / "fbref_data"   # CSVs live here now
PLOTS_DIR = DATA_DIR / "plots"
HTML_DIR = PLOTS_DIR / "html"

# Ensure directories exist
PLOTS_DIR.mkdir(exist_ok=True, parents=True)
HTML_DIR.mkdir(exist_ok=True, parents=True)

SUMMARY_JSON = DATA_DIR / "analysis_summary.json"

# ----------------------
# Helper functions
# ----------------------
def save_bar_plot(df, x, y, title, output_dir):
    output_dir.mkdir(exist_ok=True, parents=True)
    if df[y].notna().any():
        fname = output_dir / f"{y}.png"
        plt.figure(figsize=(10,6))
        sns.barplot(data=df, x=x, y=y)
        plt.title(title)
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()
        plt.savefig(fname)
        plt.close()
        return str(fname)
    return None

def save_line_plot(df, x, y, title, output_dir, hue=None):
    output_dir.mkdir(exist_ok=True, parents=True)
    if df[y].notna().any():
        fname = output_dir / f"{y}_trend.png"
        plt.figure(figsize=(12,6))
        sns.lineplot(data=df, x=x, y=y, hue=hue, marker="o")
        plt.title(title)
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()
        plt.savefig(fname)
        plt.close()
        return str(fname)

def analyze_season(season_df, league, season, output_dir):
    plots = {}
    interpretation = []

    numeric_cols = ["Gls","Sh","SoT","xG","Poss","Ast","MP"]
    for col in numeric_cols:
        if col in season_df.columns:
            season_df.loc[:, col] = pd.to_numeric(season_df[col], errors="coerce")

    stat_cols = ["Gls", "Sh", "xG", "Ast", "Poss"]
    for col in stat_cols:
        if col in season_df.columns and season_df[col].notna().any():
            try:
                top_team = season_df.loc[season_df[col].idxmax(), "Squad"]
                interpretation.append(f"Top {col}: {top_team}")
            except (KeyError, ValueError):
                top_team = None
            plot_file = output_dir / f"{col}.png"
            if plot_file.exists():
                plots[col] = str(plot_file)
            else:
                plot_path = save_bar_plot(season_df, "Squad", col, f"{league} {season} - {col}", output_dir)
                if plot_path:
                    plots[col] = plot_path
    return {"plots": plots, "interpretation": interpretation}

def analyze_league_trends(df, league, league_plot_dir):
    trend_cols = ["Gls", "Sh", "xG", "Ast", "Poss"]
    league_summary = []
    for season in sorted(df["Source"].dropna().unique()):
        season_df = df[df["Source"] == season].copy()
        for col in trend_cols:
            if col in season_df.columns and season_df[col].notna().any():
                try:
                    top_team = season_df.loc[season_df[col].idxmax(), "Squad"]
                    value = season_df[col].max()
                    league_summary.append({
                        "Season": season,
                        "Metric": col,
                        "TopTeam": top_team,
                        "Value": value
                    })
                except Exception:
                    continue
    summary_df = pd.DataFrame(league_summary)
    plots = {}
    for col in trend_cols:
        metric_df = summary_df[summary_df["Metric"] == col]
        if not metric_df.empty:
            plot_path = save_line_plot(metric_df, "Season", "Value", f"{league} top {col} trend", league_plot_dir, hue="TopTeam")
            if plot_path:
                plots[col] = plot_path
    return plots

def generate_html_dashboard(summary, league):
    league_html_dir = HTML_DIR / league
    league_html_dir.mkdir(exist_ok=True, parents=True)
    html_file = league_html_dir / f"{league}_dashboard.html"

    html_content = f"<html><head><title>{league} Analysis</title></head><body>"
    html_content += f"<h1>{league} Data Analysis</h1>"

    for season, data in summary.get(league, {}).items():
        if season == "league_trends":
            continue
        html_content += f"<h2>{season}</h2>"
        html_content += "<ul>"
        for interp in data.get("interpretation", []):
            html_content += f"<li>{interp}</li>"
        html_content += "</ul>"
        for plot_name, plot_path in data.get("plots", {}).items():
            html_content += f'<h4>{plot_name}</h4><img src="{Path(plot_path).relative_to(BASE_DIR.parent)}" width="800"><br>'

    html_content += "<h2>League Trends Across Seasons</h2>"
    for metric, plot_path in summary.get(league, {}).get("league_trends", {}).items():
        html_content += f'<h4>{metric}</h4><img src="{Path(plot_path).relative_to(BASE_DIR.parent)}" width="900"><br>'

    html_content += "</body></html>"

    with open(html_file, "w") as f:
        f.write(html_content)

    return html_file

# ----------------------
# Main loop
# ----------------------
def main():
    if SUMMARY_JSON.exists():
        with open(SUMMARY_JSON, "r") as f:
            summary = json.load(f)
    else:
        summary = {}

    # Load all CSV files in DATA_DIR directly
    league_files = sorted(DATA_DIR.glob("*.csv"))
    # Filter out master dataset
    league_files = [f for f in league_files if f.name != "fbref_master_dataset.csv"]
    if not league_files:
        print(f"No CSV files found in {DATA_DIR}.")
        return

    leagues = [f.stem for f in league_files]
    print(f"Leagues found: {leagues}")

    for league_file, league in tqdm(zip(league_files, leagues), total=len(league_files)):
        df = pd.read_csv(league_file, low_memory=False)
        if "Source" not in df.columns or df["Source"].dropna().empty:
            print(f"Warning: '{league_file}' has no 'Source' column or empty data, skipping...")
            continue

        seasons = sorted(df["Source"].dropna().unique())
        if league not in summary:
            summary[league] = {}

        league_plot_dir = PLOTS_DIR / league

        # Per-season analysis
        for season in seasons:
            if season in summary[league] and summary[league][season].get("plots"):
                continue
            season_df = df[df["Source"] == season].copy()
            season_plot_dir = league_plot_dir / season.replace(" ", "_")
            result = analyze_season(season_df, league, season, season_plot_dir)
            summary[league][season] = result

        # League trends
        trend_plots = analyze_league_trends(df, league, league_plot_dir)
        summary[league]["league_trends"] = trend_plots

        # Generate HTML dashboard
        html_file = generate_html_dashboard(summary, league)
        print(f"Dashboard generated: {html_file}")

    # Save summary JSON
    with open(SUMMARY_JSON, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"Analysis complete. Summary saved to {SUMMARY_JSON}")

if __name__ == "__main__":
    main()
