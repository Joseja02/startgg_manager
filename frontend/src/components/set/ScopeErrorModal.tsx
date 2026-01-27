import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface ScopeErrorModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function ScopeErrorModal({ open, onClose, message }: ScopeErrorModalProps) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleReauth = () => {
    window.location.href = `${baseUrl}/auth/login`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Permisos Insuficientes
          </DialogTitle>
          <DialogDescription>
            {message || 'No tienes los permisos necesarios para realizar esta acción. Puede que necesites re-autenticarte con start.gg para obtener el scope tournament.reporter.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">¿Qué significa esto?</p>
          <p className="text-muted-foreground">
            Para iniciar o reportar sets en start.gg, necesitas autorizar a la aplicación con permisos adicionales. 
            Al re-autenticarte, se te pedirán los permisos necesarios.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleReauth} className="bg-gradient-primary">
            <ExternalLink className="mr-2 h-4 w-4" />
            Re-autenticar con start.gg
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
