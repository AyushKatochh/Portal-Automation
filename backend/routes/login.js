const express = require('express');
const router = express.Router();
const Admin = require('../models/admin'); // Update the path as necessary



// Routes

// Admin Login
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (admin.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ id: admin._id, username: admin.userName, name:admin.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
