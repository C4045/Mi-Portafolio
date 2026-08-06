import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function PurchaseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [form, setForm] = useState({
    supplierId: '', orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '', notes: '', status: 'draft',
  });
  const [items, setItems] = useState([]);

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => api.get('/suppliers/list').then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-select', 'all'],
    queryFn: () => api.get('/products', { params: { limit: 200, isActive: true } }).then(r => r.data),
  });

  const { data: purchaseData } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => api.get(`/purchases/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => isEditing ? api.put(`/purchases/${id}`, data) : api.post('/purchases', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); navigate('/purchases'); },
  });

  const receiveMutation = useMutation({
    mutationFn: (data) => api.post(`/purchases/${id}/receive`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); queryClient.invalidateQueries({ queryKey: ['purchase', id] }); },
  });

  const suppliers = suppliersData?.data || suppliersData || [];
  const products = productsData?.data || [];

  useEffect(() => {
    if (purchaseData?.data) {
      const p = purchaseData.data;
      setForm({
        supplierId: p.supplierId, orderDate: p.orderDate?.split('T')[0] || '',
        expectedDate: p.expectedDate?.split('T')[0] || '', notes: p.notes || '',
        status: p.status,
      });
      setItems(p.items.map((i) => ({
        id: i.id, productId: i.productId, productSku: i.product?.sku || '',
        productName: i.product?.name || '', quantity: i.quantity,
        unitCost: i.unitCost, discountRate: i.discountRate || 0,
        taxRate: i.taxRate || 10,
        _receivedQty: i.receivedQty,
      })));
    }
  }, [purchaseData]);

  const addItem = () => {
    setItems([...items, { productId: '', productSku: '', productName: '', quantity: 1, unitCost: 0, discountRate: 0, taxRate: 10 }]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };

    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        newItems[idx].productSku = prod.sku;
        newItems[idx].productName = prod.name;
        if (!newItems[idx].unitCost) newItems[idx].unitCost = prod.costPrice;
      }
    }
    setItems(newItems);
  };

  const calcItemTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unitCost) || 0;
    const dr = Number(item.discountRate) || 0;
    const tr = Number(item.taxRate) || 0;
    const subtotal = qty * cost * (1 - dr / 100);
    const tax = subtotal * (tr / 100);
    return { subtotal, tax, total: subtotal + tax, discount: qty * cost * (dr / 100) };
  };

  const totals = items.reduce((acc, item) => {
    const t = calcItemTotal(item);
    return { subtotal: acc.subtotal + t.subtotal, tax: acc.tax + t.tax, total: acc.total + t.total, discount: acc.discount + t.discount };
  }, { subtotal: 0, tax: 0, total: 0, discount: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      supplierId: form.supplierId,
      orderDate: form.orderDate,
      expectedDate: form.expectedDate || null,
      notes: form.notes,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        discountRate: Number(item.discountRate),
        taxRate: Number(item.taxRate),
      })),
    };
    createMutation.mutate(payload);
  };

  const handleReceive = () => {
    const receiveItems = purchaseData?.data?.items
      ?.filter((i) => Number(i.receivedQty) < Number(i.quantity))
      .map((i) => ({ itemId: i.id, quantity: Number(i.quantity) - Number(i.receivedQty) }));
    if (receiveItems?.length) receiveMutation.mutate({ items: receiveItems });
  };

  const isView = isEditing && !['draft'].includes(form.status);

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{isView ? 'Detalle de Orden' : isEditing ? 'Editar Orden' : 'Nueva Orden de Compra'}</h2>
          <p className="text-sm text-muted-foreground">
            {purchaseData?.data?.documentSerie}-{purchaseData?.data?.documentNumber}
          </p>
        </div>
        <div className="flex gap-2">
          {isView && (purchaseData?.data?.status === 'ordered' || purchaseData?.data?.status === 'partially_received') && (
            <Button onClick={handleReceive} disabled={receiveMutation.isPending}>
              Recibir Completo
            </Button>
          )}
          {isView && (
            <Button variant="outline" onClick={() => {
              api.post(`/purchases/${id}/pdf`, {}, { responseType: 'blob' }).then(r => {
                const url = URL.createObjectURL(new Blob([r.data]));
                const a = document.createElement('a');
                a.href = url; a.download = `OC-${id}.pdf`; a.click(); URL.revokeObjectURL(url);
              });
            }}>
              PDF
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/purchases')}>Volver</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Proveedor *</Label>
                {isView ? (
                  <p className="text-sm font-medium pt-1">{purchaseData?.data?.supplier?.businessName}</p>
                ) : (
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.businessName} ({s.documentNumber})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Fecha Orden</Label>
                {isView ? <p className="text-sm pt-1">{form.orderDate}</p>
                  : <Input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} required />}
              </div>
              <div className="space-y-2">
                <Label>Fecha Esperada</Label>
                {isView ? <p className="text-sm pt-1">{form.expectedDate || '—'}</p>
                  : <Input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />}
              </div>
            </div>

            {!isView && (
              <div className="space-y-2">
                <Label>Notas</Label>
                <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Productos</h3>
              {!isView && <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Agregar Producto</Button>}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Agregá productos a la orden</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b bg-muted/30">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium min-w-48">Producto</th>
                      <th className="px-3 py-2 font-medium text-right">Cantidad</th>
                      <th className="px-3 py-2 font-medium text-right">Costo Unit.</th>
                      <th className="px-3 py-2 font-medium text-right">Dscto %</th>
                      <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                      <th className="px-3 py-2 font-medium text-right">IVA</th>
                      <th className="px-3 py-2 font-medium text-right">Total</th>
                      {purchaseData?.data?.items?.[0]?.receivedQty !== undefined && (
                        <th className="px-3 py-2 font-medium text-right">Recibido</th>
                      )}
                      {!isView && <th className="px-3 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const t = calcItemTotal(item);
                      return (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                          <td className="px-3 py-2">
                            {isView ? (
                              <div><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.productSku}</p></div>
                            ) : (
                              <select className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs" value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} required>
                                <option value="">Seleccionar...</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isView ? <span className="text-right block">{formatNumber(item.quantity)}</span>
                              : <Input type="number" min="0.01" step="0.01" className="h-8 w-20 text-right ml-auto" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />}
                          </td>
                          <td className="px-3 py-2">
                            {isView ? <span className="text-right block">{formatCurrency(item.unitCost)}</span>
                              : <Input type="number" min="0" step="100" className="h-8 w-24 text-right ml-auto" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} required />}
                          </td>
                          <td className="px-3 py-2">
                            {isView ? <span className="text-right block">{item.discountRate}%</span>
                              : <Input type="number" min="0" max="100" step="1" className="h-8 w-16 text-right ml-auto" value={item.discountRate} onChange={(e) => updateItem(idx, 'discountRate', e.target.value)} />}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(t.subtotal)}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(t.tax)}</td>
                          <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(t.total)}</td>
                          {purchaseData?.data?.items?.[idx]?.receivedQty !== undefined && (
                            <td className="px-3 py-2 text-right font-mono text-xs">{formatNumber(purchaseData.data.items[idx].receivedQty)}</td>
                          )}
                          {!isView && (
                            <td className="px-3 py-2">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeItem(idx)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {items.length > 0 && (
              <div className="border-t pt-4 mt-4 flex justify-end">
                <div className="space-y-1 w-64">
                  {[
                    { label: 'Subtotal', value: totals.subtotal },
                    { label: 'Descuento', value: -totals.discount },
                    { label: 'IVA (prom.)', value: totals.tax },
                    { label: 'TOTAL', value: totals.total, bold: true },
                  ].map((t) => (
                    <div key={t.label} className="flex justify-between text-sm">
                      <span className={t.bold ? 'font-bold' : 'text-muted-foreground'}>{t.label}</span>
                      <span className={`font-mono ${t.bold ? 'font-bold text-base' : ''}`}>{formatCurrency(t.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!isView && (
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/purchases')}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending || items.length === 0}>
              {createMutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar Orden' : 'Crear Orden'}
            </Button>
          </div>
        )}
      </form>
      {isView && (purchaseData?.data?.status === 'ordered' || purchaseData?.data?.status === 'partially_received') && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Recepción de Mercadería</h3>
            <div className="space-y-2">
              {purchaseData.data.items.map((item) => {
                const pending = Number(item.quantity) - Number(item.receivedQty);
                if (pending <= 0) return null;
                return <ReceiveItemRow key={item.id} item={item} pending={pending} onReceive={(qty) => receiveMutation.mutate({ items: [{ itemId: item.id, quantity: qty }] })} />;
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReceiveItemRow({ item, pending, onReceive }) {
  const [qty, setQty] = useState(pending);
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border text-sm">
      <div className="flex-1">
        <p className="font-medium">{item.product?.name}</p>
        <p className="text-xs text-muted-foreground">Pedido: {formatNumber(item.quantity)} | Recibido: {formatNumber(item.receivedQty)}</p>
      </div>
      <Input type="number" min="0" max={pending} step="0.01" className="h-8 w-20 text-right"
        value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      <Button size="sm" className="h-8 text-xs" onClick={() => onReceive(Math.min(qty, pending))}
        disabled={qty <= 0 || qty > pending}>
        Recibir
      </Button>
    </div>
  );
}
