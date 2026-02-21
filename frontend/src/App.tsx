import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Appointments from './pages/Appointments';
import Payables from './pages/Financial/Payables';
import Receivables from './pages/Financial/Receivables';
import Invoices from './pages/Financial/Invoices';
import PublicPage from './pages/PublicPage';
import Settings from './pages/Settings';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import FinancialDashboard from './pages/Financial/Dashboard';
import FinancialTransactions from './pages/Financial/Transactions';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Rotas públicas - SEM login, SEM sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/p/:slug" element={<PublicPage />} />

        {/* Rotas protegidas - COM login e sidebar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="products" element={<Products />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="settings" element={<Settings />} />
          <Route path="financial" element={<FinancialDashboard />} />
          <Route path="financial/transactions" element={<FinancialTransactions />} />
          <Route path="financial/payables" element={<Payables />} />
          <Route path="financial/receivables" element={<Receivables />} />
          <Route path="financial/invoices" element={<Invoices />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;