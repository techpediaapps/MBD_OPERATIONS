import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter, BookOpen, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Employee, TrainingRecord } from '../types';
import Papa from 'papaparse';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function SkillMatrix() {
  const { hasPermission } = useAuth();
  const { departments } = useSettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All departments');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('All types');

  useEffect(() => {
    Promise.all([
      fetch('/api/employees').then(res => res.json()),
      fetch('/api/trainings').then(res => res.json())
    ]).then(([empData, trnData]) => {
      setEmployees(empData || []);
      setTrainings(trnData || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchName = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchId = emp.id.toLowerCase().includes(searchQuery.toLowerCase());
      const searchMatch = matchName || matchId;
      const deptMatch = deptFilter === 'All departments' || emp.department === deptFilter;
      const typeMatch = employeeTypeFilter === 'All types' || (employeeTypeFilter === 'Staff' ? emp.employeeType !== 'Shopfloor' : emp.employeeType === 'Shopfloor');
      return searchMatch && deptMatch && typeMatch && emp.status !== 'Resigned';
    });
  }, [employees, searchQuery, deptFilter, employeeTypeFilter]);

  const allSkills = useMemo(() => {
    // Unique training titles represent skills here
    const skills = new Set<string>();
    trainings.forEach(t => {
      if (t.title) skills.add(t.title);
    });
    return Array.from(skills).sort();
  }, [trainings]);

  const handleExport = () => {
    const csvData = filteredEmployees.map(emp => {
      const row: Record<string, string> = {
        'Employee ID': emp.id,
        'Name': emp.name,
        'Department': emp.department,
        'Type': emp.employeeType || 'Staff'
      };
      
      allSkills.forEach(skill => {
        // Find if they have attended
        const training = trainings.find(t => t.title === skill && t.attendees?.some(a => String(a.employeeId) === String(emp.id)));
        if (training) {
          const att = training.attendees.find(a => String(a.employeeId) === String(emp.id));
          row[skill] = att ? att.status : '-';
        } else {
          row[skill] = '-';
        }
      });
      return row;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skill_matrix_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Attended') return <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />;
    if (status === 'Planned') return <Clock size={16} className="text-amber-500 mx-auto" />;
    if (status === 'Dropped') return <XCircle size={16} className="text-rose-500 mx-auto" />;
    return <span className="text-gray-300">-</span>;
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Human Resources</h4>
          <h2 className="text-3xl font-semibold text-gray-900">Skill Matrix</h2>
          <p className="text-gray-500 mt-1 text-sm">Track and evaluate employee skills, competencies, and training gaps.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Download size={14} />
            Export Matrix
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 py-1">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm shadow-sm"
            />
          </div>
          
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="All departments">All departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={employeeTypeFilter}
            onChange={(e) => setEmployeeTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="All types">All types</option>
            <option value="Staff">Staff</option>
            <option value="Shopfloor">Shopfloor</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-gray-400 mr-2">
            Legend: 
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Acquired</span>
            <span className="flex items-center gap-1"><Clock size={12} className="text-amber-500" /> Planned</span>
            <span className="flex items-center gap-1"><XCircle size={12} className="text-rose-500" /> Gap</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-400 text-sm">Loading matrix data...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <BookOpen className="text-gray-300 mb-4" size={48} />
            <p className="font-medium text-gray-900 mb-1">No data to display</p>
            <p className="text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-none">
                  <th className="py-4 px-4 sticky left-0 z-10 bg-gray-50 border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb] min-w-[200px]">Employee</th>
                  <th className="p-4 w-32 border-r border-gray-200">Dept</th>
                  {allSkills.map(skill => (
                    <th key={skill} className="p-4 text-center min-w-[120px] max-w-[150px] border-r border-gray-200 border-b">
                      <div className="truncate" title={skill}>{skill}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2 px-4 sticky left-0 z-10 bg-white group-hover:bg-gray-50/70 border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm whitespace-nowrap">{emp.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5 whitespace-nowrap">{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-600 border-r border-gray-200">
                      {emp.department}
                    </td>
                    {allSkills.map(skill => {
                      // Does this employee have this training?
                      const relevantTrainings = trainings.filter(t => t.title === skill && t.attendees?.some(a => String(a.employeeId) === String(emp.id)));
                      let highestStatus = '-';
                      if (relevantTrainings.length > 0) {
                        // Could be in multiple sessions of same name? Find top status
                        const statuses = relevantTrainings.map(t => t.attendees?.find(a => String(a.employeeId) === String(emp.id))?.status);
                        if (statuses.includes('Attended')) highestStatus = 'Attended';
                        else if (statuses.includes('Planned')) highestStatus = 'Planned';
                        else if (statuses.includes('Dropped')) highestStatus = 'Dropped';
                      }

                      return (
                        <td key={skill} className="p-4 text-center border-r border-gray-200">
                          {getStatusIcon(highestStatus)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
