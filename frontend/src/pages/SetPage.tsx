/**
 * SetPage - Container principal para la vista de un Set
 * 
 * Rutas:
 * - /sets/:setId - Vista Admin por defecto
 * - /sets/:setId?mode=player - Vista Player
 * 
 * Comportamiento:
 * - Admin: puede ver, iniciar y forzar estados del set
 * - Player: puede completar RPS, bans/picks, registrar games y enviar reporte
 * 
 * Test Steps:
 * 1. Acceder como admin a /sets/1 - debe mostrar controles de admin
 * 2. Acceder como player a /sets/1?mode=player - debe mostrar workflow completo
 * 3. Completar RPS, bans, picks y games
 * 4. Enviar reporte y verificar respuesta 201
 * 5. Probar con setId inexistente para ver pantalla "Set no encontrado"
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { SetHeader } from '@/components/set/SetHeader';
import { SetActions } from '@/components/set/SetActions';
import { ScoreBoard } from '@/components/set/ScoreBoard';
import { RpsPanel } from '@/components/set/RpsPanel';
import { StageGrid } from '@/components/set/StageGrid';
import { GameRow } from '@/components/set/GameRow';
import { GamesHistory } from '@/components/set/GamesHistory';
import { SetNotFound } from '@/components/set/SetNotFound';
import { ScopeErrorModal } from '@/components/set/ScopeErrorModal';
import { BestOfDialog } from '@/components/set/BestOfDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useSetData } from '@/hooks/useSetData';
import { GameRecord, StageName, STAGES, calculateScore } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

export default function SetPage() {
  const { setId } = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const mode = searchParams.get('mode');
  const isPlayerMode = mode === 'player';
  
  const {
    setDetail,
    isLoading,
    isError,
    error,
    refetch,
    startSet,
    isStarting,
    submitReport,
    isSubmitting,
  } = useSetData(setId);

  // Local state for player workflow
  const [rpsWinner, setRpsWinner] = useState<'p1' | 'p2' | null>(null);
  const [bannedStages, setBannedStages] = useState<StageName[]>([]);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [scopeErrorOpen, setScopeErrorOpen] = useState(false);
  const [scopeErrorMessage, setScopeErrorMessage] = useState('');
  const [bestOfDialogOpen, setBestOfDialogOpen] = useState(false);

  // Initialize state from server data
  useEffect(() => {
    if (setDetail) {
      if (setDetail.rpsWinner) {
        setRpsWinner(setDetail.rpsWinner);
      }
      if (setDetail.stagesBanned?.length) {
        setBannedStages(setDetail.stagesBanned);
      }
      if (setDetail.games?.length) {
        setGames(setDetail.games);
      } else if (games.length === 0) {
        setGames([{ index: 1, stage: null, winner: null, stocksP1: null, stocksP2: null }]);
      }
    }
  }, [setDetail, games.length]);

  // Determine if user can access player mode
  const canAccessPlayerMode = useMemo(() => {
    if (!setDetail || !user) return false;
    
    const userStartggId = user.startgg_user_id;
    const isP1 = setDetail.p1.userId?.toString() === userStartggId;
    const isP2 = setDetail.p2.userId?.toString() === userStartggId;
    const isAdminOrCanAccess = user.role === 'admin' || ('isAdmin' in setDetail && (setDetail as { isAdmin?: boolean }).isAdmin);
    
    return isP1 || isP2 || isAdminOrCanAccess;
  }, [setDetail, user]);

  const isAdmin = user?.role === 'admin' || ('isAdmin' in (setDetail || {}) && (setDetail as { isAdmin?: boolean })?.isAdmin);
  const showPlayerView = isPlayerMode && canAccessPlayerMode && setDetail?.status === 'in_progress';

  // Calculate scores
  const score = useMemo(() => calculateScore(games), [games]);
  const gamesNeeded = setDetail ? Math.ceil(setDetail.bestOf / 2) : 2;

  // Stage selection logic - moved before early returns to prevent conditional hook calls
  const currentGame = games[games.length - 1];
  const isGame1 = games.length === 1 && !currentGame?.stage;
  const needsStagePick = currentGame && !currentGame.stage && bannedStages.length > 0;
  
  // Calculate bans remaining - moved before early returns
  const bansRemaining = useMemo(() => {
    if (isGame1) {
      // Game 1: RPS winner bans 3, then loser bans 4 (total 7)
      const totalBansGame1 = 7;
      return Math.max(0, totalBansGame1 - bannedStages.length);
    } else {
      // Subsequent games: winner bans 3
      return Math.max(0, 3 - bannedStages.length);
    }
  }, [isGame1, bannedStages]);

  const showStageSelection = rpsWinner && currentGame && !currentGame.stage;

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  // Error / Not found state
  if (isError || !setDetail) {
    return (
      <AppLayout>
        <SetNotFound 
          eventId={setDetail?.eventId}
          onRetry={() => refetch()}
        />
      </AppLayout>
    );
  }

  // Handlers
  const handleStartSet = async (bestOf: 3 | 5) => {
    try {
      await startSet(bestOf);
      await refetch();
      setBestOfDialogOpen(false);
    } catch (err) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } } | undefined;
      if (axiosError?.response?.status === 403) {
        setScopeErrorMessage(axiosError?.response?.data?.message || '');
        setScopeErrorOpen(true);
      }
    }
  };

  const handleViewSet = () => {
    navigate(`/sets/${setId}?mode=player`);
  };

  const handleForceStatus = (status: string) => {
    toast({
      title: 'Función en desarrollo',
      description: `Forzar estado a "${status}" requiere implementación del backend`,
    });
  };

  const handleRpsComplete = (winner: 'p1' | 'p2') => {
    setRpsWinner(winner);
    toast({
      title: 'RPS completado',
      description: `${winner === 'p1' ? setDetail.p1.name : setDetail.p2.name} empieza baneando`,
    });
  };

  const handleBan = (stage: StageName) => {
    const currentGame = games[games.length - 1];
    const isGame1 = games.length === 1 && !currentGame?.stage;
    
    if (bannedStages.includes(stage)) return;
    
    const newBanned = [...bannedStages, stage];
    setBannedStages(newBanned);
    
    // Check if we should auto-pick (only one stage remaining)
    const available = STAGES.filter((s) => !newBanned.includes(s));
    if (available.length === 1) {
      handlePick(available[0]);
    }
    
    toast({ description: `${stage} baneado` });
  };

  const handlePick = (stage: StageName) => {
    const currentGame = games[games.length - 1];
    if (currentGame && !currentGame.stage) {
      const updated = [...games];
      updated[updated.length - 1] = { ...currentGame, stage };
      setGames(updated);
      toast({
        title: 'Stage seleccionado',
        description: `${stage} para Game ${currentGame.index}`,
      });
    }
  };

  const handleGameChange = (updatedGame: GameRecord) => {
    const updated = games.map((g) => (g.index === updatedGame.index ? updatedGame : g));
    setGames(updated);

    // Check if game is complete and we need to add next game
    const isComplete = updatedGame.stage && updatedGame.winner && updatedGame.characterP1 && updatedGame.characterP2;
    if (isComplete && games.length < setDetail.bestOf) {
      const newScore = calculateScore(updated);
      const hasWinner = newScore.p1 >= gamesNeeded || newScore.p2 >= gamesNeeded;

      if (!hasWinner && updated.length === games.length) {
        const lastGame = updated[updated.length - 1];
        if (lastGame.stage) {
          const nextIndex = updated.length + 1;
          setGames([...updated, { index: nextIndex, stage: null, winner: null, stocksP1: null, stocksP2: null }]);
          // Reset banned stages (winner bans 3, keep last played stage as banned)
          setBannedStages([lastGame.stage]);
        }
      }
    }
  };

  const canSubmit = () => {
    const hasWinner = score.p1 >= gamesNeeded || score.p2 >= gamesNeeded;
    const completedGames = games.filter((g) => g.stage && g.winner && g.characterP1 && g.characterP2);
    return hasWinner && completedGames.length >= Math.max(score.p1, score.p2);
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast({
        variant: 'destructive',
        title: 'Set incompleto',
        description: 'Completa todos los games antes de enviar',
      });
      return;
    }

    try {
      await submitReport({ games, notes: notes || undefined });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } } | undefined;
      if (axiosError?.response?.status === 403) {
        setScopeErrorMessage(axiosError?.response?.data?.message || '');
        setScopeErrorOpen(true);
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <SetHeader
          round={setDetail.round}
          p1Name={setDetail.p1.name}
          p2Name={setDetail.p2.name}
          bestOf={setDetail.bestOf}
          status={setDetail.status}
          eventId={setDetail.eventId}
        />

        {/* Admin Actions */}
        {isAdmin && !showPlayerView && (
          <SetActions
            status={setDetail.status}
            isAdmin={isAdmin}
            onStart={() => setBestOfDialogOpen(true)}
            onView={handleViewSet}
            onForceStatus={handleForceStatus}
            isStarting={isStarting}
          />
        )}

        {/* Refresh Controls */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Refrescar set
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            title="Ir al dashboard"
          >
            Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${setDetail.eventId}/sets`)}
            title="Ir a sets del evento"
          >
            Sets del evento
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/reports')}
            title="Ir a reportes"
          >
            Reportes
          </Button>
        </div>

        {/* Score Board */}
        <ScoreBoard
          p1Name={setDetail.p1.name}
          p2Name={setDetail.p2.name}
          p1Score={score.p1}
          p2Score={score.p2}
          bestOf={setDetail.bestOf}
        />

        {/* Player View Workflow */}
        {showPlayerView && (
          <>
            {/* RPS Panel */}
            {!rpsWinner && (
              <RpsPanel
                p1Name={setDetail.p1.name}
                p2Name={setDetail.p2.name}
                onComplete={handleRpsComplete}
              />
            )}

            {/* Stage Selection */}
            {showStageSelection && (
              <Card>
                <CardHeader>
                  <CardTitle>Selección de Stage</CardTitle>
                  <CardDescription>
                    {isGame1
                      ? 'Game 1: Proceso de bans (ganador RPS banea 3, luego perdedor banea 4)'
                      : `Game ${currentGame.index}: Ganador del game anterior banea 3, perdedor elige`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StageGrid
                    stages={STAGES}
                    bannedStages={bannedStages}
                    pickedStage={currentGame.stage}
                    mode={needsStagePick && bansRemaining === 0 ? 'pick' : 'ban'}
                    onBan={handleBan}
                    onPick={handlePick}
                    bansRemaining={bansRemaining}
                  />
                </CardContent>
              </Card>
            )}

            {/* Current Game Editor */}
            {rpsWinner && currentGame?.stage && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Game Actual</h2>
                <GameRow
                  game={currentGame}
                  p1Name={setDetail.p1.name}
                  p2Name={setDetail.p2.name}
                  onChange={handleGameChange}
                  readonly={false}
                />
              </div>
            )}

            {/* Previous Games */}
            {games.length > 1 && (
              <GamesHistory
                games={games.slice(0, -1)}
                p1Name={setDetail.p1.name}
                p2Name={setDetail.p2.name}
              />
            )}

            {/* Notes */}
            {score.p1 >= gamesNeeded || score.p2 >= gamesNeeded ? (
              <Card>
                <CardHeader>
                  <CardTitle>Notas (opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="notes">Añade comentarios sobre el set</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Buenos games, DQ de oponente, etc."
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            ) : null}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="w-full bg-gradient-primary py-6 text-lg"
              size="lg"
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte para Revisión'}
            </Button>
          </>
        )}

        {/* Admin View - Games History (readonly) */}
        {!showPlayerView && setDetail.games?.length > 0 && (
          <GamesHistory
            games={setDetail.games}
            p1Name={setDetail.p1.name}
            p2Name={setDetail.p2.name}
          />
        )}

        <BestOfDialog
          open={bestOfDialogOpen}
          onClose={() => setBestOfDialogOpen(false)}
          onConfirm={handleStartSet}
          isSubmitting={isStarting}
        />
        {/* Scope Error Modal */}
        <ScopeErrorModal
          open={scopeErrorOpen}
          onClose={() => setScopeErrorOpen(false)}
          message={scopeErrorMessage}
        />
      </div>
    </AppLayout>
  );
}
