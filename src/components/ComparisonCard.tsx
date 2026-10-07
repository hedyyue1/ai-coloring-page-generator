'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronsLeftRight } from 'lucide-react'

type ComparisonCardProps = {
  colorSrc?: string
  lineSrc?: string
  alt?: string
}

export default function ComparisonCard({
  colorSrc = '/examples/cottage-color.jpg',
  lineSrc = '/examples/cottage-line.jpg',
  alt = 'Interactive comparison of a colorful garden cottage illustration and its printable line-art version',
}: ComparisonCardProps) {
  const [compare, setCompare] = useState(52)

  return (
    <article className="comparison-card" aria-label="Interactive photo to coloring page comparison">
      <div className="comparison-stage">
        <div className="scene-layer">
          <Image src={colorSrc} alt={alt} fill sizes="(max-width: 900px) 100vw, 46vw" priority />
        </div>
        <div className="scene-layer line-layer" style={{ clipPath: `inset(0 0 0 ${compare}%)` }}>
          <Image src={lineSrc} alt="" fill sizes="(max-width: 900px) 100vw, 46vw" priority />
        </div>
        <div className="comparison-divider" style={{ left: `${compare}%` }}>
          <span><ChevronsLeftRight size={18} /></span>
        </div>
        <span className="scene-label photo-label">Color reference</span>
        <span className="scene-label line-label">Line art</span>
      </div>
      <div className="comparison-control">
        <span>Photo</span>
        <input
          aria-label="Compare photo and coloring page"
          type="range"
          min="18"
          max="82"
          value={compare}
          onChange={(event) => setCompare(Number(event.target.value))}
        />
        <span>Line art</span>
      </div>
    </article>
  )
}
