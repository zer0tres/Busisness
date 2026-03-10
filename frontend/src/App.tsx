import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import SubscriptionGuard from './components/SubscriptionGuard';
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
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import FinancialDashboard from './pages/Financial/Dashboard';
import FinancialTransactions from './pages/Financial/Transactions';
import Employees from './pages/Employees';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Rotas públicas - SEM login, SEM sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/p/:slug" element={<PublicPage />} />
        <Route path="/book/:slug" element={<PublicPage />} />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

        {/* Rotas protegidas - COM login e sidebar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <MainLayout />
              </SubscriptionGuard>
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
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="financial/receivables" element={<Receivables />} />
          <Route path="financial/invoices" element={<Invoices />} />
          <Route path="employees" element={<Employees />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;