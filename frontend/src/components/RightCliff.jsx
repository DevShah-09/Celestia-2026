import React, { useState } from 'react';
import { audio } from '../audio/retroAudio';

export default function RightCliff({ onOpenModal }) {
  const [chestOpen, setChestOpen] = useState(false);
  const [mushroomBouncing, setMushroomBouncing] = useState(false);
  const [coinsPop, setCoinsPop] = useState(false);

  const handleChestClick = () => {
    audio.playChestOpen();
    setChestOpen((prev) => !prev);
    setCoinsPop(true);
    setTimeout(() => {
      setCoinsPop(false);
    }, 1500);
  };

  const handleMushroomClick = () => {
    audio.playPowerup();
    setMushroomBouncing(true);
    setTimeout(() => {
      setMushroomBouncing(false);
    }, 600);
  };

  const handlePlankClick = (feature) => {
    audio.playClick();
    if (feature === 'NEW WORLDS') onOpenModal('explore');
    if (feature === 'SKILLS') onOpenModal('skills');
    if (feature === 'ACHIEVEMENTS') onOpenModal('achieve');
    if (feature === 'GOOD VIBES') onOpenModal('belong');
  };

  return (
    <div className="pv-right-cliff-scene">
      {/* 4-Plank Wooden Signpost */}
      <div className="pv-wooden-signpost">
        <div className="signpost-pole"></div>
        
        {['NEW WORLDS', 'SKILLS', 'ACHIEVEMENTS', 'GOOD VIBES'].map((plank, index) => (
          <button
            key={plank}
            className={`signpost-plank plank-${index + 1}`}
            onClick={() => handlePlankClick(plank)}
            title={`Explore ${plank}`}
          >
            <span>{plank}</span>
            <span className="plank-arrow">›</span>
          </button>
        ))}
      </div>

      {/* Floating Sparkles / Coins on Chest Open */}
      {coinsPop && (
        <div className="chest-sparkles-container">
          <span className="coin-sparkle c1">🪙 +100</span>
          <span className="coin-sparkle c2">💎 +500</span>
          <span className="coin-sparkle c3">⭐ EXP UP</span>
        </div>
      )}

      {/* Interactive Treasure Chest */}
      <div 
        className={`pv-treasure-chest ${chestOpen ? 'open' : 'closed'}`}
        onClick={handleChestClick}
        title="Click to open the treasure chest!"
      >
        <svg viewBox="0 0 70 55" width="56" height="44" xmlns="http://www.w3.org/2000/svg">
          {/* Base of Chest */}
          <rect x="8" y="24" width="54" height="28" rx="2" fill="#7a471c" stroke="#2b1404" strokeWidth="2.5" />
          {/* Iron/Gold Bands */}
          <rect x="14" y="24" width="6" height="28" fill="#eab308" stroke="#713f12" strokeWidth="1" />
          <rect x="50" y="24" width="6" height="28" fill="#eab308" stroke="#713f12" strokeWidth="1" />
          {/* Golden Keyhole Plate */}
          <circle cx="35" cy="36" r="4.5" fill="#fef08a" stroke="#854d0e" strokeWidth="1.5" />
          <circle cx="35" cy="35" r="1.5" fill="#1c1917" />
          <polygon points="34,36 36,36 37,40 33,40" fill="#1c1917" />

          {/* Chest Lid (Rotates when opened) */}
          <g className="chest-lid">
            <path
              d="M 6 24 C 6 12, 64 12, 64 24 Z"
              fill="#8d5422"
              stroke="#2b1404"
              strokeWidth="2.5"
            />
            {/* Gold Lid Straps */}
            <path d="M 14 24 C 14 14, 20 14, 20 24 Z" fill="#eab308" />
            <path d="M 50 24 C 50 14, 56 14, 56 24 Z" fill="#eab308" />
          </g>
        </svg>
      </div>

      {/* Super Red Mushroom */}
      <div
        className={`pv-super-mushroom ${mushroomBouncing ? 'bouncing' : ''}`}
        onClick={handleMushroomClick}
        title="Click to 1-UP!"
      >
        <svg viewBox="0 0 45 42" width="36" height="34" xmlns="http://www.w3.org/2000/svg">
          {/* White Stem */}
          <rect x="16" y="22" width="13" height="18" rx="3" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
          <ellipse cx="20" cy="28" rx="1.2" ry="2.5" fill="#0f172a" />
          <ellipse cx="25" cy="28" rx="1.2" ry="2.5" fill="#0f172a" />
          {/* Red Cap */}
          <ellipse cx="22.5" cy="18" rx="20" ry="15" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          {/* White Spots */}
          <ellipse cx="22.5" cy="11" rx="6" ry="4.5" fill="#ffffff" />
          <circle cx="8" cy="20" r="4.5" fill="#ffffff" />
          <circle cx="37" cy="20" r="4.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Cute Little Flowers on Grass */}
      <div className="pv-flowers-row">
        <span className="flower f1">🌸</span>
        <span className="flower f2">🌼</span>
        <span className="flower f3">🌷</span>
      </div>

      {/* Right Cliff Grass & Earth */}
      <div className="pv-right-cliff-base">
        <div className="cliff-grass-top"></div>
        <div className="cliff-dirt-rock"></div>
      </div>
    </div>
  );
}
