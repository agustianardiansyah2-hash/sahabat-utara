import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Calendar, FileText, TrendingUp, Download } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { getReportsAnnual, getMonthlyStats } from '../api/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function Laporan() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [reports, setReports] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(selectedYear);
  }, [selectedYear]);

  const fetchData = async (year) => {
    setLoading(true);
    try {
      const [reportsRes, monthlyRes] = await Promise.all([
        getReportsAnnual(year),
        getMonthlyStats(year)
      ]);
      setReports(reportsRes.data.data);
      setMonthlyStats(monthlyRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create monthly data with zeros for missing months
  const monthlyData = MONTHS.map((month, idx) => {
    const monthNum = String(idx + 1).padStart(2, '0');
    const data = monthlyStats.find(s => s.month === monthNum);
    return {
      month,
      total: data?.total_reports || 0,
      banjir: data?.banjir_count || 0,
      avg_water_level: data?.avg_water_level || 0,
      danger_count: data?.danger_level_count || 0
    };
  });

  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Total Laporan',
        data: monthlyData.map(m => m.total),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Laporan Banjir',
        data: monthlyData.map(m => m.banjir),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
      }
    ]
  };

  const lineChartData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Rata-rata Level Air (cm)',
        data: monthlyData.map(m => m.avg_water_level),
        borderColor: 'rgba(14, 165, 233, 1)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  // Summary calculations
  const totalReports = reports.length;
  const banjirReports = reports.filter(r => r.category === 'banjir').length;
  const avgWaterLevel = reports.length > 0
    ? (reports.reduce((sum, r) => sum + r.water_level, 0) / reports.length).toFixed(1)
    : 0;
  const dangerReports = reports.filter(r => r.water_level > 80).length;

  // Find peak month
  const peakMonth = monthlyData.reduce((max, m) => m.total > max.total ? m : max, { total: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat laporan..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Pilih Tahun</h3>
        <div className="flex gap-2">
          {YEARS.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedYear === year
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalReports}</p>
              <p className="text-sm text-slate-500">Total Laporan {selectedYear}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{banjirReports}</p>
              <p className="text-sm text-slate-500">Laporan Banjir</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{peakMonth.month || '-'}</p>
              <p className="text-sm text-slate-500">Bulan Tertinggi ({peakMonth.total} laporan)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{avgWaterLevel} <span className="text-base">cm</span></p>
              <p className="text-sm text-slate-500">Rata-rata Level Air</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Peristiwa Banjir Bulanan" subtitle={`Grafik tahun ${selectedYear}`} icon={FileText}>
          <div className="h-[300px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </Card>

        <Card title="Tren Level Air Bulanan" subtitle={`Rata-rata tinggi air tahun ${selectedYear}`} icon={TrendingUp}>
          <div className="h-[300px]">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Monthly Detail Table */}
      <Card title="Detail Peristiwa Banjir Bulanan" subtitle={`Tahun ${selectedYear}`} icon={Calendar}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Bulan</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Total Laporan</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Banjir</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Rata-rata Air</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Event Bahaya</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((data, idx) => (
                <tr key={idx} className={`border-b border-slate-100 ${data.total === peakMonth.total && peakMonth.total > 0 ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{data.month} {selectedYear}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-bold ${data.total > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                      {data.total}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-red-600 font-medium">
                    {data.banjir}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-medium ${
                      data.avg_water_level > 80 ? 'text-red-600' :
                      data.avg_water_level > 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {data.avg_water_level.toFixed(1)} cm
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.danger_count > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {data.danger_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Reports Table */}
      <Card title={`Daftar Laporan ${selectedYear}`} subtitle={`${reports.length} laporan`} icon={FileText}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Tanggal</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Pelapor</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">RW</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Kategori</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Level Air</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 20).map((report) => (
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
                  <td className="text-center py-3 px-4 text-sm text-slate-600">
                    RW {report.rw}
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
                    <span className={`font-bold ${
                      report.water_level > 80 ? 'text-red-600' :
                      report.water_level > 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {report.water_level} cm
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length > 20 && (
            <p className="text-center text-sm text-slate-500 py-3">
              Menampilkan 20 dari {reports.length} laporan
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Laporan;
