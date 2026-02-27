/**
 * Admin - Inventory Management Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../lib/api';
import { Package, AlertTriangle, ArrowDown, ArrowUp, History } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function AdminInventory() {
  const [tab, setTab] = useState('stock');
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'stock') {
        const res = await api.get('/inventory');
        setProducts(res.data.products);
      } else if (tab === 'logs') {
        const res = await api.get('/inventory/logs');
        setLogs(res.data.logs);
      } else {
        const res = await api.get('/inventory/low-stock');
        setLowStock(res.data.products);
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'stock', label: 'Stock Levels', icon: Package },
    { id: 'logs', label: 'Movement Log', icon: History },
    { id: 'alerts', label: 'Low Stock Alerts', icon: AlertTriangle },
  ];

  return (
    <AdminLayout title="Inventory">
      <Head><title>Inventory - Admin - JZ Waters</title></Head>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Stock Levels */}
          {tab === 'stock' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Unit</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Stock</th>
                    <th className="pb-3 font-medium">Reorder Level</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-gray-500">{p.category}</td>
                      <td className="py-3 text-gray-500">{p.unit}</td>
                      <td className="py-3">{formatCurrency(p.price)}</td>
                      <td className="py-3 font-medium">{p.stock_quantity}</td>
                      <td className="py-3 text-gray-500">{p.reorder_level}</td>
                      <td className="py-3">
                        {p.stock_quantity <= p.reorder_level ?
                          <span className="badge bg-red-100 text-red-700 flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Low</span> :
                          <span className="badge bg-green-100 text-green-700">OK</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Movement Logs */}
          {tab === 'logs' && (
            logs.length === 0 ? <EmptyState icon={History} title="No inventory logs" /> :
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Change</th>
                    <th className="pb-3 font-medium">Before → After</th>
                    <th className="pb-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-gray-500 text-xs">{formatDateTime(l.created_at)}</td>
                      <td className="py-3 font-medium">{l.product_name}</td>
                      <td className="py-3">
                        <span className={`badge ${l.change_type === 'addition' ? 'bg-green-100 text-green-700' : l.change_type === 'deduction' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {l.change_type}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`flex items-center gap-1 font-medium ${l.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {l.quantity_change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {Math.abs(l.quantity_change)}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{l.previous_quantity} → {l.new_quantity}</td>
                      <td className="py-3 text-gray-500 text-xs">{l.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Low Stock */}
          {tab === 'alerts' && (
            lowStock.length === 0 ? (
              <div className="card text-center py-12">
                <Package className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">All stock levels are OK</h3>
                <p className="text-sm text-gray-500 mt-1">No products below reorder level</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {lowStock.map(p => (
                  <div key={p.id} className="card border-l-4 border-l-red-400">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="text-sm text-gray-500">{p.category}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-sm">
                      <span>Current: <strong className="text-red-600">{p.stock_quantity}</strong></span>
                      <span>Reorder Level: <strong>{p.reorder_level}</strong></span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((p.stock_quantity / p.reorder_level) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </AdminLayout>
  );
}
