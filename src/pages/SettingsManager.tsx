import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Server, Building2, BookOpen, Settings2, Globe, Bell, Shield, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

type TabId = 'general' | 'organization' | 'classifications' | 'notifications' | 'users';

export default function SettingsManager() {
  const { 
    departments, addDepartment, removeDepartment,
    trainingTypes, addTrainingType, removeTrainingType,
    businessUnits, addBusinessUnit, removeBusinessUnit
  } = useSettings();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('organization');

  const [newDepartment, setNewDepartment] = useState('');
  const [newTrainingType, setNewTrainingType] = useState('');
  const [newBusinessUnit, setNewBusinessUnit] = useState('');

  const [users, setUsers] = React.useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ username: '', password: '', role: 'HR_Manager', email: '' });

  React.useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch('/api/users');
      setUsers(await res.json());
    } catch (e) {
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleSaveUsers = async (updatedUsers: any[]) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUsers)
      });
      setUsers(updatedUsers);
    } catch (e) {
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.username && newUser.password) {
      const newU = { ...newUser, id: String(Date.now()) };
      handleSaveUsers([...users, newU]);
      setNewUser({ username: '', password: '', role: 'HR_Manager', email: '' });
    }
  };

  const handleDeleteUser = (id: string) => {
    handleSaveUsers(users.filter(u => u.id !== id));
  };
    
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      addDepartment(newDepartment.trim());
      setNewDepartment('');
    }
  };

  const handleAddTrainingType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrainingType.trim() && !trainingTypes.includes(newTrainingType.trim())) {
      addTrainingType(newTrainingType.trim());
      setNewTrainingType('');
    }
  };

  const handleAddBusinessUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBusinessUnit.trim() && !businessUnits.includes(newBusinessUnit.trim())) {
      addBusinessUnit(newBusinessUnit.trim());
      setNewBusinessUnit('');
    }
  };

  const tabs: { id: TabId, label: string, icon: any, desc: string }[] = [
    { id: 'general', label: 'General Parameters', icon: Settings2, desc: 'Localization, timezone, formats' },
    { id: 'organization', label: 'Organization', icon: Building2, desc: 'Units, departments, facilities' },
    ...(hasPermission('users', 'read') ? [{ id: 'users' as TabId, label: 'User Management', icon: Shield, desc: 'Users, roles, access control' }] : []),
    { id: 'classifications', label: 'Classifications', icon: BookOpen, desc: 'Types, categories, tags' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts, email preferences' }
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Settings Navigation */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure workspace parameters.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg flex items-start gap-4 transition-colors group",
                activeTab === tab.id 
                  ? "bg-white shadow-sm ring-1 ring-gray-200/50" 
                  : "hover:bg-gray-100/80"
              )}
            >
              <div className={cn(
                "p-2 rounded-md shrink-0 transition-colors",
                activeTab === tab.id ? "bg-[#A81F24]/10 text-[#A81F24]" : "bg-gray-200/50 text-gray-500 group-hover:text-gray-700 group-hover:bg-gray-200"
              )}>
                <tab.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-semibold text-sm",
                  activeTab === tab.id ? "text-[#A81F24]" : "text-gray-900 group-hover:text-gray-900"
                )}>{tab.label}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{tab.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-white">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-gray-900">General Parameters</h2>
                <p className="text-gray-500 mt-1">Set localized preferences for the entire workspace.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Default Timezone</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                        <option>UTC +08:00 (Asia/Singapore)</option>
                        <option>UTC +00:00 (London)</option>
                        <option>UTC -05:00 (New York)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Date Format</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                        <option>YYYY-MM-DD</option>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Language</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                        <option>English (US)</option>
                        <option>Chinese (Simplified)</option>
                        <option>Italian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Default Currency</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]">
                        <option>USD ($)</option>
                        <option>SGD (S$)</option>
                        <option>EUR (€)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                  <button className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Organization Structure</h2>
                <p className="text-gray-500 mt-1">Manage global divisions dynamically assigned to employees and resources.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Business Units */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">Business Units</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Top-level physical or logical locations</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Building2 className="text-gray-400" size={18} />
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <form onSubmit={handleAddBusinessUnit} className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        value={newBusinessUnit}
                        onChange={(e) => setNewBusinessUnit(e.target.value)}
                        placeholder="e.g. Plant A..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                      />
                      <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-900 font-semibold text-sm rounded-md hover:bg-gray-200 transition-colors">
                        Add
                      </button>
                    </form>
                    <div className="space-y-2">
                      {businessUnits.map((unit) => (
                        <div key={unit} className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 border border-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-200 transition-colors">
                          {unit}
                          <button onClick={() => removeBusinessUnit(unit)} className="text-gray-400 hover:text-rose-500 rounded-md p-1 hover:bg-rose-50 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Departments */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">Departments</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Functional business groupings</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Server className="text-gray-400" size={18} />
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <form onSubmit={handleAddDepartment} className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        placeholder="e.g. Quality Control..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                      />
                      <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-900 font-semibold text-sm rounded-md hover:bg-gray-200 transition-colors">
                        Add
                      </button>
                    </form>
                    <div className="space-y-2">
                      {departments.map((dept) => (
                        <div key={dept} className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 border border-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-200 transition-colors">
                          {dept}
                          <button onClick={() => removeDepartment(dept)} className="text-gray-400 hover:text-rose-500 rounded-md p-1 hover:bg-rose-50 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-500 mt-1">Manage system users, passwords, and assigned roles.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">Registered Users</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Users who can access the system</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Shield className="text-gray-400" size={18} />
                  </div>
                </div>
                
                <div className="p-5 flex-1 w-full max-w-full">
                  <form onSubmit={handleAddUser} className="flex gap-2 mb-6 w-full flex-wrap">
                    <input 
                      type="text" 
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="Username..."
                      required
                      className="flex-1 w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                    />
                    <input 
                      type="password" 
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Password..."
                      required
                      className="flex-1 w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                    >
                      <option value="Admin">Admin</option>
                      <option value="HR_Manager">HR Manager</option>
                      <option value="LD_Admin">L&D Admin</option>
                    </select>
                    <button type="submit" className="px-5 py-2 bg-[#A81F24] text-white font-semibold text-sm rounded-md shadow-sm hover:bg-red-800 transition-colors">
                      Add User
                    </button>
                  </form>
                  
                  {isUsersLoading ? (
                    <div className="py-8 text-center text-gray-500 text-sm">Loading users...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-gray-100 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Username</th>
                            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Role</th>
                            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50/50">
                              <td className="p-3 text-sm text-gray-900 font-medium">{u.username}</td>
                              <td className="p-3 text-sm text-gray-600">{u.role}</td>
                              <td className="p-3 text-sm text-right">
                                <button 
                                  onClick={() => handleDeleteUser(u.id)} 
                                  className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors text-xs font-medium"
                                  disabled={u.username === 'admin'}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Records & Classifications</h2>
                <p className="text-gray-500 mt-1">Configure reference data used for standardizing training sessions and catalogs.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-w-2xl">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">Training Categories</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Defines the fundamental type or theme of the training</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <BookOpen className="text-gray-400" size={18} />
                  </div>
                </div>
                <div className="p-5">
                  <form onSubmit={handleAddTrainingType} className="flex gap-3 mb-6">
                    <input 
                      type="text" 
                      value={newTrainingType}
                      onChange={(e) => setNewTrainingType(e.target.value)}
                      placeholder="e.g. Safety Management..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A81F24]/20 focus:border-[#A81F24]"
                    />
                    <button type="submit" className="px-5 py-2.5 bg-[#A81F24] text-white font-semibold text-sm rounded-lg hover:bg-red-800 transition-colors shadow-sm">
                      Add Category
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {trainingTypes.map((type) => (
                      <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg shadow-sm">
                        {type}
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <button onClick={() => removeTrainingType(type)} className="text-gray-400 hover:text-rose-500 -mr-1 p-0.5 rounded transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notifications Setup</h2>
                <p className="text-gray-500 mt-1">Control system-wide alert policies and messaging rules.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Alerts for Upcoming Trainings</h3>
                    <p className="text-sm text-gray-500 mt-1">Automatically notify attendees 3 days prior to session start.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#A81F24]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A81F24]"></div>
                  </label>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">System Digest Reports</h3>
                    <p className="text-sm text-gray-500 mt-1">Send weekly training summary reports to designated managers.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#A81F24]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A81F24]"></div>
                  </label>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Missing Action Reminders</h3>
                    <p className="text-sm text-gray-500 mt-1">Ping trainers continuously when post-training attendance requires finalizing.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#A81F24]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A81F24]"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

