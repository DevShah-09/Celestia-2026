import React, { useState } from 'react';
import { audio } from '../audio/retroAudio';

export default function Header({ onOpenModal, activeNav, setActiveNav }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [soundOn, setSoundOn] = useState(true);

  const handleNavClick = (tab) => {
    audio.playClick();
    setActiveNav(tab);
    if (tab === 'GAMES') onOpenModal('games');
    if (tab === 'FEATURES') onOpenModal('explore');
    if (tab === 'ABOUT') onOpenModal('about');
    if (tab === 'CONTACT') onOpenModal('contact');
  };

  const toggleSound = () => {
    const isEnabled = audio.toggle();
    setSoundOn(isEnabled);
    if (isEnabled) audio.playCoin();
  };

  return (
    <header className="pv-header">
      {/* Brand Logo */}
      <div className="pv-brand" onClick={() => { audio.playCoin(); setActiveNav('HOME'); }}>
        <div className="pv-gamepad-icon">
          <span className="dpad">+</span>
          <span className="buttons">••</span>
        </div>
        <span className="pv-brand-title">PLAYVERSE</span>
      </div>

      {/* Navigation Menu */}
      <nav className="pv-nav">
        {['HOME', 'GAMES', 'FEATURES', 'ABOUT', 'CONTACT'].map((item) => (
          <button
            key={item}
            className={`pv-nav-link ${activeNav === item ? 'active' : ''}`}
            onClick={() => handleNavClick(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="pv-header-right">
        {/* Search Bar */}
        <div className="pv-search-box">
          <span className="pv-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                audio.playClick();
                onOpenModal('search', searchTerm);
              }
            }}
          />
        </div>

        {/* Audio Toggle */}
        <button 
          className="pv-sound-btn" 
          onClick={toggleSound}
          title={soundOn ? "Mute 8-bit Audio" : "Enable 8-bit Audio"}
        >
          {soundOn ? "🔊" : "🔇"}
        </button>

        {/* "LET'S PLAY" CTA Button */}
        <button
          className="pv-btn-lets-play"
          onClick={() => {
            audio.playCoin();
            onOpenModal('games');
          }}
        >
          LET'S PLAY <span className="arrow-play">▶</span>
        </button>
      </div>
    </header>
  );
}
