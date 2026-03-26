/**
 * Admin - Reports & Analytics Page
 */
import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import api from '../../lib/api';
import { FileText, Download, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../../shared/helpers';
import toast from 'react-hot-toast';

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
  const [salesView, setSalesView] = useState('daily');
  const [salesPage, setSalesPage] = useState(1);
  const [productView, setProductView] = useState('most_bought');
  const [productPage, setProductPage] = useState(1);
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
  const SALES_PAGE_SIZE = 6;
  const PRODUCT_PAGE_SIZE = 6;

  const salesSeriesMap = {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
  };

  const combineByPeriod = (rows) => {
    const grouped = rows.reduce((acc, row) => {
      const key = String(row?.period || '').trim();
      if (!key) return acc;

      if (!acc[key]) {
        acc[key] = {
          period: key,
          delivery_revenue: 0,
          refill_revenue: 0,
          total_revenue: 0,
        };
      }

      acc[key].delivery_revenue += Number(row?.delivery_revenue || 0);
      acc[key].refill_revenue += Number(row?.refill_revenue || 0);
      acc[key].total_revenue += Number(row?.total_revenue || 0);
      return acc;
    }, {});

    return Object.values(grouped);
  };

  const getPeriodSortValue = (period) => {
    if (!period) return 0;
    const asDate = new Date(period);
    if (!Number.isNaN(asDate.getTime())) return asDate.getTime();

    const normalized = String(period).trim();
    const monthYear = new Date(`${normalized} 01`);
    if (!Number.isNaN(monthYear.getTime())) return monthYear.getTime();

    return 0;
  };

  const activeSalesData = combineByPeriod(salesSeriesMap[salesView] || []).sort((a, b) => {
    const diff = getPeriodSortValue(b.period) - getPeriodSortValue(a.period);
    if (diff !== 0) return diff;

    return Number(b.total_revenue || 0) - Number(a.total_revenue || 0);
  });
  const totalSalesPages = Math.max(1, Math.ceil(activeSalesData.length / SALES_PAGE_SIZE));
  const safeSalesPage = Math.min(salesPage, totalSalesPages);
  const salesStart = (safeSalesPage - 1) * SALES_PAGE_SIZE;
  const pagedSalesData = activeSalesData.slice(salesStart, salesStart + SALES_PAGE_SIZE);

  const formatPeriodLabel = (period) => {
    if (!period) return 'N/A';
    const dt = new Date(period);
    if (!Number.isNaN(dt.getTime())) {
      if (salesView === 'daily') {
        return dt.toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
      }
      if (salesView === 'monthly') {
        return dt.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
      }
    }
    return String(period).replace('T00:00:00.000Z', '');
  };

  const openSalesPage = (page) => {
    if (page < 1 || page > totalSalesPages) return;
    setSalesPage(page);
  };

  const productsByQty = [...topProducts].sort((a, b) => Number(b.total_quantity || 0) - Number(a.total_quantity || 0));
  const productsByRevenue = [...topProducts].sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0));
  const activeProductData = productView === 'most_bought' ? productsByQty : productsByRevenue;
  const totalProductPages = Math.max(1, Math.ceil(activeProductData.length / PRODUCT_PAGE_SIZE));
  const safeProductPage = Math.min(productPage, totalProductPages);
  const productStart = (safeProductPage - 1) * PRODUCT_PAGE_SIZE;
  const pagedProducts = activeProductData.slice(productStart, productStart + PRODUCT_PAGE_SIZE);

  const openProductPage = (page) => {
    if (page < 1 || page > totalProductPages) return;
    setProductPage(page);
  };

  useEffect(() => {
    setSalesPage(1);
  }, [salesView, report]);

  useEffect(() => {
    setProductPage(1);
  }, [productView, report]);

  const deliveryRevenue = Number(summary.delivery_revenue || 0);
  const refillRevenue = Number(summary.refill_revenue || 0);
  const splitTotal = deliveryRevenue + refillRevenue;
  const deliveryPercent = splitTotal > 0 ? (deliveryRevenue / splitTotal) * 100 : 0;
  const refillPercent = splitTotal > 0 ? (refillRevenue / splitTotal) * 100 : 0;

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
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(summary.total_revenue || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Transactions</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total_transactions || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Order Value</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(summary.average_order_value || 0)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Most Bought Product</p>
              <p className="mt-1 text-sm font-semibold text-sky-700 truncate">{summary.top_product_name || 'No data yet'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Sales Sources</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.refill_transactions || 0} / {summary.delivery_transactions || 0}</p>
              <p className="text-xs text-slate-500">Refills / Deliveries</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="card xl:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">Sales History</h3>
              <div className="inline-flex bg-slate-100 p-1 rounded-lg">
                {['daily', 'weekly', 'monthly'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSalesView(mode)}
                    className={`px-3 py-1.5 text-sm rounded-md capitalize transition ${
                      salesView === mode ? 'bg-white shadow-sm text-primary-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Period</th>
                      <th className="text-right px-4 py-3 font-semibold">Delivery</th>
                      <th className="text-right px-4 py-3 font-semibold">Refill</th>
                      <th className="text-right px-4 py-3 font-semibold">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {pagedSalesData.length > 0 ? (
                      pagedSalesData.map((row, idx) => (
                        <tr key={`${row.period}-${idx}`} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-800 font-medium">{formatPeriodLabel(row.period)}</td>
                          <td className="px-4 py-3 text-right text-sky-600 font-semibold">{formatCurrency(row.delivery_revenue || 0)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatCurrency(row.refill_revenue || 0)}</td>
                          <td className="px-4 py-3 text-right text-slate-900 font-bold">{formatCurrency(row.total_revenue || 0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-slate-400">No {salesView} sales data in this range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-slate-500">Showing {pagedSalesData.length ? salesStart + 1 : 0}-{salesStart + pagedSalesData.length} of {activeSalesData.length}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSalesPage(safeSalesPage - 1)}
                    disabled={safeSalesPage === 1}
                    className="px-3 py-1.5 text-sm rounded-md border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalSalesPages }, (_, i) => i + 1).slice(Math.max(0, safeSalesPage - 3), Math.max(0, safeSalesPage - 3) + 5).map((page) => (
                    <button
                      key={page}
                      onClick={() => openSalesPage(page)}
                      className={`px-3 py-1.5 text-sm rounded-md border ${
                        page === safeSalesPage
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-slate-300 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => openSalesPage(safeSalesPage + 1)}
                    disabled={safeSalesPage === totalSalesPages}
                    className="px-3 py-1.5 text-sm rounded-md border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="text-lg font-semibold mb-4">Revenue Split</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Delivery</span>
                  <span className="text-sky-700 font-semibold">{deliveryPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${deliveryPercent}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(deliveryRevenue)}</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Refill</span>
                  <span className="text-emerald-700 font-semibold">{refillPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${refillPercent}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(refillRevenue)}</p>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">Combined Revenue</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(splitTotal)}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">Product Performance</h3>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setProductView('most_bought')}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  productView === 'most_bought' ? 'bg-white shadow-sm text-primary-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Most Products Bought
              </button>
              <button
                onClick={() => setProductView('top_revenue')}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  productView === 'top_revenue' ? 'bg-white shadow-sm text-primary-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top Product Revenue
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold w-16">#</th>
                    <th className="text-left px-4 py-3 font-semibold">Product</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Quantity</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pagedProducts.length > 0 ? (
                    pagedProducts.map((item, idx) => (
                      <tr key={`${item.name}-${idx}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">{productStart + idx + 1}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-right text-amber-700 font-semibold">{Number(item.total_quantity || 0)}</td>
                        <td className="px-4 py-3 text-right text-violet-700 font-semibold">{formatCurrency(item.total_revenue || 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-400">No product sales found in this range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-slate-500">Showing {pagedProducts.length ? productStart + 1 : 0}-{productStart + pagedProducts.length} of {activeProductData.length}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openProductPage(safeProductPage - 1)}
                  disabled={safeProductPage === 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                >
                  Prev
                </button>
                {Array.from({ length: totalProductPages }, (_, i) => i + 1).slice(Math.max(0, safeProductPage - 3), Math.max(0, safeProductPage - 3) + 5).map((page) => (
                  <button
                    key={page}
                    onClick={() => openProductPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-md border ${
                      page === safeProductPage
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-slate-300 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => openProductPage(safeProductPage + 1)}
                  disabled={safeProductPage === totalProductPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
