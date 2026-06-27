import React from 'react';

// 1. Cute Educational Owl Mascot - OLM Theme
export const OwlMascot = ({ className = "w-32 h-32", pose = "happy" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="owlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4cd988" />
        <stop offset="100%" stopColor="#00a651" />
      </linearGradient>
      <linearGradient id="owlBellyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e8f5e9" />
      </linearGradient>
      <filter id="owlGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#00a651" floodOpacity="0.2" />
      </filter>
    </defs>
    
    {/* Shadow */}
    <ellipse cx="100" cy="178" rx="55" ry="10" fill="#cbd5e1" opacity="0.5" />
    
    {/* Wings */}
    <ellipse cx="45" cy="115" rx="18" ry="32" fill="#008741" transform="rotate(-15 45 115)" />
    <ellipse cx="155" cy="115" rx="18" ry="32" fill="#008741" transform="rotate(15 155 115)" />
    
    {/* Body */}
    <rect x="42" y="38" width="116" height="130" rx="48" fill="url(#owlGrad)" filter="url(#owlGlow)" />
    
    {/* Ears/Tufts */}
    <path d="M 42 60 L 35 30 L 70 45" fill="#008741" strokeLinejoin="round" />
    <path d="M 158 60 L 165 30 L 130 45" fill="#008741" strokeLinejoin="round" />
    
    {/* Belly */}
    <ellipse cx="100" cy="128" rx="38" ry="32" fill="url(#owlBellyGrad)" />
    {/* Belly Feathers pattern */}
    <path d="M 90 115 Q 100 123 110 115" fill="none" stroke="#81c784" strokeWidth="3" strokeLinecap="round" />
    <path d="M 82 130 Q 100 140 118 130" fill="none" stroke="#81c784" strokeWidth="3" strokeLinecap="round" />
    <path d="M 90 145 Q 100 153 110 145" fill="none" stroke="#81c784" strokeWidth="3" strokeLinecap="round" />

    {/* Big Eye Patches */}
    <circle cx="72" cy="85" r="25" fill="#ffffff" />
    <circle cx="128" cy="85" r="25" fill="#ffffff" />
    
    {/* Glasses frame */}
    <circle cx="72" cy="85" r="25" fill="none" stroke="#2c3e50" strokeWidth="5.5" />
    <circle cx="128" cy="85" r="25" fill="none" stroke="#2c3e50" strokeWidth="5.5" />
    <line x1="97" y1="85" x2="103" y2="85" stroke="#2c3e50" strokeWidth="5.5" strokeLinecap="round" />
    
    {/* Pupils */}
    <g fill="#2c3e50">
      {pose === "happy" ? (
        <>
          <path d="M 64 85 Q 72 75 80 85" fill="none" stroke="#2c3e50" strokeWidth="6" strokeLinecap="round" />
          <path d="M 120 85 Q 128 75 136 85" fill="none" stroke="#2c3e50" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="72" cy="85" r="10" />
          <circle cx="128" cy="85" r="10" />
          <circle cx="69" cy="82" r="3.5" fill="#ffffff" />
          <circle cx="125" cy="82" r="3.5" fill="#ffffff" />
        </>
      )}
    </g>

    {/* Cute Beak */}
    <polygon points="100,94 92,106 108,106" fill="#ff9800" stroke="#f57c00" strokeWidth="1" strokeLinejoin="round" />

    {/* Feet */}
    <circle cx="78" cy="170" r="10" fill="#ff9800" />
    <circle cx="122" cy="170" r="10" fill="#ff9800" />
  </svg>
);

// 2. Cute Star Mascot - Representative of Achievements and Ranks
export const StarMascot = ({ className = "w-32 h-32", pose = "happy" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff176" />
        <stop offset="100%" stopColor="#ffb300" />
      </linearGradient>
      <filter id="starGlow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#ffb300" floodOpacity="0.3" />
      </filter>
    </defs>
    
    {/* Shadow */}
    <ellipse cx="100" cy="175" rx="50" ry="8" fill="#cbd5e1" opacity="0.5" />
    
    {/* Star Body */}
    <path 
      d="M 100 20 
         L 124 70 
         L 178 78 
         L 138 116 
         L 148 170 
         L 100 144 
         L 52 170 
         L 62 116 
         L 22 78 
         L 76 70 
         Z" 
      fill="url(#starGrad)" 
      filter="url(#starGlow)"
      stroke="#ff9800"
      strokeWidth="3"
      strokeLinejoin="round" 
    />
    
    {/* Cute Cheeks */}
    <ellipse cx="70" cy="110" rx="8" ry="5" fill="#ff8a65" opacity="0.6" />
    <ellipse cx="130" cy="110" rx="8" ry="5" fill="#ff8a65" opacity="0.6" />
    
    {/* Eyes */}
    <g fill="#2c3e50">
      <circle cx="78" cy="98" r="6" />
      <circle cx="122" cy="98" r="6" />
      <circle cx="76" cy="96" r="2" fill="#ffffff" />
      <circle cx="120" cy="96" r="2" fill="#ffffff" />
    </g>
    
    {/* Smile */}
    <path d="M 92 112 Q 100 124 108 112" fill="none" stroke="#2c3e50" strokeWidth="4.5" strokeLinecap="round" />
    
    {/* Little Blue Pencil (holding in hand) */}
    {pose === "happy" && (
      <g transform="translate(142, 110) rotate(25)">
        <rect x="0" y="0" width="10" height="24" rx="2" fill="#2196f3" />
        <polygon points="0,0 5,-8 10,0" fill="#ffe0b2" />
        <polygon points="3,-5 5,-8 7,-5" fill="#2c3e50" />
        <rect x="0" y="20" width="10" height="4" fill="#e74c3c" />
      </g>
    )}
  </svg>
);

// 3. Cute Cartoon Book Mascot - Representative of Lessons and Study
export const BookMascot = ({ className = "w-32 h-32", pose = "happy" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4fc3f7" />
        <stop offset="100%" stopColor="#0288d1" />
      </linearGradient>
      <filter id="bookGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0288d1" floodOpacity="0.25" />
      </filter>
    </defs>
    
    {/* Shadow */}
    <ellipse cx="100" cy="175" rx="55" ry="9" fill="#cbd5e1" opacity="0.5" />
    
    {/* Hands */}
    <ellipse cx="40" cy="115" rx="8" ry="12" fill="#f57c00" />
    <ellipse cx="160" cy="115" rx="8" ry="12" fill="#f57c00" />
    
    {/* Book Cover */}
    <rect x="42" y="45" width="116" height="110" rx="14" fill="url(#bookCoverGrad)" filter="url(#bookGlow)" />
    
    {/* Pages Inner (white sheets) */}
    <path d="M 52 50 L 148 50 L 148 145 L 52 145 Z" fill="#ffffff" />
    {/* Middle split */}
    <line x1="100" y1="50" x2="100" y2="145" stroke="#e2e8f0" strokeWidth="3" />
    
    {/* Cute Eyes */}
    <g fill="#2c3e50">
      <circle cx="76" cy="85" r="6" />
      <circle cx="124" cy="85" r="6" />
      <circle cx="74" cy="83" r="2" fill="#ffffff" />
      <circle cx="122" cy="83" r="2" fill="#ffffff" />
    </g>
    
    {/* Smile */}
    <path d="M 94 98 Q 100 106 106 98" fill="none" stroke="#2c3e50" strokeWidth="4" strokeLinecap="round" />
    
    {/* Graduation Cap */}
    <g transform="translate(100, 35) scale(0.85)">
      <polygon points="0,-15 30,0 0,15 -30,0" fill="#2c3e50" />
      <rect x="-10" y="3" width="20" height="12" fill="#2c3e50" />
      <path d="M 20 0 L 25 15 L 23 18" fill="none" stroke="#ffd54f" strokeWidth="2.5" />
    </g>
  </svg>
);
