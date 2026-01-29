const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/studentProfile.model');
const User = require('../models/user.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/profiles - Get user's profile
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const profile = await StudentProfile.findOne({ userId });
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found. Please complete onboarding.' });
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile.' });
    }
});

// POST /api/profiles - Creates and saves a new student profile (onboarding)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const formData = req.body;

        // Check if profile already exists
        let profile = await StudentProfile.findOne({ userId });
        
        const profileData = {
            userId,
            // Academic Background
            currentEducationLevel: formData.currentEducationLevel,
            degree: formData.degree,
            major: formData.major,
            graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
            gpa: formData.gpa,
            // Study Goals
            intendedDegree: formData.intendedDegree,
            fieldOfStudy: formData.fieldOfStudy,
            targetIntakeYear: formData.targetIntakeYear ? parseInt(formData.targetIntakeYear) : null,
            preferredCountries: Array.isArray(formData.preferredCountries) ? formData.preferredCountries : 
                               (formData.preferredCountries ? [formData.preferredCountries] : []),
            // Budget
            budgetRange: formData.budgetRange,
            fundingPlan: formData.fundingPlan,
            // Exams & Readiness
            ieltsStatus: formData.ieltsStatus || 'Not started',
            ieltsScore: formData.ieltsScore ? parseFloat(formData.ieltsScore) : null,
            toeflStatus: formData.toeflStatus || 'Not started',
            toeflScore: formData.toeflScore ? parseFloat(formData.toeflScore) : null,
            greStatus: formData.greStatus || 'Not started',
            greScore: formData.greScore ? parseFloat(formData.greScore) : null,
            gmatStatus: formData.gmatStatus || 'Not started',
            gmatScore: formData.gmatScore ? parseFloat(formData.gmatScore) : null,
            sopStatus: formData.sopStatus || 'Not started',
            // Legacy fields for backward compatibility
            personalInfo: {
                dob: formData.dob ? new Date(formData.dob) : null,
                gender: formData.gender,
                nationality: formData.nationality,
                disability: formData.disability,
            },
            extraDetails: {
                languages: Array.isArray(formData.languages) ? formData.languages : 
                          (formData.languages ? [formData.languages] : []),
                extracurricular: formData.extracurricular,
                research: formData.research,
                work: formData.work,
            }
        };

        if (profile) {
            // Update existing profile
            Object.assign(profile, profileData);
            await profile.save();
        } else {
            // Create new profile
            profile = new StudentProfile(profileData);
            await profile.save();
        }

        // Mark onboarding as completed
        const user = await User.findById(userId);
        if (!user.onboardingCompleted) {
            user.onboardingCompleted = true;
            user.currentStage = 'discovering_universities';
            await user.save();
        }

        res.status(201).json({ 
            message: "Profile saved successfully!", 
            profile: profile,
            onboardingCompleted: true
        });

    } catch (error) {
        console.error("Error saving profile:", error);
        res.status(400).json({ message: error.message || "An unknown error occurred while saving." });
    }
});

// PATCH /api/profiles - Update user's profile
router.patch('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const updates = req.body;

        let profile = await StudentProfile.findOne({ userId });
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found. Please complete onboarding first.' });
        }

        // Convert certain fields
        if (updates.graduationYear) updates.graduationYear = parseInt(updates.graduationYear);
        if (updates.targetIntakeYear) updates.targetIntakeYear = parseInt(updates.targetIntakeYear);
        if (updates.ieltsScore) updates.ieltsScore = parseFloat(updates.ieltsScore);
        if (updates.toeflScore) updates.toeflScore = parseFloat(updates.toeflScore);
        if (updates.greScore) updates.greScore = parseFloat(updates.greScore);
        if (updates.gmatScore) updates.gmatScore = parseFloat(updates.gmatScore);

        Object.assign(profile, updates);
        await profile.save();

        res.json({ 
            message: "Profile updated successfully!", 
            profile: profile
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(400).json({ message: error.message || "An unknown error occurred while updating." });
    }
});

module.exports = router;

