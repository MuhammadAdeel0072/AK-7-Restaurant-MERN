const asyncHandler = require('express-async-handler');
const Reservation = require('../models/Reservation');

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = asyncHandler(async (req, res) => {
  const { 
    reservationDate, 
    reservationTime, 
    numberOfGuests, 
    specialRequests, 
    occasion, 
    phone, 
    paymentMethod,
    paymentReference 
  } = req.body;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);
  
  const resDate = new Date(reservationDate);

  if (resDate < today) {
    res.status(400);
    throw new Error('You cannot book for a past date');
  }

  if (resDate > maxDate) {
    res.status(400);
    throw new Error('You can only book for the next 7 days');
  }

  const reservation = new Reservation({
    user: req.user._id,
    reservationDate,
    reservationTime,
    numberOfGuests,
    specialRequests,
    occasion,
    phone,
    paymentMethod,
    paymentReference,
    paymentStatus: paymentReference ? 'Paid' : 'Pending',
    status: 'Pending',
    advanceAmount: 1000
  });

  const createdReservation = await reservation.save();
  res.status(201).json(createdReservation);
});

// @desc    Get my reservations
// @route   GET /api/reservations/my
// @access  Private
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id });
  res.json(reservations);
});

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private/Staff
const getReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({}).populate('user', 'firstName lastName');
  res.json(reservations);
});

// @desc    Update reservation status
// @route   PUT /api/reservations/:id/status
// @access  Private/Staff
const updateReservationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const reservation = await Reservation.findById(req.params.id);

  if (reservation) {
    reservation.status = status;
    const updatedReservation = await reservation.save();
    res.json(updatedReservation);
  } else {
    res.status(404);
    throw new Error('Reservation not found');
  }
});

module.exports = {
  createReservation,
  getMyReservations,
  getReservations,
  updateReservationStatus,
};
