#!/usr/bin/env python3
"""
Train ML models for each league using PROCESSED match data.
This script reads from fbref_data/processed/{league}_processed.csv
"""
import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# --------------------------
# Paths
# --------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
os.makedirs(DATA_DIR, exist_ok=True)

# --------------------------
# Helper: Load processed data
# --------------------------
def load_processed_data(league_name):
    """Load processed match-level data."""
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
def prepare_features(df, league_name):
    """Prepare feature matrix and target variable."""
    tqdm.write(f"Preparing features for {league_name}...")
    
    # Define feature columns (exclude identifiers and target)
    exclude_cols = ['home_team', 'away_team', 'result', 'season', 
                   'home_goals', 'away_goals', 'date', 'venue', 'url', 'source']
    
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    
    # Select only numeric features
    X = df[feature_cols].select_dtypes(include=[np.number])
    
    # Fill any remaining NaN values
    X = X.fillna(0)
    
    # Target variable
    y = df['result']
    
    tqdm.write(f"Features: {list(X.columns)}")
    tqdm.write(f"Feature matrix shape: {X.shape}")
    tqdm.write(f"Target distribution:\n{y.value_counts()}")
    
    return X, y, feature_cols

# --------------------------
# Helper: Train model
# --------------------------
def train_league_model(df, league_name):
    """Train RandomForest classifier for a league."""
    tqdm.write(f"\n{'='*60}")
    tqdm.write(f"Training model for {league_name.upper()}")
    tqdm.write(f"{'='*60}")
    
    # Prepare features
    X, y, feature_cols = prepare_features(df, league_name)
    
    if len(X) < 50:
        tqdm.write(f"Not enough data for {league_name} ({len(X)} matches)")
        tqdm.write(f"    Need at least 50 matches. Skipping...")
        return None
    
    # Check class distribution
    class_counts = y.value_counts()
    if len(class_counts) < 3:
        tqdm.write(f"Insufficient class diversity for {league_name}")
        tqdm.write(f"    Classes found: {list(class_counts.index)}")
        tqdm.write(f"    Need win/draw/loss. Skipping...")
        return None
    
    # Split data
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )
    except ValueError as e:
        tqdm.write(f"Cannot stratify split for {league_name}: {e}")
        tqdm.write(f"    Using random split instead...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
    
    # Train model
    tqdm.write(f"Training RandomForest (300 trees)...")
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'  # Handle class imbalance
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_preds = model.predict(X_train)
    test_preds = model.predict(X_test)
    
    train_acc = accuracy_score(y_train, train_preds)
    test_acc = accuracy_score(y_test, test_preds)
    
    tqdm.write(f"\nModel Performance:")
    tqdm.write(f"   Training Accuracy: {train_acc:.3f}")
    tqdm.write(f"   Testing Accuracy:  {test_acc:.3f}")
    tqdm.write(f"\n{classification_report(y_test, test_preds, zero_division=0)}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False).head(10)
    
    tqdm.write(f"\nTop 10 Features:")
    for _, row in feature_importance.iterrows():
        tqdm.write(f"   {row['feature']:30s} {row['importance']:.4f}")
    
    # Save visualizations
    vis_dir = os.path.join(DATA_DIR, league_name, "visualizations")
    os.makedirs(vis_dir, exist_ok=True)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, test_preds, labels=['win', 'draw', 'loss'])
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Win', 'Draw', 'Loss'],
                yticklabels=['Win', 'Draw', 'Loss'])
    plt.title(f'{league_name.replace("_", " ").title()} - Confusion Matrix\n'
              f'Test Accuracy: {test_acc:.3f}')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f'{league_name}_confusion_matrix.png'), dpi=150)
    plt.close()
    
    # Feature importance plot
    plt.figure(figsize=(10, 6))
    top_features = feature_importance.head(15)
    plt.barh(range(len(top_features)), top_features['importance'])
    plt.yticks(range(len(top_features)), top_features['feature'])
    plt.xlabel('Importance')
    plt.title(f'{league_name.replace("_", " ").title()} - Top 15 Features')
    plt.gca().invert_yaxis()
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f'{league_name}_feature_importance.png'), dpi=150)
    plt.close()
    
    # Save model
    model_dir = os.path.join(DATA_DIR, league_name)
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'model.pkl')
    
    # Save model with metadata
    model_data = {
        'model': model,
        'feature_cols': list(X.columns),
        'classes': list(model.classes_),
        'train_accuracy': train_acc,
        'test_accuracy': test_acc,
        'n_samples': len(df)
    }
    
    joblib.dump(model_data, model_path)
    tqdm.write(f"\nModel saved to: {model_path}")
    
    return model_data

# --------------------------
# Helper: Generate visualizations
# --------------------------
def generate_visualizations(df, league_name):
    """Generate league-level visualizations."""
    tqdm.write(f"Generating visualizations for {league_name}...")
    
    vis_dir = os.path.join(DATA_DIR, league_name, "visualizations")
    os.makedirs(vis_dir, exist_ok=True)
    
    # Result distribution
    plt.figure(figsize=(8, 6))
    result_counts = df['result'].value_counts()
    colors = {'win': '#4CAF50', 'draw': '#FFC107', 'loss': '#F44336'}
    bar_colors = [colors.get(r, '#999') for r in result_counts.index]
    
    plt.bar(result_counts.index, result_counts.values, color=bar_colors, edgecolor='black')
    plt.title(f'{league_name.replace("_", " ").title()} - Result Distribution')
    plt.ylabel('Number of Matches')
    plt.xlabel('Result (Home Team Perspective)')
    
    # Add percentages
    total = result_counts.sum()
    for i, (idx, val) in enumerate(result_counts.items()):
        pct = (val / total) * 100
        plt.text(i, val + total*0.01, f'{val}\n({pct:.1f}%)', 
                ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f'{league_name}_result_distribution.png'), dpi=150)
    plt.close()
    
    # Goals distribution
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # Home goals
    sns.histplot(df['home_goals'], kde=True, ax=ax1, bins=range(0, df['home_goals'].max()+2), 
                 color='#4CAF50', edgecolor='black')
    ax1.set_title('Home Goals Distribution')
    ax1.set_xlabel('Goals Scored')
    ax1.set_ylabel('Frequency')
    ax1.axvline(df['home_goals'].mean(), color='red', linestyle='--', 
                label=f'Mean: {df["home_goals"].mean():.2f}')
    ax1.legend()
    
    # Away goals
    sns.histplot(df['away_goals'], kde=True, ax=ax2, bins=range(0, df['away_goals'].max()+2),
                 color='#F44336', edgecolor='black')
    ax2.set_title('Away Goals Distribution')
    ax2.set_xlabel('Goals Scored')
    ax2.set_ylabel('Frequency')
    ax2.axvline(df['away_goals'].mean(), color='red', linestyle='--',
                label=f'Mean: {df["away_goals"].mean():.2f}')
    ax2.legend()
    
    plt.suptitle(f'{league_name.replace("_", " ").title()} - Goals Analysis')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, f'{league_name}_goals_distribution.png'), dpi=150)
    plt.close()
    
    # Season-by-season trends (if season data available)
    if 'season' in df.columns and df['season'].notna().any():
        season_stats = df.groupby('season').agg({
            'home_goals': 'mean',
            'away_goals': 'mean',
            'result': lambda x: (x == 'win').sum() / len(x)
        }).reset_index()
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
        
        # Goals per season
        ax1.plot(season_stats['season'], season_stats['home_goals'], 
                marker='o', label='Home Goals', color='#4CAF50', linewidth=2)
        ax1.plot(season_stats['season'], season_stats['away_goals'], 
                marker='s', label='Away Goals', color='#F44336', linewidth=2)
        ax1.set_xlabel('Season')
        ax1.set_ylabel('Average Goals')
        ax1.set_title('Average Goals per Match by Season')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Home win rate
        ax2.plot(season_stats['season'], season_stats['result']*100, 
                marker='o', color='#2196F3', linewidth=2)
        ax2.set_xlabel('Season')
        ax2.set_ylabel('Home Win Rate (%)')
        ax2.set_title('Home Win Rate by Season')
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(os.path.join(vis_dir, f'{league_name}_season_trends.png'), dpi=150)
        plt.close()
    
    tqdm.write(f"Visualizations saved to: {vis_dir}")

# --------------------------
# Main
# --------------------------
def main(selected_leagues=None):
    """Train models for selected leagues."""
    print("\n" + "="*60)
    print("SOCCER PREDICTION MODEL TRAINER")
    print("="*60)
    print(f"\nData directory: {PROCESSED_DIR}")
    
    # Find available processed league files
    if not os.path.exists(PROCESSED_DIR):
        print(f"\nError: Processed data directory not found!")
        print(f"   Expected: {PROCESSED_DIR}")
        print(f"\n   Please run process_scraped_data.py first!")
        return
    
    processed_files = [f for f in os.listdir(PROCESSED_DIR) 
                      if f.endswith('_processed.csv')]
    
    if not processed_files:
        print(f"\nError: No processed league files found!")
        print(f"   Directory: {PROCESSED_DIR}")
        print(f"\n   Please run process_scraped_data.py first!")
        return
    
    # Extract league names
    available_leagues = [f.replace('_processed.csv', '') for f in processed_files]
    
    print(f"\nFound {len(available_leagues)} processed leagues:")
    for league in available_leagues:
        print(f"   • {league}")
    
    # Determine which leagues to process
    if selected_leagues == 'all' or selected_leagues is None:
        leagues_to_train = available_leagues
    elif selected_leagues in available_leagues:
        leagues_to_train = [selected_leagues]
    else:
        print(f"\nError: League '{selected_leagues}' not found!")
        print(f"   Available leagues: {', '.join(available_leagues)}")
        return
    
    print(f"\nTraining {len(leagues_to_train)} league(s)...")
    print("="*60)
    
    # Train each league
    results = {}
    
    with tqdm(total=len(leagues_to_train), desc="Overall Progress", 
              position=0, leave=True) as pbar:
        for league in leagues_to_train:
            try:
                # Load processed data
                df = load_processed_data(league)
                
                # Generate visualizations
                generate_visualizations(df, league)
                
                # Train model
                model_data = train_league_model(df, league)
                
                if model_data:
                    results[league] = {
                        'status': 'success',
                        'matches': len(df),
                        'test_accuracy': model_data['test_accuracy']
                    }
                else:
                    results[league] = {
                        'status': 'skipped',
                        'matches': len(df),
                        'reason': 'insufficient_data'
                    }
                    
            except FileNotFoundError as e:
                tqdm.write(f"\n{league}: {e}")
                results[league] = {'status': 'error', 'reason': 'file_not_found'}
                
            except Exception as e:
                tqdm.write(f"\nError training {league}: {e}")
                import traceback
                tqdm.write(traceback.format_exc())
                results[league] = {'status': 'error', 'reason': str(e)}
            
            pbar.update(1)
    
    # Summary
    print("\n" + "="*60)
    print("TRAINING SUMMARY")
    print("="*60)
    
    successful = [k for k, v in results.items() if v['status'] == 'success']
    skipped = [k for k, v in results.items() if v['status'] == 'skipped']
    failed = [k for k, v in results.items() if v['status'] == 'error']
    
    print(f"\nSuccessfully trained: {len(successful)}")
    for league in successful:
        acc = results[league]['test_accuracy']
        matches = results[league]['matches']
        print(f"   • {league:20s} - {matches:4d} matches - Accuracy: {acc:.3f}")
    
    if skipped:
        print(f"\nSkipped: {len(skipped)}")
        for league in skipped:
            matches = results[league]['matches']
            reason = results[league]['reason']
            print(f"   • {league:20s} - {matches:4d} matches - {reason}")
    
    if failed:
        print(f"\nFailed: {len(failed)}")
        for league in failed:
            reason = results[league]['reason']
            print(f"   • {league:20s} - {reason}")
    
    print("\n" + "="*60)
    
    if successful:
        print("\nTraining complete! You can now use predict_and_analyze.py")
        print(f"  Models saved in: {DATA_DIR}/{{league}}/model.pkl")
    else:
        print("\nNo models were successfully trained.")
        print("   Check the errors above and ensure you have sufficient data.")

# --------------------------
# Entry point
# --------------------------
if __name__ == "__main__":
    import sys
    
    # Check for processed data
    if not os.path.exists(PROCESSED_DIR):
        print("\n" + "="*60)
        print("WARNING: Processed data directory not found!")
        print("="*60)
        print(f"\nExpected directory: {PROCESSED_DIR}")
        print("\nYou need to run the data processing pipeline first:")
        print("  1. python populate_seasons.py")
        print("  2. python fbref_scraper.py")
        print("  3. python process_scraped_data.py  ← Run this first!")
        print("  4. python train_league_models.py  ← You are here")
        print("\n" + "="*60)
        sys.exit(1)
    
    # Interactive mode
    processed_files = [f.replace('_processed.csv', '') 
                      for f in os.listdir(PROCESSED_DIR) 
                      if f.endswith('_processed.csv')]
    
    if not processed_files:
        print("\nNo processed league files found!")
        print(f"   Directory: {PROCESSED_DIR}")
        print("\n   Please run process_scraped_data.py first!")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("Available leagues:")
    print("="*60)
    for league in processed_files:
        print(f"   • {league}")
    
    print("\nOptions:")
    print("   • Enter league name (e.g., 'premier_league')")
    print("   • Enter 'all' to train all leagues")
    
    choice = input("\nYour choice: ").strip().lower()
    
    main(selected_leagues=choice if choice else 'all')
