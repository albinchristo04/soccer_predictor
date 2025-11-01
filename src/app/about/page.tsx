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

    <div className="border-b border-gray-700">

      <button

        className="w-full py-4 text-left flex justify-between items-center focus:outline-none"

        onClick={onToggle}

      >

        <span className="text-lg font-medium text-white">{title}</span>

        <span className={`transform transition-transform duration-300 text-2xl ${isOpen ? 'rotate-45' : ''}`}>

          +

        </span>

      </button>

      <div

        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>

        <div className="py-4 text-gray-300">

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
      title: "About the Model",
      content: `Our prediction system uses a Random Forest model trained on extensive historical match data. 
      The model considers various factors including recent form, head-to-head records, goal-scoring patterns, 
      and team strengths. Random Forest was chosen for its ability to handle complex interactions between 
      features and provide probability estimates for match outcomes.`
    },
    {
      title: "Model Performance",
      content: `The model achieves approximately 60-65% accuracy in predicting match outcomes, which is 
      significantly better than random chance (33%) for three-way football predictions. However, it's important 
      to note that football matches are inherently unpredictable, and many factors (injuries, weather, 
      team selection) cannot be accounted for in historical data.`
    },
    {
      title: "Data Sources",
      content: `Match data is sourced from <a href="https://fbref.com/en/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">FBRef</a>, one of the most comprehensive football statistics 
      databases. The data includes detailed match statistics, team performance metrics, and historical 
      results from major European leagues. All data usage complies with <a href="https://fbref.com/en/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">FBRef</a>'s terms of service.`
    },
    {
      title: "Limitations",
      content: `The predictions are based purely on historical data and statistical patterns. They cannot 
      account for real-time factors such as injuries, weather conditions, or team morale. The model also 
      has limited data for newly promoted teams and cross-league predictions rely on indirect comparisons.`
    },
    {
      title: "Legal Disclaimer",
      content: `This tool is provided for educational and entertainment purposes only. The predictions 
      should not be used for betting or financial decisions. The developers accept no responsibility for 
      any losses incurred from using these predictions for gambling purposes. Always gamble responsibly 
      and be aware of your local gambling laws and regulations.`
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-white sm:text-6xl md:text-7xl">About Soccer Stats Predictor</h1>
        <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
          Learn more about the project, the data, and the models behind the predictions.
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 p-8 rounded-xl shadow-2xl">
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