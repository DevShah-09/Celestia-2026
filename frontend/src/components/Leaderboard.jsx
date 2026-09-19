import LeaderboardRow from "./LeaderboardRow";

export default function Leaderboard({ players }) {
  return (
    <section className="leaderboard-shell">
      <div className="table-head">
  <div>#</div>
  <div>TEAM</div>
  <div>TEAM SIZE</div>
  <div>SCORE</div>
</div>
      <div className="table-body">
        {players.length ? players.map((player) => (
          <LeaderboardRow key={player.rank} player={player} />
        )) : (
          <div className="empty-state">No team found. Try another team.</div>
        )}
      </div>
    </section>
  );
}
