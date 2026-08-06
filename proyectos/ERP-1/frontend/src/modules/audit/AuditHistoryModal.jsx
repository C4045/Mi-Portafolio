import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

const ACTION_VARIANTS = {
  CREATE: 'success', UPDATE: 'warning', DELETE: 'destructive',
  CANCEL: 'destructive', CONFIRM: 'success', LOGIN: 'default',
  LOGOUT: 'secondary', POST: 'default', ACCEPT: 'success',
};

const ACTION_LABELS = {
  CREATE: 'Creación', UPDATE: 'Actualización', DELETE: 'Eliminación',
  CANCEL: 'Anulación', CONFIRM: 'Confirmación', LOGIN: 'Inicio sesión',
  LOGOUT: 'Cierre sesión', POST: 'Contabilización', ACCEPT: 'Aceptación',
};

function ChangeDiff({ oldValues, newValues }) {
  const hasOld = oldValues && typeof oldValues === 'object' && Object.keys(oldValues).length > 0;
  const hasNew = newValues && typeof newValues === 'object' && Object.keys(newValues).length > 0;
  if (!hasOld && !hasNew) return <span className="text-xs text-muted-foreground">Sin detalles</span>;

  const allKeys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);

  return (
    <div className="text-xs space-y-0.5">
      {Array.from(allKeys).map((key) => {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
        if (!changed && hasOld && hasNew) return null;
        return (
          <div key={key} className="grid grid-cols-3 gap-2 py-0.5 border-b border-border/40 last:border-0">
            <span className="font-medium text-muted-foreground">{key}</span>
            <span className="text-destructive line-through">{oldVal != null ? String(oldVal) : '—'}</span>
            <span className="text-green-600 dark:text-green-400">{newVal != null ? String(newVal) : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AuditHistoryModal({ entity, entityId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-history', entity, entityId],
    queryFn: () => api.get(`/audit/${entity}/${entityId}`).then(r => r.data),
    enabled: !!entity && !!entityId,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-50 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Historial de Cambios</h3>
              <p className="text-sm text-muted-foreground">
                {entity} — {entityId?.slice(0, 8)}...
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg border p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (!data?.data || data.data.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground mb-3">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                </svg>
                <p className="text-sm text-muted-foreground">Sin registros de auditoría</p>
              </div>
            )}

            {!isLoading && (data?.data || []).map((log) => (
              <div key={log.id} className="rounded-lg border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={ACTION_VARIANTS[log.action] || 'secondary'}>
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email : 'Sistema'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                </div>
                {log.ipAddress && (
                  <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>
                )}
                <ChangeDiff oldValues={log.oldValues} newValues={log.newValues} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
