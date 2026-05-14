import { Link } from 'react-router-dom';
import { Users, ClipboardCheck, Factory, Wrench, Package, Layers, CalendarDays, Target, Zap, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const departments = [
    {
      title: "Production",
      description: "Manage production lines, operators, efficiency goals, and output tracking.",
      icon: Factory,
      to: "/training-staff",
      color: "from-blue-600 to-indigo-800",
      enabled: false
    },
    {
      title: "Technical",
      description: "Oversee machine maintenance, repairs, technical documentation, and equipment health.",
      icon: Wrench,
      to: "/training-staff",
      color: "from-slate-600 to-slate-800",
      enabled: false
    },
    {
      title: "Quality",
      description: "Track non-conformances, QA tests, and continuous improvement metrics.",
      icon: ClipboardCheck,
      to: "/training-staff",
      color: "from-emerald-600 to-teal-800",
      enabled: false
    },
    {
      title: "FGS",
      description: "Finished Goods Storage: manage inventory, dispatch schedules, and logistics operations.",
      icon: Package,
      to: "/training-staff",
      color: "from-amber-600 to-orange-800",
      enabled: false
    },
    {
      title: "RMS",
      description: "Raw Material Storage: monitor intake, vendor quality, and supply levels.",
      icon: Layers,
      to: "/training-staff",
      color: "from-purple-600 to-fuchsia-800",
      enabled: false
    },
    {
      title: "HR",
      description: "Human Resources: employee records, payroll, leave management, and company policies.",
      icon: Users,
      to: "/hr",
      color: "from-[#A81F24] to-[#801416]",
      enabled: true
    },
    {
      title: "SPDC",
      description: "Strategic Product Development & Commercialization processes and project tracking.",
      icon: Target,
      to: "/training-staff",
      color: "from-rose-600 to-rose-800",
      enabled: false
    },
    {
      title: "Lean & Digitalization",
      description: "Process optimization, DMAIC projects, and enterprise digital transformation.",
      icon: Zap,
      to: "/training-staff",
      color: "from-cyan-600 to-cyan-800",
      enabled: false
    },
    {
      title: "Operational Cost",
      description: "Cost tracking, budget management, and financial performance metrics.",
      icon: DollarSign,
      to: "/training-staff",
      color: "from-lime-600 to-lime-800",
      enabled: false
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-full space-y-4">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mainetti Operation Management System</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium max-w-2xl">Centralized platform for managing operational teams.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CalendarDays size={16} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">{today}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-y-auto pb-2">
        {departments.map((dept, i) => (
          <Link key={i} to={dept.enabled ? dept.to : '#'} className="block group h-full">
            <div className={`relative overflow-hidden rounded-xl bg-white border hover:border-gray-300 shadow-sm transition-all duration-300 h-full flex flex-col p-4 ${dept.enabled ? 'border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-70 cursor-not-allowed'}`}>
              
              {dept.enabled && (
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 bg-gradient-to-br ${dept.color} group-hover:scale-[2] transition-transform duration-700`}></div>
              )}
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${dept.enabled ? `bg-gradient-to-br ${dept.color} text-white shadow-sm` : 'bg-gray-100 text-gray-400'}`}>
                      <dept.icon size={20} />
                    </div>
                    <h3 className={`text-base font-bold leading-tight ${dept.enabled ? 'text-gray-900' : 'text-gray-600'}`}>{dept.title}</h3>
                  </div>
                  {!dept.enabled && (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase tracking-wider shrink-0">Coming Soon</span>
                  )}
                </div>
                
                <p className="text-gray-500 text-xs font-medium leading-relaxed flex-1 line-clamp-2">{dept.description}</p>
                
                {dept.enabled && (
                  <div className="mt-3 flex items-center text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                    Enter Module
                    <span className="ml-2 group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer className="shrink-0 pt-3 border-t border-gray-200 text-center text-xs font-medium text-gray-400">
        &copy; 2026 Mainetti. All rights reserved. V 2.1.0 (Enterprise)
      </footer>
    </div>
  );
}
