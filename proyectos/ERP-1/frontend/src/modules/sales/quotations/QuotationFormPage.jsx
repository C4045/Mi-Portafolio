import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function QuotationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [form, setForm] = useState({
    customerId: '', issueDate: new Date().toISOString().split('T')[0],
    validUntil: '', notes: '',
  });
  const [items, setItems] = useState([]);

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get('/customers/list').then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-select', 'all'],
    queryFn: () => api.get('/products', { params: { limit: 200, isActive: true } }).then(r => r.data),
  });

  const { data: quoteData } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => api.get(`/quotations/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => isEditing ? api.put(`/quotations/${id}`, data) : api.post('/quotations', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotations'] }); navigate('/sales/quotations'); },
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/quotations/${id}/accept`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotations'] }); queryClient.invalidateQueries({ queryKey: ['quotation', id] }); },
  });

  const convertMutation = useMutation({
    mutationFn: () => api.post(`/quotations/${id}/convert-to-sale`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotations'] }); navigate('/sales'); },
  });

  const customers = customersData?.data || customersData || [];
  const products = productsData?.data || [];

  useEffect(() => {
    if (quoteData?.data) {
      const q = quoteData.data;
      setForm({
        customerId: q.customerId, issueDate: q.issueDate?.split('T')[0] || '',
        validUntil: q.dueDate?.split('T')[0] || '', notes: q.notes || '',
      });
      setItems(q.items.map((i) => ({
        id: i.id, productId: i.productId, productSku: i.product?.sku || '',
        productName: i.product?.name || '', quantity: i.quantity,
        unitPrice: i.unitPrice, discountRate: i.discountRate || 0, taxRate: i.taxRate || 10,
      })));
    }
  }, [quoteData]);

  const addItem = () => { setItems([...items, { productId: '', productSku: '', productName: '', quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 10 }]); };
  const removeItem = (idx) => { setItems(items.filter((_, i) => i !== idx)); };

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) { newItems[idx].productSku = prod.sku; newItems[idx].productName = prod.name; if (!newItems[idx].unitPrice) newItems[idx].unitPrice = prod.salePrice; }
    }
    setItems(newItems);
  };

  const calcItem = (item) => { const q=Number(item.quantity)||0; const p=Number(item.unitPrice)||0; const dr=Number(item.discountRate)||0; const tr=Number(item.taxRate)||0; const sub=q*p*(1-dr/100); const tax=sub*(tr/100); return {subtotal:sub, tax, total:sub+tax, discount:q*p*(dr/100)}; };
  const totals = items.reduce((acc, item) => { const t=calcItem(item); return {subtotal:acc.subtotal+t.subtotal, tax:acc.tax+t.tax, total:acc.total+t.total, discount:acc.discount+t.discount}; }, {subtotal:0, tax:0, total:0, discount:0});

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ customerId: form.customerId, issueDate: form.issueDate, validUntil: form.validUntil||null, notes: form.notes, items: items.map((item) => ({productId: item.productId, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), discountRate: Number(item.discountRate), taxRate: Number(item.taxRate)})) });
  };

  const isView = isEditing && !['draft'].includes(quoteData?.data?.status);

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight">{isView ? 'Detalle Cotización' : isEditing ? 'Editar Cotización' : 'Nueva Cotización'}</h2>
          <p className="text-sm text-muted-foreground">{quoteData?.data?.documentSerie}-{quoteData?.data?.documentNumber}</p>
        </div>
        <div className="flex gap-2">
          {isView && quoteData?.data?.status === 'draft' && <Button onClick={() => acceptMutation.mutate()}>Aceptar Cotización</Button>}
          {isView && quoteData?.data?.status === 'accepted' && <Button onClick={() => convertMutation.mutate()}>Convertir a Venta</Button>}
          {isView && <Button variant="outline" onClick={() => { api.post(`/quotations/${id}/pdf`, {}, {responseType: 'blob'}).then(r => { const u=URL.createObjectURL(new Blob([r.data])); const a=document.createElement('a'); a.href=u; a.download=`COT-${id}.pdf`; a.click(); URL.revokeObjectURL(u); }); }}>PDF</Button>}
          <Button variant="outline" onClick={() => navigate('/sales/quotations')}>Volver</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card><CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Cliente *</Label>
              {isView ? <p className="text-sm font-medium pt-1">{quoteData?.data?.customer?.businessName}</p> : (
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.customerId} onChange={(e) => setForm({...form, customerId: e.target.value})} required>
                  <option value="">Seleccionar cliente</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.businessName || `${c.firstName||''} ${c.lastName||''}`.trim() || c.documentNumber}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2"><Label>Fecha</Label>
              {isView ? <p className="text-sm pt-1">{form.issueDate}</p> : <Input type="date" value={form.issueDate} onChange={(e) => setForm({...form, issueDate: e.target.value})} required />}
            </div>
            <div className="space-y-2"><Label>Válida hasta</Label>
              {isView ? <p className="text-sm pt-1">{form.validUntil || '—'}</p> : <Input type="date" value={form.validUntil} onChange={(e) => setForm({...form, validUntil: e.target.value})} />}
            </div>
          </div>
          {!isView && <div className="space-y-2"><Label>Notas</Label><textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>}
        </CardContent></Card>

        <Card className="mt-4"><CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Productos</h3>
            {!isView && <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Agregar Producto</Button>}
          </div>
          {items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Agregá productos a la cotización</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground border-b bg-muted/30">
                  <th className="px-3 py-2 font-medium">#</th><th className="px-3 py-2 font-medium min-w-48">Producto</th>
                  <th className="px-3 py-2 font-medium text-right">Cantidad</th><th className="px-3 py-2 font-medium text-right">P. Unit.</th>
                  <th className="px-3 py-2 font-medium text-right">Dscto %</th><th className="px-3 py-2 font-medium text-right">Subtotal</th>
                  <th className="px-3 py-2 font-medium text-right">IVA</th><th className="px-3 py-2 font-medium text-right">Total</th>
                  {!isView && <th className="px-3 py-2"></th>}
                </tr></thead>
                <tbody>{items.map((item, idx) => {
                  const t = calcItem(item);
                  return (<tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 text-muted-foreground">{idx+1}</td>
                    <td className="px-3 py-2">{isView ? <div><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.productSku}</p></div> : (
                      <select className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs" value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} required>
                        <option value="">Seleccionar...</option>{products.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                      </select>
                    )}</td>
                    <td className="px-3 py-2">{isView ? <span className="text-right block">{formatNumber(item.quantity)}</span> : <Input type="number" min="0.01" step="0.01" className="h-8 w-20 text-right ml-auto" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />}</td>
                    <td className="px-3 py-2">{isView ? <span className="text-right block">{formatCurrency(item.unitPrice)}</span> : <Input type="number" min="0" step="100" className="h-8 w-24 text-right ml-auto" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} required />}</td>
                    <td className="px-3 py-2">{isView ? <span className="text-right block">{item.discountRate}%</span> : <Input type="number" min="0" max="100" step="1" className="h-8 w-16 text-right ml-auto" value={item.discountRate} onChange={(e) => updateItem(idx, 'discountRate', e.target.value)} />}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(t.subtotal)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(t.tax)}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(t.total)}</td>
                    {!isView && <td className="px-3 py-2"><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeItem(idx)}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></Button></td>}
                  </tr>);
                })}</tbody>
              </table>
            </div>
          )}
          {items.length > 0 && (<div className="border-t pt-4 mt-4 flex justify-end"><div className="space-y-1 w-64">
            {[{label:'Subtotal', value:totals.subtotal},{label:'Descuento', value:-totals.discount},{label:'IVA', value:totals.tax},{label:'TOTAL', value:totals.total, bold:true}].map((t) => (
              <div key={t.label} className="flex justify-between text-sm"><span className={t.bold?'font-bold':'text-muted-foreground'}>{t.label}</span><span className={`font-mono ${t.bold?'font-bold text-base':''}`}>{formatCurrency(t.value)}</span></div>
            ))}
          </div></div>)}
        </CardContent></Card>

        {!isView && (<div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/sales/quotations')}>Cancelar</Button>
          <Button type="submit" disabled={createMutation.isPending || items.length===0}>{createMutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cotización'}</Button>
        </div>)}
      </form>
    </div>
  );
}
