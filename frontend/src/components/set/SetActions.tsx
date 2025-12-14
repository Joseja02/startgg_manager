import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Play, Eye, Settings, Loader2 } from 'lucide-react';

interface SetActionsProps {
  status: 'not_started' | 'in_progress' | 'completed' | 'reported' | 'approved' | 'rejected';
  isAdmin: boolean;
  onStart?: () => void;
  onView?: () => void;
  onForceStatus?: (status: string) => void;
  isStarting?: boolean;
}

export function SetActions({
  status,
  isAdmin,
  onStart,
  onView,
  onForceStatus,
  isStarting = false,
}: SetActionsProps) {
  if (!isAdmin) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {status === 'not_started' && (
        <Button
          onClick={onStart}
          disabled={isStarting}
          className="bg-gradient-primary"
        >
          {isStarting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {isStarting ? 'Iniciando...' : 'Iniciar Set'}
        </Button>
      )}

      {(status === 'in_progress' || status === 'completed' || status === 'reported' || status === 'approved' || status === 'rejected') && (
        <Button onClick={onView} variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Ver Set
        </Button>
      )}

      {onForceStatus && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Forzar Estado
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onForceStatus('in_progress')}>
              En progreso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onForceStatus('completed')}>
              Completado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onForceStatus('reported')}>
              Reportado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
