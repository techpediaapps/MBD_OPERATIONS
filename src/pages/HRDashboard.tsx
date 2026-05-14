import { Link, useNavigate } from 'react-router-dom';
import { Users, GraduationCap, CalendarDays, Library, Settings, Target, BookOpen, Layers, Clock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function HRDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const navigate = useNavigate();

  const modules = [
    {
      title: "Training Overview",
      description: "Analytics and high-level reporting for staff training and development.",
      icon: Target,
      to: "/training-staff",
      color: "from-blue-600 to-indigo-800",
      enabled: true
    },
    {
      title: "Staff Training Management",
      description: "Manage training sessions, schedules, and attendance for staff members.",
      icon: GraduationCap,
      to: "/training-manager",
      color: "from-emerald-600 to-teal-800",
      enabled: true
    },
    {
      title: "Shopfloor Training Management",
      description: "Manage training operations specifically for shopfloor employees.",
      icon: Layers,
      to: "/training-shopfloor",
      color: "from-slate-600 to-slate-800",
      enabled: true
    },
    {
      title: "Skill Matrix",
      description: "Track and evaluate employee skills, competencies, and gaps.",
      icon: BookOpen,
      to: "/skill-matrix",
      color: "from-cyan-600 to-cyan-800",
      enabled: true
    },
    {
      title: "Employee (Staff) Management",
      description: "Maintain staff employee records, details, and individual training history.",
      icon: Users,
      to: "/employees",
      color: "from-amber-600 to-orange-800",
      enabled: true
    },
    {
      title: "Employee (Shopfloor) Management",
      description: "Maintain shopfloor employee records and details.",
      icon: Users,
      to: "/employees-shopfloor",
      color: "from-neutral-600 to-neutral-800",
      enabled: true
    },
    {
      title: "Training Calendar",
      description: "View upcoming schedules, plan new sessions, and manage timelines.",
      icon: CalendarDays,
      to: "/training-calendar",
      color: "from-purple-600 to-fuchsia-800",
      enabled: true
    },
    {
      title: "Training Catalog",
      description: "Library of standardized training templates, courses, and materials.",
      icon: Library,
      to: "/training-catalog",
      color: "from-rose-600 to-rose-800",
      enabled: true
    },
    {
      title: "Admin Settings",
      description: "Configure system rules, access controls, and basic parameters.",
      icon: Settings,
      to: "/settings",
      color: "from-gray-700 to-gray-900",
      enabled: isAdmin
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-full space-y-4">
      <div className="pb-2 border-b border-gray-200 shrink-0 flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Human Resources Module</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium max-w-2xl">Manage employee training and development</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-y-auto pb-2">
        {modules.map((mod, i) => (
          <Link key={i} to={mod.enabled ? mod.to : '#'} className="block group h-full">
            <div className={`relative overflow-hidden rounded-xl bg-white border hover:border-gray-300 shadow-sm transition-all duration-300 h-full flex flex-col p-4 ${mod.enabled ? 'border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-70 cursor-not-allowed'}`}>
              
              {mod.enabled && (
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 bg-gradient-to-br ${mod.color} group-hover:scale-[2] transition-transform duration-700`}></div>
              )}
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${mod.enabled ? `bg-gradient-to-br ${mod.color} text-white shadow-sm` : 'bg-gray-100 text-gray-400'}`}>
                    <mod.icon size={20} />
                  </div>
                  {!mod.enabled && (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase tracking-wider">Coming Soon</span>
                  )}
                </div>
                
                <h3 className={`text-base font-bold leading-tight mb-1 ${mod.enabled ? 'text-gray-900' : 'text-gray-600'}`}>{mod.title}</h3>
                <p className="text-gray-500 text-xs font-medium leading-relaxed flex-1 line-clamp-2">{mod.description}</p>
                
                {mod.enabled && (
                  <div className="mt-3 flex items-center text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                    Access feature
                    <span className="ml-2 group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
