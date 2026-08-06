import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function JournalEntryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id && !window.location.pathname.endsWith('/new');

  const [form, setForm] = useState({ description: '', entryDate: new Date().toISOString().slice(0,10), referenceType: '', referenceId: '' });
  const [lines, setLines] = useState([{ accountId: '', debit: '', credit: '', description: '' }]);

  const { data: acctData } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => api.get('/accounts/list').then(r => r.data),
  });
  const accounts = acctData?.data || [];

  const { data: existingData } = useQuery({
    queryKey: ['journal-entry', id],
    queryFn: () => api.get(`/journal-entries/${id}`).then(r => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingData?.data && id && !window.location.pathname.endsWith('/new')) {
      const e = existingData.data;
      setForm({ description: e.description || '', entryDate: e.entryDate?.slice(0,10) || new Date().toISOString().slice(0,10), referenceType: e.referenceType || '', referenceId: e.referenceId || '' });
      setLines(e.lines?.map(l => ({ accountId: l.accountId, debit: String(l.debit || ''), credit: String(l.credit || ''), description: l.description || '' })) || [{ accountId: '', debit: '', credit: '', description: '' }]);
    }
  }, [existingData]);

  const mutation = useMutation({
    mutationFn: (d) => id ? api.put(`/journal-entries/${id}`, d) : api.post('/journal-entries', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['journal-entries'] }); navigate('/financial/journal'); },
  });

  const addLine = () => setLines([...lines, { accountId: '', debit: '', credit: '', description: '' }]);
  const removeLine = (i) => { if (lines.length > 1) setLines(lines.filter((_, idx) => idx !== i)); };
  const updateLine = (i, field, value) => { const copy = [...lines]; copy[i] = { ...copy[i], [field]: value }; setLines(copy); };

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      description: form.description,
      entryDate: form.entryDate ? new Date(form.entryDate) : undefined,
      referenceType: form.referenceType || undefined,
      referenceId: form.referenceId || undefined,
      lines: lines.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        description: l.description || undefined,
      })),
    };
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title={isEditing ? 'Editar Asiento Contable' : 'Nuevo Asiento Contable'} description="Registro contable de doble entrada"
        backLink="/financial/journal" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card><CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.entryDate} onChange={(e) => setForm({...form, entryDate: e.target.value})} /></div>
            <div className="space-y-2"><Label>Referencia</Label><Input value={form.referenceType} onChange={(e) => setForm({...form, referenceType: e.target.value})} placeholder="Tipo (opcional)" /></div>
            <div className="space-y-2"><Label>ID Referencia</Label><Input value={form.referenceId} onChange={(e) => setForm({...form, referenceId: e.target.value})} placeholder="ID (opcional)" /></div>
          </div>
          <div className="space-y-2"><Label>Descripción *</Label><Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required placeholder="Descripción del asiento" /></div>
        </CardContent></Card>

        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Líneas del Asiento</h4>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addLine}>+ Agregar Línea</Button>
          </div>

          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
            <div className="col-span-4">Cuenta Contable</div>
            <div className="col-span-2">Débito</div>
            <div className="col-span-2">Crédito</div>
            <div className="col-span-3">Descripción</div>
            <div className="col-span-1" />
          </div>

          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={line.accountId} onChange={(e) => updateLine(i, 'accountId', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              <div className="col-span-2"><Input type="number" step="0.01" min="0" value={line.debit} onChange={(e) => updateLine(i, 'debit', e.target.value)} placeholder="0.00" /></div>
              <div className="col-span-2"><Input type="number" step="0.01" min="0" value={line.credit} onChange={(e) => updateLine(i, 'credit', e.target.value)} placeholder="0.00" /></div>
              <div className="col-span-3"><Input value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="Detalle" /></div>
              <div className="col-span-1"><Button type="button" variant="ghost" size="sm" className="h-9 w-9 text-red-500 p-0" onClick={() => removeLine(i)} disabled={lines.length <= 1}>✕</Button></div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2 border-t text-sm font-medium">
            <span className={balanced ? 'text-green-600' : 'text-red-500'}>
              {balanced ? '✓ Balanceado' : '✗ No balanceado'}
            </span>
            <div className="flex gap-6">
              <span>Total Débito: <span className="font-mono">{totalDebit.toLocaleString()}</span></span>
              <span>Total Crédito: <span className="font-mono">{totalCredit.toLocaleString()}</span></span>
            </div>
          </div>
        </CardContent></Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/financial/journal')}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending || !balanced || !form.description}>Guardar</Button>
        </div>
      </form>
    </div>
  );
}
