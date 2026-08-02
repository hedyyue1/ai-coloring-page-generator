'use client'

import { useState } from 'react'
import { RefreshCcw } from 'lucide-react'

function ColoredScene() {
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Stylized authorized family photo illustration">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9cc9e8" />
          <stop offset="58%" stopColor="#f5c9d8" />
          <stop offset="100%" stopColor="#ffe0b3" />
        </linearGradient>
        <linearGradient id="hill" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6fc2a3" />
          <stop offset="100%" stopColor="#31876f" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#sky)" />
      <circle cx="506" cy="88" r="46" fill="#ffc857" />
      <path d="M0 254c96-76 174-85 260-29 83 54 150 41 228-17 58-43 106-37 152-3v215H0Z" fill="url(#hill)" />
      <path d="M0 307c104-42 188-39 270 8 82 46 173 40 276-18 38-21 69-24 94-12v135H0Z" fill="#2f6f61" />
      <path d="M158 220 282 116l126 104v132H158Z" fill="#fff7ea" />
      <path d="M137 224 282 106l147 118" fill="none" stroke="#c94f6d" strokeWidth="24" strokeLinecap="round" />
      <path d="M250 352v-92h66v92" fill="#8a5cf6" />
      <path d="M184 254h42v42h-42zM338 254h42v42h-42z" fill="#9cc9e8" />
      <path d="M420 318c44-48 90-48 126 0" fill="none" stroke="#ffd166" strokeWidth="18" strokeLinecap="round" />
      <path d="M92 344c34-28 69-28 104 0" fill="none" stroke="#ffd166" strokeWidth="18" strokeLinecap="round" />
      <path d="M472 236c-4-52 20-86 66-102 10 55-12 89-66 102Z" fill="#4fb286" />
      <path d="M506 236c20-42 52-58 98-48-16 46-48 62-98 48Z" fill="#3d9973" />
      <path d="M491 236v104" stroke="#7c4a2d" strokeWidth="16" strokeLinecap="round" />
      <path d="M76 378c114-26 220-26 318 0s142 22 194-4" fill="none" stroke="#f8cdd7" strokeWidth="12" strokeLinecap="round" />
    </svg>
  )
}

function LineScene() {
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Coloring page line art result">
      <rect width="640" height="420" fill="#fff" />
      <g fill="none" stroke="#151827" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9">
        <circle cx="506" cy="88" r="46" />
        <path d="M506 12v22M506 142v22M430 88h22M560 88h22M452 34l15 15M545 127l15 15M560 34l-15 15M467 127l-15 15" />
        <path d="M0 254c96-76 174-85 260-29 83 54 150 41 228-17 58-43 106-37 152-3" />
        <path d="M0 307c104-42 188-39 270 8 82 46 173 40 276-18 38-21 69-24 94-12" />
        <path d="M158 220 282 116l126 104v132H158Z" />
        <path d="M137 224 282 106l147 118" />
        <path d="M250 352v-92h66v92M266 260v92M250 306h66" />
        <path d="M184 254h42v42h-42zM205 254v42M184 275h42M338 254h42v42h-42zM359 254v42M338 275h42" />
        <path d="M420 318c44-48 90-48 126 0M92 344c34-28 69-28 104 0" />
        <path d="M472 236c-4-52 20-86 66-102 10 55-12 89-66 102Z" />
        <path d="M506 236c20-42 52-58 98-48-16 46-48 62-98 48Z" />
        <path d="M491 236v104M472 286h38" />
        <path d="M76 378c114-26 220-26 318 0s142 22 194-4" />
      </g>
    </svg>
  )
}

export default function ComparisonCard() {
  const [compare, setCompare] = useState(52)

  return (
    <article className="comparison-card" aria-label="Interactive photo to coloring page comparison">
      <div className="comparison-stage">
        <div className="scene-layer"><ColoredScene /></div>
        <div className="scene-layer line-layer" style={{ clipPath: `inset(0 0 0 ${compare}%)` }}>
          <LineScene />
        </div>
        <div className="comparison-divider" style={{ left: `${compare}%` }}>
          <span><RefreshCcw size={17} /></span>
        </div>
        <span className="scene-label photo-label">Authorized photo</span>
        <span className="scene-label line-label">Standard page</span>
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
