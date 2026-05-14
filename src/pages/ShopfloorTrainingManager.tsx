import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Upload, Calendar, List, Download, MoreHorizontal, User, ArrowLeft, Edit2, FileText, Mail, FileUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TrainingRecord } from '../types';
import jsPDF from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function ShopfloorTrainingManager({ defaultViewMode = 'list' }: { defaultViewMode?: 'list' | 'calendar' }) {
  const { user, hasPermission } = useAuth();
  const { departments, trainingTypes, businessUnits } = useSettings();
  const canWrite = hasPermission('trainings', 'write');
  const canDelete = hasPermission('trainings', 'delete');
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [deptFilter, setDeptFilter] = useState('All departments');
  const [dateFilter, setDateFilter] = useState('All time');
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(defaultViewMode);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Also want to make sure changing the route while on the same component updates the view mode
  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));


  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isNewTrainingModalOpen, setIsNewTrainingModalOpen] = useState(false);
  const [newTrainingStep, setNewTrainingStep] = useState(1);
  const [newTraining, setNewTraining] = useState<Partial<TrainingRecord>>({ type: 'Classroom' });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleExport = () => {
    const csv = [
      ["Date", "Title", "Code", "Type", "Trainer", "Duration", "Planned Attendees"].join(","),
      ...filteredTrainings.map(t => [
        t.date, t.title, t.code, t.type, t.trainer, t.duration, t.plannedAttendees
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trainings_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraining.title) return;
    
    const training: TrainingRecord = {
      id: crypto.randomUUID(),
      title: newTraining.title || '',
      code: newTraining.code || 'TRN-NEW',
      date: newTraining.date || new Date().toISOString().split('T')[0],
      duration: newTraining.duration || '2:00',
      type: newTraining.type || 'Classroom',
      trainer: newTraining.trainer || 'Internal',
      targetDepartments: ['All'],
      plannedAttendees: parseInt(String(newTraining.plannedAttendees || 0)),
      conducted: false,
      canceled: false,
      notes: newTraining.notes || '',
      attendees: []
    };
    
    const updated = [...trainings, training];
    try {
      await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setTrainings(updated);
      setIsNewTrainingModalOpen(false);
      setNewTraining({ type: 'Classroom' });
    } catch (err) {
      alert("Failed to add training");
    }
  };

  

  const fetchTrainings = async () => {
    try {
      const res = await fetch('/api/trainings');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrainings(data);
      } else {
        setTrainings([]);
      }
    } catch (err) {
      console.error(err);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (employeeName: string, trainingTitle: string, date: string) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    });

    const certId = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;

    // Add border
    doc.setLineWidth(0.1);
    doc.setDrawColor(168, 31, 36); // Mainetti red
    doc.rect(0.5, 0.5, 10, 7.5);
    doc.setLineWidth(0.02);
    doc.rect(0.6, 0.6, 9.8, 7.3);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(30, 41, 59);
    doc.text("Certificate of Completion", 5.5, 2.5, { align: 'center' });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("This is to certify that", 5.5, 3.2, { align: 'center' });

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(168, 31, 36);
    doc.text(employeeName, 5.5, 4.0, { align: 'center' });

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`has successfully completed the training session`, 5.5, 4.8, { align: 'center' });

    // Training Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(trainingTitle, 5.5, 5.6, { align: 'center' });

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date of Completion: ${date}`, 2.0, 7.0);
    doc.text(`Certificate ID: ${certId}`, 9.0, 7.0, { align: 'right' });

    doc.save(`${employeeName.replace(/\s+/g, '_')}_${trainingTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
  };

  const filteredTrainings = useMemo(() => {
    return trainings.filter(t => {
      const matchesSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.trainer || '').toLowerCase().includes(searchQuery.toLowerCase());
        
      const statusRaw = t.canceled ? 'Canceled' : (t.conducted ? 'Conducted' : 'Planned');
      const matchesStatus = statusFilter === 'All statuses' ? true : statusRaw === statusFilter;
      
      const tType = t.type || 'Other';
      const matchesType = typeFilter === 'All types' ? true : tType === typeFilter;
      
      const depts = t.targetDepartments || [];
      const matchesDept = deptFilter === 'All departments' ? true : depts.includes(deptFilter);
      
      let matchesDate = true;
      if (dateFilter === 'Upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesDate = new Date(t.date) >= today;
      } else if (dateFilter === 'Past') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesDate = new Date(t.date) < today;
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDept && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trainings, searchQuery, statusFilter, typeFilter, deptFilter, dateFilter]);

  const totalHours = useMemo(() => {
    return filteredTrainings.reduce((acc, t) => {
      const hr = parseInt(t.duration) || 0;
      return acc + hr;
    }, 0);
  }, [filteredTrainings]);

  const totalAttendees = useMemo(() => {
    return filteredTrainings.reduce((acc, t) => acc + (t.plannedAttendees || 0), 0);
  }, [filteredTrainings]);

  // Group by month-year
  const groupedTrainings = useMemo(() => {
    const groups: Record<string, TrainingRecord[]> = {};
    filteredTrainings.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      // Valid Date check
      if(isNaN(d.getTime())) return;
      
      const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(t);
    });
    return groups;
  }, [filteredTrainings]);

  const getStatusBadge = (t: TrainingRecord) => {
    if (t.canceled) return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Canceled</span>;
    if (t.conducted) return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Conducted</span>;
    // Assume if not canceled and not conducted, it's planned. Let's add Scheduled as mock.
    const isScheduled = new Date(t.date).getTime() > Date.now();
    if(isScheduled) return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Scheduled</span>;
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#1F2937] text-white"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Planned</span>;
  };

  const getTypeBadge = (type?: string) => {
    if (!type) return null;
    const baseClass = "inline-flex px-2 py-0.5 rounded text-xs font-medium ";
    switch (type.toLowerCase()) {
      case 'classroom': return <span className={baseClass + "bg-blue-50 text-blue-700"}>Classroom</span>;
      case 'soft skills': return <span className={baseClass + "bg-orange-50 text-orange-700"}>Soft Skills</span>;
      case 'compliance': return <span className={baseClass + "bg-rose-50 text-rose-700"}>Compliance</span>;
      case 'on-the-job': return <span className={baseClass + "bg-emerald-50 text-emerald-700"}>On-the-job</span>;
      case 'safety': return <span className={baseClass + "bg-red-50 text-red-700"}>Safety</span>;
      default: return <span className={baseClass + "bg-gray-100 text-gray-700"}>{type}</span>;
    }
  };

  const getAttendanceProgress = (t: TrainingRecord) => {
    const attendedCount = t.attendees?.filter(a => a.status === 'Attended').length || 0;
    const total = t.plannedAttendees || 1;
    const pct = Math.min(100, Math.round((attendedCount / total) * 100));
    
    return (
      <div 
        className="flex items-center gap-3 w-40 cursor-pointer group-hover:bg-gray-100 p-1 -ml-1 rounded transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTrainingId(t.id);
          setTimeout(() => {
            document.getElementById('attendee-roster')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        title="View attendee roster"
      >
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${t.conducted ? 'bg-[#A86131]' : 'bg-gray-400'}`} 
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 font-medium tabular-nums w-8 text-right whitespace-nowrap">{attendedCount}/{t.plannedAttendees}</span>
      </div>
    );
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthTrainings = filteredTrainings.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month;
    });

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
           <button onClick={prevMonth} className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white rounded-md transition-colors shadow-sm">
             <ChevronLeft size={18} />
           </button>
           <div className="text-lg font-bold text-gray-800">
             {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
           </div>
           <button onClick={nextMonth} className="p-1.5 text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white rounded-md transition-colors shadow-sm">
             <ChevronRight size={18} />
           </button>
        </div>
        
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-3 text-center uppercase tracking-widest">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-[140px]">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="border-r border-b border-gray-100 bg-gray-50/30 p-2"></div>
          ))}
          {days.map(d => {
            const dayTrainings = monthTrainings.filter(t => new Date(t.date).getDate() === d);
            return (
              <div 
                key={d} 
                className="border-r border-b border-gray-100 p-2 flex flex-col hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => {
                  const selectedDate = new Date(Date.UTC(year, month, d)).toISOString().split('T')[0];
                  setNewTraining({ type: 'Classroom', date: selectedDate });
                  setIsNewTrainingModalOpen(true);
                }}
              >
                <div className="text-right text-xs font-semibold text-gray-500 mb-1.5 group-hover:text-gray-900">{d}</div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {dayTrainings.map(t => (
                    <div 
                      key={t.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrainingId(t.id);
                      }}
                      className="text-[10px] leading-tight cursor-pointer rounded px-2 py-1.5 bg-[#A81F24]/10 text-[#A81F24] border border-[#A81F24]/20 hover:bg-[#A81F24] hover:text-white transition-colors truncate font-medium"
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (selectedTrainingId) {
    const t = trainings.find(tr => tr.id === selectedTrainingId);
    if (!t) return null;

    const tDate = new Date(t.date);
    const dateFormatted = isNaN(tDate.getTime()) ? t.date : tDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const codeLabel = t.code || `TRN-${String(t.id).substring(0, 4).toUpperCase()}`;
    const attendedCount = t.attendees?.filter(a => a.status === 'Attended').length || 0;
    const totalCount = t.plannedAttendees || 0;
    const attendancePct = totalCount ? Math.round((attendedCount / totalCount) * 100) : 0;

    return (
      <div className="max-w-[1400px] mx-auto pb-12">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setSelectedTrainingId(null)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to dashboard
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => alert("Downloading attendance sheet...")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <FileText size={14} /> Attendance sheet
            </button>
            <button onClick={() => alert("More options")} className="p-1.5 bg-white border border-gray-200 text-gray-400 rounded hover:text-gray-900 transition-colors shadow-sm">
              <MoreHorizontal size={16} />
            </button>
            {canWrite && (
            <button onClick={() => alert("Opening edit form...")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <Edit2 size={14} /> Edit
            </button>
            )}
            
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{codeLabel}</span>
              <span className="text-gray-300">•</span>
              {getTypeBadge(t.type || 'Other')}
            </div>
            {getStatusBadge(t)}
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-1">{t.title}</h2>
          <p className="text-sm text-gray-600 mb-8">Conducted by <span className="font-semibold text-gray-900">{t.trainer || 'Internal'}</span> at <span className="font-semibold text-gray-900">Training Room A</span></p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 border-t border-gray-100 pt-6">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date</div>
              <div className="text-lg font-semibold text-gray-900">{dateFormatted}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900">{t.duration} hr</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Departments</div>
              <div className="text-lg font-semibold text-gray-900">{t.targetDepartments.length || 0} depts</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Attendees</div>
              <div className="text-lg font-semibold text-gray-900">{attendedCount} / {totalCount}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Attendance</div>
              <div className="text-lg font-semibold text-gray-900">{attendancePct}%</div>
            </div>
          </div>
          
          {t.notes && (
            <div className="border-t border-gray-100 mt-6 pt-6">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.notes}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Roster */}
          <div id="attendee-roster" className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Attendee roster</h3>
                <p className="text-xs text-gray-500 font-medium">{totalCount} planned · {attendedCount} attended · 0 debarred</p>
              </div>
              <div className="flex items-center gap-2">
                {canWrite && (
                <button onClick={() => alert("Add attendees")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 flex items-center gap-1.5">
                  <Plus size={14} /> Add
                </button>
                )}
                <button onClick={() => alert("Export attendee roster")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 flex items-center gap-1.5">
                  <FileUp size={14} /> Export
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="py-3 px-6 font-semibold">Employee</th>
                    <th className="py-3 px-6 font-semibold">Dept</th>
                    <th className="py-3 px-6 font-semibold">Role</th>
                    <th className="py-3 px-6 font-semibold">Shift</th>
                    <th className="py-3 px-6 font-semibold text-right">Certificate / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {t.attendees?.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
                            {String(a.employeeId || '').substring(0,2).toUpperCase() || 'E'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{`Employee ${String(a.employeeId || '').slice(-3)}`}</div>
                            <div className="text-xs text-gray-400 font-mono">EMP-{a.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm font-medium text-gray-700">
                         QC
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600">QC Inspector</td>
                      <td className="py-3 px-6 font-medium text-gray-700 text-sm">A</td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${
                            a.status === 'Attended' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}>
                            {a.status === 'Attended' ? '✓ attended' : '— pending'}
                          </span>
                          {a.status === 'Attended' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadCertificate(`Employee ${String(a.employeeId || '').slice(-3)}`, t.title, String(t.date || '').split('T')[0]);
                              }}
                              className="p-1 text-gray-400 hover:text-[#A81F24] hover:bg-[#A81F24]/10 rounded transition-colors"
                              title="Download Certificate"
                            >
                              <Download size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!t.attendees || t.attendees.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                        No attendees registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Agenda</h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-medium text-xs rounded">{t.duration} hr total</span>
              </div>
              <ul className="space-y-3">
                <li className="flex text-sm text-gray-800"><span className="w-6 text-gray-400 font-mono text-xs">01</span> DMAIC overview</li>
                <li className="flex text-sm text-gray-800"><span className="w-6 text-gray-400 font-mono text-xs">02</span> Process mapping</li>
                <li className="flex text-sm text-gray-800"><span className="w-6 text-gray-400 font-mono text-xs">03</span> Basic statistics</li>
                <li className="flex text-sm text-gray-800"><span className="w-6 text-gray-400 font-mono text-xs">04</span> Root cause analysis</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">By department</h3>
              <div className="space-y-3">
                {t.targetDepartments.map((dept, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 font-medium">{dept}</span>
                    <span className="text-xs text-gray-400">0/3 · <span className="font-medium text-gray-900">0%</span></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Materials & info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Trainer</span>
                  <span className="font-medium text-gray-900 text-right">{t.trainer || 'Internal'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900 text-right">Training Room A</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900 text-right">{t.type || 'Other'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Sessions</h4>
          <h2 className="text-3xl font-semibold text-gray-900">Shopfloor Training Manager</h2>
          <p className="text-gray-500 mt-1 text-sm">Manage employee training and development</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden p-0.5">
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1.5 text-xs font-medium rounded shadow-sm flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-[#1A1C1E] text-white' : 'text-gray-600 hover:text-gray-900 bg-transparent shadow-none'}`}
            >
               <List size={14} /> List
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-[#1A1C1E] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 bg-transparent'}`}
            >
               <Calendar size={14} /> Calendar
            </button>
          </div>
          <button onClick={handleExport} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Download size={14} />
            Export
          </button>
          {canWrite && (
          <button onClick={() => setIsNewTrainingModalOpen(true)} className="px-3 py-1.5 bg-[#A81F24] text-white text-xs font-semibold rounded-md shadow-sm hover:bg-[#8B1A1E] flex items-center gap-2 transition-colors">
            <Plus size={14} />
            New training
          </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Sessions</div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">{filteredTrainings.length}</div>
          <div className="text-xs text-gray-500">Matching current filters</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Hours</div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">{totalHours}h</div>
          <div className="text-xs text-gray-500">Delivery time</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Planned Attendees</div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">{totalAttendees}</div>
          <div className="text-xs text-gray-500">Across all sessions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 py-1">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search training name, code, trainer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm shadow-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="All statuses">All statuses</option>
            <option value="Planned">Planned</option>
            <option value="Conducted">Conducted</option>
            <option value="Canceled">Canceled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="All types">All types</option>
            {trainingTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="All departments">All departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="All time">All time</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Past">Past</option>
          </select>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {filteredTrainings.length} of {trainings.length}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'calendar' ? (
        <div className="mb-6">
          {renderCalendar()}
        </div>
      ) : (
        <div className="space-y-8">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Loading sessions...</div>
          ) : filteredTrainings.length === 0 ? (
            <div className="py-20 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-900 font-medium mb-1">No sessions found</p>
              <p className="text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            (Object.entries(groupedTrainings) as [string, TrainingRecord[]][]).map(([month, rows]) => (
              <div key={month}>
                <div className="flex justify-between items-end mb-3 border-b border-gray-200 pb-2">
                  <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">{month}</h3>
                  <span className="text-xs text-gray-500">{rows.length} sessions</span>
                </div>
                
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-500 tracking-wider uppercase border-b border-gray-100">
                    <th className="py-3 pr-4 font-semibold w-16">Date</th>
                    <th className="py-3 px-4 font-semibold">Training</th>
                    <th className="py-3 px-4 font-semibold w-28">Type</th>
                    <th className="py-3 px-4 font-semibold w-24">Duration</th>
                    <th className="py-3 px-4 font-semibold w-40">Trainer</th>
                    <th className="py-3 px-4 font-semibold min-w-40">Departments</th>
                    <th className="py-3 px-4 font-semibold w-56">Attendance</th>
                    <th className="py-3 pl-4 font-semibold w-28 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {rows.map(t => {
                    const tDate = new Date(t.date);
                    const day = isNaN(tDate.getTime()) ? '--' : tDate.getDate();
                    const dayName = isNaN(tDate.getTime()) ? '' : tDate.toLocaleDateString('en-US', { weekday: 'short'}).toUpperCase();
                    
                    const codeLabel = t.code || `TRN-${String(t.id).substring(0, 4).toUpperCase()}`;
                    
                    return (
                      <tr 
                        key={t.id} 
                        className="hover:bg-gray-50 group transition-colors cursor-pointer"
                        onClick={() => setSelectedTrainingId(t.id)}
                      >
                        <td className="py-4 pr-4 align-top">
                          <div className="flex flex-col">
                            <span className="text-xl font-semibold text-gray-900 leading-none">{day}</span>
                            <span className="text-[10px] font-medium text-gray-500 tracking-wide mt-1">{dayName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="font-medium text-gray-900 group-hover:text-[#A81F24] transition-colors">{t.title}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-2">
                            <span>{codeLabel}</span>
                            <span>•</span>
                            <span>Training Room A</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          {getTypeBadge(t.type || 'Other')}
                        </td>
                        <td className="py-4 px-4 align-top text-sm text-gray-800">
                          {t.duration || '--'}
                        </td>
                        <td className="py-4 px-4 align-top text-sm text-gray-800">
                          {t.trainer || 'Internal'}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {t.targetDepartments?.slice(0, 3).map(d => (
                              <span key={d} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200">
                                {d}
                              </span>
                            ))}
                            {(t.targetDepartments?.length || 0) > 3 && (
                              <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium border border-gray-100">
                                + {(t.targetDepartments?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          {getAttendanceProgress(t)}
                        </td>
                        <td className="py-4 pl-4 align-top text-right">
                          {getStatusBadge(t)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
      )}

      {isNewTrainingModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New Training</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Step {newTrainingStep} of 3</p>
              </div>
              <button onClick={() => { setIsNewTrainingModalOpen(false); setNewTrainingStep(1); }} className="text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                <span className="sr-only">Close</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex h-1 w-full bg-gray-100">
              <div 
                className="bg-[#A81F24] h-full transition-all duration-300" 
                style={{ width: `${(newTrainingStep / 3) * 100}%` }}
              ></div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {newTrainingStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Training Details</h4>
                    <p className="text-sm text-gray-500">Provide the core information about this session.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Training Title</label>
                      <input type="text" value={newTraining.title || ''} onChange={e => setNewTraining({...newTraining, title: e.target.value})} placeholder="e.g. Quality Manual Refresher" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Internal Code</label>
                        <input type="text" value={newTraining.code || ''} onChange={e => setNewTraining({...newTraining, code: e.target.value})} placeholder="e.g. TRN-001" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Training Type</label>
                        <select value={newTraining.type || (trainingTypes.length > 0 ? trainingTypes[0] : 'Classroom')} onChange={e => setNewTraining({...newTraining, type: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all appearance-none cursor-pointer">
                          {trainingTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scheduled Date</label>
                        <input type="date" value={newTraining.date || ''} onChange={e => setNewTraining({...newTraining, date: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (Hours)</label>
                        <input type="number" step="0.5" placeholder="2.5" value={newTraining.duration || ''} onChange={e => setNewTraining({...newTraining, duration: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lead Trainer</label>
                      <input type="text" value={newTraining.trainer || ''} onChange={e => setNewTraining({...newTraining, trainer: e.target.value})} placeholder="Name of instructor" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                      <textarea value={newTraining.notes || ''} onChange={e => setNewTraining({...newTraining, notes: e.target.value})} placeholder="Any additional notes..." rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all"></textarea>
                    </div>
                  </div>
                </div>
              )}

              {newTrainingStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Target Audience</h4>
                    <p className="text-sm text-gray-500">Select who needs to attend this session.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Departments</label>
                       <div className="grid grid-cols-2 gap-3">
                         <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#A81F24] focus:ring-[#A81F24]" />
                            <span className="text-sm font-medium text-gray-700">All Departments</span>
                         </label>
                         {departments.map(d => (
                            <label key={d} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <input type="checkbox" className="rounded border-gray-300 text-[#A81F24] focus:ring-[#A81F24]" />
                              <span className="text-sm font-medium text-gray-700">{d}</span>
                            </label>
                         ))}
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Target Unit</label>
                       <div className="flex gap-4 flex-wrap">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700"><input type="radio" name="unit" defaultChecked className="text-[#A81F24] focus:ring-[#A81F24]" /> All Units</label>
                          {businessUnits.map(u => (
                            <label key={u} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700"><input type="radio" name="unit" className="text-[#A81F24] focus:ring-[#A81F24]" /> {u}</label>
                          ))}
                       </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expected Headcount</label>
                      <input type="number" placeholder="Estimated attendees" value={newTraining.plannedAttendees || ''} onChange={e => setNewTraining({...newTraining, plannedAttendees: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all" />
                    </div>
                  </div>
                </div>
              )}

              {newTrainingStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Agenda & Materials</h4>
                    <p className="text-sm text-gray-500">Upload handouts and list the topics covered.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Topic Agenda</label>
                      <textarea rows={4} placeholder="- Intro to safety rules&#10;- Handling hazardous materials&#10;- Q&A" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24] transition-all resize-none"></textarea>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Training Materials</label>
                       <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                             <Upload size={20} className="text-[#A81F24]" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">Click to upload files</span>
                          <span className="text-xs text-gray-500 mt-1">PDF, PPTX, MP4 up to 50MB</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
              {newTrainingStep > 1 ? (
                <button type="button" onClick={() => setNewTrainingStep(prev => prev - 1)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
                  <ArrowLeft size={16} /> Back
                </button>
              ) : <div></div>}
              
              {newTrainingStep < 3 ? (
                <button type="button" onClick={() => setNewTrainingStep(prev => prev + 1)} className="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-lg shadow-sm transition-colors">
                  Continue
                </button>
              ) : (
                <button type="button" onClick={(e) => { handleAddTraining(e as any); setNewTrainingStep(1); }} className="px-6 py-2.5 text-sm font-bold text-white bg-[#A81F24] hover:bg-[#8B1A1E] rounded-lg shadow-sm transition-colors">
                  Save Training
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
