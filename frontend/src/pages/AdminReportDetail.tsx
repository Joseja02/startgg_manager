import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { GameRow } from '@/components/set/GameRow';
import { ScoreBoard } from '@/components/set/ScoreBoard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { adminApi } from '@/lib/api';
import { ArrowLeft, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['reportDetail', reportId],
    queryFn: () => adminApi.getReportDetail(reportId!),
    enabled: !!reportId,
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveReport(reportId!),
    onSuccess: () => {
      toast({
        title: 'Reporte aprobado',
        description: 'El set será enviado a start.gg',
      });
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      setTimeout(() => navigate('/admin/reports'), 1000);
    },
    onError: (error: any) => {
      toast({
        title: 'Error al aprobar',
        description: error.response?.data?.message || 'Ha ocurrido un error',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminApi.rejectReport(reportId!, reason),
    onSuccess: () => {
      toast({
        title: 'Reporte rechazado',
        description: 'El competidor será notificado',
        variant: 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      setTimeout(() => navigate('/admin/reports'), 1000);
    },
    onError: (error: any) => {
      toast({
        title: 'Error al rechazar',
        description: error.response?.data?.message || 'Ha ocurrido un error',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-96" />
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Reporte no encontrado</p>
        </div>
      </AppLayout>
    );
  }

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Debes proporcionar un motivo para rechazar',
      });
      return;
    }
    rejectMutation.mutate(rejectionReason);
  };

  const isPending = report.status === 'pending';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/reports')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{report.eventName}</h1>
            <p className="text-muted-foreground">{report.round}</p>
          </div>
          <Badge variant={report.status === 'approved' ? 'secondary' : report.status === 'rejected' ? 'destructive' : 'default'}>
            {report.status === 'approved' ? 'Aprobado' : report.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
          </Badge>
        </div>

        {/* Set Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Set</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jugadores:</span>
              <span className="font-semibold">
                {report.p1.name} vs {report.p2.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enviado por:</span>
              <span className="font-semibold">{report.submittedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-semibold">
                {new Date(report.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {report.notes && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Notas:</span>
                <p className="mt-1">{report.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score */}
        <ScoreBoard
          p1Name={report.p1.name}
          p2Name={report.p2.name}
          p1Score={report.scoreP1}
          p2Score={report.scoreP2}
          bestOf={report.games.length}
        />

        {/* Games */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Games del Set</h2>
          {report.games.map((game) => (
            <GameRow
              key={game.index}
              game={game}
              p1Name={report.p1.name}
              p2Name={report.p2.name}
              onChange={() => {}}
              readonly
            />
          ))}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex gap-4">
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="flex-1 bg-gradient-success py-6 text-lg"
              size="lg"
            >
              <Check className="mr-2 h-5 w-5" />
              {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Reporte'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1 py-6 text-lg" size="lg">
                  <X className="mr-2 h-5 w-5" />
                  Rechazar Reporte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Rechazar este reporte?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Proporciona un motivo para el rechazo. El competidor recibirá esta información.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Motivo del rechazo..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {report.status === 'rejected' && report.rejectionReason && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Motivo del Rechazo</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{report.rejectionReason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
