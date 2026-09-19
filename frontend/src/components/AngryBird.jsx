import React, { useState, useEffect } from 'react';
import { audio } from '../audio/retroAudio';

export default function AngryBird() {
  const [position, setPosition] = useState(-100);
  const [altitude, setAltitude] = useState(18); // % from top
  const [flapping, setFlapping] = useState(false);
  const [speedBoost, setSpeedBoost] = useState(false);
  const [speech, setSpeech] = useState('');

  // Flight loop across the sky
  useEffect(() => {
    const flightInterval = setInterval(() => {
      setPosition((prev) => {
        if (prev > window.innerWidth + 120) {
          // Reset to left side with random altitude
          setAltitude(12 + Math.random() * 22);
          return -120;
        }
        return prev + (speedBoost ? 7 : 3);
      });
    }, 30);

    // Flapping timer
    const flapInterval = setInterval(() => {
      setFlapping((prev) => !prev);
    }, 240);

    return () => {
      clearInterval(flightInterval);
      clearInterval(flapInterval);
    };
  }, [speedBoost]);

  const handleBirdClick = () => {
    audio.playBirdSquawk();
    setSpeedBoost(true);
    const phrases = ["SQUAWK!!", "YA-HEE!!", "INCOMING!!", "PIG DESTROYER!"];
    setSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => {
      setSpeedBoost(false);
      setSpeech('');
    }, 1800);
  };

  return (
    <div
      className={`pv-angry-bird-wrapper ${speedBoost ? 'boost' : ''}`}
      style={{
        left: `${position}px`,
        top: `${altitude}%`,
      }}
      onClick={handleBirdClick}
      title="Click the Angry Bird for a speed boost!"
    >
      {/* Speech bubble */}
      {speech && <div className="angry-bird-bubble">{speech}</div>}

      {/* Speed trail wind lines */}
      <div className="angry-bird-trail">
        <span className="trail-line line-1"></span>
        <span className="trail-line line-2"></span>
        <span className="trail-line line-3"></span>
      </div>

      {/* SVG Pixel / Cartoon Angry Bird */}
      <svg
        className={`pv-angry-bird-svg ${flapping ? 'flap' : ''}`}
        viewBox="0 0 100 90"
        width="68"
        height="62"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle shading */}
          <radialGradient id="birdShading" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ff4444" />
            <stop offset="65%" stopColor="#d31414" />
            <stop offset="100%" stopColor="#8b0a0a" />
          </radialGradient>
        </defs>

        {/* Tail Feathers (3 black rectangles) */}
        <g className="bird-tail">
          <rect x="2" y="38" width="16" height="6" fill="#151515" rx="2" transform="rotate(-15 2 38)" />
          <rect x="2" y="44" width="18" height="6" fill="#151515" rx="2" />
          <rect x="4" y="50" width="14" height="6" fill="#151515" rx="2" transform="rotate(15 4 50)" />
        </g>

        {/* Head Crest Feathers (2 red feathers sticking out of head) */}
        <g className="bird-crest">
          <path d="M 44 14 Q 38 2 30 6 Q 36 18 48 18 Z" fill="#b91010" />
          <path d="M 52 14 Q 48 -2 40 2 Q 44 16 54 18 Z" fill="#d31414" />
        </g>

        {/* Round Red Body */}
        <circle cx="56" cy="48" r="34" fill="url(#birdShading)" stroke="#220404" strokeWidth="3" />

        {/* Light Cream Belly */}
        <ellipse cx="60" cy="62" rx="20" ry="15" fill="#f8e5b9" stroke="#927137" strokeWidth="1.5" />

        {/* Eyes (White with black pupils) */}
        <circle cx="62" cy="42" r="8.5" fill="#ffffff" stroke="#220404" strokeWidth="2" />
        <circle cx="77" cy="42" r="8.5" fill="#ffffff" stroke="#220404" strokeWidth="2" />
        <circle cx="65" cy="42" r="3.5" fill="#111111" />
        <circle cx="79" cy="42" r="3.5" fill="#111111" />
        {/* Eye shine reflection */}
        <circle cx="66" cy="40" r="1.2" fill="#ffffff" />
        <circle cx="80" cy="40" r="1.2" fill="#ffffff" />

        {/* Thick Iconic Angry Eyebrows */}
        <polygon points="52,35 70,40 70,33 52,27" fill="#111111" />
        <polygon points="70,40 88,35 88,27 70,33" fill="#111111" />
        {/* Eyebrow center join */}
        <rect x="68" y="32" width="5" height="8" fill="#111111" />

        {/* Sharp Orange/Yellow Beak */}
        <polygon points="68,44 86,48 68,54" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
        <polygon points="68,52 82,50 68,58" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />

        {/* Small Flapping Wing on side */}
        <g className={`bird-wing ${flapping ? 'wing-up' : 'wing-down'}`}>
          <ellipse cx="44" cy="56" rx="10" ry="6" fill="#a80e0e" stroke="#220404" strokeWidth="2" transform="rotate(-15 44 56)" />
        </g>
      </svg>
    </div>
  );
}
