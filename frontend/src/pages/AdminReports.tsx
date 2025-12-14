import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi } from '@/lib/api';
import { FileCheck, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['adminReports', filter],
    queryFn: () => adminApi.getReports({ status: filter }),
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pending: { label: 'Pendiente', variant: 'default' },
      approved: { label: 'Aprobado', variant: 'secondary' },
      rejected: { label: 'Rechazado', variant: 'destructive' },
    };
    return variants[status] || { label: status, variant: 'secondary' };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes de Sets</h1>
          <p className="text-muted-foreground">Revisa y aprueba reportes de competidores</p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['adminReports'] })}
            >
              Refrescar reportes
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="approved">Aprobados</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-6">
                  <Skeleton className="h-64" />
                </CardContent>
              </Card>
            ) : !reports || reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  {filter === 'pending' ? (
                    <FileCheck className="h-12 w-12 text-muted-foreground mb-2" />
                  ) : (
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  )}
                  <p className="text-muted-foreground">
                    No hay reportes {filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobados' : 'rechazados'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Reportes {filter === 'pending' ? 'Pendientes' : filter === 'approved' ? 'Aprobados' : 'Rechazados'}</CardTitle>
                  <CardDescription>
                    {reports.length} reporte{reports.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mobile: cards */}
                  <div className="space-y-3 md:hidden">
                    {reports.map((report) => (
                      <Card key={report.id}>
                        <CardHeader className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
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
                            <div className="text-muted-foreground">Jugadores</div>
                            <div className="font-medium truncate">{report.p1.name} vs {report.p2.name}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-muted-foreground">Enviado por</div>
                              <div className="font-medium truncate">{report.submittedBy}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-muted-foreground">Fecha</div>
                              <div className="font-medium">
                                {new Date(report.createdAt).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant={filter === 'pending' ? 'default' : 'outline'}
                            onClick={() => navigate(`/admin/reports/${report.id}`)}
                            className="w-full"
                          >
                            Ver Detalle
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Evento</TableHead>
                          <TableHead>Ronda</TableHead>
                          <TableHead>Jugadores</TableHead>
                          <TableHead>Marcador</TableHead>
                          <TableHead>Enviado por</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.eventName}</TableCell>
                            <TableCell>{report.round}</TableCell>
                            <TableCell>
                              {report.p1.name} vs {report.p2.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {report.scoreP1} - {report.scoreP2}
                              </Badge>
                            </TableCell>
                            <TableCell>{report.submittedBy}</TableCell>
                            <TableCell>
                              {new Date(report.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={filter === 'pending' ? 'default' : 'outline'}
                                onClick={() => navigate(`/admin/reports/${report.id}`)}
                              >
                                Ver Detalle
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
