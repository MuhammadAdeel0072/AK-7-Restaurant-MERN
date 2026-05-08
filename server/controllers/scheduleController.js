const RestaurantSchedule = require('../models/RestaurantSchedule');
const asyncHandler = require('express-async-handler');

// @desc    Get full weekly schedule
// @route   GET /api/schedule
// @access  Public
const getSchedule = asyncHandler(async (req, res) => {
    let schedule = await RestaurantSchedule.find({}).sort({ _id: 1 });
    
    // Seed if empty
    if (schedule.length === 0) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const seed = days.map(day => ({
            day,
            isOpen: !['Saturday', 'Sunday'].includes(day),
            openTime: '17:00',
            closeTime: '02:00'
        }));
        schedule = await RestaurantSchedule.insertMany(seed);
    }
    
    res.json(schedule);
});

// @desc    Update single day schedule
// @route   PUT /api/schedule/:id
// @access  Private/Admin
const updateDaySchedule = asyncHandler(async (req, res) => {
    const { isOpen, openTime, closeTime } = req.body;
    const schedule = await RestaurantSchedule.findById(req.params.id);

    if (schedule) {
        if (isOpen !== undefined) schedule.isOpen = isOpen;
        if (openTime) schedule.openTime = openTime;
        if (closeTime) schedule.closeTime = closeTime;

        // Validation: at least one day must be open
        if (isOpen === false) {
            const openDaysCount = await RestaurantSchedule.countDocuments({ isOpen: true, _id: { $ne: schedule._id } });
            if (openDaysCount === 0) {
                res.status(400);
                throw new Error('At least one day must remain open');
            }
        }

        const updated = await schedule.save();
        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Schedule not found');
    }
});

// @desc    Bulk update schedule
// @route   PUT /api/schedule
// @access  Private/Admin
const updateFullSchedule = asyncHandler(async (req, res) => {
    const { weeklySchedule } = req.body; // Array of day objects

    if (!weeklySchedule || !Array.isArray(weeklySchedule)) {
        res.status(400);
        throw new Error('Invalid schedule data');
    }

    // Validation: at least one day must be open
    const hasOpenDay = weeklySchedule.some(d => d.isOpen);
    if (!hasOpenDay) {
        res.status(400);
        throw new Error('At least one day must remain open');
    }

    const updates = weeklySchedule.map(async (dayData) => {
        return RestaurantSchedule.findOneAndUpdate(
            { day: dayData.day },
            { 
                isOpen: dayData.isOpen,
                openTime: dayData.openTime,
                closeTime: dayData.closeTime
            },
            { new: true, upsert: true }
        );
    });

    const results = await Promise.all(updates);
    res.json(results);
});

module.exports = {
    getSchedule,
    updateDaySchedule,
    updateFullSchedule
};
