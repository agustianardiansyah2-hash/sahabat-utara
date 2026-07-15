import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Baby,
  User,
  Heart,
  Accessibility,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getEvacuees,
  getEvacueeStats,
  createEvacuee,
  updateEvacuee,
  deleteEvacuee,
  getEvacuationCenters,
  getStoredUser
} from '../api/api';

const CATEGORIES = [
  { value: 'bayi', label: 'Bayi (0-1 th)', icon: Baby, color: 'bg-pink-100 text-slate-800' },
  { value: 'balita', label: 'Balita (1-5 th)', icon: Baby, color: 'bg-rose-100 text-slate-800' },
  { value: 'anak', label: 'Anak (6-12 th)', icon: User, color: 'bg-orange-100 text-slate-800' },
  { value: 'remaja', label: 'Remaja (13-17 th)', icon: User, color: 'bg-yellow-100 text-slate-800' },
  { value: 'dewasa', label: 'Dewasa (18-59 th)', icon: User, color: 'bg-green-100 text-slate-800' },
  { value: 'lansia', label: 'Lansia (60+ th)', icon: User, color: 'bg-purple-100 text-slate-800' },
  { value: 'ibu_hamil', label: 'Ibu Hamil', icon: Heart, color: 'bg-red-100 text-slate-800' },
  { value: 'disabilitas', label: 'Disabilitas', icon: Accessibility, color: 'bg-blue-100 text-slate-800' }
];

const NEEDS_OPTIONS = [
  'Makanan', 'Air Minum', 'Obat-obatan', 'Selimut', 'Pakaian', 'Popok Bayi',
  'Susu Bayi', 'Makanan Balita', 'Obat Kronis', 'Perawatan Luka', 'Pendamping Psikososial'
];

function Evacuees() {
  const [evacuees, setEvacuees] = useState([]);
  const [stats, setStats] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvacuee, setEditingEvacuee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
    fetchData();
  }, [filterCenter, filterCategory]);

  const isSuperAdmin = user?.role === 'super_admin';

  // Get user's accessible RW list
  const getAccessibleRWs = () => {
    if (!user) return [];
    if (user.role === 'super_admin') return null; // null means all RWs
    if (user.role === 'pic_rw' && user.rw_access) {
      return user.rw_access.split(',').map(r => r.trim());
    }
    return [];
  };

  // Filter centers based on user's RW access
  const getFilteredCenters = () => {
    const accessibleRWs = getAccessibleRWs();
    if (accessibleRWs === null) return centers; // Super admin sees all
    return centers.filter(c => accessibleRWs.includes(c.rw));
  };

  const fetchData = async () => {
    try {
      const params = {};
      if (filterCenter) params.center_id = filterCenter;
      if (filterCategory) params.category = filterCategory;

      const [evacueesRes, statsRes, centersRes] = await Promise.all([
        getEvacuees(params),
        getEvacueeStats(),
        getEvacuationCenters({})
      ]);
      setEvacuees(evacueesRes.data.data);
      setStats(statsRes.data.data);
      setCenters(centersRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.age = parseInt(data.age) || null;

    // Get selected needs
    const needs = [];
    NEEDS_OPTIONS.forEach(need => {
      if (formData.get(`need_${need}`)) {
        needs.push(need);
      }
    });
    data.needs = needs.length > 0 ? JSON.stringify(needs) : null;

    try {
      if (editingEvacuee) {
        await updateEvacuee(editingEvacuee.id, data);
      } else {
        await createEvacuee(data);
      }
      setModalOpen(false);
      setEditingEvacuee(null);
      fetchData();
    } catch (error) {
      console.error('Error saving evacuee:', error);
    }
  };

  const handleEdit = (evacuee) => {
    setEditingEvacuee(evacuee);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus data pengungsi ini?')) {
      try {
        await deleteEvacuee(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting evacuee:', error);
      }
    }
  };

  const handleStatusChange = async (evacuee, newStatus) => {
    try {
      await updateEvacuee(evacuee.id, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredEvacuees = evacuees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.nik?.includes(searchTerm)
  );

  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
  };

  const getNeeds = (needsStr) => {
    try {
      return JSON.parse(needsStr || '[]');
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat data pengungsi..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Data Pengungsi</h3>
          <p className="text-sm text-slate-500">
            {isSuperAdmin ? 'Kelola data pengungsi di pos evakuasi' : `Kelola data pengungsi RW ${user?.rw_access || ''}`}
          </p>
        </div>
        <button
          onClick={() => { setEditingEvacuee(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengungsi
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{stats?.total || 0}</p>
            <p className="text-sm text-slate-500">Total Pengungsi</p>
          </div>
        </Card>
        {CATEGORIES.slice(0, 4).map(cat => {
          const count = stats?.vulnerable_groups?.find(v => v.category === cat.value)?.count || 0;
          return (
            <Card key={cat.value}>
              <div className="text-center">
                <cat.icon className={`w-8 h-8 mx-auto mb-2 ${cat.color.replace('bg-', 'text-').replace('100', '600')}`} />
                <p className="text-2xl font-bold text-slate-800">{count}</p>
                <p className="text-sm text-slate-500">{cat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Vulnerable Group Analysis */}
      <Card title="Analisis Kebutuhan Khusus" subtitle="Pengelompokan pengungsi yang membutuhkan perhatian khusus">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const count = stats?.vulnerable_groups?.find(v => v.category === cat.value)?.count || 0;
            const needs = [];
            if (cat.value === 'bayi' || cat.value === 'balita') {
              needs.push('Popok', 'Susu', 'Makanan Bayi');
            }
            if (cat.value === 'ibu_hamil') {
              needs.push('Nutrisi', 'Obat Prenatal', 'Perawatan Kesehatan');
            }
            if (cat.value === 'lansia') {
              needs.push('Obat Kronis', 'Bantuan Mobilitas', 'Nutrisi Khusus');
            }
            if (cat.value === 'disabilitas') {
              needs.push('Alat Bantu', 'Aksesibilitas', 'Pendamping');
            }
            return (
              <div key={cat.value} className={`p-4 rounded-xl ${cat.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <cat.icon className="w-5 h-5 text-slate-700" />
                  <span className="font-semibold">{cat.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{count} orang</p>
                {needs.length > 0 && (
                  <div className="mt-2 text-xs text-slate-700">
                    <p className="font-medium">Kebutuhan:</p>
                    <p>{needs.join(', ')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Pos Evakuasi</option>
            {getFilteredCenters().map(c => (
              <option key={c.id} value={c.id}>{c.name} (RW {c.rw})</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Evacuees Table */}
      <Card title={`Daftar Pengungsi (${filteredEvacuees.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Nama</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Kategori</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Usia</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">JK</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Pos Evakuasi</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Kebutuhan</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvacuees.map((evacuee) => {
                const catInfo = getCategoryInfo(evacuee.category);
                const needs = getNeeds(evacuee.needs);
                return (
                  <tr key={evacuee.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-800">{evacuee.name}</p>
                        {evacuee.nik && <p className="text-xs text-slate-400">NIK: {evacuee.nik}</p>}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${catInfo.color}`}>
                        <catInfo.icon className="w-3 h-3" />
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-600">
                      {evacuee.age || '-'}
                    </td>
                    <td className="text-center py-3 px-4 text-slate-600">
                      {evacuee.gender === 'L' ? 'L' : evacuee.gender === 'P' ? 'P' : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {evacuee.center_name || '-'}
                      <span className="text-slate-400"> (RW {evacuee.center_rw})</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {needs.length > 0 ? needs.slice(0, 3).map((need, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                            {need}
                          </span>
                        )) : <span className="text-xs text-slate-400">-</span>}
                        {needs.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                            +{needs.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {evacuee.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(evacuee, 'returned')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Tandai Pulang"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(evacuee, 'active')}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                            title="Aktifkan"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(evacuee)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(evacuee.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEvacuees.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada data pengungsi</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvacuee(null); }}
        title={editingEvacuee ? 'Edit Pengungsi' : 'Tambah Pengungsi'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama *</label>
              <input
                type="text"
                name="name"
                defaultValue={editingEvacuee?.name || ''}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NIK</label>
              <input
                type="text"
                name="nik"
                defaultValue={editingEvacuee?.nik || ''}
                maxLength={16}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="16 digit"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori *</label>
              <select
                name="category"
                defaultValue={editingEvacuee?.category || ''}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Pilih</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usia</label>
              <input
                type="number"
                name="age"
                defaultValue={editingEvacuee?.age || ''}
                min="0"
                max="120"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                name="gender"
                defaultValue={editingEvacuee?.gender || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pos Evakuasi *</label>
            <select
              name="evacuation_center_id"
              defaultValue={editingEvacuee?.evacuation_center_id || ''}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Pilih Pos Evakuasi</option>
              {getFilteredCenters().map(c => (
                <option key={c.id} value={c.id}>{c.name} (RW {c.rw})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Kebutuhan Khusus</label>
            <div className="grid grid-cols-3 gap-2">
              {NEEDS_OPTIONS.map(need => (
                <label key={need} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    name={`need_${need}`}
                    defaultChecked={getNeeds(editingEvacuee?.needs || '').includes(need)}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm">{need}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kondisi Kesehatan</label>
            <input
              type="text"
              name="health_condition"
              defaultValue={editingEvacuee?.health_condition || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Contoh: Diabetes, Hipertensi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <textarea
              name="notes"
              defaultValue={editingEvacuee?.notes || ''}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingEvacuee(null); }}
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

export default Evacuees;
