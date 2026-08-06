import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS = { draft: 'Borrador', posted: 'Contabilizado' };
const STATUS_COLORS = { draft: 'bg-yellow-100 text-yellow-800', posted: 'bg-green-100 text-green-800' };

export function JournalEntriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['journal-entries', statusFilter],
    queryFn: () => api.get('/journal-entries', { params: { status: statusFilter || undefined } }).then(r => r.data),
  });

  const postMutation = useMutation({
    mutationFn: (id) => api.post(`/journal-entries/${id}/post`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal-entries'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/journal-entries/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal-entries'] }),
  });

  const entries = data?.data?.data || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Asientos Contables" description="Registro de asientos contables"
        actionLabel="Nuevo Asiento" actionIcon onAction={() => navigate('/financial/journal/new')} />

      <div className="flex gap-2">
        {['', 'draft', 'posted'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter(s)}>
            {s ? STATUS_LABELS[s] : 'Todos'}
          </Button>
        ))}
      </div>

      <Card><CardContent className="p-4">
        {isLoading ? <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p> :
        entries.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No hay asientos contables</p> :
        <div className="divide-y">
          {entries.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-3 flex-1">
                <span className="font-mono text-xs font-semibold">{e.entryNumber}</span>
                <div className="flex-1">
                  <p className="font-medium">{e.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.entryDate).toLocaleDateString()} | Débito: {Number(e.totalDebit).toLocaleString()} | Crédito: {Number(e.totalCredit).toLocaleString()}</p>
                </div>
                <Badge className={`text-xs ${STATUS_COLORS[e.status] || ''}`}>{STATUS_LABELS[e.status] || e.status}</Badge>
              </div>
              <div className="flex gap-1">
                {e.status === 'draft' && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => postMutation.mutate(e.id)}>Contabilizar</Button>}
                {e.status === 'draft' && <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => { if (confirm('¿Eliminar asiento?')) deleteMutation.mutate(e.id); }}>Eliminar</Button>}
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/financial/journal/${e.id}`)}>Ver</Button>
              </div>
            </div>
          ))}
        </div>}
        <p className="text-xs text-muted-foreground mt-2">Total: {total} asientos</p>
      </CardContent></Card>
    </div>
  );
}
