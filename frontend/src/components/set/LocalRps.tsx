import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';

type RpsChoice = 'rock' | 'paper' | 'scissors';

interface LocalRpsProps {
  p1Name: string;
  p2Name: string;
  onComplete: (winner: 'p1' | 'p2') => void;
}

const RPS_OPTIONS: { value: RpsChoice; emoji: string; label: string }[] = [
  { value: 'rock', emoji: '🪨', label: 'Piedra' },
  { value: 'paper', emoji: '📄', label: 'Papel' },
  { value: 'scissors', emoji: '✂️', label: 'Tijera' },
];

export function LocalRps({ p1Name, p2Name, onComplete }: LocalRpsProps) {
  const [phase, setPhase] = useState<'p1' | 'p2' | 'reveal' | 'done'>('p1');
  const [p1Choice, setP1Choice] = useState<RpsChoice | null>(null);
  const [p2Choice, setP2Choice] = useState<RpsChoice | null>(null);
  const [winner, setWinner] = useState<'p1' | 'p2' | 'tie' | null>(null);

  const determineWinner = (c1: RpsChoice, c2: RpsChoice): 'p1' | 'p2' | 'tie' => {
    if (c1 === c2) return 'tie';
    const wins: Record<RpsChoice, RpsChoice> = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper',
    };
    return wins[c1] === c2 ? 'p1' : 'p2';
  };

  const handleP1Select = (choice: RpsChoice) => {
    setP1Choice(choice);
    setPhase('p2');
  };

  const handleP2Select = (choice: RpsChoice) => {
    setP2Choice(choice);
    setPhase('reveal');

    setTimeout(() => {
      const result = determineWinner(p1Choice!, choice);
      setWinner(result);
      if (result !== 'tie') {
        setTimeout(() => {
          setPhase('done');
          onComplete(result);
        }, 1200);
      }
    }, 800);
  };

  const handleReset = () => {
    setPhase('p1');
    setP1Choice(null);
    setP2Choice(null);
    setWinner(null);
  };

  const currentPlayer = phase === 'p1' ? p1Name : p2Name;

  return (
    <div className="gaming-card p-6 space-y-6 animate-slide-up">
      <div className="text-center">
        <h3 className="font-display text-xl font-bold tracking-wider text-gradient mb-2">
          ROCK PAPER SCISSORS
        </h3>
        <p className="text-sm text-muted-foreground">Modo local - Pasa el dispositivo al otro jugador</p>
      </div>

      {(phase === 'p1' || phase === 'p2') && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-1">Turno de</p>
            <p className={cn('text-2xl font-bold', phase === 'p1' ? 'text-primary' : 'text-secondary')}>
              {currentPlayer}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {phase === 'p2' && '(No mires la pantalla del rival)'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {RPS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => (phase === 'p1' ? handleP1Select(option.value) : handleP2Select(option.value))}
                className="rps-button aspect-square"
              >
                <span className="text-4xl mb-2">{option.emoji}</span>
                <span className="text-xs font-medium text-muted-foreground">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8">
            <div className={cn('text-center transition-all duration-500', winner === 'p1' && 'scale-110')}>
              <div className={cn('w-20 h-20 rounded-xl flex items-center justify-center text-4xl mb-2 transition-all duration-300', winner === 'p1' ? 'bg-primary/20 glow-cyan' : 'bg-muted')}>
                {RPS_OPTIONS.find((o) => o.value === p1Choice)?.emoji}
              </div>
              <p className={cn('text-sm font-medium', winner === 'p1' ? 'text-primary' : 'text-muted-foreground')}>
                {p1Name}
              </p>
            </div>

            <div className="text-2xl font-display font-bold text-muted-foreground">VS</div>

            <div className={cn('text-center transition-all duration-500', winner === 'p2' && 'scale-110')}>
              <div className={cn('w-20 h-20 rounded-xl flex items-center justify-center text-4xl mb-2 transition-all duration-300', winner === 'p2' ? 'bg-secondary/20 glow-magenta' : 'bg-muted')}>
                {RPS_OPTIONS.find((o) => o.value === p2Choice)?.emoji}
              </div>
              <p className={cn('text-sm font-medium', winner === 'p2' ? 'text-secondary' : 'text-muted-foreground')}>
                {p2Name}
              </p>
            </div>
          </div>

          {winner && (
            <div className="text-center animate-scale-in">
              {winner === 'tie' ? (
                <div className="space-y-4">
                  <p className="text-xl font-bold text-amber">¡Empate!</p>
                  <Button onClick={handleReset} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Jugar de nuevo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className={cn('w-6 h-6', winner === 'p1' ? 'text-primary' : 'text-secondary')} />
                    <p className={cn('text-xl font-bold', winner === 'p1' ? 'text-primary' : 'text-secondary')}>
                      ¡{winner === 'p1' ? p1Name : p2Name} gana!
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">Decide quién banea primero</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
