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
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const EMPTY_FORM = {
  sku: '', name: '', barcode: '', description: '',
  categoryId: '', unitTypeId: '',
  costPrice: 0, salePrice: 0,
  minStock: 0, maxStock: 0, currentStock: 0,
  productType: 'product', isActive: true, isTracked: true,
  hasIva: true, ivaPercentage: 10,
  imageUrl: '', weight: null, volume: null,
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({ categoryId: '', stockStatus: '', isActive: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, sortBy, sortOrder, filters],
    queryFn: () => api.get('/products', {
      params: {
        page, limit: 20, search, sortBy, sortOrder,
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.stockStatus && { stockStatus: filters.stockStatus }),
        ...(filters.isActive !== '' && { isActive: filters.isActive === 'true' }),
      },
    }).then(r => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => api.get('/categories/list').then(r => r.data),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => api.get('/products/stock-alerts').then(r => r.data),
    enabled: showAlerts,
  });

  const { data: historyData } = useQuery({
    queryKey: ['product-history', selectedProduct?.id],
    queryFn: () => api.get(`/products/${selectedProduct.id}/history`).then(r => r.data),
    enabled: !!selectedProduct,
  });

  const createMutation = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/products/${editing.id}`, data)
      : api.post('/products', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setDeleteConfirm(null); },
  });

  const categories = categoriesData?.data || categoriesData || [];
  const alerts = alertsData?.data || alertsData || { lowStock: [], outOfStock: [] };
  const history = historyData?.data || historyData || [];

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setModalOpen(true); };

  const openEdit = (row) => {
    setForm({
      sku: row.sku, name: row.name, barcode: row.barcode || '', description: row.description || '',
      categoryId: row.categoryId || '', unitTypeId: row.unitTypeId || '',
      costPrice: row.costPrice, salePrice: row.salePrice,
      minStock: row.minStock, maxStock: row.maxStock, currentStock: row.currentStock,
      productType: row.productType, isActive: row.isActive, isTracked: row.isTracked,
      hasIva: row.hasIva, ivaPercentage: row.ivaPercentage,
      imageUrl: row.imageUrl || '', weight: row.weight, volume: row.volume,
    });
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      minStock: Number(form.minStock),
      maxStock: Number(form.maxStock),
      currentStock: editing ? undefined : Number(form.currentStock),
      weight: form.weight !== '' && form.weight !== null ? Number(form.weight) : null,
      volume: form.volume !== '' && form.volume !== null ? Number(form.volume) : null,
    };
    createMutation.mutate(payload);
  };

  const stockBadge = (row) => {
    if (row.currentStock <= 0) return <Badge variant="destructive" className="text-xs">Agotado</Badge>;
    if (row.currentStock <= row.minStock) return <Badge variant="warning" className="text-xs">Stock Bajo</Badge>;
    return <Badge variant="success" className="text-xs">OK</Badge>;
  };

  const columns = [
    { key: 'sku', label: 'SKU', sortable: true },
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium">{val}</p>
          {row.barcode && <p className="text-xs text-muted-foreground">Código: {row.barcode}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (val) => val?.name || '—',
    },
    {
      key: 'currentStock',
      label: 'Stock',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{formatNumber(val)}</span>
          {stockBadge(row)}
        </div>
      ),
    },
    {
      key: 'costPrice',
      label: 'Costo',
      sortable: true,
      render: (val) => <span className="text-muted-foreground">{formatCurrency(val)}</span>,
    },
    {
      key: 'salePrice',
      label: 'Precio Venta',
      sortable: true,
      render: (val) => <span className="font-medium">{formatCurrency(val)}</span>,
    },
    {
      key: 'productType',
      label: 'Tipo',
      render: (val) => <Badge variant="outline" className="text-xs">{val === 'product' ? 'Producto' : val === 'service' ? 'Servicio' : 'Combo'}</Badge>,
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (val) => <Badge variant={val ? 'success' : 'secondary'}>{val ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: () => null,
      actions: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Historial"
            onClick={() => setSelectedProduct(row)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </Button>
          {hasPermission('inventory.products') && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(row)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Eliminar" onClick={() => setDeleteConfirm(row)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleExportExcel = async () => {
    try {
      const response = await api.post('/products/export/excel', {}, {
        params: { ...(filters.categoryId && { categoryId: filters.categoryId }) },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Export error:', e); }
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.post('/products/export/pdf', {}, {
        params: { ...(filters.categoryId && { categoryId: filters.categoryId }) },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Export error:', e); }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await api.post('/products/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert(result.data?.message || 'Importación completada');
    } catch (err) {
      alert('Error al importar: ' + (err.response?.data?.message || err.message));
    }
    e.target.value = '';
  };

  const renderForm = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>SKU *</Label>
        <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Código de Barras</Label>
        <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
      </div>
      <div className="col-span-2 space-y-2">
        <Label>Nombre *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="col-span-2 space-y-2">
        <Label>Descripción</Label>
        <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Categoría</Label>
        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Sin categoría</option>
          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })}>
          <option value="product">Producto</option>
          <option value="service">Servicio</option>
          <option value="combo">Combo</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Costo</Label>
        <Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Precio Venta</Label>
        <Input type="number" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Stock Mínimo</Label>
        <Input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Stock Máximo</Label>
        <Input type="number" min="0" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} />
      </div>
      {!editing && (
        <div className="space-y-2">
          <Label>Stock Inicial</Label>
          <Input type="number" min="0" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
        </div>
      )}
      <div className="space-y-2">
        <Label>IVA %</Label>
        <Input type="number" min="0" max="100" value={form.ivaPercentage} onChange={(e) => setForm({ ...form, ivaPercentage: Number(e.target.value) })} />
      </div>
      <div className="space-y-2">
        <Label>Peso</Label>
        <Input type="number" min="0" step="0.01" value={form.weight ?? ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Volumen</Label>
        <Input type="number" min="0" step="0.01" value={form.volume ?? ''} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>URL Imagen</Label>
        <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      </div>
      <div className="space-y-2 flex items-end gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Activo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isTracked} onChange={(e) => setForm({ ...form, isTracked: e.target.checked })} />
          Controlar Stock
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.hasIva} onChange={(e) => setForm({ ...form, hasIva: e.target.checked })} />
          Tiene IVA
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de productos"
        actionLabel="Nuevo Producto"
        actionIcon
        onAction={openCreate}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <select className="h-8 rounded-md border border-input bg-transparent px-2 text-xs" value={filters.categoryId} onChange={(e) => { setFilters({ ...filters, categoryId: e.target.value }); setPage(1); }}>
          <option value="">Todas las categorías</option>
          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select className="h-8 rounded-md border border-input bg-transparent px-2 text-xs" value={filters.stockStatus} onChange={(e) => { setFilters({ ...filters, stockStatus: e.target.value }); setPage(1); }}>
          <option value="">Todo el stock</option>
          <option value="low">Stock bajo</option>
          <option value="out_of_stock">Agotados</option>
          <option value="healthy">Stock saludable</option>
        </select>
        <select className="h-8 rounded-md border border-input bg-transparent px-2 text-xs" value={filters.isActive} onChange={(e) => { setFilters({ ...filters, isActive: e.target.value }); setPage(1); }}>
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowAlerts(!showAlerts)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          Alertas de Stock
        </Button>
        <div className="ml-auto flex gap-1">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportExcel}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Exportar Excel
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportPdf}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
            Exportar PDF
          </Button>
          <div className="relative">
            <input type="file" accept=".xlsx,.xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImportExcel} />
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Importar Excel
            </Button>
          </div>
        </div>
      </div>
      {showAlerts && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Stock Bajo ({alerts.lowStock?.length || 0})
                </h4>
                {(!alerts.lowStock || alerts.lowStock.length === 0) ? (
                  <p className="text-xs text-muted-foreground">Sin alertas</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {alerts.lowStock.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                        <span className="truncate max-w-48">{p.name}</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{p.currentStock} / {p.minStock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Agotados ({alerts.outOfStock?.length || 0})
                </h4>
                {(!alerts.outOfStock || alerts.outOfStock.length === 0) ? (
                  <p className="text-xs text-muted-foreground">Sin alertas</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {alerts.outOfStock.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                        <span className="truncate max-w-48">{p.name}</span>
                        <span className="font-medium text-red-600 dark:text-red-400">0 uds.</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por SKU, nombre, código de barras..." />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <Card className="relative z-50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {renderForm()}
                <div className="flex justify-end gap-2 pt-2 border-t">
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
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar ${deleteConfirm?.name}?`}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteMutation.isPending}
      />
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <Card className="relative z-50 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Historial de Movimientos</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.name} ({selectedProduct.sku})</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>Cerrar</Button>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin movimientos registrados</p>
              ) : (
                <div className="space-y-2">
                  {history.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                      <div className="flex items-center gap-3">
                        <MovementIcon type={m.movementType} />
                        <div>
                          <p className="font-medium">{movementLabel(m.movementType)}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.warehouse?.name && `${m.warehouse.name} · `}
                            {new Date(m.createdAt).toLocaleString('es-PY')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${m.movementType?.includes('out') || m.movementType?.includes('return') ? 'text-red-600' : 'text-emerald-600'}`}>
                          {m.movementType?.includes('out') || m.movementType?.includes('return') ? '-' : '+'}{formatNumber(m.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatNumber(m.stockBefore)} → {formatNumber(m.stockAfter)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MovementIcon({ type }) {
  const icons = {
    purchase_in: <span className="text-emerald-500">📥</span>,
    sale_out: <span className="text-red-500">📤</span>,
    adjustment_in: <span className="text-blue-500">➕</span>,
    adjustment_out: <span className="text-orange-500">➖</span>,
    transfer_in: <span className="text-purple-500">↩️</span>,
    transfer_out: <span className="text-purple-500">↪️</span>,
    initial: <span className="text-gray-500">●</span>,
  };
  return icons[type] || <span>●</span>;
}

function movementLabel(type) {
  const labels = {
    purchase_in: 'Compra / Entrada',
    purchase_return: 'Devolución a Proveedor',
    sale_out: 'Venta / Salida',
    sale_return: 'Devolución de Cliente',
    transfer_in: 'Transferencia Recibida',
    transfer_out: 'Transferencia Enviada',
    adjustment_in: 'Ajuste de Entrada',
    adjustment_out: 'Ajuste de Salida',
    initial: 'Stock Inicial',
  };
  return labels[type] || type;
}
