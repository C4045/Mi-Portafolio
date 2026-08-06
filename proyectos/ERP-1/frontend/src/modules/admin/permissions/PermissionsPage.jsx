import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ module: '', action: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['permissions-all'],
    queryFn: () => api.get('/permissions').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/permissions', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permissions-all'] }); setModalOpen(false); setForm({ module: '', action: '', description: '' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/permissions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permissions-all'] }); setDeleteConfirm(null); },
  });

  const permissionsByModule = data?.data || {};
  const total = Object.values(permissionsByModule).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Permisos" description="Gestión dinámica de permisos del sistema"
        actionLabel="Nuevo Permiso" actionIcon onAction={() => setModalOpen(true)} />

      <Card><CardContent className="p-4">
        {isLoading ? <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p> :
        total === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No hay permisos</p> :
        <div className="space-y-6">
          {Object.entries(permissionsByModule).map(([module, perms]) => (
            <div key={module}>
              <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                {module}
                <Badge variant="outline" className="text-xs">{perms.length}</Badge>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {perms.map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm group hover:bg-accent transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{perm.action}</Badge>
                      <span className="text-xs text-muted-foreground truncate">{perm.name}</span>
                    </div>
                    {hasPermission('admin.roles') && (
                      <button className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        onClick={() => setDeleteConfirm(perm)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>}
        <p className="text-xs text-muted-foreground mt-4">Total: {total} permisos</p>
      </CardContent></Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setModalOpen(false); setForm({ module: '', action: '', description: '' }); }} />
          <Card className="relative z-50 w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Nuevo Permiso</h3>
              <p className="text-xs text-muted-foreground mb-4">Los permisos se crean con el formato <strong>módulo.acción</strong>. Se asignan automáticamente al rol Administrador.</p>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Módulo *</Label><Input value={form.module} onChange={(e) => setForm({...form, module: e.target.value})} placeholder="ej. inventory" required /></div>
                  <div className="space-y-2"><Label>Acción *</Label><Input value={form.action} onChange={(e) => setForm({...form, action: e.target.value})} placeholder="ej. audit" required /></div>
                </div>
                <div className="space-y-2"><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div className="rounded bg-muted p-2 text-xs text-muted-foreground">
                  Nombre: <strong>{form.module}.{form.action}</strong>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setForm({ module: '', action: '', description: '' }); }}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>Crear</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Eliminar Permiso"
        message={`¿Estás seguro de eliminar el permiso ${deleteConfirm?.name}?`}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
