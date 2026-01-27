import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameRecord } from '@/types';
import { Trophy, MapPin, Heart } from 'lucide-react';

interface GamesHistoryProps {
  games: GameRecord[];
  p1Name: string;
  p2Name: string;
}

export function GamesHistory({ games, p1Name, p2Name }: GamesHistoryProps) {
  if (!games.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de Games</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No hay games registrados aún
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Historial de Games
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {games.map((game) => (
          <div
            key={game.index}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">
                G{game.index}
              </Badge>
              
              {game.stage && (
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  <span>{game.stage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Player 1 */}
              <div className={`flex items-center gap-2 ${game.winner === 'p1' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <span className="text-sm">{game.characterP1 || p1Name}</span>
                {game.stocksP1 !== null && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: game.stocksP1 }).map((_, i) => (
                      <Heart key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                )}
                {game.winner === 'p1' && <Trophy className="h-4 w-4 text-primary" />}
              </div>

              <span className="text-muted-foreground">vs</span>

              {/* Player 2 */}
              <div className={`flex items-center gap-2 ${game.winner === 'p2' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {game.winner === 'p2' && <Trophy className="h-4 w-4 text-primary" />}
                {game.stocksP2 !== null && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: game.stocksP2 }).map((_, i) => (
                      <Heart key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                )}
                <span className="text-sm">{game.characterP2 || p2Name}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
