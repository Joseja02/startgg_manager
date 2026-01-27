import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SetNotFoundProps {
  eventId?: string | number;
  onRetry?: () => void;
}

export function SetNotFound({ eventId, onRetry }: SetNotFoundProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Set no encontrado</CardTitle>
          <CardDescription>
            El set que buscas no existe o no tienes permisos para verlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          )}
          <Button onClick={handleBack} className="bg-gradient-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {eventId ? 'Volver al Evento' : 'Volver al Dashboard'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
