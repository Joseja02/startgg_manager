import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SetHeaderProps {
  round: string;
  p1Name: string;
  p2Name: string;
  bestOf: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'reported' | 'approved' | 'rejected';
  eventId?: string | number;
}

const statusConfig = {
  not_started: { label: 'Sin iniciar', variant: 'secondary' as const },
  in_progress: { label: 'En progreso', variant: 'default' as const },
  completed: { label: 'Completado', variant: 'outline' as const },
  reported: { label: 'Reportado', variant: 'outline' as const },
  approved: { label: 'Aprobado', variant: 'default' as const },
  rejected: { label: 'Rechazado', variant: 'destructive' as const },
};

export function SetHeader({ round, p1Name, p2Name, bestOf, status, eventId }: SetHeaderProps) {
  const navigate = useNavigate();
  const config = statusConfig[status];

  const handleBack = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={handleBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{round}</h1>
          <Badge variant={config.variant} className={status === 'in_progress' ? 'bg-gradient-primary' : ''}>
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <Users className="h-4 w-4" />
          <span className="font-medium">{p1Name}</span>
          <span>vs</span>
          <span className="font-medium">{p2Name}</span>
          <span className="text-xs">• Bo{bestOf}</span>
        </div>
      </div>
    </div>
  );
}
