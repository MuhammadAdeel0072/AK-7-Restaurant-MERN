const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getReservations,
  updateReservationStatus,
  clearOutdatedReservations,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.route('/outdated')
  .delete(protect, admin, clearOutdatedReservations);

router.route('/')
  .post(protect, createReservation)
  .get(protect, admin, getReservations);

router.route('/my')
  .get(protect, getMyReservations);

router.route('/:id/status')
  .put(protect, admin, updateReservationStatus);

module.exports = router;
