import React from 'react';
import { audio } from '../audio/retroAudio';

export default function BottomDock({ onCardClick, activeCard }) {
  const cards = [
    {
      id: 'games',
      icon: '🎮',
      iconBg: 'purple',
      title: 'PLAY',
      subtitle: 'Fun Games'
    },
    {
      id: 'explore',
      icon: '⭐',
      iconBg: 'yellow',
      title: 'EXPLORE',
      subtitle: 'New Worlds'
    },
    {
      id: 'achieve',
      icon: '🏆',
      iconBg: 'gold',
      title: 'ACHIEVE',
      subtitle: 'Set Goals'
    },
    {
      id: 'belong',
      icon: '❤️',
      iconBg: 'pink',
      title: 'BELONG',
      subtitle: 'Be a Part'
    }
  ];

  return (
    <div className="pv-bottom-dock-container">
      <div className="pv-bottom-dock">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`pv-dock-card ${activeCard === card.id ? 'active' : ''}`}
            onClick={() => {
              audio.playCoin();
              onCardClick(card.id);
            }}
          >
            <div className={`dock-card-icon icon-${card.iconBg}`}>
              <span>{card.icon}</span>
            </div>
            <div className="dock-card-text">
              <span className="dock-card-title">{card.title}</span>
              <span className="dock-card-subtitle">{card.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
