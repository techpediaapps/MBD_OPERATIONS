import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Download, MoreHorizontal, Calendar, Edit2, Copy, Filter, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const defaultCatalogItems: any[] = [];

export default function TrainingCatalog() {
  const { hasPermission } = useAuth();
  const { trainingTypes, departments } = useSettings();
  const canWrite = hasPermission('trainings', 'write');

  const [templates, setTemplates] = useState(defaultCatalogItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState<string[]>([]);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [lastRunStart, setLastRunStart] = useState('');
  const [lastRunEnd, setLastRunEnd] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<any>({ category: 'Safety', mandatory: false });

  const audienceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (audienceDropdownRef.current && !audienceDropdownRef.current.contains(event.target as Node)) {
        setShowAudienceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allAudienceDepts = useMemo(() => {
    return departments;
  }, [departments]);

  const handleAudienceToggle = (dept: string) => {
    setAudienceFilter(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const filtered = templates.filter(t => {
    const searchMatch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = typeFilter === 'All types' ? true : t.category === typeFilter;
    const mandatoryMatch = mandatoryOnly ? t.mandatory : true;
    
    const audienceMatch = audienceFilter.length === 0 ? true : t.audience.some(dept => audienceFilter.includes(dept));
    
    let lastRunMatch = true;
    if (t.lastRun !== 'Never') {
      const runDate = new Date(t.lastRun);
      if (lastRunStart && new Date(lastRunStart) > runDate) lastRunMatch = false;
      if (lastRunEnd && new Date(lastRunEnd) < runDate) lastRunMatch = false;
    } else if (lastRunStart || lastRunEnd) {
      lastRunMatch = false; // Exclude 'Never' if a date range is selected
    }

    return searchMatch && typeMatch && mandatoryMatch && audienceMatch && lastRunMatch;
  });

  const handleExport = () => {
    const lines = ["Code,Category,Mandatory,Title,Duration"];
    filtered.forEach(t => lines.push(`${t.code},${t.category},${t.mandatory},${t.title},${t.duration}`));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training_catalog.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDuplicate = (template: any) => {
    const duplicate = { ...template, id: Date.now(), code: `${template.code}-COPY`, deliveries: 0 };
    setTemplates([...templates, duplicate]);
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title) return;
    const item = {
      id: Date.now(),
      code: newTemplate.code || 'NEW-TPL',
      category: newTemplate.category || 'Safety',
      mandatory: !!newTemplate.mandatory,
      title: newTemplate.title,
      duration: newTemplate.duration || '1h',
      cadence: newTemplate.cadence || 'Annual',
      deliveries: 0,
      lastRun: 'Never',
      audience: ['All'],
      agenda: ['Introduction'],
      moreAgenda: 0,
    };
    setTemplates([...templates, item]);
    setIsModalOpen(false);
    setNewTemplate({ category: 'Safety', mandatory: false });
  };

  const totalTemplates = templates.length;
  const mandatoryCount = templates.filter(t => t.mandatory).length;
  const totalDeliveries = templates.reduce((acc, t) => acc + (t.deliveries || 0), 0);
  
  const avgDurationHours = templates.length > 0 
    ? (templates.reduce((acc, t) => {
        const hours = parseFloat(t.duration?.replace('h', '') || '0') || 0;
        return acc + hours;
      }, 0) / templates.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Library</h4>
          <h2 className="text-3xl font-semibold text-gray-900">Training Catalog</h2>
          <p className="text-gray-500 mt-1 text-sm">Reusable training templates — agenda, duration, target audience. Spin up a session<br/>from any template.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Download size={14} />
            Export
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-3 py-1.5 bg-[#A81F24] text-white text-xs font-semibold rounded-md shadow-sm hover:bg-[#8B1A1E] flex items-center gap-2 transition-colors">
            <Plus size={14} />
            New template
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Templates</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{totalTemplates}</div>
          </div>
          <div className="text-xs text-gray-500">In library</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mandatory</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{mandatoryCount}</div>
          </div>
          <div className="text-xs text-gray-500">Compliance required</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Deliveries</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{totalDeliveries}</div>
          </div>
          <div className="text-xs text-gray-500">All-time sessions</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avg. Duration</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{avgDurationHours}h</div>
          </div>
          <div className="text-xs text-gray-500">Per template</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-4 py-1 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search template name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm shadow-sm"
            />
          </div>
          
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

          <div className="relative" ref={audienceDropdownRef}>
            <button 
              onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              Audience {audienceFilter.length > 0 && `(${audienceFilter.length})`}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showAudienceDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">Departments</div>
                {allAudienceDepts.map(dept => (
                  <label key={dept} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                    <input 
                      type="checkbox" 
                      className="rounded text-[#A81F24] border-gray-300 focus:ring-[#A81F24]" 
                      checked={audienceFilter.includes(dept)}
                      onChange={() => handleAudienceToggle(dept)}
                    />
                    <span className="flex-1">{dept}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 shadow-sm">
            <span className="text-sm font-medium text-gray-500">Last run:</span>
            <input 
              type="date" 
              value={lastRunStart}
              onChange={(e) => setLastRunStart(e.target.value)}
              className="text-sm border-none bg-transparent p-0 focus:ring-0 text-gray-700 outline-none w-[110px]"
            />
            <span className="text-gray-300">-</span>
            <input 
              type="date" 
              value={lastRunEnd}
              onChange={(e) => setLastRunEnd(e.target.value)}
              className="text-sm border-none bg-transparent p-0 focus:ring-0 text-gray-700 outline-none w-[110px]"
            />
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 shadow-sm transition-colors">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-[#A81F24] focus:ring-[#A81F24]" 
              checked={mandatoryOnly}
              onChange={(e) => setMandatoryOnly(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Mandatory only</span>
          </label>
        </div>
        
        <div className="text-xs text-gray-500 font-medium">
          {filtered.length} of {templates.length} templates
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {filtered.map(t => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{t.code}</span>
                {t.category === 'Safety' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">{t.category}</span>
                )}
                {t.category === 'Compliance' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100">{t.category}</span>
                )}
                {t.mandatory && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-rose-600 border border-rose-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full border-[1.5px] border-rose-500"></span> Mandatory
                  </span>
                )}
              </div>
              <button className="text-gray-400 hover:text-gray-900 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t.title}</h3>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</div>
                <div className="text-sm font-medium text-gray-900">{t.duration}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cadence</div>
                <div className="text-sm font-medium text-gray-900">{t.cadence}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deliveries</div>
                <div className="text-sm font-medium text-gray-900">{t.deliveries}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Run</div>
                <div className="text-sm font-medium text-gray-900">{t.lastRun}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Audience</div>
              <div className="flex flex-wrap gap-1.5">
                {t.audience.map(d => (
                  <span key={d} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-8 flex-1">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Agenda · {t.agenda.length + (t.moreAgenda || 0)} Items</div>
              <ul className="space-y-1.5">
                {t.agenda.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-800 flex">
                    <span className="w-5 text-gray-400 font-mono text-xs pt-0.5">0{idx+1}</span> 
                    {item}
                  </li>
                ))}
                {t.moreAgenda > 0 && (
                  <li className="text-xs text-gray-500 font-medium mt-2">+{t.moreAgenda} more</li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button onClick={() => alert("Schedule Session Redirect")} className="px-3 py-1.5 bg-[#1A1C1E] text-white text-xs font-semibold rounded shadow-sm hover:bg-black transition-colors flex items-center gap-2">
                  <Calendar size={14} /> Schedule session
                </button>
                <button onClick={() => alert("Edit template")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Edit2 size={14} /> Edit template
                </button>
              </div>
              <button onClick={() => handleDuplicate(t)} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors">
                <Copy size={14} /> Duplicate
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">New Template</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleAddTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={newTemplate.title || ''} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input required type="text" value={newTemplate.code || ''} onChange={e => setNewTemplate({...newTemplate, code: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input required type="text" value={newTemplate.duration || ''} onChange={e => setNewTemplate({...newTemplate, duration: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={newTemplate.category || (trainingTypes.length > 0 ? trainingTypes[0] : 'Safety')} onChange={e => setNewTemplate({...newTemplate, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                    {trainingTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newTemplate.mandatory || false} onChange={e => setNewTemplate({...newTemplate, mandatory: e.target.checked})} className="rounded text-[#A81F24]" />
                    <span className="text-sm font-medium text-gray-700">Mandatory</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#A81F24] hover:bg-[#8B1A1E] rounded-md">Add Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
