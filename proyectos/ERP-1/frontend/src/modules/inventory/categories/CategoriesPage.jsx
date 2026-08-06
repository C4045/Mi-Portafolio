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
import { useAuth } from '@/context/AuthContext';

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', sortOrder: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, search],
    queryFn: () => api.get('/categories', { params: { page, limit: 20, search, sortBy: 'sortOrder', sortOrder: 'asc' } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/categories/${editing.id}`, data)
      : api.post('/categories', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setDeleteConfirm(null); },
  });

  const openCreate = () => { setForm({ code: '', name: '', description: '', sortOrder: 0 }); setEditing(null); setModalOpen(true); };

  const openEdit = (row) => { setForm({ code: row.code, name: row.name, description: row.description || '', sortOrder: row.sortOrder || 0 }); setEditing(row); setModalOpen(true); };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const columns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción', render: (v) => v || '—' },
    {
      key: 'sortOrder',
      label: 'Orden',
      sortable: true,
      render: (v) => <span className="text-muted-foreground">{v}</span>,
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (v) => <Badge variant={v ? 'success' : 'secondary'}>{v ? 'Activa' : 'Inactiva'}</Badge>,
    },
    {
      key: 'childrenCount',
      label: 'Subcat.',
      render: (v) => <span className="text-muted-foreground text-center block">{v}</span>,
    },
    {
      key: 'productsCount',
      label: 'Productos',
      render: (v) => <span className="text-muted-foreground text-center block">{v}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: () => null,
      actions: (row) => (
        <div className="flex items-center justify-end gap-1">
          {hasPermission('inventory.categories') && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteConfirm(row)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader
        title="Categorías"
        description="Administra las categorías de productos"
        actionLabel="Nueva Categoría"
        actionIcon
        onAction={openCreate}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
          </div>
          <DataTable
            columns={columns}
            data={data?.data || []}
            loading={isLoading}
            page={data?.pagination?.page || 1}
            totalPages={data?.pagination?.totalPages || 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <Card className="relative z-50 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Orden</Label>
                    <Input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar la categoría ${deleteConfirm?.name}?`}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
