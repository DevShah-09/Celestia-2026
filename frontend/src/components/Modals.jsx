import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../audio/retroAudio';

export default function Modals({ modalType, modalData, onClose }) {
  const [activeTab, setActiveTab] = useState('minigame');
  
  // Coin Catcher Mini-Game State
  const [score, setScore] = useState(0);
  const [gameRunning, setGameRunning] = useState(false);
  const [playerX, setPlayerX] = useState(50); // % from left
  const [coins, setCoins] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Guild/Player Registration State
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [registered, setRegistered] = useState(false);

  // Search results
  const searchItems = [
    { title: "Coin Rush Adventure", type: "Game", tag: "Hot" },
    { title: "Floating Castle Highlands", type: "World", tag: "Exploration" },
    { title: "Angry Bird Sky Flapper", type: "Mini-Game", tag: "Fun" },
    { title: "Retro Speedrun Leaderboard", type: "Hall of Fame", tag: "Competitive" },
    { title: "Pixel Knight Guild", type: "Community", tag: "Join" }
  ];

  // Mini-Game Loop
  useEffect(() => {
    if (!gameRunning) return;

    // Spawn falling items
    const spawnInterval = setInterval(() => {
      setCoins((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: Math.floor(Math.random() * 85) + 5,
          y: 0,
          isBomb: Math.random() < 0.25 // 25% chance of bomb
        }
      ]);
    }, 800);

    // Gravity / falling loop
    const fallInterval = setInterval(() => {
      setCoins((prev) => {
        const nextCoins = [];
        for (let item of prev) {
          const newY = item.y + 4;
          // Check collision with player at bottom (y > 78 and near playerX)
          if (newY >= 78 && newY <= 92 && Math.abs(item.x - playerX) < 14) {
            if (item.isBomb) {
              audio.playClick();
              setGameOver(true);
              setGameRunning(false);
            } else {
              audio.playCoin();
              setScore((s) => s + 100);
            }
          } else if (newY < 96) {
            nextCoins.push({ ...item, y: newY });
          }
        }
        return nextCoins;
      });
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(fallInterval);
    };
  }, [gameRunning, playerX]);

  // Keyboard controls for mini-game
  useEffect(() => {
    if (!gameRunning) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setPlayerX((x) => Math.max(5, x - 8));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setPlayerX((x) => Math.min(90, x + 8));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameRunning]);

  if (!modalType) return null;

  return (
    <div className="pv-modal-backdrop" onClick={onClose}>
      <div className="pv-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="pv-modal-header">
          <div className="modal-header-left">
            <span className="modal-header-icon">
              {modalType === 'games' && '🎮'}
              {modalType === 'explore' && '⭐'}
              {modalType === 'achieve' && '🏆'}
              {modalType === 'belong' && '❤️'}
              {modalType === 'skills' && '⚡'}
              {modalType === 'search' && '🔍'}
              {modalType === 'about' && '📖'}
            </span>
            <h2 className="modal-title">
              {modalType === 'games' && 'PLAY ARCADE'}
              {modalType === 'explore' && 'EXPLORE NEW WORLDS'}
              {modalType === 'achieve' && 'ACHIEVEMENTS & QUESTS'}
              {modalType === 'belong' && 'JOIN THE GUILD'}
              {modalType === 'skills' && 'SKILL TREE'}
              {modalType === 'search' && `SEARCH RESULTS FOR "${modalData}"`}
              {modalType === 'about' && 'ABOUT PLAYVERSE'}
            </h2>
          </div>
          <button 
            className="pv-modal-close-btn" 
            onClick={() => { audio.playClick(); onClose(); }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="pv-modal-body">
          {/* 1. PLAY / GAMES MODAL */}
          {modalType === 'games' && (
            <div className="modal-games-content">
              <div className="games-tab-bar">
                <button 
                  className={`tab-btn ${activeTab === 'minigame' ? 'active' : ''}`}
                  onClick={() => { audio.playClick(); setActiveTab('minigame'); }}
                >
                  🪙 PLAY COIN CATCHER
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
                  onClick={() => { audio.playClick(); setActiveTab('catalog'); }}
                >
                  🕹️ GAME CATALOG
                </button>
              </div>

              {activeTab === 'minigame' && (
                <div className="minigame-arena">
                  <div className="minigame-hud">
                    <span>SCORE: <strong style={{ color: '#facc15' }}>{score}</strong></span>
                    <span>USE [←] [→] KEYS OR BUTTONS</span>
                    {!gameRunning ? (
                      <button 
                        className="btn-play-mini"
                        onClick={() => {
                          audio.playPowerup();
                          setScore(0);
                          setCoins([]);
                          setGameOver(false);
                          setGameRunning(true);
                        }}
                      >
                        {gameOver ? "TRY AGAIN ▶" : "START GAME ▶"}
                      </button>
                    ) : (
                      <button 
                        className="btn-play-mini pause"
                        onClick={() => setGameRunning(false)}
                      >
                        PAUSE
                      </button>
                    )}
                  </div>

                  {/* Playable Canvas Screen */}
                  <div className="minigame-screen">
                    {/* Falling Coins & Bombs */}
                    {coins.map((item) => (
                      <div
                        key={item.id}
                        className={`falling-item ${item.isBomb ? 'bomb' : 'coin'}`}
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                      >
                        {item.isBomb ? '💣' : '🪙'}
                      </div>
                    ))}

                    {/* Kid Catcher at Bottom */}
                    <div className="player-catcher" style={{ left: `${playerX}%` }}>
                      <span className="catcher-basket">🧺</span>
                      <span className="catcher-kid">🧑‍🌾</span>
                    </div>

                    {gameOver && (
                      <div className="game-over-overlay">
                        <h3>GAME OVER!</h3>
                        <p>FINAL SCORE: {score}</p>
                      </div>
                    )}
                  </div>

                  {/* Mobile On-Screen Controls */}
                  <div className="mobile-controls">
                    <button 
                      className="ctrl-arrow" 
                      onClick={() => setPlayerX((x) => Math.max(5, x - 12))}
                    >
                      ◀ LEFT
                    </button>
                    <button 
                      className="ctrl-arrow" 
                      onClick={() => setPlayerX((x) => Math.min(90, x + 12))}
                    >
                      RIGHT ▶
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'catalog' && (
                <div className="game-catalog-grid">
                  {[
                    { title: "ANGRY BIRD SKY SIEGE", genre: "Arcade Action", icon: "🐦", plays: "42.8k" },
                    { title: "FLOATING CASTLE RUNNER", genre: "Platformer", icon: "🏰", plays: "38.1k" },
                    { title: "SHIBA QUEST: RETRO BARK", genre: "Adventure RPG", icon: "🐕", plays: "29.4k" },
                    { title: "16-BIT SPEEDWAY GP", genre: "Retro Racing", icon: "🏎️", plays: "18.9k" }
                  ].map((g) => (
                    <div key={g.title} className="catalog-card">
                      <span className="catalog-icon">{g.icon}</span>
                      <div className="catalog-details">
                        <h4>{g.title}</h4>
                        <p>{g.genre} • {g.plays} players</p>
                      </div>
                      <button 
                        className="catalog-play-btn"
                        onClick={() => { audio.playCoin(); setActiveTab('minigame'); }}
                      >
                        PLAY ▶
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. EXPLORE WORLDS */}
          {modalType === 'explore' && (
            <div className="modal-explore-content">
              <div className="worlds-grid">
                {[
                  { name: "Sky Castle Highlands", level: "Lv. 1-10", desc: "Soaring floating islands connected by ancient waterfalls and stone bridges.", icon: "🏰", unlocked: true },
                  { name: "Whispering Pine Forest", level: "Lv. 10-25", desc: "Dense pixel pine trees with hidden wooden signposts and ancient ruins.", icon: "🌲", unlocked: true },
                  { name: "Cyber Sunset Valley", level: "Lv. 25-50", desc: "Synthwave neon rivers with high-speed retro arcade speedways.", icon: "🌇", unlocked: false },
                  { name: "Glitch Caverns", level: "Lv. 50+", desc: "The legendary underbelly of the game world with secret easter eggs.", icon: "👾", unlocked: false }
                ].map((w) => (
                  <div key={w.name} className={`world-card ${w.unlocked ? 'unlocked' : 'locked'}`}>
                    <span className="world-icon">{w.icon}</span>
                    <div className="world-info">
                      <h3>{w.name}</h3>
                      <span className="world-level">{w.level}</span>
                      <p>{w.desc}</p>
                      <button 
                        className="btn-enter-world"
                        onClick={() => audio.playCoin()}
                      >
                        {w.unlocked ? "WARP TO WORLD ▶" : "LOCKED 🔒"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ACHIEVEMENTS & QUESTS */}
          {modalType === 'achieve' && (
            <div className="modal-achieve-content">
              <div className="quests-list">
                {[
                  { title: "First Flight", desc: "Click the Angry Bird soaring across the sky.", exp: "+150 XP", done: true, icon: "🐦" },
                  { title: "Treasure Hunter", desc: "Open the mysterious wooden chest on the right cliff.", exp: "+250 XP", done: true, icon: "🪙" },
                  { title: "Power Up!", desc: "Bounce the super red mushroom.", exp: "+100 XP", done: true, icon: "🍄" },
                  { title: "Good Vibes Master", desc: "Swing the wooden tree sign 5 times.", exp: "+300 XP", done: false, icon: "🌿" },
                  { title: "High Scorer", desc: "Score 1,000 points in Coin Catcher.", exp: "+500 XP", done: false, icon: "🏆" }
                ].map((q) => (
                  <div key={q.title} className={`quest-item ${q.done ? 'completed' : ''}`}>
                    <span className="quest-icon">{q.icon}</span>
                    <div className="quest-info">
                      <h4>{q.title} {q.done && <span className="badge-done">COMPLETED ✓</span>}</h4>
                      <p>{q.desc}</p>
                    </div>
                    <span className="quest-exp">{q.exp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. BELONG / GUILD REGISTRATION */}
          {modalType === 'belong' && (
            <div className="modal-belong-content">
              <div className="belong-card">
                <h3>JOIN PLAYVERSE GUILD</h3>
                <p>Register your team or adventurer profile to track your high scores, battle alongside companions, and earn exclusive retro badges.</p>

                {registered ? (
                  <div className="registered-success">
                    <span className="success-icon">🎉</span>
                    <h4>WELCOME TO THE GUILD, [{teamName.toUpperCase()}]!</h4>
                    <p>PLAYER TAG: #{teamTag || "PV-777"}</p>
                    <button 
                      className="btn-play-mini"
                      onClick={() => setRegistered(false)}
                    >
                      EDIT PROFILE
                    </button>
                  </div>
                ) : (
                  <form 
                    className="guild-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (teamName) {
                        audio.playCoin();
                        setRegistered(true);
                      }
                    }}
                  >
                    <div className="form-field">
                      <label>TEAM / ADVENTURER NAME</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Pixel Paladin" 
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>PLAYER TAG / ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 777" 
                        value={teamTag}
                        onChange={(e) => setTeamTag(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-join-guild">
                      REGISTER & JOIN GUILD ▶
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 5. SEARCH RESULTS */}
          {modalType === 'search' && (
            <div className="modal-search-content">
              <div className="search-results-list">
                {searchItems.map((item) => (
                  <div key={item.title} className="search-result-row">
                    <div>
                      <h4>{item.title}</h4>
                      <span className="search-type">{item.type}</span>
                    </div>
                    <span className="search-tag">{item.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ABOUT */}
          {modalType === 'about' && (
            <div className="modal-about-content">
              <h3>PLAYVERSE: RETRO 16-BIT KINGDOM</h3>
              <p>
                Inspired by timeless adventures, 16-bit RPGs, and pixel art classics. 
                Built with React, dynamic SVG animation engines, and procedural 8-bit sound synthesis.
              </p>
              <div className="about-stats">
                <div><span>⭐</span> 100% Offline Procedural Sound</div>
                <div><span>🍃</span> Wind-Driven Animated Cape</div>
                <div><span>🐦</span> Soaring Angry Bird Physics</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
