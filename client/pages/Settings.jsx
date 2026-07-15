import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Video,
  Droplets,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSettings, updateSettings } from '../api/api';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    cctv_url_1: '',
    cctv_url_2: '',
    cctv_url_3: '',
    cctv_url_4: '',
    threshold_red: 80,
    threshold_yellow: 40
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      const data = res.data.data;
      setSettings(data);
      setFormData({
        cctv_url_1: data.cctv_url_1 || '',
        cctv_url_2: data.cctv_url_2 || '',
        cctv_url_3: data.cctv_url_3 || '',
        cctv_url_4: data.cctv_url_4 || '',
        threshold_red: data.threshold_red || 80,
        threshold_yellow: data.threshold_yellow || 40
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.startsWith('cctv') ? value : parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await updateSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat pengaturan..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">Pengaturan berhasil disimpan!</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* CCTV Configuration */}
      <Card title="Konfigurasi CCTV" subtitle="URL streaming untuk kamera pengawas" icon={Video}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((num) => (
              <div key={num}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kamera {num}
                </label>
                <input
                  type="url"
                  name={`cctv_url_${num}`}
                  value={formData[`cctv_url_${num}`]}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Supports: YouTube Live, RTSP, HTTP/HTTPS streams
                </p>
              </div>
            ))}
          </div>

          {/* Threshold Settings */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-primary-600" />
              Pengaturan Threshold Level Air
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Level Bahaya (Merah): {formData.threshold_red} cm
                </label>
                <input
                  type="range"
                  name="threshold_red"
                  min="50"
                  max="150"
                  value={formData.threshold_red}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Level air di atas ini dianggap BAHAYA
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Level Waspada (Kuning): {formData.threshold_yellow} cm
                </label>
                <input
                  type="range"
                  name="threshold_yellow"
                  min="20"
                  max="80"
                  value={formData.threshold_yellow}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Level air di atas ini dianggap WASPADA
                </p>
              </div>
            </div>

            {/* Level Indicator Preview */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-700 mb-3">Preview Level:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-sm text-slate-600">Normal</span>
                  </div>
                  <span className="text-xs text-slate-500">0 - {formData.threshold_yellow} cm</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                    <span className="text-sm text-slate-600">Waspada</span>
                  </div>
                  <span className="text-xs text-slate-500">{formData.threshold_yellow + 1} - {formData.threshold_red} cm</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-600">Bahaya</span>
                  </div>
                  <span className="text-xs text-slate-500">&gt; {formData.threshold_red} cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={fetchSettings}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
                saving
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-lg'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </Card>

      {/* System Info */}
      <Card title="Informasi Sistem" subtitle="Detail aplikasi SAHABAT UTARA" icon={SettingsIcon}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Versi Aplikasi</p>
            <p className="text-lg font-bold text-slate-800">1.0.0</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Database</p>
            <p className="text-lg font-bold text-slate-800">SQLite</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Framework</p>
            <p className="text-lg font-bold text-slate-800">React + Express</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Tahun</p>
            <p className="text-lg font-bold text-slate-800">2026</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h5 className="text-sm font-semibold text-blue-800 mb-2">Tentang SAHABAT UTARA</h5>
          <p className="text-xs text-blue-600 leading-relaxed">
            SAHABAT UTARA (Sistem Antisipasi Hadapi Banjir Terpadu) adalah platform monitoring
            real-time berbasis partisipasi masyarakat untuk mempercepat respon tanggap darurat
            dan peringatan dini banjir di wilayah Kecamatan Bekasi Utara, Kota Bekasi.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default Settings;
