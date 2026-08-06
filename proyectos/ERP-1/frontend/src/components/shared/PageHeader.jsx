import { Button } from '@/components/ui/button';

export function PageHeader({ title, description, action, actionLabel, onAction, actionIcon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action !== false && (
        <Button onClick={onAction} className="gap-2 shrink-0">
          {actionIcon && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          )}
          {actionLabel || 'Nuevo'}
        </Button>
      )}
    </div>
  );
}
