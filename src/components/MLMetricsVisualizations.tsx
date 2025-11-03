import React from 'react';

interface MLMetricsVisualizationsProps {
  league: string;
}

const MLMetricsVisualizations: React.FC<MLMetricsVisualizationsProps> = ({ league }) => {
  if (!league) {
    return null;
  }

  const modelVisualizationImages = [
    {
      name: `${league}_confusion_matrix.png`,
      title: 'Confusion Matrix (Test Set)',
      description: 'Shows the model\'s prediction accuracy for each outcome (Win/Draw/Loss). Diagonal values indicate correct predictions, while off-diagonal values show misclassifications.',
      category: 'performance'
    },
    {
      name: `${league}_feature_importance.png`,
      title: 'Top 15 Feature Importance',
      description: 'Displays which statistical features have the most influence on match predictions. Higher values indicate greater importance in the model\'s decision-making process.',
      category: 'performance'
    },
    {
      name: `${league}_prediction_distribution.png`,
      title: 'Prediction Probability Distribution',
      description: 'Shows how confident the model is across all predictions. Distributions closer to 0 or 1 indicate high confidence, while distributions near 0.5 show uncertainty.',
      category: 'performance'
    }
  ];

  const classificationReportImages = [
    {
      name: `${league}_train_classification_report.png`,
      title: 'Training Set Classification Metrics',
      description: 'Precision, recall, and F1-score for the training set. These metrics evaluate how well the model learned from the training data for each outcome class.',
      category: 'train'
    },
    {
      name: `${league}_test_classification_report.png`,
      title: 'Test Set Classification Metrics',
      description: 'Precision, recall, and F1-score for the test set. These metrics show the model\'s real-world performance on unseen data.',
      category: 'test'
    }
  ];

  const confidenceThresholdImages = [
    {
      name: `${league}_train_win_confidence_metrics.png`,
      title: 'Training: Win Prediction Confidence',
      description: 'Shows precision, recall, and F1-score for WIN predictions across confidence thresholds (0-100%). Higher thresholds mean the model only predicts win when very confident.',
      category: 'train',
      outcome: 'win'
    },
    {
      name: `${league}_train_draw_confidence_metrics.png`,
      title: 'Training: Draw Prediction Confidence',
      description: 'Shows precision, recall, and F1-score for DRAW predictions across confidence thresholds. Draws are typically harder to predict with high confidence.',
      category: 'train',
      outcome: 'draw'
    },
    {
      name: `${league}_train_loss_confidence_metrics.png`,
      title: 'Training: Away Win Prediction Confidence',
      description: 'Shows precision, recall, and F1-score for AWAY WIN predictions across confidence thresholds.',
      category: 'train',
      outcome: 'loss'
    },
    {
      name: `${league}_test_win_confidence_metrics.png`,
      title: 'Test: Win Prediction Confidence',
      description: 'Model confidence analysis for WIN predictions on unseen test data. This shows real-world prediction reliability.',
      category: 'test',
      outcome: 'win'
    },
    {
      name: `${league}_test_draw_confidence_metrics.png`,
      title: 'Test: Draw Prediction Confidence',
      description: 'Model confidence analysis for DRAW predictions on unseen test data. Critical for understanding prediction uncertainty.',
      category: 'test',
      outcome: 'draw'
    },
    {
      name: `${league}_test_loss_confidence_metrics.png`,
      title: 'Test: Away Win Prediction Confidence',
      description: 'Model confidence analysis for AWAY WIN predictions on unseen test data.',
      category: 'test',
      outcome: 'loss'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">Model Performance Metrics</h2>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
          Comprehensive analysis of the machine learning model trained on {league.replace('_', ' ').toUpperCase()} match data. 
          These visualizations show prediction accuracy, feature importance, and model confidence levels.
        </p>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mt-4"></div>
      </div>

      {/* Main Performance Metrics */}
      <div>
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white">Model Performance Analysis</h3>
          <div className="w-24 h-1 bg-blue-500 mx-auto mt-3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {modelVisualizationImages.map((image) => {
            const imageUrl = `/api/visualizations/${league}/${image.name}`;
            
            return (
              <div 
                key={image.name} 
                className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700 
                         flex flex-col transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-blue-500/20 hover:border-blue-500/50"
              >
                <h4 className="text-xl font-bold mb-4 text-center text-white">{image.title}</h4>
                <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg p-4 mb-4">
                  <img 
                    src={imageUrl} 
                    alt={image.title} 
                    className="max-w-full h-auto object-contain rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-chart.png';
                    }}
                  />
                </div>
                <p className="text-sm text-gray-400 text-center leading-relaxed">{image.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-6 py-2 bg-gray-900 text-gray-400 font-semibold rounded-full border border-gray-700">
            Classification Reports
          </span>
        </div>
      </div>

      {/* Classification Reports */}
      <div>
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white">Detailed Classification Metrics</h3>
          <div className="w-24 h-1 bg-green-500 mx-auto mt-3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {classificationReportImages.map((image) => {
            const imageUrl = `/api/visualizations/${league}/${image.name}`;
            const bgGradient = image.category === 'train' 
              ? 'from-green-900/20 to-gray-900' 
              : 'from-blue-900/20 to-gray-900';
            const borderColor = image.category === 'train'
              ? 'border-green-500/30 hover:border-green-500/60'
              : 'border-blue-500/30 hover:border-blue-500/60';
            
            return (
              <div 
                key={image.name} 
                className={`bg-gradient-to-br ${bgGradient} p-8 rounded-2xl shadow-2xl border ${borderColor}
                         flex flex-col transition-all duration-300 ease-in-out hover:scale-102 hover:shadow-xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-2xl font-bold text-white">{image.title}</h4>
                  <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    image.category === 'train' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {image.category.toUpperCase()}
                  </span>
                </div>
                <div className="flex-grow flex items-center justify-center bg-gray-900/70 rounded-xl p-6 mb-6">
                  <img 
                    src={imageUrl} 
                    alt={image.title} 
                    className="max-w-full h-auto object-contain rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-chart.png';
                    }}
                  />
                </div>
                <p className="text-base text-gray-400 leading-relaxed">{image.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-6 py-2 bg-gray-900 text-gray-400 font-semibold rounded-full border border-gray-700">
            Confidence Threshold Analysis
          </span>
        </div>
      </div>

      {/* Confidence Threshold Visualizations */}
      <div>
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white">Prediction Confidence Analysis</h3>
          <p className="text-gray-400 mt-2 max-w-3xl mx-auto">
            These charts show how model performance (precision, recall, F1-score) changes at different confidence thresholds. 
            Higher confidence means more reliable predictions but fewer total predictions.
          </p>
          <div className="w-24 h-1 bg-purple-500 mx-auto mt-3"></div>
        </div>
        
        {/* Training Set Confidence */}
        <div className="mb-12">
          <h4 className="text-2xl font-bold text-green-400 text-center mb-6">Training Set Confidence Metrics</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {confidenceThresholdImages.filter(img => img.category === 'train').map((image) => {
              const imageUrl = `/api/visualizations/${league}/${image.name}`;
              const outcomeColor = 
                image.outcome === 'win' ? 'from-green-500/10 to-transparent' :
                image.outcome === 'draw' ? 'from-yellow-500/10 to-transparent' :
                'from-red-500/10 to-transparent';
              
              return (
                <div 
                  key={image.name} 
                  className={`bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-xl border border-gray-700
                           flex flex-col transition-all duration-300 ease-in-out hover:scale-105 hover:border-green-500/50`}
                >
                  <h5 className="text-lg font-bold text-white mb-4 text-center">{image.title}</h5>
                  <div className={`flex-grow flex items-center justify-center bg-gradient-to-br ${outcomeColor} rounded-lg p-4 mb-4`}>
                    <img 
                      src={imageUrl} 
                      alt={image.title} 
                      className="max-w-full h-auto object-contain rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-chart.png';
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center leading-relaxed">{image.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Set Confidence */}
        <div>
          <h4 className="text-2xl font-bold text-blue-400 text-center mb-6">Test Set Confidence Metrics (Real-World Performance)</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {confidenceThresholdImages.filter(img => img.category === 'test').map((image) => {
              const imageUrl = `/api/visualizations/${league}/${image.name}`;
              const outcomeColor = 
                image.outcome === 'win' ? 'from-green-500/10 to-transparent' :
                image.outcome === 'draw' ? 'from-yellow-500/10 to-transparent' :
                'from-red-500/10 to-transparent';
              
              return (
                <div 
                  key={image.name} 
                  className={`bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-xl border border-gray-700
                           flex flex-col transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-500/50`}
                >
                  <h5 className="text-lg font-bold text-white mb-4 text-center">{image.title}</h5>
                  <div className={`flex-grow flex items-center justify-center bg-gradient-to-br ${outcomeColor} rounded-lg p-4 mb-4`}>
                    <img 
                      src={imageUrl} 
                      alt={image.title} 
                      className="max-w-full h-auto object-contain rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-chart.png';
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center leading-relaxed">{image.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">Note:</span> These visualizations are generated during model training and updated with each retraining cycle. 
          The model emphasizes data from the last 10 seasons with exponential weighting towards recent years for improved accuracy.
        </p>
      </div>
    </div>
  );
};

export default MLMetricsVisualizations;
