const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const University = require('../models/university.model');
const UserUniversity = require('../models/userUniversity.model');
const StudentProfile = require('../models/studentProfile.model');
const Todo = require('../models/todo.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/universities - Get all universities with optional filters
router.get('/', async (req, res) => {
    try {
        const { country, degreeLevel, fieldOfStudy, category, search } = req.query;
        const query = {};

        if (country) query.country = country;
        if (degreeLevel) query.degreeLevels = { $in: [degreeLevel] };
        if (fieldOfStudy) query.fieldsOfStudy = { $in: [fieldOfStudy] };
        if (category) query.category = category;
        if (search) {
            const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex chars
            query.$or = [
                { name: { $regex: cleanSearch, $options: 'i' } },
                { country: { $regex: cleanSearch, $options: 'i' } },
                { city: { $regex: cleanSearch, $options: 'i' } },
                { fieldsOfStudy: { $elemMatch: { $regex: cleanSearch, $options: 'i' } } }
            ];
        }

        const universities = await University.find(query).sort({ ranking: 1, name: 1 });
        res.json(universities);
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({ message: 'Error fetching universities.' });
    }
});


// GET /api/universities/countries - Get list of unique countries
router.get('/countries', async (req, res) => {
    try {
        const countries = await University.distinct('country');
        res.json(countries.sort());
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ message: 'Error fetching countries.' });
    }
});

// GET /api/universities/recommended - Get AI-recommended universities for user
router.get('/recommended', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const profile = await StudentProfile.findOne({ userId });

        if (!profile) {
            return res.status(400).json({ message: 'Profile not found. Please complete onboarding.' });
        }

        const query = {};

        // Filter by preferred countries
        if (profile.preferredCountries && profile.preferredCountries.length > 0) {
            query.country = { $in: profile.preferredCountries };
        }

        // Filter by intended degree
        if (profile.intendedDegree) {
            query.degreeLevels = { $in: [profile.intendedDegree] };
        }

        // Filter by field of study
        if (profile.fieldOfStudy) {
            query.fieldsOfStudy = { $in: [new RegExp(profile.fieldOfStudy, 'i')] };
        }

        let universities = await University.find(query);

        // Categorize universities based on profile
        const categorized = universities.map(uni => {
            let category = 'Target';
            const gpa = parseFloat(profile.gpa) || 0;
            const acceptanceRate = uni.acceptanceRate || 50;

            // Simple categorization logic
            if (uni.ranking && uni.ranking <= 50 && (gpa < 3.5 || acceptanceRate < 30)) {
                category = 'Dream';
            } else if (acceptanceRate > 60 && (!uni.requirements?.gpa || gpa >= (uni.requirements.gpa - 0.3))) {
                category = 'Safe';
            }

            return {
                ...uni.toObject(),
                category,
                fitScore: calculateFitScore(uni, profile)
            };
        });

        // Sort by fit score
        categorized.sort((a, b) => b.fitScore - a.fitScore);

        res.json(categorized);
    } catch (error) {
        console.error('Error fetching recommended universities:', error);
        res.status(500).json({ message: 'Error fetching recommended universities.' });
    }
});

// Helper function to calculate fit score
function calculateFitScore(university, profile) {
    let score = 50; // Base score

    // Country preference match
    if (profile.preferredCountries?.includes(university.country)) {
        score += 20;
    }

    // GPA match
    if (university.requirements?.gpa && profile.gpa) {
        const profileGpa = parseFloat(profile.gpa);
        if (profileGpa >= university.requirements.gpa) {
            score += 15;
        } else if (profileGpa >= university.requirements.gpa - 0.3) {
            score += 5;
        }
    }

    // Budget match
    if (university.tuitionFee && profile.budgetRange) {
        const budgetMap = {
            '< $10,000': 10000,
            '$10,000 - $30,000': 30000,
            '$30,000 - $50,000': 50000,
            '$50,000 - $100,000': 100000,
            '> $100,000': 200000
        };
        const maxBudget = budgetMap[profile.budgetRange] || 50000;
        if (university.tuitionFee.max <= maxBudget) {
            score += 15;
        }
    }

    // Acceptance rate
    if (university.acceptanceRate) {
        if (university.acceptanceRate > 60) score += 10;
        else if (university.acceptanceRate > 40) score += 5;
    }

    return Math.min(100, score);
}

// POST /api/universities/:id/shortlist
router.post('/:id/shortlist', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const universityId = req.params.id;

        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({ message: 'University not found.' });
        }

        const existing = await UserUniversity.findOne({ userId, universityId });
        if (existing) {
            return res.status(400).json({ message: 'University already shortlisted or locked.' });
        }

        const userUniversity = await UserUniversity.create({
            userId,
            universityId,
            status: 'shortlisted',
            category: university.category || 'Target'
        });

        // Update user stage
        const User = require('../models/user.model');
        const user = await User.findById(userId);
        if (user.currentStage === 'profile_building') {
            user.currentStage = 'discovering_universities';
            await user.save();
        }

        res.json({ message: 'University shortlisted successfully', userUniversity });
    } catch (error) {
        console.error('Error shortlisting university:', error);
        res.status(500).json({ message: 'Error shortlisting university.' });
    }
});

// POST /api/universities/:id/lock
router.post('/:id/lock', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const universityId = req.params.id;

        let userUniversity = await UserUniversity.findOne({ userId, universityId });

        if (!userUniversity) {
            // Create if not exists
            const university = await University.findById(universityId);
            if (!university) {
                return res.status(404).json({ message: 'University not found.' });
            }
            userUniversity = await UserUniversity.create({
                userId,
                universityId,
                status: 'locked',
                category: university.category || 'Target',
                lockedAt: new Date()
            });
        } else {
            userUniversity.status = 'locked';
            userUniversity.lockedAt = new Date();
            await userUniversity.save();
        }

        // Update user stage
        const User = require('../models/user.model');
        const user = await User.findById(userId);
        if (user.currentStage !== 'preparing_applications') {
            user.currentStage = 'preparing_applications';
            await user.save();
        }

        // Generate default tasks if they don't exist
        const university = await University.findById(universityId);

        const tasks = [
            {
                title: `Draft Statement of Purpose (SOP) for ${university.name}`,
                category: 'SOP',
                description: 'Write a compelling SOP tailored to this university\'s program.'
            },
            {
                title: 'Submit Exam Scores (IELTS/TOEFL/GRE)',
                category: 'Exams',
                description: 'Ensure your official scores are sent to the university.'
            },
            {
                title: 'Complete Application Form',
                category: 'Forms',
                description: 'Fill out the online application form on the university website.'
            },
            {
                title: 'Gather Letter of Recommendations',
                category: 'Documents',
                description: 'Request recommendations from your professors or employers.'
            }
        ];

        for (const task of tasks) {
            // Check if similar task exists
            const existingTask = await Todo.findOne({
                userId,
                universityId,
                category: task.category
            });

            if (!existingTask) {
                await Todo.create({
                    userId,
                    universityId,
                    title: task.title,
                    description: task.description,
                    category: task.category,
                    aiGenerated: true
                });
            }
        }

        res.json({ message: 'University locked successfully', userUniversity });
    } catch (error) {
        console.error('Error locking university:', error);
        res.status(500).json({ message: 'Error locking university.' });
    }
});

// POST /api/universities/:id/unlock - unlock a locked university (with warning)
router.post('/:id/unlock', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const universityId = req.params.id;

        const userUniversity = await UserUniversity.findOne({ userId, universityId, status: 'locked' });
        if (!userUniversity) {
            return res.status(404).json({ message: 'Locked university not found.' });
        }

        userUniversity.status = 'shortlisted';
        userUniversity.lockedAt = null;
        await userUniversity.save();

        const User = require('../models/user.model');
        const user = await User.findById(userId);
        const stillLocked = await UserUniversity.countDocuments({ userId, status: 'locked' });
        if (stillLocked === 0 && user.currentStage === 'preparing_applications') {
            user.currentStage = 'finalizing_universities';
            await user.save();
        }

        res.json({ message: 'University unlocked. It remains in your shortlist.' });
    } catch (error) {
        console.error('Error unlocking university:', error);
        res.status(500).json({ message: 'Error unlocking university.' });
    }
});

// DELETE /api/universities/:id/shortlist
router.delete('/:id/shortlist', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const universityId = req.params.id;

        const userUniversity = await UserUniversity.findOne({ userId, universityId, status: 'shortlisted' });
        if (!userUniversity) {
            return res.status(404).json({ message: 'Shortlisted university not found.' });
        }

        await userUniversity.deleteOne();
        res.json({ message: 'University removed from shortlist.' });
    } catch (error) {
        console.error('Error removing from shortlist:', error);
        res.status(500).json({ message: 'Error removing from shortlist.' });
    }
});

// GET /api/universities/my-universities
router.get('/my-universities', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { status } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const userUniversities = await UserUniversity.find(query)
            .populate('universityId')
            .sort({ createdAt: -1 });

        res.json(userUniversities);
    } catch (error) {
        console.error('Error fetching user universities:', error);
        res.status(500).json({ message: 'Error fetching user universities.' });
    }
});

// POST /api/universities - Create a new university
router.post('/', async (req, res) => {
    try {
        const {
            name,
            country,
            city,
            ranking,
            degreeLevels,
            fieldsOfStudy,
            tuitionFee,
            acceptanceRate,
            requirements,
            description,
            website,
            category
        } = req.body;

        // Validate required fields
        if (!name || !country || !city || !degreeLevels || !fieldsOfStudy || !description) {
            return res.status(400).json({
                message: 'Missing required fields: name, country, city, degreeLevels, fieldsOfStudy, description'
            });
        }

        // Check if university already exists
        const existing = await University.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            country: country
        });

        if (existing) {
            return res.status(400).json({ message: 'University already exists in database.' });
        }

        const university = await University.create({
            name,
            country,
            city,
            ranking,
            degreeLevels: Array.isArray(degreeLevels) ? degreeLevels : [degreeLevels],
            fieldsOfStudy: Array.isArray(fieldsOfStudy) ? fieldsOfStudy : [fieldsOfStudy],
            tuitionFee,
            acceptanceRate,
            requirements,
            description,
            website,
            category: category || 'Target'
        });

        res.status(201).json({ message: 'University created successfully', university });
    } catch (error) {
        console.error('Error creating university:', error);
        res.status(500).json({ message: 'Error creating university.', error: error.message });
    }
});


// POST /api/universities/:id/chat - Chat with AI about specific university
router.post('/:id/chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const universityId = req.params.id;

        if (!message) return res.status(400).json({ message: 'Message is required.' });

        const university = await University.findById(universityId);
        if (!university) return res.status(404).json({ message: 'University not found.' });

        const systemPrompt = `
        You are an expert University Representative for **${university.name}**.
        
        **UNIVERSITY DETAILS:**
        - Location: ${university.city}, ${university.country}
        - Ranking: #${university.ranking || 'N/A'}
        - Tuition: $${university.tuitionFee?.max?.toLocaleString() || 'N/A'} / year
        - Acceptance Rate: ${university.acceptanceRate || 'N/A'}%
        - GPA Requirement: ${university.requirements?.gpa || 'N/A'}
        - Exams: ${(university.requirements?.exams || []).join(', ') || 'None specified'}
        - Degrees: ${(university.degreeLevels || []).join(', ')}
        - Fields: ${(university.fieldsOfStudy || []).join(', ')}
        - Description: ${university.description}

        **YOUR ROLE:**
        - Answer the student's question specifically using the data above.
        - Be friendly, professional, and encouraging.
        - If the answer is not in the data, verify if it's a general admissions question you can answer (e.g. "What is an SOP?"). If it's specific data you lack (e.g. "Does this uni have a swimming pool?"), admit you don't have that specific info but suggest checking the official website.
        - Keep answers concise (max 2-3 sentences unless asked for details).

        **STUDENT MESSAGE:**
        "${message}"
        `;

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: systemPrompt,
        });

        const responseText = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm sorry, I couldn't process that.";

        res.json({ reply: responseText });

    } catch (error) {
        console.error('Error in university chat:', error);
        res.status(500).json({ message: 'AI service unavailable.' });
    }
});

// PATCH /api/universities/:id/documents - Update documents (SOP, Resume, LOR)
router.patch('/:id/documents', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const universityId = req.params.id;
        const { type, content } = req.body; // type: 'SOP', 'Resume', 'LOR'

        const userUniversity = await UserUniversity.findOne({ userId, universityId });
        if (!userUniversity) {
            return res.status(404).json({ message: 'University not found in your list.' });
        }

        if (!userUniversity.documents) {
            userUniversity.documents = {};
        }

        // We specifically allow any keys, but usually SOP/Resume/LOR
        userUniversity.documents[type] = content;

        // Mark as modified because it's a mixed type/object
        userUniversity.markModified('documents');

        await userUniversity.save();

        res.json({ message: 'Document saved to database.', documents: userUniversity.documents });
    } catch (error) {
        console.error('Error saving document:', error);
        res.status(500).json({ message: 'Error saving document.' });
    }
});

// GET /api/universities/:id - Get a single university by ID
// (Placed at the end to avoid conflict with specific routes like /recommended or /my-universities)
router.get('/:id', async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            return res.status(404).json({ message: 'University not found.' });
        }
        res.json(university);
    } catch (error) {
        console.error('Error fetching university:', error);
        res.status(500).json({ message: 'Error fetching university.' });
    }
});

module.exports = router;

