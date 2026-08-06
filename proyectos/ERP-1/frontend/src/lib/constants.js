export const NAVIGATION = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    module: null,
  },
  {
    title: 'CRM',
    href: '/crm',
    icon: 'Users',
    module: 'crm',
    children: [
      { title: 'Clientes', href: '/crm/customers', module: 'crm' },
      { title: 'Proveedores', href: '/crm/suppliers', module: 'crm' },
    ],
  },
  {
    title: 'Ventas',
    href: '/sales',
    icon: 'ShoppingCart',
    module: 'sales',
  },
  {
    title: 'Compras',
    href: '/purchases',
    icon: 'Package',
    module: 'purchases',
  },
  {
    title: 'Inventario',
    href: '/inventory',
    icon: 'Warehouse',
    module: 'inventory',
    children: [
      { title: 'Productos', href: '/inventory/products', module: 'inventory' },
      { title: 'Categorías', href: '/inventory/categories', module: 'inventory' },
      { title: 'Movimientos', href: '/inventory/movements', module: 'inventory' },
    ],
  },
  {
    title: 'Financiero',
    href: '/financial',
    icon: 'Landmark',
    module: 'financial',
    children: [
      { title: 'Plan de Cuentas', href: '/financial/accounts', module: 'financial' },
      { title: 'Asientos Contables', href: '/financial/journal', module: 'financial' },
      { title: 'Facturas', href: '/financial/invoices', module: 'financial' },
    ],
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: 'BarChart3',
    module: 'reports',
  },
  {
    title: 'Administración',
    href: '/admin',
    icon: 'Settings',
    module: 'admin',
    children: [
      { title: 'Usuarios', href: '/admin/users', module: 'admin' },
      { title: 'Roles', href: '/admin/roles', module: 'admin' },
      { title: 'Permisos', href: '/admin/permissions', module: 'admin' },
      { title: 'Empresa', href: '/admin/company', module: 'admin' },
      { title: 'Auditoría', href: '/admin/audit', module: 'admin' },
    ],
  },
];
