import { useState, useEffect } from 'react';
import { FileText, MapPin, Droplets, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBadge, { getAlertLevel } from '../components/AlertBadge';
import { getReportsByRW } from '../api/api';

const RW_LIST = Array.from({ length: 13 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: `RW ${String(i + 1).padStart(2, '0')}`
}));

function LaporanRW() {
  const [selectedRW, setSelectedRW] = useState('01');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRW) {
      fetchReports(selectedRW);
    }
  }, [selectedRW]);

  const fetchReports = async (rw) => {
    setLoading(true);
    try {
      const res = await getReportsByRW(rw);
      setReports(res.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for selected RW
  const stats = {
    total: reports.length,
    banjir: reports.filter(r => r.category === 'banjir').length,
    genangan: reports.filter(r => r.category === 'genangan').length,
    longsor: reports.filter(r => r.category === 'longsor').length,
    avgLevel: reports.length > 0
      ? (reports.reduce((sum, r) => sum + r.water_level, 0) / reports.length).toFixed(1)
      : 0,
    maxLevel: reports.length > 0
      ? Math.max(...reports.map(r => r.water_level))
      : 0,
    dangerCount: reports.filter(r => r.water_level > 80).length
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* RW Selector */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-800">Pilih RW</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {RW_LIST.map(rw => (
              <button
                key={rw.value}
                onClick={() => setSelectedRW(rw.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRW === rw.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rw.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Laporan</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Droplets className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.avgLevel} <span className="text-base">cm</span></p>
              <p className="text-sm text-slate-500">Rata-rata Air</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.maxLevel} <span className="text-base">cm</span></p>
              <p className="text-sm text-slate-500">Level Tertinggi</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertBadge level="danger" showLabel={false} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.dangerCount}</p>
              <p className="text-sm text-slate-500">Event Bahaya</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Laporan Banjir</span>
            <span className="text-xl font-bold text-red-600">{stats.banjir}</span>
          </div>
          <div className="mt-2 h-2 bg-red-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: stats.total > 0 ? `${(stats.banjir / stats.total) * 100}%` : '0%' }}
            />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Genangan</span>
            <span className="text-xl font-bold text-yellow-600">{stats.genangan}</span>
          </div>
          <div className="mt-2 h-2 bg-yellow-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: stats.total > 0 ? `${(stats.genangan / stats.total) * 100}%` : '0%' }}
            />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Longsor</span>
            <span className="text-xl font-bold text-orange-600">{stats.longsor}</span>
          </div>
          <div className="mt-2 h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: stats.total > 0 ? `${(stats.longsor / stats.total) * 100}%` : '0%' }}
            />
          </div>
        </Card>
      </div>

      {/* Reports Table */}
      <Card title={`Laporan RW ${selectedRW}`} subtitle={`${reports.length} laporan`} icon={FileText}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Memuat laporan..." />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Tidak ada laporan untuk RW {selectedRW}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Pelapor</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Kategori</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Level Air</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(report.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">
                      {report.reporter_name}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.category === 'banjir' ? 'bg-red-100 text-red-700' :
                        report.category === 'genangan' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-bold ${
                          report.water_level > 80 ? 'text-red-600' :
                          report.water_level > 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {report.water_level} cm
                        </span>
                        <AlertBadge level={getAlertLevel(report.water_level)} showLabel={false} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                      {report.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default LaporanRW;
