import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { competitorApi } from '@/lib/api';
import { ArrowLeft, Trophy, Eye, Play } from 'lucide-react';
import type { SetSummary } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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

  const startSetMutation = useMutation({
    mutationFn: (setId: string | number) => competitorApi.startSet(setId),
    onSuccess: () => {
      toast({
        title: 'Set iniciado',
        description: 'El set ha sido marcado como en progreso',
      });
      refetchSets();
    },
    onError: (error: unknown) => {
      type ErrorWithResponse = { response?: { data?: { message?: string } } };
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as ErrorWithResponse).response?.data?.message
          : undefined;
      toast({
        title: 'Error',
        description: message || 'No se pudo iniciar el set',
        variant: 'destructive',
      });
    },
  });

  const handleStartClick = async (setId: number) => {
    try {
      await startSetMutation.mutateAsync(setId);
      // Mantener al admin en la lista de sets (no redirigir al flujo de bans)
    } catch (e) {
      // error ya manejado por onError
    }
  };

  if (eventLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-96" />
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

  type SetStatus = SetSummary['status'] | 'completed';

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

  // Verificar si un set pertenece al usuario actual
  const isUserSet = (set: SetSummary) => {
    if (!user?.startgg_user_id) return false;
    const userIdStr = String(user.startgg_user_id);
    return (
      String(set.p1.userId) === userIdStr || 
      String(set.p2.userId) === userIdStr
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {event.tournamentName || 'Super Smash Bros. Ultimate'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="sets" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sets">Sets</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Juego:</span>
                  <span className="font-semibold">Super Smash Bros. Ultimate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Torneo:</span>
                  <span className="font-semibold">{event.tournamentName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                    {event.status === 'active' ? 'Activo' : event.status === 'completed' ? 'Finalizado' : 'Próximo'}
                  </Badge>
                </div>
                {event.startAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-semibold">
                      {new Date(Number(event.startAt) * 1000).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sets" className="space-y-4">
            {setsLoading ? (
              <Card>
                <CardContent className="py-6">
                  <Skeleton className="h-64" />
                </CardContent>
              </Card>
            ) : !sets || sets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay sets disponibles para este evento</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Los sets aparecerán cuando se asignen los participantes
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
              <Card>
                <CardHeader>
                  <CardTitle>Sets del Evento</CardTitle>
                  <CardDescription>
                    Sets activos y programados ({sets.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mobile: cards (más visual, sin scroll lateral) */}
                  <div className="space-y-3 md:hidden">
                    {sets.map((set) => {
                      const status = set.status as SetStatus;
                      const statusInfo = getStatusBadge(status);
                      const userOwnsSet = isUserSet(set);

                      const action = (() => {
                        if (event.isAdmin) {
                          if (set.status === 'not_started') {
                            return (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleStartClick(Number(set.id))}
                                disabled={startSetMutation.isPending}
                                className="w-full"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Iniciar Set
                              </Button>
                            );
                          }
                          if (status === 'in_progress') {
                            return (
                              <Button size="sm" variant="default" onClick={() => navigate(`/sets/${set.id}`)} className="w-full">
                                Ver Set
                              </Button>
                            );
                          }
                          if (status === 'completed') {
                            return (
                              <Button size="sm" variant="outline" onClick={() => navigate(`/sets/${set.id}`)} className="w-full">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Resultados
                              </Button>
                            );
                          }
                        }

                        if (userOwnsSet && set.status === 'in_progress') {
                          return (
                            <Button size="sm" variant="default" onClick={() => navigate(`/sets/${set.id}?mode=player`)} className="w-full">
                              Progreso
                            </Button>
                          );
                        }

                        return (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/sets/${set.id}`)} className="w-full">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        );
                      })();

                      return (
                        <Card key={set.id}>
                          <CardHeader className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
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
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Best of</span>
                              <span className="font-medium text-foreground">{set.bestOf}</span>
                            </div>
                            {action}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ronda</TableHead>
                          <TableHead>Jugadores</TableHead>
                          <TableHead>Best of</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sets.map((set) => {
                          const status = set.status as SetStatus;
                          const statusInfo = getStatusBadge(status);
                          const userOwnsSet = isUserSet(set);
                          return (
                            <TableRow key={set.id}>
                              <TableCell className="font-medium">{set.round}</TableCell>
                              <TableCell>
                                {set.p1.name} vs {set.p2.name}
                              </TableCell>
                              <TableCell>{set.bestOf}</TableCell>
                              <TableCell>
                                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {event.isAdmin ? (
                                  <div className="flex gap-2 justify-end">
                                    {set.status === 'not_started' && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleStartClick(Number(set.id))}
                                        disabled={startSetMutation.isPending}
                                      >
                                        <Play className="h-4 w-4 mr-1" />
                                        Iniciar Set
                                      </Button>
                                    )}
                                    {status === 'in_progress' && (
                                      <Button size="sm" variant="default" onClick={() => navigate(`/sets/${set.id}`)}>
                                        Ver Set
                                      </Button>
                                    )}
                                    {status === 'completed' && (
                                      <Button size="sm" variant="outline" onClick={() => navigate(`/sets/${set.id}`)}>
                                        <Eye className="h-4 w-4 mr-1" />
                                        Ver Resultados
                                      </Button>
                                    )}
                                  </div>
                                ) : userOwnsSet ? (
                                  set.status === 'in_progress' ? (
                                    <Button size="sm" variant="default" onClick={() => navigate(`/sets/${set.id}?mode=player`)}>
                                      Progreso
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/sets/${set.id}`)}>
                                      Ver
                                    </Button>
                                  )
                                ) : (
                                  <Button size="sm" variant="ghost" onClick={() => navigate(`/sets/${set.id}`)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>Clasificación</CardTitle>
                <CardDescription>Posiciones actuales del torneo</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-10">
                  Las clasificaciones se mostrarán aquí próximamente
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
