import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo aprobar el reporte',
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
      });
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      setTimeout(() => navigate('/admin/reports'), 1000);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo rechazar el reporte',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Reporte no encontrado</p>
          <Button variant="outline" onClick={() => navigate('/admin/reports')} className="mt-4">
            Volver
          </Button>
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
        description: 'Debes indicar un motivo para rechazar',
      });
      return;
    }
    rejectMutation.mutate(rejectionReason);
  };

  const isPending = report.status === 'pending';

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/reports')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-display truncate">{report.round}</h1>
            <p className="text-sm text-muted-foreground truncate">{report.eventName}</p>
          </div>
          <Badge 
            variant={report.status === 'rejected' ? 'destructive' : report.status === 'approved' ? 'outline' : 'secondary'}
            className="shrink-0"
          >
            {report.status === 'approved' ? 'Aprobado' : report.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
          </Badge>
        </div>

        {/* Score Board */}
        <ScoreBoard
          p1Name={report.p1.name}
          p2Name={report.p2.name}
          p1Score={report.scoreP1}
          p2Score={report.scoreP2}
          bestOf={report.games.length}
        />

        {/* Set Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jugadores</span>
              <span className="font-medium truncate ml-2">{report.p1.name} vs {report.p2.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enviado por</span>
              <span className="font-medium">{report.submittedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">
                {new Date(report.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Games */}
        <section className="space-y-3">
          <h2 className="text-lg font-display">Games</h2>
          {report.games.map((game) => (
            <Card key={game.index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Game {game.index}</span>
                  <Badge variant="outline">{game.stage}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className={`p-2 rounded-lg text-center ${game.winner === 'p1' ? 'bg-success/10 text-success' : 'bg-muted'}`}>
                    <p className="text-xs text-muted-foreground mb-0.5">{report.p1.name}</p>
                    <p className="font-medium">{game.characterP1 || '-'}</p>
                    <p className="text-xs">{game.stocksP1} stocks</p>
                  </div>
                  <div className={`p-2 rounded-lg text-center ${game.winner === 'p2' ? 'bg-success/10 text-success' : 'bg-muted'}`}>
                    <p className="text-xs text-muted-foreground mb-0.5">{report.p2.name}</p>
                    <p className="font-medium">{game.characterP2 || '-'}</p>
                    <p className="text-xs">{game.stocksP2} stocks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Actions */}
        {isPending && (
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-5 h-5 mr-2" />
              {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Reporte'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="w-full">
                  <X className="w-5 h-5 mr-2" />
                  Rechazar Reporte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Rechazar reporte?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Indica el motivo del rechazo. El competidor será notificado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Motivo del rechazo..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {report.status === 'rejected' && report.rejectionReason && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive">Motivo del rechazo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{report.rejectionReason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
