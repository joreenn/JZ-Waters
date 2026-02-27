/**
 * Admin Dashboard Page
 * Shows summary cards, charts, recent transactions, and alerts
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../lib/api';
import { DollarSign, Droplets, Truck, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/admin');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AdminLayout title="Dashboard"><LoadingSpinner text="Loading dashboard..." /></AdminLayout>;
  if (!data) return <AdminLayout title="Dashboard"><p>Failed to load dashboard data.</p></AdminLayout>;

  const { summary, dailySales, revenueBreakdown, recentTransactions, lowStock } = data;

  const pieData = [
    { name: 'Refill', value: Number(revenueBreakdown.refill_revenue) },
    { name: 'Delivery', value: Number(revenueBreakdown.delivery_revenue) },
    { name: 'Delivery Fees', value: Number(revenueBreakdown.delivery_fees) },
  ].filter(d => d.value > 0);

  const chartData = dailySales.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
    Refill: Number(d.refill_revenue),
    Delivery: Number(d.delivery_revenue),
  }));

  return (
    <AdminLayout title="Dashboard">
      <Head><title>Admin Dashboard - JZ Waters</title></Head>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Sales Today', value: `₱${Number(summary.totalSalesToday).toFixed(2)}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'Refills Today', value: summary.totalRefillsToday, icon: Droplets, color: 'bg-blue-50 text-blue-600' },
          { label: 'Deliveries Today', value: summary.totalDeliveriesToday, icon: Truck, color: 'bg-purple-50 text-purple-600' },
          { label: 'Monthly Revenue', value: `₱${Number(summary.monthlyRevenue).toFixed(2)}`, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar Chart - Daily Sales */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₱${Number(v).toFixed(2)}`} />
              <Bar dataKey="Refill" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Delivery" stackId="a" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Revenue Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₱${Number(v).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No revenue data yet</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2">
                        <span className={`badge ${t.type === 'refill' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {t.type === 'refill' ? 'Refill' : 'Delivery'}
                        </span>
                      </td>
                      <td className="py-2">{t.customer_name}</td>
                      <td className="py-2 font-medium">₱{Number(t.total_amount).toFixed(2)}</td>
                      <td className="py-2 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No transactions yet</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            Low Stock Alerts
          </h3>
          {lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">Threshold: {p.low_stock_threshold}</p>
                  </div>
                  <span className={`text-lg font-bold ${p.stock_quantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {p.stock_quantity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">All stock levels are healthy</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
