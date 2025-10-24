'use client'

export function FeatureImportance({ league }: { league: string }) {
  const imageUrl = `/api/analytics/image?league=${league}&image_name=${league}_feature_importance.png`

  return (
    <div className="bg-secondary p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Feature Importance</h2>
      <img src={imageUrl} alt={`${league} feature importance`} className="w-full h-auto" />
    </div>
  )
}
