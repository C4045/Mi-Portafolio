import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const statusBadge = (status) => {
  const map = {
    draft: { label: 'Borrador', variant: 'secondary' },
    confirmed: { label: 'Confirmado', variant: 'info' },
    fulfilled: { label: 'Cumplido', variant: 'success' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
  };
  const s = map[status] || { label: status, variant: 'outline' };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
};

export function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, sortBy, sortOrder, filters],
    queryFn: () => api.get('/orders', { params: { page, limit: 20, search, sortBy, sortOrder, ...filters } }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/orders/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); setDeleteConfirm(null); },
  });

  const columns = [
    { key: 'documentNumber', label: 'N° Pedido', sortable: true, render: (val, row) => (<div><p className="font-medium">{row.documentSerie}-{val}</p><p className="text-xs text-muted-foreground">{formatDate(row.issueDate)}</p></div>) },
    { key: 'customer', label: 'Cliente', render: (val) => val?.businessName || '—' },
    { key: 'status', label: 'Estado', render: (val) => statusBadge(val) },
    { key: 'total', label: 'Total', sortable: true, render: (val) => <span className="font-medium">{formatCurrency(val)}</span> },
    { key: 'actions', label: '', render: () => null, actions: (row) => (
      <div className="flex items-center justify-end gap-1">
        <Link to={`/sales/orders/${row.id}`}><Button variant="ghost" size="icon" className="h-8 w-8" title="Ver"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></Button></Link>
        {row.status === 'draft' && hasPermission('sales.update') && (
          <><Link to={`/sales/orders/${row.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></Button></Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Cancelar" onClick={() => setDeleteConfirm(row)}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg></Button></>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Pedidos" description="Pedidos de clientes"
        actionLabel="Nuevo Pedido" actionIcon onAction={() => navigate('/sales/orders/new')} />
      <div className="flex flex-wrap gap-2 items-center">
        <select className="h-8 rounded-md border border-input bg-transparent px-2 text-xs" value={filters.status} onChange={(e) => { setFilters({...filters, status: e.target.value}); setPage(1); }}>
          <option value="">Todos</option><option value="draft">Borrador</option><option value="confirmed">Confirmado</option><option value="fulfilled">Cumplido</option><option value="cancelled">Cancelado</option>
        </select>
        <Input type="date" className="h-8 w-36 text-xs" value={filters.dateFrom} onChange={(e) => { setFilters({...filters, dateFrom: e.target.value}); setPage(1); }} />
        <Input type="date" className="h-8 w-36 text-xs" value={filters.dateTo} onChange={(e) => { setFilters({...filters, dateTo: e.target.value}); setPage(1); }} />
      </div>
      <Card><CardContent className="p-4">
        <div className="mb-4"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por documento o cliente..." /></div>
        <DataTable columns={columns} data={data?.data || []} loading={isLoading}
          page={data?.pagination?.page || 1} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage}
          onSort={(k, o) => { setSortBy(k); setSortOrder(o); }} sortBy={sortBy} sortOrder={sortOrder} />
      </CardContent></Card>
      <ConfirmDialog open={deleteConfirm !== null} title="Cancelar Pedido" message={`¿Cancelar pedido ${deleteConfirm?.documentSerie}-${deleteConfirm?.documentNumber}?`}
        confirmLabel="Cancelar" onConfirm={() => deleteMutation.mutate(deleteConfirm.id)} onCancel={() => setDeleteConfirm(null)} loading={deleteMutation.isPending} />
    </div>
  );
}
