import React from 'react';

export default function Scenery() {
  return (
    <div className="pv-scenery-container">
      {/* Sky Gradient */}
      <div className="pv-sky-gradient"></div>

      {/* Warm Golden Sun */}
      <div className="pv-pixel-sun">
        <div className="sun-core"></div>
        <div className="sun-rays-aura"></div>
      </div>

      {/* Drifting Clouds (Multiple Parallax Speeds) */}
      <div className="pv-clouds-layer">
        <div className="pixel-cloud cloud-1"></div>
        <div className="pixel-cloud cloud-2"></div>
        <div className="pixel-cloud cloud-3"></div>
        <div className="pixel-cloud cloud-4"></div>
      </div>

      {/* Distant Flock of Flying Birds */}
      <div className="pv-distant-birds">
        <span className="v-bird vb-1">v</span>
        <span className="v-bird vb-2">v</span>
        <span className="v-bird vb-3">v</span>
      </div>

      {/* Distant Mountain Range */}
      <div className="pv-distant-mountains"></div>

      {/* Floating Islands Layer */}
      {/* 1. Left Mini Floating Island */}
      <div className="pv-floating-island mini-left">
        <div className="island-grass"></div>
        <div className="island-dirt"></div>
      </div>

      {/* 2. Center Mini Floating Island */}
      <div className="pv-floating-island mini-center">
        <div className="island-grass"></div>
        <div className="island-dirt"></div>
      </div>

      {/* 3. Right Grand Floating Castle Island with Cascading Waterfall */}
      <div className="pv-floating-island castle-island">
        {/* Fantasy Medieval Castle */}
        <div className="castle-structure">
          <div className="castle-tower tower-left">
            <div className="tower-roof"></div>
            <div className="tower-flag"></div>
          </div>
          <div className="castle-keep">
            <div className="keep-window"></div>
          </div>
          <div className="castle-tower tower-right">
            <div className="tower-roof"></div>
            <div className="tower-flag"></div>
          </div>
        </div>

        {/* Island Earth Body */}
        <div className="island-grass"></div>
        <div className="island-dirt"></div>

        {/* Cascading Animated Waterfall */}
        <div className="pv-waterfall-stream">
          <div className="water-rush"></div>
          <div className="water-splash-mist"></div>
        </div>
      </div>

      {/* Valley, Stone Bridge, Windmill & Village */}
      <div className="pv-valley-landscape">
        {/* Rolling Green Hills */}
        <div className="valley-hills"></div>

        {/* Animated Rotating Windmill */}
        <div className="valley-windmill">
          <div className="windmill-base"></div>
          <div className="windmill-blades">
            <div className="blade b1"></div>
            <div className="blade b2"></div>
            <div className="blade b3"></div>
            <div className="blade b4"></div>
          </div>
        </div>

        {/* Tiny Village Cottages */}
        <div className="valley-cottages">
          <div className="cottage c-1"></div>
          <div className="cottage c-2"></div>
          <div className="cottage c-3"></div>
        </div>

        {/* Stone Arched Bridge across River */}
        <div className="valley-stone-bridge">
          <div className="bridge-arch"></div>
          <div className="bridge-arch"></div>
          <div className="bridge-arch"></div>
        </div>

        {/* Shimmering Blue River */}
        <div className="valley-river">
          <div className="water-shimmer"></div>
        </div>
      </div>
    </div>
  );
}
