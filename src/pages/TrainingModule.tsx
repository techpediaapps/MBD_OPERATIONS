import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Line
} from 'recharts';
import { 
  Users, CheckCircle2, Calendar, XCircle, UserX, UserCheck, 
  Target, FileText, X, Search, Clock, ShieldAlert, Download, Plus, Filter, MoreHorizontal
} from 'lucide-react';
import type { TrainingRecord, Employee } from '../types';

const PIE_COLORS = ['#801416', '#0f766e', '#ca8a04', '#1d4ed8', '#6b21a8'];

export default function TrainingModule() {
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('Month');
  const [employeeFilter, setEmployeeFilter] = useState<'ALL' | 'Staff' | 'Shopfloor'>('ALL');

  useEffect(() => {
    Promise.all([
      fetch('/api/trainings').then(res => res.json()),
      fetch('/api/employees').then(res => res.json())
    ]).then(([trainingsData, employeesData]) => {
      setTrainings(trainingsData || []);
      setEmployees(employeesData || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const element = document.getElementById('dashboard-content');
      if (!element) return;
      
      const imgData = await htmlToImage.toJpeg(element, {
        backgroundColor: '#f3f4f6', // Match dashboard bg
        pixelRatio: 1.5,
        quality: 0.8,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable PDF compression
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Add subsequent pages if content is taller than A4 page
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save('Training_Overview.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const {
    barChartData,
    pieData,
    lineChartData,
    deptGridData,
    heatmapMonths,
    heatmapData,
    kpis,
    traineesPlannedCount,
    attendedCount,
    debarmentsCount,
    compliancePct
  } = useMemo(() => {
    const empTypeMap = new Map(employees.map(e => [String(e.id), e.employeeType || 'Staff']));

    let totalPlannedSessions = 0;
    let conductedSessions = 0;
    let scheduledSessions = 0;
    let cancelledSessions = 0;
    
    let tPlannedCount = 0;
    let aCountTotal = 0;
    let dCountTotal = 0;
    
    const monthStats: Record<string, { planned: number, conducted: number, attendees: number }> = {};
    const deptStats: Record<string, { plan: number, actual: number, sessions: number }> = {};
    const deptMonthStats: Record<string, Record<string, { plan: number, actual: number }>> = {};

    trainings.forEach(t => {
      const matchingAttendees = t.attendees?.filter(a => {
        if (employeeFilter === 'ALL') return true;
        const eType = empTypeMap.get(String(a.employeeId)) || 'Staff';
        return eType === employeeFilter;
      }) || [];

      // if filter is active, skip trainings with zero matching attendees
      if (employeeFilter !== 'ALL' && matchingAttendees.length === 0 && (t.attendees?.length || 0) > 0) {
        return;
      }

      totalPlannedSessions++;
      if (t.canceled) {
        cancelledSessions++;
      } else if (t.conducted) {
        conductedSessions++;
      } else {
        scheduledSessions++;
      }
      
      const aCount = matchingAttendees.filter(a => a.status === 'Attended').length;
      const dCount = matchingAttendees.filter(a => a.status === 'Dropped').length;
      const pCount = employeeFilter === 'ALL' ? (t.plannedAttendees || 0) : matchingAttendees.length;
      
      tPlannedCount += pCount;
      aCountTotal += aCount;
      dCountTotal += dCount;
      
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        const monthKey = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        if (!monthStats[monthKey]) monthStats[monthKey] = { planned: 0, conducted: 0, attendees: 0 };
        monthStats[monthKey].planned++;
        if (t.conducted) monthStats[monthKey].conducted++;
        monthStats[monthKey].attendees += aCount;
        
        t.targetDepartments?.forEach(dept => {
          if (!deptStats[dept]) deptStats[dept] = { plan: 0, actual: 0, sessions: 0 };
          deptStats[dept].sessions++;
          const factor = 1 / t.targetDepartments.length;
          deptStats[dept].plan += Math.round(pCount * factor);
          deptStats[dept].actual += Math.round(aCount * factor);
          
          if (!deptMonthStats[dept]) deptMonthStats[dept] = {};
          if (!deptMonthStats[dept][monthKey]) deptMonthStats[dept][monthKey] = { plan: 0, actual: 0 };
          deptMonthStats[dept][monthKey].plan += Math.round(pCount * factor);
          deptMonthStats[dept][monthKey].actual += Math.round(aCount * factor);
        });
      }
    });

    const mPieData = [
      { name: 'Conducted', value: conductedSessions },
      { name: 'Scheduled', value: scheduledSessions },
      { name: 'Cancelled', value: cancelledSessions },
    ].filter(d => d.value > 0);
    if (mPieData.length === 0) mPieData.push({ name: 'No Data', value: 1 });

    const mBarChartData = Object.entries(monthStats).map(([month, data]) => ({
      month,
      planned: data.planned,
      conducted: data.conducted
    }));
    
    const mLineChartData = Object.entries(monthStats).map(([month, data]) => ({
      month,
      attendees: data.attendees
    }));

    const mDeptGridData = Object.entries(deptStats).map(([name, data]) => ({
      name,
      plan: data.plan,
      actual: data.actual,
      pct: data.plan === 0 ? 0 : Math.round((data.actual / data.plan) * 100),
      sessions: data.sessions
    })).sort((a, b) => b.pct - a.pct); // sort by compliance percentage

    const mHeatmapMonths = Object.keys(monthStats);
    const mHeatmapData = Object.entries(deptMonthStats).map(([dept, mStats]) => {
      const values = mHeatmapMonths.map(m => {
        const st = mStats[m];
        if (!st || st.plan === 0) return 0;
        return Math.round((st.actual / st.plan) * 100);
      });
      return { dept, values };
    });

    return {
      barChartData: mBarChartData,
      pieData: mPieData,
      lineChartData: mLineChartData,
      deptGridData: mDeptGridData,
      heatmapMonths: mHeatmapMonths,
      heatmapData: mHeatmapData,
      kpis: [
         { label: 'Total Planned', val: totalPlannedSessions.toString(), delta: '+0%', up: true },
         { label: 'Conducted', val: conductedSessions.toString(), delta: '+0%', up: true },
         { label: 'Scheduled', val: scheduledSessions.toString(), delta: '0%', up: true },
         { label: 'Cancelled', val: cancelledSessions.toString(), delta: '0%', up: false },
      ],
      traineesPlannedCount: tPlannedCount,
      attendedCount: aCountTotal,
      debarmentsCount: dCountTotal,
      compliancePct: tPlannedCount === 0 ? 0 : Math.round((aCountTotal / tPlannedCount) * 100)
    };
  }, [trainings, employees, employeeFilter]);

  const listTrainings = useMemo(() => {
    const empTypeMap = new Map(employees.map(e => [String(e.id), e.employeeType || 'Staff']));

    let result = trainings;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.title || '').toLowerCase().includes(q) ||
        (t.code || '').toLowerCase().includes(q) ||
        (t.trainer || '').toLowerCase().includes(q)
      );
    }
    
    if (employeeFilter !== 'ALL') {
      result = result.filter(t => {
        const matchingAttendees = t.attendees?.filter(a => {
          const eType = empTypeMap.get(String(a.employeeId)) || 'Staff';
          return eType === employeeFilter;
        }) || [];
        return matchingAttendees.length > 0 || (t.attendees?.length === 0);
      });
    }

    return result;
  }, [trainings, employees, searchQuery, employeeFilter]);

  if (loading) {
    return <div className="flex items-center justify-center p-24 text-gray-500">Loading Dashboard Data...</div>;
  }

  const getHeatmapColor = (val: number) => {
    if (val >= 95) return 'bg-[#801416] text-white';
    if (val >= 90) return 'bg-[#A81F24] text-white';
    if (val >= 85) return 'bg-red-500 text-white';
    if (val >= 80) return 'bg-red-400 text-white';
    return 'bg-red-200 text-red-900';
  };

  const getStatusBadge = (t: TrainingRecord) => {
    if (t.canceled) return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">Canceled</span>;
    if (t.conducted) return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">Conducted</span>;
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">Planned</span>;
  };

  const getAttendanceProgress = (t: TrainingRecord) => {
    let matchingAttendees = t.attendees || [];
    if (employeeFilter !== 'ALL') {
      const empTypeMap = new Map(employees.map(e => [String(e.id), e.employeeType || 'Staff']));
      matchingAttendees = matchingAttendees.filter(a => empTypeMap.get(String(a.employeeId)) === employeeFilter);
    }
    
    const attendedCountFiltered = matchingAttendees.filter(a => a.status === 'Attended').length;
    const total = employeeFilter === 'ALL' ? (t.plannedAttendees || 1) : Math.max(matchingAttendees.length, 1);
    const pct = Math.min(100, Math.round((attendedCountFiltered / total) * 100));
    
    return (
      <div className="flex items-center gap-3 w-40">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${t.conducted ? 'bg-[#A81F24]' : 'bg-amber-400'}`} 
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-gray-700 tabular-nums w-12 text-right">{attendedCountFiltered}/{employeeFilter === 'ALL' ? t.plannedAttendees : matchingAttendees.length}</span>
      </div>
    );
  };

  return (
    <div id="dashboard-content" className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-[1600px] mx-auto bg-gray-50/50 p-2 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-start" data-html2canvas-ignore="false">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Training Overview</h2>
          <p className="text-gray-500 mt-1 text-sm">Manage employee training and development</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-0.5 rounded-lg flex items-center shadow-inner">
            {(['ALL', 'Staff', 'Shopfloor'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setEmployeeFilter(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${employeeFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="bg-gray-100 p-0.5 rounded-lg flex items-center shadow-inner">
            {['Month', 'Quarter', 'YTD'].map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Download size={16} /> {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Session Status KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 relative z-10">{kpi.label}</div>
            <div className="flex items-end justify-between relative z-10">
              <div className="text-3xl font-black text-gray-900">{kpi.val}</div>
              <div className={`text-xs font-bold flex items-center gap-1 ${kpi.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.up ? '↑' : '↓'} {kpi.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* People KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-5 opacity-10 pointer-events-none"><Target size={64}/></div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Trainees Planned</div>
          <div className="text-4xl font-black text-gray-900 mt-2 relative z-10">{traineesPlannedCount}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-5 opacity-10 pointer-events-none"><CheckCircle2 size={64}/></div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">
            Attended 
          </div>
          <div className="text-4xl font-black text-emerald-600 mt-2 relative z-10">{attendedCount}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-5 opacity-10 pointer-events-none"><UserX size={64}/></div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">
            Debarments 
          </div>
          <div className="text-4xl font-black text-rose-600 mt-2 relative z-10">{debarmentsCount}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm bg-rose-50/50 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-5 opacity-10 pointer-events-none text-[#A81F24]"><ShieldAlert size={64}/></div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">
            Compliance % 
          </div>
          <div className="text-4xl font-black text-[#A81F24] mt-2 relative z-10">{compliancePct}%</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planned vs Conducted */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-6">Planned vs Conducted</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="planned" name="Planned" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="conducted" name="Conducted" fill="#A81F24" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Training Status Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-6">Training Status</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-3xl font-black text-gray-900">100</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></span>
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid and Area Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendees Trend Area Chart */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-6">Attendees Trend</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A81F24" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#A81F24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1F2937', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="attendees" stroke="#A81F24" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendees)" activeDot={{ r: 6, fill: '#fff', stroke: '#A81F24', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dept x Month Heatmap */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-2">
           <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-6">Attendance Heatmap</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr>
                   <th className="pb-3 font-semibold text-gray-500 w-24">Dept</th>
                   {heatmapMonths.map(m => <th key={m} className="pb-3 text-center font-semibold text-gray-500">{m}</th>)}
                 </tr>
               </thead>
               <tbody className="space-y-1">
                 {heatmapData.map(row => (
                   <tr key={row.dept}>
                     <td className="py-2 font-bold text-gray-900">{row.dept}</td>
                     {row.values.map((v, i) => (
                       <td key={i} className="p-1">
                         <div className={`rounded md:rounded-lg flex items-center justify-center py-2 text-xs shadow-sm font-medium ${getHeatmapColor(v)}`}>
                           {v}%
                         </div>
                       </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* Department Attendance Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Department Attendance</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {deptGridData.map(d => (
            <div key={d.name} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm transform hover:-translate-y-1 transition-transform">
               <div className="flex justify-between items-start mb-3">
                 <span className="font-bold text-gray-900">{d.name}</span>
                 <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-500 uppercase">{d.sessions} Sessions</span>
               </div>
               <div className="flex items-end gap-2 mb-2">
                 <span className="text-2xl font-black text-emerald-600">{d.pct}%</span>
                 <span className="text-xs text-gray-400 font-medium mb-1">{d.actual} / {d.plan}</span>
               </div>
               <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.pct}%` }}></div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              Training List
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 shadow-sm hidden sm:inline-block">
              {listTrainings.length} Records
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search code, name, trainer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] shadow-sm"
              />
            </div>
            <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-1.5 focus:outline-none">
              <Filter size={14} /> Filters
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-none">
                <th className="p-4 pr-2 font-semibold w-24">Code</th>
                <th className="p-4 px-2 font-semibold min-w-[200px]">Training Name</th>
                <th className="p-4 py-3 font-semibold w-32">Type</th>
                <th className="p-4 py-3 font-semibold w-28">Date</th>
                <th className="p-4 py-3 font-semibold w-20">Dur.</th>
                <th className="p-4 py-3 font-semibold w-32">Trainer</th>
                <th className="p-4 py-3 font-semibold w-40">Departments</th>
                <th className="p-4 py-3 font-semibold w-48">Attendance</th>
                <th className="p-4 py-3 font-semibold pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listTrainings.length > 0 ? listTrainings.slice(0, 10).map((t) => (
                <tr 
                  key={t.id} 
                  className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                >
                  <td className="p-4 pr-2 text-xs font-mono text-gray-500">
                    {t.code || `TRN-${String(t.id).substring(0,4).toUpperCase()}`}
                  </td>
                  <td className="p-4 px-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 group-hover:text-[#A81F24] transition-colors">{t.title}</span>
                      {t.title?.toLowerCase().includes('safety') && <ShieldAlert size={14} className="text-[#A81F24]" />}
                    </div>
                  </td>
                  <td className="p-4">
                     <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                       {t.type || 'General'}
                     </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm whitespace-nowrap">{t.date}</td>
                  <td className="p-4 text-gray-600 text-sm">{t.duration} hr</td>
                  <td className="p-4 text-gray-800 text-sm font-medium">{t.trainer || 'Internal'}</td>
                  
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {t.targetDepartments.slice(0, 2).map((dept, i) => (
                        <span key={i} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-sm">
                          {dept}
                        </span>
                      ))}
                      {t.targetDepartments.length > 2 && (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200 shadow-sm">
                          +{t.targetDepartments.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {getAttendanceProgress(t)}
                  </td>
                  <td className="p-4 pl-4">
                    {getStatusBadge(t)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-sm font-medium text-gray-500">
                    No training records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
