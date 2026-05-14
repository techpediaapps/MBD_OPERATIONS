import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, Settings, Menu, GraduationCap, CalendarDays, Library, Bell, Search, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse?: () => void;
}

export default function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const { user, hasPermission } = useAuth();
  const groups = [
    {
      name: 'Workspace',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', active: true, show: hasPermission('dashboard', 'read') },
      ]
    },
    {
      name: 'Training',
      items: [
        { to: '/training-staff', icon: GraduationCap, label: 'Training Overview', active: true, show: hasPermission('trainings', 'read') },
        { to: '/training-manager', icon: CalendarDays, label: 'Staff Training', active: true, show: hasPermission('trainings', 'read') },
        { to: '/training-shopfloor', icon: Layers, label: 'Shopfloor Training', active: true, show: true },
        { to: '/training-calendar', icon: CalendarDays, label: 'Training Calendar', active: true, show: hasPermission('trainings', 'read') },
        { to: '/training-catalog', icon: Library, label: 'Training Catalog', active: true, show: hasPermission('trainings', 'read') },
      ]
    },
    {
      name: 'Employees',
      items: [
        { to: '/employees', icon: Users, label: 'Staff Management', active: true, show: hasPermission('employees', 'read') },
        { to: '/employees-shopfloor', icon: Users, label: 'Shopfloor Management', active: true, show: true },
        { to: '/skill-matrix', icon: BookOpen, label: 'Skill Matrix', active: true, show: true },
      ]
    },
    {
      name: 'System',
      items: [
        { to: '/settings', icon: Settings, label: 'Settings', disabled: false, show: user?.role === 'Admin' },
      ]
    }
  ];

  return (
    <div className={cn(
      "bg-[#A81F24] text-white flex flex-col h-screen fixed top-0 left-0 transition-all duration-300 z-30 shadow-xl",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand */}
      <div className={cn(
        "h-20 flex items-center relative shrink-0 border-b border-white/10",
        isCollapsed ? "justify-center px-0" : "px-6"
      )}>
        <div className={cn("flex items-center shrink-0 h-10 w-full", isCollapsed ? "justify-center" : "justify-start")}>
          <Logo className={cn("text-white h-full", isCollapsed ? "w-10" : "w-32 object-left")} variant={isCollapsed ? "icon" : "full"} showText={!isCollapsed} forceWhite={true} />
        </div>
        
        {toggleCollapse && (
          <button 
            onClick={toggleCollapse}
            className="absolute -right-3 top-7 bg-[#A81F24] border border-white/20 text-white/70 hover:text-white rounded-full p-1 shadow-lg z-50 hover:bg-red-900 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {groups.map((group, idx) => {
          const visibleItems = group.items.filter(i => i.show);
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={idx}>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-xs font-semibold text-white/50 uppercase tracking-widest">
                  {group.name}
                </div>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  if (item.disabled) {
                    return (
                       <div
                        key={item.label}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed overflow-hidden whitespace-nowrap",
                          isCollapsed && "justify-center px-0"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon size={20} className="shrink-0" />
                        {!isCollapsed && (
                          <div className="flex flex-1 items-center justify-between">
                            <span>{item.label}</span>
                            <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-bold tracking-wider">SOON</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors overflow-hidden whitespace-nowrap",
                          isActive 
                            ? "bg-white/20 text-white shadow-sm" 
                            : "text-white/70 hover:bg-white/10 hover:text-white",
                          isCollapsed && "justify-center px-0"
                        )
                      }
                    >
                      <item.icon size={20} className="shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Profile Foot */}
      <div className="p-4 border-t border-white/10 shrink-0 bg-black/10">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
          <div className="w-10 h-10 rounded-full bg-white text-[#A81F24] flex items-center justify-center font-bold shrink-0 shadow-sm overflow-hidden text-sm uppercase">
            {user?.name?.substring(0, 2) || user?.username?.substring(0, 2) || 'AD'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-white truncate">{user?.name || user?.username}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/70 truncate">{user?.role?.replace('_', ' ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
