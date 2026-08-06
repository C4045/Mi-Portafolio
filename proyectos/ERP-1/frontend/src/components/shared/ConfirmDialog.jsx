import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, confirmLabel = 'Confirmar', variant = 'destructive' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <Card className="relative z-50 w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
        <CardHeader>
          <CardTitle>{title || 'Confirmar acción'}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">{message}</p>
        </CardHeader>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant={variant} onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
