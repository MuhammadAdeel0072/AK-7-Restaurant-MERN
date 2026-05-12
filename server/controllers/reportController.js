const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Staff = require('../models/Staff');
const { generatePDFReport, generateExcelReport } = require('../services/reportService');

// Helper to get date range
const getDateQuery = (startDate, endDate) => {
    let query = {};
    if (!startDate && !endDate) return query; // Return all for Lifetime view

    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
    }
    return query;
};

// @desc    Get Sales Report
// @route   GET /api/reports/sales
const getSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateQuery = getDateQuery(startDate, endDate);

    const orders = await Order.find(dateQuery).sort('-createdAt');

    // Align with Dashboard: Sum (totalPrice - taxPrice) for paid orders
    const totalSales = orders.reduce((acc, order) => {
        if (!order.isPaid) return acc;
        const tax = order.taxPrice || 0;
        return acc + (order.totalPrice - tax);
    }, 0);
    const orderCount = orders.length;

    // Group by Payment Method (Categorized into Cash/Online/Card)
    const paymentBreakdown = orders.reduce((acc, order) => {
        let method = order.paymentMethod || 'Unknown';
        
        // Categorization logic
        let category = 'Online'; // Default
        const m = method.toLowerCase();
        if (m.includes('cash') || m.includes('cod')) category = 'Cash';
        else if (m.includes('card') || m.includes('stripe') || m.includes('visa') || m.includes('mastercard')) category = 'Card';
        else if (m.includes('easypaisa') || m.includes('jazzcash') || m.includes('bank') || m.includes('online')) category = 'Online';

        if (!acc[category]) acc[category] = { count: 0, total: 0 };
        acc[category].count += 1;
        if (order.isPaid) {
            acc[category].total += (order.totalPrice - (order.taxPrice || 0));
        }
        return acc;
    }, { 'Cash': { count: 0, total: 0 }, 'Online': { count: 0, total: 0 }, 'Card': { count: 0, total: 0 } });

    res.json({
        totalSales,
        orderCount,
        paymentBreakdown,
        orders: orders.map(o => ({
            id: o._id,
            orderNumber: o.orderNumber,
            customerName: o.shippingAddress?.fullName || 'Guest',
            totalPrice: o.totalPrice,
            paymentMethod: o.paymentMethod,
            isPaid: o.isPaid,
            createdAt: o.createdAt
        }))
    });
});

// @desc    Get Staff Report
// @route   GET /api/reports/staff
const getStaffReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateQuery = getDateQuery(startDate, endDate);

    const staffList = await User.find({ role: { $in: ['chef', 'rider'] } }).select('firstName lastName email role');
    const orders = await Order.find(dateQuery);
    const staffDetails = await Staff.find({ email: { $in: staffList.map(s => s.email) } });

    const staffPerformance = staffList.map(member => {
        const handledOrders = orders.filter(o => 
            (o.rider && o.rider.toString() === member._id.toString()) || 
            (o.chef && o.chef.toString() === member._id.toString())
        );
        
        const staffRecord = staffDetails.find(s => s.email === member.email);
        const attendance = staffRecord?.attendance || [];
        
        // Filter attendance by range
        const filteredAttendance = attendance.filter(a => {
            if (!startDate && !endDate) return true;
            const d = new Date(a.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);
            return (!start || d >= start) && (!end || d <= end);
        });

        const attendanceStats = filteredAttendance.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            acc.total += 1;
            return acc;
        }, { Present: 0, Absent: 0, Late: 0, total: 0 });

        return {
            id: member._id,
            name: `${member.firstName} ${member.lastName}`,
            role: member.role,
            ordersCount: handledOrders.length,
            totalValue: handledOrders.reduce((acc, o) => acc + o.totalPrice, 0),
            attendance: attendanceStats
        };
    });

    res.json(staffPerformance);
});

// @desc    Get Inventory Report
// @route   GET /api/reports/inventory
const getInventoryReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateQuery = getDateQuery(startDate, endDate);
    
    const products = await Product.find({}).sort('name');
    const orders = await Order.find(dateQuery);

    const inventoryData = products.map(p => {
        // Calculate used stock (sold quantity) in range
        const usedStock = orders.reduce((acc, order) => {
            const item = order.orderItems.find(i => i.product.toString() === p._id.toString());
            return acc + (item ? item.qty : 0);
        }, 0);

        return {
            id: p._id,
            name: p.name,
            available: p.countInStock,
            used: usedStock,
            lowStockThreshold: p.lowStockThreshold || 10,
            isLowStock: p.countInStock <= (p.lowStockThreshold || 10),
            status: p.countInStock === 0 ? 'Out of Stock' : (p.countInStock <= (p.lowStockThreshold || 10) ? 'Low Stock' : 'Available')
        };
    });

    res.json(inventoryData);
});

// @desc    Get Financial Report
// @route   GET /api/reports/finance
const getFinancialReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateQuery = getDateQuery(startDate, endDate);

    const orders = await Order.find({ ...dateQuery, isPaid: true });
    const expenses = await Expense.find(dateQuery).sort('-date');

    const totalIncome = orders.reduce((acc, o) => acc + (Number(o.totalPrice || 0) - Number(o.taxPrice || 0)), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Group expenses by category for better insights
    const expenseBreakdown = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
        return acc;
    }, {});

    res.json({
        totalIncome,
        totalExpenses,
        netProfit,
        expenseBreakdown,
        incomeData: orders.map(o => ({ id: o._id, amount: o.totalPrice, date: o.createdAt })),
        expenseItems: expenses.map(e => ({
            id: e._id,
            title: e.title,
            amount: e.amount,
            category: e.category,
            date: e.date || e.createdAt
        }))
    });
});

// @desc    Get Daily Closing Report
// @route   GET /api/reports/daily-closing
const getDailyClosingReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, date } = req.query;
    
    let query = {};
    if (date) {
        const d = new Date(date);
        const start = new Date(d); start.setHours(0,0,0,0);
        const end = new Date(d); end.setHours(23,59,59,999);
        query = { createdAt: { $gte: start, $lte: end } };
    } else {
        query = getDateQuery(startDate, endDate);
    }

    const orders = await Order.find(query);
    const expenses = await Expense.find(query);

    const dailyRevenue = orders.reduce((acc, o) => {
        if (!o.isPaid) return acc;
        return acc + (Number(o.totalPrice || 0) - Number(o.taxPrice || 0));
    }, 0);
    const dailyExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    res.json({
        period: date ? date : `${startDate || 'Start'} to ${endDate || 'End'}`,
        totalOrders: orders.length,
        totalSales: dailyRevenue,
        totalExpenses: dailyExpenses,
        finalProfit: dailyRevenue - dailyExpenses,
        orders: orders.map(o => ({ 
            id: o._id, 
            number: o.orderNumber, 
            amount: o.totalPrice, 
            status: o.isPaid ? 'PAID' : 'PENDING' 
        })),
        expenses: expenses.map(e => ({ 
            title: e.title, 
            amount: e.amount, 
            category: e.category 
        }))
    });
});

// @desc    Export Reports
// @route   GET /api/reports/export/:type/:format
const exportReport = asyncHandler(async (req, res) => {
    const { type, format } = req.params;
    const { startDate, endDate, date } = req.query;
    
    let data = [];
    let headers = [];
    let title = "";

    if (type === 'sales') {
        const query = getDateQuery(startDate, endDate);
        const orders = await Order.find(query).sort('-createdAt');
        title = "Sales Report";
        headers = ["Order #", "Date", "Customer", "Amount", "Method", "Status"];
        data = orders.map(o => [
            o.orderNumber, 
            new Date(o.createdAt).toLocaleDateString(), 
            o.shippingAddress.fullName || 'Guest', 
            `Rs. ${o.totalPrice}`, 
            o.paymentMethod, 
            o.status
        ]);
    } else if (type === 'staff') {
        const query = getDateQuery(startDate, endDate);
        const staffList = await User.find({ role: { $in: ['chef', 'rider'] } });
        const orders = await Order.find(query);
        const staffDetails = await Staff.find({ email: { $in: staffList.map(s => s.email) } });

        title = "Staff Performance Report";
        headers = ["Staff Name", "Role", "Orders Handled", "Total Value", "Atten. (P/A/L)"];
        data = staffList.map(member => {
            const handled = orders.filter(o => 
                (o.rider && o.rider.toString() === member._id.toString()) || 
                (o.chef && o.chef.toString() === member._id.toString())
            );
            
            const staffRecord = staffDetails.find(s => s.email === member.email);
            const attendance = staffRecord?.attendance || [];
            const stats = attendance.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, { Present: 0, Absent: 0, Late: 0 });

            return [
                `${member.firstName} ${member.lastName}`, 
                member.role.toUpperCase(), 
                handled.length, 
                `Rs. ${handled.reduce((acc, o) => acc + o.totalPrice, 0)}`,
                `${stats.Present}/${stats.Absent}/${stats.Late}`
            ];
        });
    } else if (type === 'inventory') {
        const query = getDateQuery(startDate, endDate);
        const products = await Product.find({});
        const orders = await Order.find(query);

        title = "Inventory Report";
        headers = ["Product Name", "Available Stock", "Used Stock", "Status"];
        data = products.map(p => {
            const used = orders.reduce((acc, order) => {
                const item = order.orderItems.find(i => i.product.toString() === p._id.toString());
                return acc + (item ? item.qty : 0);
            }, 0);

            return [
                p.name, 
                p.countInStock, 
                used,
                p.countInStock <= (p.lowStockThreshold || 10) ? 'LOW STOCK' : 'AVAILABLE'
            ];
        });
    } else if (type === 'finance') {
        const query = getDateQuery(startDate, endDate);
        const orders = await Order.find({ ...query, isPaid: true });
        const expenses = await Expense.find(query);
        title = "Financial Ledger Report";
        headers = ["Category", "Description", "Value"];
        const income = orders.reduce((acc, o) => acc + (o.totalPrice - (o.taxPrice || 0)), 0);
        const expense = expenses.reduce((acc, e) => acc + e.amount, 0);
        data = [
            ["Total Income", "Revenue (excluding tax)", `Rs. ${income.toLocaleString()}`],
            ["Total Expenses", "Logged business costs", `Rs. ${expense.toLocaleString()}`],
            ["Net Profit", "Final operational margin", `Rs. ${(income - expense).toLocaleString()}`]
        ];
    } else if (type === 'daily') {
        const d = date ? new Date(date) : new Date();
        const start = new Date(d); start.setHours(0,0,0,0);
        const end = new Date(d); end.setHours(23,59,59,999);
        const orders = await Order.find({ createdAt: { $gte: start, $lte: end } });
        const expenses = await Expense.find({ createdAt: { $gte: start, $lte: end } });
        title = `Daily Closing - ${start.toLocaleDateString()}`;
        headers = ["Category", "Description", "Value"];
        const income = orders.reduce((acc, o) => acc + (o.isPaid ? (o.totalPrice - (o.taxPrice || 0)) : 0), 0);
        const expense = expenses.reduce((acc, e) => acc + e.amount, 0);
        data = [
            ["Total Orders", orders.length, ""],
            ["Daily Sales", "Revenue (excluding tax)", `Rs. ${income.toLocaleString()}`],
            ["Daily Expenses", "Business costs today", `Rs. ${expense.toLocaleString()}`],
            ["Final Profit", "Daily liquidity change", `Rs. ${(income - expense).toLocaleString()}`]
        ];
    }

    if (format === 'pdf') {
        generatePDFReport(res, title, headers, data);
    } else {
        await generateExcelReport(res, title, headers, data);
    }
});

module.exports = {
    getSalesReport,
    getStaffReport,
    getInventoryReport,
    getFinancialReport,
    getDailyClosingReport,
    exportReport
};
