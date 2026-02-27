/**
 * Admin Sidebar Navigation
 */
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, Users, Package, Droplets, Truck,
  BarChart3, MapPin, Settings, ShoppingBag, Bell, X
} from 'lucide-react';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Droplets },
  { href: '/admin/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/admin/zones', label: 'Zones', icon: MapPin },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ open, onClose }) {
  const router = useRouter();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-primary-900 text-white z-50 transform transition-transform duration-200 
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-primary-800">
          <Link href="/admin" className="flex items-center space-x-2">
            <Droplets className="w-7 h-7 text-primary-300" />
            <span className="font-bold text-lg">JZ Waters</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-primary-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 space-y-1">
          {menuItems.map(({ href, label, icon: Icon }) => {
            const isActive = router.pathname === href || 
              (href !== '/admin' && router.pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary-700 text-white' 
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-800">
          <p className="text-xs text-primary-400 text-center">Admin Panel v1.0</p>
        </div>
      </aside>
    </>
  );
}
