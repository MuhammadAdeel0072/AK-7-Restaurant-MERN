const Staff = require('../models/Staff');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { emitEvent } = require('../services/socketService');
const { sendOTPEmail } = require('../services/emailService');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private/Admin
const getAllStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;

    let query = { isDeleted: { $ne: true } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const total = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      staff,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get staff dashboard stats
// @route   GET /api/staff/dashboard/stats
// @access  Private/Admin
const getStaffStats = async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments({ isDeleted: { $ne: true } });
    const activeStaff = await Staff.countDocuments({ isDeleted: { $ne: true }, status: 'Active' });
    const onLeave = await Staff.countDocuments({ isDeleted: { $ne: true }, status: 'On Leave' });
    
    // Calculate attendance for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const presentToday = await Staff.countDocuments({
      isDeleted: { $ne: true },
      attendance: {
        $elemMatch: {
          date: { $gte: todayStart, $lte: todayEnd },
          status: 'Present'
        }
      }
    });

    const absentToday = await Staff.countDocuments({
      isDeleted: { $ne: true },
      attendance: {
        $elemMatch: {
          date: { $gte: todayStart, $lte: todayEnd },
          status: 'Absent'
        }
      }
    });

    const pendingSalaries = await Staff.countDocuments({
      isDeleted: { $ne: true },
      'salary.isPaid': false
    });

    // 4. Role Distribution Aggregation
    const roleDistribution = await Staff.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // 5. Attendance Overview (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const attendanceRecords = await Staff.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: '$attendance' },
      { $match: { 'attendance.date': { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$attendance.date' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$attendance.date' } },
            status: '$attendance.status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format attendance overview for Recharts
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const attendanceOverviewMap = {};

    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      attendanceOverviewMap[dateStr] = {
        day: days[d.getDay()],
        present: 0,
        late: 0,
        absent: 0
      };
    }

    attendanceRecords.forEach(rec => {
      const dateStr = rec._id.date;
      if (attendanceOverviewMap[dateStr]) {
        const status = rec._id.status.toLowerCase();
        if (status === 'present') attendanceOverviewMap[dateStr].present = rec.count;
        if (status === 'late') attendanceOverviewMap[dateStr].late = rec.count;
        if (status === 'absent') attendanceOverviewMap[dateStr].absent = rec.count;
      }
    });

    const attendanceOverview = Object.values(attendanceOverviewMap).reverse();

    res.json({
      totalStaff,
      activeStaff,
      onLeave,
      presentToday,
      absentToday,
      pendingSalaries,
      roleDistribution,
      attendanceOverview,
      attendanceRate: totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new staff member with unified onboarding
// @route   POST /api/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, role, salary, status, joiningDate, shifts } = req.body;

    // 1. Check if email already exists in Staff records
    const staffExists = await Staff.findOne({ email, isDeleted: { $ne: true } });
    if (staffExists) {
      return res.status(400).json({ message: 'A staff member with this email already exists' });
    }

    // 2. Check if a User account already exists with this email
    let user = await User.findOne({ email: email.toLowerCase() });
    let requiresOnboarding = false;

    if (user) {
      // Existing user: Link role and update status
      user.role = role.toLowerCase();
      user.isOnboarded = true; // They already have an account
      user.isActive = true;
      await user.save();
      console.log(`🔗 Existing user ${email} linked to staff role: ${role}`);
    } else {
      // New user: Create pending account and send OTP
      user = await User.create({
        firstName: name.split(' ')[0] || 'Staff',
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email.toLowerCase(),
        phone: phone,
        role: role.toLowerCase(),
        isOnboarded: false,
        isActive: false
      });
      
      requiresOnboarding = true;
      
      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await OTP.deleteMany({ email: email.toLowerCase() });
      await OTP.create({
        email: email.toLowerCase(),
        otp: otpCode
      });

      // Send OTP (Mock/Email fallback)
      await sendOTPEmail(email.toLowerCase(), otpCode);
      console.log(`\n📩 [ONBOARDING OTP] Sent to ${email}: ${otpCode}\n`);
    }

    // 3. Create the Staff management record
    const staffMember = await Staff.create({
      name,
      email: email.toLowerCase(),
      phone,
      role,
      salary: { base: salary || 0, bonus: 0, deductions: 0, isPaid: false },
      status: status || 'Active',
      joiningDate: joiningDate || new Date(),
      shifts: shifts || [],
      attendance: [],
      performance: { ordersCompleted: 0, avgPrepTime: 0, deliveryTime: 0, deliveriesCompleted: 0, rating: 0 }
    });

    emitEvent('admin', 'staffUpdate', { type: 'created', staff: staffMember });

    res.status(201).json({
      success: true,
      message: requiresOnboarding 
        ? 'Staff created. OTP sent to phone number for onboarding.' 
        : 'Existing account linked successfully. Staff can login normally.',
      staff: staffMember,
      requiresOnboarding
    });
  } catch (error) {
    console.error('❌ Create Staff Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET /staff/:id — Get single staff profile
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /staff/:id — Update staff member
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    const { name, email, phone, role, status, joiningDate } = req.body;
    if (name) staff.name = name;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    if (role) staff.role = role;
    if (status) {
      const oldStatus = staff.status;
      staff.status = status;
      if (oldStatus !== status) {
        emitEvent('admin', 'staffStatusChange', { staffId: staff._id, name: staff.name, oldStatus, newStatus: status });
      }
    }
    if (joiningDate) staff.joiningDate = joiningDate;

    await staff.save();
    emitEvent('admin', 'staffUpdate', { type: 'updated', staff });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /staff/:id — Soft delete
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    staff.isDeleted = true;
    await staff.save();

    emitEvent('admin', 'staffUpdate', { type: 'deleted', staffId: staff._id, name: staff.name });

    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /staff/:id/attendance — Mark attendance
const markAttendance = async (req, res) => {
  try {
    const { date, status } = req.body;
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this date
    const existingIdx = staff.attendance.findIndex(a => {
      const aDate = new Date(a.date);
      aDate.setHours(0, 0, 0, 0);
      return aDate.getTime() === attendanceDate.getTime();
    });

    if (existingIdx >= 0) {
      staff.attendance[existingIdx].status = status;
    } else {
      staff.attendance.push({ date: attendanceDate, status });
    }

    await staff.save();
    emitEvent('admin', 'staffAttendanceUpdate', { staffId: staff._id, name: staff.name, date, status });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /staff/attendance/bulk — Bulk mark attendance
const bulkMarkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records = [{ staffId, status }]
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(date);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    // Get all active staff
    const activeStaff = await Staff.find({ isDeleted: { $ne: true }, status: 'Active' });

    // Check if attendance for this date is already saved (locked)
    const alreadySaved = activeStaff.some(s =>
      s.attendance.some(a => {
        const aDate = new Date(a.date);
        aDate.setHours(0, 0, 0, 0);
        return aDate.getTime() === attendanceDate.getTime();
      })
    );
    if (alreadySaved) {
      return res.status(400).json({
        message: 'Attendance for this date has already been saved and cannot be modified.',
        code: 'ATTENDANCE_LOCKED'
      });
    }

    // Validate all active staff are included
    const submittedIds = new Set(records.map(r => r.staffId));
    const missingStaff = activeStaff.filter(s => !submittedIds.has(s._id.toString()));
    if (missingStaff.length > 0) {
      return res.status(400).json({
        message: `Attendance is missing for ${missingStaff.length} employee(s): ${missingStaff.map(s => s.name).join(', ')}`,
        code: 'INCOMPLETE_ATTENDANCE',
        missingStaff: missingStaff.map(s => ({ _id: s._id, name: s.name }))
      });
    }

    const results = [];
    for (const record of records) {
      const staff = await Staff.findOne({ _id: record.staffId, isDeleted: { $ne: true } });
      if (!staff) continue;

      staff.attendance.push({ date: attendanceDate, status: record.status });
      await staff.save();
      results.push({ staffId: staff._id, name: staff.name, status: record.status });
    }

    emitEvent('admin', 'staffAttendanceUpdate', { date, records: results });

    res.json({ message: 'Attendance marked successfully', results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /staff/:id/attendance — Get attendance records
const getAttendance = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    res.json(staff.attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /staff/:id/salary — Update salary
const updateSalary = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    const { base, bonus, deductions, isPaid } = req.body;
    if (base !== undefined) staff.salary.base = base;
    if (bonus !== undefined) staff.salary.bonus = bonus;
    if (deductions !== undefined) staff.salary.deductions = deductions;
    if (isPaid !== undefined) {
      staff.salary.isPaid = isPaid;
      if (isPaid) staff.salary.paidDate = new Date();
    }

    await staff.save();
    emitEvent('admin', 'staffUpdate', { type: 'salaryUpdated', staff });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /staff/:id/shifts — Update shifts
const updateShifts = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    staff.shifts = req.body.shifts;
    await staff.save();

    emitEvent('admin', 'staffUpdate', { type: 'shiftsUpdated', staff });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /staff/:id/performance — Update performance
const updatePerformance = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    const { ordersCompleted, avgPrepTime, deliveryTime, deliveriesCompleted, rating } = req.body;
    if (ordersCompleted !== undefined) staff.performance.ordersCompleted = ordersCompleted;
    if (avgPrepTime !== undefined) staff.performance.avgPrepTime = avgPrepTime;
    if (deliveryTime !== undefined) staff.performance.deliveryTime = deliveryTime;
    if (deliveriesCompleted !== undefined) staff.performance.deliveriesCompleted = deliveriesCompleted;
    if (rating !== undefined) staff.performance.rating = rating;

    await staff.save();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStaffStats,
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  markAttendance,
  bulkMarkAttendance,
  getAttendance,
  updateSalary,
  updateShifts,
  updatePerformance
};
