import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGuard } from '@/modules/auth/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/modules/auth/LoginPage';
import { LogoutPage } from '@/modules/auth/LogoutPage';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { UsersPage } from '@/modules/admin/users/UsersPage';
import { RolesPage } from '@/modules/admin/roles/RolesPage';
import { CompanyPage } from '@/modules/admin/company/CompanyPage';
import { CategoriesPage } from '@/modules/inventory/categories/CategoriesPage';
import { ProductsPage } from '@/modules/inventory/products/ProductsPage';
import { MovementsPage } from '@/modules/inventory/movements/MovementsPage';
import { SuppliersPage } from '@/modules/crm/suppliers/SuppliersPage';
import { CustomersPage } from '@/modules/crm/customers/CustomersPage';
import { PurchasesPage } from '@/modules/purchases/PurchasesPage';
import { PurchaseFormPage } from '@/modules/purchases/PurchaseFormPage';
import { SalesPage } from '@/modules/sales/SalesPage';
import { SaleFormPage } from '@/modules/sales/SaleFormPage';
import { QuotationsPage } from '@/modules/sales/quotations/QuotationsPage';
import { QuotationFormPage } from '@/modules/sales/quotations/QuotationFormPage';
import { OrdersPage } from '@/modules/sales/orders/OrdersPage';
import { OrderFormPage } from '@/modules/sales/orders/OrderFormPage';
import { InvoicesPage } from '@/modules/sales/invoices/InvoicesPage';
import { PaymentMethodsPage } from '@/modules/admin/payment-methods/PaymentMethodsPage';
import { PermissionsPage } from '@/modules/admin/permissions/PermissionsPage';
import { AuditLogsPage } from '@/modules/audit/AuditLogsPage';
import { ChartOfAccountsPage } from '@/modules/financial/accounts/ChartOfAccountsPage';
import { JournalEntriesPage } from '@/modules/financial/journal-entries/JournalEntriesPage';
import { JournalEntryFormPage } from '@/modules/financial/journal-entries/JournalEntryFormPage';
import { ReportsPage } from '@/modules/reports/ReportsPage';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/logout" element={<LogoutPage />} />

              <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                <Route path="admin/users" element={<ProtectedRoute permission="admin.users"><UsersPage /></ProtectedRoute>} />
                <Route path="admin/roles" element={<ProtectedRoute permission="admin.roles"><RolesPage /></ProtectedRoute>} />
                <Route path="admin/permissions" element={<ProtectedRoute permission="admin.roles"><PermissionsPage /></ProtectedRoute>} />
                <Route path="admin/company" element={<ProtectedRoute permission="admin.config"><CompanyPage /></ProtectedRoute>} />
                <Route path="admin/payment-methods" element={<ProtectedRoute permission="admin.config"><PaymentMethodsPage /></ProtectedRoute>} />
                <Route path="admin/audit" element={<ProtectedRoute permission="admin.audit"><AuditLogsPage /></ProtectedRoute>} />

                <Route path="crm" element={<Navigate to="/crm/customers" replace />} />
                <Route path="crm/customers" element={<CustomersPage />} />
                <Route path="crm/suppliers" element={<SuppliersPage />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="sales/new" element={<SaleFormPage />} />
                <Route path="sales/:id" element={<SaleFormPage />} />
                <Route path="sales/:id/edit" element={<SaleFormPage />} />
                <Route path="sales/quotations" element={<QuotationsPage />} />
                <Route path="sales/quotations/new" element={<QuotationFormPage />} />
                <Route path="sales/quotations/:id" element={<QuotationFormPage />} />
                <Route path="sales/quotations/:id/edit" element={<QuotationFormPage />} />
                <Route path="sales/orders" element={<OrdersPage />} />
                <Route path="sales/orders/new" element={<OrderFormPage />} />
                <Route path="sales/orders/:id" element={<OrderFormPage />} />
                <Route path="sales/orders/:id/edit" element={<OrderFormPage />} />
                <Route path="sales/invoices" element={<InvoicesPage />} />
                <Route path="purchases" element={<PurchasesPage />} />
                <Route path="purchases/new" element={<PurchaseFormPage />} />
                <Route path="purchases/:id" element={<PurchaseFormPage />} />
                <Route path="purchases/:id/edit" element={<PurchaseFormPage />} />
                <Route path="inventory/categories" element={<CategoriesPage />} />
                <Route path="inventory/products" element={<ProductsPage />} />
                <Route path="inventory/movements" element={<MovementsPage />} />
                <Route path="financial/accounts" element={<ProtectedRoute permission="financial.read"><ChartOfAccountsPage /></ProtectedRoute>} />
                <Route path="financial/journal" element={<ProtectedRoute permission="financial.read"><JournalEntriesPage /></ProtectedRoute>} />
                <Route path="financial/journal/new" element={<ProtectedRoute permission="financial.journal_create"><JournalEntryFormPage /></ProtectedRoute>} />
                <Route path="financial/journal/:id" element={<ProtectedRoute permission="financial.read"><JournalEntryFormPage /></ProtectedRoute>} />
                <Route path="financial/journal/:id/edit" element={<ProtectedRoute permission="financial.journal_create"><JournalEntryFormPage /></ProtectedRoute>} />
                <Route path="financial/invoices" element={<Navigate to="/sales/invoices" replace />} />
                <Route path="reports" element={<ProtectedRoute permission="reports.view"><ReportsPage /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
