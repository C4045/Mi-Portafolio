import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function MovementsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ movementType: '', productId: '', dateFrom: '', dateTo: '' });
  const [form, setForm] = useState({ productId: '', movementType: 'adjustment_in', quantity: 1, notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['movements', page, filters],
    queryFn: () => api.get('/movements', {
      params: {
        page, limit: 25,
        ...(filters.movementType && { movementType: filters.movementType }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      },
    }).then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => api.get('/products', { params: { limit: 200, isActive: true } }).then(r => r.data),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['movements-summary', filters],
    queryFn: () => api.get('/movements/summary', { params: { ...(filters.dateFrom && { dateFrom: filters.dateFrom }), ...(filters.dateTo && { dateTo: filters.dateTo }) } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/movements', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['movements'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); setModalOpen(false); },
  });

  const products = productsData?.data || [];
  const summary = summaryData?.data || summaryData || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const typeBadge = (type) => {
    const styles = {
      purchase_in: { label: 'Compra', variant: 'success' },
      purchase_return: { label: 'Dev. Compra', variant: 'warning' },
      sale_out: { label: 'Venta', variant: 'destructive' },
      sale_return: { label: 'Dev. Venta', variant: 'info' },
      transfer_in: { label: 'Transf. Entrada', variant: 'secondary' },
      transfer_out: { label: 'Transf. Salida', variant: 'secondary' },
      adjustment_in: { label: 'Ajuste +', variant: 'success' },
      adjustment_out: { label: 'Ajuste -', variant: 'destructive' },
      initial: { label: 'Inicial', variant: 'outline' },
    };
    const s = styles[type] || { label: type, variant: 'outline' };
    return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: true,
      render: (val) => <span className="text-xs">{formatDateTime(val)}</span>,
    },
    {
      key: 'movementType',
      label: 'Tipo',
      render: (val) => typeBadge(val),
    },
    {
      key: 'product',
      label: 'Producto',
      render: (val) => val ? <div><p className="font-medium text-sm">{val.name}</p><p className="text-xs text-muted-foreground">{val.sku}</p></div> : '—',
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      sortable: true,
      render: (val, row) => {
        const isOut = ['sale_out', 'purchase_return', 'adjustment_out', 'transfer_out'].includes(row.movementType);
        return <span className={`font-mono font-bold ${isOut ? 'text-red-600' : 'text-emerald-600'}`}>{isOut ? '-' : '+'}{formatNumber(val)}</span>;
      },
    },
    {
      key: 'stockBefore',
      label: 'Stock Anterior',
      render: (val) => <span className="font-mono text-xs">{formatNumber(val)}</span>,
    },
    {
      key: 'stockAfter',
      label: 'Stock Actual',
      render: (val) => <span className="font-mono font-medium">{formatNumber(val)}</span>,
    },
    {
      key: 'warehouse',
      label: 'Depósito',
      render: (val) => val?.name || '—',
    },
    {
      key: 'user',
      label: 'Usuario',
      render: (val) => val?.name || '—',
    },
    {
      key: 'notes',
      label: 'Notas',
      render: (val) => val || '—',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader
        title="Movimientos de Inventario"
        description="Registro de entradas, salidas y transferencias"
        actionLabel="Nuevo Movimiento"
        actionIcon
        onAction={() => { setForm({ productId: '', movementType: 'adjustment_in', quantity: 1, notes: '' }); setModalOpen(true); }}
      />
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Entradas</p>
            <p className="text-xl font-bold text-emerald-600">{formatNumber(summary.entries?.total || 0)}</p>
            <p className="text-xs text-muted-foreground">{summary.entries?.count || 0} movimientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Salidas</p>
            <p className="text-xl font-bold text-red-600">{formatNumber(summary.exits?.total || 0)}</p>
            <p className="text-xs text-muted-foreground">{summary.exits?.count || 0} movimientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Transferencias</p>
            <p className="text-xl font-bold text-purple-600">{formatNumber(summary.transfers?.total || 0)}</p>
            <p className="text-xs text-muted-foreground">{summary.transfers?.count || 0} movimientos</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select className="h-8 rounded-md border border-input bg-transparent px-2 text-xs" value={filters.movementType} onChange={(e) => { setFilters({ ...filters, movementType: e.target.value }); setPage(1); }}>
          <option value="">Todos los tipos</option>
          <option value="purchase_in">Compras</option>
          <option value="sale_out">Ventas</option>
          <option value="adjustment_in">Ajustes de Entrada</option>
          <option value="adjustment_out">Ajustes de Salida</option>
          <option value="transfer_in">Transferencias Entrada</option>
          <option value="transfer_out">Transferencias Salida</option>
        </select>
        <Input type="date" className="h-8 w-36 text-xs" value={filters.dateFrom} onChange={(e) => { setFilters({ ...filters, dateFrom: e.target.value }); setPage(1); }} placeholder="Desde" />
        <Input type="date" className="h-8 w-36 text-xs" value={filters.dateTo} onChange={(e) => { setFilters({ ...filters, dateTo: e.target.value }); setPage(1); }} placeholder="Hasta" />
      </div>

      <Card>
        <CardContent className="p-4">
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <Card className="relative z-50 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Nuevo Movimiento</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                    <option value="">Seleccionar producto</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.sku} - {p.name} (stock: {formatNumber(p.currentStock)})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Movimiento</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })}>
                      <option value="adjustment_in">Ajuste de Entrada</option>
                      <option value="adjustment_out">Ajuste de Salida</option>
                      <option value="purchase_in">Entrada por Compra</option>
                      <option value="sale_out">Salida por Venta</option>
                      <option value="transfer_in">Transferencia Entrada</option>
                      <option value="transfer_out">Transferencia Salida</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Registrando...' : 'Registrar Movimiento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
