import React from 'react';

interface MLMetricsVisualizationsProps {
  league: string;
}

const imageNames = [
  '_train_win_confidence_metrics.png',
  '_train_draw_confidence_metrics.png',
  '_train_loss_confidence_metrics.png',
  '_test_win_confidence_metrics.png',
  '_test_draw_confidence_metrics.png',
  '_test_loss_confidence_metrics.png',
];

const MLMetricsVisualizations: React.FC<MLMetricsVisualizationsProps> = ({ league }) => {
  if (!league) {
    return null;
  }

  const trainImageNames = [
    '_train_win_confidence_metrics.png',
    '_train_draw_confidence_metrics.png',
    '_train_loss_confidence_metrics.png',
  ];

  const testImageNames = [
    '_test_win_confidence_metrics.png',
    '_test_draw_confidence_metrics.png',
    '_test_loss_confidence_metrics.png',
  ];

  const descriptions: Record<string, string> = {
    '_train_win_confidence_metrics.png': 'This plot shows the confidence levels for predicting a win in the training set. It helps to understand how well the model distinguishes between high and low confidence predictions for wins.',
    '_train_draw_confidence_metrics.png': 'This plot shows the confidence levels for predicting a draw in the training set. Draws are often harder to predict, so this metric is crucial for understanding model performance.',
    '_train_loss_confidence_metrics.png': 'This plot shows the confidence levels for predicting a loss in the training set. It provides insights into the model\'s ability to identify likely losses.',
    '_test_win_confidence_metrics.png': 'This plot shows the confidence levels for predicting a win in the test set. It evaluates the model\'s performance on unseen data for win predictions.',
    '_test_draw_confidence_metrics.png': 'This plot shows the confidence levels for predicting a draw in the test set. It is a key indicator of the model\'s real-world performance for draw predictions.',
    '_test_loss_confidence_metrics.png': 'This plot shows the confidence levels for predicting a loss in the test set. It helps to assess the model\'s generalization capability for loss predictions.'
  };

  return (
    <div className="space-y-12 px-4">
      <div>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Training Set Metrics</h2>
          <div className="w-24 h-1 bg-green-500 mx-auto mt-2"></div>
        </div>
        <div className="flex justify-center gap-8">
          {trainImageNames.map((imageName) => {
            const fullImageName = `${league}${imageName}`;
            const imageUrl = `/api/visualizations/${league}/${fullImageName}`;
            const title = imageName.replace(/_|-/g, ' ').replace('.png', '').trim();
            const description = descriptions[imageName];

            return (
              <div key={fullImageName} className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 flex flex-col items-center transition-transform duration-300 ease-in-out hover:scale-110 hover:z-10 w-1/3 flex-shrink-0">
                <h3 className="text-xl font-semibold mb-3 text-center capitalize">{title}</h3>
                <img src={imageUrl} alt={title} className="max-w-full h-auto object-contain rounded-md mb-4" />
                <p className="text-base text-gray-400 text-center">{description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-700 my-12"></div>

      <div>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Test Set Metrics</h2>
          <div className="w-24 h-1 bg-green-500 mx-auto mt-2"></div>
        </div>
        <div className="flex justify-center gap-8">
          {testImageNames.map((imageName) => {
            const fullImageName = `${league}${imageName}`;
            const imageUrl = `/api/visualizations/${league}/${fullImageName}`;
            const title = imageName.replace(/_|-/g, ' ').replace('.png', '').trim();
            const description = descriptions[imageName];

            return (
              <div key={fullImageName} className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 flex flex-col items-center transition-transform duration-300 ease-in-out hover:scale-110 hover:z-10 w-1/3 flex-shrink-0">
                <h3 className="text-xl font-semibold mb-3 text-center capitalize">{title}</h3>
                <img src={imageUrl} alt={title} className="max-w-full h-auto object-contain rounded-md mb-4" />
                <p className="text-base text-gray-400 text-center">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MLMetricsVisualizations;
