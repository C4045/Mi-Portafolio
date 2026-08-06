import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.get('/payment-methods').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (d) => editing ? api.put(`/payment-methods/${editing.id}`, d) : api.post('/payment-methods', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payment-methods'] }); setModalOpen(false); setEditing(null); },
  });

  const methods = data?.data || [];

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Métodos de Pago" description="Configuración de métodos de pago"
        actionLabel="Nuevo" actionIcon onAction={() => { setForm({ code: '', name: '', description: '' }); setEditing(null); setModalOpen(true); }} />
      <Card><CardContent className="p-4">
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{m.code}</Badge>
                <div><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.description || '—'}</p></div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setForm({ code: m.code, name: m.name, description: m.description || '' }); setEditing(m); setModalOpen(true); }}>Editar</Button>
              </div>
            </div>
          ))}
          {methods.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay métodos de pago</p>}
        </div>
      </CardContent></Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setModalOpen(false); setEditing(null); }} />
          <Card className="relative z-50 w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Nuevo'} Método de Pago</h3>
              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
                <div className="space-y-2"><Label>Código *</Label><Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} required disabled={!!editing} /></div>
                <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditing(null); }}>Cancelar</Button>
                  <Button type="submit" disabled={mutation.isPending}>Guardar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
