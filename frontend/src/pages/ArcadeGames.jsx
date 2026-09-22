import { Gamepad2 } from 'lucide-react';
import PageShell from '../components/PageShell';

export default function ArcadeGames() {
  return <PageShell>
    <section className="portal-panel" aria-labelledby="games-title">
      <p className="portal-eyebrow">CELESTIA 2026 / RETRO GAMES</p>
      <h1 id="games-title">Games</h1>
      <p className="portal-muted">Choose your game. Let the fun begin!</p>
      <article className="arcade-game-card" aria-labelledby="retro-shuffle-title">
        <Gamepad2 size={48} aria-hidden="true" />
        <h2 id="retro-shuffle-title">Retro Shuffle</h2>
        <a className="portal-button" href="https://puzzle-8rai.onrender.com" aria-label="Play Retro Shuffle">Play now &rarr;</a>
      </article>
    </section>
  </PageShell>;
}
