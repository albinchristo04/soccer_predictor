'use client'

export function TestClassificationReport({ league }: { league: string }) {
  const imageUrl = `/api/analytics/image?league=${league}&image_name=${league}_test_classification_report.png`

  return (
    <div className="bg-secondary p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Test Classification Report</h2>
      <img src={imageUrl} alt={`${league} test classification report`} className="w-full h-auto" />
    </div>
  )
}
