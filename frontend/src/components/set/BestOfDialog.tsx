import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BestOfDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (bestOf: 3 | 5) => void;
  isSubmitting?: boolean;
}

export function BestOfDialog({ open, onClose, onConfirm, isSubmitting = false }: BestOfDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Formato del set?</DialogTitle>
          <DialogDescription>
            Selecciona si el set será Bo3 o Bo5 antes de iniciarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => onConfirm(3)}
            disabled={isSubmitting}
            className="bg-gradient-primary"
          >
            Bo3
          </Button>
          <Button
            onClick={() => onConfirm(5)}
            disabled={isSubmitting}
            className="bg-gradient-primary"
          >
            Bo5
          </Button>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

