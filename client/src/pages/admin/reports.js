/**
 * Admin - Reports & Analytics Page
 */
import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FileText, Download, Calendar, TrendingUp, Box, Receipt, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#0ea5e9', '#22c55e'];
const EMPTY_REPORT = {
  summary: {
    total_revenue: 0,
    total_transactions: 0,
    average_order_value: 0,
    top_product_name: null,
    refill_transactions: 0,
    delivery_transactions: 0,
    refill_revenue: 0,
    delivery_revenue: 0,
  },
  insights: {},
  trends: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  top_products: [],
};

export default function AdminReports() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/analytics', { params: dateRange });
      setReport(res.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/reports/export/csv', {
        params: { date_from: dateRange.start_date, date_to: dateRange.end_date, type: 'all' },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${dateRange.start_date}-to-${dateRange.end_date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded');
    } catch { toast.error('Failed to export CSV'); }
  };

  const exportPDF = async () => {
    try {
      const res = await api.get('/reports/export/pdf', {
        params: { date_from: dateRange.start_date, date_to: dateRange.end_date },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${dateRange.start_date}-to-${dateRange.end_date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to export PDF'); }
  };

  const dailyData = report?.trends?.daily || [];
  const weeklyData = report?.trends?.weekly || [];
  const monthlyData = report?.trends?.monthly || [];
  const topProducts = report?.top_products || [];
  const summary = report?.summary || {};
  const insights = report?.insights || {};

  const revenueSplit = [
    { name: 'Delivery', value: Number(summary.delivery_revenue || 0) },
    { name: 'Refill', value: Number(summary.refill_revenue || 0) },
  ].filter((item) => item.value > 0);

  return (
    <AdminLayout title="Reports & Analytics">
      <Head><title>Reports - Admin - JZ Waters</title></Head>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={dateRange.start_date}
              onChange={e => setDateRange({ ...dateRange, start_date: e.target.value })} className="input-field w-44" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={dateRange.end_date}
              onChange={e => setDateRange({ ...dateRange, end_date: e.target.value })} className="input-field w-44" />
          </div>
          <button onClick={fetchReport} className="btn-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Filter Reports
          </button>
          {loading && <span className="text-sm text-gray-500">Filtering reports...</span>}
          <div className="flex gap-2 sm:ml-auto">
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-1 text-sm">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportPDF} className="btn-secondary flex items-center gap-1 text-sm">
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(summary.total_revenue || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_transactions || 0}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.average_order_value || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Most Bought Product</p>
              <p className="text-sm font-bold text-blue-600 truncate">{summary.top_product_name || 'No data yet'}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Sales Sources</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.refill_transactions || 0} / {summary.delivery_transactions || 0}</p>
              <p className="text-xs text-gray-500">Refills / Deliveries</p>
            </div>
          </div>

          {/* Daily + Split */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card xl:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Daily Sales Trend</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend />
                  <Line type="monotone" dataKey="delivery_revenue" name="Delivery" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="refill_revenue" name="Refill" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="total_revenue" name="Total" stroke="#1f2937" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Revenue Composition</h3>
              {revenueSplit.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={revenueSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {revenueSplit.map((entry, idx) => <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center">No revenue split data yet</p>
              )}
            </div>
          </div>

          {/* Weekly + Monthly */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Weekly Sales</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="delivery_revenue" name="Delivery" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refill_revenue" name="Refill" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Monthly Sales</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="delivery_revenue" name="Delivery" fill="#0369a1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refill_revenue" name="Refill" fill="#15803d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products + Insights */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card xl:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Most Products Bought</h3>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                    <Tooltip formatter={(value, name) => name === 'total_revenue' ? formatCurrency(value) : value} />
                    <Legend />
                    <Bar dataKey="total_quantity" name="Quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total_revenue" name="Revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 py-14 text-center">No product sales found in this range.</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> Best Day</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{insights.best_day?.period || 'No data'}</p>
                <p className="text-sm text-gray-600">{formatCurrency(insights.best_day?.total_revenue || 0)}</p>
              </div>
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> Best Week</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{insights.best_week?.period || 'No data'}</p>
                <p className="text-sm text-gray-600">{formatCurrency(insights.best_week?.total_revenue || 0)}</p>
              </div>
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2"><Receipt className="w-4 h-4 text-emerald-500" /> Best Month</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{insights.best_month?.period || 'No data'}</p>
                <p className="text-sm text-gray-600">{formatCurrency(insights.best_month?.total_revenue || 0)}</p>
              </div>
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2"><Box className="w-4 h-4 text-amber-500" /> Top Product Revenue</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{topProducts[0]?.name || 'No data'}</p>
                <p className="text-sm text-gray-600">{formatCurrency(topProducts[0]?.total_revenue || 0)}</p>
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
