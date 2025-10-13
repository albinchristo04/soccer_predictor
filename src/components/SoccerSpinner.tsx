'use client'

import Image from 'next/image'

export const SoccerSpinner = () => {
  return (
    <div className="flex justify-center items-center">
      <Image
        src="/soccer-ball.png"
        alt="Loading..."
        width={50}
        height={50}
        className="animate-spin"
      />
    </div>
  )
}
