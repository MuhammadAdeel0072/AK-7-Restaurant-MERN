import React, { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    Users,
    Package,
    DollarSign,
    RefreshCcw,
    ChevronDown,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { socket } from '../services/api';
import toast from 'react-hot-toast';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

const ReportManagement = () => {
    const [reportType, setReportType] = useState('sales');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchReportData = async (reset = false) => {
        if (reset) setReportData(null);
        setLoading(true);
        // Do not reset reportData here to avoid flickering during real-time updates

        try {
            const endpoint = `/reports/${reportType === 'daily' ? 'daily-closing' : reportType}`;
            const { data } = await api.get(endpoint, { params: dateRange });
            setReportData(data);
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData(true); // Reset data when reportType changes

        // 📡 Real-time Synchronization Listeners
        const handleLiveUpdate = () => {
            console.log('📡 Real-time update detected. Refreshing intelligence data...');
            fetchReportData(false); // Don't reset for real-time updates
        };

        socket.on('NEW_ORDER', handleLiveUpdate);
        socket.on('adminAction', handleLiveUpdate);
        socket.on('inventoryAlert', handleLiveUpdate);

        return () => {
            socket.off('NEW_ORDER', handleLiveUpdate);
            socket.off('adminAction', handleLiveUpdate);
            socket.off('inventoryAlert', handleLiveUpdate);
        };
    }, [reportType, dateRange.startDate, dateRange.endDate]);

    const handleExport = async (format) => {
        try {
            const endpoint = `/reports/export/${reportType}/${format}`;
            const params = dateRange;

            toast.loading(`Preparing ${format.toUpperCase()} report...`, { id: 'export-toast' });

            const response = await api.get(endpoint, {
                params,
                responseType: 'blob'
            });

            // Extract filename from content-disposition if possible, or generate one
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename=(.+)/);
                if (fileNameMatch) fileName = fileNameMatch[1];
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`${format.toUpperCase()} report downloaded successfully`, { id: 'export-toast' });
        } catch (error) {
            console.error('Export Error:', error);
            toast.error('Export Protocol Jammed: Authorization required or server error', { id: 'export-toast' });
        }
    };

    const tabs = [
        { id: 'sales', name: 'Sales', icon: TrendingUp },
        { id: 'staff', name: 'Staff', icon: Users },
        { id: 'inventory', name: 'Inventory', icon: Package },
        { id: 'finance', name: 'Financial', icon: DollarSign },
        { id: 'daily', name: 'Daily Closing', icon: FileText },
    ];

    const renderContent = () => {
        if (loading) return (
            <div className="flex items-center justify-center py-40">
                <RefreshCcw className="w-10 h-10 text-gold animate-spin" />
            </div>
        );

        if (!reportData) return <div className="text-center py-20 text-soft-white/20 uppercase tracking-widest text-xs">No Data Available</div>;

        switch (reportType) {
            case 'sales':
                return (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <KPI data={reportData.totalSales} label="Total Sales" format="Rs. " color="text-emerald-400" />
                            <KPI data={reportData.orderCount} label="Orders" color="text-gold" />
                            <KPI data={Object.keys(reportData.paymentBreakdown || {}).length} label="Payment Methods" color="text-blue-400" />
                        </div>

                        {/* Payment Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {Object.entries(reportData.paymentBreakdown || {}).map(([method, stats]) => (
                                <div key={method} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-black text-soft-white/30">{method}</p>
                                        <p className="text-sm font-bold text-soft-white">{stats.count} Orders</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-emerald-400">Rs. {stats.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Table
                            headers={['Order ID', 'Date', 'Customer', 'Amount', 'Method', 'Status']}
                            rows={Array.isArray(reportData.orders) ? reportData.orders.map(o => [o.orderNumber, new Date(o.createdAt).toLocaleDateString(), o.customerName || 'Guest', `Rs. ${o.totalPrice}`, o.paymentMethod, o.isPaid ? 'PAID' : 'PENDING']) : []}
                        />
                    </div>
                );
            case 'staff':
                return (
                    <Table
                        headers={['Name', 'Role', 'Orders', 'Value', 'Present', 'Absent', 'Late']}
                        rows={Array.isArray(reportData) ? reportData.map(s => [
                            s.name,
                            s.role?.toUpperCase(),
                            s.ordersCount || 0,
                            `Rs. ${(s.totalValue || 0).toLocaleString()}`,
                            <span className="text-emerald-400">{s.attendance?.Present || 0}</span>,
                            <span className="text-crimson">{s.attendance?.Absent || 0}</span>,
                            <span className="text-gold">{s.attendance?.Late || 0}</span>
                        ]) : []}
                    />
                );
            case 'inventory':
                return (
                    <Table
                        headers={['Item Name', 'In Stock', 'Used Stock', 'Status']}
                        rows={Array.isArray(reportData) ? reportData.map(i => [
                            i.name,
                            i.available,
                            i.used,
                            <span className={i.isLowStock ? 'text-crimson' : 'text-emerald-400'}>{i.status}</span>
                        ]) : []}
                    />
                );
            case 'finance':
                return (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <KPI data={reportData.totalIncome} label="Income" format="Rs. " color="text-emerald-400" />
                            <KPI data={reportData.totalExpenses} label="Expenses" format="Rs. " color="text-crimson" />
                            <KPI data={reportData.netProfit} label="Profit" format="Rs. " color="text-gold" />
                        </div>
                        <Table
                            headers={['Title', 'Category', 'Amount', 'Date']}
                            rows={Array.isArray(reportData.expenseItems) ? reportData.expenseItems.map(e => [e.title, e.category, `Rs. ${e.amount}`, new Date(e.date).toLocaleDateString()]) : []}
                        />
                    </div>
                );
            case 'daily':
                return (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <KPI data={reportData.totalOrders} label="Orders" />
                            <KPI data={reportData.totalSales} label="Sales" format="Rs. " color="text-emerald-400" />
                            <KPI data={reportData.totalExpenses} label="Expenses" format="Rs. " color="text-crimson" />
                            <KPI data={reportData.finalProfit} label="Profit" format="Rs. " color="text-gold" />
                        </div>
                        <Table
                            headers={['Ref Name', 'Amount', 'Type']}
                            rows={[
                                ...(Array.isArray(reportData.orders) ? reportData.orders.map(o => [o.number, `Rs. ${o.amount}`, 'REVENUE']) : []),
                                ...(Array.isArray(reportData.expenses) ? reportData.expenses.map(e => [e.title, `Rs. ${e.amount}`, 'EXPENSE']) : [])
                            ]}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="max-w-6xl mx-auto pt-2 pb-10 px-4 space-y-10"
        >
            {/* Heading - Left Aligned for consistency */}
            <motion.div variants={itemVariants} className="text-left space-y-1">
                <h1 className="text-4xl font-serif font-black tracking-tighter text-soft-white uppercase">REPORTS <span className="text-gold">CENTER</span></h1>
                <p className="text-soft-white/30 text-[10px] font-bold uppercase tracking-[0.4em] ml-1">System Reports</p>
            </motion.div>

            {/* Tab Navigation - Updated to match Staff Management */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setReportType(tab.id)}
                        className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 border ${reportType === tab.id
                            ? 'bg-gold/10 text-gold border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                            : 'text-soft-white/50 border-white/5 hover:bg-white/5 hover:text-soft-white/80'
                            }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </motion.div>

            {/* Simple Actions Row */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4 flex-wrap">
                    <button
                        onClick={() => setDateRange({ startDate: '', endDate: '' })}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${!dateRange.startDate && !dateRange.endDate ? 'bg-gold/10 text-gold border-gold/20' : 'border-white/10 text-soft-white/40 hover:border-gold/30 hover:text-gold'}`}
                    >
                        All Time
                    </button>

                    <div className="h-4 w-px bg-white/10 hidden md:block" />

                    <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-white" />
                        <input
                            type="date"
                            className="bg-transparent text-xs text-soft-white border-b border-white/10 py-1 outline-none focus:border-gold transition-colors [color-scheme:dark]"
                            value={dateRange.startDate}
                            onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                    </div>
                    <span className="text-soft-white/20 text-xs">to</span>
                    <input
                        type="date"
                        className="bg-transparent text-xs text-soft-white border-b border-white/10 py-1 outline-none focus:border-gold transition-colors [color-scheme:dark]"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-6 py-3 bg-crimson/10 border border-crimson/20 text-crimson rounded-xl text-xs font-bold hover:bg-crimson/20 transition-all"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all"
                    >
                        <FileText className="w-4 h-4" /> EXCEL
                    </button>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                {renderContent()}
            </div>
        </motion.div>
    );
};

// Reusable KPI Component (Simple & Large)
const KPI = ({ data, label, format = '', color = 'text-soft-white' }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/5">
        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-soft-white/30 mb-2">{label}</p>
        <h3 className={`text-4xl font-sans font-bold ${color}`}>
            {format}{data?.toLocaleString() || '0'}
        </h3>
    </div>
);

const Table = ({ headers, rows }) => {
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(10);
    
    React.useEffect(() => {
        setPage(1);
    }, [rows.length, limit]);

    const totalRecords = rows.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const currentRows = rows.slice((page - 1) * limit, page * limit);

    return (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-max border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-[#1A1A1A]">
                            {headers.map((h, i) => {
                                const hLower = String(h).toLowerCase();
                                const isPrimary = hLower.includes('name') || hLower.includes('title') || hLower.includes('customer') || hLower.includes('item');
                                return (
                                    <th 
                                        key={i} 
                                        className={`text-left py-6 px-8 text-sm font-black uppercase tracking-[0.2em] text-gold border-b border-white/5 ${i === 0 ? 'rounded-tl-2xl' : ''} ${i === headers.length - 1 ? 'rounded-tr-2xl' : ''} ${!isPrimary ? 'whitespace-nowrap' : 'min-w-[150px]'}`}
                                    >
                                        {h}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {currentRows.map((row, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                {row.map((cell, j) => {
                                    const hLower = String(headers[j] || '').toLowerCase();
                                    const isPrimary = hLower.includes('name') || hLower.includes('title') || hLower.includes('customer') || hLower.includes('item');
                                    return (
                                        <td key={j} className={`px-8 py-6 text-[13px] font-medium text-soft-white group-hover:text-gold transition-colors ${!isPrimary ? 'whitespace-nowrap' : 'break-words min-w-[150px] leading-relaxed'}`}>
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {currentRows.length === 0 && (
                            <tr>
                                <td colSpan={headers.length} className="px-8 py-16 text-center text-xs uppercase font-black tracking-[0.3em] text-soft-white/10">No data found in selected range</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalRecords > 0 && (
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
                        Showing {Math.min((page - 1) * limit + 1, totalRecords)}–{Math.min(page * limit, totalRecords)} of <span className="text-white">{totalRecords}</span> entries
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
            )}
        </div>
    );
};

export default ReportManagement;
