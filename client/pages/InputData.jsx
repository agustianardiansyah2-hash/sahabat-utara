import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Camera,
  Droplets,
  AlertTriangle,
  FileText,
  CheckCircle,
  Shield
} from 'lucide-react';
import Card from '../components/Card';
import AlertBadge, { getAlertLevel, getWaterLevelColor } from '../components/AlertBadge';
import { createReport, getMonitoringPoints, getStoredUser } from '../api/api';
import dayjs from 'dayjs';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #ef4444;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={markerIcon}>
    </Marker>
  );
}

const RW_LIST = Array.from({ length: 13 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return { value: num, label: `RW ${num}` };
});

const CATEGORIES = [
  { value: 'banjir', label: 'Banjir', color: 'bg-red-500' },
  { value: 'genangan', label: 'Genangan', color: 'bg-yellow-500' },
  { value: 'longsor', label: 'Longsor', color: 'bg-orange-500' }
];

function InputData() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    reporter_name: '',
    rw: '',
    category: 'banjir',
    water_level: 0,
    description: '',
    latitude: '',
    longitude: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [position, setPosition] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Get user's RW access
  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    // Set default RW for PIC RW
    if (storedUser?.role === 'pic_rw' && storedUser?.rw_access) {
      setFormData(prev => ({ ...prev, rw: storedUser.rw_access.split(',')[0].trim() }));
    }
  }, []);

  // Filter RW list based on user role
  const getRWList = () => {
    if (user?.role === 'pic_rw' && user?.rw_access) {
      return user.rw_access.split(',').map(r => ({
        value: r.trim(),
        label: `RW ${r.trim()}`
      }));
    }
    return Array.from({ length: 13 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return { value: num, label: `RW ${num}` };
    });
  };

  const rwList = getRWList();
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getWaterLevelStatus = (level) => {
    if (level > 80) return 'danger';
    if (level > 40) return 'warning';
    return 'safe';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('reporter_name', formData.reporter_name);
      formDataToSend.append('rw', formData.rw);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('water_level', formData.water_level);
      formDataToSend.append('description', formData.description);
      if (position) {
        formDataToSend.append('latitude', position.lat);
        formDataToSend.append('longitude', position.lng);
      }
      if (photo) {
        formDataToSend.append('photo', photo);
      }

      await createReport(formDataToSend);
      setSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          reporter_name: '',
          rw: '',
          category: 'banjir',
          water_level: 0,
          description: '',
          latitude: '',
          longitude: ''
        });
        setPhoto(null);
        setPhotoPreview(null);
        setPosition(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengirim laporan');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Laporan Berhasil Dikirim!</h3>
          <p className="text-slate-500 mt-2">Terima kasih atas laporan Anda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
      {/* Form */}
      <Card title="Form Pelaporan Banjir" subtitle="Isi data dengan lengkap dan akurat" icon={FileText}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Reporter Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Pelapor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="reporter_name"
              value={formData.reporter_name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          {/* RW Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              RW <span className="text-red-500">*</span>
            </label>
            <select
              name="rw"
              value={formData.rw}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="">Pilih RW</option>
              {rwList.map(rw => (
                <option key={rw.value} value={rw.value}>{rw.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.category === cat.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${cat.color} mx-auto mb-1`} />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Water Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tinggi Air: <span className="text-primary-600 font-bold">{formData.water_level} cm</span>
            </label>
            <input
              type="range"
              name="water_level"
              min="0"
              max="150"
              value={formData.water_level}
              onChange={handleInputChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              style={{
                background: `linear-gradient(to right, ${getWaterLevelColor(formData.water_level)} 0%, ${getWaterLevelColor(formData.water_level)} ${formData.water_level / 150 * 100}%, #e2e8f0 ${formData.water_level / 150 * 100}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0 cm</span>
              <span>40 cm</span>
              <span>80 cm</span>
              <span>150 cm</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <AlertBadge level={getWaterLevelStatus(formData.water_level)} />
              <span className={`text-sm font-medium ${
                getWaterLevelStatus(formData.water_level) === 'danger' ? 'text-red-600' :
                getWaterLevelStatus(formData.water_level) === 'warning' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {getWaterLevelStatus(formData.water_level) === 'danger' ? 'Level Bahaya!' :
                 getWaterLevelStatus(formData.water_level) === 'warning' ? 'Level Waspada' :
                 'Level Normal'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              placeholder="Deskripsikan kondisi banjir di lokasi..."
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Foto Lokasi
            </label>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
              photoPreview ? 'border-primary-300 bg-primary-50' : 'border-slate-300 hover:border-primary-400'
            }`}>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Klik untuk upload foto</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, atau WEBP (maks. 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-lg font-medium text-white transition-all ${
              submitting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </Card>

      {/* Map */}
      <Card title="Pilih Lokasi" subtitle="Klik pada peta untuk memilih titik laporan" icon={MapPin}>
        <div className="space-y-4">
          {/* Coordinates Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Latitude</p>
              <p className="font-mono font-medium text-slate-700">
                {position ? position.lat.toFixed(6) : '-'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Longitude</p>
              <p className="font-mono font-medium text-slate-700">
                {position ? position.lng.toFixed(6) : '-'}
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200">
            <MapContainer
              center={[-6.1455, 106.9900]}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Petunjuk</p>
              <p className="text-xs text-blue-600 mt-1">
                Klik pada peta untuk menandai lokasi banjir. Anda juga bisa drag marker untuk menyesuaikan posisi.
              </p>
            </div>
          </div>

          {/* Location Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-accent-600" />
              <span className="text-sm font-medium text-slate-700">Target Area:</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Kampung Lebak RW 02, Kelurahan Teluk Pucung, Kecamatan Bekasi Utara, Kota Bekasi
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default InputData;
