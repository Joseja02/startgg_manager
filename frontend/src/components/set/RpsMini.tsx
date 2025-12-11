import React from 'react';
import { Button } from '@/components/ui/button';
import { Hand, Scissors, FileText } from 'lucide-react';

type Choice = 'rock' | 'paper' | 'scissors';

const choices: { value: Choice; label: string; Icon: any }[] = [
  { value: 'rock', label: 'Piedra', Icon: Hand },
  { value: 'paper', label: 'Papel', Icon: FileText },
  { value: 'scissors', label: 'Tijera', Icon: Scissors },
];

function determineWinner(a: Choice, b: Choice): 'p1' | 'p2' | 'tie' {
  if (a === b) return 'tie';
  if (
    (a === 'rock' && b === 'scissors') ||
    (a === 'scissors' && b === 'paper') ||
    (a === 'paper' && b === 'rock')
  ) {
    return 'p1';
  }
  return 'p2';
}

export function RpsMini({ onComplete }: { onComplete: (winner: 'p1' | 'p2') => void }) {
  const handleClick = (choice: Choice) => {
    // Simular elección del oponente aleatoria
    const opponent = choices[Math.floor(Math.random() * choices.length)].value;
    const result = determineWinner(choice, opponent);
    if (result === 'tie') {
      // En empate, repetir automáticamente usando random opponent
      const opp2 = choices[Math.floor(Math.random() * choices.length)].value;
      const r2 = determineWinner(choice, opp2);
      if (r2 === 'tie') return;
      onComplete(r2);
    } else {
      onComplete(result);
    }
  };

  return (
    <div className="flex gap-2">
      {choices.map(({ value, label, Icon }) => (
        <Button key={value} variant="outline" onClick={() => handleClick(value)} className="flex-1 py-3">
          <Icon className="h-5 w-5 mr-2" />
          <span className="text-sm">{label}</span>
        </Button>
      ))}
    </div>
  );
}

export default RpsMini;
