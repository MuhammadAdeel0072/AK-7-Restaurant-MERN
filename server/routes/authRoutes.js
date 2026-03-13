const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/authMiddleware');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter-2d0').Strategy;

// Passport Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0].value,
                googleId: profile.id
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
  }
));

// OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    generateToken(res, req.user._id);
    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
});

// OTP Implementation (Simplified for now, using console for verification)
router.post('/otp/send', async (req, res) => {
    const { email } = req.body;
    // In a real app, generate OTP, save to DB with expiry, and send via email
    console.log(`Sending Magic Link/OTP to ${email}`);
    res.json({ message: 'OTP sent successfully' });
});

router.post('/otp/verify', async (req, res) => {
    const { email, code } = req.body;
    // In a real app, verify code from DB
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({ name: email.split('@')[0], email });
    }
    generateToken(res, user._id);
    res.json({ _id: user._id, name: user.name, email: user.email });
});

router.post('/logout', (req, res) => {
    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
