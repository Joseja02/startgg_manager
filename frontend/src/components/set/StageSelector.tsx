import { cn } from '@/lib/utils';
import { StageName, STAGES } from '@/types';
import { Ban, Check, Loader2 } from 'lucide-react';

interface StageSelectorProps {
  bannedStages: StageName[];
  pickedStage: StageName | null;
  mode: 'ban' | 'pick' | 'view';
  bansRemaining: number;
  busy?: boolean;
  onBan: (stage: StageName) => void;
  onPick: (stage: StageName) => void;
  currentBanner?: 'p1' | 'p2';
  p1Name?: string;
  p2Name?: string;
}

const assetBase = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const STAGE_IMAGES: Record<StageName, string> = {
  Battlefield: `${assetBase}stages/battlefield.png`,
  'Small Battlefield': `${assetBase}stages/smallbattlefield.jpg`,
  'Final Destination': `${assetBase}stages/finaldestination.jpg`,
  'Pokemon Stadium 2': `${assetBase}stages/pokemonstadium2.png`,
  Smashville: `${assetBase}stages/smashville.png`,
  'Town and City': `${assetBase}stages/townandcity.png`,
  'Kalos Pokemon League': `${assetBase}stages/kalos.png`,
  'Hollow Bastion': `${assetBase}stages/hollowbastion.jpg`,
  "Yoshi's Story": `${assetBase}stages/yoshistory.png`,
};

export function StageSelector({
  bannedStages,
  pickedStage,
  mode,
  bansRemaining,
  busy = false,
  onBan,
  onPick,
  currentBanner,
  p1Name,
  p2Name,
}: StageSelectorProps) {
  const handleStageClick = (stage: StageName) => {
    if (busy) return;
    if (bannedStages.includes(stage)) return;
    if (pickedStage === stage) return;

    if (mode === 'ban') {
      onBan(stage);
    } else if (mode === 'pick') {
      onPick(stage);
    }
  };

  return (
    <div className="gaming-card p-5 space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-wide">
            {mode === 'ban' && 'SELECCIÓN DE ESCENARIO'}
            {mode === 'pick' && 'ELIGE EL ESCENARIO'}
            {mode === 'view' && 'ESCENARIO SELECCIONADO'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {mode === 'ban' && currentBanner && (
              <>
                Turno de{' '}
                <span
                  className={cn(
                    'font-medium',
                    currentBanner === 'p1' ? 'text-primary' : 'text-secondary'
                  )}
                >
                  {currentBanner === 'p1' ? p1Name : p2Name}
                </span>
                {' '}para banear
              </>
            )}
            {mode === 'ban' && !currentBanner && `${bansRemaining} bans restantes`}
            {mode === 'pick' && 'Toca un escenario para seleccionarlo'}
            {mode === 'view' && pickedStage && `Se jugará en ${pickedStage}`}
          </p>
        </div>

        {mode === 'ban' && bansRemaining > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive">
            <Ban className="w-4 h-4" />
            <span className="text-sm font-medium">{bansRemaining}</span>
          </div>
        )}

        {busy && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STAGES.map((stage) => {
          const isBanned = bannedStages.includes(stage);
          const isPicked = pickedStage === stage;
          const isAvailable = !isBanned && !isPicked;
          const canInteract = mode !== 'view' && isAvailable && !busy;

          return (
            <button
              key={stage}
              onClick={() => canInteract && handleStageClick(stage)}
              disabled={!canInteract}
              className={cn(
                'stage-card relative aspect-[3/4] sm:aspect-[4/3] p-2 flex flex-col justify-end overflow-hidden',
                'bg-muted/70 border border-border/60 shadow-sm',
                isBanned && 'stage-banned',
                isPicked && 'stage-picked',
                canInteract && 'hover:scale-[1.02]'
              )}
            >
              <img
                src={STAGE_IMAGES[stage]}
                alt={stage}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div
                className={cn(
                  'absolute inset-0',
                  isBanned && 'bg-red-500/30 mix-blend-multiply',
                  isPicked && 'bg-emerald-500/25 mix-blend-multiply'
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/50" />

              <span
                className={cn(
                  'relative z-10 text-xs font-medium text-center leading-tight',
                  isBanned && 'text-muted-foreground line-through',
                  isPicked && 'text-success'
                )}
              >
                {stage}
              </span>

              {isBanned && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <Ban className="w-5 h-5 text-destructive" />
                  </div>
                </div>
              )}

              {isPicked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-destructive/30" />
          <span>Baneado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success/30" />
          <span>Seleccionado</span>
        </div>
      </div>
    </div>
  );
}
