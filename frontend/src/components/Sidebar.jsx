import { BarChart3, Settings, Trophy, UserRound, Users, Crown } from "lucide-react";

const items = [
  ["Leaderboard", Trophy],
  ["My Stats", BarChart3],
  ["Achievements", Crown],
  ["Friends", Users],
  ["Settings", Settings],
];

export default function Sidebar() {
  return (
    <aside className="side-hud">
      {items.map(([label, Icon], index) => (
        <button className={`side-item ${index === 0 ? "selected" : ""}`} key={label}>
          <Icon size={23} />
          <span>{label}</span>
        </button>
      ))}
    </aside>
  );
}