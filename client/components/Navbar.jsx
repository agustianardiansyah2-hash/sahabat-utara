import { useLocation } from 'react-router-dom';
import { Bell, Search, LogOut } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Peta Monitoring Partisipatif' },
  '/input-data': { title: 'Input Data', subtitle: 'Pelaporan Banjir Warga' },
  '/evacuation-centers': { title: 'Pos Evakuasi', subtitle: 'Kelola Lokasi Evakuasi' },
  '/evacuees': { title: 'Data Pengungsi', subtitle: 'Kelola Data Pengungsi' },
  '/population': { title: 'Data Penduduk', subtitle: 'Demografi per RW' },
  '/informasi': { title: 'Informasi', subtitle: 'Statistik & Data Banjir' },
  '/laporan': { title: 'Laporan', subtitle: 'Laporan Tahunan Banjir' },
  '/laporan-rw': { title: 'Laporan RW', subtitle: 'Laporan Per RW' },
  '/cctv': { title: 'CCTV', subtitle: 'Kamera Pengawas' },
  '/settings': { title: 'Pengaturan', subtitle: 'Konfigurasi Sistem' },
  '/users': { title: 'Manajemen User', subtitle: 'Kelola Akses User' },
};

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const currentPage = pageTitles[location.pathname] || pageTitles['/'];
  const currentDate = dayjs().format('dddd, DD MMMM YYYY');
  const currentTime = dayjs().format('HH:mm:ss');

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">{currentPage.title}</h2>
          <p className="text-sm text-slate-500">{currentPage.subtitle}</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Date & Time */}
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-slate-700">{currentDate}</p>
            <p className="text-xs text-accent-600 font-semibold">
              {currentTime} WIB
            </p>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-slate-200" />

          {/* Search */}
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-700">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">
                {user?.role === 'super_admin' ? 'Super Admin' : `PIC RW ${user?.rw_access || ''}`}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
