const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
    getSchedule,
    updateDaySchedule,
    updateFullSchedule
} = require('../controllers/scheduleController');

router.route('/')
    .get(getSchedule)
    .put(protect, admin, updateFullSchedule);

router.route('/:id')
    .put(protect, admin, updateDaySchedule);

module.exports = router;
