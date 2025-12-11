import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hand, Scissors, FileText } from 'lucide-react';

interface RpsPanelProps {
  p1Name: string;
  p2Name: string;
  onComplete: (winner: 'p1' | 'p2') => void;
}

export function RpsPanel({ p1Name, p2Name, onComplete }: RpsPanelProps) {
  const [p1Choice, setP1Choice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
  const [p2Choice, setP2Choice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
  const [winner, setWinner] = useState<'p1' | 'p2' | 'tie' | null>(null);

  const choices = [
    { value: 'rock' as const, label: 'Piedra', icon: Hand },
    { value: 'paper' as const, label: 'Papel', icon: FileText },
    { value: 'scissors' as const, label: 'Tijera', icon: Scissors },
  ];

  const determineWinner = (c1: typeof p1Choice, c2: typeof p2Choice) => {
    if (!c1 || !c2) return null;
    if (c1 === c2) return 'tie';
    if (
      (c1 === 'rock' && c2 === 'scissors') ||
      (c1 === 'scissors' && c2 === 'paper') ||
      (c1 === 'paper' && c2 === 'rock')
    ) {
      return 'p1';
    }
    return 'p2';
  };

  const handleP1Choice = (choice: typeof p1Choice) => {
    setP1Choice(choice);
    if (p2Choice) {
      const result = determineWinner(choice, p2Choice);
      setWinner(result);
    }
  };

  const handleP2Choice = (choice: typeof p2Choice) => {
    setP2Choice(choice);
    if (p1Choice) {
      const result = determineWinner(p1Choice, choice);
      setWinner(result);
    }
  };

  const handleReset = () => {
    setP1Choice(null);
    setP2Choice(null);
    setWinner(null);
  };

  const handleConfirm = () => {
    if (winner && winner !== 'tie') {
      onComplete(winner);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Piedra, Papel o Tijera</CardTitle>
        <CardDescription>
          Determina quién empieza baneando stages en el Game 1
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Player 1 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">{p1Name}</label>
          <div className="grid grid-cols-3 gap-2">
            {choices.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={p1Choice === value ? 'default' : 'outline'}
                onClick={() => handleP1Choice(value)}
                className="flex flex-col gap-2 h-auto py-4"
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">VS</span>
        </div>

        {/* Player 2 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">{p2Name}</label>
          <div className="grid grid-cols-3 gap-2">
            {choices.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={p2Choice === value ? 'default' : 'outline'}
                onClick={() => handleP2Choice(value)}
                className="flex flex-col gap-2 h-auto py-4"
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Result */}
        {winner && (
          <div className="space-y-4 pt-4 border-t">
            {winner === 'tie' ? (
              <div className="text-center">
                <Badge variant="secondary" className="text-base px-4 py-2">
                  ¡Empate! Intenta de nuevo
                </Badge>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Badge className="text-base px-4 py-2 bg-gradient-primary">
                  Ganador: {winner === 'p1' ? p1Name : p2Name}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {winner === 'p1' ? p1Name : p2Name} empieza baneando 3 stages
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Repetir
              </Button>
              {winner !== 'tie' && (
                <Button onClick={handleConfirm} className="flex-1 bg-gradient-primary">
                  Confirmar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
