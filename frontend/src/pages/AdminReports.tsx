import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';
import { FileCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AdminReports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || sessionStorage.getItem('admin_event_id') || '';

  useEffect(() => {
    if (eventId) {
      sessionStorage.setItem('admin_event_id', eventId);
    }
  }, [eventId]);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['adminReports', filter, eventId],
    queryFn: () => adminApi.getReports({ status: filter, eventId }),
    enabled: !!eventId,
  });

  const filters = [
    { value: 'pending' as const, label: 'Pendientes' },
    { value: 'approved' as const, label: 'Aprobados' },
    { value: 'rejected' as const, label: 'Rechazados' },
  ];

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-display">Reportes</h1>
          <p className="text-sm text-muted-foreground">Revisa y aprueba reportes de sets</p>
        </div>

        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['adminReports'] })}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-gaming">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all touch-target',
                filter === f.value
                  ? 'bg-gradient-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {!eventId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-center">
                Selecciona un evento para ver sus reportes
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              {filter === 'pending' ? (
                <FileCheck className="w-10 h-10 text-muted-foreground mb-3" />
              ) : (
                <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
              )}
              <p className="text-muted-foreground text-center">
                No hay reportes {filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobados' : 'rechazados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{report.round}</CardTitle>
                      <CardDescription className="truncate">{report.eventName}</CardDescription>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {report.scoreP1} - {report.scoreP2}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Jugadores</p>
                    <p className="font-medium truncate">{report.p1.name} vs {report.p2.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Enviado por</p>
                      <p className="font-medium truncate">{report.submittedBy}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Fecha</p>
                      <p className="font-medium">
                        {new Date(report.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(`/admin/reports/${report.id}${eventId ? `?eventId=${eventId}` : ''}`)}
                    className={cn('w-full', filter === 'pending' ? '' : 'bg-muted text-foreground hover:bg-muted/80')}
                    variant={filter === 'pending' ? 'default' : 'outline'}
                  >
                    {filter === 'pending' ? 'Revisar' : 'Ver Detalle'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
