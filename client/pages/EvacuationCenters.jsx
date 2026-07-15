import { useState, useEffect } from 'react';
import {
  Home,
  Plus,
  Edit,
  Trash2,
  Users,
  Phone,
  MapPin,
  Search
} from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getEvacuationCenters,
  createEvacuationCenter,
  updateEvacuationCenter,
  deleteEvacuationCenter,
  getStoredUser
} from '../api/api';

const RW_LIST = Array.from({ length: 13 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `RW ${String(i + 1).padStart(2, '0')}`
}));

function EvacuationCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRW, setFilterRW] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
    fetchCenters();
  }, []);

  // Get user's accessible RW list
  const getAccessibleRWs = () => {
    if (!user) return [];
    if (user.role === 'super_admin') return RW_LIST;
    if (user.role === 'pic_rw' && user.rw_access) {
      const accessible = user.rw_access.split(',').map(r => r.trim());
      return RW_LIST.filter(rw => accessible.includes(rw.value));
    }
    return [];
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const accessibleRWs = getAccessibleRWs();

  // Auto-select RW for PIC RW (single RW)
  const getDefaultRW = () => {
    if (user?.role === 'pic_rw' && user.rw_access) {
      const accessible = user.rw_access.split(',').map(r => r.trim());
      return accessible[0] || '';
    }
    return '';
  };

  const fetchCenters = async () => {
    try {
      const res = await getEvacuationCenters({});
      setCenters(res.data.data);
    } catch (error) {
      console.error('Error fetching centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.capacity = parseInt(data.capacity) || 0;

    try {
      if (editingCenter) {
        await updateEvacuationCenter(editingCenter.id, data);
      } else {
        await createEvacuationCenter(data);
      }
      setModalOpen(false);
      setEditingCenter(null);
      fetchCenters();
    } catch (error) {
      console.error('Error saving center:', error);
    }
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus pos evakuasi ini?')) {
      try {
        await deleteEvacuationCenter(id);
        fetchCenters();
      } catch (error) {
        console.error('Error deleting center:', error);
      }
    }
  };

  const filteredCenters = centers.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRW = !filterRW || center.rw === filterRW;
    return matchesSearch && matchesRW;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'full': return 'bg-red-100 text-red-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'full': return 'Penuh';
      case 'inactive': return 'Nonaktif';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat data pos evakuasi..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Pos Evakuasi</h3>
          <p className="text-sm text-slate-500">
            {isSuperAdmin ? 'Kelola lokasi pos evakuasi banjir' : `Kelola pos evakuasi RW ${user?.rw_access || ''}`}
          </p>
        </div>
        <button
          onClick={() => { setEditingCenter(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Pos Evakuasi
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau alamat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {/* Only show RW filter for Super Admin or PIC RW with multiple RWs */}
          {isSuperAdmin || accessibleRWs.length > 1 ? (
            <select
              value={filterRW}
              onChange={(e) => setFilterRW(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">
                {isSuperAdmin ? 'Semua RW' : `RW ${user?.rw_access || ''}`}
              </option>
              {accessibleRWs.map(rw => (
                <option key={rw.value} value={rw.value}>{rw.label}</option>
              ))}
            </select>
          ) : (
            <div className="px-4 py-2 bg-slate-100 rounded-lg text-slate-600 font-medium">
              RW {user?.rw_access || ''}
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{centers.length}</p>
            <p className="text-sm text-slate-500">Total Pos</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {centers.filter(c => c.status === 'active').length}
            </p>
            <p className="text-sm text-slate-500">Pos Aktif</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">
              {centers.reduce((sum, c) => sum + (c.evacuee_count || 0), 0)}
            </p>
            <p className="text-sm text-slate-500">Total Pengungsi</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">
              {centers.reduce((sum, c) => sum + (c.capacity || 0), 0)}
            </p>
            <p className="text-sm text-slate-500">Total Kapasitas</p>
          </div>
        </Card>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCenters.map((center) => (
          <Card key={center.id} className="card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{center.name}</h4>
                  <p className="text-sm text-slate-500">RW {center.rw}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(center.status)}`}>
                {getStatusLabel(center.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {center.address && (
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{center.address}</span>
                </div>
              )}
              {center.contact_person && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>{center.contact_person}</span>
                </div>
              )}
              {center.contact_phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{center.contact_phone}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Pengungsi</p>
                  <p className="text-xl font-bold text-slate-800">
                    {center.evacuee_count || 0}
                    <span className="text-sm font-normal text-slate-400"> / {center.capacity || 0}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(center)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDelete(center.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* Capacity bar */}
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (center.evacuee_count || 0) >= (center.capacity || 0) ? 'bg-red-500' :
                    (center.evacuee_count || 0) >= (center.capacity || 0) * 0.7 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, ((center.evacuee_count || 0) / (center.capacity || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCenters.length === 0 && (
        <Card className="text-center py-12">
          <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Belum ada pos evakuasi</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Tambah Pos Evakuasi
          </button>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCenter(null); }}
        title={editingCenter ? 'Edit Pos Evakuasi' : 'Tambah Pos Evakuasi'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pos *</label>
            <input
              type="text"
              name="name"
              defaultValue={editingCenter?.name || ''}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Contoh: SD Negeri 1 Bekasi"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RW *</label>
              {isSuperAdmin ? (
                <select
                  name="rw"
                  defaultValue={editingCenter?.rw || ''}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Pilih RW</option>
                  {RW_LIST.map(rw => (
                    <option key={rw.value} value={rw.value}>{rw.label}</option>
                  ))}
                </select>
              ) : (
                <select
                  name="rw"
                  defaultValue={editingCenter?.rw || getDefaultRW()}
                  required
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
                >
                  {accessibleRWs.map(rw => (
                    <option key={rw.value} value={rw.value}>{rw.label}</option>
                  ))}
                </select>
              )}
              {!isSuperAdmin && (
                <input type="hidden" name="rw" value={getDefaultRW()} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kapasitas</label>
              <input
                type="number"
                name="capacity"
                defaultValue={editingCenter?.capacity || 0}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
            <textarea
              name="address"
              defaultValue={editingCenter?.address || ''}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Jl. ..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Penanggung Jawab</label>
              <input
                type="text"
                name="contact_person"
                defaultValue={editingCenter?.contact_person || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Nama"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
              <input
                type="text"
                name="contact_phone"
                defaultValue={editingCenter?.contact_phone || ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="08xx"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={editingCenter?.status || 'active'}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="full">Penuh</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingCenter(null); }}
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

export default EvacuationCenters;
