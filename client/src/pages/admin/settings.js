/**
 * Admin - Settings Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import { Settings, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/all');
        const mapped = {};
        res.data.settings.forEach(s => { mapped[s.setting_key] = s.setting_value; });
        setSettings(mapped);
      } catch { toast.error('Failed to load settings'); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { settings });
      toast.success('Settings saved');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  if (loading) return <AdminLayout title="Settings"><LoadingSpinner /></AdminLayout>;

  const sections = [
    {
      title: 'Store Information',
      fields: [
        { key: 'store_name', label: 'Store Name', type: 'text' },
        { key: 'store_phone', label: 'Phone', type: 'text' },
        { key: 'store_email', label: 'Email', type: 'email' },
        { key: 'store_address', label: 'Address', type: 'textarea' },
      ]
    },
    {
      title: 'Operating Hours',
      fields: [
        { key: 'operating_hours_open', label: 'Opening Time', type: 'time' },
        { key: 'operating_hours_close', label: 'Closing Time', type: 'time' },
      ]
    },
    {
      title: 'Pricing & Fees',
      fields: [
        { key: 'default_delivery_fee', label: 'Default Delivery Fee (₱)', type: 'number' },
        { key: 'min_order_amount', label: 'Minimum Order Amount (₱)', type: 'number' },
      ]
    },
    {
      title: 'Loyalty Program',
      fields: [
        { key: 'loyalty_enabled', label: 'Enable Loyalty Program', type: 'checkbox' },
        { key: 'loyalty_points_per_peso', label: 'Points per ₱1 Spent', type: 'number' },
        { key: 'loyalty_peso_per_point', label: '₱ Value per Point', type: 'number' },
        { key: 'loyalty_min_redeem', label: 'Min Points to Redeem', type: 'number' },
      ]
    },
    {
      title: 'Notifications',
      fields: [
        { key: 'email_notifications_enabled', label: 'Email Notifications', type: 'checkbox' },
        { key: 'sms_notifications_enabled', label: 'SMS Notifications', type: 'checkbox' },
        { key: 'low_stock_threshold', label: 'Low Stock Alert Threshold', type: 'number' },
      ]
    },
  ];

  return (
    <AdminLayout title="Settings">
      <Head><title>Settings - Admin - JZ Waters</title></Head>

      <div className="max-w-3xl space-y-6">
        {sections.map(section => (
          <div key={section.title} className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h3>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.key}>
                  {field.type === 'checkbox' ? (
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings[field.key] === 'true' || settings[field.key] === true}
                        onChange={e => update(field.key, e.target.checked ? 'true' : 'false')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{field.label}</span>
                    </label>
                  ) : field.type === 'textarea' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <textarea
                        value={settings[field.key] || ''}
                        onChange={e => update(field.key, e.target.value)}
                        className="input-field" rows="2"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={settings[field.key] || ''}
                        onChange={e => update(field.key, e.target.value)}
                        className="input-field max-w-md"
                        step={field.type === 'number' ? '0.01' : undefined}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
