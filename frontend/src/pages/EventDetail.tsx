import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { competitorApi } from '@/lib/api';
import { ArrowLeft, Trophy, Eye, Play, RefreshCw } from 'lucide-react';
import type { SetSummary } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BestOfDialog } from '@/components/set/BestOfDialog';

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingStartSetId, setPendingStartSetId] = useState<SetSummary['id'] | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => competitorApi.getEvent(eventId!),
    enabled: !!eventId,
  });

  const { data: sets, isLoading: setsLoading, refetch: refetchSets } = useQuery<SetSummary[]>({
    queryKey: ['eventSets', eventId],
    queryFn: () => competitorApi.getEventSets(eventId!),
    enabled: !!eventId,
  });

  const { data: adminCheck } = useQuery({
    queryKey: ['eventAdminCheck', eventId],
    queryFn: () => competitorApi.getEventAdminCheck(eventId!, event?.tournamentSlug),
    enabled: !!eventId && !!event && user?.role !== 'admin',
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (adminCheck?.isAdmin && user?.role !== 'admin') {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  }, [adminCheck?.isAdmin, queryClient, user?.role]);

  const startSetMutation = useMutation({
    mutationFn: ({ setId, bestOf }: { setId: string | number; bestOf: 3 | 5 }) =>
      competitorApi.startSet(setId, bestOf),
    onSuccess: () => {
      toast({
        title: 'Set iniciado',
        description: 'El set ha sido marcado como en progreso',
      });
      refetchSets();
      setPendingStartSetId(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el set',
        variant: 'destructive',
      });
    },
  });

  const handleConfirmStart = (bestOf: 3 | 5) => {
    if (!pendingStartSetId) return;
    startSetMutation.mutate({ setId: pendingStartSetId, bestOf });
  };

  if (eventLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Evento no encontrado</p>
        </div>
      </AppLayout>
    );
  }

  type SetStatus = SetSummary['status'];

  const getStatusBadge = (status: SetStatus) => {
    const variants: Record<SetStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      in_progress: { label: 'En Progreso', variant: 'default' },
      not_started: { label: 'No Iniciado', variant: 'secondary' },
      completed: { label: 'Completado', variant: 'outline' },
      reported: { label: 'Reportado', variant: 'outline' },
      approved: { label: 'Aprobado', variant: 'outline' },
      rejected: { label: 'Rechazado', variant: 'outline' },
    };
    return variants[status];
  };

  const isUserSet = (set: SetSummary) => {
    if (!user?.startgg_user_id) return false;
    const userIdStr = String(user.startgg_user_id);
    return String(set.p1.userId) === userIdStr || String(set.p2.userId) === userIdStr;
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0 mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{event.tournamentName}</p>
            <h1 className="text-xl font-display truncate">{event.name}</h1>
          </div>
        </div>

        {/* Sets List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display">Sets</h2>
            <Button variant="ghost" size="sm" onClick={() => refetchSets()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {setsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : !sets || sets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trophy className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center text-sm">
                  No hay sets disponibles
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sets.map((set) => {
                const status = set.status;
                const canEditRejected = set.reportStatus === 'rejected' && set.status !== 'not_started';
                const statusInfo = getStatusBadge(status);
                const userOwnsSet = isUserSet(set);

                return (
                  <Card key={set.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">{set.round}</CardTitle>
                          <CardDescription className="truncate">
                            {set.p1.name} vs {set.p2.name}
                          </CardDescription>
                        </div>
                        <Badge variant={statusInfo.variant} className="shrink-0">
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Best of {set.bestOf}</span>
                      </div>

                      {/* Actions based on role and status */}
                      {event.isAdmin ? (
                        <div className="space-y-2">
                          {set.status === 'not_started' && (
                            <Button
                              onClick={() => setPendingStartSetId(set.id)}
                              disabled={startSetMutation.isPending}
                              className="w-full gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Iniciar Set
                            </Button>
                          )}
                          {set.status === 'in_progress' && (
                            <Button
                              onClick={() => navigate(`/sets/${set.id}`)}
                              className="w-full"
                            >
                              Ver Set
                            </Button>
                          )}
                          {canEditRejected && userOwnsSet && (
                            <Button
                              onClick={() => navigate(`/sets/${set.id}?mode=player&edit=1`)}
                              className="w-full"
                            >
                              Editar Reporte
                            </Button>
                          )}
                          {(set.status === 'completed' || set.status === 'reported' || set.status === 'approved') && (
                            <Button
                              onClick={() => navigate(`/sets/${set.id}`)}
                              variant="outline"
                              className="w-full gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Resultados
                            </Button>
                          )}
                        </div>
                      ) : userOwnsSet && (set.status === 'in_progress' || canEditRejected) ? (
                        <Button
                          onClick={() =>
                            navigate(`/sets/${set.id}?mode=player${canEditRejected ? '&edit=1' : ''}`)
                          }
                          className="w-full"
                        >
                          {canEditRejected ? 'Editar Reporte' : 'Reportar Set'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => navigate(`/sets/${set.id}`)}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <BestOfDialog
        open={pendingStartSetId !== null}
        onClose={() => setPendingStartSetId(null)}
        onConfirm={handleConfirmStart}
        isSubmitting={startSetMutation.isPending}
      />
    </AppLayout>
  );
}
