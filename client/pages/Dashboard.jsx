import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  AlertTriangle,
  Droplets,
  Camera,
  FileText,
  Activity,
  TrendingUp,
  Users,
  Baby,
  Heart,
  Accessibility,
  Home,
  Shield
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBadge, { getAlertLevel } from '../components/AlertBadge';
import {
  getMonitoringPoints,
  getReports,
  getStatisticsSummary,
  getEvacueeStats,
  getPopulationSummary,
  getEvacuationCenters,
  getStoredUser
} from '../api/api';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom icons
const createIcon = (color, size = 32) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

const iconColors = {
  pos_pantau: '#3b82f6',
  sensor: '#14b8a6',
  cctv: '#8b5cf6',
  warga: '#f59e0b'
};

// Component to handle map center
function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

function Dashboard() {
  const [monitoringPoints, setMonitoringPoints] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [evacueeStats, setEvacueeStats] = useState(null);
  const [populationSummary, setPopulationSummary] = useState(null);
  const [evacuationCenters, setEvacuationCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [user, setUser] = useState(null);

  // Get user's RW access
  const userRwAccess = user?.rw_access ? user.rw_access.split(',').map(r => r.trim()) : [];
  const isPICRW = user?.role === 'pic_rw';
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    setUser(getStoredUser());
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pointsRes, reportsRes, summaryRes, evacueeRes, populationRes, centersRes] = await Promise.all([
        getMonitoringPoints(),
        getReports({ limit: isPICRW ? 50 : 10 }),
        getStatisticsSummary(),
        getEvacueeStats(),
        getPopulationSummary(),
        getEvacuationCenters({})
      ]);

      setMonitoringPoints(pointsRes.data.data);
      setRecentReports(reportsRes.data.data);
      setSummary(summaryRes.data.data);
      setEvacueeStats(evacueeRes.data.data);
      setPopulationSummary(populationRes.data.data);
      setEvacuationCenters(centersRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate map center based on user's RW access
  const getMapCenter = () => {
    if (isPICRW && userRwAccess.length > 0) {
      const rwCoords = {
        '01': [-6.1450, 106.9920], '02': [-6.1465, 106.9905], '03': [-6.1440, 106.9890],
        '04': [-6.1470, 106.9875], '05': [-6.1425, 106.9910], '06': [-6.1490, 106.9940],
        '07': [-6.1435, 106.9880], '08': [-6.1480, 106.9860], '09': [-6.1410, 106.9935],
        '10': [-6.1455, 106.9850], '11': [-6.1500, 106.9885], '12': [-6.1465, 106.9840],
        '13': [-6.1420, 106.9870]
      };
      const firstRW = userRwAccess[0];
      return rwCoords[firstRW] || [-6.1455, 106.9900];
    }
    return [-6.1455, 106.9900]; // Default center
  };

  const mapCenter = getMapCenter();

  // Filter monitoring points for PIC RW
  const filteredPoints = isPICRW
    ? monitoringPoints.filter(p => userRwAccess.includes(p.rw))
    : monitoringPoints;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat data dashboard..." />
      </div>
    );
  }

  // Group points by type
  const pointsByType = {
    pos_pantau: filteredPoints.filter(p => p.type === 'pos_pantau'),
    sensor: filteredPoints.filter(p => p.type === 'sensor'),
    cctv: filteredPoints.filter(p => p.type === 'cctv'),
    warga: filteredPoints.filter(p => p.type === 'warga')
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* User Role Badge */}
      {isPICRW && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <p className="font-semibold">Mode PIC RW</p>
                <p className="text-sm text-blue-100">Anda hanya bisa melihat dan menginput data untuk RW: {userRwAccess.join(', ')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{userRwAccess.length}</p>
              <p className="text-sm text-blue-200">RW</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Laporan</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary?.total_reports || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Sepanjang waktu</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Titik Pantau</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary?.total_monitoring_points || 0}</p>
              <p className="text-xs text-slate-400 mt-1">RW 01 - RW 13</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-xl">
              <MapPin className="w-5 h-5 text-teal-600" />
            </div>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Sensor Aktif</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary?.active_sensors || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Terhubung</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Level Air</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary?.avg_water_level || 0} <span className="text-sm">cm</span></p>
              <p className="text-xs text-slate-400 mt-1">Rata-rata</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pengungsi</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{evacueeStats?.total || 0}</p>
              <p className="text-xs text-slate-400 mt-1">{evacuationCenters.length} pos evak.</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Penduduk</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {populationSummary?.summary?.total_population?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">{populationSummary?.summary?.total_kk || 0} KK</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Evacuee Summary - Special Alert for Vulnerable Groups */}
      {(evacueeStats?.vulnerable_groups?.length > 0) && (
        <Card title="⚠️ Analisis Kebutuhan Pengungsi" subtitle="Data pengungsi yang membutuhkan perhatian khusus" icon={AlertTriangle} gradient>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            {evacueeStats.vulnerable_groups.map((group) => {
              let icon = Users;
              let color = 'bg-white/20';
              let needs = [];

              switch (group.category) {
                case 'bayi':
                  icon = Baby;
                  color = 'bg-pink-100';
                  needs = ['Popok Bayi', 'Susu', 'Makanan Bayi'];
                  break;
                case 'balita':
                  icon = Baby;
                  color = 'bg-rose-100';
                  needs = ['Popok', 'Susu', 'Makanan Bayi'];
                  break;
                case 'ibu_hamil':
                  icon = Heart;
                  color = 'bg-red-100';
                  needs = ['Nutrisi Khusus', 'Vitamin', 'Pemeriksaan Kesehatan'];
                  break;
                case 'lansia':
                  icon = Users;
                  color = 'bg-purple-100';
                  needs = ['Obat Kronis', 'Nutrisi Khusus', 'Perawatan'];
                  break;
                case 'disabilitas':
                  icon = Accessibility;
                  color = 'bg-blue-100';
                  needs = ['Alat Bantu', 'Aksesibilitas', 'Pendamping'];
                  break;
                default:
                  icon = Users;
                  color = 'bg-slate-100';
              }

              return (
                <div key={group.category} className={`p-4 rounded-xl ${color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <icon className="w-5 h-5 text-slate-700" />
                    <span className="font-semibold text-sm text-slate-800 capitalize">
                      {group.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{group.count}</p>
                  <p className="text-xs text-slate-600">orang</p>
                  {needs.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-300">
                      <p className="text-xs font-medium text-slate-700 mb-1">Kebutuhan:</p>
                      <div className="flex flex-wrap gap-1">
                        {needs.map((need, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-200 rounded text-xs text-slate-700">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aid Recommendations */}
          <div className="mt-6 p-4 bg-slate-100 rounded-xl">
            <h4 className="font-semibold text-slate-800 mb-3">📦 Rekomendasi Bantuan untuk Pimpinan:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {evacueeStats.vulnerable_groups?.find(g => g.category === 'bayi' || g.category === 'balita') && (
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-800">👶 Untuk Bayi & Balita</p>
                  <ul className="text-xs text-slate-700 mt-1 space-y-0.5">
                    <li>• Popok bayi</li>
                    <li>• Susu formula / susu pertumbuhan</li>
                    <li>• Makanan tambahan bayi</li>
                    <li>• Obat tetes mata / demam</li>
                  </ul>
                </div>
              )}
              {evacueeStats.vulnerable_groups?.find(g => g.category === 'ibu_hamil') && (
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-800">🤰 Untuk Ibu Hamil</p>
                  <ul className="text-xs text-slate-700 mt-1 space-y-0.5">
                    <li>• Makanan bergizi tinggi</li>
                    <li>• Vitamin & suplemen</li>
                    <li>• Perawatan kesehatan ibu</li>
                    <li>• Perlengkapan melahirkan</li>
                  </ul>
                </div>
              )}
              {evacueeStats.vulnerable_groups?.find(g => g.category === 'lansia' || g.category === 'disabilitas') && (
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-800">👴 Untuk Lansia & Disabilitas</p>
                  <ul className="text-xs text-slate-700 mt-1 space-y-0.5">
                    <li>• Obat penyakit kronis</li>
                    <li>• Makanan lembut/nutrisi khusus</li>
                    <li>• Alat bantu mobilitas</li>
                    <li>• Pendamping/pengasuh</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card title="Peta Monitoring RW" subtitle="Klik marker untuk detail" icon={MapPin}>
            <div className="relative">
              <MapContainer
                center={mapCenter}
                zoom={13}
                className="h-[500px] w-full rounded-xl"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenter center={mapCenter} />

                {/* Render markers for each point */}
                {filteredPoints.map((point) => (
                  <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                    icon={createIcon(iconColors[point.type] || '#gray')}
                    eventHandlers={{
                      click: () => setSelectedPoint(point),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <h4 className="font-semibold text-slate-800">{point.name}</h4>
                        <p className="text-sm text-slate-500">RW {point.rw}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            point.type === 'pos_pantau' ? 'bg-blue-100 text-blue-700' :
                            point.type === 'sensor' ? 'bg-teal-100 text-teal-700' :
                            point.type === 'cctv' ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {point.type === 'pos_pantau' ? 'Pos Pantau' :
                             point.type === 'sensor' ? 'Sensor' :
                             point.type === 'cctv' ? 'CCTV' : 'Warga'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            point.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {point.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        {point.latest_water_level && (
                          <div className="mt-3 pt-2 border-t">
                            <p className="text-xs text-slate-500">Level Air</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-bold">{point.latest_water_level} cm</span>
                              <AlertBadge level={getAlertLevel(point.latest_water_level)} />
                            </div>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white p-4 rounded-xl shadow-lg z-[1000]">
                <p className="text-sm font-semibold text-slate-700 mb-3">Legenda</p>
                <div className="space-y-2">
                  {[
                    { color: '#3b82f6', label: 'Pos Pantau', count: pointsByType.pos_pantau.length },
                    { color: '#14b8a6', label: 'Sensor Air', count: pointsByType.sensor.length },
                    { color: '#8b5cf6', label: 'CCTV', count: pointsByType.cctv.length },
                    { color: '#f59e0b', label: 'Laporan Warga', count: pointsByType.warga.length },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-slate-600">{item.label}</span>
                      <span className="text-xs text-slate-400">({item.count})</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-slate-600 mb-2">Level Air</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-slate-500">&lt;40cm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-xs text-slate-500">40-80cm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs text-slate-500">&gt;80cm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Latest Sensor Readings */}
          <Card title="Sensor Air Terkini" subtitle="Level air dari semua sensor" icon={Droplets}>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {summary?.sensor_readings?.slice(0, 8).map((sensor) => (
                <div key={sensor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">RW {sensor.rw}</p>
                    <p className="text-xs text-slate-400">{sensor.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-800">{sensor.water_level}cm</span>
                      <AlertBadge level={getAlertLevel(sensor.water_level)} showLabel={false} />
                    </div>
                  </div>
                </div>
              ))}
              {(!summary?.sensor_readings || summary.sensor_readings.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">Tidak ada data sensor</p>
              )}
            </div>
          </Card>

          {/* Recent Reports */}
          <Card title="Laporan Terbaru" subtitle="10 laporan terakhir" icon={FileText}>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentReports.slice(0, 6).map((report) => (
                <div key={report.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{report.reporter_name}</p>
                      <p className="text-xs text-slate-400">RW {report.rw} • {new Date(report.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.category === 'banjir' ? 'bg-red-100 text-red-700' :
                      report.category === 'genangan' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {report.category}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 water-level-indicator" style={{ height: '4px' }} />
                    <span className="text-xs font-medium text-slate-600">{report.water_level}cm</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Evacuation Centers Capacity */}
      <Card title="📍 Kapasitas Pos Evakuasi" subtitle="Status terkini setiap lokasi evakuasi">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {evacuationCenters.slice(0, 8).map((center) => {
            const capacityPercent = center.capacity > 0
              ? Math.round(((center.evacuee_count || 0) / center.capacity) * 100)
              : 0;
            const statusColor = capacityPercent >= 100 ? 'bg-red-500' :
                               capacityPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

            return (
              <div key={center.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-sm">{center.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    center.status === 'active' ? 'bg-green-100 text-green-700' :
                    center.status === 'full' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {center.status === 'active' ? 'Aktif' : center.status === 'full' ? 'Penuh' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">RW {center.rw}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{center.evacuee_count || 0}</p>
                    <p className="text-xs text-slate-400">dari {center.capacity || 0} orang</p>
                  </div>
                  <span className="text-sm font-medium text-slate-600">{capacityPercent}%</span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColor} transition-all rounded-full`}
                    style={{ width: `${Math.min(100, capacityPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {evacuationCenters.length === 0 && (
          <div className="text-center py-8">
            <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Belum ada data pos evakuasi</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Dashboard;
