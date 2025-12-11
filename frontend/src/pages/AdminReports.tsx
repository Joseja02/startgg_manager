import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
