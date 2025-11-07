const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/studentProfile.model');

// POST /api/profiles - Creates and saves a new student profile
router.post('/', async (req, res) => {
    try {
        const formData = req.body;

        // --- Server-Side Validation ---
        if (!formData['country[]'] || formData['country[]'].length === 0) {
            return res.status(400).json({ message: "Validation failed: Preferred Countries are required." });
        }
        if (!formData['languages[]'] || formData['languages[]'].length === 0) {
            return res.status(400).json({ message: "Validation failed: Languages Known are required." });
        }
        
        const profileData = {
            degrees: [],
            testScores: [],
            personalInfo: {
                dob: formData.dob,
                gender: formData.gender,
                nationality: formData.nationality,
                disability: formData.disability,
            },
            financialInfo: {
                income: formData.income,
                funding: formData.funding,
            },
            preferences: {
                opportunity: formData.opportunity,
                countries: formData['country[]'], // Map 'country[]' to 'countries'
                mode: formData.mode,
                deadline: formData.deadline,
            },
            extraDetails: {
                languages: formData['languages[]'], // Map 'languages[]' to 'languages'
                extracurricular: formData.extracurricular,
                research: formData.research,
                work: formData.work,
            }
        };

        // --- Handle Degrees ---
        if (formData['degree-level[]']) {
            const degreeLevels = formData['degree-level[]'];
            for (let i = 0; i < degreeLevels.length; i++) {
                profileData.degrees.push({
                    level: degreeLevels[i],
                    field: formData['field[]'][i],
                    status: formData['degree-status[]'][i],
                    gpa: formData['gpa[]'][i],
                });
            }
        }

        // --- Handle Test Scores ---
        if (formData['test-name[]']) {
            const testNames = formData['test-name[]'];
            for (let i = 0; i < testNames.length; i++) {
                profileData.testScores.push({ 
                    name: testNames[i], 
                    score: formData['test-score[]'][i] 
                });
            }
        }

        const newProfile = new StudentProfile(profileData);
        const savedProfile = await newProfile.save();

        res.status(201).json({ 
            message: "Profile saved successfully!", 
            profile: savedProfile 
        });

    } catch (error) {
        console.error("Error saving profile:", error);
        // Provide a more specific error message back to the frontend
        res.status(400).json({ message: error.message || "An unknown error occurred while saving." });
    }
});

module.exports = router;

