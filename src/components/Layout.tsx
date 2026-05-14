import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Menu, Bell, Search, ChevronRight, Image, Sun, Key, UserIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const breadcrumbs = location.pathname.split('/').filter(Boolean);

  const isDashboard = location.pathname === '/' || location.pathname === '/hr';

  return (
    <div className="h-screen overflow-hidden bg-[#F4F4F5] flex font-sans">
      {!isDashboard && (
        <Sidebar 
          isCollapsed={isCollapsed} 
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      )}
      
      {/* Main Content Area */}
      <main className={cn(
        "flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300",
        isDashboard ? "pl-0" : (isCollapsed ? "pl-20" : "pl-64")
      )}>
        {/* Sticky Topbar */}
        <header className="shrink-0 h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {!isDashboard && (
              <>
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Menu size={20} />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
              </>
            )}
            {!isDashboard && (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <div className="hidden sm:flex items-center text-sm text-gray-500 font-medium ml-2">
              <span className="text-gray-800">Home</span>
              {breadcrumbs.length > 0 && <ChevronRight size={14} className="mx-2 text-gray-400" />}
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center">
                  <span className={i === breadcrumbs.length - 1 ? "text-gray-800 capitalize" : "capitalize"}>{b.replace('-', ' ')}</span>
                  {i < breadcrumbs.length - 1 && <ChevronRight size={14} className="mx-2 text-gray-400" />}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search globally (⌘K)"
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24] focus:bg-white transition-all w-64"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A81F24] rounded-full border-2 border-white"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="auto flex items-center gap-2 hover:bg-gray-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-gray-200 transition-colors focus:outline-none"
              >
                <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=A81F24&color=fff`} alt="Profile" className="w-8 h-8 rounded-full" />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-gray-900 leading-none">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
                </div>
              </button>
              
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">
                     <div className="px-4 py-3 border-b border-gray-50">
                       <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                       <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                     </div>
                     <button className="w-full text-left px-4 py-2 mt-1 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                       <Image size={16} className="text-gray-400" /> Add/Update Photo
                     </button>
                     <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                       <Sun size={16} className="text-gray-400" /> Toggle Theme
                     </button>
                     <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                       <Key size={16} className="text-gray-400" /> Change Password
                     </button>
                     <div className="border-t border-gray-50 my-1"></div>
                     <button 
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium"
                     >
                       <LogOut size={16} className="text-red-500" /> Sign Out
                     </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        
        {/* Dynamic Page Content */}
        <div className={cn("flex-1 overflow-y-auto min-h-0", isDashboard ? "p-4 lg:px-8 lg:py-6" : "p-6 lg:p-8")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
