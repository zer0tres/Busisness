import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, X, TrendingDown } from 'lucide-react';
import api from '../services/api';
import type { Product } from '../types';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';
import TableSkeleton from '../components/TableSkeleton';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const [formData, setFormData] = useState({
    name: '', description: '', quantity: 0, min_quantity: 0, unit: 'un',
    cost_price: 0, sale_price: 0, category: '', sku: '', barcode: ''
  });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch { toast.error('Erro ao carregar produtos'); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?search=${search}`);
      setProducts(res.data.products || []);
    } catch { toast.error('Erro ao buscar produtos'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, description: product.description || '',
        quantity: product.quantity, min_quantity: product.min_quantity,
        unit: product.unit, cost_price: product.cost_price || 0,
        sale_price: product.sale_price || 0, category: product.category || '',
        sku: product.sku || '', barcode: product.barcode || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', quantity: 0, min_quantity: 0, unit: 'un', cost_price: 0, sale_price: 0, category: '', sku: '', barcode: '' });
    }
    setShowModal(true);
  };

  const handleClose = () => { setShowModal(false); setEditingProduct(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = toast.loading(editingProduct ? 'Salvando...' : 'Criando produto...');
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Produto atualizado!', { id: tid });
      } else {
        await api.post('/products', formData);
        toast.success('Produto criado!', { id: tid });
      }
      handleClose();
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar produto', { id: tid });
    }
  };

  const handleDelete = async (id: number) => {
    const tid = toast.loading('Excluindo...');
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto excluído!', { id: tid });
      setDeleteModal({ isOpen: false, product: null });
      loadProducts();
    } catch { toast.error('Erro ao excluir', { id: tid }); }
  };

  if (loading) return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Produtos</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <TableSkeleton rows={5} columns={6} />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Gerencie seu estoque</p>
        </div>
        <button onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg transition text-sm md:text-base">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Novo Produto</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nome, código ou código de barras..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
          <button onClick={handleSearch} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm">Buscar</button>
        </div>
      </div>

      {/* ── MOBILE: Cards ── */}
      <div className="md:hidden space-y-3">
        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">Nenhum produto encontrado</p>
          </div>
        ) : products.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                {p.sku && <p className="text-xs text-gray-400">Cód: {p.sku}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleOpenModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteModal({ isOpen: true, product: p })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium ${p.is_low_stock ? 'text-red-600' : 'text-gray-700'}`}>
                  {p.quantity} {p.unit}
                </span>
                {p.is_low_stock && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                <span className="text-xs text-gray-400">(mín: {p.min_quantity})</span>
              </div>
              <div className="text-right">
                {p.sale_price ? <p className="text-sm font-semibold text-gray-800">R$ {p.sale_price.toFixed(2)}</p> : null}
                {p.cost_price ? <p className="text-xs text-gray-400">Custo: R$ {p.cost_price.toFixed(2)}</p> : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: Tabela ── */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Produto', 'Código', 'Estoque', 'Preço Custo', 'Preço Venda', 'Ações'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider last:text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.category && <div className="text-sm text-gray-500">{p.category}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.sku || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-medium ${p.is_low_stock ? 'text-red-600' : 'text-gray-900'}`}>{p.quantity} {p.unit}</span>
                    {p.is_low_stock && <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="text-xs text-gray-500">Mín: {p.min_quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{p.cost_price ? `R$ ${p.cost_price.toFixed(2)}` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{p.sale_price ? `R$ ${p.sale_price.toFixed(2)}` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteModal({ isOpen: true, product: p })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código (SKU)</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="PROD-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras</label>
                  <input type="text" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unidade *</label>
                  <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required>
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="l">Litro (l)</option>
                    <option value="m">Metro (m)</option>
                    <option value="cx">Caixa (cx)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade *</label>
                  <input type="number" min="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estoque Mínimo *</label>
                  <input type="number" min="0" value={formData.min_quantity} onChange={e => setFormData({ ...formData, min_quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Custo</label>
                  <input type="number" min="0" step="0.01" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Venda</label>
                  <input type="number" min="0" step="0.01" value={formData.sale_price} onChange={e => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="0.00" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition text-sm">{editingProduct ? 'Salvar' : 'Criar Produto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={deleteModal.isOpen} title="Excluir Produto"
        message={`Tem certeza que deseja excluir ${deleteModal.product?.name}?`}
        confirmText="Excluir" cancelText="Cancelar" type="danger"
        onConfirm={() => deleteModal.product && handleDelete(deleteModal.product.id)}
        onCancel={() => setDeleteModal({ isOpen: false, product: null })} />
    </div>
  );
}
