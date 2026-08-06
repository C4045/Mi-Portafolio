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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const userSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export function UsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [assignRolesOpen, setAssignRolesOpen] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, sortBy, sortOrder],
    queryFn: () => api.get('/users', {
      params: { page, limit: 15, search, sortBy, sortOrder },
    }).then(r => r.data),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => api.get('/roles', { params: { limit: 50 } }).then(r => r.data),
    enabled: assignRolesOpen !== null,
  });

  const createMutation = useMutation({
    mutationFn: (data) => editingUser
      ? api.put(`/users/${editingUser.id}`, data)
      : api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setEditingUser(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirm(null);
    },
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }) => api.put(`/users/${id}/roles`, { roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAssignRolesOpen(null);
    },
  });

  const columns = [
    { key: 'username', label: 'Usuario', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'firstName',
      label: 'Nombre',
      sortable: true,
      render: (val, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || '—',
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (val) => (
        <Badge variant={val ? 'success' : 'secondary'}>
          {val ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (val) => (
        <div className="flex gap-1 flex-wrap">
          {(val || []).map((r) => (
            <Badge key={r.id || r.name} variant="outline" className="text-xs">
              {r.displayName || r.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Creado',
      sortable: true,
      render: (val) => formatDateTime(val),
    },
    {
      key: 'actions',
      label: '',
      render: () => null,
      actions: (row) => (
        <div className="flex items-center justify-end gap-1">
          {hasPermission('admin.users') && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => {
                  setEditingUser(row);
                  reset(row);
                  setModalOpen(true);
                }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setAssignRolesOpen(row)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600"
                onClick={() => setDeleteConfirm(row)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const onSubmit = (formData) => {
    if (editingUser) {
      delete formData.password;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios del sistema"
        actionLabel="Nuevo Usuario"
        actionIcon
        onAction={() => { setEditingUser(null); reset({}); setModalOpen(true); }}
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
            onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setModalOpen(false); setEditingUser(null); }} />
          <Card className="relative z-50 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usuario</Label>
                    <Input {...register('username')} />
                    {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" {...register('email')} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input {...register('firstName')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    <Input {...register('lastName')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input {...register('phone')} />
                  </div>
                  {!editingUser && (
                    <div className="space-y-2">
                      <Label>Contraseña</Label>
                      <Input type="password" {...register('password')} />
                      {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingUser(null); }}>Cancelar</Button>
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
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${deleteConfirm?.username}?`}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />

      {assignRolesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAssignRolesOpen(null)} />
          <Card className="relative z-50 w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Asignar Roles</h3>
              <p className="text-sm text-muted-foreground mb-4">{assignRolesOpen.username}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(rolesData?.data || []).map((role) => {
                  const isAssigned = (assignRolesOpen.roles || []).some(r => (r.id || r.role?.id) === role.id);
                  return (
                    <label key={role.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors">
                      <input
                        type="checkbox"
                        defaultChecked={isAssigned}
                        className="h-4 w-4 rounded border-gray-300"
                        onChange={(e) => {
                          const currentIds = [...((assignRolesOpen.roles || []).map(r => r.id || r.role?.id))];
                          if (e.target.checked) {
                            currentIds.push(role.id);
                          } else {
                            const idx = currentIds.indexOf(role.id);
                            if (idx > -1) currentIds.splice(idx, 1);
                          }
                          setAssignRolesOpen(prev => ({ ...prev, _roleIds: currentIds }));
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">{role.displayName}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setAssignRolesOpen(null)}>Cancelar</Button>
                <Button onClick={() => {
                  const roleIds = assignRolesOpen._roleIds || assignRolesOpen.roles?.map(r => r.id || r.role?.id) || [];
                  assignRolesMutation.mutate({ id: assignRolesOpen.id, roleIds });
                }} disabled={assignRolesMutation.isPending}>
                  {assignRolesMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
