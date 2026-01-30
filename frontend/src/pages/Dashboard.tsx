import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trophy, Play, ShieldCheck, RefreshCw } from 'lucide-react';
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

  const { data: events, isLoading: eventsLoading, refetch } = useQuery({
    queryKey: ['myEvents'],
    queryFn: competitorApi.getMyEvents,
  });

  const activeEvents = events?.filter((event) => event.status === 'active') || [];
  const upcomingEvents = events?.filter((event) => event.status === 'upcoming') || [];
  const adminEvents = activeEvents.filter((event) => event.isAdmin);

  const isAdmin = user?.role === 'admin';
  const adminEventId = useMemo(() => {
    const fromStorage = sessionStorage.getItem('admin_event_id');
    if (fromStorage) return fromStorage;
    return adminEvents[0]?.id ? String(adminEvents[0].id) : '';
  }, [adminEvents]);

  const { data: pendingReports, isLoading: pendingReportsLoading } = useQuery({
    queryKey: ['adminPendingReports', adminEventId],
    queryFn: () => adminApi.getReports({ status: 'pending', eventId: adminEventId }),
    enabled: !!isAdmin && !!adminEventId,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-display tracking-tight">
            Hola, {user?.gamerTag || 'Player'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tus eventos y sets
          </p>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>

        {/* Admin: Pending Reports */}
        {isAdmin && (
          <section className="space-y-3">
            <h2 className="text-lg font-display flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Reportes pendientes
            </h2>
            {!adminEventId ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <Trophy className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Selecciona un evento admin para ver reportes</p>
                </CardContent>
              </Card>
            ) : pendingReportsLoading ? (
              <Skeleton className="h-24" />
            ) : !pendingReports || pendingReports.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <Trophy className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Sin reportes pendientes</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {pendingReports.length} por revisar
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        sessionStorage.setItem('admin_event_id', adminEventId);
                        navigate(`/admin/reports?eventId=${adminEventId}`);
                      }}
                    >
                      Ver todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingReports.slice(0, 2).map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        if (adminEventId) {
                          sessionStorage.setItem('admin_event_id', adminEventId);
                        }
                        navigate(`/admin/reports/${report.id}${adminEventId ? `?eventId=${adminEventId}` : ''}`);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 transition-all active:scale-[0.98]"
                    >
                      <p className="text-sm font-medium truncate">{report.round}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {report.p1.name} vs {report.p2.name} · {report.scoreP1} - {report.scoreP2}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Active Events */}
        <section className="space-y-3">
          <h2 className="text-lg font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Eventos activos
          </h2>
          {eventsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : activeEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">
                  No tienes eventos activos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeEvents.map((event) => (
                <Card key={event.id} className="border-primary/20 hover:border-primary/40 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {event.tournamentName}
                        </p>
                        <CardTitle className="text-base truncate">{event.name}</CardTitle>
                      </div>
                      <Badge variant="default" className="shrink-0">Activo</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Best of {event.bestOf}</span>
                      {event.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => navigate(`/events/${event.id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      Ver evento
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              Próximos eventos
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="border-dashed opacity-80">
                  <CardHeader className="pb-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {event.tournamentName}
                    </p>
                    <CardTitle className="text-base truncate">{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="muted">Próximamente</Badge>
                      {event.startAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(Number(event.startAt) * 1000).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
