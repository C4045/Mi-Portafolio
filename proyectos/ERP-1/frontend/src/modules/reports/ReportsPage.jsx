import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const REPORT_TYPES = [
  { key: 'sales', label: 'Ventas', icon: '📊' }, { key: 'purchases', label: 'Compras', icon: '📥' },
  { key: 'inventory', label: 'Inventario', icon: '📦' }, { key: 'customers', label: 'Clientes', icon: '👥' },
  { key: 'suppliers', label: 'Proveedores', icon: '🏭' }, { key: 'products', label: 'Productos', icon: '🏷️' },
  { key: 'profits', label: 'Utilidades', icon: '💰' }, { key: 'movements', label: 'Movimientos', icon: '🔄' },
  { key: 'cash', label: 'Caja', icon: '💵' }, { key: 'users', label: 'Usuarios', icon: '👤' },
  { key: 'audit', label: 'Auditoría', icon: '📋' },
];

const CHART_COLORS = ['#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'];

const COLORS = ['#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#CA8A04', '#9333EA'];

export function ReportsPage() {
  const [type, setType] = useState('sales');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 2).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [params, setParams] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['report-data', type, params],
    queryFn: () => api.get(`/reports/${type}/data`, { params }).then(r => r.data),
    enabled: true,
  });

  const report = data?.data;
  const run = () => setParams({ startDate, endDate });

  const exportPdf = () => {
    const p = new URLSearchParams(params).toString();
    api.get(`/reports/${type}/pdf?${p}`, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(new Blob([r.data])); const a = document.createElement('a'); a.href = url; a.download = `reporte-${type}.pdf`; a.click(); URL.revokeObjectURL(url);
    });
  };

  const exportExcel = () => {
    const p = new URLSearchParams(params).toString();
    api.get(`/reports/${type}/excel?${p}`, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(new Blob([r.data])); const a = document.createElement('a'); a.href = url; a.download = `reporte-${type}.xlsx`; a.click(); URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <PageHeader title="Reportes" description="Reportes ejecutivos con filtros, gráficos y exportación" />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-2">
          <Card><CardContent className="p-2 space-y-0.5">
            {REPORT_TYPES.map((rt) => (
              <button key={rt.key} onClick={() => { setType(rt.key); setParams({}); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${type === rt.key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}>
                <span>{rt.icon}</span><span>{rt.label}</span>
              </button>
            ))}
          </CardContent></Card>
        </div>
        <div className="col-span-12 lg:col-span-10 space-y-4">
          <Card><CardContent className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1"><Label className="text-xs">Desde</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs w-36" /></div>
              <div className="space-y-1"><Label className="text-xs">Hasta</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs w-36" /></div>
              <Button size="sm" className="h-8 text-xs" onClick={run}>Generar</Button>
              <div className="flex-1" />
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportPdf} disabled={!report}>PDF</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportExcel} disabled={!report}>Excel</Button>
            </div>
          </CardContent></Card>
          {report?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(report.summary).map(([key, val]) => (
                <Card key={key}><CardContent className="p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{key}</p>
                  <p className="text-lg font-bold mt-0.5">{typeof val === 'number' ? Number(val).toLocaleString() : String(val)}</p>
                </CardContent></Card>
              ))}
            </div>
          )}
          {report?.chart && report.chart.values?.length > 0 && (
            <Card><CardContent className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {report.chart.type === 'pie' ? (
                    <PieChart>
                      <Pie data={report.chart.labels.map((l, i) => ({ name: l, value: Number(report.chart.values[i]) }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                        {report.chart.labels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <BarChart data={report.chart.labels.map((l, i) => ({ label: l, value: Number(report.chart.values[i]) }))} margin={{ top: 5, right: 20, bottom: 40, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                      <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent></Card>
          )}
          <Card>
            <CardContent className="p-4">
              {isLoading ? <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p> :
              !report ? <p className="text-sm text-muted-foreground py-8 text-center">Seleccione filtros y presione Generar</p> :
              report.rows.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Sin datos para el período seleccionado</p> :
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      {report.columns.map((col, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? 'bg-muted/30' : ''}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-1.5 whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2">{report.rows.length} registros</p>
              </div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
