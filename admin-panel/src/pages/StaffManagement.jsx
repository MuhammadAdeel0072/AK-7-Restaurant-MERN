import React, { useState, useEffect, useMemo } from 'react';
import api, { socket } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, ClipboardList, DollarSign, TrendingUp, Clock, BarChart3,
  Search, Filter, ChevronLeft, ChevronRight, Edit3, Trash2, Eye, X,
  Check, AlertCircle, Calendar, Star, Award, Briefcase, Phone, Mail,
  CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Activity, Download,
  FileText, FileSpreadsheet, ChevronDown
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { exportToPDF, exportToExcel } from '../services/exportService';

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════
const ROLES = ['Chef', 'Rider', 'Waiter', 'Manager', 'Cashier', 'Admin'];
const STATUSES = ['Active', 'Inactive', 'On Leave'];
const SHIFTS = ['Morning', 'Evening', 'Night', 'Off'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late'];

const TABS = [
  { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
  { id: 'list', label: 'Staff List', icon: Users },
  { id: 'add', label: 'Add Staff', icon: UserPlus },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList },
  { id: 'salaries', label: 'Salaries', icon: DollarSign },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'shifts', label: 'Shifts', icon: Clock },
];

const PIE_COLORS = ['#D4AF37', '#dc143c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(null); // 'view' | 'edit' | 'delete' | null
  const [editForm, setEditForm] = useState({});

  // ── Fetch staff list ──
  const fetchStaff = async () => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);
      if (roleFilter !== 'All') params.append('role', roleFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      const { data } = await api.get(`/staff?${params}`);
      setStaffList(data.staff);
      setTotalPages(data.pages);
      setTotalRecords(data.total);
    } catch (err) {
      toast.error('Failed to load staff');
    }
  };

  // ── Fetch all staff without pagination (for attendance/salary/shifts/performance) ──
  const fetchAllStaff = async () => {
    try {
      const { data } = await api.get('/staff?limit=500');
      return data.staff;
    } catch (err) {
      toast.error('Failed to load staff');
      return [];
    }
  };

  // ── Fetch dashboard stats ──
  const fetchStats = async () => {
    try {
      const { data } = await api.get('/staff/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStaff(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => { fetchStaff(); }, [page, search, roleFilter, statusFilter, limit]);

  // ── Socket listeners ──
  useEffect(() => {
    const handleUpdate = () => {
      fetchStaff();
      fetchStats();
    };
    socket.on('staffUpdate', handleUpdate);
    socket.on('staffAttendanceUpdate', handleUpdate);
    socket.on('staffStatusChange', handleUpdate);
    return () => {
      socket.off('staffUpdate', handleUpdate);
      socket.off('staffAttendanceUpdate', handleUpdate);
      socket.off('staffStatusChange', handleUpdate);
    };
  }, []);

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!selectedStaff) return;
    try {
      await api.delete(`/staff/${selectedStaff._id}`);
      toast.success(`${selectedStaff.name} removed successfully`);
      setShowModal(null);
      setSelectedStaff(null);
      fetchStaff();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete staff member');
    }
  };

  // ── Edit handler ──
  const handleEdit = async () => {
    if (!selectedStaff) return;
    try {
      await api.put(`/staff/${selectedStaff._id}`, editForm);
      toast.success(`${editForm.name || selectedStaff.name} updated successfully`);
      setShowModal(null);
      setSelectedStaff(null);
      fetchStaff();
      fetchStats();
    } catch (err) {
      toast.error('Failed to update staff member');
    }
  };

  // ── Loading state ──
  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.header variants={itemVariants}>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight">
          <span className="text-soft-white uppercase">Staff</span> <span className="text-gold">Management</span>
        </h1>
        <p className="text-soft-white/40 tracking-[0.4em] uppercase text-[10px] font-bold mt-2">Team Operations Center</p>
      </motion.header>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 border ${activeTab === tab.id
              ? 'bg-gold/10 text-gold border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
              : 'text-soft-white/50 border-white/5 hover:bg-white/5 hover:text-soft-white/80'
              }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
          {activeTab === 'list' && (
            <ListTab
              staffList={staffList} search={search} setSearch={(v) => { setSearch(v); setPage(1); }}
              roleFilter={roleFilter} setRoleFilter={(v) => { setRoleFilter(v); setPage(1); }}
              statusFilter={statusFilter} setStatusFilter={(v) => { setStatusFilter(v); setPage(1); }}
              page={page} setPage={setPage} totalPages={totalPages}
              limit={limit} setLimit={(v) => { setLimit(v); setPage(1); }} totalRecords={totalRecords}
              onView={s => { setSelectedStaff(s); setShowModal('view'); }}
              onEdit={s => { setSelectedStaff(s); setEditForm({ name: s.name, email: s.email, phone: s.phone, role: s.role, status: s.status }); setShowModal('edit'); }}
              onDelete={s => { setSelectedStaff(s); setShowModal('delete'); }}
              fetchAllStaff={fetchAllStaff}
            />
          )}
          {activeTab === 'add' && <AddStaffTab onSuccess={() => { fetchStaff(); fetchStats(); setActiveTab('list'); }} />}
          {activeTab === 'attendance' && <AttendanceTab fetchAllStaff={fetchAllStaff} />}
          {activeTab === 'salaries' && <SalariesTab fetchAllStaff={fetchAllStaff} />}
          {activeTab === 'performance' && <PerformanceTab fetchAllStaff={fetchAllStaff} />}
          {activeTab === 'shifts' && <ShiftsTab fetchAllStaff={fetchAllStaff} />}
        </motion.div>
      </AnimatePresence>

      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* View Modal */}
              {showModal === 'view' && selectedStaff && (
                <>
                  <div className="flex items-center justify-between mb-6 sticky top-0 bg-charcoal z-20 py-4 -mt-4 -mx-6 px-6 border-b border-white/5 rounded-t-2xl">
                    <h3 className="text-xl font-serif font-bold text-gold">Staff Profile</h3>
                    <button onClick={() => setShowModal(null)} className="btn-close-gold"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center text-2xl font-serif font-bold text-gold italic">
                        {selectedStaff.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-soft-white">{selectedStaff.name}</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedStaff.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : selectedStaff.status === 'On Leave' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                          {selectedStaff.status}
                        </span>
                      </div>
                    </div>
                    <InfoRow icon={Briefcase} label="Role" value={selectedStaff.role} />
                    <InfoRow icon={Mail} label="Email" value={selectedStaff.email} />
                    <InfoRow icon={Phone} label="Phone" value={selectedStaff.phone} />
                    <InfoRow icon={DollarSign} label="Base Salary" value={`Rs. ${selectedStaff.salary?.base?.toLocaleString()}`} />
                    <InfoRow icon={Calendar} label="Joined" value={new Date(selectedStaff.joiningDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <InfoRow icon={Star} label="Rating" value={`${selectedStaff.performance?.rating || 0} / 5`} />
                  </div>
                </>
              )}

              {/* Edit Modal */}
              {showModal === 'edit' && selectedStaff && (
                <>
                  <div className="flex items-center justify-between mb-6 sticky top-0 bg-charcoal z-20 py-4 -mt-4 -mx-6 px-6 border-b border-white/5 rounded-t-2xl">
                    <h3 className="text-xl font-serif font-bold text-gold">Edit Staff</h3>
                    <button onClick={() => setShowModal(null)} className="btn-close-gold"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <FormField label="Name" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} placeholder="Full name" />
                    <FormField label="Email" value={editForm.email} onChange={v => setEditForm(p => ({ ...p, email: v }))} placeholder="email@example.com" type="email" />
                    <FormField label="Phone" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} placeholder="03XX-XXXXXXX" />
                    <SelectField label="Role" value={editForm.role} onChange={v => setEditForm(p => ({ ...p, role: v }))} options={ROLES} icon={Briefcase} />
                    <SelectField label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={STATUSES} icon={Activity} />
                    <button onClick={handleEdit} className="btn-gold w-full mt-4 flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </>
              )}

              {/* Delete Modal */}
              {showModal === 'delete' && selectedStaff && (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-crimson/10 border-2 border-crimson/30 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-crimson" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-soft-white mb-2">Remove Staff Member?</h3>
                    <p className="text-soft-white/50 text-sm mb-6">Are you sure you want to remove <strong className="text-soft-white">{selectedStaff.name}</strong>? This action can be undone by contacting support.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowModal(null)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-soft-white/70 hover:bg-white/5 font-semibold transition-all">Cancel</button>
                      <button onClick={handleDelete} className="flex-1 px-4 py-3 rounded-xl bg-crimson/90 text-white font-bold hover:bg-crimson transition-all">Remove</button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2 border-b border-white/5">
    <Icon className="w-4 h-4 text-gold/60" />
    <span className="text-soft-white/50 text-sm w-28">{label}</span>
    <span className="text-soft-white font-semibold text-sm">{value}</span>
  </div>
);

const FormField = ({ label, value, onChange, placeholder, type = 'text', error, hint }) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider text-soft-white/50 mb-1.5">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-charcoal border ${error ? 'border-crimson/50' : 'border-white/10'} rounded-xl px-5 py-4 text-soft-white placeholder-soft-white/20 focus:outline-none focus:border-gold/40 transition-colors text-base appearance-none`}
      style={{ colorScheme: 'dark' }}
    />
    {error && <p className="text-crimson text-sm mt-1.5 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
    {hint && !error && <p className="text-soft-white/30 text-[11px] mt-1.5">{hint}</p>}
  </div>
);

const SelectField = ({ label, value, onChange, options, error, icon: Icon }) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider text-soft-white/50 mb-1.5">{label}</label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/60 group-focus-within:text-gold transition-colors z-10 pointer-events-none">
          <Icon className="w-full h-full" />
        </div>
      )}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-charcoal border ${error ? 'border-crimson/50' : 'border-white/10'} rounded-xl ${Icon ? 'pl-12' : 'px-5'} pr-10 py-4 text-white focus:outline-none focus:border-gold/40 transition-all text-base appearance-none cursor-pointer hover:border-white/20`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 16px center',
          WebkitAppearance: 'none'
        }}
      >
        <option value="" className="bg-black text-white">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt} className="bg-black text-white">{opt}</option>)}
      </select>
    </div>
    {error && <p className="text-crimson text-sm mt-1.5 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
    'On Leave': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${colors[status] || 'bg-white/5 text-soft-white/50 border-white/10'}`}>
      {status}
    </span>
  );
};

// ═══════════════════════════════════════════
// TAB 1: DASHBOARD
// ═══════════════════════════════════════════
const DashboardTab = ({ stats }) => {
  if (!stats) return <p className="text-soft-white/40 text-center py-20">No data available</p>;

  const cards = [
    { title: 'Total Staff', value: stats.totalStaff, icon: Users, color: 'text-blue-400' },
    { title: 'Active Staff', value: stats.activeStaff, icon: CheckCircle, color: 'text-emerald-400' },
    { title: 'Absent Today', value: stats.absentToday, icon: XCircle, color: 'text-red-400' },
    { title: 'Pending Salaries', value: stats.pendingSalaries, icon: DollarSign, color: 'text-yellow-400' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <motion.div key={idx} variants={itemVariants}
            className="glass p-5 rounded-2xl border border-white/5 hover:border-gold/20 transition-all duration-500 group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-soft-white/40 text-[10px] font-bold uppercase tracking-widest">{card.title}</span>
              <card.icon className={`w-5 h-5 ${card.color} opacity-60 group-hover:scale-110 transition-transform`} />
            </div>
            <h3 className="text-3xl font-bold text-soft-white">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <motion.div variants={itemVariants} className="bg-[#1A1A1A] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
          <h3 className="text-lg font-serif font-bold text-gold mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gold rounded-full" /> Role Distribution
          </h3>
          {stats.roleDistribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.roleDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                  {stats.roleDistribution.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#E0E0E0', fontSize: '13px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#E0E0E0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-soft-white/30 text-center py-10 text-sm">No staff data yet</p>}
        </motion.div>

        {/* Attendance Overview */}
        <motion.div variants={itemVariants} className="bg-[#1A1A1A] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
          <h3 className="text-lg font-serif font-bold text-gold mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gold rounded-full" /> Attendance This Week
          </h3>
          {stats.attendanceOverview?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.attendanceOverview} barGap={2}>
                <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#E0E0E0', fontSize: '13px' }} />
                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-soft-white/30 text-center py-10 text-sm">No attendance data yet</p>}
        </motion.div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// TAB 2: STAFF LIST
// ═══════════════════════════════════════════
const ListTab = ({ staffList, search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter, page, setPage, totalPages, limit, setLimit, totalRecords, onView, onEdit, onDelete, fetchAllStaff }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type) => {
    setExporting(true);
    const allStaff = await fetchAllStaff();

    // Apply current filters to the exported data
    const filtered = allStaff.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search);
      const matchRole = roleFilter === 'All' || s.role === roleFilter;
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });

    if (type === 'pdf') {
      exportToPDF({
        filename: `Staff_List_${new Date().toISOString().split('T')[0]}`,
        title: 'Staff Directory Report',
        subtitle: `Filtered by: Role(${roleFilter}), Status(${statusFilter}), Search("${search || 'None'}")`,
        columns: ['Name', 'Email', 'Role', 'Status', 'Salary', 'Joined'],
        data: filtered.map(s => [
          s.name,
          s.email,
          s.role,
          s.status,
          `Rs. ${s.salary?.base?.toLocaleString()}`,
          new Date(s.joiningDate).toLocaleDateString()
        ])
      });
    } else {
      exportToExcel({
        filename: `Staff_List_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'Staff',
        data: filtered.map(s => ({
          Name: s.name,
          Email: s.email,
          Phone: s.phone,
          Role: s.role,
          Status: s.status,
          Salary: s.salary?.base,
          Joined: new Date(s.joiningDate).toLocaleDateString()
        }))
      });
    }
    setExporting(false);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-[3] min-w-[300px] max-w-xl group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50 group-focus-within:text-gold transition-colors z-10">
            <Search className="w-full h-full" />
          </div>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-charcoal border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-soft-white/20 focus:outline-none focus:border-gold/40 focus:ring-4 focus:ring-gold/5 transition-all text-base shadow-lg"
          />
        </div>

        <div className="relative group min-w-[150px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60 group-focus-within:text-gold transition-colors z-10 pointer-events-none" />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="w-full bg-charcoal border border-white/10 rounded-xl pl-11 pr-10 py-4 text-white text-base font-bold focus:outline-none focus:border-gold/40 hover:border-white/20 transition-all cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              WebkitAppearance: 'none'
            }}
          >
            <option value="All" className="bg-black text-white">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} className="bg-black text-white">{r}</option>)}
          </select>
        </div>

        <div className="relative group min-w-[150px]">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60 group-focus-within:text-gold transition-colors z-10 pointer-events-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-charcoal border border-white/10 rounded-xl pl-11 pr-10 py-4 text-white text-base font-bold focus:outline-none focus:border-gold/40 hover:border-white/20 transition-all cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              WebkitAppearance: 'none'
            }}
          >
            <option value="All" className="bg-black text-white">All Status</option>
            {STATUSES.map(s => <option key={s} value={s} className="bg-black text-white">{s}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-4 bg-crimson/10 border border-crimson/20 text-crimson rounded-xl text-xs font-bold hover:bg-crimson/20 transition-all shadow-lg disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} /> PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all shadow-lg disabled:opacity-50"
          >
            <FileText className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} /> EXCEL
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1A1A]">
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold rounded-tl-2xl">Name</th>
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold">Role</th>
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold">Status</th>
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold">Salary</th>
                <th className="text-right py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-soft-white/30">No staff found</td></tr>
              ) : (
                staffList.map(s => (
                  <tr key={s._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-bold text-gold font-serif italic">
                          {s.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-soft-white group-hover:text-gold transition-colors">{s.name}</p>
                          <p className="text-[11px] text-soft-white/30">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-soft-white/70">{s.role}</td>
                    <td className="py-4 px-5"><StatusBadge status={s.status} /></td>
                    <td className="py-4 px-5 text-soft-white/70 font-semibold">Rs. {s.salary?.base?.toLocaleString()}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onView(s)} className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="View Profile"><Eye className="w-4 h-4 text-soft-white/40 hover:text-gold" /></button>
                        <button onClick={() => onEdit(s)} className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Edit"><Edit3 className="w-4 h-4 text-soft-white/40 hover:text-blue-400" /></button>
                        <button onClick={() => onDelete(s)} className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Remove"><Trash2 className="w-4 h-4 text-soft-white/40 hover:text-crimson" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-white/5 gap-4 bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-soft-white/40 uppercase tracking-widest">Show</span>
            <div className="relative group">
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gold/60 pointer-events-none" />
              <select 
                value={limit} 
                onChange={e => setLimit(Number(e.target.value))}
                className="bg-charcoal border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-gold/40 hover:border-white/20 transition-all cursor-pointer appearance-none"
              >
                {[5, 10, 25, 50].map(size => (
                  <option key={size} value={size} className="bg-black text-white">{size}</option>
                ))}
              </select>
            </div>
            <span className="text-[11px] font-bold text-soft-white/40 uppercase tracking-widest">entries</span>
          </div>
          
          <div className="text-[11px] font-bold text-soft-white/40 uppercase tracking-widest">
            Showing {totalRecords === 0 ? 0 : Math.min((page - 1) * limit + 1, totalRecords)}–{Math.min(page * limit, totalRecords)} of <span className="text-white">{totalRecords}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="flex items-center justify-center h-8 px-3 rounded-lg border border-white/10 text-[11px] font-bold uppercase tracking-wider text-soft-white/70 hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            >
              Prev
            </button>
            
            <div className="flex items-center px-2 gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        pageNum === page 
                          ? 'bg-gold text-charcoal' 
                          : 'text-soft-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === page - 2 || 
                  pageNum === page + 2
                ) {
                  return <span key={pageNum} className="text-soft-white/30 text-xs px-1">...</span>;
                }
                return null;
              })}
            </div>

            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="flex items-center justify-center h-8 px-3 rounded-lg border border-white/10 text-[11px] font-bold uppercase tracking-wider text-soft-white/70 hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// TAB 3: ADD STAFF
// ═══════════════════════════════════════════
const AddStaffTab = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', salary: '', shift: '', joiningDate: '', status: 'Active' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.role) e.role = 'Please select a role';
    if (!form.salary || isNaN(form.salary) || Number(form.salary) <= 0) e.salary = 'Enter a valid salary amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/staff', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        salary: Number(form.salary),
        status: form.status,
        joiningDate: form.joiningDate || new Date().toISOString(),
        shifts: form.shift ? DAYS.map(d => ({ day: d, shift: form.shift })) : []
      });
      toast.success('Staff member added successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.name && form.email && form.phone && form.role && form.salary;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-xl mx-auto">
      <motion.div variants={itemVariants} className="bg-[#1A1A1A] rounded-[2rem] border border-white/5 p-8 md:p-10 shadow-2xl transition-all duration-500 hover:border-gold/10">
        <h3 className="text-2xl font-serif font-black text-gold mb-8 flex items-center gap-3">
          <div className="w-1.5 h-7 bg-gold rounded-full" /> Add Professional Staff Member
        </h3>

        {/* Personal Info */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-soft-white/30 mb-4">Personal Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Full Name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Ahmad Khan" error={errors.name} />
            <FormField label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="e.g. ahmad@ak7rest.com" type="email" error={errors.email} />
            <FormField label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="e.g. 0300-1234567" error={errors.phone} />
            <FormField label="Joining Date" value={form.joiningDate} onChange={v => setForm(p => ({ ...p, joiningDate: v }))} type="date" hint="Leave empty for today" />
          </div>
        </div>

        {/* Employment Details */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-soft-white/30 mb-4">Employment Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Role" value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} options={ROLES} error={errors.role} icon={Briefcase} />
            <FormField label="Monthly Salary (Rs.)" value={form.salary} onChange={v => setForm(p => ({ ...p, salary: v }))} placeholder="e.g. 25000" type="number" error={errors.salary} />
            <SelectField label="Default Shift" value={form.shift} onChange={v => setForm(p => ({ ...p, shift: v }))} options={SHIFTS.filter(s => s !== 'Off')} icon={Clock} />
            <SelectField label="Status" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} icon={Activity} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="btn-gold flex-1 py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_4px_20px_rgba(212,175,55,0.2)]"
          >
            {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UserPlus className="w-6 h-6" />}
            {submitting ? 'Processing...' : 'Add New Staff Member'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// TAB 4: ATTENDANCE
// ═══════════════════════════════════════════
const AttendanceTab = ({ fetchAllStaff }) => {
  const [staff, setStaff] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]); // IDs of unmarked staff
  const [showValidationBanner, setShowValidationBanner] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setValidationErrors([]);
      setShowValidationBanner(false);
      const allStaff = await fetchAllStaff();
      setStaff(allStaff);

      // Build attendance map for selected date
      const map = {};
      const dateStart = new Date(selectedDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(23, 59, 59, 999);

      let hasExistingRecords = false;
      allStaff.forEach(s => {
        const record = s.attendance?.find(a => {
          const d = new Date(a.date);
          return d >= dateStart && d <= dateEnd;
        });
        map[s._id] = record?.status || '';
        if (record?.status) hasExistingRecords = true;
      });
      setAttendanceMap(map);
      setIsLocked(hasExistingRecords);
      setLoading(false);
    };
    load();
  }, [selectedDate]);

  const handleMark = (staffId, status) => {
    if (isLocked) return; // Prevent changes on locked dates
    setAttendanceMap(prev => ({ ...prev, [staffId]: prev[staffId] === status ? '' : status }));
    // Clear validation error for this staff member when they get marked
    setValidationErrors(prev => prev.filter(id => id !== staffId));
  };

  const saveAttendance = async () => {
    // Client-side validation: check ALL active staff are marked
    const activeStaff = staff.filter(s => s.status === 'Active');
    const unmarkedStaff = activeStaff.filter(s => !attendanceMap[s._id]);

    if (unmarkedStaff.length > 0) {
      setValidationErrors(unmarkedStaff.map(s => s._id));
      setShowValidationBanner(true);
      toast.error(`Please mark attendance for all ${activeStaff.length} employees. ${unmarkedStaff.length} remaining.`, {
        duration: 5000,
        icon: '⚠️'
      });
      // Scroll to first unmarked row
      const firstUnmarked = document.getElementById(`attendance-row-${unmarkedStaff[0]._id}`);
      if (firstUnmarked) {
        firstUnmarked.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setValidationErrors([]);
    setShowValidationBanner(false);
    setSaving(true);

    try {
      const records = Object.entries(attendanceMap)
        .filter(([_, status]) => status)
        .map(([staffId, status]) => ({ staffId, status }));

      await api.post('/staff/attendance/bulk', { date: selectedDate, records });
      toast.success('Attendance saved & locked successfully!', { icon: '🔒', duration: 4000 });
      setIsLocked(true);
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message;

      if (code === 'ATTENDANCE_LOCKED') {
        toast.error('This date\'s attendance is already saved and locked.', { icon: '🔒', duration: 5000 });
        setIsLocked(true);
      } else if (code === 'INCOMPLETE_ATTENDANCE') {
        const missingIds = err.response?.data?.missingStaff?.map(s => s._id) || [];
        setValidationErrors(missingIds);
        setShowValidationBanner(true);
        toast.error(message || 'Incomplete attendance', { icon: '⚠️', duration: 5000 });
      } else {
        toast.error(message || 'Failed to save attendance');
      }
    } finally {
      setSaving(false);
    }
  };

  const activeStaff = staff.filter(s => s.status === 'Active');
  const markedCount = activeStaff.filter(s => attendanceMap[s._id]).length;
  const totalCount = activeStaff.length;
  const allMarked = markedCount === totalCount && totalCount > 0;

  const attendanceBtn = (staffId, status) => {
    const isActive = attendanceMap[staffId] === status;
    const colors = {
      Present: isActive ? 'bg-emerald-500 text-charcoal shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-emerald-500/20 text-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-400',
      Absent: isActive ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-red-500/20 text-red-500/60 hover:bg-red-500/10 hover:text-red-400',
      Late: isActive ? 'bg-yellow-500 text-charcoal shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-yellow-500/20 text-yellow-500/60 hover:bg-yellow-500/10 hover:text-yellow-400',
    };
    return (
      <button
        onClick={() => handleMark(staffId, status)}
        disabled={isLocked}
        className={`px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${colors[status]} ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >{status}</button>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      {/* Locked Banner */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold">Attendance Locked</p>
            <p className="text-xs text-blue-400/70">Attendance for <strong>{selectedDate}</strong> has been saved and cannot be modified.</p>
          </div>
        </motion.div>
      )}

      {/* Validation Error Banner */}
      <AnimatePresence>
        {showValidationBanner && validationErrors.length > 0 && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-start gap-3 px-5 py-4 rounded-xl bg-crimson/10 border border-crimson/30"
          >
            <div className="w-8 h-8 rounded-full bg-crimson/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-crimson" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-crimson">Attendance Incomplete — {validationErrors.length} employee{validationErrors.length > 1 ? 's' : ''} unmarked</p>
              <p className="text-xs text-crimson/70 mt-1">
                {activeStaff.filter(s => validationErrors.includes(s._id)).map(s => s.name).join(', ')}
              </p>
            </div>
            <button onClick={() => setShowValidationBanner(false)} className="p-1 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-crimson/50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-gold" />
          <input
            type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="bg-charcoal border border-white/10 rounded-xl px-5 py-3 text-soft-white text-base font-bold focus:outline-none focus:border-gold/40 appearance-none"
            style={{ colorScheme: 'dark' }}
          />
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${allMarked ? 'bg-emerald-500' : markedCount > 0 ? 'bg-yellow-500' : 'bg-white/10'}`}
                initial={{ width: 0 }}
                animate={{ width: totalCount > 0 ? `${(markedCount / totalCount) * 100}%` : '0%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className={`text-xs font-bold ${allMarked ? 'text-emerald-400' : 'text-soft-white/40'}`}>
              {markedCount}/{totalCount}
            </span>
            {allMarked && !isLocked && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </motion.span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              exportToPDF({
                filename: `Attendance_${selectedDate}`,
                title: 'Daily Attendance Report',
                subtitle: `Date: ${selectedDate}`,
                columns: ['Name', 'Role', 'Status'],
                data: staff.filter(s => s.status === 'Active').map(s => [s.name, s.role, attendanceMap[s._id] || 'Not Marked'])
              });
            }}
            className="flex items-center gap-2 px-6 py-4 bg-crimson/10 border border-crimson/20 text-crimson rounded-xl text-xs font-bold hover:bg-crimson/20 transition-all shadow-lg"
            title="Export PDF"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => {
              exportToExcel({
                filename: `Attendance_${selectedDate}`,
                sheetName: 'Attendance',
                data: staff.filter(s => s.status === 'Active').map(s => ({
                  Name: s.name,
                  Role: s.role,
                  Status: attendanceMap[s._id] || 'Not Marked'
                }))
              });
            }}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all shadow-lg"
            title="Export Excel"
          >
            <FileText className="w-4 h-4" /> EXCEL
          </button>
          {!isLocked && (
            <button
              onClick={saveAttendance}
              disabled={saving}
              className={`flex items-center gap-2 text-sm px-6 transition-all duration-300 ${
                allMarked
                  ? 'btn-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'btn-gold opacity-70'
              }`}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          )}
          {isLocked && (
            <div className="flex items-center gap-2 text-sm px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-soft-white/40 font-bold cursor-not-allowed">
              <Check className="w-4 h-4" /> Saved & Locked
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1A1A]">
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold rounded-tl-2xl">Staff Member</th>
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold">Role</th>
                <th className="text-center py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold rounded-tr-2xl">Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {activeStaff.map(s => {
                const hasError = validationErrors.includes(s._id);
                return (
                  <motion.tr
                    key={s._id}
                    id={`attendance-row-${s._id}`}
                    animate={hasError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                    transition={hasError ? { duration: 0.4 } : {}}
                    className={`border-b transition-all duration-300 ${
                      hasError
                        ? 'border-crimson/40 bg-crimson/[0.06]'
                        : 'border-white/5 hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-serif italic transition-all duration-300 ${
                          hasError
                            ? 'bg-crimson/10 border-2 border-crimson/40 text-crimson'
                            : 'bg-gold/10 border border-gold/20 text-gold'
                        }`}>
                          {s.name?.charAt(0)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-soft-white">{s.name}</span>
                          {hasError && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                              className="text-[10px] font-bold text-crimson bg-crimson/10 border border-crimson/20 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" /> Not Marked
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-soft-white/50">{s.role}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        {attendanceBtn(s._id, 'Present')}
                        {attendanceBtn(s._id, 'Late')}
                        {attendanceBtn(s._id, 'Absent')}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants} className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-soft-white/40 bg-white/5 p-4 rounded-xl border border-white/5">
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Present</span>
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Late</span>
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Absent</span>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// TAB 5: SALARIES
// ═══════════════════════════════════════════
const SalariesTab = ({ fetchAllStaff }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSalary, setEditingSalary] = useState(null);
  const [salaryForm, setSalaryForm] = useState({ bonus: 0, deductions: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allStaff = await fetchAllStaff();
      setStaff(allStaff);
      setLoading(false);
    };
    load();
  }, []);

  const handleMarkPaid = async (staffId) => {
    try {
      await api.put(`/staff/${staffId}/salary`, { isPaid: true });
      toast.success('Marked as paid!');
      setStaff(prev => prev.map(s => s._id === staffId ? { ...s, salary: { ...s.salary, isPaid: true, paidDate: new Date() } } : s));
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleSaveSalary = async (staffId) => {
    try {
      await api.put(`/staff/${staffId}/salary`, { bonus: Number(salaryForm.bonus), deductions: Number(salaryForm.deductions) });
      toast.success('Salary updated!');
      setStaff(prev => prev.map(s => s._id === staffId ? { ...s, salary: { ...s.salary, bonus: Number(salaryForm.bonus), deductions: Number(salaryForm.deductions) } } : s));
      setEditingSalary(null);
    } catch (err) {
      toast.error('Failed to update salary');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants} className="flex justify-end gap-2">
        <button
          onClick={() => {
            exportToPDF({
              filename: `Salaries_${new Date().toISOString().split('T')[0]}`,
              title: 'Monthly Salary Report',
              subtitle: `Generated on: ${new Date().toLocaleDateString()}`,
              columns: ['Name', 'Base', 'Bonus', 'Deductions', 'Final', 'Status'],
              data: staff.map(s => {
                const base = s.salary?.base || 0;
                const bonus = s.salary?.bonus || 0;
                const deductions = s.salary?.deductions || 0;
                return [
                  s.name,
                  `Rs. ${base.toLocaleString()}`,
                  `+${bonus.toLocaleString()}`,
                  `-${deductions.toLocaleString()}`,
                  `Rs. ${(base + bonus - deductions).toLocaleString()}`,
                  s.salary?.isPaid ? 'Paid' : 'Pending'
                ];
              })
            });
          }}
          className="flex items-center gap-2 px-6 py-4 bg-crimson/10 border border-crimson/20 text-crimson rounded-xl text-xs font-bold hover:bg-crimson/20 transition-all shadow-lg"
          title="Export PDF"
        >
          <Download className="w-4 h-4" /> PDF
        </button>
        <button
          onClick={() => {
            exportToExcel({
              filename: `Salaries_${new Date().toISOString().split('T')[0]}`,
              sheetName: 'Salaries',
              data: staff.map(s => {
                const base = s.salary?.base || 0;
                const bonus = s.salary?.bonus || 0;
                const deductions = s.salary?.deductions || 0;
                return {
                  Name: s.name,
                  Role: s.role,
                  'Base Salary': base,
                  Bonus: bonus,
                  Deductions: deductions,
                  'Final Salary': base + bonus - deductions,
                  Status: s.salary?.isPaid ? 'Paid' : 'Pending'
                };
              })
            });
          }}
          className="flex items-center gap-2 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all shadow-lg"
          title="Export Excel"
        >
          <FileText className="w-4 h-4" /> EXCEL
        </button>
      </motion.div>
      <motion.div variants={itemVariants} className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1A1A]">
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold rounded-tl-2xl">Staff Member</th>
                <th className="text-right py-6 px-4 text-sm font-black uppercase tracking-[0.2em] text-gold">Base</th>
                <th className="text-right py-6 px-4 text-sm font-black uppercase tracking-[0.2em] text-gold">Bonus</th>
                <th className="text-right py-6 px-4 text-sm font-black uppercase tracking-[0.2em] text-gold">Deductions</th>
                <th className="text-right py-6 px-4 text-sm font-black uppercase tracking-[0.2em] text-gold">Final Salary</th>
                <th className="text-center py-6 px-4 text-sm font-black uppercase tracking-[0.2em] text-gold">Status</th>
                <th className="text-right py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => {
                const base = s.salary?.base || 0;
                const bonus = s.salary?.bonus || 0;
                const deductions = s.salary?.deductions || 0;
                const finalSalary = base + bonus - deductions;
                const isEditing = editingSalary === s._id;

                return (
                  <tr key={s._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-bold text-gold font-serif italic">{s.name?.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-soft-white">{s.name}</p>
                          <p className="text-[12px] text-soft-white/40">{s.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4 text-soft-white/70 font-mono">Rs. {base.toLocaleString()}</td>
                    <td className="text-right py-4 px-4">
                      {isEditing ? (
                        <input type="number" value={salaryForm.bonus} onChange={e => setSalaryForm(p => ({ ...p, bonus: e.target.value }))}
                          className="w-20 bg-charcoal border border-gold/30 rounded-lg px-2 py-1 text-right text-emerald-400 text-sm focus:outline-none" />
                      ) : <span className="text-emerald-400 font-mono">+{bonus.toLocaleString()}</span>}
                    </td>
                    <td className="text-right py-4 px-4">
                      {isEditing ? (
                        <input type="number" value={salaryForm.deductions} onChange={e => setSalaryForm(p => ({ ...p, deductions: e.target.value }))}
                          className="w-20 bg-charcoal border border-crimson/30 rounded-lg px-2 py-1 text-right text-crimson text-sm focus:outline-none" />
                      ) : <span className="text-crimson font-mono">-{deductions.toLocaleString()}</span>}
                    </td>
                    <td className="text-right py-4 px-4 text-gold font-bold font-mono">Rs. {finalSalary.toLocaleString()}</td>
                    <td className="text-center py-4 px-4"><StatusBadge status={s.salary?.isPaid ? 'Paid' : 'Pending'} /></td>
                    <td className="text-right py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveSalary(s._id)} className="p-2 hover:bg-white/5 rounded-lg" title="Save"><Check className="w-4 h-4 text-emerald-400" /></button>
                            <button onClick={() => setEditingSalary(null)} className="p-2 hover:bg-white/5 rounded-lg" title="Cancel"><X className="w-4 h-4 text-soft-white/40" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingSalary(s._id); setSalaryForm({ bonus: s.salary?.bonus || 0, deductions: s.salary?.deductions || 0 }); }}
                              className="p-2 hover:bg-white/5 rounded-lg" title="Edit Salary"><Edit3 className="w-4 h-4 text-soft-white/40 hover:text-blue-400" /></button>
                            {!s.salary?.isPaid && (
                              <button onClick={() => handleMarkPaid(s._id)}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-all"
                              >Mark Paid</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Salary formula hint */}
      <motion.div variants={itemVariants} className="text-xs text-soft-white/20 flex items-center gap-2">
        <AlertCircle className="w-3 h-3" />
        <span>Final Salary = Base Salary + Bonus − Deductions</span>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// TAB 6: PERFORMANCE
// ═══════════════════════════════════════════
const PerformanceTab = ({ fetchAllStaff }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allStaff = await fetchAllStaff();
      setStaff(allStaff);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  const ProgressBar = ({ value, max, color = 'bg-gold', label, suffix = '' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-soft-white/50">{label}</span>
          <span className="text-xs font-bold text-soft-white/70">{value}{suffix}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full ${color} rounded-full`}
          />
        </div>
      </div>
    );
  };

  const RatingStars = ({ rating }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-gold fill-gold' : 'text-white/10'}`} />
      ))}
      <span className="text-xs text-soft-white/40 ml-2">{rating}/5</span>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      {staff.length === 0 ? (
        <p className="text-soft-white/30 text-center py-20">No staff data available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map(s => (
            <motion.div key={s._id} variants={itemVariants} className="bg-[#1A1A1A] p-6 rounded-[2rem] border border-white/5 hover:border-gold/20 transition-all duration-500 shadow-2xl group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-sm font-bold text-gold font-serif italic">{s.name?.charAt(0)}</div>
                <div>
                  <p className="font-semibold text-soft-white">{s.name}</p>
                  <p className="text-[12px] text-soft-white/40 font-bold uppercase tracking-wider">{s.role}</p>
                </div>
              </div>

              <div className="space-y-3">
                <RatingStars rating={s.performance?.rating || 0} />

                {(s.role === 'Chef' || s.role === 'Waiter') && (
                  <>
                    <ProgressBar label="Orders Completed" value={s.performance?.ordersCompleted || 0} max={200} color="bg-gold" />
                    <ProgressBar label="Avg Prep Time" value={s.performance?.avgPrepTime || 0} max={60} color="bg-blue-400" suffix=" min" />
                  </>
                )}

                {s.role === 'Rider' && (
                  <>
                    <ProgressBar label="Deliveries Completed" value={s.performance?.deliveriesCompleted || 0} max={200} color="bg-emerald-400" />
                    <ProgressBar label="Avg Delivery Time" value={s.performance?.deliveryTime || 0} max={60} color="bg-orange-400" suffix=" min" />
                  </>
                )}

                {s.role !== 'Chef' && s.role !== 'Rider' && s.role !== 'Waiter' && (
                  <ProgressBar label="Tasks Completed" value={s.performance?.ordersCompleted || 0} max={100} color="bg-purple-400" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// TAB 7: SHIFTS
// ═══════════════════════════════════════════
const ShiftsTab = ({ fetchAllStaff }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftMap, setShiftMap] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allStaff = await fetchAllStaff();
      setStaff(allStaff);

      // Build shift map
      const map = {};
      allStaff.forEach(s => {
        map[s._id] = {};
        DAYS.forEach(day => {
          const record = s.shifts?.find(sh => sh.day === day);
          map[s._id][day] = record?.shift || 'Off';
        });
      });
      setShiftMap(map);
      setLoading(false);
    };
    load();
  }, []);

  const handleShiftChange = (staffId, day, shift) => {
    setShiftMap(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], [day]: shift }
    }));
  };

  const saveShifts = async (staffId) => {
    setSaving(prev => ({ ...prev, [staffId]: true }));
    try {
      const shifts = DAYS.map(day => ({ day, shift: shiftMap[staffId]?.[day] || 'Off' }));
      await api.put(`/staff/${staffId}/shifts`, { shifts });
      toast.success('Shifts updated!');
    } catch (err) {
      toast.error('Failed to update shifts');
    } finally {
      setSaving(prev => ({ ...prev, [staffId]: false }));
    }
  };

  const shiftColors = {
    Morning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Evening: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Night: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Off: 'bg-white/5 text-soft-white/20 border-white/5',
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={itemVariants} className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1A1A]">
                <th className="text-left py-6 px-6 text-sm font-black uppercase tracking-[0.2em] text-gold sticky left-0 bg-[#1A1A1A] z-10 rounded-tl-2xl">Staff Member</th>
                {DAYS.map(d => (
                  <th key={d} className="text-center py-6 px-2 text-sm font-black uppercase tracking-[0.2em] text-gold min-w-[110px]">{d.slice(0, 3)}</th>
                ))}
                <th className="text-center py-6 px-4 text-sm font-black uppercase tracking-[0.2em] text-gold rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.filter(s => s.status === 'Active').map(s => (
                <tr key={s._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 sticky left-0 bg-[#121212]/90 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[10px] font-bold text-gold font-serif italic">{s.name?.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-soft-white text-xs">{s.name}</p>
                        <p className="text-[11px] text-soft-white/40 font-medium">{s.role}</p>
                      </div>
                    </div>
                  </td>
                  {DAYS.map(day => (
                    <td key={day} className="py-3 px-2 text-center">
                      <select
                        value={shiftMap[s._id]?.[day] || 'Off'}
                        onChange={e => handleShiftChange(s._id, day, e.target.value)}
                        className={`w-full text-xs font-bold px-2 py-2 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold/30 appearance-none text-center ${shiftColors[shiftMap[s._id]?.[day] || 'Off']}`}
                        style={{ backgroundColor: '#121212', colorScheme: 'dark' }}
                      >
                        {SHIFTS.map(sh => <option key={sh} value={sh} className="bg-black text-white">{sh}</option>)}
                      </select>
                    </td>
                  ))}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => saveShifts(s._id)}
                      disabled={saving[s._id]}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Save Shifts"
                    >
                      {saving[s._id] ? <RefreshCw className="w-4 h-4 text-gold animate-spin" /> : <Save className="w-4 h-4 text-soft-white/40 hover:text-gold" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 text-xs text-soft-white/30">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Morning</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Evening</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Night</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Off</span>
      </motion.div>
    </motion.div>
  );
};

export default StaffManagement;
