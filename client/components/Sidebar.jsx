import { NavLink } from 'react-router-dom';
import {
  Map,
  FileEdit,
  BarChart3,
  FileText,
  Video,
  Settings,
  Droplets,
  Waves,
  Users,
  Home,
  UsersRound,
  Shield,
  LogOut
} from 'lucide-react';

function Sidebar({ user, onLogout }) {
  // Define menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      { path: '/', icon: Map, label: 'Dashboard', roles: ['super_admin', 'pic_rw'] },
      { path: '/input-data', icon: FileEdit, label: 'Input Data', roles: ['super_admin', 'pic_rw'] },
    ];

    // PIC RW data management items
    const picRwItems = [
      { path: '/evacuation-centers', icon: Home, label: 'Pos Evakuasi', roles: ['super_admin', 'pic_rw'] },
      { path: '/evacuees', icon: Users, label: 'Data Pengungsi', roles: ['super_admin', 'pic_rw'] },
      { path: '/population', icon: UsersRound, label: 'Data Penduduk', roles: ['super_admin', 'pic_rw'] },
    ];

    // Super Admin only items
    const adminItems = [
      { path: '/informasi', icon: BarChart3, label: 'Informasi', roles: ['super_admin'] },
      { path: '/laporan', icon: FileText, label: 'Laporan', roles: ['super_admin'] },
      { path: '/laporan-rw', icon: FileText, label: 'Laporan RW', roles: ['super_admin'] },
      { path: '/cctv', icon: Video, label: 'CCTV', roles: ['super_admin'] },
      { path: '/users', icon: Shield, label: 'Manajemen User', roles: ['super_admin'] },
      { path: '/settings', icon: Settings, label: 'Pengaturan', roles: ['super_admin'] },
    ];

    const userRole = user?.role || 'pic_rw';

    if (userRole === 'super_admin') {
      return [...baseItems, ...picRwItems, ...adminItems];
    }

    // PIC RW - data management items
    return [...baseItems, ...picRwItems];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary-800 to-primary-900 shadow-xl z-50">
      {/* Logo Header */}
      <div className="px-6 py-6 border-b border-primary-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">SAHABAT</h1>
            <p className="text-primary-300 text-xs font-medium">UTARA</p>
          </div>
        </div>
        <p className="text-primary-400 text-xs mt-3 leading-relaxed">
          Sistem Antisipasi Hadapi Banjir Terpadu
        </p>
      </div>

      {/* User Badge */}
      <div className="mx-4 mt-4 p-3 bg-primary-700/30 rounded-lg border border-primary-600/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-primary-400 text-xs">
              {user?.role === 'super_admin' ? 'Super Admin' : `PIC RW ${user?.rw_access || ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-md'
                      : 'text-primary-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-400' : ''}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-400" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-16 left-0 right-0 px-3">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-primary-700/50">
        <p className="text-primary-500 text-xs text-center">
          © 2026 Kecamatan Bekasi Utara
        </p>
        <p className="text-primary-600 text-xs text-center mt-1">
          Versi 1.0.0
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
