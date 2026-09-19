import React, { useState } from 'react';
import { audio } from '../audio/retroAudio';

export default function KidAdventurer() {
  const [kidJumping, setKidJumping] = useState(false);
  const [kidSpeech, setKidSpeech] = useState('');
  const [dogHappy, setDogHappy] = useState(false);
  const [signSwing, setSignSwing] = useState(false);

  const handleKidClick = () => {
    audio.playJump();
    setKidJumping(true);
    const quotes = [
      "LET'S ADVENTURE!",
      "NEW WORLD AHEAD!",
      "LEVEL UP!",
      "INSERT COIN!",
      "QUEST ACCEPTED!"
    ];
    setKidSpeech(quotes[Math.floor(Math.random() * quotes.length)]);
    setTimeout(() => {
      setKidJumping(false);
    }, 600);
    setTimeout(() => {
      setKidSpeech('');
    }, 2400);
  };

  const handleDogClick = () => {
    audio.playCoin();
    setDogHappy(true);
    setTimeout(() => {
      setDogHappy(false);
    }, 1200);
  };

  const handleSignClick = () => {
    audio.playClick();
    setSignSwing(true);
    setTimeout(() => {
      setSignSwing(false);
    }, 1500);
  };

  return (
    <div className="pv-left-cliff-scene">
      {/* Big Lush Tree Leaves Overhanging from Top-Left */}
      <div className="pv-tree-canopy">
        <div className="tree-leaf-cluster cluster-1"></div>
        <div className="tree-leaf-cluster cluster-2"></div>
        <div className="tree-leaf-cluster cluster-3"></div>
      </div>

      {/* Hanging Wooden Sign: "GOOD GAMES BRIGHTER DAYS ♥" */}
      <div 
        className={`pv-hanging-sign ${signSwing ? 'swinging' : ''}`}
        onClick={handleSignClick}
        title="Click to swing the sign"
      >
        <div className="sign-rope rope-left"></div>
        <div className="sign-rope rope-right"></div>
        <div className="wooden-sign-board">
          <p className="sign-line">GOOD</p>
          <p className="sign-line">GAMES</p>
          <p className="sign-line">BRIGHTER</p>
          <p className="sign-line">DAYS</p>
          <span className="sign-heart">♥</span>
        </div>
      </div>

      {/* Rustic Wooden Fence */}
      <div className="pv-wood-fence">
        <div className="fence-post post-1"></div>
        <div className="fence-post post-2"></div>
        <div className="fence-rail rail-top"></div>
        <div className="fence-rail rail-bottom"></div>
      </div>

      {/* Cute Pet Shiba Inu / Dog */}
      <div 
        className={`pv-pet-dog ${dogHappy ? 'happy-bark' : ''}`}
        onClick={handleDogClick}
        title="Pet the dog!"
      >
        {dogHappy && <span className="dog-heart-float">♥ BARK!</span>}
        <svg viewBox="0 0 60 50" width="46" height="38" xmlns="http://www.w3.org/2000/svg">
          {/* Tail wagging */}
          <path d="M 12 28 Q 6 18 10 12 Q 16 16 14 24 Z" fill="#e28743" className="dog-tail" />
          {/* Body */}
          <ellipse cx="26" cy="30" rx="14" ry="11" fill="#e28743" />
          <ellipse cx="28" cy="32" rx="10" ry="7" fill="#ffffff" />
          {/* Head */}
          <circle cx="36" cy="20" r="10" fill="#e28743" />
          {/* Ears */}
          <polygon points="30,12 34,4 38,12" fill="#ab581a" />
          <polygon points="38,12 42,5 46,13" fill="#ab581a" />
          {/* Face cheeks & muzzle */}
          <ellipse cx="40" cy="23" rx="6" ry="4" fill="#ffffff" />
          <circle cx="43" cy="21" r="1.8" fill="#111111" />
          {/* Cute Eyes */}
          <ellipse cx="37" cy="18" rx="1.6" ry="2.2" fill="#111111" />
          {/* Little Front Paws */}
          <ellipse cx="34" cy="40" rx="3.5" ry="3" fill="#ffffff" />
          <ellipse cx="24" cy="40" rx="3.5" ry="3" fill="#ffffff" />
        </svg>
      </div>

      {/* THE ANIMATED KID ADVENTURER */}
      <div
        className={`pv-kid-character ${kidJumping ? 'jumping' : 'idle-breathing'}`}
        onClick={handleKidClick}
        title="Click the adventurer to jump and cheer!"
      >
        {/* Kid Speech Bubble */}
        {kidSpeech && <div className="kid-speech-bubble">{kidSpeech}</div>}

        <svg
          viewBox="0 0 100 130"
          width="90"
          height="118"
          xmlns="http://www.w3.org/2000/svg"
          className="kid-svg"
        >
          {/* BACKPACK on his back */}
          <rect x="22" y="44" width="16" height="24" rx="4" fill="#4a2e18" stroke="#1f1105" strokeWidth="2" />
          <rect x="24" y="48" width="12" height="16" rx="2" fill="#784824" />
          <rect x="20" y="52" width="5" height="12" fill="#c29148" />

          {/* DYNAMIC RED CAPE FLUTTERING IN WIND */}
          <g className="kid-cape-group">
            {/* Animated Fluttering Red Cape */}
            <path
              d="M 32 44 C 18 42, 6 52, 0 68 C 12 60, 18 72, 8 84 C 22 74, 28 66, 34 56 Z"
              fill="#d92525"
              stroke="#6b0d0d"
              strokeWidth="2"
              className="cape-layer-back"
            />
            <path
              d="M 34 46 C 22 46, 12 56, 4 66 C 16 58, 24 64, 18 76 C 28 66, 32 60, 36 54 Z"
              fill="#ff3b30"
              className="cape-layer-front"
            />
          </g>

          {/* LEGS & BOOTS */}
          <rect x="36" y="86" width="10" height="22" fill="#204060" />
          <rect x="50" y="86" width="10" height="22" fill="#204060" />
          {/* Boots */}
          <rect x="34" y="104" width="13" height="14" rx="3" fill="#543015" stroke="#1e0f03" strokeWidth="1.5" />
          <rect x="49" y="104" width="14" height="14" rx="3" fill="#543015" stroke="#1e0f03" strokeWidth="1.5" />

          {/* TORSO / BLUE SHIRT & BELT */}
          <rect x="32" y="42" width="30" height="34" rx="4" fill="#2968a8" stroke="#123052" strokeWidth="2" />
          {/* White inner collar */}
          <polygon points="44,42 48,50 52,42" fill="#ffffff" />
          {/* Brown Belt & Gold Buckle */}
          <rect x="32" y="72" width="30" height="6" fill="#3d210b" />
          <rect x="44" y="71" width="7" height="8" fill="#eab308" />

          {/* ARMS */}
          {/* Left Arm (holding backpack strap) */}
          <path d="M 34 46 Q 30 58 38 66" stroke="#2968a8" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="38" cy="66" r="4" fill="#ffd1a4" />
          {/* Right Arm */}
          <path d="M 58 46 Q 64 56 62 68" stroke="#2968a8" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="62" cy="68" r="4" fill="#ffd1a4" />

          {/* HEAD & FACE */}
          {/* Neck */}
          <rect x="43" y="36" width="9" height="8" fill="#e0a876" />
          {/* Face */}
          <ellipse cx="48" cy="26" rx="14" ry="13" fill="#ffd1a4" />
          {/* Cute Anime/Pixel Hair (Messy brown locks) */}
          <path
            d="M 32 24 C 30 10, 42 2, 54 4 C 64 6, 68 18, 64 26 C 62 20, 56 16, 50 16 C 44 16, 38 18, 34 26 Z"
            fill="#5a381e"
          />
          {/* Hair Tufts front & back */}
          <polygon points="32,22 26,28 34,30" fill="#5a381e" />
          <polygon points="40,16 36,24 44,20" fill="#714727" />
          <polygon points="48,14 46,24 54,18" fill="#714727" />
          <polygon points="56,16 54,26 62,22" fill="#5a381e" />

          {/* Profile Eye & Cheek (Looking right towards the castle) */}
          <ellipse cx="56" cy="24" rx="2.5" ry="3.5" fill="#1b120c" />
          <circle cx="57" cy="23" r="1" fill="#ffffff" />
          {/* Subtle blush */}
          <circle cx="56" cy="29" r="2.5" fill="#ff9999" opacity="0.6" />
        </svg>
      </div>

      {/* Layered Grass & Earth Cliff */}
      <div className="pv-cliff-base">
        <div className="cliff-grass-top"></div>
        <div className="cliff-dirt-rock"></div>
      </div>
    </div>
  );
}
