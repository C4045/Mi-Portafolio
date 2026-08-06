import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'User', label: 'Usuario' },
  { value: 'Role', label: 'Rol' },
  { value: 'Permission', label: 'Permiso' },
  { value: 'Category', label: 'Categoría' },
  { value: 'Product', label: 'Producto' },
  { value: 'Customer', label: 'Cliente' },
  { value: 'Supplier', label: 'Proveedor' },
  { value: 'Sale', label: 'Venta' },
  { value: 'Purchase', label: 'Compra' },
  { value: 'Quotation', label: 'Cotización' },
  { value: 'Order', label: 'Pedido' },
  { value: 'Invoice', label: 'Factura' },
  { value: 'Payment', label: 'Pago' },
  { value: 'Account', label: 'Cuenta Contable' },
  { value: 'JournalEntry', label: 'Asiento Contable' },
  { value: 'Company', label: 'Empresa' },
  { value: 'Movement', label: 'Movimiento' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Creación' },
  { value: 'UPDATE', label: 'Actualización' },
  { value: 'DELETE', label: 'Eliminación' },
  { value: 'CANCEL', label: 'Anulación' },
  { value: 'CONFIRM', label: 'Confirmación' },
  { value: 'LOGIN', label: 'Inicio de sesión' },
  { value: 'LOGOUT', label: 'Cierre de sesión' },
  { value: 'REGISTER', label: 'Registro' },
  { value: 'REFRESH', label: 'Refresco de token' },
  { value: 'CHANGE_PASSWORD', label: 'Cambio de contraseña' },
  { value: 'POST', label: 'Contabilización' },
  { value: 'ACCEPT', label: 'Aceptación' },
  { value: 'CONVERT', label: 'Conversión' },
  { value: 'FULFILL', label: 'Cumplimiento' },
  { value: 'RECEIVE', label: 'Recepción' },
  { value: 'RESTORE', label: 'Restauración' },
];

function ActionBadge({ action }) {
  const variantMap = {
    CREATE: 'success', UPDATE: 'warning', DELETE: 'destructive',
    LOGIN: 'default', LOGOUT: 'secondary', REGISTER: 'success',
    CANCEL: 'destructive', CONFIRM: 'success', RECEIVE: 'success',
    POST: 'default', ACCEPT: 'success', CONVERT: 'warning',
    FULFILL: 'success', RESTORE: 'outline', REFRESH: 'secondary',
    CHANGE_PASSWORD: 'outline',
  };
  const labelMap = ACTION_OPTIONS.find(o => o.value === action) || { label: action };
  return (
    <Badge variant={variantMap[action] || 'secondary'}>
      {labelMap.label}
    </Badge>
  );
}

function DetailPopover({ oldValues, newValues }) {
  const [open, setOpen] = useState(false);
  const hasOld = oldValues && Object.keys(oldValues).length > 0;
  const hasNew = newValues && Object.keys(newValues).length > 0;
  if (!hasOld && !hasNew) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-primary hover:underline"
      >
        {hasOld && hasNew ? 'Ver cambios' : hasOld ? 'Ver anterior' : 'Ver nuevo'}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 p-3 rounded-lg border bg-popover text-popover-foreground shadow-lg text-xs min-w-[250px] right-0">
          <button onClick={() => setOpen(false)} className="float-right text-muted-foreground hover:text-foreground">&times;</button>
          {hasOld && (
            <div className="mb-2">
              <p className="font-semibold text-destructive mb-1">Valores anteriores:</p>
              <pre className="whitespace-pre-wrap">{JSON.stringify(oldValues, null, 2)}</pre>
            </div>
          )}
          {hasNew && (
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400 mb-1">Valores nuevos:</p>
              <pre className="whitespace-pre-wrap">{JSON.stringify(newValues, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entityFilter, actionFilter, search],
    queryFn: () => api.get('/audit', {
      params: { page, limit: 20, entity: entityFilter || undefined, action: actionFilter || undefined, search: search || undefined },
    }).then(r => r.data),
  });

  const columns = [
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: false,
      render: (val) => <span className="text-xs whitespace-nowrap">{formatDateTime(val)}</span>,
    },
    {
      key: 'user',
      label: 'Usuario',
      render: (val) => val ? `${val.firstName || ''} ${val.lastName || ''}`.trim() || val.email : '—',
    },
    {
      key: 'action',
      label: 'Acción',
      render: (val) => <ActionBadge action={val} />,
    },
    {
      key: 'entity',
      label: 'Entidad',
      render: (val) => {
        const opt = ENTITY_OPTIONS.find(o => o.value === val);
        return <span className="text-sm">{opt?.label || val}</span>;
      },
    },
    {
      key: 'entityId',
      label: 'ID',
      render: (val) => val ? <span className="text-xs font-mono text-muted-foreground">{val.slice(0, 8)}...</span> : '—',
    },
    {
      key: 'ipAddress',
      label: 'IP',
      render: (val) => val || '—',
    },
    {
      key: 'details',
      label: 'Detalles',
      render: (_, row) => <DetailPopover oldValues={row.oldValues} newValues={row.newValues} />,
    },
    {
      key: 'actions',
      label: '',
      render: () => null,
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader
        title="Auditoría"
        description="Registro detallado de todas las actividades del sistema"
        action={false}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por entidad, ID, IP..." />
            </div>
            <Select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="w-48">
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="w-48">
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={data?.data || []}
            loading={isLoading}
            page={data?.pagination?.page || 1}
            totalPages={data?.pagination?.totalPages || 1}
            onPageChange={setPage}
            emptyMessage="No se encontraron registros de auditoría"
          />
        </CardContent>
      </Card>
    </div>
  );
}
