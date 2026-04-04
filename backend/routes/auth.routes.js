const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const StudentProfile = require('../models/studentProfile.model');
const CounsellorProgress = require('../models/counsellorProgress.model');
const Todo = require('../models/todo.model');
const UserUniversity = require('../models/userUniversity.model');
const authMiddleware = require('../middleware/auth.middleware');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Add In-Memory OTP Store for global validation
const otpStore = new Map();

// Strict Email Validation Helper
const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const disposableDomains = [
    'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 
    'yopmail.com', 'throwawaymail.com', 'sharklasers.com', 'trashmail.com'
];

function validateEmailSecure(email) {
    if (!email) return { valid: false, message: 'Email is required.' };
    if (!emailRegex.test(email)) return { valid: false, message: 'Invalid email format. Please specify a structurally accurate email address.' };
    
    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(domain)) return { valid: false, message: 'Disposable or temporary email providers are strictly prohibited.' };
    
    return { valid: true };
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password, otpCode } = req.body;

        // Validation
        if (!fullName || !email || !password || !otpCode) {
            return res.status(400).json({ message: 'All fields, including verification code, are required.' });
        }

        const emailCheck = validateEmailSecure(email);
        if (!emailCheck.valid) {
            return res.status(400).json({ message: emailCheck.message });
        }

        const formattedEmail = email.toLowerCase();
        const entry = otpStore.get(formattedEmail);

        if (!entry || entry.code !== otpCode || Date.now() > entry.expiresAt) {
            return res.status(401).json({ message: 'Your email verification code is invalid or has expired.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: formattedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'A verified account with this email already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            fullName,
            email: formattedEmail,
            password: hashedPassword,
            onboardingCompleted: false,
            currentStage: 'profile_building'
        });

        await newUser.save();
        
        // Wipe OTP entry securely post-verification
        otpStore.delete(formattedEmail);

        // Create token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                onboardingCompleted: newUser.onboardingCompleted,
                currentStage: newUser.currentStage
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                onboardingCompleted: user.onboardingCompleted,
                currentStage: user.currentStage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.headers.authorization?.replace('Bearer ', '') ||
                     req.body.token ||
                     req.query.token;

        if (!token) {
            return res.status(401).json({ message: 'No token provided.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                onboardingCompleted: user.onboardingCompleted,
                currentStage: user.currentStage
            }
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
});

// POST /api/auth/otp/send
router.post('/otp/send', async (req, res) => {
    try {
        const { email, action } = req.body;
        
        const emailCheck = validateEmailSecure(email);
        if (!emailCheck.valid) {
            return res.status(400).json({ message: emailCheck.message });
        }

        const formattedEmail = email.toLowerCase();
        let user = await User.findOne({ email: formattedEmail });
        
        // Guard against duplicate accounts triggering signup OTP texts!
        if (user && action === 'signup') {
            return res.status(409).json({ message: 'Account already exists. Redirecting to login...' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(formattedEmail, { code, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes

        // Dispatch Email via Live HTTP OR fallback to logs
        if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('INSERT')) {
            const htmlPayload = `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 500px; margin: auto; padding: 40px; background-color: #09090b; color: #e4e4e7; border-radius: 16px; border: 1px solid #27272a;">
                    <h2 style="color: #6366f1; text-align: center; font-size: 26px; margin-bottom: 20px; font-weight: 600;">Vistonaut Security</h2>
                    <p style="font-size: 16px; color: #a1a1aa; text-align: center; line-height: 1.5;">Your secure verification code is below. Enter this code into the Vistonaut interface to proceed.</p>
                    <div style="background: linear-gradient(145deg, #18181b, #0f0f14); padding: 30px; text-align: center; border-radius: 12px; margin: 40px 0; border: 1px solid #3f3f46; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);">
                        <h1 style="letter-spacing: 12px; font-size: 46px; color: #ffffff; margin: 0; font-weight: 700;">${code}</h1>
                    </div>
                    <p style="font-size: 13px; color: #71717a; text-align: center; margin-top: 30px;">This code securely expires in 10 minutes. If you did not initialize this login loop, please immediately disregard this email.</p>
                </div>
            `;
            
            try {
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                    },
                    body: JSON.stringify({
                        from: 'Vistonaut Security <onboarding@vistonaut.com>', // Verified Domain
                        to: [formattedEmail],
                        subject: 'Your Vistonaut Security Code',
                        html: htmlPayload
                    })
                });

                if (resendResponse.ok) {
                    console.log(`[HTTP RESEND] Live OTP logically dispatched to ${formattedEmail}`);
                } else {
                    const errorMsg = await resendResponse.text();
                    console.error("[RESEND HTTP EXCEPTION]", errorMsg);
                    console.log(`[SIMULATED FALLBACK] OTP for ${formattedEmail} is: ${code}`);
                }
            } catch (fetchError) {
                console.error("[HTTP NETWORK ERROR] Could not reach Resend API.", fetchError);
                console.log(`[SIMULATED FALLBACK] OTP for ${formattedEmail} is: ${code}`);
            }
        } else {
            console.log(`\n\n🚀 === VISTONAUT OTP SECURE DELIVERY === 🚀`);
            console.log(`📧 To: ${formattedEmail}`);
            console.log(`🔑 CODE: [ ${code} ]`);
            console.log(`=========================================\n\n`);
        }

        res.json({ message: 'Security code dispatched via framework.' });
    } catch (error) {
        console.error('OTP Send error:', error);
        res.status(500).json({ message: 'Internal server error while dispatching code.' });
    }
});

// POST /api/auth/otp/verify
router.post('/otp/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        const formattedEmail = email.toLowerCase();
        const entry = otpStore.get(formattedEmail);

        if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
            return res.status(401).json({ message: 'Invalid or expired security code.' });
        }

        let user = await User.findOne({ email: formattedEmail });
        if (!user) {
            // If they are logging in via OTP but don't exist, create an account instantly for premium experience!
            user = new User({
                fullName: email.split('@')[0], // Extract name
                email: formattedEmail,
                password: await bcrypt.hash(Math.random().toString(36), 10), // Random placeholder password
                onboardingCompleted: false,
                currentStage: 'profile_building'
            });
            await user.save();
        }

        otpStore.delete(formattedEmail);

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Authentication successful',
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email, onboardingCompleted: user.onboardingCompleted, currentStage: user.currentStage }
        });
    } catch (error) {
        console.error('OTP Verify error:', error);
        res.status(500).json({ message: 'Internal server error during verification.' });
    }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ message: 'Missing Google credential payloads.' });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const formattedEmail = payload.email.toLowerCase();

        let user = await User.findOne({ email: formattedEmail });
        if (!user) {
            user = new User({
                fullName: payload.name || formattedEmail.split('@')[0],
                email: formattedEmail,
                password: await bcrypt.hash(Math.random().toString(36), 10),
                onboardingCompleted: false,
                currentStage: 'profile_building'
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Google Authentication successful',
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email, onboardingCompleted: user.onboardingCompleted, currentStage: user.currentStage }
        });
    } catch (error) {
        console.error('Google Auth Verify error:', error);
        res.status(401).json({ message: 'Invalid or expired Google Authentication token.' });
    }
});

// PUT /api/auth/update - Update Account Details
router.put('/update', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { fullName, password } = req.body;
        
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update.' });
        }
        
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        
        res.json({
            message: 'Account updated successfully.',
            user: {
                id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                onboardingCompleted: updatedUser.onboardingCompleted,
                currentStage: updatedUser.currentStage
            }
        });
    } catch (error) {
        console.error('Account Update error:', error);
        res.status(500).json({ message: 'Internal server error while updating account.' });
    }
});

// DELETE /api/auth/delete - Cascading Account Purge
router.delete('/delete', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Execute Cascading Database Deletion
        await Promise.all([
            User.findByIdAndDelete(userId),
            StudentProfile.deleteMany({ userId }),
            CounsellorProgress.deleteMany({ userId }),
            Todo.deleteMany({ userId }),
            UserUniversity.deleteMany({ userId })
        ]);
        
        res.json({ message: 'Account and all associated records permanently purged.' });
    } catch (error) {
        console.error('Data Deletion cascade error:', error);
        res.status(500).json({ message: 'Internal server error during deletion cascade.' });
    }
});

module.exports = router;
