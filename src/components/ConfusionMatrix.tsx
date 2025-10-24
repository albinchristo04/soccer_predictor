'use client'

export function ConfusionMatrix({ league }: { league: string }) {
  const imageUrl = `/api/analytics/image?league=${league}&image_name=${league}_confusion_matrix.png`

  return (
    <div className="bg-secondary p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Confusion Matrix</h2>
      <img src={imageUrl} alt={`${league} confusion matrix`} className="w-full h-auto" />
    </div>
  )
}
