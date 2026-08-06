import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const TYPE_LABELS = { asset: 'Activo', liability: 'Pasivo', equity: 'Patrimonio', income: 'Ingreso', expense: 'Gasto' };
const TYPE_COLORS = { asset: 'bg-blue-100 text-blue-800', liability: 'bg-orange-100 text-orange-800', equity: 'bg-purple-100 text-purple-800', income: 'bg-green-100 text-green-800', expense: 'bg-red-100 text-red-800' };
const NATURE_LABELS = { debit: 'Débito', credit: 'Crédito' };

function AccountRow({ account, depth }) {
  const [open, setOpen] = useState(true);
  const hasChildren = account.children && account.children.length > 0;
  return (
    <>
      <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 text-sm" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        <button onClick={() => setOpen(!open)} className="w-4 text-center text-xs text-muted-foreground" disabled={!hasChildren}>
          {hasChildren ? (open ? '▾' : '▸') : '·'}
        </button>
        <span className="font-mono text-xs text-muted-foreground w-20">{account.code}</span>
        <span className="flex-1 font-medium">{account.name}</span>
        <Badge className={`text-xs ${TYPE_COLORS[account.type] || ''}`}>{TYPE_LABELS[account.type] || account.type}</Badge>
        <span className="text-xs text-muted-foreground w-14">{NATURE_LABELS[account.nature]}</span>
        <span className="text-xs text-muted-foreground w-8">Nv{account.level}</span>
      </div>
      {open && hasChildren && account.children.map((c) => <AccountRow key={c.id} account={c} depth={depth + 1} />)}
    </>
  );
}

export function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', type: 'asset', nature: 'debit', level: 1, parentId: null, description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(r => r.data),
  });

  const { data: flatList } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => api.get('/accounts/list').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (d) => editing ? api.put(`/accounts/${editing.id}`, d) : api.post('/accounts', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts'] }); queryClient.invalidateQueries({ queryKey: ['accounts-list'] }); setModalOpen(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/accounts/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accounts'] }); queryClient.invalidateQueries({ queryKey: ['accounts-list'] }); },
  });

  const accounts = data?.data || [];

  const openNew = (parentId) => {
    setForm({ code: '', name: '', type: 'asset', nature: 'debit', level: parentId ? 2 : 1, parentId, description: '' });
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Plan de Cuentas" description="Catálogo de cuentas contables"
        actionLabel="Nueva Cuenta" actionIcon onAction={() => openNew(null)} />

      <Card><CardContent className="p-4">
        {isLoading ? <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p> :
        accounts.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No hay cuentas contables</p> :
        <div className="divide-y">
          <div className="flex items-center gap-2 py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="w-4" /><span className="w-20">Código</span><span className="flex-1">Nombre</span><span className="w-24">Tipo</span><span className="w-14">Naturaleza</span><span className="w-8">Nivel</span>
          </div>
          {accounts.map((a) => <AccountRow key={a.id} account={a} depth={0} />)}
        </div>}
      </CardContent></Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setModalOpen(false); setEditing(null); }} />
          <Card className="relative z-50 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar' : 'Nueva'} Cuenta Contable</h3>
              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Código *</Label><Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} required disabled={!!editing} /></div>
                  <div className="space-y-2"><Label>Nivel</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.level} onChange={(e) => setForm({...form, level: Number(e.target.value)})}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tipo *</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                      {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Naturaleza *</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.nature} onChange={(e) => setForm({...form, nature: e.target.value})}>
                      <option value="debit">Débito</option><option value="credit">Crédito</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Cuenta Padre</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.parentId || ''} onChange={(e) => setForm({...form, parentId: e.target.value || null})}>
                    <option value="">— Sin padre —</option>
                    {(flatList?.data || []).filter(a => a.id !== editing?.id).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
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
