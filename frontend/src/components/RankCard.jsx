import { Star } from "lucide-react";

export default function RankCard() {
  return (
    <div className="rank-card">
      <div className="rank-label">YOUR RANK</div>
      <div className="rank-main">
        <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=playverse-user" />
        <div>
          <strong>#24</strong>
          <div className="rank-meta">
            <span>Lv. 32</span>
            <span><Star size={14} fill="currentColor" /> 86,430</span>
          </div>
        </div>
      </div>
    </div>
  );
}