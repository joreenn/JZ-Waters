/**
 * Admin - User Management Page
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../lib/api';
import { UserPlus, Search, Users, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'refiller', phone: '' });

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.get('/users', { params });
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, { name: form.name, role: form.role, phone: form.phone });
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }
      setModalOpen(false);
      setEditUser(null);
      setForm({ name: '', email: '', password: '', role: 'refiller', phone: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const toggleActive = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/toggle-active`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'refiller', phone: '' });
    setModalOpen(true);
  };

  return (
    <AdminLayout title="User Management">
      <Head><title>Users - Admin - JZ Waters</title></Head>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search users..." value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()}
              className="input-field pl-9 w-56" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-40">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="refiller">Refiller</option>
            <option value="delivery">Delivery</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
          <UserPlus className="w-4 h-4" /> <span>Add Staff</span>
        </button>
      </div>

      {/* Users Table */}
      {loading ? <LoadingSpinner /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" message="Try adjusting your filters" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Phone</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Points</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3">
                    <span className={`badge ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'refiller' ? 'bg-blue-100 text-blue-700' : u.role === 'delivery' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{u.phone || '-'}</td>
                  <td className="py-3">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">{u.points_balance || 0}</td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openEdit(u)} className="p-1 text-gray-400 hover:text-primary-600" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleActive(u.id)} className="p-1 text-gray-400 hover:text-primary-600" title="Toggle active">
                        {u.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit User' : 'Create Staff Account'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          {!editUser && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" required minLength={8} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="admin">Admin</option>
              <option value="refiller">Refiller</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editUser ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
