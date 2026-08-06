import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const EMPTY_FORM = {
  documentType: 'RUC', documentNumber: '', businessName: '',
  contactName: '', email: '', phone: '', mobile: '',
  address: '', city: '', state: '', country: 'Paraguay',
  paymentTerms: '', creditDays: 0, notes: '',
};

export function SuppliersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('businessName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search, sortBy, sortOrder],
    queryFn: () => api.get('/suppliers', { params: { page, limit: 20, search, sortBy, sortOrder } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => editing ? api.put(`/suppliers/${editing.id}`, data) : api.post('/suppliers', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteConfirm(null); },
  });

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setModalOpen(true); };

  const openEdit = (row) => {
    setForm({
      documentType: row.documentType, documentNumber: row.documentNumber, businessName: row.businessName,
      contactName: row.contactName || '', email: row.email || '', phone: row.phone || '', mobile: row.mobile || '',
      address: row.address || '', city: row.city || '', state: row.state || '', country: row.country || 'Paraguay',
      paymentTerms: row.paymentTerms || '', creditDays: row.creditDays || 0, notes: row.notes || '',
    });
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, creditDays: Number(form.creditDays) });
  };

  const columns = [
    { key: 'businessName', label: 'Razón Social', sortable: true },
    { key: 'documentNumber', label: 'Documento', sortable: true },
    { key: 'contactName', label: 'Contacto', render: (v) => v || '—' },
    { key: 'phone', label: 'Teléfono', render: (v) => v || '—' },
    { key: 'city', label: 'Ciudad', sortable: true, render: (v) => v || '—' },
    { key: 'email', label: 'Email', render: (v) => v ? <span className="text-xs">{v}</span> : '—' },
    {
      key: 'isActive', label: 'Estado',
      render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'purchasesCount', label: 'Compras',
      render: (v) => <span className="text-muted-foreground text-center block">{v}</span>,
    },
    {
      key: 'actions', label: '', render: () => null,
      actions: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteConfirm(row)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Proveedores" description="Registro de proveedores" actionLabel="Nuevo Proveedor" actionIcon onAction={openCreate} />
      <Card>
        <CardContent className="p-4">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por nombre, RUC, contacto..." />
          <div className="mt-4">
            <DataTable columns={columns} data={data?.data || []} loading={isLoading}
              page={data?.pagination?.page || 1} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage}
              onSort={(k, o) => { setSortBy(k); setSortOrder(o); }} sortBy={sortBy} sortOrder={sortOrder} />
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <Card className="relative z-50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Doc.</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
                      <option value="RUC">RUC</option><option value="CI">CI</option><option value="PASSPORT">Pasaporte</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>N° Documento</Label>
                    <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>País</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Razón Social *</Label>
                  <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Contacto</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Celular</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Ciudad</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Departamento</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Plazo (días)</Label><Input type="number" min="0" value={form.creditDays} onChange={(e) => setForm({ ...form, creditDays: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Condiciones Pago</Label><Input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>Notas</Label>
                  <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Guardando...' : 'Guardar'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog open={deleteConfirm !== null} title="Eliminar Proveedor" message={`¿Estás seguro de eliminar a ${deleteConfirm?.businessName}?`}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)} onCancel={() => setDeleteConfirm(null)} loading={deleteMutation.isPending} />
    </div>
  );
}
