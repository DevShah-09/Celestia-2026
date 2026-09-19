import React from 'react';
import { useNavigate } from 'react-router-dom';
import { audio } from '../audio/retroAudio';

export default function HeroCenter() {
  const navigate = useNavigate();
  return (
    <div className="pv-hero-center">
      {/* Top Tagline */}
      <div className="pv-hero-tagline-top">
        <span>PLAY</span>
        <span className="heart-dot">♥</span>
        <span>EXPLORE</span>
        <span className="heart-dot">♥</span>
        <span>CREATE</span>
        <span className="heart-dot">♥</span>
        <span>BELONG</span>
      </div>

      {/* Giant 3D Pixel Block Logo: PLAYVERSE */}
      <div className="pv-logo-container">
        <h1 className="pv-3d-logo">
          <span className="logo-word-play">PLAY</span>
          <span className="logo-word-verse">VERSE</span>
        </h1>
        {/* Playful Floating "Level Up Yourself" badge */}
        <div className="pv-floating-badge">
          Level Up Yourself <span className="badge-heart">♥</span>
        </div>
      </div>

      {/* Bottom Sub-Tagline */}
      <div className="pv-hero-tagline-bottom">
        <span>GAMES TODAY</span>
        <span className="heart-dot">♥</span>
        <span>ADVENTURES TOMORROW</span>
      </div>

      {/* Golden "START PLAYING" CTA Button */}
      <button
        className="pv-btn-start-playing"
        onClick={() => {
          audio.playPowerup();
          navigate("/leaderboard");
        }}
      >
        <span>START PLAYING</span>
        <span className="arrow-triangle">▶</span>
      </button>
    </div>
  );
}
