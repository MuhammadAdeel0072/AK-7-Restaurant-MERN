const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const User = require('../models/User');

// Clerk Webhook Secret from dashboard
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!WEBHOOK_SECRET) {
        console.error('CLERK_WEBHOOK_SECRET is missing');
        return res.status(500).json({ message: 'Server configuration error' });
    }

    const headers = req.headers;
    const payload = req.body;

    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ message: 'Error occured -- no svix headers' });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error('Error verifying webhook:', err.message);
        return res.status(400).json({ message: 'Verification failed' });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses[0].email_address;

        try {
            await User.findOneAndUpdate(
                { clerkId: id },
                {
                    clerkId: id,
                    firstName: first_name,
                    lastName: last_name,
                    email,
                    avatar: image_url,
                },
                { upsert: true, new: true }
            );
            console.log(`User ${id} synced successfully`);
        } catch (err) {
            console.error('Error syncing user:', err.message);
            return res.status(500).json({ message: 'Sync failed' });
        }
    }

    if (eventType === 'user.deleted') {
        try {
            await User.findOneAndDelete({ clerkId: id });
            console.log(`User ${id} deleted successfully`);
        } catch (err) {
            console.error('Error deleting user:', err.message);
            return res.status(500).json({ message: 'Delete failed' });
        }
    }

    res.status(200).json({ message: 'Webhook received' });
});

module.exports = router;
