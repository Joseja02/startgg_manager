import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StageName } from '@/types';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageGridProps {
  stages: StageName[];
  bannedStages: StageName[];
  pickedStage: StageName | null;
  mode: 'ban' | 'pick' | 'view';
  onBan?: (stage: StageName) => void;
  onPick?: (stage: StageName) => void;
  bansRemaining?: number;
  busy?: boolean;
}

export function StageGrid({
  stages,
  bannedStages,
  pickedStage,
  mode,
  onBan,
  onPick,
  bansRemaining = 0,
  busy = false,
}: StageGridProps) {
  const isAvailable = (stage: StageName) => {
    return !bannedStages.includes(stage) && stage !== pickedStage;
  };

  const isBanned = (stage: StageName) => bannedStages.includes(stage);
  const isPicked = (stage: StageName) => stage === pickedStage;

  const handleClick = (stage: StageName) => {
    if (mode === 'view') return;

    if (busy) return;

    if (mode === 'ban' && isAvailable(stage) && onBan) {
      onBan(stage);
    } else if (mode === 'pick' && isAvailable(stage) && onPick) {
      onPick(stage);
    }
  };

  return (
    <div className="space-y-4">
      {mode !== 'view' && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {mode === 'ban' ? 'Banea escenarios' : 'Elige un escenario'}
          </h3>
          {mode === 'ban' && bansRemaining > 0 && (
            <Badge variant="secondary">
              {bansRemaining} {bansRemaining !== 1 ? 'baneos restantes' : 'baneo restante'}
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stages.map((stage) => {
          const banned = isBanned(stage);
          const picked = isPicked(stage);
          const available = isAvailable(stage);

          return (
              <Button
              key={stage}
              variant="outline"
              onClick={() => handleClick(stage)}
              disabled={busy || mode === 'view' || (mode === 'ban' && !available) || (mode === 'pick' && !available)}
              className={cn(
                'h-auto py-6 px-4 relative overflow-hidden transition-all',
                banned && 'opacity-50 bg-destructive/10 hover:bg-destructive/10',
                picked && 'bg-success/20 border-success hover:bg-success/20',
                available && mode !== 'view' && 'hover:scale-105 hover:border-primary'
              )}
            >
              <span className="text-center text-sm font-medium line-clamp-2">{stage}</span>

              {banned && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                  <X className="h-8 w-8 text-destructive" />
                </div>
              )}

              {picked && (
                <div className="absolute inset-0 flex items-center justify-center bg-success/20">
                  <Check className="h-8 w-8 text-success" />
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
