import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusBadge = (status) => {
  const map = { issued: { label: 'Emitida', variant: 'success' }, cancelled: { label: 'Cancelada', variant: 'destructive' } };
  const s = map[status] || { label: status, variant: 'outline' };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
};

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: () => api.get('/invoices', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const columns = [
    { key: 'invoiceNumber', label: 'N° Factura', sortable: true, render: (val, row) => (<div><p className="font-medium">{val}</p><p className="text-xs text-muted-foreground">{formatDate(row.issueDate)}</p></div>) },
    { key: 'sale', label: 'Venta', render: (val) => val ? `${val.documentSerie}-${val.documentNumber}` : '—' },
    { key: 'status', label: 'Estado', render: (val) => statusBadge(val) },
    { key: 'subtotal', label: 'Subtotal', render: (val) => <span className="text-muted-foreground">{formatCurrency(val)}</span> },
    { key: 'tax', label: 'IVA', render: (val) => <span className="text-muted-foreground">{formatCurrency(val)}</span> },
    { key: 'total', label: 'Total', sortable: true, render: (val) => <span className="font-medium">{formatCurrency(val)}</span> },
    { key: 'actions', label: '', render: () => null, actions: (row) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" title="PDF" onClick={() => { api.get(`/invoices/${row.id}/pdf`, {responseType: 'blob'}).then(r => { const u=URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a'); a.href=u; a.download=`INV-${row.id}.pdf`; a.click(); URL.revokeObjectURL(u); }); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Facturas" description="Facturas electrónicas emitidas" />
      <Card><CardContent className="p-4">
        <DataTable columns={columns} data={data?.data || []} loading={isLoading}
          page={data?.pagination?.page || 1} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      </CardContent></Card>
    </div>
  );
}
