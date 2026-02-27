/**
 * Empty state component for lists & tables
 */
import { Package } from 'lucide-react';

export default function EmptyState({ icon: Icon = Package, title = 'No data found', message, action }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-600">{title}</h3>
      {message && <p className="text-sm text-gray-400 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
