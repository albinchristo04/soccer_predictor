'use client'

import { useState } from 'react'

interface AccordionItemProps {

  title: string

  children: React.ReactNode

  isOpen: boolean

  onToggle: () => void

}



const AccordionItem = ({ title, children, isOpen, onToggle }: AccordionItemProps) => {

  return (

    <div className="border-b border-gray-300 dark:border-gray-600">

      <button

        className="w-full py-4 text-left flex justify-between items-center focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg px-2"

        onClick={onToggle}

      >

        <span className="text-lg font-medium text-gray-800 dark:text-gray-200">{title}</span>

        <span className={`transform transition-transform duration-300 text-2xl text-green-600 dark:text-green-400 ${isOpen ? 'rotate-45' : ''}`}>

          +

        </span>

      </button>

      <div

        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>

        <div className="py-4 text-gray-700 dark:text-gray-300 px-2">

          {children}

        </div>

      </div>

    </div>

  )

}

export default function AboutPage() {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]))

  const toggleSection = (index: number) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const sections = [
    {
      title: "What is Soccer Stats Predictor?",
      content: `Soccer Stats Predictor is an AI-powered tool that predicts the outcomes of soccer matches using machine learning. 
      Our system analyzes historical data from over 150,000 matches across 9 major leagues and competitions to provide accurate 
      win/draw/loss probabilities and predicted scorelines. The tool supports head-to-head predictions within leagues and 
      cross-league comparisons, helping you understand potential match outcomes based on data-driven insights.`
    },
    {
      title: "Key Features",
      content: `
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Match Outcome Predictions:</strong> Get win/draw/loss probabilities for any matchup</li>
          <li><strong>Predicted Scorelines:</strong> See the estimated final score based on team performance patterns</li>
          <li><strong>Upcoming Matches:</strong> View predictions for scheduled matches with a convenient week/day calendar view</li>
          <li><strong>Cross-League Predictions:</strong> Compare teams from different leagues (e.g., Man City vs Real Madrid)</li>
          <li><strong>Analytics Dashboard:</strong> Explore model performance metrics, confidence thresholds, and feature importance</li>
          <li><strong>9 Major Leagues:</strong> Premier League, La Liga, Serie A, Bundesliga, Ligue 1, MLS, UCL, UEL, and FIFA World Cup</li>
        </ul>
      `
    },
    {
      title: "About the Model",
      content: `Our prediction system uses a Random Forest Classifier with 400 decision trees, trained on comprehensive historical 
      match data dating back decades (Premier League data goes back to 1888!). The model uses all available historical data 
      with exponential weighting favoring recent seasons (last 5 seasons weighted 1.5x-3.0x) to capture current trends while 
      maintaining historical context. Key features include team form metrics (goals scored/conceded, win rates), attendance, 
      and head-to-head performance. The model is trained separately for each league to capture league-specific dynamics.`
    },
    {
      title: "Scoreline Prediction",
      content: `In addition to match outcomes, we predict the final scoreline by analyzing each team's recent scoring and conceding 
      patterns from the last 2 seasons. The scoreline is adjusted based on the predicted outcome - if a team is likely to win, 
      their predicted goals are boosted while the opponent's are reduced. This provides a realistic estimate of not just who will 
      win, but by approximately what margin.`
    },
    {
      title: "Model Performance",
      content: `The model achieves approximately 50-70% accuracy across different leagues (varies by league), significantly better 
      than random chance (33%) for three-way football predictions. Premier League accuracy is around 52%, while competitions like 
      the World Cup achieve up to 70% on test data. Our analytics page provides detailed confidence threshold analysis showing 
      precision/recall trade-offs at different confidence levels, helping you understand when the model is most reliable.`
    },
    {
      title: "Training Approach",
      content: `Models are trained using ALL historical data (excluding the current season 2025-2026) with custom sample weighting:
        <ul class="list-disc pl-6 space-y-2 mt-2">
          <li>Last 5 seasons (2020-2024): 2.06x average weight to emphasize recent trends</li>
          <li>Older seasons: 0.67x average weight to maintain historical context</li>
          <li>Custom class weights (Win: 1.2, Draw: 0.6, Loss: 1.2) to combat draw bias</li>
          <li>400 estimators with max depth 20 for robust prediction</li>
        </ul>
      `
    },
    {
      title: "Data Sources",
      content: `Match data is sourced from <a href="https://fbref.com/en/" target="_blank" rel="noopener noreferrer" class="text-green-400 hover:underline">FBRef</a>, one of the most comprehensive football statistics 
      databases. Our dataset includes over 150,000 historical matches with detailed statistics including goals, attendance, 
      team form metrics, and match outcomes. All data usage complies with FBRef's terms of service. Data is regularly updated 
      to include the latest matches while excluding ongoing fixtures to prevent data leakage.`
    },
    {
      title: "How to Use",
      content: `
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Predict:</strong> Select a league and two teams for head-to-head predictions, or choose teams from different leagues for cross-league comparisons</li>
          <li><strong>Upcoming Matches:</strong> Browse scheduled fixtures with automatic predictions - toggle between week view and detailed day view</li>
          <li><strong>Analytics:</strong> Explore model performance metrics including confusion matrices, feature importance, prediction distributions, and confidence threshold analysis</li>
        </ul>
      `
    },
    {
      title: "Limitations & Responsible Use",
      content: `While our model provides data-driven insights, soccer matches are inherently unpredictable. The predictions cannot 
      account for real-time factors such as:
        <ul class="list-disc pl-6 space-y-1 mt-2">
          <li>Player injuries or suspensions</li>
          <li>Weather conditions</li>
          <li>Team morale and motivation</li>
          <li>Tactical changes or lineup rotations</li>
          <li>Referee decisions or red cards</li>
        </ul>
        <p class="mt-3 font-semibold">This tool is for educational and entertainment purposes only. Do not use predictions for betting or financial decisions.</p>
      `
    },
    {
      title: "Legal Disclaimer",
      content: `This tool is provided for educational and entertainment purposes only. The predictions are based on historical 
      data and statistical models, and should not be interpreted as guarantees of future results. The developers accept no 
      responsibility for any losses incurred from using these predictions for gambling or betting purposes. Always gamble 
      responsibly and be aware of your local gambling laws and regulations. If you or someone you know has a gambling problem, 
      please seek help from organizations like the National Council on Problem Gambling (1-800-522-4700).`
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-800 dark:text-white sm:text-6xl md:text-7xl">About Soccer Stats Predictor</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Learn more about the project, the data, and the models behind the predictions.
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700">
          {sections.map((section, index) => (
            <AccordionItem
              key={index}
              title={section.title}
              isOpen={openSections.has(index)}
              onToggle={() => toggleSection(index)}
            >
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </AccordionItem>
          ))}
        </div>
      </div>
    </div>
  )
}