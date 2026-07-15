import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  Search,
  Lock
} from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUsers, createUser, updateUser, deleteUser } from '../api/api';

const RW_LIST = Array.from({ length: 13 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `RW ${String(i + 1).padStart(2, '0')}`
}));

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (editingUser) {
        await updateUser(editingUser.id, data);
      } else {
        await createUser(data);
      }
      setModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (id, username) => {
    if (confirm(`Yakin ingin menghapus user "${username}"?`)) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.error || 'Gagal menghapus user');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          <Shield className="w-3 h-3" />
          Super Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        <UserCheck className="w-3 h-3" />
        PIC RW
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat data user..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Manajemen User</h3>
          <p className="text-sm text-slate-500">Kelola akses user aplikasi</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{users.length}</p>
            <p className="text-sm text-slate-500">Total User</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {users.filter(u => u.role === 'super_admin').length}
            </p>
            <p className="text-sm text-slate-500">Super Admin</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.role === 'pic_rw').length}
            </p>
            <p className="text-sm text-slate-500">PIC RW</p>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card title={`Daftar User (${filteredUsers.length})`} icon={Users}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Username</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">RW Access</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      {user.email && <p className="text-xs text-slate-400">{user.email}</p>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {user.username}
                  </td>
                  <td className="text-center py-3 px-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="text-center py-3 px-4">
                    {user.role === 'super_admin' ? (
                      <span className="text-slate-400 text-sm">Semua RW</span>
                    ) : (
                      <span className="text-sm">RW {user.rw_access || '-'}</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null); }}
        title={editingUser ? 'Edit User' : 'Tambah User Baru'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                name="name"
                defaultValue={editingUser?.name || ''}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                name="username"
                defaultValue={editingUser?.username || ''}
                required
                disabled={!!editingUser}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password {editingUser ? '(kosongkan jika tidak diubah)' : '*'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required={!editingUser}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={editingUser?.email || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <select
                name="role"
                defaultValue={editingUser?.role || 'pic_rw'}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="super_admin">Super Admin</option>
                <option value="pic_rw">PIC RW</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RW Access (PIC RW)</label>
              <select
                name="rw_access"
                defaultValue={editingUser?.rw_access || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Pilih RW</option>
                {RW_LIST.map(rw => (
                  <option key={rw.value} value={rw.value}>{rw.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Hanya untuk role PIC RW</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={editingUser?.status || 'active'}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingUser(null); }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UserManagement;
