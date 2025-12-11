import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface ScoreBoardProps {
  p1Name: string;
  p2Name: string;
  p1Score: number;
  p2Score: number;
  bestOf: number;
}

export function ScoreBoard({ p1Name, p2Name, p1Score, p2Score, bestOf }: ScoreBoardProps) {
  const gamesNeeded = Math.ceil(bestOf / 2);

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 text-center space-y-2">
            <p className="text-sm text-muted-foreground">{p1Name}</p>
            <p className="text-4xl font-bold text-primary">{p1Score}</p>
          </div>

          <div className="text-center space-y-1">
            <Trophy className="h-8 w-8 text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">
              Best of {bestOf}
            </p>
            <p className="text-xs text-muted-foreground">
              (Primero a {gamesNeeded})
            </p>
          </div>

          <div className="flex-1 text-center space-y-2">
            <p className="text-sm text-muted-foreground">{p2Name}</p>
            <p className="text-4xl font-bold text-primary">{p2Score}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
