import { GameCard } from '@/features/games/components/GameCard';
import { listGames } from '@/server/services/game.service';

export default async function GamesPage() {
  const games = await listGames();

  return (
    <div className="stack">
      <h1>Oyunlar</h1>
      <p className="muted">
        Oyun listesi `public.game_plays` tablosundan uretilir. `farki-bul`, `kelime-avi`, `matematik-grid`,
        `gorsel-hafiza`, `sayisal-hafiza` ve `kozmik-hafiza` oyunlari bu iskelette calisir durumda migrate edildi.
      </p>

      <div className="grid-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
