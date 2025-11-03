#!/bin/bash

# Script to remove unused visualization PNG files from all league folders
# These files are generated during analysis but not displayed in the web app

echo "Cleaning up unused visualization files..."

# List of leagues
leagues=(
    "premier_league"
    "la_liga"
    "bundesliga"
    "serie_a"
    "ligue_1"
    "eredivisie"
    "primera_division"
    "liga_portugal"
    "super_lig"
)

# Files to remove (not used by any component)
unused_files=(
    "goals_distribution.png"
    "result_distribution.png"
    "season_trends.png"
    "test_confidence_thresholds.png"
    "train_confidence_thresholds.png"
    "test_overall_accuracy_confidence.png"
    "train_overall_accuracy_confidence.png"
)

for league in "${leagues[@]}"; do
    viz_dir="fbref_data/${league}/visualizations"
    
    if [ -d "$viz_dir" ]; then
        echo "Processing $league..."
        
        for file in "${unused_files[@]}"; do
            full_path="${viz_dir}/${league}_${file}"
            
            if [ -f "$full_path" ]; then
                echo "  Removing: ${league}_${file}"
                rm "$full_path"
            fi
        done
    else
        echo "Directory not found: $viz_dir"
    fi
done

echo ""
echo "Cleanup complete!"
echo ""
echo "Files retained (used by web app):"
echo "  - {league}_confusion_matrix.png"
echo "  - {league}_feature_importance.png"
echo "  - {league}_prediction_distribution.png"
echo "  - {league}_train_classification_report.png"
echo "  - {league}_test_classification_report.png"
echo "  - {league}_train_win_confidence_metrics.png"
echo "  - {league}_train_draw_confidence_metrics.png"
echo "  - {league}_train_loss_confidence_metrics.png"
echo "  - {league}_test_win_confidence_metrics.png"
echo "  - {league}_test_draw_confidence_metrics.png"
echo "  - {league}_test_loss_confidence_metrics.png"
