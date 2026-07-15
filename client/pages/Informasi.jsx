import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { BarChart3, TrendingUp, AlertTriangle, Droplets } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { getFrequencyStats, getRiskAreas, getStatisticsCategories } from '../api/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function Informasi() {
  const [frequencyData, setFrequencyData] = useState([]);
  const [riskAreas, setRiskAreas] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [freqRes, riskRes, catRes] = await Promise.all([
        getFrequencyStats(),
        getRiskAreas(),
        getStatisticsCategories()
      ]);
      setFrequencyData(freqRes.data.data);
      setRiskAreas(riskRes.data.data);
      setCategoryStats(catRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Memuat statistik..." />
      </div>
    );
  }

  // Chart data for yearly frequency
  const years = frequencyData.map(d => d.year).reverse();
  const yearlyReports = frequencyData.map(d => d.total_reports).reverse();
  const banjirCounts = frequencyData.map(d => d.banjir_count).reverse();

  const frequencyChartData = {
    labels: years,
    datasets: [
      {
        label: 'Total Laporan',
        data: yearlyReports,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
      {
        label: 'Laporan Banjir',
        data: banjirCounts,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        borderRadius: 8,
      }
    ]
  };

  // Category pie chart
  const categoryChartData = {
    labels: categoryStats.map(c => {
      const labels = { banjir: 'Banjir', genangan: 'Genangan', longsor: 'Longsor' };
      return labels[c.category] || c.category;
    }),
    datasets: [{
      data: categoryStats.map(c => c.count),
      backgroundColor: ['#ef4444', '#f59e0b', '#f97316'],
      borderWidth: 0,
    }]
  };

  // Risk level distribution
  const riskCounts = {
    high: riskAreas.filter(r => r.risk_level === 'high').length,
    medium: riskAreas.filter(r => r.risk_level === 'medium').length,
    low: riskAreas.filter(r => r.risk_level === 'low').length,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  // Calculate totals
  const totalReports = frequencyData.reduce((sum, d) => sum + d.total_reports, 0);
  const totalBanjir = frequencyData.reduce((sum, d) => sum + d.banjir_count, 0);
  const avgWaterLevel = frequencyData.length > 0
    ? (frequencyData.reduce((sum, d) => sum + d.avg_water_level, 0) / frequencyData.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <BarChart3 className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-slate-800">{totalReports}</p>
          <p className="text-sm text-slate-500">Total Laporan</p>
          <p className="text-xs text-slate-400 mt-1">(2020-2025)</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-slate-800">{totalBanjir}</p>
          <p className="text-sm text-slate-500">Laporan Banjir</p>
          <p className="text-xs text-slate-400 mt-1">(2020-2025)</p>
        </Card>
        <Card className="text-center">
          <Droplets className="w-8 h-8 text-accent-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-slate-800">{avgWaterLevel} <span className="text-lg">cm</span></p>
          <p className="text-sm text-slate-500">Rata-rata Tinggi Air</p>
          <p className="text-xs text-slate-400 mt-1">Seluruh periode</p>
        </Card>
        <Card className="text-center">
          <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-slate-800">{riskCounts.high}</p>
          <p className="text-sm text-slate-500">RW Rawan Tinggi</p>
          <p className="text-xs text-slate-400 mt-1">Perlu perhatian khusus</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yearly Frequency Chart */}
        <Card title="Frekuensi Banjir Tahunan" subtitle="Jumlah laporan per tahun (2020-2025)" icon={BarChart3}>
          <div className="h-[300px]">
            <Bar data={frequencyChartData} options={chartOptions} />
          </div>
        </Card>

        {/* Category Distribution */}
        <Card title="Distribusi Kategori" subtitle="Persentase jenis laporan" icon={BarChart3}>
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-full max-w-[250px]">
              <Pie data={categoryChartData} options={chartOptions} />
            </div>
          </div>
        </Card>
      </div>

      {/* Risk Areas Table */}
      <Card title="Area Rawan Banjir" subtitle="Klasifikasi risiko per RW" icon={AlertTriangle}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">RW</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Total Laporan</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Rata-rata Level</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Event Bahaya</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Tingkat Risiko</th>
              </tr>
            </thead>
            <tbody>
              {riskAreas.map((area) => (
                <tr key={area.rw} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">RW {area.rw}</span>
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">{area.total_reports}</td>
                  <td className="text-center py-3 px-4">
                    <span className="font-medium">{area.avg_water_level?.toFixed(1)} cm</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      area.danger_events > 5 ? 'bg-red-100 text-red-700' :
                      area.danger_events > 2 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {area.danger_events} events
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      area.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                      area.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {area.risk_level === 'high' ? '🔴 Tinggi' :
                       area.risk_level === 'medium' ? '🟡 Sedang' :
                       '🟢 Rendah'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Statistics Detail */}
      <Card title="Detail Statistik Tahunan" subtitle="Data lengkap per tahun">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {frequencyData.reverse().map((year) => (
            <div key={year.year} className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-3">{year.year}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Laporan:</span>
                  <span className="font-medium">{year.total_reports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Banjir:</span>
                  <span className="font-medium text-red-600">{year.banjir_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Genangan:</span>
                  <span className="font-medium text-yellow-600">{year.genangan_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rata-rata Air:</span>
                  <span className="font-medium">{year.avg_water_level?.toFixed(1)} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Level Tertinggi:</span>
                  <span className="font-medium text-red-600">{year.max_water_level} cm</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Informasi;
