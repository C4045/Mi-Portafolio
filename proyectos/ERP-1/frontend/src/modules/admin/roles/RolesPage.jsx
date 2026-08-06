import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const roleSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  displayName: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
  level: z.coerce.number().int().min(0).max(5).optional(),
});

export function RolesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [permModalOpen, setPermModalOpen] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roleSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['roles', page, search],
    queryFn: () => api.get('/roles', { params: { page, limit: 20, search } }).then(r => r.data),
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get('/roles/permissions').then(r => r.data),
    enabled: permModalOpen !== null,
  });

  const createMutation = useMutation({
    mutationFn: (data) => editingRole
      ? api.put(`/roles/${editingRole.id}`, data)
      : api.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setModalOpen(false);
      setEditingRole(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteConfirm(null);
    },
  });

  const assignPermsMutation = useMutation({
    mutationFn: ({ id, permissionIds }) => api.put(`/roles/${id}/permissions`, { permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setPermModalOpen(null);
    },
  });

  const columns = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'displayName', label: 'Nombre Mostrar', sortable: true },
    { key: 'description', label: 'Descripción' },
    { key: 'level', label: 'Nivel', sortable: true },
    {
      key: 'isSystem',
      label: 'Sistema',
      render: (val) => val ? <Badge variant="info">Sistema</Badge> : <Badge variant="secondary">Personalizado</Badge>,
    },
    {
      key: 'userCount',
      label: 'Usuarios',
      render: (val) => <span className="font-medium">{val}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: () => null,
      actions: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => {
              setEditingRole(row);
              reset(row);
              setModalOpen(true);
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setPermModalOpen(row)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </Button>
          {!row.isSystem && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600"
              onClick={() => setDeleteConfirm(row)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const onSubmit = (formData) => createMutation.mutate(formData);

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Roles" description="Gestiona los roles y permisos del sistema" actionLabel="Nuevo Rol" actionIcon
        onAction={() => { setEditingRole(null); reset({ level: 1 }); setModalOpen(true); }}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
            </div>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setModalOpen(false); setEditingRole(null); }} />
          <Card className="relative z-50 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre interno</Label>
                  <Input {...register('name')} disabled={editingRole?.isSystem} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Nombre Mostrar</Label>
                  <Input {...register('displayName')} />
                  {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input {...register('description')} />
                </div>
                <div className="space-y-2">
                  <Label>Nivel (0-5)</Label>
                  <Input type="number" min="0" max="5" {...register('level')} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingRole(null); }}>Cancelar</Button>
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
        title="Eliminar Rol"
        message={`¿Estás seguro de eliminar el rol ${deleteConfirm?.displayName}?`}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />

      {permModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPermModalOpen(null)} />
          <Card className="relative z-50 w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95">
            <CardHeader>
              <CardTitle>Permisos: {permModalOpen.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {permissions?.data && Object.entries(permissions.data).map(([module, perms]) => (
                  <div key={module}>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">{module}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const isAssigned = (permModalOpen.permissions || []).some(p => (p.id || p.permission?.id) === perm.id);
                        return (
                          <label key={perm.id} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-accent transition-colors">
                            <input
                              type="checkbox"
                              defaultChecked={isAssigned}
                              className="h-4 w-4"
                              onChange={(e) => {
                                const currentIds = [...((permModalOpen._permIds || permModalOpen.permissions || []).map(p => p.id || p.permission?.id))];
                                if (e.target.checked) {
                                  currentIds.push(perm.id);
                                } else {
                                  const idx = currentIds.indexOf(perm.id);
                                  if (idx > -1) currentIds.splice(idx, 1);
                                }
                                setPermModalOpen(prev => ({ ...prev, _permIds: currentIds }));
                              }}
                            />
                            <span className="text-sm">{perm.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button variant="outline" onClick={() => setPermModalOpen(null)}>Cancelar</Button>
              <Button onClick={() => {
                const permIds = permModalOpen._permIds || permModalOpen.permissions?.map(p => p.id || p.permission?.id) || [];
                assignPermsMutation.mutate({ id: permModalOpen.id, permissionIds: permIds });
              }} disabled={assignPermsMutation.isPending}>
                {assignPermsMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
