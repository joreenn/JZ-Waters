/**
 * Admin - Reports & Analytics Page
 */
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('daily');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/sales-report', { params: { ...dateRange, group_by: reportType } });
      setReport(res.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/dashboard/export/csv', { params: dateRange, responseType: 'blob' });
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
      const res = await api.get('/dashboard/export/pdf', { params: dateRange, responseType: 'blob' });
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="input-field w-36">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button onClick={fetchReport} className="btn-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Generate Report
          </button>
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

      {loading ? <LoadingSpinner /> : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(report.summary?.total_revenue || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{report.summary?.total_orders || 0}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.summary?.avg_order_value || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Refill Revenue</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(report.summary?.refill_revenue || 0)}</p>
            </div>
          </div>

          {/* Sales Chart */}
          {report.data && report.data.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={report.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend />
                  <Bar dataKey="delivery_revenue" name="Delivery" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="refill_revenue" name="Refill" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          {report.data && report.data.length > 0 && (
            <div className="card overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Period</th>
                    <th className="pb-3 font-medium">Orders</th>
                    <th className="pb-3 font-medium">Delivery Revenue</th>
                    <th className="pb-3 font-medium">Refill Revenue</th>
                    <th className="pb-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium">{row.period}</td>
                      <td className="py-3">{row.order_count || 0}</td>
                      <td className="py-3">{formatCurrency(row.delivery_revenue || 0)}</td>
                      <td className="py-3">{formatCurrency(row.refill_revenue || 0)}</td>
                      <td className="py-3 font-bold">{formatCurrency((parseFloat(row.delivery_revenue) || 0) + (parseFloat(row.refill_revenue) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Generate a Report</h3>
          <p className="text-sm text-gray-500 mt-1">Select date range and click "Generate Report" to view sales analytics</p>
        </div>
      )}
    </AdminLayout>
  );
}
