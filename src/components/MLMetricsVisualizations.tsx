import React from 'react';
import { ImageModal } from './ImageModal';

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
    <div className="space-y-16 bg-gradient-to-br from-green-50 via-blue-50 to-white p-8 rounded-3xl relative overflow-hidden">
      {/* Soccer-themed background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-8xl">⚽</div>
        <div className="absolute top-40 right-20 text-6xl">🏆</div>
        <div className="absolute bottom-20 left-1/4 text-7xl">⚽</div>
        <div className="absolute top-1/3 right-1/3 text-9xl">⚽</div>
        <div className="absolute bottom-10 right-10 text-6xl">🥅</div>
        <div className="absolute top-1/2 left-10 text-5xl">🏟️</div>
      </div>

      {/* Header */}
      <div className="text-center relative z-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-5xl">📊</span>
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
            Model Performance Metrics
          </h2>
          <span className="text-5xl">📊</span>
        </div>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto font-medium">
          Comprehensive analysis of the machine learning model trained on <span className="font-bold text-green-600">{league.replace('_', ' ').toUpperCase()}</span> match data. 
          These visualizations show prediction accuracy, feature importance, and model confidence levels.
        </p>
        <div className="w-48 h-1.5 bg-gradient-to-r from-green-500 via-blue-500 to-green-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Main Performance Metrics */}
      <div className="relative z-10">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <span className="text-4xl">🎯</span>
            Model Performance Analysis
            <span className="text-4xl">🎯</span>
          </h3>
          <div className="w-32 h-1 bg-green-500 mx-auto mt-3 rounded-full"></div>
        </div>
        
        {/* First Row: Confusion Matrix and Feature Importance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {modelVisualizationImages.slice(0, 2).map((image) => {
            const imageUrl = `/api/visualizations/${league}/${image.name}`;
            
            return (
              <div 
                key={image.name} 
                className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-200 
                         flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-green-400"
                style={{ minHeight: '600px' }}
              >
                <h4 className="text-2xl font-bold mb-6 text-center text-gray-800">{image.title}</h4>
                <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <ImageModal
                    src={imageUrl}
                    alt={image.title}
                    title={image.title}
                    description={image.description}
                  />
                </div>
                <p className="text-base text-gray-600 text-center leading-relaxed">{image.description}</p>
              </div>
            );
          })}
        </div>

        {/* Second Row: Prediction Distribution (Centered) */}
        {modelVisualizationImages.slice(2).map((image) => {
          const imageUrl = `/api/visualizations/${league}/${image.name}`;
          
          return (
            <div key={image.name} className="flex justify-center">
              <div 
                className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-200 
                         flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-green-400 w-full lg:w-2/3"
                style={{ minHeight: '600px' }}
              >
                <h4 className="text-2xl font-bold mb-6 text-center text-gray-800">{image.title}</h4>
                <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <ImageModal
                    src={imageUrl}
                    alt={image.title}
                    title={image.title}
                    description={image.description}
                  />
                </div>
                <p className="text-base text-gray-600 text-center leading-relaxed">{image.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="relative z-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-green-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-full shadow-lg">
            📋 Classification Reports
          </span>
        </div>
      </div>

      {/* Classification Reports */}
      <div className="relative z-10">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <span className="text-4xl">📈</span>
            Detailed Classification Metrics
            <span className="text-4xl">📈</span>
          </h3>
          <div className="w-32 h-1 bg-blue-500 mx-auto mt-3 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {classificationReportImages.map((image) => {
            const imageUrl = `/api/visualizations/${league}/${image.name}`;
            const bgGradient = image.category === 'train' 
              ? 'from-green-50 to-white' 
              : 'from-blue-50 to-white';
            const borderColor = image.category === 'train'
              ? 'border-green-300 hover:border-green-500'
              : 'border-blue-300 hover:border-blue-500';
            const badgeColor = image.category === 'train'
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white';
            
            return (
              <div 
                key={image.name} 
                className={`bg-gradient-to-br ${bgGradient} p-8 rounded-2xl shadow-xl border-2 ${borderColor}
                         flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl h-full`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-2xl font-bold text-gray-800">{image.title}</h4>
                  <span className={`px-3 py-1 ${badgeColor} rounded-full text-sm font-semibold`}>
                    {image.category === 'train' ? 'Training' : 'Testing'}
                  </span>
                </div>
                <div className="flex-grow flex items-center justify-center bg-white rounded-lg p-6 mb-6 border border-gray-200">
                  <ImageModal
                    src={imageUrl}
                    alt={image.title}
                    title={image.title}
                    description={image.description}
                  />
                </div>
                <p className="text-base text-gray-600 leading-relaxed">{image.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-blue-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full shadow-lg">
            🎚️ Confidence Threshold Analysis
          </span>
        </div>
      </div>

      {/* Confidence Threshold Visualizations */}
      <div className="relative z-10">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <span className="text-4xl">🎯</span>
            Prediction Confidence Analysis
            <span className="text-4xl">🎯</span>
          </h3>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto font-medium">
            These charts show how model performance (precision, recall, F1-score) changes at different confidence thresholds. 
            Higher confidence means more reliable predictions but fewer total predictions.
          </p>
          <div className="w-32 h-1 bg-purple-500 mx-auto mt-3 rounded-full"></div>
        </div>
        
        {/* Training Set Confidence */}
        <div className="mb-12">
          <h4 className="text-2xl font-bold text-green-600 text-center mb-6 flex items-center justify-center gap-2">
            <span className="text-3xl">🏋️</span>
            Training Set Confidence Metrics
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {confidenceThresholdImages.filter(img => img.category === 'train').map((image) => {
              const imageUrl = `/api/visualizations/${league}/${image.name}`;
              const outcomeColor = 
                image.outcome === 'win' ? 'from-green-100 to-white' :
                image.outcome === 'draw' ? 'from-yellow-100 to-white' :
                'from-red-100 to-white';
              const borderColor = 
                image.outcome === 'win' ? 'border-green-300 hover:border-green-500' :
                image.outcome === 'draw' ? 'border-yellow-300 hover:border-yellow-500' :
                'from-red-300 hover:border-red-500';
              
              return (
                <div 
                  key={image.name} 
                  className={`bg-gradient-to-br ${outcomeColor} p-6 rounded-xl shadow-xl border-2 border-gray-200
                           flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:${borderColor}`}
                  style={{ minHeight: '500px' }}
                >
                  <h5 className="text-lg font-bold text-gray-800 mb-4 text-center">{image.title}</h5>
                  <div className="flex-grow flex items-center justify-center bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <ImageModal
                      src={imageUrl}
                      alt={image.title}
                      title={image.title}
                      description={image.description}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center leading-relaxed">{image.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Set Confidence */}
        <div>
          <h4 className="text-2xl font-bold text-blue-600 text-center mb-6 flex items-center justify-center gap-2">
            <span className="text-3xl">🧪</span>
            Test Set Confidence Metrics (Real-World Performance)
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {confidenceThresholdImages.filter(img => img.category === 'test').map((image) => {
              const imageUrl = `/api/visualizations/${league}/${image.name}`;
              const outcomeColor = 
                image.outcome === 'win' ? 'from-green-100 to-white' :
                image.outcome === 'draw' ? 'from-yellow-100 to-white' :
                'from-red-100 to-white';
              const borderColor = 
                image.outcome === 'win' ? 'border-green-300 hover:border-green-500' :
                image.outcome === 'draw' ? 'border-yellow-300 hover:border-yellow-500' :
                'border-red-300 hover:border-red-500';
              
              return (
                <div 
                  key={image.name} 
                  className={`bg-gradient-to-br ${outcomeColor} p-6 rounded-xl shadow-xl border-2 border-gray-200
                           flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:${borderColor}`}
                  style={{ minHeight: '500px' }}
                >
                  <h5 className="text-lg font-bold text-gray-800 mb-4 text-center">{image.title}</h5>
                  <div className="flex-grow flex items-center justify-center bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <ImageModal
                      src={imageUrl}
                      alt={image.title}
                      title={image.title}
                      description={image.description}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center leading-relaxed">{image.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-white/80 border-2 border-gray-300 rounded-xl p-6 text-center shadow-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-green-600">⚽ Note:</span> These visualizations are generated during model training and updated with each retraining cycle. 
          The model emphasizes data from the last 5 seasons with exponential weighting towards recent years for improved accuracy.
        </p>
      </div>
    </div>
  );
};

export default MLMetricsVisualizations;
