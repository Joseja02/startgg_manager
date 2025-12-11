import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trophy, Play, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { competitorApi, adminApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: competitorApi.getMyEvents,
  });
  // Filtrar eventos activos y próximos
  const activeEvents = events?.filter((event) => event.status === 'active') || [];
  const upcomingEvents = events?.filter((event) => event.status === 'upcoming') || [];

  const fetchSetsByStatus = async (status: string) => {
    if (!activeEvents || activeEvents.length === 0) return [];
    const uniqueIds = Array.from(new Set(activeEvents.map((ev) => ev.id)));
    const results = await Promise.all(
      uniqueIds.map((id) => competitorApi.getEventSets(id, { mine: 1, status }))
    );
    return results.flat();
  };

  // Obtener sets en curso del usuario para todos los eventos activos
  const { data: inProgressSets, isLoading: inProgressLoading } = useQuery({
    queryKey: ['myInProgressSets', activeEvents.map((e) => e.id).join('-') || 'none'],
    queryFn: () => fetchSetsByStatus('in_progress'),
    enabled: activeEvents.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { data: reportedSets, isLoading: reportedLoading } = useQuery({
    queryKey: ['myReportedSets', activeEvents.map((e) => e.id).join('-') || 'none'],
    queryFn: () => fetchSetsByStatus('reported'),
    enabled: activeEvents.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const filterSetsForUser = (sets?: typeof inProgressSets) => {
    if (!sets || !user) return [];
    const uid = String(user.startgg_user_id || user.id);
    return sets.filter((s) => String(s.p1?.userId) === uid || String(s.p2?.userId) === uid || !!s.isAdmin);
  };

  const myInProgressSets = filterSetsForUser(inProgressSets);
  const myReportedSets = filterSetsForUser(reportedSets);

  const isAdmin = user?.role === 'admin';

  const { data: pendingReports, isLoading: pendingReportsLoading } = useQuery({
    queryKey: ['adminPendingReports'],
    queryFn: () => adminApi.getReports({ status: 'pending' }),
    enabled: !!isAdmin,
  });

  const { data: startggAdminMap } = useQuery({
    queryKey: ['startggTournamentAdmins', activeEvents?.map((e) => e.id).join('-')],
    queryFn: async () => {
      if (!activeEvents || activeEvents.length === 0 || !user?.startgg_user_id) return {} as Record<string, boolean>;
      const eventsWithSlug = activeEvents.filter((ev) => ev.tournamentSlug || ev.tournamentName);

      if (eventsWithSlug.length === 0) {
        console.debug('admin-check skipped: no slugs');
        return {} as Record<string, boolean>;
      }

      const entries = await Promise.all(
        eventsWithSlug.map(async (ev) => {
          const slug = ev.tournamentSlug || ev.tournamentName;
          if (!slug) return [ev.id, false] as const;
          try {
            const result = await competitorApi.getEventAdminCheck(ev.id, slug);
            return [ev.id, !!result.isAdmin] as const;
          } catch (e) {
            console.warn('admin-check failed', { eventId: ev.id, error: e });
            return [ev.id, false] as const;
          }
        })
      );

      return Object.fromEntries(entries);
    },
    enabled: !!user?.startgg_user_id && activeEvents.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  useEffect(() => {
    if (!startggAdminMap || !user) return;
    const hasAdmin = Object.values(startggAdminMap).some(Boolean);
    if (hasAdmin && user.role !== 'admin') {
      queryClient.setQueryData(['user'], { ...user, role: 'admin' });
    }
  }, [startggAdminMap, user, queryClient]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido, {user?.gamerTag}
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus eventos y sets activos
          </p>
        </div>

        {/* Sets en curso */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" />
            Sets en Curso
          </h2>
          {inProgressLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : (!myInProgressSets || myInProgressSets.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Trophy className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No tienes sets en curso</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myInProgressSets.map((set) => (
                <Card key={set.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{set.round}</CardTitle>
                      <Badge className="bg-gradient-primary">En Progreso</Badge>
                    </div>
                    <CardDescription>Best of {set.bestOf}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold">{set.p1.name}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-semibold">{set.p2.name}</span>
                      </div>
                      <Button
                        onClick={() => navigate(`/sets/${set.id}`)}
                        className="w-full bg-gradient-primary"
                      >
                        Continuar Set
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reportes pendientes enviados */}
        {myReportedSets.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Reportes enviados
            </h2>
            {reportedLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myReportedSets.map((set) => (
                  <Card key={`reported-${set.id}`} className="hover:border-muted-foreground/60 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{set.round}</CardTitle>
                        <Badge variant="secondary">Pendiente de revisión</Badge>
                      </div>
                      <CardDescription>Best of {set.bestOf}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold">{set.p1.name}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-semibold">{set.p2.name}</span>
                      </div>
                      <Button
                        onClick={() => navigate(`/sets/${set.id}`)}
                        variant="outline"
                        className="w-full"
                      >
                        Ver reporte
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Reportes pendientes (Admin)
            </h2>
            {pendingReportsLoading ? (
              <Skeleton className="h-32" />
            ) : !pendingReports || pendingReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <p className="text-muted-foreground">No hay reportes pendientes</p>
                  <Button variant="ghost" className="mt-2" onClick={() => navigate('/admin/reports')}>
                    Ir a reportes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reportes pendientes</CardTitle>
                      <CardDescription>{pendingReports.length} por revisar</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/admin/reports')}>
                      Ver todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{report.eventName}</p>
                        <p className="text-xs text-muted-foreground truncate">{report.round}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {report.p1.name} vs {report.p2.name} · {report.scoreP1} - {report.scoreP2}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => navigate(`/admin/reports/${report.id}`)}>
                        Revisar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Eventos activos */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Mis Eventos Activos
          </h2>
          {eventsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeEvents.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No tienes eventos activos en este momento</p>
                </div>
              ) : (
                activeEvents.map((event) => (
                    <Card key={event.id} className="hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">
                          {event.tournamentName}
                        </p>
                        <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
                        <Badge variant="default">Activo</Badge>
                        {event.bestOf && <span>Best of {event.bestOf}</span>}
                          {startggAdminMap?.[event.id] && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary">
                              <ShieldCheck className="h-3.5 w-3.5" /> Admin torneo
                            </span>
                          )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => navigate(`/events/${event.id}`)}
                        variant="outline"
                        className="w-full"
                      >
                        Ver Evento
                      </Button>
                        {startggAdminMap?.[event.id] && (
                          <Button
                            onClick={() => navigate('/admin/reports')}
                            variant="outline"
                            className="w-full mt-2"
                          >
                            Validar reportes
                          </Button>
                        )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Próximos eventos */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-muted-foreground" />
              Próximos Eventos
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:border-muted-foreground/50 transition-colors border-dashed">
                  <CardHeader>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        {event.tournamentName}
                      </p>
                      <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
                      <Badge variant="secondary">Próximamente</Badge>
                      {event.startAt && (
                        <span className="text-xs">
                          {new Date(Number(event.startAt) * 1000).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => navigate(`/events/${event.id}`)}
                      variant="ghost"
                      className="w-full"
                    >
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
