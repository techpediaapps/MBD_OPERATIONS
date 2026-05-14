import React, { useState, useEffect, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { Upload, Plus, Search, MoreHorizontal, Download, Filter, UserPlus, Mail, Archive, ArrowLeft, GraduationCap, XCircle, Clock, CheckCircle2, Edit2, Award, Calendar } from 'lucide-react';
import type { Employee } from '../types';
import jsPDF from 'jspdf';

import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function ShopfloorManager() {
  const { user, hasPermission } = useAuth();
  const { departments, businessUnits } = useSettings();
  const canWrite = hasPermission('employees', 'write');
  const canDelete = hasPermission('employees', 'delete');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All departments');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailedEmployee, setDetailedEmployee] = useState<Employee | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [trainings, setTrainings] = useState<any[]>([]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEmployeeData, setEditEmployeeData] = useState<Partial<Employee>>({});

  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkCertModalOpen, setIsBulkCertModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkCertTrainingId, setBulkCertTrainingId] = useState<string>('');
  const [bulkEditField, setBulkEditField] = useState('department');
  const [bulkEditValue, setBulkEditValue] = useState('');

  const handleAssignTrainingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainingId) return;
    
    const training = trainings.find(t => String(t.id) === selectedTrainingId);
    alert(`Successfully assigned ${selectedIds.size} employees to ${training?.title}`);
    
    setIsAssignModalOpen(false);
    setSelectedTrainingId('');
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    const updatedEmployees = employees.filter(emp => !selectedIds.has(String(emp.id)));
    setEmployees(updatedEmployees);
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
    
    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEmployees)
    }).catch(console.error);
  };

  const handleBulkEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    
    if (!bulkEditValue) return;

    setEmployees(employees.map(emp => {
      if (selectedIds.has(String(emp.id))) {
        return { ...emp, [bulkEditField]: bulkEditValue };
      }
      return emp;
    }));

    setIsBulkEditModalOpen(false);
    setBulkEditValue('');
    setSelectedIds(new Set());
  };

  const openAssignModal = (singleId?: string) => {
    if (singleId) {
      setSelectedIds(new Set([singleId]));
    }
    setIsAssignModalOpen(true);
  };

  const openEditModal = () => {
    if (detailedEmployee) {
      let formattedDate = detailedEmployee.dateOfJoining || '';
      
      const d = new Date(detailedEmployee.dateOfJoining || '');
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      } else {
        // Try parsing using the display format logic
        try {
          const displayStr = formatDateDisplay(detailedEmployee.dateOfJoining || '');
          const d2 = new Date(displayStr);
          if (!isNaN(d2.getTime())) {
            formattedDate = d2.toISOString().split('T')[0];
          }
        } catch (e) {}
      }

      setEditEmployeeData({
        ...detailedEmployee,
        dateOfJoining: formattedDate
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedEmployee) return;

    let finalDateOfJoining = editEmployeeData.dateOfJoining;
    if (finalDateOfJoining && finalDateOfJoining.match(/^\d{4}-\d{2}-\d{2}$/)) {
      finalDateOfJoining = formatDateDisplay(finalDateOfJoining);
    }

    const updatedEmployee = { 
      ...detailedEmployee, 
      ...editEmployeeData,
      dateOfJoining: finalDateOfJoining
    } as Employee;
    const updatedEmployees = employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp);
    
    setEmployees(updatedEmployees);
    setDetailedEmployee(updatedEmployee);
    setIsEditModalOpen(false);

    // Save to API
    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEmployees)
    }).catch(console.error);
  };

  useEffect(() => {
    fetchEmployees();
    fetchTrainings();
  }, []);

  const handleExport = () => {
    const csv = Papa.unparse(filteredEmployees.map(e => ({
      ID: e.id,
      Unit: e.unit,
      Name: e.name,
      Designation: e.designation,
      Department: e.department,
      "Date of Joining": e.dateOfJoining,
      Email: e.email || "",
      Type: e.employeeType || "Staff"
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name) return;
    
    let joinedDate = newEmployee.dateOfJoining || new Date().toISOString().split('T')[0];
    if (joinedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      joinedDate = formatDateDisplay(joinedDate);
    }
    
    const emp: Employee = {
      id: String(Math.floor(10000 + Math.random() * 90000)),
      slNo: employees.length + 1,
      unit: newEmployee.unit || 'Main',
      name: newEmployee.name || '',
      designation: newEmployee.designation || 'Staff',
      department: newEmployee.department || 'General',
      dateOfJoining: joinedDate,
      email: newEmployee.email,
      status: 'Active'
    };
    const updated = [...employees, emp];
    try {
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setEmployees(updated);
      setIsAddModalOpen(false);
      setNewEmployee({});
    } catch (err) {
      alert("Failed to add employee");
    }
  };

  const fetchTrainings = async () => {
    try {
      const res = await fetch('/api/trainings');
      const data = await res.json();
      setTrainings(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAttendanceStatus = async (trainingId: string, employeeId: string, oldStatus: string, newStatus: string) => {
    if (oldStatus === newStatus) return;
    
    const updatedTrainings = trainings.map((t: any) => {
      if (t.id === trainingId) {
        const updatedAttendees = t.attendees.map((a: any) => {
          if (String(a.employeeId) === String(employeeId)) {
            return { ...a, status: newStatus };
          }
          return a;
        });
        return { ...t, attendees: updatedAttendees };
      }
      return t;
    });

    setTrainings(updatedTrainings);

    fetch('/api/trainings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTrainings)
    }).catch(console.error);
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      let data = await res.json();
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await processImportedData(results.data);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        if (typeof bstr !== 'string' && !(bstr instanceof ArrayBuffer)) return;
        
        try {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const wsname = workbook.SheetNames[0];
          const ws = workbook.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });
          await processImportedData(data);
        } catch (error) {
          console.error('Error parsing Excel', error);
          alert('Failed to parse Excel file.');
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const processImportedData = async (data: any[]) => {
    const newEmployees: Employee[] = data.map((rawRow: any) => {
      const row: any = {};
      // Aggressively normalize keys to handle hidden characters in excel headers
      for (const [key, value] of Object.entries(rawRow)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        row[normalizedKey] = value;
      }
      
      const id = row['employeeid'] || row['idno'] || row['id'] || row['empid'] || row['empno'] || crypto.randomUUID();
      const name = row['employeename'] || row['name'] || row['fullname'] || '';
      const dateOfJoining = row['dateofjoining'] || row['date'] || row['doj'] || row['joiningdate'] || row['join'] || '';
      const email = row['email'] || row['emailaddress'] || row['mail'] || '';
      let empType: 'Staff' | 'Shopfloor' = 'Staff';
      const parsedType = String(row['employeetype'] || row['type'] || row['category'] || '').toLowerCase();
      if (parsedType.includes('shopfloor') || parsedType.includes('operator')) {
        empType = 'Shopfloor';
      }
      
      return {
        id: String(id),
        slNo: parseInt(row['slno'] || row['sl'] || row['sno'] || '0') || 0,
        unit: String(row['unit'] || row['location'] || ''),
        name: String(name),
        designation: String(row['designation'] || row['role'] || row['jobtitle'] || ''),
        department: String(row['department'] || row['dept'] || ''),
        dateOfJoining: String(dateOfJoining),
        email: email ? String(email) : undefined,
        employeeType: empType,
        status: 'Active' as 'Active' | 'Resigned'
      };
    }).filter(emp => emp.name);

    try {
      const existingIds = new Set(employees.map(e => String(e.id)));
      const toAdd = newEmployees.filter(e => !existingIds.has(e.id));
      
      const updatedEmployees = [...employees, ...toAdd];
      
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEmployees)
      });
      
      setEmployees(updatedEmployees);
      alert(`Success! Imported ${toAdd.length} new employees.`);
    } catch (error) {
      console.error(error);
      alert('Failed to save imported employees.');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredEmployees = useMemo(() => {
    return (Array.isArray(employees) ? employees : []).filter(emp => {
      if (!emp) return false;
      const nameMatch = String(emp.name || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
      const idMatch = String(emp.id || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
      const deptSearchMatch = String(emp.department || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
      
      const searchMatch = nameMatch || idMatch || deptSearchMatch;
      const deptMatch = deptFilter === 'All departments' ? true : String(emp.department || '').includes(deptFilter);
      const statusMatch = statusFilter === 'All statuses' ? true : (emp.status || 'Active') === statusFilter;
      return searchMatch && deptMatch && statusMatch;
    });
  }, [employees, searchQuery, deptFilter, statusFilter]);

  const handleDeleteEmployee = (id: string) => {
    setDeleteEmployeeId(id);
  };

  const confirmDeleteEmployee = () => {
    if (!deleteEmployeeId) return;
    const updated = employees.filter(e => e.id !== deleteEmployeeId);
    setEmployees(updated);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(deleteEmployeeId);
      return next;
    });
    if (detailedEmployee?.id === deleteEmployeeId) {
      setDetailedEmployee(null);
    }
    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(console.error);
    setDeleteEmployeeId(null);
  };

  const handleUpdateStatus = (id: string, newStatus: 'Active' | 'Resigned') => {
    const employee = employees.find(e => e.id === id);
    const updated = employees.map(e => e.id === id ? { ...e, status: newStatus } : e);
    setEmployees(updated);
    if (detailedEmployee?.id === id) {
      setDetailedEmployee({ ...detailedEmployee, status: newStatus });
    }
    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(console.error);
  };

  const handleBulkDownloadCertificates = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0 || !bulkCertTrainingId) return;

    const training = trainings.find(t => String(t.id) === bulkCertTrainingId);
    if (!training) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    });

    const date = new Date().toLocaleDateString();

    let isFirstPage = true;

    employees.forEach(emp => {
      if (selectedIds.has(String(emp.id))) {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        const employeeName = ((emp.firstName || '') + ' ' + (emp.lastName || '')).trim() || emp.name || 'Employee';
        const trainingTitle = training.title;
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
      }
    });

    if (!isFirstPage) {
      doc.save(`Bulk_Certificates_${training.title.replace(/\s+/g, '_')}.pdf`);
    }

    setIsBulkCertModalOpen(false);
    setBulkCertTrainingId('');
    setSelectedIds(new Set());
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

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(filteredEmployees.map(e => e.department).filter(Boolean));
    return depts.size;
  }, [filteredEmployees]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    // If it's a number string like an excel serial date
    if (!isNaN(Number(dateStr)) && Number(dateStr) > 10000) {
      const date = new Date((Number(dateStr) - (25567 + 2)) * 86400 * 1000); // Excel serial to JS Date
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      }
    }
    
    // Explicitly parse DD-MMM-YY, e.g., "02-Apr-06" or "15-Jul-13"
    const matchDDMMMYY = dateStr.trim().match(/^(\d{1,2})[-/ ]([a-zA-Z]{3,})[-/ ](\d{2,4})$/);
    if (matchDDMMMYY) {
      const day = parseInt(matchDDMMMYY[1], 10);
      const monthStr = matchDDMMMYY[2];
      let year = parseInt(matchDDMMMYY[3], 10);
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      const d = new Date(`${monthStr} ${day}, ${year}`);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      }
    }
    
    // Try to parse standard dates
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    }
    
    return dateStr;
  };

  const getJoinYear = (dateStr: string) => {
    if (!dateStr) return '2023';
    
    const formatted = formatDateDisplay(dateStr);
    const yearMatch = formatted.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) return yearMatch[0];
    
    return '2023';
  };

  const avgTenure = useMemo(() => {
    if (filteredEmployees.length === 0) return 0;
    const currentYear = new Date().getFullYear();
    let totalYears = 0;
    let count = 0;
    filteredEmployees.forEach(e => {
      if (e.dateOfJoining) {
        const joinYear = parseInt(getJoinYear(e.dateOfJoining), 10);
        if (!isNaN(joinYear)) {
          totalYears += (currentYear - joinYear);
          count++;
        }
      }
    });
    return count === 0 ? 0 : Number((totalYears / count).toFixed(1));
  }, [filteredEmployees]);

  // Mock functions for missing logic
  const getInitials = (name: string) => {
    return String(name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'E';
  };

  const getDepartmentInfo = (dept: string) => {
    const label = dept || 'General';
    let code = String(label).substring(0, 3).toUpperCase();
    if (label.toLowerCase().includes('injection')) code = 'INJ';
    if (label.toLowerCase().includes('assembly')) code = 'ASM';
    if (label.toLowerCase().includes('quality')) code = 'QC';
    if (label.toLowerCase().includes('print')) code = 'PRT';
    if (label.toLowerCase().includes('maintenance')) code = 'MNT';
    return { code, label };
  };

  const getTrainingStats = (empId: string) => {
    let completed = 0;
    let pending = 0;
    let dropped = 0;

    trainings.forEach(t => {
      if (t.attendees) {
        const attendee = t.attendees.find(a => a.employeeId === empId);
        if (attendee) {
          if (attendee.status === 'Attended') completed++;
          else if (attendee.status === 'Planned') pending++;
          else if (attendee.status === 'Dropped') dropped++;
        }
      }
    });

    const total = completed + pending + dropped;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, pending, dropped, pct };
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map(e => String(e.id))));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  let content = null;

  if (detailedEmployee) {
    const stats = getTrainingStats(detailedEmployee.id);
    const dept = getDepartmentInfo(detailedEmployee.department);
    const joinYear = getJoinYear(detailedEmployee.dateOfJoining!);
    const tenure = new Date().getFullYear() - parseInt(joinYear);

    content = (
      <div className="max-w-[1200px] mx-auto pb-12 animate-in fade-in duration-300">
        <button onClick={() => setDetailedEmployee(null)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to entire list
        </button>

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-6">
             <div className="w-24 h-24 rounded-full bg-[#1A1C1E] text-white flex items-center justify-center text-3xl font-bold font-sans shadow-md border-4 border-white">
                {getInitials(detailedEmployee.name)}
             </div>
             <div>
               <h2 className="text-3xl font-bold text-gray-900 mb-1">{detailedEmployee.name}</h2>
               <div className="flex items-center gap-3 text-sm text-gray-500">
                 <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">{detailedEmployee.id}</span>
                 <span>•</span>
                 <span>{detailedEmployee.designation}</span>
                 <span>•</span>
                 <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{dept.label} ({dept.code})</span>
               </div>
             </div>
          </div>
          
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded shadow-sm hover:bg-gray-50 flex items-center gap-2">
              <Download size={16} /> PDF Record
            </button>
            {canWrite && (
            <>
              <button onClick={openEditModal} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded shadow-sm hover:bg-gray-50 flex items-center gap-2">
                <Edit2 size={16} /> Edit Info
              </button>
              <button onClick={() => openAssignModal(detailedEmployee.id)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded shadow-sm hover:bg-gray-50 flex items-center gap-2">
                <UserPlus size={16} /> Assign
              </button>
            </>
            )}
            {canDelete && (
            <button onClick={() => handleDeleteEmployee(detailedEmployee.id)} className="p-1.5 bg-white border border-rose-200 text-rose-500 rounded hover:bg-rose-50 hover:text-rose-700 shadow-sm transition-colors" title="Delete employee">
              <XCircle size={18} />
            </button>
            )}
            <button className="p-1.5 bg-white border border-gray-200 text-gray-400 rounded hover:text-gray-900 shadow-sm">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Sessions</div>
             <div className="text-2xl font-black text-gray-900">{stats.completed + stats.dropped + stats.pending}</div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm border-b-4 border-b-emerald-500">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Attended</div>
             <div className="text-2xl font-black text-emerald-600">{stats.completed}</div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm border-b-4 border-b-rose-500">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Missed</div>
             <div className="text-2xl font-black text-rose-600">{stats.dropped}</div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm border-b-4 border-b-amber-400">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Upcoming</div>
             <div className="text-2xl font-black text-amber-500">{stats.pending}</div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hours Trained</div>
             <div className="text-2xl font-black text-gray-900">{stats.completed * 2.5}h</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
               <div className="border-b border-gray-200 p-4 pb-0">
                  <div className="flex gap-6 text-sm font-medium">
                    <button className="pb-3 border-b-2 border-[#A81F24] text-[#A81F24]">All History</button>
                    <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700">Attended</button>
                    <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700">Upcoming</button>
                  </div>
               </div>
               <div className="p-0">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                         <th className="p-4">Training Session</th>
                         <th className="p-4 w-32">Date</th>
                         <th className="p-4 w-24">Length</th>
                         <th className="p-4 w-36 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/60">
                      {trainings.filter(t => t.attendees && t.attendees.some((a: any) => String(a.employeeId) === String(detailedEmployee.id))).map(t => {
                         const attendee = t.attendees.find((a: any) => String(a.employeeId) === String(detailedEmployee.id));
                         const status = attendee?.status || 'Planned';
                         return (
                         <tr key={t.id} className="hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold tracking-wider">{t.code || `TRN-${String(t.id).slice(0, 4)}`}</span>
                                <span className="font-medium text-gray-900 text-sm">{t.title}</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-500">{t.date}</td>
                            <td className="p-4 text-sm text-gray-500">{t.duration}</td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <select
                                    value={status}
                                    onChange={e => {
                                      if (hasPermission('trainings', 'write')) {
                                        handleUpdateAttendanceStatus(t.id, detailedEmployee.id, status, e.target.value);
                                      }
                                    }}
                                    disabled={!hasPermission('trainings', 'write')}
                                    className={`text-[10px] font-bold uppercase tracking-wider rounded border-0 outline-none ${hasPermission('trainings', 'write') ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} ${
                                      status === 'Attended' ? 'bg-emerald-50 text-emerald-700' :
                                      status === 'Dropped' ? 'bg-rose-50 text-rose-700' :
                                      'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    <option value="Planned">PLANNED</option>
                                    <option value="Attended">ATTENDED</option>
                                    <option value="Dropped">DROPPED</option>
                                  </select>
                                  {status === 'Attended' && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadCertificate(detailedEmployee?.name || 'Employee', t.title, t.date);
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
                       )})}
                       {trainings.filter(t => t.attendees && t.attendees.some((a: any) => String(a.employeeId) === String(detailedEmployee.id))).length === 0 && (
                         <tr>
                           <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">No training history found.</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
          
          <div className="col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Details</h3>
              <dl className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between"><dt>Unit</dt><dd className="font-medium text-gray-900">{detailedEmployee.unit || 'Main'}</dd></div>
                <div className="flex justify-between"><dt>Joined</dt><dd className="font-medium text-gray-900">{formatDateDisplay(detailedEmployee.dateOfJoining)}</dd></div>
                <div className="flex justify-between"><dt>Tenure</dt><dd className="font-medium text-gray-900">{tenure} Years</dd></div>
                <div className="flex justify-between border-b border-gray-100 pb-3"><dt>Email</dt><dd className="font-medium text-[#A81F24] hover:underline underline-offset-2 break-all">{detailedEmployee.email || '-'}</dd></div>
                <div className="flex justify-between items-center pt-1">
                  <dt>Status</dt>
                  <dd>
                    <select 
                      value={detailedEmployee.status || 'Active'} 
                      onChange={(e) => handleUpdateStatus(detailedEmployee.id, e.target.value as 'Active' | 'Resigned')}
                      disabled={!canWrite}
                      className={`text-xs font-bold px-2 py-1 rounded border-0 outline-none ${canWrite ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} ${detailedEmployee.status === 'Resigned' ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}
                    >
                      <option value="Active">ACTIVE</option>
                      <option value="Resigned">RESIGNED</option>
                    </select>
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Training History</h3>
              <div className="space-y-3">
                {trainings
                  .filter(t => t.attendees?.some(a => a.employeeId === detailedEmployee.id))
                  .map(t => {
                    const att = t.attendees.find(a => a.employeeId === detailedEmployee.id);
                    if (!att) return null;
                    const dateObj = new Date(t.date);
                    const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : t.date;
                    
                    return (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 truncate pr-2">
                          {att.status === 'Attended' && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
                          {att.status === 'Planned' && <Calendar size={14} className="text-amber-500 flex-shrink-0" />}
                          {(att.status === 'Dropped' || att.status === 'Debarred') && <XCircle size={14} className="text-rose-500 flex-shrink-0" />}
                          <span className="truncate" title={t.title}>{t.title}</span>
                        </span>
                        <span className={`text-[10px] font-bold ${att.status === 'Dropped' ? 'text-rose-500' : 'text-gray-400'}`}>
                          {att.status === 'Dropped' ? 'DEBARRED' : (att.status === 'Planned' ? 'PLANNED' : formattedDate)}
                        </span>
                      </div>
                    );
                  })}
                {trainings.filter(t => t.attendees?.some(a => a.employeeId === detailedEmployee.id)).length === 0 && (
                  <div className="text-xs text-gray-400 italic">No training records found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="max-w-[1400px] mx-auto pb-12">
        <div className="flex justify-between items-start mb-8">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Employee Manager</h4>
          <h2 className="text-3xl font-semibold text-gray-900">Training By Employees (Shopfloor)</h2>
          <p className="text-gray-500 mt-1 text-sm">Manage workforce records, training eligibility, and per-employee history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            id="csv-upload" 
          />
          <label 
            htmlFor="csv-upload"
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload size={14} />
            Import CSV
          </label>
          {canWrite && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 bg-[#A81F24] text-white text-xs font-semibold rounded-md shadow-sm hover:bg-[#8B1A1E] flex items-center gap-2 transition-colors"
          >
            <Plus size={14} />
            Add employee
          </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active Employees</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{filteredEmployees.length}</div>
          </div>
          <div className="text-xs text-gray-500">Headcount on file</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Departments</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{uniqueDepartments}</div>
          </div>
          <div className="text-xs text-gray-500">Across 3 shifts</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Eligible for Training</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{filteredEmployees.length}</div>
          </div>
          <div className="text-xs text-gray-500">100% records complete</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avg. Tenure</div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{avgTenure}y</div>
          </div>
          <div className="text-xs text-gray-500">Years on payroll</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 py-1">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by name, ID, role..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm font-medium text-gray-700 shadow-sm"
          >
            <option value="All statuses">All statuses</option>
            <option value="Active">Active</option>
            <option value="Resigned">Resigned</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400 mr-2">
            Legend: 
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Attended</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Missed</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Upcoming</span>
          </div>
          <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded">
            {filteredEmployees.length} of {employees.length}
          </div>
          <button onClick={() => alert("More filters functionality coming soon")} className="px-2 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
            <Filter size={12} />
            More
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
         <div className="bg-[#1A1C1E] text-white px-4 py-3 rounded-lg shadow-lg mb-4 flex items-center justify-between animate-in fade-in flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded">{selectedIds.size}</span>
              <span className="text-sm font-medium text-gray-300">Employees selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsBulkCertModalOpen(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                title="Generate Certificates for selected employees"
              >
                <Award size={16} /> Certificates
              </button>
              {canWrite && (
              <button 
                onClick={() => setIsBulkEditModalOpen(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                title="Bulk Edit selected employees"
              >
                <Edit2 size={16} /> Bulk Edit
              </button>
              )}
              <button onClick={() => openAssignModal()} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-medium flex items-center gap-2 transition-colors">
                <GraduationCap size={16} /> Assign Training
              </button>
              <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-medium flex items-center gap-2 transition-colors">
                <Mail size={16} /> Message
              </button>
              <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-medium flex items-center gap-2 transition-colors">
                <Archive size={16} /> Archive
              </button>
              {canDelete && (
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded text-sm font-medium flex items-center gap-2 transition-colors ml-2"
              >
                <XCircle size={16} /> Delete
              </button>
              )}
              <div className="w-px h-4 bg-white/20 mx-2"></div>
              <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-400 hover:text-white px-2">Clear</button>
            </div>
         </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-gray-400 text-sm">Loading...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <p className="font-medium text-gray-900 mb-1">No employees found</p>
            <p className="text-sm">Try adjusting your filters or import data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-none">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 cursor-pointer text-[#A81F24] focus:ring-[#A81F24]" 
                      checked={selectedIds.size > 0 && selectedIds.size === filteredEmployees.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-4 pr-4 px-2 font-semibold">Employee</th>
                  <th className="p-4 font-semibold w-40">Department</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold w-32">Unit</th>
                  <th className="p-4 font-semibold w-28">Status</th>
                  <th className="p-4 font-semibold w-24">Joined</th>
                  <th className="p-4 font-semibold w-32">Trainings</th>
                  <th className="p-4 font-semibold w-32">Completion</th>
                  <th className="p-4 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredEmployees.map((emp) => {
                  const dept = getDepartmentInfo(emp.department);
                  const stats = getTrainingStats(emp.id);
                  const isSelected = selectedIds.has(String(emp.id));

                  return (
                    <tr 
                      key={emp.id} 
                      className={`hover:bg-gray-50/70 transition-colors group cursor-pointer ${isSelected ? 'bg-red-50/30' : ''}`}
                      onClick={() => setDetailedEmployee(emp)}
                    >
                      <td className="p-4 text-center cursor-default" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-[#A81F24] focus:ring-[#A81F24] cursor-pointer" 
                          checked={isSelected}
                          onChange={() => toggleSelect(String(emp.id))}
                        />
                      </td>
                      <td className="py-4 pr-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black text-white flex flex-shrink-0 items-center justify-center text-xs font-bold font-sans shadow-inner">
                            {getInitials(emp.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm whitespace-nowrap">{emp.name}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5 whitespace-nowrap">{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-1.5 py-0.5 border border-gray-200 bg-gray-50 text-gray-700 rounded text-[10px] font-bold tracking-widest uppercase">
                            {dept.code}
                          </span>
                          <span className="text-sm text-gray-500 whitespace-nowrap">{dept.label}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-800 text-sm font-medium whitespace-nowrap">{emp.designation}</td>
                      <td className="p-4 text-gray-800 text-sm whitespace-nowrap">
                        {emp.unit || 'Main'}
                      </td>
                      <td className="p-4">
                        {emp.status === 'Resigned' ? (
                          <span className="inline-block px-1.5 py-0.5 border border-rose-200 bg-rose-50 text-rose-700 rounded text-[10px] font-bold tracking-widest uppercase">
                            Resigned
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold tracking-widest uppercase">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-800 text-sm whitespace-nowrap">
                        {formatDateDisplay(emp.dateOfJoining)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="text-emerald-700">{stats.completed}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-rose-600">{stats.dropped}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-amber-500">{stats.pending}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3 w-full max-w-[120px]">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#1A1C1E]"
                              style={{ width: `${stats.pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-800 w-8">{stats.pct}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right cursor-default" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(openMenuId === String(emp.id) ? null : String(emp.id)); 
                            }} 
                            className={`p-1.5 rounded transition-colors ${openMenuId === String(emp.id) ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {openMenuId === String(emp.id) && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDetailedEmployee(emp); setOpenMenuId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                View full details
                              </button>
                              {canDelete && (
                              <>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                                >
                                  Delete employee
                                </button>
                              </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    );
  }

  return (
    <>
      {content}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-w-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden min-w-0">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Add New Employee</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required type="text" value={newEmployee.name || ''} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={newEmployee.email || ''} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select required value={newEmployee.department || ''} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                    <option value="" disabled>Select...</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input required type="text" value={newEmployee.designation || ''} onChange={e => setNewEmployee({...newEmployee, designation: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select required value={newEmployee.unit || ''} onChange={e => setNewEmployee({...newEmployee, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                    <option value="" disabled>Select...</option>
                    {businessUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                  <select required value={newEmployee.employeeType || ''} onChange={e => setNewEmployee({...newEmployee, employeeType: e.target.value as 'Staff' | 'Shopfloor'})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                    <option value="" disabled>Select...</option>
                    <option value="Staff">Staff</option>
                    <option value="Shopfloor">Shopfloor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input type="date" value={newEmployee.dateOfJoining || ''} onChange={e => setNewEmployee({...newEmployee, dateOfJoining: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#A81F24] hover:bg-[#8B1A1E] rounded-md">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-w-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden min-w-0 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Edit Employee Info</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required type="text" value={editEmployeeData.name || ''} onChange={e => setEditEmployeeData({...editEmployeeData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={editEmployeeData.email || ''} onChange={e => setEditEmployeeData({...editEmployeeData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select required value={editEmployeeData.department || ''} onChange={e => setEditEmployeeData({...editEmployeeData, department: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                    <option value="" disabled>Select...</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input required type="text" value={editEmployeeData.designation || ''} onChange={e => setEditEmployeeData({...editEmployeeData, designation: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select required value={editEmployeeData.unit || ''} onChange={e => setEditEmployeeData({...editEmployeeData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                    <option value="" disabled>Select...</option>
                    {businessUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                  <select required value={editEmployeeData.employeeType || ''} onChange={e => setEditEmployeeData({...editEmployeeData, employeeType: e.target.value as 'Staff' | 'Shopfloor'})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                    <option value="" disabled>Select...</option>
                    <option value="Staff">Staff</option>
                    <option value="Shopfloor">Shopfloor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input type="date" value={editEmployeeData.dateOfJoining || ''} onChange={e => setEditEmployeeData({...editEmployeeData, dateOfJoining: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#A81F24] hover:bg-[#8B1A1E] rounded-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-w-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden min-w-0">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Edit</h3>
              <button onClick={() => setIsBulkEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleBulkEditSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                You are updating <span className="font-bold text-gray-900">{selectedIds.size}</span> selected employee(s).
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field to Update</label>
                <select 
                  value={bulkEditField} 
                  onChange={e => {
                    setBulkEditField(e.target.value);
                    setBulkEditValue('');
                  }} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                >
                  <option value="department">Department</option>
                  <option value="status">Status</option>
                  <option value="role">Role</option>
                  <option value="unit">Business Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Value</label>
                {bulkEditField === 'status' ? (
                  <select 
                    required 
                    value={bulkEditValue} 
                    onChange={e => setBulkEditValue(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                  >
                    <option value="" disabled>Select status...</option>
                    <option value="Active">Active</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                ) : bulkEditField === 'department' ? (
                  <select 
                    required 
                    value={bulkEditValue} 
                    onChange={e => setBulkEditValue(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                  >
                    <option value="" disabled>Select department...</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : bulkEditField === 'unit' ? (
                  <select 
                    required 
                    value={bulkEditValue} 
                    onChange={e => setBulkEditValue(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                  >
                    <option value="" disabled>Select unit...</option>
                    {businessUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    required 
                    value={bulkEditValue} 
                    onChange={e => setBulkEditValue(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                    placeholder={`Enter new ${bulkEditField}`}
                  />
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsBulkEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#A81F24] hover:bg-[#8B1A1E] rounded-md">Apply Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkCertModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-w-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden min-w-0">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Generate Certificates</h3>
              <button onClick={() => setIsBulkCertModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleBulkDownloadCertificates} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                You are generating certificates for <span className="font-bold text-gray-900">{selectedIds.size}</span> selected employee(s).
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Training Session</label>
                <select 
                  required 
                  value={bulkCertTrainingId} 
                  onChange={e => setBulkCertTrainingId(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                >
                  <option value="" disabled>Select a training session...</option>
                  {trainings.map(t => (
                    <option key={t.id} value={t.id}>{t.code || `TRN-${String(t.id).substring(0,4).toUpperCase()}`} - {t.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsBulkCertModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#A81F24] hover:bg-[#8B1A1E] rounded-md">Generate PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-w-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden min-w-0">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Assign Training</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleAssignTrainingSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                You are assigning training to <span className="font-bold text-gray-900">{selectedIds.size}</span> selected employee(s).
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Training Session</label>
                <select 
                  required 
                  value={selectedTrainingId} 
                  onChange={e => setSelectedTrainingId(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                >
                  <option value="" disabled>Select a training session...</option>
                  {trainings.map(t => (
                    <option key={t.id} value={t.id}>{t.code || `TRN-${String(t.id).substring(0,4).toUpperCase()}`} - {t.title}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#A81F24] hover:bg-[#8B1A1E] rounded-md flex items-center gap-2">
                  <GraduationCap size={16} /> Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteEmployeeId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-w-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden min-w-0">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Employee</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setDeleteEmployeeId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A81F24]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEmployee}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-w-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden min-w-0 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 text-rose-600">
              <XCircle size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Bulk Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete <span className="font-bold text-gray-900">{selectedIds.size}</span> selected employees? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl border-t border-gray-200">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A81F24]"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 flex items-center gap-2"
              >
                Delete {selectedIds.size} Employees
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
