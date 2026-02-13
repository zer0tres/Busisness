import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
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
          
          {/* Placeholder para outras páginas */}
          <Route path="customers" element={<div className="p-6"><h1 className="text-2xl font-bold">Clientes</h1><p className="text-gray-600 mt-2">Em desenvolvimento...</p></div>} />
          <Route path="appointments" element={<div className="p-6"><h1 className="text-2xl font-bold">Agendamentos</h1><p className="text-gray-600 mt-2">Em desenvolvimento...</p></div>} />
          <Route path="products" element={<div className="p-6"><h1 className="text-2xl font-bold">Produtos</h1><p className="text-gray-600 mt-2">Em desenvolvimento...</p></div>} />
          <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-gray-600 mt-2">Em desenvolvimento...</p></div>} />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;