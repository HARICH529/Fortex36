import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Home, LogOut, User, MapPin, Activity } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/live-reports', icon: Activity, label: 'Live Reports' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/map-analytics', icon: MapPin, label: 'Map Analytics' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen w-screen bg-[#E6E6FA] overflow-hidden">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`flex flex-col h-screen bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 text-white shadow-2xl transition-all duration-300 ease-in-out z-50 fixed left-0 top-0 ${isExpanded ? 'w-72' : 'w-20'}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'}`}>
              <h2 className="text-lg font-bold tracking-tight">Admin Panel</h2>
              <p className="text-xs text-gray-400 font-medium tracking-wide">Civic Operations</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto no-scrollbar">
          <ul className="space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => setIsExpanded(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive(path)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {isActive(path) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />
                  )}
                  <Icon size={22} className={`min-w-[22px] transition-transform duration-300 ${!isExpanded && !isActive(path) ? 'group-hover:scale-110' : ''}`} />
                  <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'
                    }`}>
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 p-0 overflow-hidden border-0'}`}>
            <div className="p-2 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full shadow-inner">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">Admin User</p>
              <p className="text-xs text-gray-400 truncate">admin@pvp.com</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-900/20 transition-all duration-200 group ${!isExpanded ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="min-w-[20px]" />
            <span className={`font-semibold whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 hidden'
              }`}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isExpanded ? 'ml-72' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-5 sticky top-0 z-40 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Civic Issues Management System
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8 bg-[#E6E6FA] scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;