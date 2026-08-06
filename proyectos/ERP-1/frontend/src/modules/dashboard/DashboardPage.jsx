import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded bg-muted/60 ${className}`} />
);

const trendIcon = (up) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {up
      ? <polyline points="18 15 12 9 6 15" />
      : <polyline points="6 9 12 15 18 9" />
    }
  </svg>
);

export function DashboardPage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard-exec'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
    refetchInterval: 60000,
  });

  if (isLoading) return <DashboardSkeleton />;

  const s = dash || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Ejecutivo</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen general del negocio · Última actualización momentánea
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Datos en tiempo real
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Ventas del día"
          value={formatCurrency(s.salesToday?.total)}
          subtitle={`${s.salesToday?.count || 0} transacciones`}
          icon={<DolarIcon />}
          color="blue"
        />
        <KpiCard
          title="Ventas del mes"
          value={formatCurrency(s.salesMonth?.total)}
          trend={s.salesMonth?.trend}
          trendUp
          subtitle={`${s.salesMonth?.count || 0} ventas`}
          icon={<ChartIcon />}
          color="indigo"
        />
        <KpiCard
          title="Compras del mes"
          value={formatCurrency(s.purchasesMonth?.total)}
          trend={s.purchasesMonth?.trend}
          subtitle={`${s.purchasesMonth?.count || 0} órdenes`}
          icon={<PackageIcon />}
          color="orange"
        />
        <KpiCard
          title="Ingresos"
          value={formatCurrency(s.income?.total)}
          trend={s.income?.trend}
          trendUp
          icon={<IncomeIcon />}
          color="green"
        />
        <KpiCard
          title="Egresos"
          value={formatCurrency(s.expenses?.total)}
          trend={s.expenses?.trend}
          icon={<ExpenseIcon />}
          color="red"
        />
        <KpiCard
          title="Utilidad"
          value={formatCurrency(s.profit?.total)}
          trend={s.profit?.trend}
          trendUp
          icon={<ProfitIcon />}
          color="emerald"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <div className="lg:col-span-4 rounded-xl border bg-card shadow-sm">
          <div className="px-5 py-4 border-b">
            <h3 className="text-sm font-semibold">Ventas por mes</h3>
          </div>
          <div className="p-5">
            {(!s.salesByMonth || s.salesByMonth.length === 0) ? (
              <EmptyChart />
            ) : (
              <BarChart data={s.salesByMonth} dataKey="total" labelKey="month" color="#6366f1" />
            )}
          </div>
        </div>
        <div className="lg:col-span-3 rounded-xl border bg-card shadow-sm">
          <div className="px-5 py-4 border-b">
            <h3 className="text-sm font-semibold">Ventas por categoría</h3>
          </div>
          <div className="p-5">
            {(!s.salesByCategory || s.salesByCategory.length === 0) ? (
              <EmptyChart />
            ) : (
              <HorizontalBar data={s.salesByCategory.slice(0, 8)} />
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <div className="lg:col-span-3 rounded-xl border bg-card shadow-sm">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Productos más vendidos</h3>
            <Badge variant="outline" className="text-xs">{s.topProducts?.length || 0} productos</Badge>
          </div>
          <div className="p-3">
            {(!s.topProducts || s.topProducts.length === 0) ? (
              <EmptyTable />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium text-right">Cant.</th>
                    <th className="pb-2 font-medium text-right">Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {s.topProducts.slice(0, 8).map((p, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-muted-foreground w-8">{i + 1}</td>
                      <td className="py-2.5">
                        <p className="font-medium truncate max-w-40">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </td>
                      <td className="py-2.5 text-right font-medium">{p.quantity}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <h3 className="text-sm font-semibold">Alertas</h3>
            </div>
            <div className="p-4 space-y-3">
              <AlertItem
                label="Facturas pendientes"
                value={s.alerts?.pendingInvoices || 0}
                color="orange"
                detail={`${s.alerts?.pendingInvoices || 0} facturas por cobrar`}
              />
              <AlertItem
                label="Stock crítico"
                value={s.alerts?.criticalStock || 0}
                color="red"
                detail={`${s.alerts?.criticalStock || 0} productos por debajo del mínimo`}
              />
              <AlertItem
                label="Productos agotados"
                value={s.alerts?.outOfStock || 0}
                color="destructive"
                detail={`${s.alerts?.outOfStock || 0} productos sin stock`}
              />
              <AlertItem
                label="Clientes nuevos"
                value={s.newCustomers?.count || 0}
                color="green"
                trend={s.newCustomers?.trend}
                trendUp
                detail="Este mes"
              />
            </div>
          </div>
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold">Inventario</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total productos</span>
                <span className="font-semibold">{s.inventorySummary?.totalProducts || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock saludable</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {(s.inventorySummary?.totalProducts || 0) - (s.inventorySummary?.lowStock || 0) - (s.inventorySummary?.outOfStock || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock bajo</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{s.inventorySummary?.lowStock || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Agotados</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{s.inventorySummary?.outOfStock || 0}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Stock Crítico</h3>
            <Badge variant="destructive" className="text-xs">{s.lowStockProducts?.length || 0}</Badge>
          </div>
          <div className="p-3">
            {(!s.lowStockProducts || s.lowStockProducts.length === 0) ? (
              <div className="flex flex-col items-center py-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 mb-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p className="text-sm text-muted-foreground">Todo en stock saludable</p>
              </div>
            ) : (
              <div className="space-y-2">
                {s.lowStockProducts.slice(0, 6).map((p) => {
                  const ratio = p.stock / p.minStock;
                  const isOut = p.stock <= 0;
                  const isCritical = ratio <= 0.5;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                      </div>
                      <div className="text-right ml-2">
                        <span className={`text-sm font-bold ${isOut ? 'text-red-600' : isCritical ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {p.stock}
                        </span>
                        <p className="text-[10px] text-muted-foreground">min: {p.minStock}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {s.alerts?.pendingInvoicesList?.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="px-5 py-4 border-b">
            <h3 className="text-sm font-semibold">Facturas Pendientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b bg-muted/30">
                  <th className="px-5 py-3 font-medium">Número</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {s.alerts.pendingInvoicesList.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium">{inv.number}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(inv.date).toLocaleDateString('es-PY')}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge variant={inv.status === 'issued' ? 'warning' : 'info'}>
                        {inv.status === 'issued' ? 'Emitida' : inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value, trend, trendUp, subtitle, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg ${colorMap[color] || colorMap.blue} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold tracking-tight">{value || 'Gs. 0'}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
            (trendUp && trend >= 0) || (!trendUp && trend <= 0)
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {trendIcon((trendUp && trend >= 0) || (!trendUp && trend <= 0))}
            {Math.abs(trend)}%
          </span>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}

function BarChart({ data, dataKey, labelKey, color }) {
  const maxVal = Math.max(...data.map(d => Number(d[dataKey]) || 0), 1);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return (
    <div className="flex items-end gap-1.5 h-56">
      {data.map((item, i) => {
        const val = Number(item[dataKey]) || 0;
        const pct = (val / maxVal) * 100;
        const label = item[labelKey];
        const shortLabel = months.includes(label) ? label : (label || '').substring(0, 3);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {formatCurrency(val)}
            </span>
            <div
              className="w-full rounded-t cursor-pointer transition-all duration-200 hover:opacity-80"
              style={{
                height: `${Math.max(pct, 3)}%`,
                background: `linear-gradient(180deg, ${color}88, ${color})`,
              }}
            />
            <span className="text-[10px] text-muted-foreground">{shortLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ data }) {
  const maxVal = Math.max(...data.map(d => Number(d.total) || 0), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const val = Number(item.total) || 0;
        const pct = (val / maxVal) * 100;
        const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];
        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium truncate max-w-28">{item.category}</span>
              <span className="text-muted-foreground">{formatCurrency(val)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlertItem({ label, value, color, detail, trend, trendUp }) {
  const colorMap = {
    orange: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    destructive: 'text-red-600 dark:text-red-400',
    green: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
      <div className="text-right">
        <span className={`text-lg font-bold ${colorMap[color] || ''}`}>{value}</span>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trendIcon(trendUp)} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
      <p className="text-sm">Sin datos suficientes</p>
    </div>
  );
}

function EmptyTable() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground mb-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
      <p className="text-sm text-muted-foreground">Sin datos</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-muted rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <div className="lg:col-span-4 h-72 rounded-xl bg-muted/60" />
        <div className="lg:col-span-3 h-72 rounded-xl bg-muted/60" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <div className="lg:col-span-3 h-64 rounded-xl bg-muted/60" />
        <div className="lg:col-span-2 h-64 rounded-xl bg-muted/60" />
        <div className="lg:col-span-2 h-64 rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}

function DolarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/>
    </svg>
  );
}

function IncomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}
