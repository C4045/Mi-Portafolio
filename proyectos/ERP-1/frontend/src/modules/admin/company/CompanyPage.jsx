import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

const companySchema = z.object({
  name: z.string().min(2).optional(),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  currencyCode: z.string().optional(),
  timezone: z.string().optional(),
});

const sucursalSchema = z.object({
  code: z.string().min(1, 'Requerido'),
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export function CompanyPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState(false);
  const [sucursalModal, setSucursalModal] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get('/company').then(r => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(companySchema),
  });

  const { register: regS, handleSubmit: handleS, reset: resetS, formState: { errors: errS } } = useForm({
    resolver: zodResolver(sucursalSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/company', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['company'] }); setEditing(false); },
  });

  const createSucMutation = useMutation({
    mutationFn: (data) => api.post('/company/sucursales', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['company'] }); setSucursalModal(false); resetS(); },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <PageHeader title="Empresa" description="Configuración de la empresa" action={false} />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <PageHeader
        title="Empresa"
        description="Configuración general de la empresa"
        action={false}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre Comercial</Label>
                  <Input defaultValue={company?.name} {...register('name')} />
                </div>
                <div className="space-y-2">
                  <Label>Razón Social</Label>
                  <Input defaultValue={company?.legalName} {...register('legalName')} />
                </div>
                <div className="space-y-2">
                  <Label>RUC</Label>
                  <Input defaultValue={company?.taxId} {...register('taxId')} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input defaultValue={company?.phone} {...register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={company?.email} {...register('email')} />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input defaultValue={company?.country} {...register('country')} />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input defaultValue={company?.city} {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Input defaultValue={company?.currencyCode} {...register('currencyCode')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input defaultValue={company?.address} {...register('address')} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Guardar</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Nombre', value: company?.name },
                  { label: 'Razón Social', value: company?.legalName },
                  { label: 'RUC', value: company?.taxId },
                  { label: 'Teléfono', value: company?.phone },
                  { label: 'Email', value: company?.email },
                  { label: 'País', value: company?.country },
                  { label: 'Ciudad', value: company?.city },
                  { label: 'Moneda', value: company?.currencyCode },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="text-sm font-medium">{company?.address || '—'}</p>
              </div>
              {hasPermission('admin.config') && (
                <Button variant="outline" onClick={() => { reset(company); setEditing(true); }}>Editar</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sucursales</CardTitle>
          {hasPermission('admin.config') && (
            <Button size="sm" onClick={() => { resetS({}); setSucursalModal(true); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
              Nueva
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(!company?.sucursales || company.sucursales.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin sucursales registradas</p>
          ) : (
            <div className="divide-y">
              {company.sucursales.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.code} {s.isHeadquarters && '(Casa Matriz)'}</p>
                  </div>
                  <Badge variant={s.isActive ? 'success' : 'secondary'}>
                    {s.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {sucursalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSucursalModal(false)} />
          <Card className="relative z-50 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Nueva Sucursal</h3>
              <form onSubmit={handleS((data) => createSucMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input {...regS('code')} />
                    {errS.code && <p className="text-xs text-destructive">{errS.code.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input {...regS('name')} />
                    {errS.name && <p className="text-xs text-destructive">{errS.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input {...regS('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" {...regS('email')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input {...regS('address')} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setSucursalModal(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createSucMutation.isPending}>Crear</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
