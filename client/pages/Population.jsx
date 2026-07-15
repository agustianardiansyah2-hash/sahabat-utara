import { useState, useEffect } from 'react';
import {
  UsersRound,
  Plus,
  Edit,
  Trash2,
  Search,
  Baby,
  User,
  Heart,
  Accessibility,
  Users,
  RefreshCw
} from 'lucide-react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getPopulationData,
  getPopulationSummary,
  createPopulationData,
  updatePopulationData,
  deletePopulationData,
  seedPopulationData,
  getStoredUser
} from '../api/api';

const RW_LIST = Array.from({ length: 13 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `RW ${String(i + 1).padStart(2, '0')}`
}));

function Population() {
  const [population, setPopulation] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [filterRW, setFilterRW] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    console.log('Population - storedUser:', storedUser);
    console.log('Population - rw_access:', storedUser?.rw_access);
    setUser(storedUser);
    fetchData();
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';

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

  const accessibleRWs = getAccessibleRWs();

  // Auto-select RW for PIC RW (single RW)
  const getDefaultRW = () => {
    if (user?.role === 'pic_rw' && user.rw_access) {
      const accessible = user.rw_access.split(',').map(r => r.trim());
      return accessible[0] || '';
    }
    return '';
  };

  const fetchData = async () => {
    try {
      const params = {};
      if (filterRW) params.rw = filterRW;

      const [popRes, summaryRes] = await Promise.all([
        getPopulationData(params),
        getPopulationSummary()
      ]);
      setPopulation(popRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (confirm('Generate data sample untuk semua RW?')) {
      try {
        await seedPopulationData();
        fetchData();
        alert('Data berhasil di-generate!');
      } catch (error) {
        console.error('Error seeding data:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Convert all number fields
    const numberFields = ['total_population', 'total_kk', 'laki_laki', 'perempuan',
      'bayi', 'balita', 'anak', 'remaja', 'dewasa', 'lansia', 'ibu_hamil', 'disabilitas'];
    numberFields.forEach(field => {
      data[field] = parseInt(data[field]) || 0;
    });

    try {
      if (editingData) {
        await updatePopulationData(editingData.id, data);
      } else {
        await createPopulationData(data);
      }
      setModalOpen(false);
      setEditingData(null);
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleEdit = (data) => {
    setEditingData(data);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus data ini?')) {
      try {
        await deletePopulationData(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat data penduduk..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Data Penduduk</h3>
          <p className="text-sm text-slate-500">
            {isSuperAdmin ? 'Data demografi per RW untuk analisis kebutuhan bantuan' : `Data demografi RW ${user?.rw_access || ''}`}
          </p>
        </div>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <button
              onClick={handleSeed}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Sample
            </button>
          )}
          <button
            onClick={() => { setEditingData(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isSuperAdmin ? 'Tambah Data' : 'Tambah Data RW Saya'}
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <div className="text-center">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">
                {summary.summary.total_population?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-slate-500">Total Penduduk</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Users className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">
                {summary.summary.total_kk?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-slate-500">Total KK</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">
                {summary.summary.total_ibu_hamil || 0}
              </p>
              <p className="text-sm text-slate-500">Ibu Hamil</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Baby className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">
                {(summary.summary.total_bayi || 0) + (summary.summary.total_balita || 0)}
              </p>
              <p className="text-sm text-slate-500">Bayi & Balita</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">
                {summary.summary.total_lansia || 0}
              </p>
              <p className="text-sm text-slate-500">Lansia (60+)</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Accessibility className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">
                {summary.summary.total_disabilitas || 0}
              </p>
              <p className="text-sm text-slate-500">Disabilitas</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-slate-600">Filter RW:</span>
          {isSuperAdmin || accessibleRWs.length > 1 ? (
            <select
              value={filterRW}
              onChange={(e) => { setFilterRW(e.target.value); }}
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
          <span className="text-sm text-slate-500">
            Tahun Data: {summary?.year || '-'}
          </span>
        </div>
      </Card>

      {/* Population Table */}
      <Card title={`Data Penduduk ${isSuperAdmin ? `per RW (${population.length} RW)` : `RW ${user?.rw_access || ''}`}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">RW</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Total Pop.</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">KK</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">L</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">P</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Bayi</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Balita</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Anak</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Remaja</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Dewasa</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Lansia</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Ibu Hml</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Disab</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {population.map((data) => (
                <tr key={data.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    RW {data.rw}
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {data.total_population?.toLocaleString() || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {data.total_kk?.toLocaleString() || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {data.laki_laki?.toLocaleString() || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {data.perempuan?.toLocaleString() || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-pink-600">
                    {data.bayi || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-orange-600">
                    {data.balita || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {data.anak || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {data.remaja || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {data.dewasa || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-purple-600">
                    {data.lansia || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-red-600">
                    {data.ibu_hamil || 0}
                  </td>
                  <td className="text-center py-3 px-4 text-blue-600">
                    {data.disabilitas || 0}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(data)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(data.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {population.length === 0 && (
            <div className="text-center py-12">
              <UsersRound className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada data penduduk</p>
              <button
                onClick={handleSeed}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Generate Sample Data
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card title="Petunjuk Pengisian" subtitle="Data demografi untuk perencanaan bantuan banjir">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-slate-700">Kategori Usia:</p>
            <ul className="space-y-1 text-slate-600">
              <li>• <strong>Bayi:</strong> 0-1 tahun</li>
              <li>• <strong>Balita:</strong> 1-5 tahun</li>
              <li>• <strong>Anak:</strong> 6-12 tahun</li>
              <li>• <strong>Remaja:</strong> 13-17 tahun</li>
              <li>• <strong>Dewasa:</strong> 18-59 tahun</li>
              <li>• <strong>Lansia:</strong> 60+ tahun</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-slate-700">Data ini digunakan untuk:</p>
            <ul className="space-y-1 text-slate-600">
              <li>• Perencanaan kebutuhan logistik bantuan</li>
              <li>• Estimasi jumlah popok bayi & susu</li>
              <li>• Perencanaan makanan untuk balita</li>
              <li>• Obat-obatan untuk lansia & ibu hamil</li>
              <li>• Alat bantu untuk disabilitas</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingData(null); }}
        title={editingData ? 'Edit Data Penduduk' : 'Tambah Data Penduduk'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RW *</label>
              {isSuperAdmin ? (
                <select
                  name="rw"
                  defaultValue={editingData?.rw || ''}
                  required
                  disabled={!!editingData}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
                >
                  <option value="">Pilih RW</option>
                  {RW_LIST.map(rw => (
                    <option key={rw.value} value={rw.value}>{rw.label}</option>
                  ))}
                </select>
              ) : (
                <select
                  name="rw"
                  defaultValue={editingData?.rw || getDefaultRW()}
                  required
                  disabled={!!editingData}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100"
                >
                  {accessibleRWs.map(rw => (
                    <option key={rw.value} value={rw.value}>{rw.label}</option>
                  ))}
                </select>
              )}
              {!isSuperAdmin && !editingData && (
                <input type="hidden" name="rw" value={getDefaultRW()} />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
              <input
                type="number"
                name="year"
                defaultValue={editingData?.year || 2026}
                min="2020"
                max="2030"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Penduduk</label>
              <input
                type="number"
                name="total_population"
                defaultValue={editingData?.total_population || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total KK</label>
              <input
                type="number"
                name="total_kk"
                defaultValue={editingData?.total_kk || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Laki-laki</label>
              <input
                type="number"
                name="laki_laki"
                defaultValue={editingData?.laki_laki || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Perempuan</label>
              <input
                type="number"
                name="perempuan"
                defaultValue={editingData?.perempuan || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bayi (0-1 th)</label>
              <input
                type="number"
                name="bayi"
                defaultValue={editingData?.bayi || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Balita (1-5 th)</label>
              <input
                type="number"
                name="balita"
                defaultValue={editingData?.balita || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Anak (6-12 th)</label>
              <input
                type="number"
                name="anak"
                defaultValue={editingData?.anak || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Remaja (13-17 th)</label>
              <input
                type="number"
                name="remaja"
                defaultValue={editingData?.remaja || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dewasa (18-59 th)</label>
              <input
                type="number"
                name="dewasa"
                defaultValue={editingData?.dewasa || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lansia (60+ th)</label>
              <input
                type="number"
                name="lansia"
                defaultValue={editingData?.lansia || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ibu Hamil</label>
              <input
                type="number"
                name="ibu_hamil"
                defaultValue={editingData?.ibu_hamil || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Disabilitas</label>
              <input
                type="number"
                name="disabilitas"
                defaultValue={editingData?.disabilitas || ''}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingData(null); }}
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

export default Population;
