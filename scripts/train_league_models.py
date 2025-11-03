#!/usr/bin/env python3
"""
Train machine learning models for each league using processed match data.

This script reads processed data from the `fbref_data/processed` directory,
trains a RandomForestClassifier for each league, and saves the trained model
along with evaluation metrics and visualizations.

The main functionalities include:
- Loading processed data for each league.
- Preparing feature matrices and target variables for training.
- Training a RandomForestClassifier with:
  * Exponential weighting for recent seasons (last 10 years emphasized)
  * Custom class weights to reduce draw prediction bias
  * Enhanced hyperparameters for better performance
- Evaluating the model on a test set and printing a classification report.
- Generating and saving comprehensive visualizations:
  * Confusion matrix (test set)
  * Feature importance (top 15 features)
  * Prediction probability distributions
  * Classification reports (train and test)
- Saving the trained model, feature columns, and other metadata using joblib.

IMPORTANT: Run this script from the scripts directory with the virtual environment activated:
    cd /path/to/soccer_predictor/scripts
    python train_league_models.py

This script is the final step in the model training pipeline and is designed to be
run after the data has been scraped and processed.
"""

import os
import sys
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from typing import List, Dict, Tuple, Any, Optional

# --------------------------
# Paths
# --------------------------
BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR: str = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR: str = os.path.join(DATA_DIR, "processed")
os.makedirs(DATA_DIR, exist_ok=True)


# --------------------------
# Helper: Load processed data
# --------------------------
def load_processed_data(league_name: str) -> pd.DataFrame:
    """
    Load processed match-level data for a given league.

    Args:
        league_name: The name of the league.

    Returns:
        A pandas DataFrame with the processed data.

    Raises:
        FileNotFoundError: If the processed data file does not exist.
    """
    processed_path = os.path.join(PROCESSED_DIR, f"{league_name}_processed.csv")
    if not os.path.exists(processed_path):
        raise FileNotFoundError(
            f"Processed data not found: {processed_path}\n"
            f"Please run process_scraped_data.py first!"
        )
    df = pd.read_csv(processed_path, low_memory=False)
    tqdm.write(f"Loaded {len(df)} matches for {league_name}")
    return df


# --------------------------
# Helper: Prepare features for training
# --------------------------
def prepare_features(
    df: pd.DataFrame, league_name: str
) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    Prepare the feature matrix (X), target variable (y), and feature columns.

    Args:
        df: The input DataFrame with processed match data.
        league_name: The name of the league.

    Returns:
        A tuple containing the feature matrix, the target series, and a list of
        feature column names.
    """
    tqdm.write(f"Preparing features for {league_name}...")
    exclude_cols = [
        "home_team",
        "away_team",
        "result",
        "season",
        "home_goals",
        "away_goals",
        "date",
        "venue",
        "url",
        "source",
        "status",
        "season_start_year", # Exclude season_start_year from features
    ]
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    X = df[feature_cols].select_dtypes(include=[np.number]).fillna(0)
    y = df["result"]

    tqdm.write(f"Features: {list(X.columns)}")
    tqdm.write(f"Feature matrix shape: {X.shape}")
    tqdm.write(f"Target distribution:\n{y.value_counts()}")

    return X, y, feature_cols


def save_classification_report_plot(
    report: Dict[str, Any], path: str, title: str
) -> None:
    """Save classification report as a line plot."""
    report_df = pd.DataFrame(report).iloc[:-1, :].T

    # Exclude 'accuracy', 'macro avg', 'weighted avg' rows for plotting
    plot_df = report_df.drop(
        columns=["accuracy", "macro avg", "weighted avg"], errors="ignore"
    )

    fig, ax = plt.subplots(figsize=(10, 6))
    plot_df[["precision", "recall", "f1-score"]].plot(kind="line", marker="o", ax=ax)
    ax.set_title(title)
    ax.set_xlabel("Class")
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1)
    ax.grid(True, linestyle="--", alpha=0.6)
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


# --------------------------
# Helper: Train model
# --------------------------
def train_league_model(df: pd.DataFrame, league_name: str) -> Optional[Dict[str, Any]]:
    """
    Train a RandomForestClassifier for a specific league.

    Args:
        df: The DataFrame with processed data for the league.
        league_name: The name of the league.

    Returns:
        A dictionary containing the trained model and metadata, or None if
        training is skipped.
    """
    tqdm.write(f"\n{'='*60}")
    tqdm.write(f"Training model for {league_name.upper()}")
    tqdm.write(f"{'='*60}")

    # Filter for played matches only
    df = df[df["status"] == "played"].copy()
    
    # Extract season start year
    df["season_start_year"] = df["season"].apply(lambda x: int(str(x).split("-")[0]))
    
    # EXCLUDE current season (2025-2026) from training - use ALL historical data
    current_season_start = 2025
    df = df[df["season_start_year"] < current_season_start].copy()
    
    tqdm.write(f"Using ALL historical data from {df['season_start_year'].min()} to {df['season_start_year'].max()}")
    tqdm.write(f"Total matches: {len(df)}")

    # Calculate sample weights with STRONG emphasis on last 5 seasons
    # All data is included, but recent 5 seasons get exponentially higher weights
    min_year = df["season_start_year"].min()
    max_year = df["season_start_year"].max()
    
    if max_year == min_year:
        # If all data is from the same year, assign equal weights
        sample_weights = pd.Series(1.0, index=df.index)
    else:
        # Calculate which seasons are in the "last 5"
        last_5_threshold = max_year - 4  # Last 5 seasons
        
        sample_weights = []
        for year in df["season_start_year"]:
            if year >= last_5_threshold:
                # Last 5 seasons: exponential weight from 1.5 to 3.0
                # Most recent gets 3.0x weight, 5 years ago gets 1.5x
                years_from_oldest_recent = year - last_5_threshold
                weight = 1.5 + 1.5 * (years_from_oldest_recent / 4) ** 2
            else:
                # Older seasons: linear weight from 0.3 to 1.0
                # Oldest season gets 0.3x, season before "last 5" gets 1.0x
                if last_5_threshold - min_year == 0:
                    weight = 1.0
                else:
                    normalized = (year - min_year) / (last_5_threshold - min_year - 1)
                    weight = 0.3 + 0.7 * normalized
            sample_weights.append(weight)
        
        sample_weights = pd.Series(sample_weights, index=df.index)
        
        tqdm.write(f"\nSample weighting strategy:")
        tqdm.write(f"  • Last 5 seasons ({last_5_threshold}-{max_year}): 1.5x to 3.0x weight")
        tqdm.write(f"  • Older seasons ({min_year}-{last_5_threshold-1}): 0.3x to 1.0x weight")
        tqdm.write(f"  • Average weight for last 5 seasons: {sample_weights[df['season_start_year'] >= last_5_threshold].mean():.2f}")
        tqdm.write(f"  • Average weight for older seasons: {sample_weights[df['season_start_year'] < last_5_threshold].mean():.2f}")

    X, y, feature_cols = prepare_features(df, league_name)

    if len(X) < 50 or len(y.value_counts()) < 3:
        tqdm.write(
            f"Skipping {league_name} due to insufficient data or class diversity."
        )
        return None

    try:
        X_train, X_test, y_train, y_test, sample_weights_train, _ = train_test_split(
            X, y, sample_weights, test_size=0.2, stratify=y, random_state=42
        )
    except ValueError:
        tqdm.write(f"Cannot stratify split for {league_name}. Using random split.")
        X_train, X_test, y_train, y_test, sample_weights_train, _ = train_test_split(
            X, y, sample_weights, test_size=0.2, random_state=42
        )

    # Custom class weights to reduce draw bias
    # Draws are often over-predicted, so we reduce their weight
    class_weight_dict = {
        'win': 1.2,   # Slightly increase home win weight
        'draw': 0.6,  # Significantly reduce draw weight to combat bias
        'loss': 1.2   # Slightly increase away win weight
    }

    model = RandomForestClassifier(
        n_estimators=400,           # Increased from 300 for better performance
        max_depth=20,               # Increased from 15 for more complex patterns
        min_samples_split=8,        # Reduced from 10 for finer splits
        min_samples_leaf=4,         # Reduced from 5 for finer splits
        random_state=42,
        n_jobs=-1,
        class_weight=class_weight_dict,  # Use custom weights to reduce draw bias
    )
    model.fit(X_train, y_train, sample_weight=sample_weights_train)

    train_acc = accuracy_score(y_train, model.predict(X_train))
    test_acc = accuracy_score(y_test, model.predict(X_test))

    tqdm.write(
        f"\nModel Performance:\n  Training Accuracy: {train_acc:.3f}\n  Testing Accuracy:  {test_acc:.3f}"
    )
    tqdm.write(
        f"\n{classification_report(y_test, model.predict(X_test), zero_division=0)}"
    )

    feature_importance = (
        pd.DataFrame({"feature": X.columns, "importance": model.feature_importances_})
        .sort_values("importance", ascending=False)
        .head(10)
    )

    tqdm.write("\nTop 10 Features:")
    for _, row in feature_importance.iterrows():
        tqdm.write(f"   {row['feature']:30s} {row['importance']:.4f}")

    model_path = os.path.join(DATA_DIR, league_name, "model.pkl")
    train_report = classification_report(
        y_train, model.predict(X_train), output_dict=True
    )
    test_report = classification_report(y_test, model.predict(X_test), output_dict=True)

    vis_dir = os.path.join(DATA_DIR, league_name, "visualizations")
    os.makedirs(vis_dir, exist_ok=True)

    # Save classification report plots
    save_classification_report_plot(
        train_report,
        os.path.join(vis_dir, f"{league_name}_train_classification_report.png"),
        f"{league_name.replace('_', ' ').title()} - Train Classification Report",
    )
    save_classification_report_plot(
        test_report,
        os.path.join(vis_dir, f"{league_name}_test_classification_report.png"),
        f"{league_name.replace('_', ' ').title()} - Test Classification Report",
    )

    # Generate and save confusion matrix for test set
    y_pred_test = model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred_test, labels=model.classes_)
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=model.classes_, yticklabels=model.classes_,
                cbar_kws={'label': 'Count'})
    plt.title(f'{league_name.replace("_", " ").title()} - Test Set Confusion Matrix', 
              fontsize=16, fontweight='bold')
    plt.xlabel('Predicted', fontsize=12, fontweight='bold')
    plt.ylabel('Actual', fontsize=12, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f"{league_name}_confusion_matrix.png"), dpi=150)
    plt.close()

    # Generate feature importance plot
    plt.figure(figsize=(12, 8))
    feature_importance_full = pd.DataFrame({
        'feature': X.columns, 
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False).head(15)
    
    sns.barplot(data=feature_importance_full, x='importance', y='feature', palette='viridis')
    plt.title(f'{league_name.replace("_", " ").title()} - Top 15 Feature Importance', 
              fontsize=16, fontweight='bold')
    plt.xlabel('Importance', fontsize=12, fontweight='bold')
    plt.ylabel('Feature', fontsize=12, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f"{league_name}_feature_importance.png"), dpi=150)
    plt.close()

    # Generate prediction distribution plot
    y_pred_proba_test = model.predict_proba(X_test)
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for idx, class_name in enumerate(model.classes_):
        axes[idx].hist(y_pred_proba_test[:, idx], bins=30, color='skyblue', edgecolor='black')
        axes[idx].set_title(f'Predicted Probability: {class_name.upper()}', 
                           fontsize=14, fontweight='bold')
        axes[idx].set_xlabel('Probability', fontsize=11)
        axes[idx].set_ylabel('Frequency', fontsize=11)
        axes[idx].grid(alpha=0.3)
    
    plt.suptitle(f'{league_name.replace("_", " ").title()} - Test Set Prediction Distribution', 
                 fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f"{league_name}_prediction_distribution.png"), dpi=150)
    plt.close()

    tqdm.write(f"Visualizations saved to: {vis_dir}")

    model_data = {
        "model": model,
        "feature_cols": list(X.columns),
        "classes": list(model.classes_),
        "train_accuracy": train_acc,
        "test_accuracy": test_acc,
        "train_report": train_report,
        "test_report": test_report,
        "n_samples": len(df),
    }
    joblib.dump(model_data, model_path)
    tqdm.write(f"\nModel saved to: {model_path}")

    return model_data


# --------------------------
# Helper: Generate visualizations
# --------------------------
def generate_visualizations(df: pd.DataFrame, league_name: str) -> None:
    """
    Generate and save league-level visualizations.

    Args:
        df: The DataFrame with processed data.
        league_name: The name of the league.
    """
    # Visualization logic here...
    pass


# --------------------------
# Main
# --------------------------
def main(selected_leagues: Optional[str] = None) -> None:
    """
    Main function to train models for selected or all leagues.

    Args:
        selected_leagues: A specific league to train, or 'all'.
    """
    import sklearn
    
    print("\n" + "=" * 60)
    print("SOCCER PREDICTION MODEL TRAINER")
    print("=" * 60)
    print(f"\nScikit-learn version: {sklearn.__version__}")
    print(f"Data directory: {PROCESSED_DIR}")

    if not os.path.exists(PROCESSED_DIR):
        print(
            f"\nError: Processed data directory not found!\n   Please run process_scraped_data.py first!"
        )
        return

    processed_files = [
        f for f in os.listdir(PROCESSED_DIR) if f.endswith("_processed.csv")
    ]
    if not processed_files:
        print(
            f"\nError: No processed league files found!\n   Please run process_scraped_data.py first!"
        )
        return

    available_leagues = [f.replace("_processed.csv", "") for f in processed_files]
    print(f"\nFound {len(available_leagues)} processed leagues:")
    for league in available_leagues:
        print(f"   • {league}")

    if selected_leagues == "all" or selected_leagues is None:
        leagues_to_train = available_leagues
    elif selected_leagues in available_leagues:
        leagues_to_train = [selected_leagues]
    else:
        print(f"\nError: League '{selected_leagues}' not found!")
        return

    print(f"\nTraining {len(leagues_to_train)} league(s)...\n" + "=" * 60)

    results: Dict[str, Dict[str, Any]] = {}
    with tqdm(
        total=len(leagues_to_train), desc="Overall Progress", position=0, leave=True
    ) as pbar:
        for league in leagues_to_train:
            try:
                df = load_processed_data(league)
                generate_visualizations(df, league)
                model_data = train_league_model(df, league)
                if model_data:
                    results[league] = {
                        "status": "success",
                        "matches": len(df),
                        "test_accuracy": model_data["test_accuracy"],
                    }
                else:
                    results[league] = {
                        "status": "skipped",
                        "matches": len(df),
                        "reason": "insufficient_data",
                    }
            except (FileNotFoundError, Exception) as e:
                tqdm.write(f"\nError training {league}: {e}")
                results[league] = {"status": "error", "reason": str(e)}
            pbar.update(1)

    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    # Summary printing logic here...


if __name__ == "__main__":
    if not os.path.exists(PROCESSED_DIR):
        print(
            "\nWARNING: Processed data directory not found! Run data processing pipeline first."
        )
        sys.exit(1)

    processed_files = [
        f.replace("_processed.csv", "")
        for f in os.listdir(PROCESSED_DIR)
        if f.endswith("_processed.csv")
    ]
    if not processed_files:
        print("\nNo processed league files found! Run process_scraped_data.py first.")
        sys.exit(1)

    print("\nAvailable leagues:")
    for league in processed_files:
        print(f"   • {league}")
    print(
        "\nOptions:\n   • Enter league name (e.g., 'premier_league')\n   • Enter 'all' to train all leagues"
    )
    choice = input("\nYour choice: ").strip().lower()

    main(selected_leagues=choice if choice else "all")
