import { useState, useEffect } from 'react';
import { Video, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSettings } from '../api/api';

function CCTV() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCameras, setActiveCameras] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cameras = [
    {
      id: 1,
      name: 'Kamera 1',
      location: 'Pos Utama RW 02',
      url: settings?.cctv_url_1 || '',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      name: 'Kamera 2',
      location: 'Area Permukiman',
      url: settings?.cctv_url_2 || '',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 3,
      name: 'Kamera 3',
      location: 'Titik Rawan Banjir',
      url: settings?.cctv_url_3 || '',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 4,
      name: 'Kamera 4',
      location: 'Saluran Pembuangan',
      url: settings?.cctv_url_4 || '',
      color: 'from-amber-500 to-amber-600'
    }
  ];

  const toggleCamera = (id) => {
    setActiveCameras(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat CCTV..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Kamera Pengawas</h3>
          <p className="text-sm text-slate-500">Monitoring real-time melalui CCTV</p>
        </div>
        <a
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Konfigurasi Kamera
        </a>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Informasi</p>
          <p className="text-xs text-blue-600 mt-1">
            Konfigurasikan URL streaming CCTV di halaman Pengaturan. CCTV harus mendukung protokol embed atau streaming HTTP/HTTPS.
          </p>
        </div>
      </div>

      {/* CCTV Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cameras.map((camera) => {
          const hasUrl = camera.url && camera.url.trim() !== '';
          const isActive = activeCameras[camera.id] && hasUrl;

          return (
            <Card key={camera.id} className="overflow-hidden">
              {/* Camera Header */}
              <div className={`bg-gradient-to-r ${camera.color} px-5 py-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-white" />
                    <div>
                      <h4 className="font-semibold text-white">{camera.name}</h4>
                      <p className="text-xs text-white/80">{camera.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-xs text-white/80">
                      {isActive ? 'LIVE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera Feed */}
              <div className="relative bg-slate-900" style={{ height: '300px' }}>
                {isActive ? (
                  <iframe
                    src={camera.url}
                    title={camera.name}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Video className="w-16 h-16 text-slate-600 mb-3" />
                    <p className="text-slate-400 text-sm font-medium">
                      {hasUrl ? 'Klik "Tonton" untuk melihat streaming' : 'URL belum dikonfigurasi'}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {hasUrl ? 'Tekan tombol Tonton di bawah' : 'Konfigurasi URL di halaman Pengaturan'}
                    </p>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="px-5 py-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasUrl ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-slate-500">
                      {hasUrl ? 'Terhubung' : 'Belum dikonfigurasi'}
                    </span>
                  </div>
                  {hasUrl && (
                    <button
                      onClick={() => toggleCamera(camera.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      }`}
                    >
                      {isActive ? 'Matikan' : 'Tonton'}
                    </button>
                  )}
                </div>
                {hasUrl && (
                  <p className="text-xs text-slate-400 mt-2 truncate">
                    URL: {camera.url}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {cameras.every(c => !c.url) && (
        <Card className="text-center py-12">
          <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-700">Belum Ada CCTV Terkonfigurasi</h4>
          <p className="text-slate-500 mt-2 mb-4">
            Tambahkan URL streaming CCTV di halaman Pengaturan untuk mulai memantau.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Buka Pengaturan
          </a>
        </Card>
      )}
    </div>
  );
}

export default CCTV;
